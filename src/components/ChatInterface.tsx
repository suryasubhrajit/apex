"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ShieldCheck, ShieldX, AlertTriangle, Sparkles, Terminal, ArrowRight } from "lucide-react";
import { ReasoningStep, RefundDecision } from "@/lib/agent/tools";

export interface MessageItem {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  reasoningSteps?: ReasoningStep[];
  decision?: RefundDecision;
}

interface ChatInterfaceProps {
  messages: MessageItem[];
  onSendMessage: (query: string) => Promise<void>;
  isLoading: boolean;
  onSelectReasoningLogs: (steps: ReasoningStep[]) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectReasoningLogs
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const SAMPLE_PROMPTS = [
    {
      label: "✅ Standard Refund (ORD-1001)",
      text: "I bought headphones in Order #ORD-1001 10 days ago. They are unopened. Can I get a full refund?",
      type: "success"
    },
    {
      label: "❌ Final Sale Denial (ORD-1005)",
      text: "I want to return my dress from Order #ORD-1005 (Clearance Final Sale).",
      type: "danger"
    },
    {
      label: "⚠️ High Risk Escalation (ORD-1006)",
      text: "I'd like to return my Smart Watch from Order #ORD-1006.",
      type: "warning"
    },
    {
      label: "❌ Digital License Denial (ORD-1007)",
      text: "I bought a Photo Editing License Key in Order #ORD-1007 by mistake. Please refund.",
      type: "danger"
    },
    {
      label: "⭐ VIP Grace Extension (ORD-1010)",
      text: "I am a VIP member requesting a refund for Order #ORD-1010 (Briefcase bought 38 days ago).",
      type: "info"
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto p-4 gap-4">
      {/* Quick Test Demo Prompts */}
      <div className="glass-panel p-3.5 rounded-2xl border border-indigo-500/20 bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Quick Demo Scenario Prompts
          </span>
          <span className="text-[11px] text-slate-400">Click any preset to trigger instant agent evaluation</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => onSendMessage(prompt.text)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 text-slate-200 hover:bg-indigo-600 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <span>{prompt.label}</span>
              <ArrowRight className="w-3 h-3 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log Area */}
      <div className="flex-1 glass-panel rounded-2xl p-4 lg:p-6 overflow-y-auto space-y-6 border border-slate-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">Apex E-Commerce Customer Support</h3>
            <p className="text-sm max-w-md text-slate-400">
              Hello! I am your AI refund support assistant. Ask me to process a return or verify your eligibility using your Order ID.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 max-w-3xl ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm ${
                  msg.sender === "user"
                    ? "bg-slate-700 text-slate-200"
                    : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                }`}
              >
                {msg.sender === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Content */}
              <div className="space-y-2.5 flex-1">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20"
                      : "bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/60"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Decision Badge Card (Agent messages only) */}
                {msg.decision && (
                  <div className="glass-card p-3 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {msg.decision.status === "APPROVED" && (
                        <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          REFUND APPROVED
                        </span>
                      )}
                      {msg.decision.status === "DENIED" && (
                        <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg flex items-center gap-1.5">
                          <ShieldX className="w-4 h-4" />
                          REFUND DENIED
                        </span>
                      )}
                      {msg.decision.status === "ESCALATED" && (
                        <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          HUMAN ESCALATION
                        </span>
                      )}

                      <span className="text-xs text-slate-400 font-mono">
                        Order #{msg.decision.orderId}
                      </span>
                    </div>

                    {msg.reasoningSteps && (
                      <button
                        onClick={() => onSelectReasoningLogs(msg.reasoningSteps!)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        Inspect Reasoning Steps ({msg.reasoningSteps.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading / Thinking Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 max-w-xl mr-auto">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-800/90 border border-indigo-500/30 text-sm text-indigo-300 flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span>Agent evaluating policy rules, checking CRM history & risk matrix...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a refund question or enter your Order ID (e.g., 'I want a refund for ORD-1001')..."
          className="flex-1 bg-slate-900/90 text-white border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
