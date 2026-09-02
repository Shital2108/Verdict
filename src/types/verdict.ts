export interface Criterion {
  id: string;
  name: string;
  description?: string;
  min: number;
  max: number;
  unit?: string;
}

export interface Option {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  scores: Record<string, number>; // criterionId -> score (0-100)
}

export interface RankedOption extends Option {
  weightedScore: number;
  rank: number;
  scoreBreakdown: Record<string, { rawScore: number; weightedContribution: number }>;
}

export interface ChallengeResult {
  winnerId: string;
  winnerName: string;
  winnerScore: number;
  runnerUpId: string;
  runnerUpName: string;
  runnerUpScore: number;
  scoreGap: number;
  strongestCounterArgument: string;
  vulnerabilityCriteria: {
    criterionId: string;
    criterionName: string;
    winnerScore: number;
    runnerUpScore: number;
    advantage: number;
  }[];
  tippingPointExplanation: string;
  generatedAt: string;
}

export interface DecisionRecord {
  decisionId: string;
  title: string;
  timestamp: string;
  selectedOption: {
    id: string;
    name: string;
    finalScore: number;
  };
  finalWeights: Record<string, number>;
  criteria: Criterion[];
  allRankedOptions: { id: string; name: string; score: number; rank: number }[];
  challengeSummary: string;
  humanApprovedAt: string;
  committedAt: string;
}

export type ActionOrigin = 'human' | 'agent' | 'system';

export interface ActivityItem {
  id: string;
  timestamp: string;
  origin: ActionOrigin;
  action: string;
  summary: string;
  details?: Record<string, unknown>;
  status: 'success' | 'warning' | 'error' | 'pending';
}

export type CommitRequestStatus = 'none' | 'pending_human_approval';
export type CommittedStatus = 'uncommitted' | 'committed';
export type ChallengeStatus = 'none' | 'analyzing' | 'challenged';

export interface DecisionState {
  scenarioId: string;
  title: string;
  contextDescription: string;
  criteria: Criterion[];
  weights: Record<string, number>; // Must always sum to 100
  options: Option[];
  weightedScores: Record<string, number>;
  ranking: RankedOption[];
  currentWinner: RankedOption | null;
  previousWinner: RankedOption | null;
  challenge: ChallengeResult | null;
  challengeStatus: ChallengeStatus;
  commitRequestStatus: CommitRequestStatus;
  humanApproved: boolean;
  humanApprovedAt: string | null;
  hasRunAgentPipeline: boolean;
  committedStatus: CommittedStatus;
  committedRecord: DecisionRecord | null;
  activityLog: ActivityItem[];
  lastModifiedBy: ActionOrigin;
  lastModifiedMessage: string;
}

export interface Scenario {
  id: string;
  title: string;
  badge: string;
  contextDescription: string;
  criteria: Criterion[];
  defaultWeights: Record<string, number>;
  options: Option[];
}

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (args: any) => Promise<any> | any;
}
