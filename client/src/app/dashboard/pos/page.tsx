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
      <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex items-center justify-between text-[#14171F]">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#14171F] flex items-center gap-2">
            <ScanBarcode className="text-[#5C64ED]" size={20} />
            Live Smart POS Checkout Terminal
          </h2>
          <p className="text-xs text-[#4F5565] font-medium mt-1">
            Instant counter checkout using webcam barcode scanner, voice commands, cash shift management, and 80mm thermal receipts.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-[#14171F] hover:bg-[#202532] text-white text-xs font-bold rounded-full transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Stock
        </button>
      </div>

      <SmartScannerPOS products={products} onCheckoutComplete={() => fetchProducts()} />
    </div>
  );
}
