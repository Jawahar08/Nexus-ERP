'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Zap,
  Percent,
  CheckCircle2,
  X,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

interface Promotion {
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageCount: number;
  maxUsage: number;
  expiryDate: string;
  isActive: boolean;
  bannerHeadline?: string;
}

export default function PromotionsManagerHub() {
  const { formatAmount } = useCurrencyStore();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State for New Promo Code
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [newDiscountVal, setNewDiscountVal] = useState('20');
  const [newMinOrderVal, setNewMinOrderVal] = useState('30');
  const [newMaxDiscount, setNewMaxDiscount] = useState('100');
  const [newMaxUsage, setNewMaxUsage] = useState('500');
  const [newExpiryDate, setNewExpiryDate] = useState('2026-12-31');
  const [newBannerHeadline, setNewBannerHeadline] = useState('');

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shop/promotions');
      if (res.ok) {
        const payload = await res.json();
        setPromotions(payload.promotions || []);
      }
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const togglePromo = async (code: string) => {
    try {
      const res = await fetch(`/api/shop/promotions/${code}/toggle`, {
        method: 'PUT',
      });
      if (res.ok) {
        const payload = await res.json();
        setPromotions((prev) =>
          prev.map((p) => (p.code === code ? payload.promotion : p))
        );
      }
    } catch (err) {
      alert('Failed to toggle promotion');
    }
  };

  const handleCreatePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/shop/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          description: newDesc,
          discountType: newDiscountType,
          discountValue: parseFloat(newDiscountVal) || 10,
          minOrderValue: parseFloat(newMinOrderVal) || 0,
          maxDiscount: parseFloat(newMaxDiscount) || 100,
          maxUsage: parseInt(newMaxUsage, 10) || 500,
          expiryDate: newExpiryDate,
          bannerHeadline: newBannerHeadline,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        setPromotions((prev) => [payload.promotion, ...prev.filter((p) => p.code !== payload.promotion.code)]);
        setShowCreateModal(false);
        setNewCode('');
        setNewDesc('');
        setNewBannerHeadline('');
      } else {
        alert('Failed to create promotion');
      }
    } catch (err) {
      alert('Network error creating promo code');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activePromosCount = promotions.filter((p) => p.isActive).length;
  const totalUsesCount = promotions.reduce((acc, p) => acc + p.usageCount, 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP HEADER BAR & SUMMARY METRICS                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="glass p-5 rounded-2xl border border-indigo-500/20 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Tag className="text-indigo-400" size={20} />
            Promotions, Coupon Codes & Flash Sales Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Create discount coupons (percentage & flat off), set minimum cart value thresholds, and configure live store flash sale banners.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Create Promo Coupon
          </button>

          <button
            onClick={fetchPromotions}
            className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded-xl border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. STATS OVERVIEW CARDS                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl border border-white/10 bg-slate-900/60 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Tag size={20} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Active Coupons</span>
            <span className="font-mono font-bold text-lg text-white">{activePromosCount} Active</span>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-white/10 bg-slate-900/60 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Coupon Redeems</span>
            <span className="font-mono font-bold text-lg text-emerald-400">{totalUsesCount} Uses</span>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-white/10 bg-slate-900/60 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Top Code</span>
            <span className="font-mono font-bold text-lg text-purple-300">
              {promotions[0]?.code || 'SAVE20'}
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. PROMO CODES GRID                                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {promotions.map((promo) => {
          const isFlat = promo.discountType === 'flat';
          const isCopied = copiedCode === promo.code;

          return (
            <div
              key={promo.code}
              className={`glass p-5 rounded-2xl border transition flex flex-col justify-between gap-4 relative ${
                promo.isActive
                  ? 'bg-slate-900/80 border-indigo-500/30 hover:border-indigo-500/60'
                  : 'bg-slate-900/40 border-white/5 opacity-60'
              }`}
            >
              {/* Header: Code & Toggle */}
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-indigo-300 tracking-wider bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                    {promo.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(promo.code)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
                    title="Copy code"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={() => togglePromo(promo.code)}
                  className={`text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    promo.isActive ? 'text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  {promo.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  <span>{promo.isActive ? 'Active' : 'Disabled'}</span>
                </button>
              </div>

              {/* Promo Details */}
              <div className="space-y-2 text-xs">
                <p className="text-white font-bold leading-snug">{promo.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">DISCOUNT</span>
                    <strong className="text-indigo-400">
                      {isFlat ? formatAmount(promo.discountValue) : `${promo.discountValue}% OFF`}
                    </strong>
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[10px]">MIN ORDER</span>
                    <strong className="text-white">
                      {promo.minOrderValue > 0 ? formatAmount(promo.minOrderValue) : 'No Min'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[10px]">USES</span>
                    <strong className="text-emerald-400">{promo.usageCount} / {promo.maxUsage}</strong>
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[10px]">EXPIRY</span>
                    <strong className="text-zinc-300">{promo.expiryDate}</strong>
                  </div>
                </div>

                {promo.bannerHeadline && (
                  <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[10px] text-purple-300 flex items-center gap-1.5 font-mono">
                    <Sparkles size={12} className="text-purple-400 shrink-0" />
                    <span className="truncate">{promo.bannerHeadline}</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 4. CREATE NEW PROMO CODE MODAL                                   */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Tag size={18} className="text-indigo-400" />
                Create New Promo Code
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePromoSubmit} className="space-y-3.5 text-xs">
              
              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Promo Code (Uppercase)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER25"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-mono font-bold text-indigo-300 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. 25% OFF Summer Sale Discount"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Discount Type
                  </label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount ($/₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={newDiscountVal}
                    onChange={(e) => setNewDiscountVal(e.target.value)}
                    className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Min Cart Value ($)
                  </label>
                  <input
                    type="number"
                    value={newMinOrderVal}
                    onChange={(e) => setNewMinOrderVal(e.target.value)}
                    className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">
                  Store Banner Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🔥 SUMMER FLASH SALE: 25% OFF (Use Code: SUMMER25)"
                  value={newBannerHeadline}
                  onChange={(e) => setNewBannerHeadline(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <CheckCircle2 size={16} />
                {creating ? 'Creating Code...' : 'Create Promo Code & Activate'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
