import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Header } from './components/Header';
import { PrioritySliders } from './components/PrioritySliders';
import { DecisionMatrix } from './components/DecisionMatrix';
import { AgentChallengeCard } from './components/AgentChallengeCard';
import { AgentActivityTimeline } from './components/AgentActivityTimeline';
import { CommitLockCard } from './components/CommitLockCard';
import { WebMCPTestConsole } from './components/WebMCPTestConsole';
import { decisionStore } from './store/decisionStore';
import { getWebMCPStatus, initializeWebMCP, subscribeWebMCPStatus, WebMCPStatus } from './webmcp/webmcp';
import { HelpCircle, Sparkles, Shield, Cpu, ExternalLink } from 'lucide-react';

export default function App() {
  // Subscribe to canonical reactive store
  const state = useSyncExternalStore(
    (listener) => decisionStore.subscribe(listener),
    () => decisionStore.getState()
  );

  const [webMCPStatus, setWebMCPStatus] = useState<WebMCPStatus>(getWebMCPStatus());
  const [isTestConsoleOpen, setIsTestConsoleOpen] = useState(false);

  // Initialize WebMCP on document.modelContext on mount
  useEffect(() => {
    const controller = new AbortController();
    const unsubscribe = subscribeWebMCPStatus((status) => {
      setWebMCPStatus(status);
    });

    initializeWebMCP(controller.signal);

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100">
      {/* Top Navigation Bar */}
      <Header
        state={state}
        webMCPStatus={webMCPStatus}
        onOpenTestConsole={() => setIsTestConsoleOpen(true)}
        isTestConsoleOpen={isTestConsoleOpen}
      />

      {/* Main Decision Board Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Active Decision Context Banner */}
        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Active Decision
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                Source of Truth: Shared State
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-mono">
              {state.title}
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-sans">
              {state.contextDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={() => setIsTestConsoleOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-mono text-zinc-200 transition-all flex items-center gap-2 hover:bg-zinc-850 shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>Verify WebMCP Tools</span>
            </button>
          </div>
        </section>

        {/* 2-Column Responsive Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT / MAIN COLUMN (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Priority Controls (Your Priorities) */}
            <PrioritySliders state={state} />

            {/* Decision Matrix & Scoreboard */}
            <DecisionMatrix state={state} />
          </div>

          {/* RIGHT / AGENT & SAFETY COLUMN (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Agent Challenge & Self-Defense Card */}
            <AgentChallengeCard state={state} />

            {/* Commit Decision & Safety Lock */}
            <CommitLockCard state={state} />

            {/* Agent Activity Timeline */}
            <AgentActivityTimeline activityLog={state.activityLog} />
          </div>
        </div>
      </main>

      {/* Developer / WebMCP Test Console Modal */}
      {isTestConsoleOpen && (
        <WebMCPTestConsole
          state={state}
          onClose={() => setIsTestConsoleOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-4 lg:px-8 py-5 text-center text-xs text-zinc-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            VERDICT — Decision-Negotiation Protocol for WebMCP & Humans.
          </span>
          <span>
            Document ModelContext API • Application-Level Safety Enforced
          </span>
        </div>
      </footer>
    </div>
  );
}
