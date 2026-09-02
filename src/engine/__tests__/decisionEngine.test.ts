import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../../data/scenarios';
import {
  calculateScoresAndRanking,
  generateAdversarialChallenge,
  normalizeWeights,
  validateCommitSecurity,
} from '../decisionEngine';

describe('Decision Engine - Mathematical & Logic Core', () => {
  const laptopScenario = SCENARIOS.laptop;

  it('1. calculates exact weighted scores for Laptop demo dataset', () => {
    const weights = { performance: 35, battery: 45, portability: 20 };
    const { weightedScores, winner, ranking } = calculateScoresAndRanking(
      laptopScenario.options,
      laptopScenario.criteria,
      weights
    );

    // A: 92*0.35 + 71*0.45 + 86*0.20 = 32.2 + 31.95 + 17.2 = 81.35 -> 81.4
    // B: 87*0.35 + 94*0.45 + 91*0.20 = 30.45 + 42.3 + 18.2 = 90.95 -> 91.0
    // C: 84*0.35 + 89*0.45 + 78*0.20 = 29.4 + 40.05 + 15.6 = 85.05 -> 85.1
    expect(weightedScores['laptop-a']).toBeCloseTo(81.4, 1);
    expect(weightedScores['laptop-b']).toBeCloseTo(91.0, 1);
    expect(weightedScores['laptop-c']).toBeCloseTo(85.1, 1);

    expect(winner?.id).toBe('laptop-b');
    expect(winner?.weightedScore).toBe(91.0);
    expect(ranking[0].name).toBe('Laptop B');
    expect(ranking[1].name).toBe('Laptop C');
    expect(ranking[2].name).toBe('Laptop A');
  });

  it('2. ensures weight total is always strictly 100%', () => {
    const initialWeights = { performance: 35, battery: 45, portability: 20 };
    const allIds = ['performance', 'battery', 'portability'];

    // Increase battery to 60
    const normalized1 = normalizeWeights(initialWeights, 'battery', 60, allIds);
    const sum1 = Object.values(normalized1).reduce((a, b) => a + b, 0);
    expect(sum1).toBe(100);
    expect(normalized1.battery).toBe(60);

    // Increase performance to 90
    const normalized2 = normalizeWeights(initialWeights, 'performance', 90, allIds);
    const sum2 = Object.values(normalized2).reduce((a, b) => a + b, 0);
    expect(sum2).toBe(100);
    expect(normalized2.performance).toBe(90);

    // Set one to 0
    const normalized3 = normalizeWeights(initialWeights, 'portability', 0, allIds);
    const sum3 = Object.values(normalized3).reduce((a, b) => a + b, 0);
    expect(sum3).toBe(100);
    expect(normalized3.portability).toBe(0);
  });

  it('3. dynamically flips winner when priority shifts significantly', () => {
    // If Performance is 85%, Battery is 10%, Portability is 5%
    // A: 92*0.85 + 71*0.10 + 86*0.05 = 78.2 + 7.1 + 4.3 = 89.6
    // B: 87*0.85 + 94*0.10 + 91*0.05 = 73.95 + 9.4 + 4.55 = 87.9
    const perfHeavyWeights = { performance: 85, battery: 10, portability: 5 };
    const { winner } = calculateScoresAndRanking(
      laptopScenario.options,
      laptopScenario.criteria,
      perfHeavyWeights
    );

    expect(winner?.id).toBe('laptop-a');
    expect(winner?.name).toBe('Laptop A');
  });

  it('4. generates analytical challenge comparing winner against runner-up', () => {
    const weights = { performance: 35, battery: 45, portability: 20 };
    const { ranking } = calculateScoresAndRanking(
      laptopScenario.options,
      laptopScenario.criteria,
      weights
    );

    const challenge = generateAdversarialChallenge(ranking, laptopScenario.criteria, weights);

    expect(challenge.winnerName).toBe('Laptop B');
    expect(challenge.runnerUpName).toBe('Laptop C');
    expect(challenge.scoreGap).toBeGreaterThan(0);
    expect(challenge.strongestCounterArgument).toContain('Laptop B');
    expect(challenge.tippingPointExplanation.length).toBeGreaterThan(10);
  });

  it('5. rejects invalid criterion names during weight normalization', () => {
    const weights = { performance: 35, battery: 45, portability: 20 };
    const allIds = ['performance', 'battery', 'portability'];

    expect(() => {
      normalizeWeights(weights, 'non_existent_criterion', 50, allIds);
    }).toThrow(/Invalid criterion/);
  });

  it('6. rejects invalid weight values (NaN, negative, etc.)', () => {
    const weights = { performance: 35, battery: 45, portability: 20 };
    const allIds = ['performance', 'battery', 'portability'];

    expect(() => {
      normalizeWeights(weights, 'performance', NaN as any, allIds);
    }).toThrow(/valid number/);
  });
});

describe('Adversarial Safety & Human Approval Enforcement', () => {
  const dummyWinner: any = { id: 'laptop-b', name: 'Laptop B', weightedScore: 91.0 };
  const dummyChallenge: any = {
    winnerName: 'Laptop B',
    runnerUpName: 'Laptop A',
    strongestCounterArgument: 'Challenge test',
  };

  it('7. strictly blocks commit when humanApproved is false (HUMAN_APPROVAL_REQUIRED)', () => {
    const check = validateCommitSecurity({
      committedStatus: 'uncommitted',
      winner: dummyWinner,
      challenge: dummyChallenge,
      humanApproved: false,
    });

    expect(check.canCommit).toBe(false);
    expect(check.errorCode).toBe('HUMAN_APPROVAL_REQUIRED');
    expect(check.error).toContain('HUMAN_APPROVAL_REQUIRED');
  });

  it('8. allows commit only when humanApproved is true and challenge is completed', () => {
    const check = validateCommitSecurity({
      committedStatus: 'uncommitted',
      winner: dummyWinner,
      challenge: dummyChallenge,
      humanApproved: true,
    });

    expect(check.canCommit).toBe(true);
    expect(check.error).toBeUndefined();
  });

  it('9. blocks duplicate commits when decision is already committed', () => {
    const check = validateCommitSecurity({
      committedStatus: 'committed',
      winner: dummyWinner,
      challenge: dummyChallenge,
      humanApproved: true,
    });

    expect(check.canCommit).toBe(false);
    expect(check.errorCode).toBe('ALREADY_COMMITTED');
  });

  it('10. blocks commit when no challenge has been executed', () => {
    const check = validateCommitSecurity({
      committedStatus: 'uncommitted',
      winner: dummyWinner,
      challenge: null,
      humanApproved: true,
    });

    expect(check.canCommit).toBe(false);
    expect(check.errorCode).toBe('CHALLENGE_REQUIRED');
  });
});
