import React from 'react';
import { Lock, Unlock, CheckCircle2, ShieldCheck, AlertCircle, FileCheck, Award, Calendar, Hash } from 'lucide-react';
import { decisionStore } from '../store/decisionStore';
import { DecisionState } from '../types/verdict';

interface CommitLockCardProps {
  state: DecisionState;
}

export const CommitLockCard: React.FC<CommitLockCardProps> = ({ state }) => {
  const {
    committedStatus,
    committedRecord,
    humanApproved,
    challenge,
    currentWinner,
    commitRequestStatus,
  } = state;

  const handleApprove = () => {
    try {
      decisionStore.approveByHuman();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCommitNow = () => {
    try {
      decisionStore.commitDecision('Committed via human interface confirmation', 'human');
    } catch (err: any) {
      console.error(err);
    }
  };

  // State 1: Already Committed
  if (committedStatus === 'committed' && committedRecord) {
    return (
      <section className="bg-emerald-950/20 border border-emerald-800/80 rounded-xl p-5 md:p-6 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
              Decision Committed
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60">
            Immutable Record
          </span>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* Decision ID & Timestamp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-zinc-950/80 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-400">ID:</span>
              <span className="text-white font-bold text-xs">{committedRecord.decisionId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-400">Timestamp:</span>
              <span className="text-zinc-300">{new Date(committedRecord.committedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Selected Option */}
          <div className="p-3.5 bg-zinc-900 rounded-lg border border-zinc-750 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Final Selection:</span>
              <span className="text-base font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                <Award className="w-4 h-4 text-amber-400" />
                {committedRecord.selectedOption.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Final Score:</span>
              <span className="text-lg font-bold text-emerald-400">
                {committedRecord.selectedOption.finalScore} pts
              </span>
            </div>
          </div>

          {/* Weights Snapshot */}
          <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800 space-y-1.5">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">
              Final Priority Weights:
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(committedRecord.finalWeights).map(([k, v]) => (
                <span
                  key={k}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[11px] border border-zinc-700"
                >
                  {k}: <strong className="text-white">{v}%</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Challenge Audit */}
          <div className="p-3 bg-zinc-950/80 rounded-lg border border-zinc-800">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold mb-1">
              Audit Challenge Verified:
            </span>
            <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
              {committedRecord.challengeSummary}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // State 2: Ready for Human Approval or Pending
  const isChallengeDone = !!challenge || commitRequestStatus === 'pending_human_approval';

  return (
    <section className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-md ${
              humanApproved
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {humanApproved ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white font-mono uppercase">
              Commit Decision Gate
            </h2>
            <p className="text-xs text-zinc-400">
              Application-enforced human safety boundary.
            </p>
          </div>
        </div>

        {humanApproved ? (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            HUMAN APPROVED
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Lock className="w-3 h-3" />
            COMMIT LOCKED
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Status explanation */}
        {!isChallengeDone ? (
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-200 block mb-0.5">Commit Locked</strong>
              Waiting for adversarial agent challenge (<code>challenge_top_pick</code>) and human review.
            </div>
          </div>
        ) : !humanApproved ? (
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200/90 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Human Approval Required</strong>
              {commitRequestStatus === 'pending_human_approval'
                ? `The AI agent prepared ${currentWinner?.name} for commitment and requested approval.`
                : `Challenge audit complete. Human review required before finalizing commitment.`}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-xs text-emerald-200/90 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Human Approval Granted</strong>
              Decision is authorized. Either the AI agent (via <code>commit_decision</code> WebMCP tool) or human can finalize the permanent decision record.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!humanApproved ? (
            <button
              id="approve-decision-btn"
              onClick={handleApprove}
              disabled={!isChallengeDone}
              className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isChallengeDone
                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white cursor-pointer shadow-sm active:scale-[0.99]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>APPROVE DECISION</span>
            </button>
          ) : (
            <button
              id="commit-decision-btn"
              onClick={handleCommitNow}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99]"
            >
              <FileCheck className="w-4 h-4" />
              <span>FINALIZE & COMMIT RECORD</span>
            </button>
          )}
        </div>

        {/* Adversarial Safety Note */}
        <div className="text-[11px] text-zinc-500 leading-normal font-sans border-t border-zinc-800/60 pt-3 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            Strict safety rule: AI agents cannot bypass human approval even if <code>commit_decision</code> is called directly.
          </span>
        </div>
      </div>
    </section>
  );
};
