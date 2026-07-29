'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  MicOff,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Zap,
  Search,
  ScanBarcode,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  Clock,
  X,
  Lock,
  Unlock,
  Receipt,
  FileText
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  warehouseId: string;
}

interface RegisterShift {
  isOpen: boolean;
  cashierName: string;
  startTime: string;
  openingFloat: number;
  cashSales: number;
  digitalSales: number;
  totalTransactions: number;
}

interface TransactionReceipt {
  invoiceNo: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashTendered: number;
  changeDue: number;
  cashier: string;
  cashDetail?: string;
}

export default function SmartScannerPOS({
  products,
  onCheckoutComplete,
}: {
  products: any[];
  onCheckoutComplete?: () => void;
}) {
  const { formatAmount, currentCountry } = useCurrencyStore();
  const selectedCurrency = currentCountry?.symbol || '$';

  // POS Core State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  // Payment & Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Shift Management State
  const [shift, setShift] = useState<RegisterShift | null>({
    isOpen: true,
    cashierName: 'Admin Cashier',
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    openingFloat: 2000,
    cashSales: 0,
    digitalSales: 0,
    totalTransactions: 0,
  });
  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState('2000');
  const [cashierInput, setCashierInput] = useState('Store Manager');
  const [countedCashInput, setCountedCashInput] = useState('');
  const [closedShiftSummary, setClosedShiftSummary] = useState<any>(null);

  // Receipt Modal State
  const [lastReceipt, setLastReceipt] = useState<TransactionReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Refs for video & speech recognition
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Toggle Camera Feed
  const startCamera = async () => {
    try {
      setScanStatus('Initializing camera stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setScanStatus('Camera scanner active. Point camera at barcode / SKU text.');
    } catch (err) {
      console.warn('Camera access error or restricted:', err);
      setScanStatus('Camera unavailable. Using instant SKU search scanner.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setScanStatus('');
  };

  // Web Speech Voice Recognition
  const toggleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Web Speech API is not supported in this browser. You can use manual SKU search.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscriptText(currentTranscript);
      processVoiceCommand(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Process Voice Commands like "Add 2 Quantum CPUs"
  const processVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();

    products.forEach((p) => {
      if (lower.includes(p.name.toLowerCase()) || lower.includes(p.sku.toLowerCase())) {
        const matchQty = lower.match(/(\d+)/);
        const qty = matchQty ? parseInt(matchQty[0], 10) : 1;
        addToCart(p, qty);
        setTranscriptText(`Matched: "${p.name}" (+${qty} units)`);
      }
    });
  };

  const addToCart = (product: any, addQty = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + addQty } : item
        );
      }
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          qty: addQty,
          warehouseId: product.warehouseId,
        },
      ];
    });
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item)));
    }
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartTax = cartSubtotal * 0.18; // 18% GST / Standard Retail Tax
  const cartTotal = cartSubtotal + cartTax;

  const tenderedAmount = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedAmount - cartTotal);

  // Handle Shift Opening
  const handleOpenShift = () => {
    const openingFloat = parseFloat(openingFloatInput) || 0;
    setShift({
      isOpen: true,
      cashierName: cashierInput || 'Store Cashier',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      openingFloat,
      cashSales: 0,
      digitalSales: 0,
      totalTransactions: 0,
    });
    setIsOpenShiftModal(false);
  };

  // Handle Shift Closing & Cash Variance Calculation
  const handleCloseShift = () => {
    if (!shift) return;
    const counted = parseFloat(countedCashInput) || 0;
    const expectedDrawerCash = shift.openingFloat + shift.cashSales;
    const variance = counted - expectedDrawerCash;

    setClosedShiftSummary({
      ...shift,
      closeTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      countedCash: counted,
      expectedDrawerCash,
      variance,
    });

    setShift(null);
    setIsCloseShiftModal(false);
  };

  // Complete POS Checkout & Open Thermal Receipt
  const handlePOSCheckout = async () => {
    if (cart.length === 0) return;
    if (!shift || !shift.isOpen) {
      alert('Please open a Cash Register Shift before processing sales.');
      setIsOpenShiftModal(true);
      return;
    }

    if (paymentMethod === 'cash' && tenderedAmount < cartTotal && cashTendered !== '') {
      alert(`Insufficient cash tendered. Total is ${formatAmount(cartTotal)}, but only ${formatAmount(tenderedAmount)} entered.`);
      return;
    }

    setCheckoutLoading(true);

    try {
      // Record stock movement for each cart item
      for (const item of cart) {
        await fetch('/api/inventory/movement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sale',
            productId: item.id,
            qty: item.qty,
            fromWarehouseId: item.warehouseId,
          }),
        });
      }

      // Generate Invoice & Receipt Payload
      const invoiceNo = `NX-POS-${Date.now().toString().slice(-6)}`;
      const receiptPayload: TransactionReceipt = {
        invoiceNo,
        date: new Date().toLocaleString(),
        items: [...cart],
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        paymentMethod: paymentMethod.toUpperCase(),
        cashTendered: paymentMethod === 'cash' ? (tenderedAmount || cartTotal) : cartTotal,
        changeDue: paymentMethod === 'cash' ? changeDue : 0,
        cashier: shift.cashierName,
      };

      // Update Shift Sales Ledger
      setShift((prev) => {
        if (!prev) return null;
        const isCash = paymentMethod === 'cash';
        return {
          ...prev,
          cashSales: prev.cashSales + (isCash ? cartTotal : 0),
          digitalSales: prev.digitalSales + (!isCash ? cartTotal : 0),
          totalTransactions: prev.totalTransactions + 1,
        };
      });

      setLastReceipt(receiptPayload);
      setIsReceiptModalOpen(true);

      // Reset Cart & Payment Form
      setCart([]);
      setCashTendered('');

      if (onCheckoutComplete) onCheckoutComplete();
    } catch (err) {
      alert('Checkout failed during stock transaction.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const triggerThermalPrint = () => {
    window.print();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. POS TOP SHIFT BAR & AUDIT CONTROLS                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="glass p-4 rounded-xl border border-indigo-500/20 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${shift?.isOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            {shift?.isOpen ? <Unlock size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Cash Register Shift</h3>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${shift?.isOpen ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                {shift?.isOpen ? 'ACTIVE SHIFT' : 'REGISTER CLOSED'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3">
              <span>Cashier: <strong className="text-white">{shift?.cashierName || 'None'}</strong></span>
              {shift?.isOpen && (
                <>
                  <span>• Started: {shift.startTime}</span>
                  <span>• Float: <strong className="text-indigo-300">{formatAmount(shift.openingFloat)}</strong></span>
                  <span>• Live Drawer Cash: <strong className="text-emerald-400">{formatAmount(shift.openingFloat + shift.cashSales)}</strong></span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {shift?.isOpen ? (
            <button
              onClick={() => setIsCloseShiftModal(true)}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Lock size={14} />
              End Shift & Balance Register
            </button>
          ) : (
            <button
              onClick={() => setIsOpenShiftModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
            >
              <Unlock size={14} />
              Open New Register Shift
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. MAIN POS WORKSPACE GRID                                       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: Hardware Scanners & Product Catalogue */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          {/* Scanner Bar (Webcam + Voice) */}
          <div className="glass p-4 rounded-xl border border-indigo-500/20 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ScanBarcode size={18} className="text-indigo-400" />
                Smart Webcam & Voice POS Scanner
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Use camera barcode scanner or speak voice orders for instant checkout entry.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                  isCameraActive
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
                }`}
              >
                <Camera size={14} />
                {isCameraActive ? 'Stop Camera' : 'Scan Webcam'}
              </button>

              <button
                onClick={toggleVoiceSearch}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                  isListening
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                    : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/30'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? 'Listening...' : 'Voice Search'}
              </button>
            </div>
          </div>

          {/* Camera Feed */}
          {isCameraActive && (
            <div className="glass p-4 rounded-xl border border-indigo-500/40 bg-black/80 flex flex-col items-center gap-2 relative overflow-hidden">
              <video
                ref={videoRef}
                className="w-full max-h-[200px] object-cover rounded-lg border border-white/10"
                playsInline
                muted
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-indigo-400/50 rounded-xl m-8 flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold bg-black/60 px-2 py-1 rounded">
                  Align SKU Barcode
                </span>
              </div>
              <span className="text-xs text-indigo-300 font-mono">{scanStatus}</span>
            </div>
          )}

          {/* Voice Transcript */}
          {isListening && (
            <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2 font-mono">
              <Zap size={14} className="text-purple-400 animate-spin" />
              <span>Voice Input: "{transcriptText || 'Listening for product name...'}"</span>
            </div>
          )}

          {/* Product Catalogue Grid */}
          <div className="glass p-5 rounded-xl border border-white/10 flex flex-col gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search product SKU or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const isOut = p.stock <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOut && addToCart(p)}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isOut
                        ? 'bg-slate-900/40 border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-slate-900/80 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-950/20'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs text-white truncate max-w-[170px]">{p.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        SKU: {p.sku} &bull; Stock: <strong className={isOut ? 'text-red-400' : 'text-emerald-400'}>{p.stock}</strong>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-indigo-300 block">
                        {formatAmount(p.price, { decimals: 2 })}
                      </span>
                      <button
                        type="button"
                        disabled={isOut}
                        className="mt-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-bold rounded border border-indigo-500/30 transition"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COL: Active POS Cart & Payment Terminal */}
        <div className="glass p-5 rounded-xl border border-white/10 flex flex-col justify-between gap-5 bg-slate-900/90">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShoppingCart size={16} className="text-indigo-400" />
                Active POS Checkout Cart
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                {cart.reduce((acc, item) => acc + item.qty, 0)} items
              </span>
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs font-medium">
                  Cart is empty. Scan barcode or click items to add.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="truncate max-w-[120px]">
                      <span className="font-bold text-white block truncate">{item.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{formatAmount(item.price)} ea</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-white/10 rounded overflow-hidden">
                        <button
                          onClick={() => updateCartQty(item.id, item.qty - 1)}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-white text-xs">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.id, item.qty + 1)}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => updateCartQty(item.id, 0)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment & Total Section */}
          <div className="border-t border-white/10 pt-4 space-y-4">
            
            {/* Payment Method Selector */}
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'upi', label: 'UPI/QR', icon: QrCode },
                  { id: 'split', label: 'Split', icon: Receipt },
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 px-1 rounded-lg border text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                          : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Icon size={14} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered Input (if Cash selected) */}
            {paymentMethod === 'cash' && (
              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-medium">Cash Tendered:</span>
                  <input
                    type="number"
                    placeholder={cartTotal.toFixed(0)}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-28 h-7 bg-slate-900 border border-indigo-500/40 rounded text-right px-2 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Change Due:</span>
                  <span className={`font-bold ${changeDue > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {formatAmount(changeDue, { decimals: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Subtotal, Tax & Total Calculation */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-mono">{formatAmount(cartSubtotal, { decimals: 2 })}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tax (GST 18%):</span>
                <span className="font-mono">{formatAmount(cartTax, { decimals: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-white/10">
                <span>Total Amount:</span>
                <span className="font-mono text-indigo-400 text-lg">{formatAmount(cartTotal, { decimals: 2 })}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handlePOSCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              {checkoutLoading ? 'Processing Sale...' : 'Complete POS Sale & Print Receipt'}
            </button>
          </div>

        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. THERMAL RECEIPT MODAL (PRINTABLE ESC/POS FORMAT)               */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isReceiptModalOpen && lastReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-white/5"
            >
              <X size={16} />
            </button>

            <div className="text-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white flex items-center justify-center gap-2">
                <Receipt className="text-indigo-400" size={18} />
                Transaction Complete
              </h3>
              <p className="text-xs text-emerald-400 mt-1 font-medium">
                Sale recorded & stock updated!
              </p>
            </div>

            {/* Interactive Thermal Receipt Preview Box */}
            <div
              id="thermal-receipt"
              className="bg-white text-black p-4 rounded-md font-mono text-[11px] leading-tight space-y-2 border border-zinc-300 shadow-inner select-none"
            >
              <div className="text-center border-b border-dashed border-zinc-400 pb-2">
                <h2 className="font-black text-sm uppercase tracking-wider">NEXUS ERP RETAIL STORE</h2>
                <p className="text-[10px] text-zinc-600">GSTIN: 27AAAAA0000A1Z5</p>
                <p className="text-[10px] text-zinc-600">Tech Hub Branch • Tel: +1 800-555-NEXUS</p>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-zinc-400 pb-2">
                <div className="flex justify-between">
                  <span>Inv #: {lastReceipt.invoiceNo}</span>
                  <span>{lastReceipt.date.split(',')[0]}</span>
                </div>
                <div>Cashier: {lastReceipt.cashier}</div>
                <div>Payment: {lastReceipt.paymentMethod}</div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-b border-dashed border-zinc-400 pb-2 my-1">
                <thead>
                  <tr className="border-b border-zinc-300 text-[10px]">
                    <th className="py-1">ITEM</th>
                    <th className="py-1 text-center">QTY</th>
                    <th className="py-1 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {lastReceipt.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1 truncate max-w-[120px]">{item.name}</td>
                      <td className="py-1 text-center">{item.qty}</td>
                      <td className="py-1 text-right">{(item.price * item.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-1 text-right pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{lastReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>{lastReceipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-zinc-400">
                  <span>GRAND TOTAL:</span>
                  <span>{lastReceipt.total.toFixed(2)} {selectedCurrency}</span>
                </div>
                {lastReceipt.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>Tendered:</span>
                      <span>{lastReceipt.cashDetail || lastReceipt.cashTendered.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>Change:</span>
                      <span>{lastReceipt.changeDue.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-zinc-400">
                <p className="font-bold text-[10px]">*** THANK YOU FOR SHOPPING ***</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">Powered by Nexus ERP AI</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={triggerThermalPrint}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                Print Thermal Receipt (80mm)
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 4. OPEN REGISTER SHIFT MODAL                                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Unlock size={18} className="text-emerald-400" />
                Open Cash Register Shift
              </h3>
              <button onClick={() => setIsOpenShiftModal(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Cashier Name</label>
                <input
                  type="text"
                  value={cashierInput}
                  onChange={(e) => setCashierInput(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Opening Cash Float ({selectedCurrency})</label>
                <input
                  type="number"
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-lg px-3 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Starting cash float in drawer for change.</p>
              </div>
            </div>

            <button
              onClick={handleOpenShift}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock size={16} />
              Confirm & Start Register Shift
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 5. CLOSE REGISTER SHIFT & CASH VARIANCE AUDIT MODAL             */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isCloseShiftModal && shift && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Lock size={18} className="text-rose-400" />
                Close Register Shift & Reconcile
              </h3>
              <button onClick={() => setIsCloseShiftModal(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1 font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Opening Float:</span>
                  <span>{formatAmount(shift.openingFloat)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Total Cash Sales:</span>
                  <span>+{formatAmount(shift.cashSales)}</span>
                </div>
                <div className="flex justify-between text-indigo-300">
                  <span>Total Digital Sales:</span>
                  <span>+{formatAmount(shift.digitalSales)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-white/10">
                  <span>Expected Drawer Cash:</span>
                  <span className="text-emerald-400">{formatAmount(shift.openingFloat + shift.cashSales)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Counted Physical Cash in Drawer</label>
                <input
                  type="number"
                  placeholder={(shift.openingFloat + shift.cashSales).toString()}
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-indigo-500/40 rounded-lg px-3 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  System calculates cash variance (overage/shortage) automatically.
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseShift}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock size={16} />
              Finalize Shift & Generate Audit Summary
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 6. CLOSED SHIFT AUDIT SUMMARY REPORT MODAL                       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {closedShiftSummary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="text-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white flex items-center justify-center gap-2">
                <FileText className="text-indigo-400" size={18} />
                Shift Audit Summary Report
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Shift finalized successfully</p>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between text-zinc-400">
                <span>Cashier:</span>
                <span className="text-white">{closedShiftSummary.cashierName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Duration:</span>
                <span className="text-white">{closedShiftSummary.startTime} - {closedShiftSummary.closeTime}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Transactions:</span>
                <span className="text-white">{closedShiftSummary.totalTransactions}</span>
              </div>
              <div className="flex justify-between text-emerald-400 pt-2 border-t border-white/10">
                <span>Expected Cash:</span>
                <span>{formatAmount(closedShiftSummary.expectedDrawerCash)}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Actual Counted Cash:</span>
                <span>{formatAmount(closedShiftSummary.countedCash)}</span>
              </div>
              <div className={`flex justify-between font-bold pt-2 border-t border-white/10 ${closedShiftSummary.variance === 0 ? 'text-emerald-400' : closedShiftSummary.variance > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                <span>Variance ({closedShiftSummary.variance === 0 ? 'BALANCED' : closedShiftSummary.variance > 0 ? 'OVERAGE' : 'SHORTAGE'}):</span>
                <span>{closedShiftSummary.variance > 0 ? '+' : ''}{formatAmount(closedShiftSummary.variance)}</span>
              </div>
            </div>

            <button
              onClick={() => setClosedShiftSummary(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
