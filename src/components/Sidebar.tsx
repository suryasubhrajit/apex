"use client";

import React from "react";
import { Inbox, Mic, Cpu, Users, FileCheck, Settings, Bot, Zap, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export type EnterpriseTab = "workspace" | "voice" | "telemetry" | "crm" | "policy" | "settings";

interface NavItem {
  id: EnterpriseTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  dot?: "success" | "danger" | "warning";
  group: "ops" | "data";
}

interface SidebarProps {
  activeTab: EnterpriseTab;
  setActiveTab: (tab: EnterpriseTab) => void;
  openTicketsCount: number;
  providerName: string;
  hasApiKey: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab, setActiveTab, openTicketsCount, providerName, hasApiKey
}) => {
  const navItems: NavItem[] = [
    { id: "workspace", label: "Tickets & Co-Pilot", icon: <Inbox size={14} />, badge: openTicketsCount, group: "ops" },
    { id: "voice",     label: "Voice Console",      icon: <Mic size={14} />,   dot: "danger", group: "ops" },
    { id: "telemetry", label: "Agent Telemetry",    icon: <Cpu size={14} />,   group: "ops" },
    { id: "crm",       label: "CRM Directory",      icon: <Users size={14} />, group: "data" },
    { id: "policy",    label: "Refund Policy",      icon: <FileCheck size={14} />, group: "data" },
  ];

  const opsItems  = navItems.filter(i => i.group === "ops");
  const dataItems = navItems.filter(i => i.group === "data");

  const NavBtn = ({ item }: { item: NavItem }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
          isActive
            ? "bg-[color:var(--accent-muted)] text-[color:var(--accent)] border border-[color:var(--accent-border)]"
            : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-elevated)]"
        }`}
      >
        <span className={`flex-shrink-0 ${isActive ? "text-[color:var(--accent)]" : "text-[color:var(--text-muted)]"}`}>
          {item.icon}
        </span>
        <span className="flex-1 text-left truncate">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-sm bg-[color:var(--accent)] text-white leading-none">
            {item.badge}
          </span>
        )}
        {item.dot && (
          <span className={`status-dot ${item.dot === "danger" ? "error" : item.dot}`} />
        )}
      </button>
    );
  };

  return (
    <aside className="w-[200px] flex-shrink-0 flex flex-col h-screen bg-[color:var(--bg-surface)] border-r border-[color:var(--border-main)]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[color:var(--border-sub)]">
        <div className="w-8 h-8 rounded-lg bg-[color:var(--accent)] flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-[color:var(--text-primary)] tracking-wide">APEX SERVICE</span>
            <span className="badge badge-accent px-1 py-0 text-[9px]">HQ</span>
          </div>
          <span className="text-[10px] text-[color:var(--text-muted)] truncate block">Enterprise AI Suite</span>
        </div>
      </div>

      {/* Agent status pill */}
      <div className="px-3 py-2.5 border-b border-[color:var(--border-sub)]">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[color:var(--bg-elevated)] border border-[color:var(--border-sub)]">
          <span className="status-dot live" />
          <span className="text-[11px] text-[color:var(--text-secondary)] font-medium capitalize truncate">{providerName} Agent</span>
          <span className="text-[10px] text-[color:var(--text-caption)] ml-auto font-mono">v4.2</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        <div>
          <span className="label px-2 mb-1.5 block">Operations</span>
          <div className="space-y-0.5">
            {opsItems.map(item => <NavBtn key={item.id} item={item} />)}
          </div>
        </div>

        <div>
          <span className="label px-2 mb-1.5 block">Data & Rules</span>
          <div className="space-y-0.5">
            {dataItems.map(item => <NavBtn key={item.id} item={item} />)}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[color:var(--border-sub)] space-y-0.5">
        <button
          onClick={() => setActiveTab("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === "settings"
              ? "bg-[color:var(--accent-muted)] text-[color:var(--accent)] border border-[color:var(--accent-border)]"
              : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-elevated)]"
          }`}
        >
          <Settings size={14} className="text-[color:var(--text-muted)] flex-shrink-0" />
          <span className="flex-1 text-left">Settings & Keys</span>
          {hasApiKey
            ? <CheckCircle2 size={12} className="text-[color:var(--success)]" />
            : <AlertCircle size={12} className="text-[color:var(--warning)]" />
          }
        </button>

        <button
          onClick={async () => {
            try {
              await fetch("/api/reset", { method: "POST" });
              alert("CRM Database state reset successfully! All 15 order profiles are ready for testing.");
              window.location.reload();
            } catch (e) {
              console.error(e);
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-elevated)] transition-all"
        >
          <RefreshCw size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
          <span>Reset CRM Data</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1">
          <Zap size={11} className="text-[color:var(--success)]" />
          <span className="text-[10px] text-[color:var(--text-muted)]">AI Engine</span>
          <span className="text-[10px] text-[color:var(--success)] font-semibold ml-auto">Ready</span>
        </div>
      </div>
    </aside>
  );
};
