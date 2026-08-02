"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, EnterpriseTab } from "@/components/Sidebar";
import { TicketCommandCenter, TicketItem } from "@/components/TicketCommandCenter";
import { VoiceConsole } from "@/components/VoiceConsole";
import { TelemetryDashboard } from "@/components/TelemetryDashboard";
import { CrmViewer } from "@/components/CrmViewer";
import { PolicyViewer } from "@/components/PolicyViewer";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CRM_DATABASE } from "@/data/crm-data";
import { ReasoningStep, RefundDecision } from "@/lib/agent/tools";

export default function Home() {
  const [activeTab, setActiveTab]   = useState<EnterpriseTab>("workspace");
  const [provider, setProvider]     = useState<string>("gemini");
  const [apiKey, setApiKey]         = useState<string>("");
  const [isLoading, setIsLoading]   = useState<boolean>(false);

  const [tickets, setTickets] = useState<TicketItem[]>([
    {
      id: "TCK-1001",
      ticketNumber: "TCK-1001",
      customer: CRM_DATABASE[0],
      order: CRM_DATABASE[0].orders[0],
      status: "OPEN",
      priority: "HIGH",
      subject: "Refund request – Noise-Canceling Headphones (ORD-1001)",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "m-init-1",
          sender: "user",
          text: "Hi, I bought headphones in Order #ORD-1001 10 days ago. They are still unopened. Can I get a full refund?",
          timestamp: new Date().toISOString()
        }
      ]
    },
    {
      id: "TCK-1005",
      ticketNumber: "TCK-1005",
      customer: CRM_DATABASE[4],
      order: CRM_DATABASE[4].orders[0],
      status: "OPEN",
      priority: "MEDIUM",
      subject: "Clearance item return inquiry (ORD-1005)",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "m-init-2",
          sender: "user",
          text: "I want to return the designer dress from Order #ORD-1005 (Clearance Final Sale).",
          timestamp: new Date().toISOString()
        }
      ]
    },
    {
      id: "TCK-1006",
      ticketNumber: "TCK-1006",
      customer: CRM_DATABASE[5],
      order: CRM_DATABASE[5].orders[0],
      status: "ESCALATED",
      priority: "HIGH",
      subject: "Smart Watch return – High-risk account alert (ORD-1006)",
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: "m-init-3",
          sender: "user",
          text: "I'd like to return my Smart Fitness Watch from Order #ORD-1006.",
          timestamp: new Date().toISOString()
        }
      ]
    }
  ]);

  const [activeTicketId, setActiveTicketId] = useState<string>("TCK-1001");
  const [currentSteps, setCurrentSteps]     = useState<ReasoningStep[]>([]);
  const [currentDecision, setCurrentDecision] = useState<RefundDecision | undefined>();
  const [allSessions, setAllSessions]       = useState<any[]>([]);

  // Load persisted settings
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = localStorage.getItem("APEX_AI_PROVIDER");
    const k = localStorage.getItem("APEX_AI_API_KEY");
    if (p) setProvider(p);
    if (k) setApiKey(k);
  }, []);

  const handleSendMessage = async (ticketId: string, query: string, isHumanTakeover: boolean) => {
    // Append sender message
    setTickets(prev => prev.map(t =>
      t.id !== ticketId ? t : {
        ...t,
        messages: [...t.messages, {
          id: `msg-${Date.now()}`,
          sender: isHumanTakeover ? "human_agent" : "user",
          text: query,
          timestamp: new Date().toISOString()
        }]
      }
    ));

    if (isHumanTakeover) return;

    setIsLoading(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, provider, apiKey })
      });
      const data = await res.json();

      if (res.ok && data) {
        setTickets(prev => prev.map(t =>
          t.id !== ticketId ? t : {
            ...t,
            status: data.decision?.status === "ESCALATED" ? "ESCALATED" : "RESOLVED",
            messages: [...t.messages, {
              id: `agent-${Date.now()}`,
              sender: "agent",
              text: data.message,
              timestamp: new Date().toISOString(),
              reasoningSteps: data.reasoningSteps,
              decision: data.decision
            }]
          }
        ));
        setCurrentSteps(data.reasoningSteps || []);
        setCurrentDecision(data.decision);
        setAllSessions(prev => [{
          id: `sess-${Date.now()}`,
          timestamp: new Date().toISOString(),
          query,
          steps: data.reasoningSteps || [],
          decision: data.decision
        }, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectTelemetry = (steps: ReasoningStep[]) => {
    setCurrentSteps(steps);
    setActiveTab("telemetry");
  };

  const activeTicket     = tickets.find(t => t.id === activeTicketId);
  const latestAgentMsg   = activeTicket?.messages.filter(m => m.sender === "agent").pop()?.text;
  const openTicketsCount = tickets.filter(t => t.status !== "RESOLVED").length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[color:var(--bg-base)] text-[color:var(--text-primary)]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openTicketsCount={openTicketsCount}
        providerName={provider}
        hasApiKey={Boolean(apiKey)}
      />

      {/* Main content — full height flex column */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {activeTab === "workspace" && (
          <TicketCommandCenter
            tickets={tickets}
            activeTicketId={activeTicketId}
            onSelectTicket={setActiveTicketId}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onInspectTelemetry={handleInspectTelemetry}
          />
        )}
        {activeTab === "voice" && (
          <VoiceConsole
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            latestAgentResponse={latestAgentMsg}
            activeTicketId={activeTicketId}
          />
        )}
        {activeTab === "telemetry" && (
          <TelemetryDashboard
            reasoningSteps={currentSteps}
            decision={currentDecision}
            allSessions={allSessions}
            onSelectSession={s => { setCurrentSteps(s.steps); setCurrentDecision(s.decision); }}
          />
        )}
        {activeTab === "crm" && (
          <CrmViewer
            onRunTestPrompt={q => { setActiveTab("workspace"); handleSendMessage(activeTicketId, q, false); }}
          />
        )}
        {activeTab === "policy"   && <PolicyViewer />}
        {activeTab === "settings" && (
          <SettingsPanel
            provider={provider}
            setProvider={setProvider}
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        )}
      </main>
    </div>
  );
}
