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
      <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <RefreshCw size={18} className="animate-spin text-[#5C64ED]" />
          <span className="text-xs text-[#4F5565] font-medium font-mono">
            AI Auto-Pilot analyzing sales velocity & stockout predictions...
          </span>
        </div>
      </div>
    );
  }

  if (!autopilotData || autopilotData.items.length === 0) return null;

  const urgentItems = autopilotData.items.filter((i: any) => i.isUrgent);

  return (
    <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 flex flex-col gap-5 relative overflow-hidden shadow-xs text-[#14171F]">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14171F]/10 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#5C64ED]/10 border border-[#5C64ED]/20 flex items-center justify-center text-[#5C64ED] shadow-2xs shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-[#14171F]">
                AI Inventory Auto-Pilot & Predictive Restocking
              </h3>
              <span className="bg-[#5C64ED]/10 text-[#5C64ED] border border-[#5C64ED]/20 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Live Velocity Engine
              </span>
            </div>
            <p className="text-xs text-[#4F5565] mt-0.5 font-medium">
              Predictive algorithm monitors stock burn rate and auto-generates supplier POs before stockouts occur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAutopilot}
            className="px-3.5 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] border border-[#14171F]/10 transition text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={13} className="text-[#5C64ED]" /> Refresh Engine
          </button>
        </div>
      </div>

      {/* Critical Restock Alerts Grid */}
      {urgentItems.length > 0 ? (
        <div className="space-y-4">
          
          {/* Summary Alert Pill */}
          <div className="bg-[#FFF9EC] border border-amber-300/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-mono font-bold text-amber-900">
              <AlertTriangle size={16} className="text-amber-700 shrink-0" />
              {urgentItems.length} Critical Items Predicted to Run Out Soon
            </span>
            <span className="text-[#4F5565] text-xs font-mono">
              Estimated Restock Budget: <strong className="text-[#14171F] font-bold text-sm ml-1">{formatAmount(autopilotData.summary.estimatedTotalRestockBudget, { decimals: 2 })}</strong>
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-[#FAF7F2] border border-[#14171F]/10 hover:border-[#5C64ED]/40 p-5 rounded-[22px] flex flex-col justify-between gap-4 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#14171F] leading-tight">{item.name}</h4>
                    <p className="text-xs text-[#4F5565] font-mono mt-1">
                      SKU: <span className="font-bold">{item.sku}</span> &bull; Supplier: <span className="text-[#5C64ED] font-semibold">{item.supplier?.name || 'Intelisys Inc.'}</span>
                    </p>
                  </div>
                  <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold font-mono text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                    {item.daysRemaining <= 0 ? 'Stockout Risk' : `~${item.daysRemaining} days left`}
                  </span>
                </div>

                {/* 3-Column Metrics Table */}
                <div className="grid grid-cols-3 gap-2 bg-white border border-[#14171F]/10 p-3 rounded-xl text-center font-mono shadow-2xs">
                  <div>
                    <span className="text-[10px] text-[#4F5565] block uppercase font-bold tracking-wider">Current</span>
                    <span className="font-bold text-[#14171F] text-sm block mt-0.5">{item.stock}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4F5565] block uppercase font-bold tracking-wider">Daily Burn</span>
                    <span className="font-bold text-amber-800 text-sm block mt-0.5">{item.dailyBurnRate} u/day</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4F5565] block uppercase font-bold tracking-wider">AI Re-order</span>
                    <span className="font-bold text-[#5C64ED] text-sm block mt-0.5">+{item.recommendedQty} units</span>
                  </div>
                </div>

                {/* Dispatch PO Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-[#14171F]/5">
                  <span className="text-xs font-mono text-[#4F5565]">
                    Est. PO Value: <strong className="text-[#14171F] font-bold text-sm ml-1">{formatAmount(item.estimatedCost, { decimals: 2 })}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAutoDispatchPO(item, 'whatsapp')}
                      disabled={dispatchingId === item.id}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <MessageSquare size={13} /> WhatsApp PO
                    </button>
                    <button
                      onClick={() => handleAutoDispatchPO(item, 'email')}
                      disabled={dispatchingId === item.id}
                      className="px-3.5 py-1.5 bg-[#14171F] hover:bg-[#202532] text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Mail size={13} /> Email PO
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-300 text-emerald-900 text-xs font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            All products are at optimal safety stock parameters. Zero imminent stockout risks predicted.
          </span>
          <span className="font-mono text-xs text-emerald-800 font-bold">Total Tracked: {autopilotData.summary.totalTracked} SKUs</span>
        </div>
      )}

    </div>
  );
}
