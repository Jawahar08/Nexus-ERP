'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Store, ShoppingCart, CheckCircle2, Search, MapPin, Truck, Phone, User, Send, ArrowRight, ShieldCheck } from 'lucide-react';
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

  // Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    async function loadPublicCatalog() {
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
    }
    loadPublicCatalog();
  }, [storeDomain]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          qty: 1,
        },
      ];
    });
    setShowCartDrawer(true);
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item)));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !customerPhone.trim()) return;

    setPlacingOrder(true);
    try {
      const res = await fetch('/api/shop/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: storeDomain,
          customerName,
          customerPhone,
          items: cart,
          deliveryType,
          address: deliveryAddress,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.whatsappUrl) {
          window.open(result.whatsappUrl, '_blank');
        }
        alert(`Order Placed! Reference: ${result.orderId}. Order details submitted to WhatsApp.`);
        setCart([]);
        setShowCartDrawer(false);
      } else {
        alert('Failed to place order.');
      }
    } catch (err) {
      alert('Error connecting to store order system.');
    } finally {
      setPlacingOrder(false);
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
      
      {/* STORE DIGITAL NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <Store size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-white">{tenant.name}</h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={10} /> Verified Store
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
        
        {/* E-Commerce Hero Search Bar */}
        <div className="glass p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-purple-950/20 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Official Digital Catalog</h2>
            <p className="text-xs text-zinc-400 mt-1">Browse live store inventory. Order direct for Store Pickup or Local Express Delivery.</p>
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
                className="glass p-5 rounded-2xl border border-white/10 bg-slate-900/60 hover:border-indigo-500/40 transition flex flex-col justify-between gap-4 group"
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

                  <h3 className="font-bold text-sm text-white mt-3 leading-snug group-hover:text-indigo-300 transition">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono mt-1">SKU: {product.sku}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="font-mono font-bold text-base text-indigo-400">
                    {formatAmount(product.price, { decimals: 2 })}
                  </span>

                  <button
                    onClick={() => !isOut && addToCart(product)}
                    disabled={isOut}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    + Add to Order
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-zinc-500 font-mono">
        Powered by <strong className="text-indigo-400">Nexus ERP Digital Storefront</strong> &bull; {tenant.name}
      </footer>

      {/* SHOPPING CART & CHECKOUT DRAWER */}
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
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
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

              {/* Delivery Options */}
              {cart.length > 0 && (
                <form onSubmit={handlePlaceOrder} className="space-y-3.5 pt-2 border-t border-white/10">
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

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase">Customer Name</label>
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
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase">WhatsApp Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+1 555 019 2834"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg px-3 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-400">Total Payable:</span>
                      <span className="font-mono text-indigo-400 text-base">{formatAmount(cartTotal, { decimals: 2 })}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send size={15} />
                      {placingOrder ? 'Submitting Order...' : 'Place Order via WhatsApp'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
