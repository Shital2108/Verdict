import { beforeEach, describe, expect, it } from 'vitest';
import { decisionStore } from '../../store/decisionStore';
import { VERDICT_WEBMCP_TOOLS } from '../tools';

describe('VERDICT WebMCP Canonical Integration', () => {
  beforeEach(() => {
    decisionStore.setScenario('laptop', 'system');
  });

  it('1. contains exactly the 6 required WebMCP tools with complete schemas', () => {
    const toolNames = VERDICT_WEBMCP_TOOLS.map((t) => t.name);
    expect(toolNames).toHaveLength(6);
    expect(toolNames).toEqual([
      'research_options',
      'score_options',
      'challenge_top_pick',
      'adjust_priority',
      'request_commit',
      'commit_decision',
    ]);

    VERDICT_WEBMCP_TOOLS.forEach((tool) => {
      expect(tool.name).toBeDefined();
      expect(tool.description.length).toBeGreaterThan(15);
      expect(tool.parameters.type).toBe('object');
      expect(typeof tool.execute).toBe('function');
    });
  });

  it('2. research_options tool retrieves candidates and updates shared state', async () => {
    const researchTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'research_options')!;
    const res = await researchTool.execute({ query: 'high performance dev laptops' });

    expect(res.success).toBe(true);
    expect(res.count).toBe(3);
    const state = decisionStore.getState();
    expect(state.options.length).toBe(3);
  });

  it('3. score_options tool calculates rankings and identifies winner', async () => {
    const scoreTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'score_options')!;
    const res = await scoreTool.execute({});

    expect(res.success).toBe(true);
    expect(res.winner.name).toBe('Laptop B');
    expect(res.ranking).toHaveLength(3);
  });

  it('4. adjust_priority updates the canonical shared state and recalculates weights', async () => {
    const adjustTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'adjust_priority')!;
    const res = await adjustTool.execute({ criterion: 'battery', weight: 60 });

    expect(res.success).toBe(true);
    expect(res.allNormalizedWeights.battery).toBe(60);

    const state = decisionStore.getState();
    expect(state.weights.battery).toBe(60);
    const sum = Object.values(state.weights).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('5. challenge_top_pick performs adversarial comparison and updates challenge state', async () => {
    const challengeTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'challenge_top_pick')!;
    const res = await challengeTool.execute({});

    expect(res.success).toBe(true);
    expect(res.winner.name).toBe('Laptop B');
    expect(res.runnerUp.name).toBe('Laptop C');
    expect(res.counterArgument).toBeDefined();

    const state = decisionStore.getState();
    expect(state.challenge).not.toBeNull();
    expect(state.challengeStatus).toBe('challenged');
  });

  it('6. request_commit locks the board in pending human approval state', async () => {
    decisionStore.researchOptions();
    decisionStore.scoreOptions();
    decisionStore.challengeTopPick('agent');

    const requestTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'request_commit')!;
    const res = await requestTool.execute({ justification: 'Ready for evaluation' });

    expect(res.success).toBe(true);
    expect(res.status).toBe('pending_human_approval');
    expect(res.humanApprovalRequired).toBe(true);

    const state = decisionStore.getState();
    expect(state.commitRequestStatus).toBe('pending_human_approval');
    expect(state.humanApproved).toBe(false);
  });

  it('7. commit_decision FAILS with HUMAN_APPROVAL_REQUIRED when agent attempts silent commit', async () => {
    // 1. Run pipeline & challenge
    decisionStore.researchOptions();
    decisionStore.scoreOptions();
    decisionStore.challengeTopPick('agent');
    // 2. Request commit
    decisionStore.requestCommit('Agent ready', 'agent');

    const commitTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'commit_decision')!;
    const res = await commitTool.execute({});

    expect(res.success).toBe(false);
    expect(res.error).toBe('HUMAN_APPROVAL_REQUIRED');

    const state = decisionStore.getState();
    expect(state.committedStatus).toBe('uncommitted');
    expect(state.committedRecord).toBeNull();
  });

  it('8. commit_decision SUCCEEDS after human grants explicit approval', async () => {
    // 1. Run pipeline
    decisionStore.researchOptions();
    decisionStore.scoreOptions();
    // 2. Run challenge
    decisionStore.challengeTopPick('agent');
    // 3. Request commit
    decisionStore.requestCommit('Agent ready', 'agent');
    // 4. Human explicitly approves
    decisionStore.approveByHuman();

    // 5. Commit execution
    const commitTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'commit_decision')!;
    const res = await commitTool.execute({ reason: 'Human verified' });

    expect(res.success).toBe(true);
    expect(res.decisionId).toMatch(/^VD-/);
    expect(res.selectedOption).toBe('Laptop B');

    const state = decisionStore.getState();
    expect(state.committedStatus).toBe('committed');
    expect(state.committedRecord).not.toBeNull();
    expect(state.committedRecord?.decisionId).toBe(res.decisionId);
  });

  it('9. prevents duplicate commit attempts after finalization', async () => {
    decisionStore.researchOptions();
    decisionStore.scoreOptions();
    decisionStore.challengeTopPick('agent');
    decisionStore.requestCommit('Agent ready', 'agent');
    decisionStore.approveByHuman();

    const commitTool = VERDICT_WEBMCP_TOOLS.find((t) => t.name === 'commit_decision')!;
    const first = await commitTool.execute({});
    expect(first.success).toBe(true);

    // Duplicate attempt
    const second = await commitTool.execute({});
    expect(second.success).toBe(false);
    expect(second.error).toBe('ALREADY_COMMITTED');
  });
});
