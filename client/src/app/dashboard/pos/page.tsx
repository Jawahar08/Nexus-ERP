'use client';

import React, { useState, useEffect } from 'react';
import SmartScannerPOS from '@/components/inventory/SmartScannerPOS';
import { ScanBarcode, RefreshCw } from 'lucide-react';

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products for POS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="glass p-5 rounded-2xl border border-indigo-500/20 bg-slate-900/90 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <ScanBarcode className="text-indigo-400" size={20} />
            Live Smart POS Checkout Terminal
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Instant counter checkout using webcam barcode scanner, voice commands, cash shift management, and 80mm thermal receipts.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded-xl border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Stock
        </button>
      </div>

      <SmartScannerPOS products={products} onCheckoutComplete={() => fetchProducts()} />
    </div>
  );
}
