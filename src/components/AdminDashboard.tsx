"use client";

import React, { useState } from "react";
import { Terminal, ShieldCheck, ShieldX, AlertTriangle, Code, ArrowRight, Cpu, FileJson, CheckCircle2, XCircle } from "lucide-react";
import { ReasoningStep, RefundDecision } from "@/lib/agent/tools";

interface AdminDashboardProps {
  reasoningSteps: ReasoningStep[];
  decision?: RefundDecision;
  allSessions: Array<{
    id: string;
    timestamp: string;
    query: string;
    steps: ReasoningStep[];
    decision?: RefundDecision;
  }>;
  onSelectSession: (session: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reasoningSteps,
  decision,
  allSessions,
  onSelectSession
}) => {
  const [selectedStepTab, setSelectedStepTab] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto p-4 lg:p-6 gap-6 overflow-y-auto">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 bg-slate-900/80">
          <span className="text-xs text-slate-400 font-medium">Total Agent Evaluations</span>
          <div className="text-2xl font-extrabold text-white mt-1">{allSessions.length}</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-slate-900/80">
          <span className="text-xs text-slate-400 font-medium">Auto-Approved Refunds</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {allSessions.filter(s => s.decision?.status === "APPROVED").length}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-rose-500/20 bg-slate-900/80">
          <span className="text-xs text-slate-400 font-medium">Policy Denials</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">
            {allSessions.filter(s => s.decision?.status === "DENIED").length}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 bg-slate-900/80">
          <span className="text-xs text-slate-400 font-medium">Fraud Escalations</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {allSessions.filter(s => s.decision?.status === "ESCALATED").length}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Session History & Step-by-Step Reasoning Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Col: Session History Selector */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 max-h-[700px] overflow-y-auto">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Agent Execution Sessions ({allSessions.length})
          </h3>

          {allSessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">
              No reasoning sessions recorded yet. Send a prompt in Customer Chat to trigger the agent loop.
            </div>
          ) : (
            allSessions.map((session, idx) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 text-left transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(session.timestamp).toLocaleTimeString()}
                  </span>
                  {session.decision?.status === "APPROVED" && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
                      APPROVED
                    </span>
                  )}
                  {session.decision?.status === "DENIED" && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 rounded">
                      DENIED
                    </span>
                  )}
                  {session.decision?.status === "ESCALATED" && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded">
                      ESCALATED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-200 line-clamp-2 font-medium group-hover:text-indigo-300">
                  "{session.query}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Order #{session.decision?.orderId || "N/A"}</span>
                  <span className="text-indigo-400">{session.steps.length} tool steps</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Col: Active Reasoning Step Breakdown */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-5 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Live Agent Reasoning Trace
              </h3>
              <p className="text-xs text-slate-400">Detailed tool calls, thoughts, inputs, and observation payloads</p>
            </div>
            {decision && (
              <div className="flex items-center gap-2">
                {decision.status === "APPROVED" && (
                  <span className="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> APPROVED (${decision.amountRefunded.toFixed(2)})
                  </span>
                )}
                {decision.status === "DENIED" && (
                  <span className="px-3 py-1 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg flex items-center gap-1">
                    <ShieldX className="w-4 h-4" /> DENIED
                  </span>
                )}
                {decision.status === "ESCALATED" && (
                  <span className="px-3 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> ESCALATED TO HUMAN
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Reasoning Steps Loop */}
          {reasoningSteps.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm italic">
              No reasoning steps active. Run a chat query to inspect real-time agent tool orchestration.
            </div>
          ) : (
            <div className="space-y-4">
              {reasoningSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="glass-card p-4 rounded-xl border border-slate-700/80 bg-slate-900/90 space-y-3"
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {step.stepNumber}
                      </span>
                      <span className="font-semibold text-xs text-white uppercase tracking-wider">
                        Step {step.stepNumber}: {step.action ? `Tool Call [${step.action}]` : "Agent Synthesis"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Agent Thought */}
                  <div className="p-3 rounded-lg bg-slate-950/80 text-xs text-indigo-200 border-l-2 border-indigo-500 leading-relaxed">
                    <span className="font-bold text-indigo-400 block mb-0.5">🧠 Agent Thought:</span>
                    {step.thought}
                  </div>

                  {/* Tool Action & Inputs */}
                  {step.actionInput && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Code className="w-3.5 h-3.5 text-purple-400" />
                        Action Parameters:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-950 text-[11px] font-mono text-purple-300 overflow-x-auto border border-slate-800">
                        {JSON.stringify(step.actionInput, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Observation Output Payload */}
                  {step.observation && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                        Tool Observation Output:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-950 text-[11px] font-mono text-cyan-300 overflow-x-auto border border-slate-800 max-h-48">
                        {typeof step.observation === "string"
                          ? step.observation
                          : JSON.stringify(step.observation, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Final Decision Rationale Summary */}
          {decision && (
            <div className="mt-4 p-4 rounded-xl glass-card border border-indigo-500/30 bg-slate-950/90 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Final Decision & Rationale Summary
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">{decision.summary}</p>
              {decision.appliedRules && decision.appliedRules.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Rules Applied:</span>
                  {decision.appliedRules.map((ruleId) => (
                    <span
                      key={ruleId}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    >
                      {ruleId}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
