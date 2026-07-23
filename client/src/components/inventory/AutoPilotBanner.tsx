'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, RefreshCw, MessageSquare, Mail, CheckCircle2 } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

export default function AutoPilotBanner({ onRestockExecuted }: { onRestockExecuted?: () => void }) {
  const { formatAmount } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [autopilotData, setAutopilotData] = useState<any>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchAutopilot = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/ai-autopilot');
      if (res.ok) {
        const payload = await res.json();
        setAutopilotData(payload);
      }
    } catch (err) {
      console.error('Failed to load AI Autopilot restock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutopilot();
  }, []);

  const handleAutoDispatchPO = async (item: any, mode: 'whatsapp' | 'email' | 'db') => {
    try {
      setDispatchingId(item.id);
      const res = await fetch('/api/inventory/auto-restock-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.id,
          qty: item.recommendedQty,
          supplierId: item.supplier?.id,
          totalCost: item.estimatedCost,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (mode === 'whatsapp' && result.whatsappUrl) {
          window.open(result.whatsappUrl, '_blank');
        } else if (mode === 'email' && result.mailtoUrl) {
          window.open(result.mailtoUrl, '_blank');
        } else {
          alert(`PO successfully generated for ${item.name} (+${item.recommendedQty} units).`);
        }
        if (onRestockExecuted) onRestockExecuted();
        fetchAutopilot();
      }
    } catch (err) {
      alert('Failed to dispatch auto-restock PO');
    } finally {
      setDispatchingId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass p-5 rounded-xl border border-indigo-500/20 bg-indigo-950/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw size={18} className="animate-spin text-indigo-400" />
          <span className="text-xs text-indigo-300 font-medium">AI Auto-Pilot analyzing sales velocity & stockout predictions...</span>
        </div>
      </div>
    );
  }

  if (!autopilotData || autopilotData.items.length === 0) return null;

  const urgentItems = autopilotData.items.filter((i: any) => i.isUrgent);

  return (
    <div className="glass p-6 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/40 to-purple-950/20 flex flex-col gap-4 relative overflow-hidden shadow-lg">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">AI Inventory Auto-Pilot & Predictive Restocking</h3>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Velocity Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Predictive algorithm monitors stock burn rate and auto-generates supplier POs before stockouts occur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAutopilot}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh Engine
          </button>
        </div>
      </div>

      {/* Critical Restock Alerts Grid */}
      {urgentItems.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="animate-pulse" />
              {urgentItems.length} Critical Items Predicted to Run Out Soon
            </span>
            <span className="text-zinc-400 text-[11px] font-mono">
              Estimated Restock Budget: <strong className="text-white">{formatAmount(autopilotData.summary.estimatedTotalRestockBudget, { decimals: 2 })}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 p-4 rounded-xl flex flex-col justify-between gap-3 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white leading-tight">{item.name}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      SKU: {item.sku} &bull; Supplier: <span className="text-indigo-300">{item.supplier?.name || 'Primary Supplier'}</span>
                    </p>
                  </div>
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0">
                    {item.daysRemaining <= 0 ? 'Stockout Risk' : `~${item.daysRemaining} days left`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-zinc-500 block uppercase">Current</span>
                    <span className="font-bold text-white">{item.stock}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 block uppercase">Daily Burn</span>
                    <span className="font-bold text-amber-400">{item.dailyBurnRate} u/day</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 block uppercase">AI Re-order</span>
                    <span className="font-bold text-indigo-400">+{item.recommendedQty} units</span>
                  </div>
                </div>

                {/* Dispatch PO Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono text-zinc-400">
                    Est. PO Value: <strong className="text-white">{formatAmount(item.estimatedCost, { decimals: 2 })}</strong>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAutoDispatchPO(item, 'whatsapp')}
                      disabled={dispatchingId === item.id}
                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <MessageSquare size={12} /> WhatsApp PO
                    </button>
                    <button
                      onClick={() => handleAutoDispatchPO(item, 'email')}
                      disabled={dispatchingId === item.id}
                      className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Mail size={12} /> Email PO
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} /> All products are at optimal safety stock parameters. Zero imminent stockout risks predicted.
          </span>
          <span className="font-mono text-[11px] text-zinc-400">Total Tracked: {autopilotData.summary.totalTracked} SKUs</span>
        </div>
      )}

    </div>
  );
}
