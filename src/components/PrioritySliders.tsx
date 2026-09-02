import React from 'react';
import { Sliders, User, Bot, AlertCircle } from 'lucide-react';
import { decisionStore } from '../store/decisionStore';
import { DecisionState } from '../types/verdict';

interface PrioritySlidersProps {
  state: DecisionState;
}

export const PrioritySliders: React.FC<PrioritySlidersProps> = ({ state }) => {
  const { criteria, weights, lastModifiedBy } = state;
  const totalWeight = Object.values(weights).reduce((a: number, b: number) => a + Number(b), 0);

  const handleSliderChange = (criterionId: string, value: number) => {
    try {
      decisionStore.adjustPriority(criterionId, value, 'human');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
              Your Priorities
            </h2>
            <p className="text-xs text-zinc-400">
              Weights dynamically normalize to ensure exactly 100% total balance.
            </p>
          </div>
        </div>

        {/* Total Weight Badge & Origin */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastModifiedBy === 'agent' && (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/50 animate-fade-in">
              <Bot className="w-3 h-3" />
              Agent Adjusted
            </span>
          )}
          {lastModifiedBy === 'human' && (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              <User className="w-3 h-3" />
              Human Adjusted
            </span>
          )}

          <div
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wider ${
              totalWeight === 100
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
            }`}
          >
            TOTAL: {totalWeight}%
          </div>
        </div>
      </div>

      {/* Sliders List */}
      <div className="space-y-5">
        {criteria.map((criterion) => {
          const weight = weights[criterion.id] ?? 0;
          return (
            <div key={criterion.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-zinc-200 text-sm">{criterion.name}</span>
                  {criterion.description && (
                    <span className="text-zinc-500 text-xs ml-2 hidden sm:inline">
                      — {criterion.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-zinc-100 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                    {weight}%
                  </span>
                </div>
              </div>

              {/* Slider Track & Input */}
              <div className="relative flex items-center">
                <input
                  id={`slider-${criterion.id}`}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={weight}
                  aria-label={`${criterion.name} priority weight slider`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={weight}
                  onChange={(e) => handleSliderChange(criterion.id, parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>

              {/* Visual Segment Bar */}
              <div className="w-full bg-zinc-800/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-300 h-full rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${weight}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalWeight !== 100 && (
        <div className="mt-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Weight sum deviation detected ({totalWeight}%). Adjust any slider to normalize.</span>
        </div>
      )}
    </section>
  );
};
