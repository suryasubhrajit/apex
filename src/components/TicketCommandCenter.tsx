"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, ShieldCheck, ShieldX, AlertTriangle,
  Sparkles, Terminal, ArrowRight, Zap, UserCheck, Package,
  Clock, CheckCircle2, XCircle, ChevronRight, MoreHorizontal
} from "lucide-react";
import { ReasoningStep, RefundDecision } from "@/lib/agent/tools";
import { CRM_DATABASE, CustomerProfile, Order } from "@/data/crm-data";

export interface TicketItem {
  id: string;
  ticketNumber: string;
  customer: CustomerProfile;
  order: Order;
  status: "OPEN" | "PENDING_APPROVAL" | "ESCALATED" | "RESOLVED";
  priority: "HIGH" | "MEDIUM" | "LOW";
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
  isLoading: boolean;
  onInspectTelemetry: (steps: ReasoningStep[]) => void;
}

const statusColors: Record<string, string> = {
  OPEN:             "badge-accent",
  PENDING_APPROVAL: "badge-warning",
  ESCALATED:        "badge-danger",
  RESOLVED:         "badge-success",
};

const MACROS = [
  { label: "✅ Approve ORD-1001",    query: "I bought headphones in Order #ORD-1001 10 days ago. They are unopened. Can I get a full refund?" },
  { label: "❌ Final Sale ORD-1005", query: "I want to return my dress from Order #ORD-1005 (Clearance Final Sale)." },
  { label: "⚠️ Risk ORD-1006",      query: "I'd like to return my Smart Watch from Order #ORD-1006." },
  { label: "❌ Digital ORD-1007",    query: "I bought a Photo Editing License Key in Order #ORD-1007 by mistake." },
  { label: "⭐ VIP ORD-1010",        query: "I am a VIP member requesting a refund for Order #ORD-1010 (38 days ago)." },
];

export const TicketCommandCenter: React.FC<TicketCommandCenterProps> = ({
  tickets, activeTicketId, onSelectTicket, onSendMessage, isLoading, onInspectTelemetry
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(activeTicket.id, inputText.trim(), isHumanTakeover);
    setInputText("");
  };

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
          {filteredTickets.map(t => (
            <div
              key={t.id}
              onClick={() => onSelectTicket(t.id)}
              className={`card-hover p-3 space-y-2 ${activeTicketId === t.id ? "active" : ""}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] font-mono text-[color:var(--accent)] font-semibold">{t.ticketNumber}</span>
                <span className={`badge ${statusColors[t.status]}`}>{t.status}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[color:var(--text-primary)] truncate">{t.customer.name}</p>
                <p className="text-[11px] text-[color:var(--text-muted)] truncate mt-0.5">{t.subject}</p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[color:var(--border-sub)]">
                <span className="text-[10px] text-[color:var(--text-muted)]">#{t.order.orderId}</span>
                <span className={`text-[10px] font-semibold ${t.customer.riskScore > 50 ? "text-[color:var(--danger)]" : "text-[color:var(--success)]"}`}>
                  Risk {t.customer.riskScore}/100
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Col 2: Conversation ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[color:var(--bg-base)]">
        {/* Conversation header */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[color:var(--bg-overlay)] border border-[color:var(--border-main)] flex items-center justify-center text-xs font-bold text-[color:var(--text-secondary)] flex-shrink-0">
              {customer?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[color:var(--text-primary)] truncate">{customer?.name}</span>
                <span className={`badge ${customer?.memberTier === "VIP" ? "badge-purple" : "badge-neutral"}`}>{customer?.memberTier}</span>
              </div>
              <p className="text-[11px] text-[color:var(--text-muted)] truncate">
                {activeTicket?.ticketNumber} · {order?.orderId} · {order?.items[0]?.name}
              </p>
            </div>
          </div>

          {/* Autonomous / Takeover toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] font-medium ${isHumanTakeover ? "text-[color:var(--warning)]" : "text-[color:var(--text-muted)]"}`}>
              {isHumanTakeover ? "Manual" : "AI Agent"}
            </span>
            <button
              onClick={() => setIsHumanTakeover(!isHumanTakeover)}
              className={`toggle-track ${isHumanTakeover ? "on" : "off"}`}
              style={{ background: isHumanTakeover ? "var(--warning)" : undefined }}
              aria-label="Toggle takeover"
            >
              <span className="toggle-thumb" />
            </button>
            <span className="text-[11px] text-[color:var(--text-muted)]">
              {isHumanTakeover ? "Override" : "Auto"}
            </span>
          </div>
        </div>

        {/* Macros bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[color:var(--border-sub)] bg-[color:var(--bg-surface)] overflow-x-auto flex-shrink-0">
          <span className="label flex-shrink-0">Macros:</span>
          {MACROS.map((m, i) => (
            <button
              key={i}
              disabled={isLoading}
              onClick={() => onSendMessage(activeTicket.id, m.query, isHumanTakeover)}
              className="btn btn-ghost btn-sm flex-shrink-0"
              style={{ fontSize: "10px", padding: "3px 8px" }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTicket?.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[75%] animate-slide-up ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                msg.sender === "user"       ? "bg-[color:var(--bg-overlay)] text-[color:var(--text-secondary)]"
                : msg.sender === "human_agent" ? "bg-[color:var(--warning-muted)] text-[color:var(--warning)]"
                : "bg-[color:var(--accent)] text-white"
              }`}>
                {msg.sender === "user" ? <User size={10} /> : <Bot size={10} />}
              </div>

              <div className="space-y-1.5">
                <div className={`px-3.5 py-2.5 rounded-lg text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[color:var(--accent)] text-white rounded-tr-none"
                    : msg.sender === "human_agent"
                    ? "bg-[color:var(--warning-muted)] border border-[color:var(--border-main)] text-[color:var(--text-primary)] rounded-tl-none"
                    : "bg-[color:var(--bg-elevated)] border border-[color:var(--border-main)] text-[color:var(--text-primary)] rounded-tl-none"
                }`}>
                  {msg.text}
                </div>

                {/* Decision card */}
                {msg.decision && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[color:var(--bg-elevated)] border border-[color:var(--border-main)]">
                    {msg.decision.status === "APPROVED" && (
                      <span className="badge badge-success"><ShieldCheck size={10} /> APPROVED ${msg.decision.amountRefunded.toFixed(2)}</span>
                    )}
                    {msg.decision.status === "DENIED" && (
                      <span className="badge badge-danger"><ShieldX size={10} /> DENIED</span>
                    )}
                    {msg.decision.status === "ESCALATED" && (
                      <span className="badge badge-warning"><AlertTriangle size={10} /> ESCALATED</span>
                    )}
                    {msg.reasoningSteps && (
                      <button
                        onClick={() => onInspectTelemetry(msg.reasoningSteps!)}
                        className="btn btn-ghost btn-sm ml-auto"
                        style={{ fontSize: "10px", padding: "3px 8px" }}
                      >
                        <Terminal size={10} /> Logs ({msg.reasoningSteps.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex gap-2.5 max-w-sm">
              <div className="w-6 h-6 rounded-full bg-[color:var(--accent)] flex items-center justify-center flex-shrink-0">
                <Bot size={10} className="text-white animate-spin" />
              </div>
              <div className="px-3.5 py-2.5 rounded-lg rounded-tl-none bg-[color:var(--bg-elevated)] border border-[color:var(--accent-border)] flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => (
                    <span key={i} className="wave-bar h-3" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-xs text-[color:var(--text-secondary)]">Evaluating policy rules...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isLoading}
              placeholder={isHumanTakeover ? "Type manual supervisor response…" : "Type query or Order ID (e.g. 'Refund for ORD-1001')…"}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className={`btn btn-primary flex-shrink-0 ${isHumanTakeover ? "bg-[color:var(--warning)]" : ""}`}
            >
              <Send size={13} />
              {isHumanTakeover ? "Send" : "Run Agent"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Col 3: Customer 360 ──────────────────────────────── */}
      <div className="w-[260px] flex-shrink-0 flex flex-col border-l border-[color:var(--border-main)] bg-[color:var(--bg-surface)] overflow-y-auto">
        <div className="px-4 py-3 border-b border-[color:var(--border-sub)]">
          <span className="label">Customer 360</span>
        </div>

        {customer && (
          <div className="p-3 space-y-3">
            {/* Identity */}
            <div className="card p-3 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono text-[color:var(--accent)]">{customer.customerId}</span>
                <span className={`badge ${customer.memberTier === "VIP" ? "badge-purple" : "badge-neutral"}`}>{customer.memberTier}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[color:var(--text-primary)]">{customer.name}</p>
                <p className="text-[11px] text-[color:var(--text-muted)]">{customer.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="surface-overlay rounded p-2 text-center">
                  <p className="text-[10px] text-[color:var(--text-muted)]">Lifetime Value</p>
                  <p className="text-xs font-bold text-[color:var(--success)]">${customer.totalSpent.toFixed(0)}</p>
                </div>
                <div className="surface-overlay rounded p-2 text-center">
                  <p className="text-[10px] text-[color:var(--text-muted)]">Fraud Risk</p>
                  <p className={`text-xs font-bold ${customer.riskScore > 50 ? "text-[color:var(--danger)]" : "text-[color:var(--success)]"}`}>
                    {customer.riskScore}/100
                  </p>
                </div>
              </div>
            </div>

            {/* Order */}
            {order && (
              <div className="card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[color:var(--text-primary)]">#{order.orderId}</span>
                  <span className="text-xs font-bold text-[color:var(--success)]">${order.totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-[color:var(--text-muted)]">
                  Delivered {order.deliveryDate} <span className="text-[color:var(--text-caption)]">({daysElapsed}d ago)</span>
                </p>
                <p className="text-[11px] text-[color:var(--text-secondary)] truncate">
                  {order.items[0]?.name}
                </p>
                <div className="space-y-1.5 pt-1 border-t border-[color:var(--border-sub)]">
                  <span className="label">Policy Matrix</span>
                  {[
                    {
                      label: "30-Day Window",
                      pass: daysElapsed <= 30,
                      note: daysElapsed <= 30 ? `${daysElapsed}d` : customer?.memberTier === "VIP" ? "VIP ext." : "Expired"
                    },
                    { label: "Final Sale",  pass: !order.items[0]?.isFinalSale,       note: order.items[0]?.isFinalSale ? "Final Sale" : "OK" },
                    { label: "Digital Item", pass: order.items[0]?.category !== "Digital", note: order.items[0]?.category === "Digital" ? "Digital" : "OK" },
                  ].map(({ label, pass, note }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[11px] text-[color:var(--text-muted)]">{label}</span>
                      <span className={`text-[10px] font-semibold flex items-center gap-1 ${pass ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
                        {pass ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
