"use client";

import React, { useState, useEffect } from "react";
import { Settings, Key, Cpu, CheckCircle2, AlertCircle, Save, Sliders, ExternalLink } from "lucide-react";

interface SettingsPanelProps {
  provider: string;
  setProvider: (p: string) => void;
  apiKey: string;
  setApiKey: (k: string) => void;
}

const PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "FREE TIER",
    badgeClass: "badge-success",
    desc: "Gemini 1.5 Flash / Pro — Free quota via Google AI Studio",
    link: "https://aistudio.google.com/",
    placeholder: "AIzaSy…"
  },
  {
    id: "openai",
    name: "OpenAI",
    badge: "GPT-4o",
    badgeClass: "badge-purple",
    desc: "GPT-4o & GPT-4o-mini with native function calling",
    link: "https://platform.openai.com/",
    placeholder: "sk-…"
  },
  {
    id: "mock",
    name: "Autonomous Engine",
    badge: "BUILT-IN",
    badgeClass: "badge-accent",
    desc: "High-speed built-in reasoning loop — no API key required",
    link: null,
    placeholder: ""
  },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  provider, setProvider, apiKey, setApiKey
}) => {
  const [keyInput, setKeyInput]       = useState(apiKey);
  const [temperature, setTemperature] = useState(0.2);
  const [saved, setSaved]             = useState(false);

  useEffect(() => { setKeyInput(apiKey); }, [apiKey]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(keyInput);
    if (typeof window !== "undefined") {
      localStorage.setItem("APEX_AI_PROVIDER", provider);
      localStorage.setItem("APEX_AI_API_KEY", keyInput);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const activeProvider = PROVIDERS.find(p => p.id === provider)!;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[color:var(--bg-base)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="badge badge-neutral"><Settings size={9} /> System Configuration</span>
          </div>
          <h2 className="text-base font-bold text-[color:var(--text-primary)]">AI Provider & API Key Settings</h2>
          <p className="text-[11px] text-[color:var(--text-muted)]">Configure LLM model provider, API key, temperature, and agent parameters</p>
        </div>
        {saved && (
          <span className="badge badge-success animate-slide-up">
            <CheckCircle2 size={10} /> Saved Successfully
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          {/* Provider selector */}
          <div>
            <label className="label mb-2 block">LLM Model Provider</label>
            <div className="grid grid-cols-3 gap-3">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`panel p-3 text-left space-y-2 transition-all ${
                    provider === p.id
                      ? "border-[color:var(--accent-border)] bg-[color:var(--accent-muted)]"
                      : "hover:border-[color:var(--border-main)] hover:bg-[color:var(--bg-elevated)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[color:var(--text-primary)]">{p.name}</span>
                    <span className={`badge ${p.badgeClass} flex-shrink-0`}>{p.badge}</span>
                  </div>
                  <p className="text-[10px] text-[color:var(--text-muted)] leading-relaxed">{p.desc}</p>
                  {provider === p.id && (
                    <span className="flex items-center gap-1 text-[10px] text-[color:var(--accent)] font-semibold">
                      <CheckCircle2 size={10} /> Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          {provider !== "mock" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label flex items-center gap-1">
                  <Key size={10} className="text-[color:var(--warning)]" />
                  API Key ({provider.toUpperCase()})
                </label>
                {activeProvider.link && (
                  <a
                    href={activeProvider.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[color:var(--accent)] flex items-center gap-0.5 hover:underline"
                  >
                    Get free key <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                className="input input-mono"
                placeholder={activeProvider.placeholder || `Enter ${provider} API key…`}
              />
              <p className="text-[11px] text-[color:var(--text-muted)] mt-1.5">
                Leave blank to use the <code className="text-[color:var(--text-secondary)] bg-[color:var(--bg-overlay)] px-1 rounded">.env.local</code> environment variable or built-in autonomous mode.
              </p>
            </div>
          )}

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label flex items-center gap-1">
                <Sliders size={10} className="text-[color:var(--cyan)]" />
                Model Temperature
              </label>
              <span className="text-xs font-bold text-[color:var(--accent)] font-mono">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-[11px] text-[color:var(--text-muted)] mt-1">
              Recommended: 0.0–0.2 for strict policy enforcement. Higher values allow more creative responses.
            </p>
          </div>

          {/* .env note */}
          <div className="card p-4 space-y-2">
            <span className="label flex items-center gap-1">Environment Configuration</span>
            <p className="text-[11px] text-[color:var(--text-secondary)]">
              Configure API keys in <code className="text-[color:var(--accent)] bg-[color:var(--bg-base)] px-1 rounded">.env.local</code> at the project root:
            </p>
            <pre className="code-block text-[color:var(--success)]">{`GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
AI_PROVIDER=gemini`}</pre>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary">
              <Save size={13} /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
