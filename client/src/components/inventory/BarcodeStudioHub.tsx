'use client';

import React, { useState } from 'react';
import {
  QrCode,
  ScanBarcode,
  Printer,
  Search,
  CheckCircle2,
  Settings,
  Grid,
  Layers,
  Sparkles,
  Download,
  Copy,
  Tag,
  Calendar,
  Building2
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost?: number;
  category?: string;
  stock: number;
}

interface BarcodeStudioHubProps {
  products: Product[];
}

export default function BarcodeStudioHub({ products }: BarcodeStudioHubProps) {
  const { formatAmount } = useCurrencyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null);

  // Label Customization Options
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'a4sheet' | 'jewelry'>('standard');
  const [codeType, setCodeType] = useState<'CODE128' | 'QR'>('CODE128');
  const [quantityToPrint, setQuantityToPrint] = useState<number>(12);

  // Toggle visible elements on the printed sticker
  const [showStoreName, setShowStoreName] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showSKU, setShowSKU] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBatchInfo, setShowBatchInfo] = useState(true);
  const [batchNo, setBatchNo] = useState(`BTH-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [mfdDate, setMfdDate] = useState('2026-07-01');
  const [expDate, setExpDate] = useState('2027-07-01');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const targetProd = selectedProduct || products[0] || {
    id: '1',
    name: 'Sample Supermarket Product',
    sku: 'SMP-1001',
    price: 19.99,
    stock: 50
  };

  const handlePrintBarcodes = () => {
    window.print();
  };

  // Generate SVG Code128 simulated stripes representation
  const renderCode128Stripe = (text: string) => {
    // Generate deterministic bar widths based on character charcodes
    const bars = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const w1 = (code % 3) + 1;
      const w2 = ((code * 2) % 4) + 1;
      bars.push(<rect key={`${i}-a`} x={i * 14} y="0" width={w1 * 2} height="40" fill="black" />);
      bars.push(<rect key={`${i}-b`} x={i * 14 + w1 * 2 + 2} y="0" width={w2} height="40" fill="black" />);
    }
    return (
      <svg className="w-full h-10 mx-auto" viewBox={`0 0 ${text.length * 16} 40`} preserveAspectRatio="none">
        {bars}
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP STUDIO HEADER & PRINTER PRESET CONTROL                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="glass p-5 rounded-2xl border border-indigo-500/20 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <ScanBarcode className="text-indigo-400" size={20} />
            Barcode & QR Code Label Sticker Generator Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Design, customize, and print CODE128 barcodes or QR code stickers for retail items, shelf tags, and batch expiry tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintBarcodes}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Printer size={16} />
            Print Label Sheet ({quantityToPrint} Labels)
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. MAIN TWO-COLUMN STUDIO LAYOUT                                 */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PRODUCT SELECTOR & CUSTOMIZATION SETTINGS (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Product Selector Card */}
          <div className="glass p-5 rounded-2xl border border-white/10 bg-slate-900/80 space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Search size={14} className="text-indigo-400" />
              1. Select Product for Label Printing
            </h3>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search product SKU or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {filteredProducts.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950/60 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block truncate">{p.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{p.sku}</span>
                    </div>
                    <span className="font-mono text-indigo-300 font-bold shrink-0">
                      {formatAmount(p.price, { decimals: 2 })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label Layout & Options Card */}
          <div className="glass p-5 rounded-2xl border border-white/10 bg-slate-900/80 space-y-4 text-xs">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={14} className="text-indigo-400" />
              2. Label Design & Symbology Settings
            </h3>

            {/* Label Size Selection */}
            <div>
              <label className="text-zinc-400 block mb-1.5 text-[11px] font-bold">Sticker Label Size Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'standard', name: '50x25mm Standard' },
                  { id: 'compact', name: '38x25mm Compact' },
                  { id: 'a4sheet', name: 'A4 Sticker Grid (24/sheet)' },
                  { id: 'jewelry', name: '30x15mm Tag' }
                ].map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setLabelSize(sz.id as any)}
                    className={`py-2 px-2.5 rounded-xl font-semibold border text-[11px] transition cursor-pointer ${
                      labelSize === sz.id
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                        : 'bg-slate-950 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {sz.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Symbology Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1 text-[11px] font-bold">Barcode Type</label>
                <select
                  value={codeType}
                  onChange={(e) => setCodeType(e.target.value as any)}
                  className="w-full h-9 bg-slate-950 border border-white/10 rounded-xl px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="CODE128">CODE128 (1D Barcode)</option>
                  <option value="QR">2D QR Code</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 text-[11px] font-bold">Print Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={quantityToPrint}
                  onChange={(e) => setQuantityToPrint(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-9 bg-slate-950 border border-white/10 rounded-xl px-2 text-xs font-mono text-white text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Display Element Switches */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">Visible Elements on Label</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input type="checkbox" checked={showStoreName} onChange={(e) => setShowStoreName(e.target.checked)} className="rounded accent-indigo-600" />
                  Store Name Header
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input type="checkbox" checked={showTitle} onChange={(e) => setShowTitle(e.target.checked)} className="rounded accent-indigo-600" />
                  Product Name
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="rounded accent-indigo-600" />
                  MRP / Price
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input type="checkbox" checked={showSKU} onChange={(e) => setShowSKU(e.target.checked)} className="rounded accent-indigo-600" />
                  SKU Text
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300 col-span-2">
                  <input type="checkbox" checked={showBatchInfo} onChange={(e) => setShowBatchInfo(e.target.checked)} className="rounded accent-indigo-600" />
                  Batch & Expiry Dates
                </label>
              </div>
            </div>

            {/* Batch & Expiry Settings */}
            {showBatchInfo && (
              <div className="grid grid-cols-3 gap-2 pt-2 text-[10px]">
                <div>
                  <span className="text-zinc-500 block mb-0.5">BATCH NO</span>
                  <input type="text" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-white font-mono" />
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">MFD DATE</span>
                  <input type="text" value={mfdDate} onChange={(e) => setMfdDate(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-white font-mono" />
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">EXP DATE</span>
                  <input type="text" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-white font-mono" />
                </div>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN: LIVE PRINTABLE SHEET PREVIEW (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Grid size={14} className="text-indigo-400" />
              Live Label Print Sheet Preview ({quantityToPrint} Stickers)
            </h3>
            <span className="text-[10px] text-indigo-300 font-mono">Format: {labelSize.toUpperCase()}</span>
          </div>

          {/* PRINTABLE BARCODE SHEET CONTAINER */}
          <div
            id="barcode-sheet"
            className="glass p-6 rounded-2xl border border-white/10 bg-slate-950 min-h-[420px] max-h-[620px] overflow-y-auto"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: quantityToPrint }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white text-black p-3 rounded-md border border-black flex flex-col justify-between items-center text-center font-mono select-none space-y-1.5 shadow-md hover:scale-105 transition"
                >
                  {/* Store Header */}
                  {showStoreName && (
                    <span className="text-[9px] font-black uppercase tracking-wider block border-b border-black w-full pb-0.5">
                      NEXUS RETAIL STORE
                    </span>
                  )}

                  {/* Title */}
                  {showTitle && (
                    <span className="text-[10px] font-bold uppercase truncate max-w-full leading-tight block">
                      {targetProd.name}
                    </span>
                  )}

                  {/* Symbology Graphics */}
                  {codeType === 'CODE128' ? (
                    <div className="w-full my-1">
                      {renderCode128Stripe(targetProd.sku)}
                      {showSKU && <span className="text-[9px] font-bold block tracking-widest mt-0.5">{targetProd.sku}</span>}
                    </div>
                  ) : (
                    <div className="my-1 flex flex-col items-center">
                      <QrCode size={48} className="text-black" />
                      {showSKU && <span className="text-[8px] font-bold block mt-0.5">{targetProd.sku}</span>}
                    </div>
                  )}

                  {/* Batch & Expiry */}
                  {showBatchInfo && (
                    <div className="text-[8px] leading-none text-zinc-700 w-full border-t border-zinc-300 pt-1 flex justify-between">
                      <span>B:{batchNo}</span>
                      <span>EXP:{expDate}</span>
                    </div>
                  )}

                  {/* Price Badge */}
                  {showPrice && (
                    <div className="w-full bg-black text-white font-black text-[11px] py-0.5 rounded-sm uppercase tracking-wider">
                      MRP: {formatAmount(targetProd.price, { decimals: 2 })}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
