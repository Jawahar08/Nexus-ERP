'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Zap,
  CheckCircle2,
  X,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
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
        alert(`Coupon ${newCode.toUpperCase()} created successfully!`);
        setShowCreateModal(false);
        setNewCode('');
        setNewDesc('');
        fetchPromotions();
      } else {
        alert('Failed to create promotion code');
      }
    } catch (err) {
      alert('Network error creating promotion');
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
      
      {/* 1. TOP HEADER BAR & SUMMARY METRICS */}
      <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[#14171F]">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#14171F] flex items-center gap-2">
            <Tag className="text-[#5C64ED]" size={20} />
            Promotions, Coupon Codes & Flash Sales Engine
          </h2>
          <p className="text-xs text-[#4F5565] font-medium mt-1">
            Create discount coupons (percentage & flat off), set minimum cart value thresholds, and configure live store flash sale banners.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs rounded-full shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Create Promo Coupon
          </button>

          <button
            onClick={fetchPromotions}
            className="px-3.5 py-2.5 bg-[#FAF7F2] hover:bg-white text-[#14171F] text-xs font-bold rounded-full border border-[#14171F]/10 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[#14171F]">
        <div className="bg-white p-5 rounded-[24px] border border-[#14171F]/10 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#5C64ED]/10 border border-[#5C64ED]/20 text-[#5C64ED]">
            <Tag size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#4F5565] font-mono font-bold uppercase tracking-wider block">Active Coupons</span>
            <span className="font-mono font-bold text-lg text-[#14171F]">{activePromosCount} Active</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#14171F]/10 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#4F5565] font-mono font-bold uppercase tracking-wider block">Total Coupon Redeems</span>
            <span className="font-mono font-bold text-lg text-emerald-700">{totalUsesCount} Uses</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-[#14171F]/10 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-100 border border-purple-300 text-purple-800">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-[10px] text-[#4F5565] font-mono font-bold uppercase tracking-wider block">Top Code</span>
            <span className="font-mono font-bold text-lg text-[#5C64ED]">
              {promotions[0]?.code || 'SAVE20'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. PROMO CODES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {promotions.map((promo) => {
          const isFlat = promo.discountType === 'flat';
          const isCopied = copiedCode === promo.code;

          return (
            <div
              key={promo.code}
              className={`bg-white p-6 rounded-[28px] border transition flex flex-col justify-between gap-4 relative shadow-xs text-[#14171F] ${
                promo.isActive
                  ? 'border-[#14171F]/10 hover:border-[#5C64ED]'
                  : 'opacity-60 border-[#14171F]/5 bg-[#FAF7F2]'
              }`}
            >
              {/* Header: Code & Toggle */}
              <div className="flex items-start justify-between border-b border-[#14171F]/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-[#5C64ED] tracking-wider bg-[#5C64ED]/10 px-3 py-1 rounded-full border border-[#5C64ED]/20">
                    {promo.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(promo.code)}
                    className="p-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#4F5565] hover:text-[#14171F] transition"
                    title="Copy code"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                  </button>
                </div>

                <button
                  onClick={() => togglePromo(promo.code)}
                  className={`text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    promo.isActive ? 'text-emerald-700' : 'text-[#4F5565]'
                  }`}
                >
                  {promo.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  <span>{promo.isActive ? 'Active' : 'Disabled'}</span>
                </button>
              </div>

              {/* Promo Details */}
              <div className="space-y-2 text-xs">
                <p className="text-[#14171F] font-bold leading-snug">{promo.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#14171F] bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#14171F]/10">
                  <div>
                    <span className="text-[#4F5565] block text-[10px] font-bold">DISCOUNT</span>
                    <strong className="text-[#5C64ED]">
                      {isFlat ? formatAmount(promo.discountValue) : `${promo.discountValue}% OFF`}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[#4F5565] block text-[10px] font-bold">MIN ORDER</span>
                    <strong className="text-[#14171F]">
                      {promo.minOrderValue > 0 ? formatAmount(promo.minOrderValue) : 'No Min'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[#4F5565] block text-[10px] font-bold">USES</span>
                    <strong className="text-emerald-700">{promo.usageCount} / {promo.maxUsage}</strong>
                  </div>

                  <div>
                    <span className="text-[#4F5565] block text-[10px] font-bold">EXPIRY</span>
                    <strong className="text-[#14171F]">{promo.expiryDate}</strong>
                  </div>
                </div>

                {promo.bannerHeadline && (
                  <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-300 text-[10px] text-purple-900 flex items-center gap-1.5 font-mono font-bold">
                    <Sparkles size={12} className="text-purple-700 shrink-0" />
                    <span className="truncate">{promo.bannerHeadline}</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* 4. CREATE NEW PROMO CODE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#14171F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#14171F]/10 rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl relative text-[#14171F]">
            
            <div className="flex justify-between items-center border-b border-[#14171F]/10 pb-3">
              <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2">
                <Tag size={18} className="text-[#5C64ED]" />
                Create New Coupon Code
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#4F5565] hover:text-[#14171F] p-1 rounded-full bg-[#FAF7F2]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePromoSubmit} className="space-y-3.5 text-xs">
              
              <div>
                <label className="font-mono font-bold text-[#4F5565] block mb-1 uppercase tracking-wider text-[10px]">
                  Promo Code Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH30"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs font-mono font-bold text-[#5C64ED] uppercase focus:outline-none focus:ring-1 focus:ring-[#5C64ED]"
                />
              </div>

              <div>
                <label className="font-mono font-bold text-[#4F5565] block mb-1 uppercase tracking-wider text-[10px]">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Get 30% off on all organic dairy items"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs font-medium text-[#14171F] focus:outline-none focus:ring-1 focus:ring-[#5C64ED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono font-bold text-[#4F5565] block mb-1 uppercase tracking-wider text-[10px]">
                    Discount Type
                  </label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs font-semibold text-[#14171F] focus:outline-none focus:ring-1 focus:ring-[#5C64ED]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono font-bold text-[#4F5565] block mb-1 uppercase tracking-wider text-[10px]">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    value={newDiscountVal}
                    onChange={(e) => setNewDiscountVal(e.target.value)}
                    className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs font-mono font-bold text-[#5C64ED] focus:outline-none focus:ring-1 focus:ring-[#5C64ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono font-bold text-[#4F5565] block mb-1 uppercase tracking-wider text-[10px]">
                    Min Order Value
                  </label>
                  <input
                    type="number"
                    value={newMinOrderVal}
                    onChange={(e) => setNewMinOrderVal(e.target.value)}
                    className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs font-mono font-bold text-[#14171F] focus:outline-none focus:ring-1 focus:ring-[#5C64ED]"
                  />
                </div>

                <div>
                  <label className="font-mono font-bold text-[#4F5565] block mb-1 uppercase tracking-wider text-[10px]">
                    Max Usage Limit
                  </label>
                  <input
                    type="number"
                    value={newMaxUsage}
                    onChange={(e) => setNewMaxUsage(e.target.value)}
                    className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs font-mono font-bold text-[#14171F] focus:outline-none focus:ring-1 focus:ring-[#5C64ED]"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono font-bold text-[#4F5565] block mb-1 uppercase tracking-wider text-[10px]">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs font-mono font-bold text-[#14171F] focus:outline-none focus:ring-1 focus:ring-[#5C64ED]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3.5 bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs rounded-full shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  {creating ? 'Creating Coupon...' : 'Publish New Coupon Code'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
