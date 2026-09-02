import React from 'react';
import { Table, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import { DecisionState } from '../types/verdict';

interface DecisionMatrixProps {
  state: DecisionState;
}

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({ state }) => {
  const { criteria, options, weights, ranking, currentWinner } = state;

  return (
    <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:p-6 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
              Decision Matrix
            </h2>
            <p className="text-xs text-zinc-400">
              Comparative criterion scores & real-time weighted aggregation.
            </p>
          </div>
        </div>

        {currentWinner && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-mono font-medium self-start sm:self-auto">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Winner: <strong className="text-white font-semibold">{currentWinner.name}</strong> ({currentWinner.weightedScore} pts)</span>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
        <table className="w-full text-left border-collapse min-w-[540px]">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="py-3 px-3.5 text-xs font-mono uppercase text-zinc-400 font-semibold w-1/4">
                Criterion (Weight)
              </th>
              {options.map((option) => {
                const isWinner = currentWinner?.id === option.id;
                return (
                  <th
                    key={option.id}
                    className={`py-3 px-3.5 text-center transition-colors ${
                      isWinner
                        ? 'bg-zinc-800/60 text-white rounded-t-lg border-t border-x border-zinc-700/80'
                        : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isWinner && <span className="text-amber-400 text-xs">🥇</span>}
                      <span className="font-bold text-sm font-mono tracking-tight">
                        {option.name}
                      </span>
                    </div>
                    {option.subtitle && (
                      <span className="block text-[11px] font-normal text-zinc-400 mt-0.5 truncate max-w-[140px] mx-auto">
                        {option.subtitle}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-sm">
            {criteria.map((criterion) => {
              const currentWeight = weights[criterion.id] ?? 0;

              // Find maximum score on this criterion to highlight relative strength
              const maxScore = Math.max(...options.map((o) => o.scores[criterion.id] ?? 0));

              return (
                <tr key={criterion.id} className="hover:bg-zinc-850/40 transition-colors">
                  <td className="py-3.5 px-3.5 font-medium text-zinc-300">
                    <div className="font-semibold text-zinc-200">{criterion.name}</div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                      weight: <span className="text-zinc-300 font-bold">{currentWeight}%</span>
                    </div>
                  </td>
                  {options.map((option) => {
                    const rawScore = option.scores[criterion.id] ?? 0;
                    const weightedContrib = (rawScore * (currentWeight / 100)).toFixed(1);
                    const isTopOnCriterion = rawScore === maxScore;
                    const isWinner = currentWinner?.id === option.id;

                    return (
                      <td
                        key={option.id}
                        className={`py-3.5 px-3.5 text-center font-mono ${
                          isWinner ? 'bg-zinc-800/40 border-x border-zinc-700/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`text-base font-bold ${
                              isTopOnCriterion ? 'text-zinc-100' : 'text-zinc-400'
                            }`}
                          >
                            {rawScore}
                          </span>
                          {isTopOnCriterion && (
                            <span
                              className="text-[10px] text-emerald-400 font-mono bg-emerald-950/50 px-1 py-0.5 rounded border border-emerald-800/40"
                              title="Best in criterion"
                            >
                              lead
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] text-zinc-500 mt-0.5 font-mono">
                          +{weightedContrib} pts
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Weighted Score Aggregate Row */}
            <tr className="bg-zinc-950/80 border-t-2 border-zinc-700 font-mono">
              <td className="py-4 px-3.5 font-bold text-white text-xs uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  <span>Weighted Score</span>
                </div>
              </td>
              {options.map((option) => {
                const ranked = ranking.find((r) => r.id === option.id);
                const isWinner = currentWinner?.id === option.id;

                return (
                  <td
                    key={option.id}
                    className={`py-4 px-3.5 text-center ${
                      isWinner
                        ? 'bg-zinc-800/90 text-white rounded-b-lg border-b border-x border-zinc-700'
                        : 'text-zinc-300'
                    }`}
                  >
                    <div className="text-xl font-extrabold tracking-tight">
                      {ranked?.weightedScore ?? 0}
                    </div>
                    <div className="text-[11px] mt-0.5 font-medium">
                      {isWinner ? (
                        <span className="text-amber-400 font-bold flex items-center justify-center gap-1">
                          🥇 Rank #1
                        </span>
                      ) : (
                        <span className="text-zinc-500">Rank #{ranked?.rank}</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
