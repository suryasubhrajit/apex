"use client";

import React, { useState } from "react";
import { REFUND_POLICY_DOCUMENT } from "@/data/refund-policy";
import { Ban, CheckCircle2 } from "lucide-react";

export const PolicyViewer: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(REFUND_POLICY_DOCUMENT.rules.map(r => r.category)))];
  const filtered = activeCategory === "All"
    ? REFUND_POLICY_DOCUMENT.rules
    : REFUND_POLICY_DOCUMENT.rules.filter(r => r.category === activeCategory);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[color:var(--bg-base)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-neutral">Official Policy Spec v{REFUND_POLICY_DOCUMENT.version}</span>
              <span className="text-[10px] text-[color:var(--text-muted)] font-mono">Effective {REFUND_POLICY_DOCUMENT.effectiveDate}</span>
            </div>
            <h2 className="text-base font-bold text-[color:var(--text-primary)]">{REFUND_POLICY_DOCUMENT.title}</h2>
            <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5 max-w-2xl">{REFUND_POLICY_DOCUMENT.summary}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="label mb-1">Total Rules</p>
            <p className="text-2xl font-extrabold text-[color:var(--accent)]">{REFUND_POLICY_DOCUMENT.rules.length}</p>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-[color:var(--border-sub)] bg-[color:var(--bg-surface)] overflow-x-auto flex-shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn btn-sm flex-shrink-0 ${activeCategory === cat ? "btn-primary" : "btn-ghost"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rules grid */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(rule => (
            <div
              key={rule.id}
              className={`panel p-4 space-y-3 ${rule.isStrict ? "border-l-2 border-l-[color:var(--danger)]" : "border-l-2 border-l-[color:var(--success)]"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="badge badge-accent font-mono">{rule.id}</span>
                <span className={`badge ${rule.isStrict ? "badge-danger" : "badge-success"} flex-shrink-0`}>
                  {rule.isStrict
                    ? <><Ban size={9} /> Strict</>
                    : <><CheckCircle2 size={9} /> Conditional</>
                  }
                </span>
              </div>
              <div>
                <span className="label mb-1 block">{rule.category}</span>
                <h3 className="text-xs font-bold text-[color:var(--text-primary)] mb-2">{rule.title}</h3>
                <p className="text-[11px] text-[color:var(--text-secondary)] leading-relaxed">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
