import React from 'react';
import { ShieldAlert, Sparkles, Scale, ArrowRight, CheckCircle2, Flame } from 'lucide-react';
import { decisionStore } from '../store/decisionStore';
import { DecisionState } from '../types/verdict';

interface AgentChallengeCardProps {
  state: DecisionState;
}

export const AgentChallengeCard: React.FC<AgentChallengeCardProps> = ({ state }) => {
  const { challenge, challengeStatus, currentWinner } = state;

  const handleRunChallenge = () => {
    try {
      decisionStore.challengeTopPick('human');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:p-6 shadow-sm relative overflow-hidden">
      {/* Subtle decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-amber-950/50 border border-amber-800/50 text-amber-300">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
              Agent Challenge
            </h2>
            <p className="text-xs text-zinc-400">
              Adversarial self-critique & vulnerability stress-testing.
            </p>
          </div>
        </div>

        {challengeStatus === 'challenged' ? (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 self-start sm:self-auto">
            <ShieldAlert className="w-3 h-3" />
            Adversarial Audit Complete
          </span>
        ) : (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 self-start sm:self-auto">
            Awaiting Challenge
          </span>
        )}
      </div>

      {challenge ? (
        <div className="space-y-4">
          {/* Winner vs Runner-Up Header */}
          <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold font-mono">#1 {challenge.winnerName}</span>
              <span className="text-zinc-500 font-mono">({challenge.winnerScore} pts)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
              <span>vs Runner-up</span>
              <ArrowRight className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-200 font-semibold">{challenge.runnerUpName}</span>
              <span className="text-zinc-500">({challenge.runnerUpScore} pts)</span>
            </div>
          </div>

          {/* Primary Counter-Argument */}
          <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Strongest Counter-Argument:</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-300 font-sans">
              “{challenge.strongestCounterArgument}”
            </p>
          </div>

          {/* Vulnerability Breakdown if present */}
          {challenge.vulnerabilityCriteria.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                Vulnerability Criterion Lead:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {challenge.vulnerabilityCriteria.map((v) => (
                  <div
                    key={v.criterionId}
                    className="p-2.5 rounded-md bg-zinc-850/60 border border-zinc-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="text-zinc-200 font-medium">{v.criterionName}</span>
                      <span className="block text-[11px] text-zinc-400">
                        {challenge.runnerUpName}: <strong className="text-white">{v.runnerUpScore}</strong> vs {v.winnerScore}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                      +{v.advantage} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tipping Point Explanation */}
          <div className="p-3 rounded-lg bg-zinc-850/40 border border-zinc-800 text-xs text-zinc-400 leading-relaxed font-mono">
            <span className="text-zinc-200 font-semibold block mb-1">
              ⚡ Tipping Point Condition:
            </span>
            {challenge.tippingPointExplanation}
          </div>

          {/* Re-challenge button */}
          <button
            onClick={handleRunChallenge}
            className="w-full py-2 px-3 rounded-lg bg-zinc-800 text-xs font-mono text-zinc-300 hover:bg-zinc-750 hover:text-white border border-zinc-700/60 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Re-evaluate Challenge Arguments</span>
          </button>
        </div>
      ) : (
        <div className="p-6 rounded-lg bg-zinc-950/40 border border-dashed border-zinc-800 text-center space-y-3">
          <Scale className="w-8 h-8 mx-auto text-zinc-600" />
          <div className="max-w-xs mx-auto text-xs text-zinc-400">
            The AI decision engine has not yet challenged its recommendation. Trigger challenge to uncover runner-up advantages and tradeoff risks.
          </div>
          <button
            id="run-challenge-btn"
            onClick={handleRunChallenge}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-xs font-mono font-semibold text-zinc-100 hover:bg-zinc-700 border border-zinc-600 transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Execute challenge_top_pick</span>
          </button>
        </div>
      )}
    </section>
  );
};
