import { SCENARIOS } from '../data/scenarios';
import {
  calculateScoresAndRanking,
  generateAdversarialChallenge,
  normalizeWeights,
  validateCommitSecurity,
} from '../engine/decisionEngine';
import {
  ActionOrigin,
  ActivityItem,
  DecisionRecord,
  DecisionState,
} from '../types/verdict';

function createInitialState(scenarioId = 'laptop'): DecisionState {
  const scenario = SCENARIOS[scenarioId] || SCENARIOS.laptop;
  const initialWeights = { ...scenario.defaultWeights };
  const { weightedScores, ranking, winner } = calculateScoresAndRanking(
    scenario.options,
    scenario.criteria,
    initialWeights
  );

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    contextDescription: scenario.contextDescription,
    criteria: [...scenario.criteria],
    weights: initialWeights,
    options: [...scenario.options],
    weightedScores,
    ranking,
    currentWinner: winner,
    previousWinner: null,
    challenge: null,
    challengeStatus: 'none',
    commitRequestStatus: 'none',
    humanApproved: false,
    humanApprovedAt: null,
    hasRunAgentPipeline: false,
    committedStatus: 'uncommitted',
    committedRecord: null,
    activityLog: [
      {
        id: `act-${Date.now()}-init`,
        timestamp: new Date().toLocaleTimeString(),
        origin: 'system',
        action: 'initialize_session',
        summary: `Loaded "${scenario.title}" with ${scenario.options.length} options.`,
        status: 'success',
      },
    ],
    lastModifiedBy: 'system',
    lastModifiedMessage: 'System initialized canonical decision board.',
  };
}

class CanonicalDecisionStore {
  private state: DecisionState;
  private listeners: Set<() => void> = new Set();
  private hasResearched = false;
  private hasScored = false;

  constructor() {
    this.state = createInitialState('laptop');
  }

  public getState(): DecisionState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>) {
    const newItem: ActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    // Keep most recent 30 items
    this.state.activityLog = [newItem, ...this.state.activityLog.slice(0, 29)];
  }

  // --- ACTIONS ---

  public setScenario(scenarioId: string, origin: ActionOrigin = 'human') {
    if (!SCENARIOS[scenarioId]) {
      throw new Error(`Scenario "${scenarioId}" not found.`);
    }

    const prevTitle = this.state.title;
    this.state = createInitialState(scenarioId);
    this.hasResearched = false;
    this.hasScored = false;
    this.state.lastModifiedBy = origin;
    this.state.lastModifiedMessage = `Switched scenario to ${SCENARIOS[scenarioId].title}`;

    this.addActivity({
      origin,
      action: 'switch_scenario',
      summary: `Switched from "${prevTitle}" to "${SCENARIOS[scenarioId].title}"`,
      status: 'success',
    });

    this.notify();
    return this.state;
  }

  public adjustPriority(criterionId: string, newWeight: number, origin: ActionOrigin = 'human') {
    const targetCriterion = this.state.criteria.find(
      (c) => c.id.toLowerCase() === criterionId.toLowerCase()
    );

    if (!targetCriterion) {
      const validNames = this.state.criteria.map((c) => c.name).join(', ');
      const errorMsg = `Criterion "${criterionId}" is invalid. Valid criteria: ${validNames}`;
      this.addActivity({
        origin,
        action: 'adjust_priority',
        summary: `Failed priority adjustment: ${errorMsg}`,
        status: 'error',
      });
      this.notify();
      throw new Error(errorMsg);
    }

    if (typeof newWeight !== 'number' || isNaN(newWeight) || newWeight < 0 || newWeight > 100) {
      const errorMsg = `Weight for "${targetCriterion.name}" must be between 0% and 100%. Received: ${newWeight}`;
      this.addActivity({
        origin,
        action: 'adjust_priority',
        summary: `Failed priority adjustment: ${errorMsg}`,
        status: 'error',
      });
      this.notify();
      throw new Error(errorMsg);
    }

    const prevWeight = this.state.weights[targetCriterion.id];
    const allIds = this.state.criteria.map((c) => c.id);
    const newWeights = normalizeWeights(this.state.weights, targetCriterion.id, newWeight, allIds);

    const prevWinner = this.state.currentWinner;
    const { weightedScores, ranking, winner } = calculateScoresAndRanking(
      this.state.options,
      this.state.criteria,
      newWeights
    );

    this.state.weights = newWeights;
    this.state.weightedScores = weightedScores;
    this.state.ranking = ranking;
    this.state.previousWinner = prevWinner;
    this.state.currentWinner = winner;
    this.state.lastModifiedBy = origin;
    this.state.lastModifiedMessage = `${origin === 'agent' ? 'Agent' : 'Human'} updated ${targetCriterion.name}: ${prevWeight}% → ${newWeights[targetCriterion.id]}%`;

    // Invalidate prior approval if priorities shifted
    if (this.state.humanApproved) {
      this.state.humanApproved = false;
      this.state.humanApprovedAt = null;
      this.state.commitRequestStatus = 'none';
    }

    // If challenge existed, update it dynamically
    if (this.state.challenge) {
      try {
        this.state.challenge = generateAdversarialChallenge(ranking, this.state.criteria, newWeights);
      } catch {
        this.state.challenge = null;
      }
    }

    this.addActivity({
      origin,
      action: 'adjust_priority',
      summary: `${origin === 'agent' ? 'Agent' : 'Human'} changed ${targetCriterion.name}: ${prevWeight}% → ${newWeights[targetCriterion.id]}%`,
      details: {
        criterion: targetCriterion.name,
        previousWeight: prevWeight,
        newWeight: newWeights[targetCriterion.id],
        weights: newWeights,
        newWinner: winner?.name,
      },
      status: 'success',
    });

    this.notify();
    return {
      weights: newWeights,
      newWinner: winner,
      ranking,
    };
  }

  public researchOptions(query?: string, origin: ActionOrigin = 'agent') {
    const scenario = SCENARIOS[this.state.scenarioId] || SCENARIOS.laptop;
    let options = [...scenario.options];

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      const matches: typeof options = [];
      const nonMatches: typeof options = [];

      for (const opt of options) {
        const nameMatch = opt.name?.toLowerCase().includes(q) ?? false;
        const subtitleMatch = opt.subtitle?.toLowerCase().includes(q) ?? false;
        const descMatch = opt.description?.toLowerCase().includes(q) ?? false;
        if (nameMatch || subtitleMatch || descMatch) {
          matches.push(opt);
        } else {
          nonMatches.push(opt);
        }
      }
      options = [...matches, ...nonMatches];
    }

    const { weightedScores, ranking, winner } = calculateScoresAndRanking(
      options,
      this.state.criteria,
      this.state.weights
    );

    this.hasResearched = true;
    this.state.hasRunAgentPipeline = this.hasResearched && this.hasScored;
    this.state.options = options;
    this.state.weightedScores = weightedScores;
    this.state.ranking = ranking;
    this.state.currentWinner = winner;
    this.state.lastModifiedBy = origin;
    this.state.lastModifiedMessage = `${origin === 'agent' ? 'Agent' : 'System'} retrieved ${options.length} options for "${query || this.state.title}"`;

    this.addActivity({
      origin,
      action: 'research_options',
      summary: `${options.length} candidate options retrieved for evaluation.`,
      details: { query, optionsCount: options.length, candidates: options.map((o) => o.name) },
      status: 'success',
    });

    this.notify();
    return {
      options,
      count: options.length,
      ranking,
      winner,
    };
  }

  public scoreOptions(origin: ActionOrigin = 'agent') {
    if (!this.state.options || this.state.options.length === 0) {
      const errorMsg = 'Unable to score options because no candidates exist in the decision state.';
      this.addActivity({
        origin,
        action: 'score_options',
        summary: errorMsg,
        status: 'error',
      });
      this.notify();
      throw new Error(errorMsg);
    }

    const { weightedScores, ranking, winner } = calculateScoresAndRanking(
      this.state.options,
      this.state.criteria,
      this.state.weights
    );

    this.hasScored = true;
    this.state.hasRunAgentPipeline = this.hasResearched && this.hasScored;
    this.state.weightedScores = weightedScores;
    this.state.ranking = ranking;
    this.state.currentWinner = winner;
    this.state.lastModifiedBy = origin;
    this.state.lastModifiedMessage = `Calculated ranking: ${winner?.name} ranked #1 (${winner?.weightedScore} pts)`;

    this.addActivity({
      origin,
      action: 'score_options',
      summary: `${winner?.name || 'Top option'} ranked #1 with weighted score ${winner?.weightedScore}`,
      details: {
        ranking: ranking.map((r) => ({ rank: r.rank, name: r.name, score: r.weightedScore })),
      },
      status: 'success',
    });

    this.notify();
    return {
      options: this.state.options,
      criteria: this.state.criteria,
      weights: this.state.weights,
      weightedScores,
      ranking,
      winner,
    };
  }

  public challengeTopPick(origin: ActionOrigin = 'agent') {
    if (!this.state.ranking || this.state.ranking.length < 2) {
      const errorMsg = 'At least two candidate options are required to compute a challenge comparison.';
      this.addActivity({
        origin,
        action: 'challenge_top_pick',
        summary: errorMsg,
        status: 'error',
      });
      this.notify();
      throw new Error(errorMsg);
    }

    this.state.challengeStatus = 'analyzing';
    this.notify();

    const challenge = generateAdversarialChallenge(
      this.state.ranking,
      this.state.criteria,
      this.state.weights
    );

    this.state.challenge = challenge;
    this.state.challengeStatus = 'challenged';
    this.state.lastModifiedBy = origin;
    this.state.lastModifiedMessage = `Agent challenged recommendation: compared ${challenge.winnerName} vs ${challenge.runnerUpName}`;

    this.addActivity({
      origin,
      action: 'challenge_top_pick',
      summary: `Challenged #1 ${challenge.winnerName} against runner-up ${challenge.runnerUpName} (Gap: ${challenge.scoreGap} pts)`,
      details: {
        winner: challenge.winnerName,
        runnerUp: challenge.runnerUpName,
        scoreGap: challenge.scoreGap,
        counterArgument: challenge.strongestCounterArgument,
        tippingPoint: challenge.tippingPointExplanation,
      },
      status: 'success',
    });

    this.notify();
    return challenge;
  }

  public requestCommit(justification?: string, origin: ActionOrigin = 'agent') {
    if (!this.state.currentWinner) {
      const errorMsg = 'Cannot request commitment: No current recommendation has been scored.';
      this.addActivity({
        origin,
        action: 'request_commit',
        summary: errorMsg,
        status: 'error',
      });
      this.notify();
      throw new Error(errorMsg);
    }

    if (!this.state.hasRunAgentPipeline) {
      const errorMsg = 'Cannot request commitment: Both research_options and score_options must be called before requesting commitment.';
      this.addActivity({
        origin,
        action: 'request_commit',
        summary: errorMsg,
        status: 'error',
      });
      this.notify();
      throw new Error(errorMsg);
    }

    if (!this.state.challenge) {
      const errorMsg = 'Cannot request commitment: challenge_top_pick must be called before request_commit.';
      this.addActivity({
        origin,
        action: 'request_commit',
        summary: errorMsg,
        status: 'error',
      });
      this.notify();
      throw new Error(errorMsg);
    }

    this.state.commitRequestStatus = 'pending_human_approval';
    this.state.lastModifiedBy = origin;
    this.state.lastModifiedMessage = 'Agent requested commit: Awaiting explicit human approval.';

    this.addActivity({
      origin,
      action: 'request_commit',
      summary: `Agent prepared decision for commitment. Human approval is now REQUIRED.`,
      details: {
        winner: this.state.currentWinner.name,
        score: this.state.currentWinner.weightedScore,
        justification: justification || 'Criteria and weighted scores analyzed.',
      },
      status: 'warning',
    });

    this.notify();
    return {
      status: 'pending_human_approval',
      message: 'Decision prepared. Commit remains LOCKED until the human user grants explicit approval.',
      recommendedOption: this.state.currentWinner,
    };
  }

  public approveByHuman() {
    if (!this.state.currentWinner) {
      throw new Error('Cannot approve decision: No option is currently selected.');
    }

    this.state.humanApproved = true;
    this.state.humanApprovedAt = new Date().toISOString();
    this.state.lastModifiedBy = 'human';
    this.state.lastModifiedMessage = 'Human granted explicit approval for commitment.';

    this.addActivity({
      origin: 'human',
      action: 'human_approval',
      summary: `Human reviewed challenge and approved commitment of ${this.state.currentWinner.name}.`,
      status: 'success',
    });

    this.notify();
    return {
      humanApproved: true,
      humanApprovedAt: this.state.humanApprovedAt,
    };
  }

  public commitDecision(reason?: string, origin: ActionOrigin = 'agent') {
    const securityCheck = validateCommitSecurity({
      committedStatus: this.state.committedStatus,
      winner: this.state.currentWinner,
      challenge: this.state.challenge,
      humanApproved: this.state.humanApproved,
    });

    if (!securityCheck.canCommit) {
      this.addActivity({
        origin,
        action: 'commit_decision',
        summary: `BLOCKED: ${securityCheck.error}`,
        status: 'error',
        details: { errorCode: securityCheck.errorCode },
      });
      this.notify();

      return {
        success: false,
        error: securityCheck.errorCode || 'COMMIT_VALIDATION_FAILED',
        message: securityCheck.error,
      };
    }

    const winner = this.state.currentWinner!;
    const decisionId = `VD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    const record: DecisionRecord = {
      decisionId,
      title: this.state.title,
      timestamp,
      selectedOption: {
        id: winner.id,
        name: winner.name,
        finalScore: winner.weightedScore,
      },
      finalWeights: { ...this.state.weights },
      criteria: [...this.state.criteria],
      allRankedOptions: this.state.ranking.map((r) => ({
        id: r.id,
        name: r.name,
        score: r.weightedScore,
        rank: r.rank,
      })),
      challengeSummary: this.state.challenge?.strongestCounterArgument || 'Challenge verified.',
      humanApprovedAt: this.state.humanApprovedAt || timestamp,
      committedAt: timestamp,
    };

    const frozenRecord = Object.freeze(record);

    this.state.committedStatus = 'committed';
    this.state.committedRecord = frozenRecord;
    this.state.lastModifiedBy = origin;
    this.state.lastModifiedMessage = `Decision permanently committed: ${winner.name} (ID: ${decisionId})`;

    this.addActivity({
      origin,
      action: 'commit_decision',
      summary: `DECISION COMMITTED: Selected ${winner.name} (Score: ${winner.weightedScore}) [ID: ${decisionId}]`,
      details: {
        decisionId,
        selectedOption: winner.name,
        finalScore: winner.weightedScore,
        reason: reason || 'Commit validated with human approval.',
      },
      status: 'success',
    });

    this.notify();

    return {
      success: true,
      decisionId,
      timestamp,
      selectedOption: winner.name,
      finalScore: winner.weightedScore,
      record: frozenRecord,
    };
  }

  public resetDecision() {
    this.setScenario(this.state.scenarioId, 'human');
  }
}

// Global Singleton Store Instance
export const decisionStore = new CanonicalDecisionStore();
