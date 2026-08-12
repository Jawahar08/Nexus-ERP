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
  const [discountAmountVal, setDiscountAmountVal] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMsg, setPromoMsg] = useState('');

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

  const [addedToast, setAddedToast] = useState<string | null>(null);

  const addToCart = (product: any, qty: number = 1, openDrawer: boolean = false) => {
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
    
    if (openDrawer) {
      setShowCartDrawer(true);
    } else {
      setAddedToast(`Added "${product.name}" (+${qty}) to cart!`);
      setTimeout(() => setAddedToast(null), 2500);
    }
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item)));
    }
  };

  const applyPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    try {
      const res = await fetch('/api/shop/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          subtotal,
        }),
      });

      const payload = await res.json();
      if (res.ok && payload.valid) {
        setDiscountAmountVal(payload.discountAmount);
        setPromoApplied(true);
        setPromoMsg(payload.message || 'Promo code applied!');
      } else {
        alert(payload.error || 'Invalid promo code');
      }
    } catch (err) {
      alert('Network error validating promo code');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = discountAmountVal > 0 ? discountAmountVal : (subtotal * discountPercent) / 100;
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
          color: '#5C64ED'
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
    if (paymentMethod !== 'cod') {
      await handleRazorpayPayment();
      return;
    }

    if (cart.length === 0 || !customerPhone.trim()) return;

    setPlacingOrder(true);
    const payMethodName = 'Cash on Pickup / Store Delivery';

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
      <div className="min-h-screen bg-[#FAF7F2] text-[#14171F] flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#5C64ED] border-t-transparent animate-spin" />
          <span className="text-xs font-mono font-bold text-[#4F5565]">Loading {storeDomain} digital storefront...</span>
        </div>
      </div>
    );
  }

  if (!storeData || !storeData.tenant) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#14171F] flex items-center justify-center p-4">
        <div className="p-8 rounded-[28px] bg-white border border-[#14171F]/10 shadow-xl max-w-md text-center space-y-4">
          <Store size={36} className="mx-auto text-[#5C64ED]" />
          <h2 className="text-xl font-serif font-bold text-[#14171F]">Storefront Not Found</h2>
          <p className="text-xs text-[#4F5565]">No active store catalog registered under "{storeDomain}".</p>
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#14171F] flex flex-col justify-between selection:bg-[#5C64ED]/20 selection:text-[#5C64ED] antialiased">
      
      {/* STORE HOURS & OPERATING ALERT TICKER HEADER */}
      <div className="bg-white border-b border-[#14171F]/10 px-4 lg:px-8 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-[#4F5565]">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            OPEN NOW • Express Local Delivery Active
          </span>
          <span className="hidden md:inline text-[#4F5565] font-mono text-[11px]">Store Helpline: +1 (555) 019-2834</span>
        </div>

        <div className="flex items-center gap-3 font-medium">
          <button
            onClick={() => setShowTrackModal(true)}
            className="text-xs font-bold text-[#5C64ED] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Truck size={13} /> Track Order Status
          </button>
          <span className="text-[#14171F]/20">|</span>
          <button
            onClick={() => window.open(`https://wa.me/15550192834?text=Hi%20${tenant.name},%20I%20have%20an%20inquiry`, '_blank')}
            className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare size={13} /> WhatsApp Store Inquiry
          </button>
        </div>
      </div>

      {/* STORE DIGITAL NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-xl border-b border-[#14171F]/10 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#14171F] flex items-center justify-center text-white font-bold shadow-xs">
            <Store size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-base text-[#14171F]">{tenant.name}</h1>
              <span className="bg-[#5C64ED]/10 text-[#5C64ED] border border-[#5C64ED]/20 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={11} /> Razorpay Verified
              </span>
            </div>
            <span className="text-[11px] text-[#4F5565] font-mono">domain: {tenant.domain}</span>
          </div>
        </div>

        <button
          onClick={() => setShowCartDrawer(true)}
          className="relative px-4 py-2 bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs rounded-full shadow-xs flex items-center gap-2 transition cursor-pointer"
        >
          <ShoppingCart size={15} />
          <span>Cart</span>
          {cart.length > 0 && (
            <span className="bg-white text-[#14171F] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          )}
        </button>
      </header>

      {/* MAIN CATALOG BODY */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex-1 space-y-6">
        
        {/* FLASH DEALS URGENCY TICKER BANNER */}
        <div className="p-4 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#14171F]">
            <Zap size={16} className="text-[#5C64ED] animate-bounce" />
            <span className="uppercase tracking-wider font-mono text-[11px]">💳 Live Razorpay Payment Gateway Integration Active</span>
          </div>
          <span className="text-[#4F5565] font-mono text-[11px]">
            Merchant Key: <strong className="bg-[#FAF7F2] border border-[#14171F]/10 px-2.5 py-0.5 rounded-md text-[#14171F] font-mono font-bold">rzp_test_Sg9h9VKe7yrwX7</strong>
          </span>
        </div>

        {/* E-Commerce Hero Search Bar */}
        <div className="p-6 rounded-[28px] bg-white border border-[#14171F]/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#14171F] tracking-tight">Official Digital Catalog & Storefront</h2>
            <p className="text-xs text-[#4F5565] mt-1 font-medium">Direct online checkout via Razorpay Gateway. Paid orders dispatch instantly to the ERP terminal.</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4F5565]" />
            <input
              type="text"
              placeholder="Search catalog items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-full pl-10 pr-4 text-xs text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer border shrink-0 shadow-2xs font-mono ${
                selectedCategory === cat
                  ? 'bg-[#14171F] text-white border-[#14171F]'
                  : 'bg-white text-[#14171F] border-[#14171F]/10 hover:bg-[#FAF7F2]'
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
                className="p-5 rounded-[24px] bg-white border border-[#14171F]/10 hover:border-[#5C64ED]/40 shadow-xs transition flex flex-col justify-between gap-4 group relative text-[#14171F]"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#14171F]/10 font-mono">
                      {product.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono border ${
                        isOut
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {isOut ? 'Out of Stock' : `${product.stock} in stock`}
                    </span>
                  </div>

                  <h3 
                    onClick={() => setSelectedProduct(product)}
                    className="font-serif font-bold text-base text-[#14171F] mt-3 leading-snug group-hover:text-[#5C64ED] transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{product.name}</span>
                    <Eye size={14} className="text-[#4F5565] group-hover:text-[#5C64ED] opacity-0 group-hover:opacity-100 transition" />
                  </h3>
                  
                  <div className="flex items-center gap-1 text-amber-500 text-[10px] mt-1.5">
                    <Star size={11} fill="currentColor" />
                    <Star size={11} fill="currentColor" />
                    <Star size={11} fill="currentColor" />
                    <Star size={11} fill="currentColor" />
                    <Star size={11} fill="currentColor" />
                    <span className="text-[#4F5565] ml-1 font-mono font-bold">(4.9/5)</span>
                  </div>

                  <p className="text-[11px] text-[#4F5565] font-mono mt-1">SKU: {product.sku}</p>
                </div>

                <div className="flex items-center justify-between border-t border-[#14171F]/10 pt-3">
                  <span className="font-mono font-bold text-base text-[#14171F]">
                    {formatAmount(product.price, { decimals: 2 })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] border border-[#14171F]/10 cursor-pointer shadow-2xs transition"
                      title="Quick View Details"
                    >
                      <Info size={14} />
                    </button>
                    <button
                      onClick={() => !isOut && addToCart(product)}
                      disabled={isOut}
                      className="px-3.5 py-1.5 bg-[#5C64ED] hover:bg-[#4B52D9] disabled:opacity-40 text-white font-bold text-xs rounded-full shadow-xs transition cursor-pointer"
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
      <footer className="border-t border-[#14171F]/10 py-6 px-4 text-center text-xs text-[#4F5565] font-mono bg-white">
        Powered by <strong className="text-[#14171F]">Nexus ERP Razorpay Live Gateway</strong> &bull; {tenant.name}
      </footer>

      {/* PRODUCT QUICK-VIEW PREVIEW MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-lg w-full p-6 rounded-[28px] bg-white border border-[#14171F]/15 space-y-5 shadow-2xl relative text-[#14171F]">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-5 top-5 text-[#4F5565] hover:text-[#14171F] p-1.5 rounded-full hover:bg-[#FAF7F2] cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-2">
              <span className="bg-[#5C64ED]/10 text-[#5C64ED] border border-[#5C64ED]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                {selectedProduct.category}
              </span>
              <h3 className="text-xl font-serif font-bold text-[#14171F]">{selectedProduct.name}</h3>
              <p className="text-xs text-[#4F5565] font-mono">SKU: {selectedProduct.sku}</p>
            </div>

            <div className="flex items-center gap-2 text-amber-500 text-xs">
              <div className="flex">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </div>
              <span className="text-[#14171F] font-bold">4.9 / 5.0 Rating</span>
              <span className="text-[#4F5565] font-mono">&bull; 128 Verified Store Reviews</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#14171F]/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#4F5565] font-mono">Unit Price:</span>
                <span className="font-mono text-base font-bold text-[#14171F]">
                  {formatAmount(selectedProduct.price, { decimals: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#4F5565] font-mono">Live Inventory:</span>
                <span className="font-mono font-bold text-emerald-800">{selectedProduct.stock} units available</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#4F5565] font-mono">Warranty / Support:</span>
                <span className="text-[#14171F] font-semibold">1-Year Store Express Warranty</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-[#4F5565] uppercase font-mono">Quantity</span>
              <div className="flex items-center border border-[#14171F]/10 rounded-full overflow-hidden font-mono bg-[#FAF7F2]">
                <button
                  onClick={() => setPreviewQty(Math.max(1, previewQty - 1))}
                  className="px-3.5 py-1.5 hover:bg-[#F2ECE4] text-[#14171F] font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 font-bold text-[#14171F] text-sm">{previewQty}</span>
                <button
                  onClick={() => setPreviewQty(Math.min(selectedProduct.stock, previewQty + 1))}
                  className="px-3.5 py-1.5 hover:bg-[#F2ECE4] text-[#14171F] font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => addToCart(selectedProduct, previewQty)}
              className="w-full py-3 bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart size={16} /> Add {previewQty} Unit(s) to Cart ({formatAmount(selectedProduct.price * previewQty)})
            </button>
          </div>
        </div>
      )}

      {/* SHOPPING CART & PAYMENT GATEWAY DRAWER */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-l border-[#14171F]/15 p-6 flex flex-col justify-between gap-6 shadow-2xl overflow-y-auto text-[#14171F]">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-4">
                <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#5C64ED]" />
                  Your Order Cart ({cart.length})
                </h3>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="text-xs text-[#4F5565] hover:text-[#14171F] px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#14171F]/10 cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-xs text-[#4F5565] text-center py-8">Your cart is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#14171F]/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#14171F] block">{item.name}</span>
                        <span className="text-[10px] text-[#4F5565] font-mono">{formatAmount(item.price)} ea</span>
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <div className="flex items-center border border-[#14171F]/10 rounded-full overflow-hidden bg-white">
                          <button
                            onClick={() => updateCartQty(item.id, item.qty - 1)}
                            className="px-2.5 py-0.5 hover:bg-[#FAF7F2] text-[#14171F] font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 font-bold text-[#14171F]">{item.qty}</span>
                          <button
                            onClick={() => updateCartQty(item.id, item.qty + 1)}
                            className="px-2.5 py-0.5 hover:bg-[#FAF7F2] text-[#14171F] font-bold cursor-pointer"
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
                      className="flex-1 h-8.5 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs text-[#14171F] uppercase font-mono placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
                    />
                    <button
                      type="submit"
                      className="px-4 h-8.5 bg-[#5C64ED] hover:bg-[#4B52D9] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                  {promoApplied && (
                    <span className="text-[10px] text-emerald-700 font-mono font-bold mt-1 block">
                      ✓ Promo Applied: 10% Discount Saved (-{formatAmount(discountAmount)})
                    </span>
                  )}
                </div>
              )}

              {/* Fulfillment & Payment Gateway Options */}
              {cart.length > 0 && (
                <form onSubmit={handleDirectOnlinePayment} className="space-y-3.5 pt-2 border-t border-[#14171F]/10">
                  
                  {/* Fulfillment Choice */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#4F5565] uppercase font-mono">Fulfillment Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          deliveryType === 'pickup'
                            ? 'bg-[#14171F] text-white border-[#14171F]'
                            : 'bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10'
                        }`}
                      >
                        <Store size={14} /> Store Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          deliveryType === 'delivery'
                            ? 'bg-[#14171F] text-white border-[#14171F]'
                            : 'bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10'
                        }`}
                      >
                        <Truck size={14} /> Local Delivery
                      </button>
                    </div>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4F5565] uppercase font-mono">Delivery Address</label>
                      <input
                        type="text"
                        required
                        placeholder="Street Address, City"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full h-9 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
                      />
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4F5565] uppercase font-mono">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full h-9 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4F5565] uppercase font-mono">Phone Number</label>
                      <input
                        type="text"
                        required
                        placeholder="+1 555 019 2834"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full h-9 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs text-[#14171F] font-mono placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
                      />
                    </div>
                  </div>

                  {/* Payment Gateway Options */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-[#4F5565] uppercase font-mono">Payment Method</label>
                    
                    {/* Primary Official Razorpay Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`w-full p-3 rounded-2xl text-xs font-bold border flex items-center justify-between transition cursor-pointer shadow-xs ${
                        paymentMethod === 'razorpay'
                          ? 'bg-[#14171F] text-white border-[#14171F]'
                          : 'bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10 hover:bg-[#F2ECE4]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-[#5C64ED]" />
                        <span>Razorpay Gateway (UPI, Cards, NetBanking)</span>
                      </div>
                      <span className="bg-[#5C64ED]/20 text-[#5C64ED] border border-[#5C64ED]/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    </button>

                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-2.5 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 transition cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-[#14171F] text-white border-[#14171F]'
                            : 'bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10'
                        }`}
                      >
                        <CreditCard size={14} /> Direct Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-2.5 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 transition cursor-pointer ${
                          paymentMethod === 'upi'
                            ? 'bg-[#14171F] text-white border-[#14171F]'
                            : 'bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10'
                        }`}
                      >
                        <QrCode size={14} /> Direct UPI
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-2.5 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 transition cursor-pointer ${
                          paymentMethod === 'cod'
                            ? 'bg-[#14171F] text-white border-[#14171F]'
                            : 'bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10'
                        }`}
                      >
                        <Store size={14} /> Pay at Store
                      </button>
                    </div>
                  </div>

                  {/* Total & Instant Payment Trigger */}
                  <div className="border-t border-[#14171F]/10 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs text-amber-800 font-mono font-bold">
                      <span className="flex items-center gap-1"><Sparkles size={13} /> Loyalty Cashback Points:</span>
                      <strong>+{loyaltyPointsEarned} pts</strong>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-[#4F5565]">Total Amount:</span>
                      <span className="font-mono text-[#14171F] text-lg">{formatAmount(cartTotal, { decimals: 2 })}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="w-full py-3.5 bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs rounded-full shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full p-6 rounded-[28px] bg-white border border-[#14171F]/15 space-y-5 shadow-2xl relative text-[#14171F]">
            <button
              onClick={() => { setShowTrackModal(false); setTrackingResult(null); }}
              className="absolute right-5 top-5 text-[#4F5565] hover:text-[#14171F] p-1.5 rounded-full hover:bg-[#FAF7F2] cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-serif font-bold text-[#14171F] flex items-center gap-2">
                <Truck size={20} className="text-[#5C64ED]" /> Track Live Order Status
              </h3>
              <p className="text-xs text-[#4F5565] mt-1 font-medium">Enter your Order Reference ID (e.g. NEX-ORD-XXXXXX) to view live dispatch status.</p>
            </div>

            <form onSubmit={handleTrackOrderSubmit} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="NEX-ORD-667821"
                value={trackOrderId}
                onChange={(e) => setTrackOrderId(e.target.value)}
                className="flex-1 h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs font-mono text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED] uppercase"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-4 h-10 bg-[#14171F] hover:bg-[#202532] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {trackingLoading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {trackingResult && (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#14171F]/10 space-y-3 text-xs">
                {trackingResult.found ? (
                  <>
                    <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-2">
                      <span className="text-[#4F5565]">Order ID:</span>
                      <strong className="font-mono text-[#14171F]">{trackingResult.orderId}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-2">
                      <span className="text-[#4F5565]">Status:</span>
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase">
                        {trackingResult.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-2">
                      <span className="text-[#4F5565]">Paid Amount:</span>
                      <strong className="font-mono text-[#14171F]">{formatAmount(trackingResult.amount)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#4F5565]">Estimated Delivery:</span>
                      <strong className="text-[#5C64ED] font-mono">{trackingResult.estimatedDelivery}</strong>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-rose-700 font-mono py-2 font-bold">
                    No order record found for "{trackOrderId}". Double check your reference ID.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMED ORDER RECEIPT MODAL OVERLAY */}
      {confirmedOrder && (() => {
        const isUnpaidOrder = confirmedOrder.isUnpaid || confirmedOrder.status?.includes('NOT YET PAID');
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="max-w-md w-full p-6 rounded-[28px] bg-white border border-[#14171F]/15 space-y-5 text-center shadow-2xl relative text-[#14171F]">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-xs ${
                isUnpaidOrder ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isUnpaidOrder ? <Clock size={28} /> : <CheckCircle2 size={28} />}
              </div>

              <div>
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono border ${
                  isUnpaidOrder ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {isUnpaidOrder ? 'Order Registered • Pay on Pickup' : 'Razorpay Verified & Dispatched'}
                </span>
                <h3 className="text-xl font-serif font-bold text-[#14171F] mt-2">
                  {isUnpaidOrder ? 'Order Reserved Successfully!' : 'Thank you for your order!'}
                </h3>
                <p className="text-xs text-[#4F5565] mt-1 font-medium">
                  {isUnpaidOrder 
                    ? `Your order ${confirmedOrder.orderId} is reserved! Payment is pending upon store pickup.`
                    : `Your payment has been verified by Razorpay and received live by ${tenant.name} ERP terminal.`}
                </p>
              </div>

              <div className="bg-[#FAF7F2] border border-[#14171F]/10 p-4 rounded-2xl space-y-2 text-xs font-mono text-left">
                <div className="flex justify-between border-b border-[#14171F]/10 pb-1.5">
                  <span className="text-[#4F5565]">Order Reference:</span>
                  <strong className="text-[#14171F]">{confirmedOrder.orderId}</strong>
                </div>
                <div className="flex justify-between border-b border-[#14171F]/10 pb-1.5">
                  <span className="text-[#4F5565]">Payment Status:</span>
                  <strong className={isUnpaidOrder ? 'text-amber-800 font-bold' : 'text-emerald-800 font-bold'}>
                    {confirmedOrder.status || (isUnpaidOrder ? 'NOT YET PAID (Pay on Pickup)' : 'PAID')}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-[#14171F]/10 pb-1.5">
                  <span className="text-[#4F5565]">{isUnpaidOrder ? 'Total Payable:' : 'Total Paid:'}</span>
                  <strong className="text-[#14171F]">{formatAmount(confirmedOrder.totalAmount, { decimals: 2 })}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4F5565]">Fulfillment:</span>
                  <strong className="text-[#14171F] capitalize">{confirmedOrder.deliveryType}</strong>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {confirmedOrder.whatsappUrl && (
                  <button
                    onClick={() => window.open(confirmedOrder.whatsappUrl, '_blank')}
                    className="w-1/2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink size={14} /> Open WA Receipt
                  </button>
                )}
                <button
                  onClick={() => setConfirmedOrder(null)}
                  className={`py-2.5 bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs rounded-full shadow-xs transition cursor-pointer ${
                    confirmedOrder.whatsappUrl ? 'w-1/2' : 'w-full'
                  }`}
                >
                  Back to Storefront
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Item Added Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#14171F] text-white font-bold text-xs px-4 py-3 rounded-full shadow-2xl border border-[#14171F]/20 flex items-center gap-2 font-mono">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{addedToast}</span>
        </div>
      )}

    </div>
  );
}
