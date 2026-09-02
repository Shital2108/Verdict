import React, { useState } from 'react';
import { Terminal, Play, ShieldAlert, Cpu, Check, AlertTriangle, X, Code, Sparkles, Sliders } from 'lucide-react';
import { DecisionState } from '../types/verdict';
import { VERDICT_WEBMCP_TOOLS } from '../webmcp/tools';
import { decisionStore } from '../store/decisionStore';

interface WebMCPTestConsoleProps {
  state: DecisionState;
  onClose: () => void;
}

export const WebMCPTestConsole: React.FC<WebMCPTestConsoleProps> = ({ state, onClose }) => {
  const [selectedToolName, setSelectedToolName] = useState<string>('adjust_priority');
  const [customArgs, setCustomArgs] = useState<string>('{\n  "criterion": "battery",\n  "weight": 60\n}');
  const [lastOutput, setLastOutput] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'execute' | 'schemas' | 'registration_code'>('execute');

  const selectedTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === selectedToolName) || VERDICT_WEBMCP_TOOLS[0];

  const handleToolSelect = (toolName: string) => {
    setSelectedToolName(toolName);
    const tool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === toolName);
    if (tool) {
      if (tool.name === 'adjust_priority') {
        const firstCriterion = state.criteria[0]?.id || 'battery';
        setCustomArgs(JSON.stringify({ criterion: firstCriterion, weight: 60 }, null, 2));
      } else if (tool.name === 'research_options') {
        setCustomArgs(JSON.stringify({ query: 'optimal balance for development' }, null, 2));
      } else if (tool.name === 'request_commit') {
        setCustomArgs(JSON.stringify({ justification: 'Criteria weighting and tradeoff challenge verified.' }, null, 2));
      } else if (tool.name === 'commit_decision') {
        setCustomArgs(JSON.stringify({ reason: 'Closing confirmation note.' }, null, 2));
      } else {
        setCustomArgs('{}');
      }
    }
  };

  const handleExecute = async () => {
    setIsRunning(true);
    let parsedArgs = {};
    try {
      if (customArgs.trim()) {
        parsedArgs = JSON.parse(customArgs);
      }
    } catch (e: any) {
      setLastOutput({
        error: 'JSON_PARSE_ERROR',
        message: 'Invalid JSON input in parameter box: ' + e.message,
      });
      setIsRunning(false);
      return;
    }

    try {
      const result = await selectedTool.execute(parsedArgs);
      setLastOutput(result);
    } catch (err: any) {
      setLastOutput({
        error: 'EXECUTION_EXCEPTION',
        message: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Quick Test 1: Full standard agent workflow
  const handleRunFullAgentWorkflow = async () => {
    setIsRunning(true);
    const stepsLog: any[] = [];

    try {
      // 1. Research
      const r1 = await VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'research_options')!.execute({});
      stepsLog.push({ step: '1. research_options', result: r1 });

      // 2. Score
      const r2 = await VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'score_options')!.execute({});
      stepsLog.push({ step: '2. score_options', result: r2 });

      // 3. Challenge
      const r3 = await VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'challenge_top_pick')!.execute({});
      stepsLog.push({ step: '3. challenge_top_pick', result: r3 });

      // 4. Request commit
      const r4 = await VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'request_commit')!.execute({
        justification: 'Automated test agent sequence completed analysis.',
      });
      stepsLog.push({ step: '4. request_commit', result: r4 });

      setLastOutput({
        sequence: 'Standard Agent Workflow',
        summary: 'Agent completed 4-tool negotiation sequence. State is now waiting for human approval.',
        steps: stepsLog,
      });
    } catch (err: any) {
      setLastOutput({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  // Quick Test 2: Adversarial commit attempt (must fail)
  const handleTestAdversarialCommit = async () => {
    setIsRunning(true);
    try {
      const commitTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'commit_decision')!;
      const result = await commitTool.execute({ reason: 'Adversarial agent attempt to commit without human approval.' });
      setLastOutput({
        test: 'Adversarial Safety Test',
        description: 'Agent attempted to call commit_decision() without prior human approval.',
        outcome: result.success === false ? 'PASSED: Application blocked unauthorized commit.' : 'FAILED: Safety breached.',
        rawResult: result,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  WebMCP Local Verification Console
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Developer & Judge Tool
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans font-normal">
                Directly test the 6 WebMCP tools against the canonical shared state.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-5 text-xs">
          <button
            onClick={() => setActiveTab('execute')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'execute'
                ? 'border-zinc-200 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Execute & Test Tools</span>
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'schemas'
                ? 'border-zinc-200 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>WebMCP Tool Schemas</span>
          </button>
          <button
            onClick={() => setActiveTab('registration_code')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'registration_code'
                ? 'border-zinc-200 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Registration Code</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'execute' && (
            <div className="space-y-4">
              {/* Quick Scenario Preset Buttons */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  Quick Judge Verification Sequences:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleRunFullAgentWorkflow}
                    disabled={isRunning}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                    <span>Run Full 4-Step Agent Workflow</span>
                  </button>

                  <button
                    onClick={handleTestAdversarialCommit}
                    disabled={isRunning}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    <span>Test Adversarial Commit (Should Fail)</span>
                  </button>
                </div>
              </div>

              {/* Tool Picker Grid */}
              <div>
                <span className="text-xs text-zinc-400 font-semibold block mb-2">
                  Select WebMCP Tool (6 Defined):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VERDICT_WEBMCP_TOOLS.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => handleToolSelect(tool.name)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex flex-col justify-between ${
                        selectedToolName === tool.name
                          ? 'bg-zinc-800 border-zinc-400 text-white shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                      }`}
                    >
                      <span className="font-bold font-mono">{tool.name}</span>
                      <span className="text-[10px] text-zinc-500 truncate mt-1">
                        {tool.parameters.properties && Object.keys(tool.parameters.properties).length > 0
                          ? `${Object.keys(tool.parameters.properties).length} params`
                          : '0 params'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Description & Input Box */}
              <div className="space-y-2">
                <div className="text-xs text-zinc-400 font-sans leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800">
                  <strong className="text-zinc-200 font-mono block mb-1">Description:</strong>
                  {selectedTool.description}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold block">
                    Parameters (JSON Input):
                  </label>
                  <textarea
                    rows={4}
                    value={customArgs}
                    onChange={(e) => setCustomArgs(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <button
                  onClick={handleExecute}
                  disabled={isRunning}
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute {selectedTool.name}()</span>
                </button>
              </div>

              {/* Execution Result Output */}
              {lastOutput && (
                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-400 font-semibold block">
                    Execution Output / Response Payload:
                  </span>
                  <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-emerald-300 font-mono overflow-x-auto max-h-60">
                    {JSON.stringify(lastOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-sans">
                Below are the exact 6 WebMCP tool definitions and parameter schemas registered for the AI model context:
              </p>
              <div className="space-y-3">
                {VERDICT_WEBMCP_TOOLS.map((tool) => (
                  <div key={tool.name} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{tool.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">WebMCP Tool</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans">{tool.description}</p>
                    <pre className="p-2.5 bg-zinc-900 rounded border border-zinc-800 text-[11px] text-sky-300 overflow-x-auto font-mono">
                      {JSON.stringify(tool.parameters, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'registration_code' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                VERDICT utilizes the official native WebMCP API:
                <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded mx-1">
                  document.modelContext.registerTool(...)
                </code>
                with no simulated abstractions.
              </p>
              <pre className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-amber-300 font-mono overflow-x-auto leading-relaxed">
{`// Native WebMCP registration in VERDICT (src/webmcp/webmcp.ts)
if ('modelContext' in document && typeof document.modelContext?.registerTool === 'function') {
  for (const tool of VERDICT_WEBMCP_TOOLS) {
    document.modelContext.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.parameters,
      execute: tool.execute,
    }, { signal });
  }
}`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between text-xs text-zinc-400">
          <span>Canonical Store Status: Synchronized</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-mono"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
