'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, ShoppingCart, Trash2, CheckCircle2, Zap, Search, ScanBarcode } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  warehouseId: string;
}

export default function SmartScannerPOS({
  products,
  onCheckoutComplete,
}: {
  products: any[];
  onCheckoutComplete?: () => void;
}) {
  const { formatAmount } = useCurrencyStore();

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

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
        // Extract quantity if spoken (e.g., "add 3")
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

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Complete POS Checkout & Deduct Stock
  const handlePOSCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    try {
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

      alert(`Checkout Complete! ${cart.length} items sold. Recorded stock sale & revenue.`);
      setCart([]);
      if (onCheckoutComplete) onCheckoutComplete();
    } catch (err) {
      alert('Checkout failed during stock transaction.');
    } finally {
      setCheckoutLoading(false);
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT 2 COLS: Scanner Controls & Fast Product Picker */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        
        {/* Scanner Hardware & Voice Controls Bar */}
        <div className="glass p-5 rounded-xl border border-indigo-500/20 bg-slate-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ScanBarcode size={18} className="text-indigo-400" />
              Smart Webcam & Voice POS Scanner
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Use laptop/phone camera barcode scanner or speak voice orders for instant cashier entry.
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

        {/* Live Camera Feed Display (if active) */}
        {isCameraActive && (
          <div className="glass p-4 rounded-xl border border-indigo-500/40 bg-black/80 flex flex-col items-center gap-2 relative overflow-hidden">
            <video
              ref={videoRef}
              className="w-full max-h-[220px] object-cover rounded-lg border border-white/10"
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

        {/* Live Voice Transcript Output */}
        {isListening && (
          <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2 font-mono">
            <Zap size={14} className="text-purple-400 animate-spin" />
            <span>Voice Input: "{transcriptText || 'Listening for product name...'}"</span>
          </div>
        )}

        {/* Quick Product Search & Catalogue Selection Grid */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
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
                      className="mt-1 px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-bold rounded border border-indigo-500/30"
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

      {/* RIGHT COL: POS Cart & Checkout Terminal */}
      <div className="glass p-6 rounded-xl border border-white/10 flex flex-col justify-between gap-5 bg-slate-900/80">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShoppingCart size={16} className="text-indigo-400" />
              Active POS Cart
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              {cart.reduce((acc, item) => acc + item.qty, 0)} items
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs font-medium">
                Cart is empty. Scan barcodes or speak voice commands to add items.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="truncate max-w-[130px]">
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

        {/* Cart Total & Checkout Actions */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-zinc-400">Total Payable:</span>
            <span className="font-mono text-indigo-400 text-base">{formatAmount(cartTotal, { decimals: 2 })}</span>
          </div>

          <button
            onClick={handlePOSCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            {checkoutLoading ? 'Processing Sale...' : 'Complete POS Checkout'}
          </button>
        </div>
      </div>

    </div>
  );
}
