import { ChallengeResult, Criterion, Option, RankedOption } from '../types/verdict';

/**
 * Normalizes weights so the sum across all criteria is always strictly 100%.
 * When a specific criterion weight is adjusted, the remaining difference is proportionally
 * redistributed across the remaining criteria.
 */
export function normalizeWeights(
  currentWeights: Record<string, number>,
  changedCriterionId: string,
  rawNewWeight: number,
  allCriterionIds: string[]
): Record<string, number> {
  const targetId = changedCriterionId.toLowerCase().trim();
  const validIds = allCriterionIds.map((id) => id.toLowerCase().trim());

  if (!validIds.includes(targetId)) {
    throw new Error(`Invalid criterion "${changedCriterionId}". Valid criteria are: ${allCriterionIds.join(', ')}`);
  }

  if (typeof rawNewWeight !== 'number' || isNaN(rawNewWeight)) {
    throw new Error(`Weight must be a valid number between 0 and 100.`);
  }

  // Clamp target weight between 0 and 100
  const clampedNewWeight = Math.max(0, Math.min(100, Math.round(rawNewWeight)));
  const otherIds = validIds.filter((id) => id !== targetId);

  if (otherIds.length === 0) {
    return { [targetId]: 100 };
  }

  const remaining = 100 - clampedNewWeight;
  const currentOtherSum = otherIds.reduce((sum, id) => sum + (currentWeights[id] || 0), 0);

  const result: Record<string, number> = {
    [targetId]: clampedNewWeight,
  };

  if (currentOtherSum > 0) {
    // Proportional redistribution
    let allocated = 0;
    otherIds.forEach((id, index) => {
      if (index === otherIds.length - 1) {
        // Last one takes exact remainder to ensure 100% total
        result[id] = Math.max(0, remaining - allocated);
      } else {
        const share = Math.round((currentWeights[id] / currentOtherSum) * remaining);
        result[id] = Math.max(0, share);
        allocated += result[id];
      }
    });
  } else {
    // Equal redistribution when previous others were all 0
    let allocated = 0;
    const equalShare = Math.floor(remaining / otherIds.length);
    otherIds.forEach((id, index) => {
      if (index === otherIds.length - 1) {
        result[id] = Math.max(0, remaining - allocated);
      } else {
        result[id] = equalShare;
        allocated += equalShare;
      }
    });
  }

  // Ensure absolute mathematical sum is 100
  const total = Object.values(result).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    const diff = 100 - total;
    // Adjust the highest other criterion
    const highestOther = otherIds.reduce((maxId, curr) => (result[curr] > result[maxId] ? curr : maxId), otherIds[0]);
    result[highestOther] = Math.max(0, result[highestOther] + diff);
  }

  return result;
}

/**
 * Calculates weighted scores for all options based on criteria and weights.
 * Total Score = Sum(option.score[c] * (weight[c] / 100))
 */
export function calculateScoresAndRanking(
  options: Option[],
  criteria: Criterion[],
  weights: Record<string, number>
): {
  weightedScores: Record<string, number>;
  ranking: RankedOption[];
  winner: RankedOption | null;
} {
  if (!options || options.length === 0) {
    return {
      weightedScores: {},
      ranking: [],
      winner: null,
    };
  }

  const weightedScores: Record<string, number> = {};
  const calculatedOptions: RankedOption[] = options.map((option) => {
    let totalScore = 0;
    const scoreBreakdown: Record<string, { rawScore: number; weightedContribution: number }> = {};

    criteria.forEach((criterion) => {
      const rawScore = option.scores[criterion.id] ?? 0;
      const weightPercent = weights[criterion.id] ?? 0;
      const weightedContribution = rawScore * (weightPercent / 100);

      scoreBreakdown[criterion.id] = {
        rawScore,
        weightedContribution: Number(weightedContribution.toFixed(2)),
      };

      totalScore += weightedContribution;
    });

    const roundedTotal = Math.round((totalScore + Number.EPSILON) * 10) / 10;
    weightedScores[option.id] = roundedTotal;

    return {
      ...option,
      weightedScore: roundedTotal,
      rank: 0,
      scoreBreakdown,
    };
  });

  // Sort descending by weighted score
  calculatedOptions.sort((a, b) => b.weightedScore - a.weightedScore);

  // Assign rankings (1-indexed)
  calculatedOptions.forEach((opt, index) => {
    opt.rank = index + 1;
  });

  return {
    weightedScores,
    ranking: calculatedOptions,
    winner: calculatedOptions.length > 0 ? calculatedOptions[0] : null,
  };
}

/**
 * Generates an analytical self-defense/challenge comparing the top recommendation against runner-up.
 */
export function generateAdversarialChallenge(
  ranking: RankedOption[],
  criteria: Criterion[],
  weights: Record<string, number>
): ChallengeResult {
  if (ranking.length < 2) {
    throw new Error('At least two options are required to compute a competitive challenge.');
  }

  const winner = ranking[0];
  const runnerUp = ranking[1];
  const scoreGap = Number((winner.weightedScore - runnerUp.weightedScore).toFixed(1));

  // Find criteria where runner-up outperforms winner
  const vulnerabilities = criteria
    .map((criterion) => {
      const winnerScore = winner.scores[criterion.id] ?? 0;
      const runnerUpScore = runnerUp.scores[criterion.id] ?? 0;
      const advantage = runnerUpScore - winnerScore;
      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        winnerScore,
        runnerUpScore,
        advantage,
      };
    })
    .filter((item) => item.advantage > 0)
    .sort((a, b) => b.advantage - a.advantage);

  // Format analytical justification
  let strongestCounterArgument = '';
  let tippingPointExplanation = '';

  if (vulnerabilities.length > 0) {
    const primaryAdvantage = vulnerabilities[0];
    strongestCounterArgument = `I recommend ${winner.name} (Score: ${winner.weightedScore}) based on your current weight distribution. However, ${runnerUp.name} outperforms ${winner.name} in ${primaryAdvantage.criterionName} by ${primaryAdvantage.advantage} points (${primaryAdvantage.runnerUpScore} vs ${primaryAdvantage.winnerScore}).`;

    /**
     * Exact Algebraic Tipping Point Derivation:
     * Let k be the criterion where runner-up has an advantage: delta_k = s_R,k - s_W,k > 0.
     * Let W_k be the current weight of k (0-100), and S_other = sum_{j != k} W_j = 100 - W_k.
     * When weight of k becomes w_k (0-100), other weights scale proportionally:
     *   w_j = (100 - w_k) * (W_j / S_other) for j != k.
     *
     * Total Scores:
     *   Score_W(w_k) = s_W,k * (w_k / 100) + (100 - w_k) / (100 * S_other) * sum_{j != k} (s_W,j * W_j)
     *   Score_R(w_k) = s_R,k * (w_k / 100) + (100 - w_k) / (100 * S_other) * sum_{j != k} (s_R,j * W_j)
     *
     * Setting Score_R(w_k) = Score_W(w_k) and solving for w_k:
     *   delta_k * w_k = (100 - w_k) / S_other * (C_W,other - C_R,other)
     * where (C_W,other - C_R,other) = 100 * (Score_W - Score_R) + delta_k * W_k.
     *
     * Simplifying yields:
     *   w_k = [100 * (Score_W - Score_R) + delta_k * W_k] / [delta_k + (Score_W - Score_R)]
     */
    const currentWeight = weights[primaryAdvantage.criterionId] || 0;
    const scoreDiff = winner.weightedScore - runnerUp.weightedScore;
    const deltaAdvantage = primaryAdvantage.advantage;
    const exactTippingWeightRaw =
      (100 * scoreDiff + deltaAdvantage * currentWeight) / (deltaAdvantage + scoreDiff);
    const exactTippingWeight = Math.min(100, Math.max(0, Math.round(exactTippingWeightRaw)));

    tippingPointExplanation = `If ${primaryAdvantage.criterionName} priority is increased to ~${exactTippingWeight}% (or if your workload demands higher ${primaryAdvantage.criterionName.toLowerCase()}), ${runnerUp.name} immediately overtakes ${winner.name} as the mathematically optimal choice.`;
  } else {
    // Winner dominates on all criteria
    strongestCounterArgument = `${winner.name} (Score: ${winner.weightedScore}) dominates across all measured criteria. However, ${runnerUp.name} (Score: ${runnerUp.weightedScore}) is within a tight margin of ${scoreGap} points.`;
    tippingPointExplanation = `Even with balanced criteria adjustments, ${winner.name} maintains an unambiguous advantage across performance metrics.`;
  }

  return {
    winnerId: winner.id,
    winnerName: winner.name,
    winnerScore: winner.weightedScore,
    runnerUpId: runnerUp.id,
    runnerUpName: runnerUp.name,
    runnerUpScore: runnerUp.weightedScore,
    scoreGap,
    strongestCounterArgument,
    vulnerabilityCriteria: vulnerabilities,
    tippingPointExplanation,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Validates whether commit can proceed according to safety rules.
 * Security rule: humanApproved MUST be true.
 */
export function validateCommitSecurity(state: {
  committedStatus: string;
  winner: RankedOption | null;
  challenge: ChallengeResult | null;
  humanApproved: boolean;
}): { canCommit: boolean; error?: string; errorCode?: string } {
  if (state.committedStatus === 'committed') {
    return {
      canCommit: false,
      error: 'Decision is already finalized and committed. Duplicate commits are strictly rejected.',
      errorCode: 'ALREADY_COMMITTED',
    };
  }

  if (!state.winner) {
    return {
      canCommit: false,
      error: 'Cannot commit decision without an active scored recommendation.',
      errorCode: 'NO_RECOMMENDATION',
    };
  }

  if (!state.challenge) {
    return {
      canCommit: false,
      error: 'Cannot commit decision before running an adversarial challenge (challenge_top_pick).',
      errorCode: 'CHALLENGE_REQUIRED',
    };
  }

  if (!state.humanApproved) {
    return {
      canCommit: false,
      error: 'HUMAN_APPROVAL_REQUIRED: Explicit human approval must be granted before committing the decision.',
      errorCode: 'HUMAN_APPROVAL_REQUIRED',
    };
  }

  return { canCommit: true };
}
