'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, DollarSign, Award, RefreshCw, Star, CheckCircle2 } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

export default function StaffCommissionsHub() {
  const { formatAmount } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [commissionsData, setCommissionsData] = useState<any>(null);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr/commissions');
      if (res.ok) {
        const payload = await res.json();
        setCommissionsData(payload);
      }
    } catch (err) {
      console.error('Failed to load commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl border border-indigo-500/20 bg-slate-900/60 flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin text-indigo-400" />
          <span className="text-xs text-indigo-300 font-medium">Calculating real-time staff sales commissions & payouts...</span>
        </div>
      </div>
    );
  }

  if (!commissionsData) return null;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <div className="glass p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
            <Trophy size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Staff Sales Commission & Bonus Tracker</h3>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Real-Time Incentive Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automatically tracks closed deals and sales transactions per employee to calculate monthly 5% sales commission payouts.
            </p>
          </div>
        </div>

        <button
          onClick={fetchCommissions}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RefreshCw size={13} /> Refresh Leaderboard
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl border border-white/10 bg-slate-900/60">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Active Sales Representatives</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">{commissionsData.summary.totalStaff} Reps</span>
        </div>

        <div className="glass p-4 rounded-xl border border-white/10 bg-slate-900/60">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Store Sales Closed</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {formatAmount(commissionsData.summary.totalSalesVolume, { decimals: 2 })}
          </span>
        </div>

        <div className="glass p-4 rounded-xl border border-indigo-500/30 bg-slate-900/60">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Total Monthly Commission Payout</span>
          <span className="text-xl font-bold font-mono text-indigo-300 mt-1 block">
            {formatAmount(commissionsData.summary.totalCommissionPayout, { decimals: 2 })}
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass p-6 rounded-2xl border border-white/10 bg-slate-900/80">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
          <Star size={16} className="text-amber-400" />
          Employee Sales Performance & Payout Leaderboard
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 h-10 uppercase tracking-wider font-bold">
                <th className="pb-2">Employee Name</th>
                <th className="pb-2">Role & Dept</th>
                <th className="pb-2 text-right">Base Salary</th>
                <th className="pb-2 text-right">Sales Closed</th>
                <th className="pb-2 text-right">Rate</th>
                <th className="pb-2 text-right">Commission Bonus</th>
                <th className="pb-2 text-right">Total Monthly Payout</th>
                <th className="pb-2 text-center">Performance Tier</th>
              </tr>
            </thead>
            <tbody>
              {commissionsData.commissions.map((comm: any, idx: number) => (
                <tr key={comm.id} className="border-b border-white/5 hover:bg-white/[0.02] h-14 transition-colors">
                  <td className="font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] text-zinc-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <span>{comm.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono block font-normal">{comm.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-zinc-300">{comm.role}</span>
                    <span className="text-[10px] text-zinc-500 block">{comm.department}</span>
                  </td>
                  <td className="text-right font-mono text-zinc-400">{formatAmount(comm.salary, { decimals: 0 })}</td>
                  <td className="text-right font-mono font-bold text-white">{formatAmount(comm.salesVolume, { decimals: 2 })}</td>
                  <td className="text-right font-mono text-indigo-400 font-bold">{comm.commissionRate}</td>
                  <td className="text-right font-mono font-bold text-emerald-400">+{formatAmount(comm.commissionEarned, { decimals: 2 })}</td>
                  <td className="text-right font-mono font-bold text-white text-sm">{formatAmount(comm.totalPayout, { decimals: 2 })}</td>
                  <td className="text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border uppercase tracking-wider ${
                      comm.tier === 'Master Closer'
                        ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                        : comm.tier === 'Top Sales Rep'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-800 text-zinc-400 border-white/10'
                    }`}>
                      {comm.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
