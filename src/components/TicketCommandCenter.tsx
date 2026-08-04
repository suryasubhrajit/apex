"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Inbox, Send, User, CheckCircle2, AlertTriangle, ShieldAlert, Clock, RefreshCcw,
  Sparkles, ToggleLeft, ToggleRight, ArrowRight, CornerDownRight, FileText, ChevronRight,
  Eye, Check, XCircle, AlertCircle, Ban, DollarSign, Tag, ExternalLink, Bot
} from "lucide-react";
import { CustomerProfile, Order } from "@/data/crm-data";
import { ReasoningStep, RefundDecision } from "@/lib/agent/tools";

export interface TicketItem {
  id: string;
  ticketNumber: string;
  customer: CustomerProfile;
  order: Order;
  status: "OPEN" | "PENDING_APPROVAL" | "ESCALATED" | "RESOLVED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  subject: string;
  createdAt: string;
  messages: Array<{
    id: string;
    sender: "user" | "agent" | "human_agent";
    text: string;
    timestamp: string;
    reasoningSteps?: ReasoningStep[];
    decision?: RefundDecision;
  }>;
}

interface TicketCommandCenterProps {
  tickets: TicketItem[];
  activeTicketId: string;
  onSelectTicket: (ticketId: string) => void;
  onSendMessage: (ticketId: string, query: string, isHumanTakeover: boolean) => Promise<void>;
  onResetTicket?: (ticketId: string) => void;
  isLoading: boolean;
  onInspectTelemetry: (steps: ReasoningStep[]) => void;
}

const statusColors: Record<string, string> = {
  OPEN:             "badge-accent",
  PENDING_APPROVAL: "badge-warning",
  ESCALATED:        "badge-danger",
  RESOLVED:         "badge-success",
};

const TICKET_MACROS: Record<string, Array<{ label: string; query: string }>> = {
  "TCK-1001": [
    { label: "✅ Approve Refund ORD-1001", query: "I bought headphones in Order #ORD-1001 10 days ago. They are unopened. Can I get a full refund?" },
    { label: "✅ Damaged Item ORD-1003", query: "I want to request a refund for Order #ORD-1003 (damaged in transit)." },
    { label: "⭐ VIP Extended Window ORD-1010", query: "I am a VIP member requesting a refund for Order #ORD-1010 (38 days ago)." }
  ],
  "TCK-1005": [
    { label: "❌ Deny Final Sale ORD-1005", query: "I want to return my dress from Order #ORD-1005 (Clearance Final Sale)." },
    { label: "⏳ Deny Expired Window ORD-1004", query: "I want to return the backpack from Order #ORD-1004 (delivered 53 days ago)." },
    { label: "❌ Deny Digital Software ORD-1007", query: "I bought a Photo Editing License Key in Order #ORD-1007 by mistake." }
  ],
  "TCK-1006": [
    { label: "⚠️ Escalate High Risk ORD-1006", query: "I'd like to return my Smart Fitness Watch from Order #ORD-1006." }
  ]
};

export const TicketCommandCenter: React.FC<TicketCommandCenterProps> = ({
  tickets, activeTicketId, onSelectTicket, onSendMessage, onResetTicket, isLoading, onInspectTelemetry
}) => {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [inputText, setInputText] = useState("");
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTicket = tickets.find(t => t.id === activeTicketId) || tickets[0];
  const { customer, order } = activeTicket ?? {};

  const currentDate = new Date("2026-08-02");
  const deliveryDate = order ? new Date(order.deliveryDate) : currentDate;
  const daysElapsed = Math.ceil(Math.abs(currentDate.getTime() - deliveryDate.getTime()) / 86400000);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); },
    [activeTicket?.messages?.length, isLoading]);

  const filteredTickets = tickets.filter(t => filterStatus === "ALL" || t.status === filterStatus);

  const handleTicketSelect = async (id: string) => {
    // Clean server CRM database state when switching tickets so refund evaluations are fresh
    try { await fetch("/api/reset", { method: "POST" }); } catch {}
    onSelectTicket(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(activeTicket.id, inputText.trim(), isHumanTakeover);
    setInputText("");
  };

  const currentMacros = TICKET_MACROS[activeTicket.id] || TICKET_MACROS["TCK-1001"];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Col 1: Ticket Queue ──────────────────────────────── */}
      <div className="w-[260px] flex-shrink-0 flex flex-col border-r border-[color:var(--border-main)] bg-[color:var(--bg-surface)]">
        {/* Queue header */}
        <div className="px-4 py-3 border-b border-[color:var(--border-sub)]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[color:var(--text-primary)]">Support Queue</span>
            <span className="badge badge-accent">{filteredTickets.length}</span>
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-1">
            {["ALL","OPEN","ESCALATED","RESOLVED"].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm flex-1 ${filterStatus === st ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "3px 4px", fontSize: "10px", borderRadius: "4px" }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTickets.map(t => {
            const isActive = t.id === activeTicket.id;
            return (
              <div
                key={t.id}
                onClick={() => handleTicketSelect(t.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  isActive
                    ? "bg-[color:var(--accent-muted)] border-[color:var(--accent-border)] text-[color:var(--text-primary)]"
                    : "bg-[color:var(--bg-base)] border-[color:var(--border-sub)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-elevated)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-[color:var(--accent)]">{t.ticketNumber}</span>
                  <span className={`badge ${statusColors[t.status] || "badge-neutral"} text-[9px] uppercase px-1.5 py-0.5`}>
                    {t.status}
                  </span>
                </div>
                <div className="font-semibold text-xs truncate text-[color:var(--text-primary)]">{t.customer.name}</div>
                <div className="text-[11px] text-[color:var(--text-muted)] truncate mb-1.5">{t.subject}</div>
                <div className="flex items-center justify-between text-[10px] text-[color:var(--text-caption)] font-mono">
                  <span>#{t.order.orderId}</span>
                  <span className={t.customer.riskScore > 50 ? "text-[color:var(--danger)] font-bold" : "text-[color:var(--text-muted)]"}>
                    Risk {t.customer.riskScore}/100
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Col 2: Conversation & Co-Pilot ───────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[color:var(--border-main)] bg-[color:var(--bg-base)]">
        {/* Ticket Topbar Header */}
        <div className="px-5 py-3.5 border-b border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs font-bold text-[color:var(--accent)]">{activeTicket.ticketNumber}</span>
              <span className="text-xs font-bold text-[color:var(--text-primary)] truncate">{activeTicket.customer.name}</span>
              <span className="badge badge-accent text-[9px] px-1 py-0">{activeTicket.customer.memberTier}</span>
            </div>
            <p className="text-[11px] text-[color:var(--text-muted)] truncate">{activeTicket.subject}</p>
          </div>

          {/* Supervisor Human Takeover Switch & Ticket Reset Button */}
          <div className="flex items-center gap-2">
            {onResetTicket && (
              <button
                onClick={() => onResetTicket(activeTicket.id)}
                className="btn btn-ghost btn-sm text-[10px] py-1 px-2.5 flex items-center gap-1.5"
                title="Reset this ticket back to OPEN and clear order refund state for video testing"
              >
                <RefreshCcw size={11} className="text-[color:var(--accent)]" />
                <span>Reset Ticket</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md card">
              <span className="text-xs font-medium text-[color:var(--text-secondary)]">AI Agent</span>
              <button
                onClick={() => setIsHumanTakeover(!isHumanTakeover)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isHumanTakeover ? "bg-[color:var(--warning)]" : "bg-[color:var(--accent)]"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  isHumanTakeover ? "translate-x-4.5" : "translate-x-1"
                }`} />
              </button>
              <span className="text-xs font-medium text-[color:var(--text-secondary)]">Auto</span>
            </div>
          </div>
        </div>

        {/* Dynamic Context-Aware Macro Quick Presets Bar */}
        <div className="px-4 py-2 border-b border-[color:var(--border-sub)] bg-[color:var(--bg-elevated)] flex items-center gap-2 flex-shrink-0 overflow-x-auto">
          <span className="text-[10px] font-bold text-[color:var(--text-caption)] uppercase tracking-wider whitespace-nowrap">Macros:</span>
          {currentMacros.map((macro, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(activeTicket.id, macro.query, isHumanTakeover)}
              disabled={isLoading}
              className="btn btn-ghost btn-sm text-[11px] py-1 px-2.5 whitespace-nowrap flex-shrink-0"
            >
              <Sparkles size={11} className="text-[color:var(--accent)]" />
              <span>{macro.label}</span>
            </button>
          ))}
        </div>

        {/* Message Thread Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
          {activeTicket.messages.map((m) => {
            const isUser = m.sender === "user";
            const isHuman = m.sender === "human_agent";
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-1 max-w-[85%] ${
                  isUser ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--text-caption)] font-mono">
                  {isUser ? (
                    <><span>Customer</span><User size={10} /></>
                  ) : isHuman ? (
                    <><span className="text-[color:var(--warning)] font-bold">Human Agent</span></>
                  ) : (
                    <><Bot size={10} className="text-[color:var(--accent)]" /><span>AI Agent</span></>
                  )}
                  <span>•</span>
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border leading-relaxed ${
                    isUser
                      ? "bg-[color:var(--purple-muted)] border-purple-500/20 text-[color:var(--text-primary)] rounded-tr-none"
                      : isHuman
                      ? "bg-[color:var(--warning-muted)] border-amber-500/20 text-[color:var(--text-primary)] rounded-tl-none"
                      : "bg-[color:var(--bg-surface)] border-[color:var(--border-main)] text-[color:var(--text-primary)] rounded-tl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Inline Decision Receipt Card */}
                  {m.decision && (
                    <div className="mt-3 pt-3 border-t border-[color:var(--border-sub)] text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`badge uppercase font-mono text-[9px] ${
                          m.decision.status === "APPROVED" ? "badge-success" :
                          m.decision.status === "DENIED" ? "badge-danger" : "badge-warning"
                        }`}>
                          {m.decision.status}
                        </span>
                        {m.decision.transactionId && (
                          <span className="font-mono text-[10px] text-[color:var(--accent)]">{m.decision.transactionId}</span>
                        )}
                      </div>

                      {m.decision.summary && (
                        <p className="text-[11px] text-[color:var(--text-secondary)] font-medium">{m.decision.summary}</p>
                      )}

                      {/* Telemetry Inspect Button */}
                      {m.reasoningSteps && m.reasoningSteps.length > 0 && (
                        <button
                          onClick={() => onInspectTelemetry(m.reasoningSteps!)}
                          className="btn btn-ghost btn-sm text-[10px] py-1 px-2 text-[color:var(--accent)] mt-1"
                        >
                          <Eye size={11} /> Inspect Reasoning Telemetry ({m.reasoningSteps.length} Steps)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 rounded-lg card text-xs text-[color:var(--warning)] animate-pulse max-w-xs">
              <Bot size={14} />
              <span>Evaluating refund policy & order history…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box Bar */}
        <form onSubmit={handleSubmit} className="p-3.5 border-t border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex items-center gap-2.5 flex-shrink-0">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isHumanTakeover ? "Type as Human Supervisor..." : "Type customer message or Order ID (e.g. 'Refund for ORD-1001')..."}
              disabled={isLoading}
              className="input-field flex-1 text-xs py-2.5 px-3.5 pr-10"
            />
            <kbd className="absolute right-3 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[color:var(--text-muted)] bg-[color:var(--bg-elevated)] border border-[color:var(--border-sub)] rounded select-none pointer-events-none">
              ↵
            </kbd>
          </div>
          <button 
            type="submit" 
            disabled={isLoading || !inputText.trim()} 
            className="btn btn-primary px-4 py-2.5 flex items-center gap-1.5 text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            <Send size={13} /> Run Agent
          </button>
        </form>
      </div>

      {/* ── Col 3: Customer 360 Context Sidebar ──────────────── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-l border-[color:var(--border-main)] bg-[color:var(--bg-surface)] overflow-y-auto p-4 space-y-4">
        {customer && order ? (
          <>
            {/* Customer Profile Card */}
            <div className="card p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[color:var(--accent)]">{customer.customerId}</span>
                <span className="badge badge-accent text-[9px] uppercase px-1.5 py-0.5">{customer.memberTier}</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[color:var(--text-primary)]">{customer.name}</h4>
                <p className="text-[11px] text-[color:var(--text-muted)] truncate">{customer.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[color:var(--border-sub)] font-mono text-[10px]">
                <div className="p-2 rounded bg-[color:var(--bg-elevated)]">
                  <span className="text-[color:var(--text-caption)] block">Total Spend</span>
                  <span className="text-xs font-bold text-[color:var(--success)]">${customer.totalSpent.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded bg-[color:var(--bg-elevated)]">
                  <span className="text-[color:var(--text-caption)] block">Fraud Risk</span>
                  <span className={`text-xs font-bold ${customer.riskScore > 50 ? "text-[color:var(--danger)]" : "text-[color:var(--text-primary)]"}`}>
                    {customer.riskScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Order Details Card */}
            <div className="card p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[color:var(--border-sub)] pb-2">
                <span className="font-mono text-xs font-bold text-[color:var(--text-primary)]">#{order.orderId}</span>
                <span className="font-mono text-xs font-bold text-[color:var(--success)]">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-[color:var(--text-secondary)] space-y-1">
                <p className="font-medium text-[color:var(--text-primary)]">{order.items[0]?.name}</p>
                <div className="flex items-center justify-between text-[10px] text-[color:var(--text-caption)] font-mono">
                  <span>Category: {order.items[0]?.category}</span>
                  <span>Condition: {order.items[0]?.condition || "Unopened"}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[color:var(--text-caption)] font-mono">
                  <span>Delivered: {order.deliveryDate}</span>
                  <span className="text-[color:var(--accent)] font-bold">{daysElapsed}d elapsed</span>
                </div>
              </div>
            </div>

            {/* Policy Rules Eligibility Checklist */}
            <div className="card p-3.5 space-y-2 font-mono text-[10px]">
              <span className="text-[10px] font-bold text-[color:var(--text-caption)] uppercase tracking-wider block">Policy Matrix Checklist</span>
              
              <div className="flex items-center justify-between py-1 border-b border-[color:var(--border-sub)]">
                <span>30-Day Window</span>
                <span className={daysElapsed <= 30 || (customer.memberTier === "VIP" && daysElapsed <= 45) ? "text-[color:var(--success)] font-bold flex items-center gap-1" : "text-[color:var(--danger)] font-bold flex items-center gap-1"}>
                  {daysElapsed <= 30 ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {daysElapsed}d
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[color:var(--border-sub)]">
                <span>Final Sale Item</span>
                <span className={order.items[0]?.isFinalSale ? "text-[color:var(--danger)] font-bold flex items-center gap-1" : "text-[color:var(--success)] font-bold flex items-center gap-1"}>
                  {order.items[0]?.isFinalSale ? <XCircle size={10} /> : <CheckCircle2 size={10} />} {order.items[0]?.isFinalSale ? "Final Sale" : "OK"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span>Fraud Risk Score</span>
                <span className={customer.riskScore <= 75 ? "text-[color:var(--success)] font-bold flex items-center gap-1" : "text-[color:var(--danger)] font-bold flex items-center gap-1"}>
                  {customer.riskScore <= 75 ? <CheckCircle2 size={10} /> : <ShieldAlert size={10} />} {customer.riskScore}/100
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
