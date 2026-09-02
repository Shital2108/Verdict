import React from 'react';
import { Activity, Bot, User, Cpu, Check, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { ActivityItem } from '../types/verdict';

interface AgentActivityTimelineProps {
  activityLog: ActivityItem[];
}

export const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({ activityLog }) => {
  return (
    <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
              Agent Activity Log
            </h2>
            <p className="text-xs text-zinc-400">
              Live observable WebMCP tool calls & shared state events.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-750">
          {activityLog.length} events
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
        {activityLog.map((item) => {
          const isAgent = item.origin === 'agent';
          const isHuman = item.origin === 'human';

          let statusIcon = <Check className="w-3.5 h-3.5 text-emerald-400" />;
          if (item.status === 'warning') {
            statusIcon = <Clock className="w-3.5 h-3.5 text-amber-400" />;
          } else if (item.status === 'error') {
            statusIcon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
          }

          return (
            <div
              key={item.id}
              className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/90 text-xs transition-colors hover:border-zinc-700/80"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-mono">
                  {statusIcon}
                  <span className="font-bold text-zinc-200">{item.action}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isAgent
                        ? 'bg-sky-950/70 text-sky-300 border-sky-800/60'
                        : isHuman
                        ? 'bg-purple-950/70 text-purple-300 border-purple-800/60'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {isAgent && <Bot className="w-2.5 h-2.5" />}
                    {isHuman && <User className="w-2.5 h-2.5" />}
                    <span>{item.origin}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.timestamp}</span>
                </div>
              </div>

              <p className="text-zinc-400 text-xs pl-5 leading-normal">
                {item.summary}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
