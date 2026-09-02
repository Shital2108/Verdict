import { VERDICT_WEBMCP_TOOLS } from './tools';

export interface WebMCPStatus {
  supported: boolean;
  registeredCount: number;
  registeredToolNames: string[];
  lastRegisteredAt: string | null;
  errorMessage?: string;
}

declare global {
  interface Document {
    modelContext?: {
      registerTool?: (
        tool: {
          name: string;
          description: string;
          inputSchema: Record<string, unknown>;
          execute: (args: any) => Promise<any> | any;
        },
        options?: { signal?: AbortSignal }
      ) => void;
      [key: string]: any;
    };
  }
}

let webMCPStatus: WebMCPStatus = {
  supported: false,
  registeredCount: 0,
  registeredToolNames: [],
  lastRegisteredAt: null,
};

const statusListeners: Set<(status: WebMCPStatus) => void> = new Set();

export function getWebMCPStatus(): WebMCPStatus {
  return webMCPStatus;
}

export function subscribeWebMCPStatus(listener: (status: WebMCPStatus) => void): () => void {
  statusListeners.add(listener);
  listener(webMCPStatus);
  return () => statusListeners.delete(listener);
}

function notifyStatus(newStatus: Partial<WebMCPStatus>) {
  webMCPStatus = { ...webMCPStatus, ...newStatus };
  statusListeners.forEach((l) => l(webMCPStatus));
}

/**
 * Initializes real WebMCP tool registration on document.modelContext.
 * Adheres strictly to the official WebMCP registration specification:
 * `document.modelContext.registerTool({ name, description, inputSchema, execute }, { signal })`
 */
export function initializeWebMCP(signal?: AbortSignal): WebMCPStatus {
  if (typeof document === 'undefined') {
    notifyStatus({ supported: false, errorMessage: 'Running in non-DOM environment.' });
    return webMCPStatus;
  }

  const hasModelContext =
    'modelContext' in document &&
    typeof document.modelContext === 'object' &&
    document.modelContext !== null;

  const hasRegisterTool =
    hasModelContext && typeof document.modelContext?.registerTool === 'function';

  if (!hasRegisterTool) {
    // WebMCP is not natively present in this browser environment
    notifyStatus({
      supported: false,
      registeredCount: 0,
      registeredToolNames: VERDICT_WEBMCP_TOOLS.map((t) => t.name),
      errorMessage: 'WebMCP unavailable in this browser (document.modelContext.registerTool not present).',
    });
    return webMCPStatus;
  }

  // Real native WebMCP registration
  try {
    const registered: string[] = [];
    for (const tool of VERDICT_WEBMCP_TOOLS) {
      document.modelContext!.registerTool!(
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.parameters,
          execute: tool.execute,
        },
        signal ? { signal } : undefined
      );
      registered.push(tool.name);
    }

    notifyStatus({
      supported: true,
      registeredCount: registered.length,
      registeredToolNames: registered,
      lastRegisteredAt: new Date().toISOString(),
      errorMessage: undefined,
    });
  } catch (err: any) {
    notifyStatus({
      supported: false,
      errorMessage: `Failed during WebMCP tool registration: ${err.message}`,
    });
  }

  return webMCPStatus;
}
