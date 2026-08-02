"use client";

import React, { useState } from "react";
import { CRM_DATABASE, CustomerProfile } from "@/data/crm-data";
import { Search, Play, CheckCircle2, XCircle, Package } from "lucide-react";

interface CrmViewerProps {
  onRunTestPrompt: (query: string) => void;
}

export const CrmViewer: React.FC<CrmViewerProps> = ({ onRunTestPrompt }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<CustomerProfile>(CRM_DATABASE[0]);

  const filtered = CRM_DATABASE.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.orders.some(o => o.orderId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[color:var(--bg-base)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex items-center gap-4 flex-shrink-0">
        <div className="flex-1">
          <h2 className="text-base font-bold text-[color:var(--text-primary)]">CRM Database Inspector</h2>
          <p className="text-[11px] text-[color:var(--text-muted)]">
            {CRM_DATABASE.length} customer profiles · Purchase history, member tiers, risk scores & return eligibility
          </p>
        </div>
        <div className="relative w-72">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
          <input
            className="input pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search name, email, CUST-ID, ORD-ID…"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Customer list */}
        <div className="w-[300px] flex-shrink-0 border-r border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex flex-col">
          <div className="px-3 py-2 border-b border-[color:var(--border-sub)]">
            <span className="label">Customer Directory ({filtered.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.map(c => (
              <div
                key={c.customerId}
                onClick={() => setSelected(c)}
                className={`card-hover p-3 space-y-2 ${selected.customerId === c.customerId ? "active" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-[color:var(--text-primary)]">{c.name}</span>
                  <span className={`badge ${c.memberTier === "VIP" ? "badge-purple" : c.memberTier === "Regular" ? "badge-accent" : "badge-neutral"}`}>
                    {c.memberTier}
                  </span>
                </div>
                <p className="text-[11px] text-[color:var(--text-muted)] truncate">{c.email}</p>
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[color:var(--border-sub)]">
                  <span className="text-[color:var(--text-caption)] font-mono">{c.customerId}</span>
                  <span className={`font-semibold ${c.riskScore > 50 ? "text-[color:var(--danger)]" : "text-[color:var(--success)]"}`}>
                    Risk {c.riskScore}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer detail */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Identity header */}
          <div className="panel p-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[color:var(--bg-overlay)] border border-[color:var(--border-main)] flex items-center justify-center text-base font-bold text-[color:var(--text-secondary)]">
                {selected.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[color:var(--text-primary)]">{selected.name}</h3>
                  <span className={`badge ${selected.memberTier === "VIP" ? "badge-purple" : selected.memberTier === "Regular" ? "badge-accent" : "badge-neutral"}`}>
                    {selected.memberTier}
                  </span>
                </div>
                <p className="text-xs text-[color:var(--text-muted)]">{selected.email} · {selected.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="label">Total Lifetime Value</p>
              <p className="text-xl font-extrabold text-[color:var(--success)]">${selected.totalSpent.toFixed(2)}</p>
            </div>
          </div>

          {/* Metric row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Orders",    val: selected.totalOrdersCount,                                 color: "" },
              { label: "Prior Refunds",   val: `${selected.priorRefundsCount} ($${selected.priorRefundsTotal.toFixed(0)})`, color: "text-[color:var(--warning)]" },
              { label: "Fraud Risk",      val: `${selected.riskScore}/100`,                              color: selected.riskScore > 50 ? "text-[color:var(--danger)]" : "text-[color:var(--success)]" },
            ].map(m => (
              <div key={m.label} className="card p-3 text-center">
                <p className="label mb-1">{m.label}</p>
                <p className={`text-sm font-bold ${m.color || "text-[color:var(--text-primary)]"}`}>{m.val}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="card p-3">
            <span className="label mb-1 block">CRM Account Notes</span>
            <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">{selected.notes}</p>
          </div>

          {/* Orders */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={13} className="text-[color:var(--accent)]" />
              <span className="text-xs font-semibold text-[color:var(--text-primary)]">Purchase Orders ({selected.orders.length})</span>
            </div>
            <div className="space-y-3">
              {selected.orders.map(ord => (
                <div key={ord.orderId} className="panel p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[color:var(--text-primary)] font-mono">{ord.orderId}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[color:var(--text-muted)]">Delivered {ord.deliveryDate}</span>
                      <span className="text-xs font-bold text-[color:var(--success)]">${ord.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {ord.items.map(item => (
                      <div key={item.id} className="card px-3 py-2 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-[color:var(--text-secondary)]">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[color:var(--text-muted)]">
                            <span>{item.category}</span>
                            {item.condition && <><span>·</span><span>{item.condition}</span></>}
                            {item.isFinalSale && <span className="badge badge-danger">Final Sale</span>}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[color:var(--text-secondary)]">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => onRunTestPrompt(`I want to request a refund for Order #${ord.orderId}`)}
                      className="btn btn-primary btn-sm"
                    >
                      <Play size={11} fill="white" /> Test Agent for #{ord.orderId}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
