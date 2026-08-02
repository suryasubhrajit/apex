"use client";

import React from "react";
import { Terminal, Cpu, Code, FileJson, CheckCircle2, ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";
import { ReasoningStep, RefundDecision } from "@/lib/agent/tools";

interface TelemetryDashboardProps {
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

const decisionBadge = (status?: string) => {
  if (!status) return null;
  const map: Record<string, string> = {
    APPROVED: "badge-success", DENIED: "badge-danger", ESCALATED: "badge-warning"
  };
  const icons: Record<string, React.ReactNode> = {
    APPROVED: <ShieldCheck size={9} />, DENIED: <ShieldX size={9} />, ESCALATED: <AlertTriangle size={9} />
  };
  return <span className={`badge ${map[status] || "badge-neutral"}`}>{icons[status]} {status}</span>;
};

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  reasoningSteps, decision, allSessions, onSelectSession
}) => {
  const metrics = [
    { label: "Total Evaluations", value: allSessions.length, color: "" },
    { label: "Approved Refunds",  value: allSessions.filter(s => s.decision?.status === "APPROVED").length,  color: "text-[color:var(--success)]" },
    { label: "Policy Denials",    value: allSessions.filter(s => s.decision?.status === "DENIED").length,    color: "text-[color:var(--danger)]" },
    { label: "Fraud Escalations", value: allSessions.filter(s => s.decision?.status === "ESCALATED").length, color: "text-[color:var(--warning)]" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[color:var(--bg-base)]">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex-shrink-0">
        <h2 className="text-base font-bold text-[color:var(--text-primary)]">Agent Telemetry & Reasoning Inspector</h2>
        <p className="text-[11px] text-[color:var(--text-muted)]">Step-by-step LLM thoughts, tool parameters, and observation payloads</p>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-4 gap-0 border-b border-[color:var(--border-main)] flex-shrink-0">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`px-6 py-4 bg-[color:var(--bg-surface)] ${i < 3 ? "border-r border-[color:var(--border-sub)]" : ""}`}
          >
            <p className="label mb-1">{m.label}</p>
            <p className={`text-2xl font-extrabold ${m.color || "text-[color:var(--text-primary)]"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Main split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions list */}
        <div className="w-[280px] flex-shrink-0 border-r border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex flex-col">
          <div className="px-4 py-2.5 border-b border-[color:var(--border-sub)] flex items-center gap-2">
            <Cpu size={12} className="text-[color:var(--accent)]" />
            <span className="text-xs font-semibold text-[color:var(--text-primary)]">Execution Sessions</span>
            <span className="badge badge-neutral ml-auto">{allSessions.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {allSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[color:var(--text-caption)] italic">
                No sessions yet. Trigger a chat prompt to begin.
              </div>
            ) : allSessions.map(s => (
              <div
                key={s.id}
                onClick={() => onSelectSession(s)}
                className="card-hover p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[color:var(--text-muted)]">{new Date(s.timestamp).toLocaleTimeString()}</span>
                  {decisionBadge(s.decision?.status)}
                </div>
                <p className="text-xs text-[color:var(--text-secondary)] truncate">"{s.query}"</p>
                <div className="flex items-center justify-between text-[10px] text-[color:var(--text-muted)]">
                  <span>#{s.decision?.orderId || "—"}</span>
                  <span className="text-[color:var(--accent)]">{s.steps.length} tool calls</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trace panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-2.5 border-b border-[color:var(--border-sub)] bg-[color:var(--bg-surface)] flex items-center gap-3 flex-shrink-0">
            <Terminal size={13} className="text-[color:var(--accent)]" />
            <span className="text-xs font-semibold text-[color:var(--text-primary)]">Live Reasoning Trace</span>
            {decision && <div className="ml-auto">{decisionBadge(decision.status)}</div>}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {reasoningSteps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <Terminal size={32} className="text-[color:var(--text-caption)]" />
                <p className="text-sm text-[color:var(--text-muted)]">No reasoning steps selected</p>
                <p className="text-xs text-[color:var(--text-caption)]">Run an agent query or click a session on the left to inspect execution telemetry</p>
              </div>
            ) : (
              <>
                {reasoningSteps.map(step => (
                  <div key={step.stepNumber} className="card p-4 space-y-3 animate-slide-up">
                    {/* Step header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white bg-[color:var(--accent)]">
                          {step.stepNumber}
                        </span>
                        <span className="text-xs font-semibold text-[color:var(--text-primary)]">
                          {step.action ? `Tool: ${step.action}` : "Decision Synthesis"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[color:var(--text-muted)]">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Thought */}
                    <div className="px-3 py-2 rounded border-l-2 border-[color:var(--accent)] bg-[color:var(--bg-base)] text-xs text-[color:var(--text-secondary)] leading-relaxed">
                      <span className="text-[color:var(--accent)] font-semibold text-[10px] uppercase tracking-wider block mb-0.5">Thought</span>
                      {step.thought}
                    </div>

                    {/* Parameters */}
                    {step.actionInput && (
                      <div>
                        <span className="label flex items-center gap-1 mb-1">
                          <Code size={10} className="text-[color:var(--purple)]" /> Parameters
                        </span>
                        <pre className="code-block">{JSON.stringify(step.actionInput, null, 2)}</pre>
                      </div>
                    )}

                    {/* Observation */}
                    {step.observation && (
                      <div>
                        <span className="label flex items-center gap-1 mb-1">
                          <FileJson size={10} className="text-[color:var(--cyan)]" /> Observation
                        </span>
                        <pre className="code-block" style={{ color: "var(--cyan)" }}>
                          {typeof step.observation === "string"
                            ? step.observation
                            : JSON.stringify(step.observation, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}

                {/* Final decision */}
                {decision && (
                  <div className="card p-4 space-y-2 border border-[color:var(--accent-border)] animate-slide-up">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[color:var(--accent)]" />
                      <span className="text-xs font-bold text-[color:var(--text-primary)]">Final Decision</span>
                      {decisionBadge(decision.status)}
                    </div>
                    <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">{decision.summary}</p>
                    {decision.appliedRules?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {decision.appliedRules.map(r => (
                          <span key={r} className="badge badge-accent font-mono">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
