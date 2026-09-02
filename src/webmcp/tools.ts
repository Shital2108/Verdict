import { decisionStore } from '../store/decisionStore';
import { WebMCPToolDefinition } from '../types/verdict';

/**
 * The 6 canonical WebMCP tools specified for the VERDICT decision board.
 * Each tool directly reads and updates the shared canonical DecisionStore.
 */
export const VERDICT_WEBMCP_TOOLS: WebMCPToolDefinition[] = [
  {
    name: 'research_options',
    description:
      'Retrieves candidate options for the current active decision context. Updates the shared decision board with candidate data, scores, and descriptions. Must be used when establishing or refreshing candidate choices.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query or context keywords guiding candidate retrieval (e.g., "laptops for AI development and commuting").',
        },
      },
    },
    execute: async (args: { query?: string } = {}) => {
      try {
        const result = decisionStore.researchOptions(args.query, 'agent');
        return {
          success: true,
          action: 'research_options',
          count: result.count,
          candidates: result.options.map((o) => ({
            id: o.id,
            name: o.name,
            subtitle: o.subtitle,
            scores: o.scores,
          })),
          currentRanking: result.ranking.map((r) => ({
            rank: r.rank,
            name: r.name,
            score: r.weightedScore,
          })),
          message: `Retrieved ${result.count} options into shared board state.`,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Failed to research options.',
        };
      }
    },
  },

  {
    name: 'score_options',
    description:
      'Calculates weighted scores across all candidate options using the exact current criteria and priority weights in the shared state. Identifies the mathematical #1 recommendation and full ranking.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      try {
        const result = decisionStore.scoreOptions('agent');
        return {
          success: true,
          action: 'score_options',
          weightsApplied: result.weights,
          winner: result.winner
            ? {
                name: result.winner.name,
                weightedScore: result.winner.weightedScore,
                rank: result.winner.rank,
              }
            : null,
          ranking: result.ranking.map((r) => ({
            rank: r.rank,
            name: r.name,
            weightedScore: r.weightedScore,
            breakdown: r.scoreBreakdown,
          })),
          message: `Calculated ranking: ${result.winner?.name} ranked #1 with score ${result.winner?.weightedScore}.`,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Failed to calculate option scores.',
        };
      }
    },
  },

  {
    name: 'challenge_top_pick',
    description:
      'Forces adversarial self-defense on the current recommendation. Identifies the runner-up option, calculates vulnerability criteria where the runner-up outperforms the winner, and determines the priority tipping point required to flip the decision.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      try {
        const challenge = decisionStore.challengeTopPick('agent');
        return {
          success: true,
          action: 'challenge_top_pick',
          winner: {
            name: challenge.winnerName,
            score: challenge.winnerScore,
          },
          runnerUp: {
            name: challenge.runnerUpName,
            score: challenge.runnerUpScore,
            scoreGap: challenge.scoreGap,
          },
          vulnerabilities: challenge.vulnerabilityCriteria,
          counterArgument: challenge.strongestCounterArgument,
          tippingPoint: challenge.tippingPointExplanation,
          message: `Challenge computed: ${challenge.winnerName} vs ${challenge.runnerUpName}.`,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Failed to generate challenge comparison.',
        };
      }
    },
  },

  {
    name: 'adjust_priority',
    description:
      'Modifies the priority weight of a specific decision criterion. Directly modifies the exact same reactive sliders visible to the human user, redistributes remaining weight to maintain a strict 100% total, and recalculates scores in real-time.',
    parameters: {
      type: 'object',
      properties: {
        criterion: {
          type: 'string',
          description: 'The identifier or name of the criterion to adjust (e.g. "battery", "performance", "portability", "rent", "commute", "space").',
        },
        weight: {
          type: 'number',
          description: 'The target priority percentage (0 to 100). The total sum of all criteria will automatically normalize to 100%.',
        },
      },
      required: ['criterion', 'weight'],
    },
    execute: async (args: { criterion: string; weight: number }) => {
      try {
        if (!args || typeof args.criterion !== 'string' || typeof args.weight !== 'number') {
          return {
            success: false,
            error: 'INVALID_PARAMETERS',
            message: 'Both "criterion" (string) and "weight" (number 0-100) are required.',
          };
        }

        const result = decisionStore.adjustPriority(args.criterion, args.weight, 'agent');
        return {
          success: true,
          action: 'adjust_priority',
          adjustedCriterion: args.criterion,
          newWeight: args.weight,
          allNormalizedWeights: result.weights,
          newWinner: result.newWinner
            ? {
                name: result.newWinner.name,
                score: result.newWinner.weightedScore,
              }
            : null,
          message: `Priority updated for ${args.criterion}. New winner: ${result.newWinner?.name} (${result.newWinner?.weightedScore} pts).`,
        };
      } catch (err: any) {
        return {
          success: false,
          error: 'ADJUSTMENT_FAILED',
          message: err.message || 'Failed to adjust priority.',
        };
      }
    },
  },

  {
    name: 'request_commit',
    description:
      'Prepares the current recommendation for final commitment. Verifies an active recommendation and challenge exist, and transitions the board into pending human approval. NOTE: Does NOT finalize or commit the decision; commitment strictly requires explicit human action.',
    parameters: {
      type: 'object',
      properties: {
        justification: {
          type: 'string',
          description: 'Brief executive summary explaining why this decision is ready for human approval.',
        },
      },
    },
    execute: async (args: { justification?: string } = {}) => {
      try {
        const result = decisionStore.requestCommit(args.justification, 'agent');
        return {
          success: true,
          action: 'request_commit',
          status: result.status,
          recommendedOption: {
            name: result.recommendedOption?.name,
            score: result.recommendedOption?.weightedScore,
          },
          humanApprovalRequired: true,
          message: result.message,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Failed to request commit.',
        };
      }
    },
  },

  {
    name: 'commit_decision',
    description:
      'Finalizes and creates an immutable decision record. SECURITY CONSTRAINT: Requires prior explicit human approval (humanApproved === true). Any attempt by an AI agent to call this tool before human approval will fail with HUMAN_APPROVAL_REQUIRED.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Optional closing confirmation note.',
        },
      },
    },
    execute: async (args: { reason?: string } = {}) => {
      try {
        const result = decisionStore.commitDecision(args.reason, 'agent');
        return result;
      } catch (err: any) {
        return {
          success: false,
          error: 'UNEXPECTED_COMMIT_ERROR',
          message: err.message || 'An unexpected error occurred during commit.',
        };
      }
    },
  },
];
