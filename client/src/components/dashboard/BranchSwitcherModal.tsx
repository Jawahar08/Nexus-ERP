'use client';

import React, { useState } from 'react';
import { Store, MapPin, X, Check, ArrowRight, Building2, Package } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

export default function BranchSwitcherModal({
  isOpen,
  onClose,
  branches,
  activeBranchId,
  onSelectBranch,
}: {
  isOpen: boolean;
  onClose: () => void;
  branches: any[];
  activeBranchId?: string;
  onSelectBranch: (branchId: string | null) => void;
}) {
  const { formatAmount } = useCurrencyStore();
  const [selectedId, setSelectedId] = useState<string | null>(activeBranchId || null);

  if (!isOpen) return null;

  const handleApply = (id: string | null) => {
    setSelectedId(id);
    onSelectBranch(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass max-w-lg w-full p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/95 relative shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Store size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                Multi-Branch Switcher
              </span>
              <h3 className="text-base font-bold text-white leading-tight">Select Active Store Branch</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Switch active branch context to filter inventory, orders, and financial P&L by physical store location.
        </p>

        {/* Branch List */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          
          {/* Consolidated All-Branches Option */}
          <div
            onClick={() => handleApply(null)}
            className={`p-4 rounded-xl border transition flex items-center justify-between cursor-pointer ${
              selectedId === null
                ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                : 'bg-white/[0.02] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                <Building2 size={16} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Consolidated (All Branches & Warehouses)</h4>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Unified global store operations view</p>
              </div>
            </div>
            {selectedId === null && <Check size={16} className="text-indigo-400 shrink-0" />}
          </div>

          {/* Individual Physical Store Branches */}
          {branches.map((branch) => {
            const isSelected = selectedId === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => handleApply(branch.id)}
                className={`p-4 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-300 flex items-center justify-center font-bold text-xs">
                    <Store size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{branch.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                      <MapPin size={10} className="text-zinc-500" />
                      {branch.location || 'Primary Store Facility'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block">Asset Value</span>
                    <strong className="text-emerald-400">{formatAmount(branch.totalAssetValue, { decimals: 0 })}</strong>
                  </div>
                  {isSelected && <Check size={16} className="text-indigo-400 shrink-0" />}
                </div>
              </div>
            );
          })}

        </div>

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition border border-white/10"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
