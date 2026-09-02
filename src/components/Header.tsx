import React from 'react';
import { SCENARIOS } from '../data/scenarios';
import { decisionStore } from '../store/decisionStore';
import { DecisionState } from '../types/verdict';
import { WebMCPStatus } from '../webmcp/webmcp';
import { Activity, Cpu, RotateCcw, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  state: DecisionState;
  webMCPStatus: WebMCPStatus;
  onOpenTestConsole: () => void;
  isTestConsoleOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  webMCPStatus,
  onOpenTestConsole,
  isTestConsoleOpen,
}) => {
  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    decisionStore.setScenario(e.target.value, 'human');
  };

  const handleReset = () => {
    decisionStore.resetDecision();
  };

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100 font-mono font-bold text-lg shadow-inner">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                VERDICT
              </h1>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700/60 font-mono">
                WebMCP Decision Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-normal">
              “Don’t just ask AI what to choose. Make it defend the choice.”
            </p>
          </div>
        </div>

        {/* Controls & Status Badges */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
            <span className="text-zinc-500 text-[11px] font-mono">Scenario:</span>
            <select
              id="scenario-selector"
              aria-label="Select Decision Scenario"
              value={state.scenarioId}
              onChange={handleScenarioChange}
              className="bg-transparent text-xs text-zinc-100 font-medium focus:outline-none cursor-pointer pr-1"
            >
              {Object.values(SCENARIOS).map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-zinc-900 text-zinc-100">
                  {sc.badge} — {sc.options.length} options
                </option>
              ))}
            </select>
          </div>

          {/* WebMCP Connectivity Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              webMCPStatus.supported
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
            title={
              webMCPStatus.supported
                ? `WebMCP active: ${webMCPStatus.registeredCount} tools registered on document.modelContext`
                : 'Native document.modelContext was not detected and no tools were registered on the page.'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                webMCPStatus.supported ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span>{webMCPStatus.supported ? 'WebMCP Native' : 'WebMCP Unavailable (Local Mode)'}</span>
          </div>

          {/* WebMCP Verification Console Toggle */}
          <button
            id="toggle-test-console-btn"
            onClick={onOpenTestConsole}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              isTestConsoleOpen
                ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm'
                : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-850 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>WebMCP Console</span>
          </button>

          {/* Reset Board */}
          <button
            id="reset-board-btn"
            onClick={handleReset}
            title="Reset to default scenario weights"
            className="p-1.5 rounded-lg bg-zinc-900/90 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
