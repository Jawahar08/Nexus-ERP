'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Volume2, VolumeX, TrendingUp, AlertTriangle, PackageCheck, Store, ChevronRight } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

export default function MorningBriefingBanner({
  onOpenBranchSwitcher,
}: {
  onOpenBranchSwitcher: () => void;
}) {
  const { formatAmount } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const fetchBriefing = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/morning-briefing');
      if (res.ok) {
        const data = await res.json();
        setBriefing(data);
      }
    } catch (err) {
      console.error('Failed to load morning briefing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const toggleAudioSpeech = () => {
    if (!briefing?.spokenText) return;

    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(briefing.spokenText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert('Text-to-speech audio is not supported in this browser environment.');
    }
  };

  if (loading || !briefing) {
    return (
      <div className="glass p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun size={18} className="animate-spin text-amber-400" />
          <span className="text-xs text-amber-200 font-medium">Preparing Executive Morning Briefing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-indigo-950/30 flex flex-col gap-4 relative overflow-hidden shadow-xl">
      
      {/* Top Briefing Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Sun size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Executive Morning Briefing
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Daily AI Digest
              </span>
            </div>
            <h3 className="font-bold text-base text-white">{briefing.storeName} Overview</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleAudioSpeech}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
              isPlayingAudio
                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-amber-300 border-white/10'
            }`}
          >
            {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isPlayingAudio ? 'Pause Briefing' : 'Listen to Morning Audio'}
          </button>

          <button
            onClick={onOpenBranchSwitcher}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Store size={14} />
            Branches ({briefing.branches?.length || 1})
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1: Net Revenue */}
        <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Yesterday's Net Profit</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatAmount(briefing.yesterdayRevenue, { decimals: 2 })}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} /> +{briefing.growthPercent}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">vs 30-day daily avg ({formatAmount(briefing.dailyAvg)})</span>
        </div>

        {/* Metric 2: Top Selling Product */}
        <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Top Seller (24h)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-indigo-300 truncate max-w-[150px]">
              {briefing.topProduct}
            </span>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              {briefing.unitsSold} units sold
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Primary revenue driver</span>
        </div>

        {/* Metric 3: Restock Alert */}
        <div className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle size={12} /> Restock Warnings
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">
              {briefing.criticalRestockCount} SKUs
            </span>
            <span className="text-[10px] font-bold text-amber-300 uppercase bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Action Needed
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 truncate mt-1 block font-mono">
            {briefing.criticalItems?.join(', ') || 'No critical stockouts'}
          </span>
        </div>

      </div>

    </div>
  );
}
