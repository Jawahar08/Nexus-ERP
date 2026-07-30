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
    <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 flex flex-col gap-4 relative overflow-hidden shadow-xs text-[#14171F]">
      
      {/* Top Briefing Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#14171F]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F5C84B] flex items-center justify-center text-[#14171F] shadow-xs">
            <Sun size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#5C64ED] uppercase tracking-widest block font-mono">
                Executive Morning Briefing
              </span>
              <span className="bg-[#F5C84B]/20 text-[#14171F] border border-[#F5C84B]/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Daily AI Digest
              </span>
            </div>
            <h3 className="font-serif font-bold text-lg text-[#14171F]">{briefing.storeName} Overview</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleAudioSpeech}
            className={`px-3.5 py-2 rounded-full text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
              isPlayingAudio
                ? 'bg-[#5C64ED] text-white border-[#5C64ED] animate-pulse'
                : 'bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] border-[#14171F]/10'
            }`}
          >
            {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isPlayingAudio ? 'Pause Briefing' : 'Listen to Morning Audio'}
          </button>

          <button
            onClick={onOpenBranchSwitcher}
            className="px-3.5 py-2 rounded-full bg-[#14171F] hover:bg-[#202532] text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
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
        <div className="bg-[#FAF7F2] border border-[#14171F]/10 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-[#4F5565] font-bold uppercase tracking-wider block font-mono">Yesterday's Net Profit</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-emerald-600">
              {formatAmount(briefing.yesterdayRevenue, { decimals: 2 })}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-0.5 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} /> +{briefing.growthPercent}%
            </span>
          </div>
          <span className="text-[10px] text-[#4F5565] font-mono mt-1 block">vs 30-day daily avg ({formatAmount(briefing.dailyAvg)})</span>
        </div>

        {/* Metric 2: Top Selling Product */}
        <div className="bg-[#FAF7F2] border border-[#14171F]/10 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-[#4F5565] font-bold uppercase tracking-wider block font-mono">Top Seller (24h)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-[#5C64ED] truncate max-w-[150px]">
              {briefing.topProduct}
            </span>
            <span className="text-xs font-mono font-bold text-[#5C64ED] bg-[#5C64ED]/10 border border-[#5C64ED]/30 px-2 py-0.5 rounded-full">
              {briefing.unitsSold} units sold
            </span>
          </div>
          <span className="text-[10px] text-[#4F5565] font-mono mt-1 block">Primary revenue driver</span>
        </div>

        {/* Metric 3: Restock Alert */}
        <div className="bg-[#FFF9EC] border border-amber-400/40 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block flex items-center gap-1 font-mono">
            <AlertTriangle size={12} /> Restock Warnings
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-800">
              {briefing.criticalRestockCount} SKUs
            </span>
            <span className="text-[10px] font-bold text-amber-800 uppercase bg-amber-200 border border-amber-400/50 px-2 py-0.5 rounded-full font-mono">
              Action Needed
            </span>
          </div>
          <span className="text-[10px] text-amber-700 truncate mt-1 block font-mono">
            {briefing.criticalItems?.join(', ') || 'No critical stockouts'}
          </span>
        </div>

      </div>

    </div>
  );
}
