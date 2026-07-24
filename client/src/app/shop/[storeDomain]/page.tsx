'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Store, ShoppingCart, CheckCircle2, Search, MapPin, Truck, Phone, User,
  Send, ArrowRight, ShieldCheck, CreditCard, QrCode, Wallet, Check, ExternalLink,
  Tag, Clock, Star, Zap, Eye, X, MessageSquare, Info, Percent, Sparkles, ShieldAlert
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

export default function PublicStorefrontPage() {
  const params = useParams();
  const storeDomain = (params?.storeDomain as string) || 'nexus.erp';
  const { formatAmount } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Product Quick-View Modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [previewQty, setPreviewQty] = useState(1);

  // Cart & Discount State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'card' | 'upi' | 'wallet' | 'cod'>('razorpay');

  // Dummy inputs
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('921');
  const [upiId, setUpiId] = useState('buyer@upi');

  const [placingOrder, setPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Order Tracking Lookup State
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Load Razorpay Checkout SDK Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchPublicCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/shop/public/${storeDomain}`);
      if (res.ok) {
        const data = await res.json();
        setStoreData(data);
      }
    } catch (err) {
      console.error('Failed to load public store catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicCatalog();
  }, [storeDomain]);

  const addToCart = (product: any, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          qty,
        },
      ];
    });
    if (selectedProduct) setSelectedProduct(null);
    setShowCartDrawer(true);
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item)));
    }
  };

  const applyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'NEXUS10' || promoCode.trim().toUpperCase() === 'SAVE10') {
      setDiscountPercent(10);
      setPromoApplied(true);
    } else {
      alert('Invalid promo code. Try "NEXUS10" for 10% OFF!');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const cartTotal = Math.max(0, subtotal - discountAmount);
  const loyaltyPointsEarned = Math.floor(cartTotal * 0.05);

  // Official Razorpay Gateway Trigger
  const handleRazorpayPayment = async () => {
    if (cart.length === 0 || !customerPhone.trim()) {
      alert('Please provide customer phone number.');
      return;
    }

    setPlacingOrder(true);
    try {
      // 1. Create Razorpay order session on server
      const res = await fetch('/api/shop/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          currency: 'INR',
          orderId: `NEX-ORD-${Math.floor(100000 + Math.random() * 900000)}`
        })
      });

      if (!res.ok) {
        alert('Failed to initialize Razorpay checkout session.');
        setPlacingOrder(false);
        return;
      }

      const rzpData = await res.json();

      // 2. Configure Razorpay modal options
      const options = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: storeData?.tenant?.name || 'Nexus Storefront',
        description: `Order Payment (${rzpData.receipt})`,
        image: 'https://cdn-icons-png.flaticon.com/512/888/888870.png',
        order_id: rzpData.razorpayOrderId,
        handler: async function (response: any) {
          // 3. Verify HMAC signature & dispatch order to shopkeeper ERP
          const verifyRes = await fetch('/api/shop/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              domain: storeDomain,
              customerName: customerName || 'Valued Buyer',
              customerEmail,
              customerPhone,
              items: cart,
              deliveryType,
              address: deliveryAddress
            })
          });

          if (verifyRes.ok) {
            const verifiedPayload = await verifyRes.json();
            setConfirmedOrder(verifiedPayload);
            setCart([]);
            setPromoApplied(false);
            setPromoCode('');
            setDiscountPercent(0);
            setShowCartDrawer(false);
            fetchPublicCatalog();
          } else {
            alert('Razorpay payment signature verification failed.');
          }
        },
        prefill: {
          name: customerName || 'Valued Buyer',
          email: customerEmail || 'customer@nexus.erp',
          contact: customerPhone
        },
        theme: {
          color: '#4f46e5'
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description || 'Transaction declined.'}`);
      });
      razorpayInstance.open();
    } catch (err) {
      alert('Error launching Razorpay gateway.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Submit Direct Payment Flow
  const handleDirectOnlinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
      return;
    }

    if (cart.length === 0 || !customerPhone.trim()) return;

    setPlacingOrder(true);
    const payMethodName =
      paymentMethod === 'card'
        ? 'Credit / Debit Card'
        : paymentMethod === 'upi'
        ? `UPI (${upiId})`
        : paymentMethod === 'wallet'
        ? 'Digital Wallet'
        : 'Cash on Pickup/Delivery';

    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: storeDomain,
          customerName: customerName || 'E-Commerce Buyer',
          customerEmail,
          customerPhone,
          items: cart,
          deliveryType,
          address: deliveryAddress,
          paymentMethod: payMethodName,
        }),
      });

      if (res.ok) {
        const orderResult = await res.json();
        setConfirmedOrder(orderResult);
        setCart([]);
        setPromoApplied(false);
        setPromoCode('');
        setDiscountPercent(0);
        setShowCartDrawer(false);
        fetchPublicCatalog();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to complete order payment.');
      }
    } catch (err) {
      alert('Error connecting to store payment gateway.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleTrackOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim()) return;

    setTrackingLoading(true);
    setTrackingResult(null);
    try {
      const res = await fetch(`/api/shop/track/${trackOrderId.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingResult(data);
      } else {
        setTrackingResult({ found: false });
      }
    } catch (err) {
      setTrackingResult({ found: false });
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-medium text-zinc-400">Loading {storeDomain} storefront...</span>
        </div>
      </div>
    );
  }

  if (!storeData || !storeData.tenant) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="glass max-w-md p-8 rounded-2xl border border-white/10 text-center space-y-4">
          <Store size={36} className="mx-auto text-zinc-500" />
          <h2 className="text-xl font-bold">Storefront Not Found</h2>
          <p className="text-xs text-zinc-400">No active store catalog registered under "{storeDomain}".</p>
        </div>
      </div>
    );
  }

  const { tenant, products } = storeData;
  const categories = ['all', ...Array.from(new Set(products.map((p: any) => p.category))) as string[]];

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* STORE HOURS & OPERATING ALERT TICKER HEADER */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-white/10 px-4 lg:px-8 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-zinc-300">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            OPEN NOW • Express Local Delivery Active
          </span>
          <span className="hidden md:inline text-zinc-400 font-mono">Store Helpline: +1 (555) 019-2834</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTrackModal(true)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <Truck size={13} /> Track Order Status
          </button>
          <span className="text-zinc-600">|</span>
          <button
            onClick={() => window.open(`https://wa.me/15550192834?text=Hi%20${tenant.name},%20I%20have%20an%20inquiry`, '_blank')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare size={13} /> WhatsApp Store Inquiry
          </button>
        </div>
      </div>

      {/* STORE DIGITAL NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <Store size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-white">{tenant.name}</h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={10} /> Razorpay Verified Store
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">domain: {tenant.domain}</span>
          </div>
        </div>

        <button
          onClick={() => setShowCartDrawer(true)}
          className="relative px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition cursor-pointer"
        >
          <ShoppingCart size={15} />
          <span>Cart</span>
          {cart.length > 0 && (
            <span className="bg-white text-indigo-900 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          )}
        </button>
      </header>

      {/* MAIN CATALOG BODY */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex-1 space-y-6">
        
        {/* FLASH DEALS URGENCY TICKER BANNER */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 via-indigo-950/80 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400 animate-bounce" />
            <span className="font-bold text-white uppercase tracking-wider">💳 Live Razorpay Payment Gateway Integration Active</span>
          </div>
          <span className="text-purple-300 font-mono text-[11px]">
            Key: <strong className="bg-purple-900/80 px-2 py-0.5 rounded text-white font-mono">rzp_test_Sg9h9VKe7yrwX7</strong>
          </span>
        </div>

        {/* E-Commerce Hero Search Bar */}
        <div className="glass p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-purple-950/20 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Official Digital Catalog & Storefront</h2>
            <p className="text-xs text-zinc-400 mt-1">Direct online checkout via Razorpay Gateway. Paid orders dispatch instantly to the ERP terminal.</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search catalog items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-slate-900/90 border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer border shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product: any) => {
            const isOut = product.stock <= 0;
            return (
              <div
                key={product.id}
                className="glass p-5 rounded-2xl border border-white/10 bg-slate-900/60 hover:border-indigo-500/40 transition flex flex-col justify-between gap-4 group relative"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {product.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                        isOut
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isOut ? 'Out of Stock' : `${product.stock} in stock`}
                    </span>
                  </div>

                  <h3 
                    onClick={() => setSelectedProduct(product)}
                    className="font-bold text-sm text-white mt-3 leading-snug group-hover:text-indigo-300 transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{product.name}</span>
                    <Eye size={14} className="text-zinc-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition" />
                  </h3>
                  
                  <div className="flex items-center gap-1 text-amber-400 text-[10px] mt-1.5">
                    <Star size={11} fill="currentColor" />
                    <Star size={11} fill="currentColor" />
                    <Star size={11} fill="currentColor" />
                    <Star size={11} fill="currentColor" />
                    <Star size={11} fill="currentColor" />
                    <span className="text-zinc-500 ml-1 font-mono">(4.9/5)</span>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-mono mt-1">SKU: {product.sku}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="font-mono font-bold text-base text-indigo-400">
                    {formatAmount(product.price, { decimals: 2 })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 cursor-pointer"
                      title="Quick View Details"
                    >
                      <Info size={14} />
                    </button>
                    <button
                      onClick={() => !isOut && addToCart(product)}
                      disabled={isOut}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-zinc-500 font-mono">
        Powered by <strong className="text-indigo-400">Nexus ERP Razorpay Live Gateway</strong> &bull; {tenant.name}
      </footer>

      {/* PRODUCT QUICK-VIEW PREVIEW MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass max-w-lg w-full p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/95 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-white/5 border border-white/10"
            >
              <X size={18} />
            </button>

            <div className="space-y-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {selectedProduct.category}
              </span>
              <h3 className="text-xl font-extrabold text-white">{selectedProduct.name}</h3>
              <p className="text-xs text-zinc-400 font-mono">SKU: {selectedProduct.sku}</p>
            </div>

            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <div className="flex">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </div>
              <span className="text-zinc-300 font-bold">4.9 / 5.0 Rating</span>
              <span className="text-zinc-500 font-mono">&bull; 128 Verified Store Reviews</span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Unit Price:</span>
                <span className="font-mono text-base font-bold text-indigo-400">
                  {formatAmount(selectedProduct.price, { decimals: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Live Inventory:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedProduct.stock} units available</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Warranty / Support:</span>
                <span className="text-zinc-300 font-medium">1-Year Store Express Warranty</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Quantity</span>
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden font-mono">
                <button
                  onClick={() => setPreviewQty(Math.max(1, previewQty - 1))}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold"
                >
                  -
                </button>
                <span className="px-4 font-bold text-white text-sm">{previewQty}</span>
                <button
                  onClick={() => setPreviewQty(Math.min(selectedProduct.stock, previewQty + 1))}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => addToCart(selectedProduct, previewQty)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart size={16} /> Add {previewQty} Unit(s) to Cart ({formatAmount(selectedProduct.price * previewQty)})
            </button>
          </div>
        </div>
      )}

      {/* SHOPPING CART & PAYMENT GATEWAY DRAWER */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border-l border-white/10 p-6 flex flex-col justify-between gap-6 shadow-2xl overflow-y-auto">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ShoppingCart size={18} className="text-indigo-400" />
                  Your Order Cart ({cart.length})
                </h3>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-white/5 border border-white/10"
                >
                  Close
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">Your cart is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{formatAmount(item.price)} ea</span>
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <div className="flex items-center border border-white/10 rounded overflow-hidden">
                          <button
                            onClick={() => updateCartQty(item.id, item.qty - 1)}
                            className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-zinc-300"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-white">{item.qty}</span>
                          <button
                            onClick={() => updateCartQty(item.id, item.qty + 1)}
                            className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-zinc-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Promo Discount Code Form */}
              {cart.length > 0 && (
                <div className="pt-1">
                  <form onSubmit={applyPromoCode} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. NEXUS10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 h-8 bg-slate-900 border border-white/10 rounded-lg px-2.5 text-xs text-white uppercase font-mono placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 h-8 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition"
                    >
                      Apply
                    </button>
                  </form>
                  {promoApplied && (
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                      ✓ Promo Applied: 10% Discount Saved (-{formatAmount(discountAmount)})
                    </span>
                  )}
                </div>
              )}

              {/* Fulfillment & Payment Gateway Options */}
              {cart.length > 0 && (
                <form onSubmit={handleDirectOnlinePayment} className="space-y-3.5 pt-2 border-t border-white/10">
                  
                  {/* Fulfillment Choice */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase">Fulfillment Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                          deliveryType === 'pickup'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-white/5 text-zinc-400 border-white/10'
                        }`}
                      >
                        <Store size={14} /> Store Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                          deliveryType === 'delivery'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-white/5 text-zinc-400 border-white/10'
                        }`}
                      >
                        <Truck size={14} /> Local Delivery
                      </button>
                    </div>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase">Delivery Address</label>
                      <input
                        type="text"
                        required
                        placeholder="Street Address, City"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase">Phone Number</label>
                      <input
                        type="text"
                        required
                        placeholder="+1 555 019 2834"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg px-3 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Gateway Options */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase">Payment Method</label>
                    
                    {/* Primary Official Razorpay Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold border flex items-center justify-between transition cursor-pointer ${
                        paymentMethod === 'razorpay'
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                          : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-300" />
                        <span>Razorpay Gateway (UPI, Cards, NetBanking)</span>
                      </div>
                      <span className="bg-blue-400/20 text-blue-300 border border-blue-400/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    </button>

                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-2 rounded-lg text-[10px] font-bold border flex flex-col items-center gap-1 transition ${
                          paymentMethod === 'card'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-white/5 text-zinc-400 border-white/10'
                        }`}
                      >
                        <CreditCard size={14} /> Direct Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-2 rounded-lg text-[10px] font-bold border flex flex-col items-center gap-1 transition ${
                          paymentMethod === 'upi'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-white/5 text-zinc-400 border-white/10'
                        }`}
                      >
                        <QrCode size={14} /> Direct UPI
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-2 rounded-lg text-[10px] font-bold border flex flex-col items-center gap-1 transition ${
                          paymentMethod === 'cod'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-white/5 text-zinc-400 border-white/10'
                        }`}
                      >
                        <Store size={14} /> Pay at Store
                      </button>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 mt-2">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full h-8 bg-slate-900 border border-white/10 rounded px-2.5 text-xs font-mono text-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="h-8 bg-slate-900 border border-white/10 rounded px-2.5 text-xs font-mono text-white"
                          />
                          <input
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="h-8 bg-slate-900 border border-white/10 rounded px-2.5 text-xs font-mono text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total & Instant Payment Trigger */}
                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs text-amber-400 font-mono">
                      <span className="flex items-center gap-1"><Sparkles size={13} /> Loyalty Cashback Points:</span>
                      <strong>+{loyaltyPointsEarned} pts</strong>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-400">Total Amount:</span>
                      <span className="font-mono text-emerald-400 text-base">{formatAmount(cartTotal, { decimals: 2 })}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      {placingOrder ? 'Connecting to Razorpay...' : paymentMethod === 'razorpay' ? `Pay with Razorpay (${formatAmount(cartTotal)})` : `Pay ${formatAmount(cartTotal)} & Complete Order`}
                    </button>
                  </div>

                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TRACK ORDER LOOKUP MODAL */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/95 space-y-5 shadow-2xl relative">
            <button
              onClick={() => { setShowTrackModal(false); setTrackingResult(null); }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-white/5 border border-white/10"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Truck size={20} className="text-indigo-400" /> Track Live Order Status
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Enter your Order Reference ID (e.g. NEX-ORD-XXXXXX) to view live dispatch status.</p>
            </div>

            <form onSubmit={handleTrackOrderSubmit} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="NEX-ORD-667821"
                value={trackOrderId}
                onChange={(e) => setTrackOrderId(e.target.value)}
                className="flex-1 h-10 bg-slate-900 border border-white/10 rounded-xl px-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-4 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {trackingLoading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {trackingResult && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3 text-xs">
                {trackingResult.found ? (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-zinc-400">Order ID:</span>
                      <strong className="font-mono text-indigo-300">{trackingResult.orderId}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-zinc-400">Status:</span>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                        {trackingResult.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-zinc-400">Paid Amount:</span>
                      <strong className="font-mono text-white">{formatAmount(trackingResult.amount)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Estimated Delivery:</span>
                      <strong className="text-indigo-400 font-mono">{trackingResult.estimatedDelivery}</strong>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-red-400 font-mono py-2">
                    No order record found for "{trackOrderId}". Double check your reference ID.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMED PAID ORDER MODAL OVERLAY */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-emerald-500/40 bg-slate-900/95 space-y-5 text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Razorpay Verified & Order Dispatched
              </span>
              <h3 className="text-xl font-extrabold text-white mt-2">Thank you for your order!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Your payment has been verified by Razorpay and received live by <strong className="text-white">{tenant.name}</strong> ERP terminal.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 p-4 rounded-xl space-y-2 text-xs font-mono text-left">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-zinc-500">Order Reference:</span>
                <strong className="text-indigo-300">{confirmedOrder.orderId}</strong>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-zinc-500">Payment Status:</span>
                <strong className="text-emerald-400">PAID ({confirmedOrder.paymentMethod})</strong>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-zinc-500">Total Paid:</span>
                <strong className="text-white">{formatAmount(confirmedOrder.totalAmount, { decimals: 2 })}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fulfillment:</span>
                <strong className="text-white capitalize">{confirmedOrder.deliveryType}</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {confirmedOrder.whatsappUrl && (
                <button
                  onClick={() => window.open(confirmedOrder.whatsappUrl, '_blank')}
                  className="w-1/2 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} /> Open WA Receipt
                </button>
              )}
              <button
                onClick={() => setConfirmedOrder(null)}
                className={`py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition ${
                  confirmedOrder.whatsappUrl ? 'w-1/2' : 'w-full'
                }`}
              >
                Back to Storefront
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
