'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Briefcase, ShoppingCart, 
  DollarSign, Mail, Phone, Landmark, Sparkles, Trash2, CheckCircle2, MessageSquare
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';
import WhatsAppAutomationHub from '@/components/crm/WhatsAppAutomationHub';

export default function CRMPage() {
  const { formatAmount, currentCountry } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'whatsapp' | 'online-orders'>('pipeline');
  const [data, setData] = useState<any>({
    customers: [],
    deals: []
  });
  const [products, setProducts] = useState<any[]>([]);

  // Modals and action triggers
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', email: '', phone: '', company: '' });
  
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({ company: '', contact: '', value: 0, stage: 'lead', notes: '' });

  // POS Checkout Builder state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState<any[]>([]); // Array<{productId, name, qty, price}>
  const [cartProductId, setCartProductId] = useState('');
  const [cartQty, setCartQty] = useState(1);

  const fetchCRM = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm');
      const prodRes = await fetch('/api/inventory');
      
      if (res.ok && prodRes.ok) {
        const payload = await res.json();
        const prodData = await prodRes.json();
        
        setData(payload);
        setProducts(prodData.products);

        if (payload.customers.length > 0) {
          setSelectedCustomerId(payload.customers[0].id);
        }
        if (prodData.products.length > 0) {
          setCartProductId(prodData.products[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load CRM details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRM();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCust, action: 'customer' })
      });
      if (res.ok) {
        setShowAddCustomer(false);
        setNewCust({ name: '', email: '', phone: '', company: '' });
        fetchCRM();
      }
    } catch (err) {
      alert('Failed to register customer');
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDeal, action: 'deal' })
      });
      if (res.ok) {
        setShowAddDeal(false);
        setNewDeal({ company: '', contact: '', value: 0, stage: 'lead', notes: '' });
        fetchCRM();
      }
    } catch (err) {
      alert('Failed to register deal');
    }
  };

  const handleUpdateDealStage = async (id: string, stage: string) => {
    try {
      const res = await fetch('/api/crm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stage })
      });
      if (res.ok) {
        if (stage === 'won') {
          const deal = data.deals.find((d: any) => d.id === id);
          if (deal) {
            const client = data.customers.find((c: any) => 
              c.company.toLowerCase().includes(deal.company.toLowerCase()) || 
              deal.company.toLowerCase().includes(c.company.toLowerCase())
            );
            if (client) {
              setSelectedCustomerId(client.id);
            }
            if (products.length > 0) {
              setCart([{
                productId: products[0].id,
                name: `Contract Fulfillment: ${deal.company}`,
                qty: 1,
                price: deal.value
              }]);
            }
          }
        }
        fetchCRM();
      }
    } catch (err) {
      alert('Failed to update stage');
    }
  };

  // Cart operations
  const handleAddToCart = () => {
    const prod = products.find(p => p.id === cartProductId);
    if (!prod) return;

    if (prod.stock < cartQty) {
      alert(`Insufficient stock! ${prod.name} has only ${prod.stock} units available.`);
      return;
    }

    const existingIdx = cart.findIndex(item => item.productId === cartProductId);
    if (existingIdx !== -1) {
      const newCart = [...cart];
      const nextQty = newCart[existingIdx].qty + cartQty;
      if (prod.stock < nextQty) {
        alert(`Insufficient stock! Combined requested: ${nextQty}, Available: ${prod.stock}`);
        return;
      }
      newCart[existingIdx].qty = nextQty;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: prod.id,
        name: prod.name,
        qty: cartQty,
        price: prod.price
      }]);
    }
    setCartQty(1);
  };

  const handleRemoveFromCart = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartTax = cartSubtotal * 0.1; // 10% VAT
  const cartTotal = cartSubtotal + cartTax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: cart,
          grandTotal: cartTotal
        })
      });

      const payload = await res.json();
      if (res.ok) {
        alert(`Checkout invoice generated successfully: Ref ${payload.reference}`);
        setCart([]);
        fetchCRM();
      } else {
        alert(payload.error || 'Checkout failed');
      }
    } catch (err) {
      alert('Network checkout failure');
    }
  };

  const dealStages = [
    { key: 'lead', label: 'Lead Inbound' },
    { key: 'contacted', label: 'Contact Pitch' },
    { key: 'proposal', label: 'Proposal Sent' },
    { key: 'won', label: 'Contract Won' },
    { key: 'lost', label: 'Archived Lost' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">CRM & Customer Retention Hub</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage customer contacts, sales pipelines, and automated WhatsApp/SMS messaging.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setActiveTab(activeTab === 'online-orders' ? 'pipeline' : 'online-orders')}
            className={`btn flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              activeTab === 'online-orders' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-[var(--border)] text-indigo-400 hover:bg-[var(--border)]'
            }`}
          >
            <ShoppingCart size={14} />
            {activeTab === 'online-orders' ? 'Back to Sales Pipeline' : 'Storefront Online Orders'}
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === 'whatsapp' ? 'pipeline' : 'whatsapp')}
            className={`btn flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              activeTab === 'whatsapp' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 border-[var(--border)] text-emerald-400 hover:bg-[var(--border)]'
            }`}
          >
            <MessageSquare size={14} />
            {activeTab === 'whatsapp' ? 'Back to Sales Pipeline' : 'WhatsApp Automation Hub'}
          </button>
          <button 
            onClick={() => setShowAddCustomer(true)}
            className="btn flex items-center gap-2 bg-slate-900 border border-[var(--border)] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
          >
            <Users size={14} />
            Register Customer
          </button>
          <button 
            onClick={() => setShowAddDeal(true)}
            className="btn flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--primary-hover)] transition cursor-pointer"
          >
            <Plus size={14} />
            Track Contract Deal
          </button>
        </div>
      </div>

      {activeTab === 'online-orders' ? (
        <div className="glass p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-400" />
                Live Storefront Online Orders
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Paid online e-commerce orders placed directly by customers on your public storefront catalog.
              </p>
            </div>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-3 py-1 rounded-full font-mono">
              {data.onlineOrders?.length || 0} Total Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 h-10 uppercase tracking-wider font-bold">
                  <th className="pb-2">Order Reference</th>
                  <th className="pb-2">Date & Time</th>
                  <th className="pb-2">Customer & Details</th>
                  <th className="pb-2 text-right">Payment Status</th>
                  <th className="pb-2 text-right">Paid Amount</th>
                </tr>
              </thead>
              <tbody>
                {!data.onlineOrders || data.onlineOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs font-mono">
                      No online storefront orders recorded yet. Place an order at /shop/nexus.erp to test!
                    </td>
                  </tr>
                ) : (
                  data.onlineOrders.map((ord: any) => (
                    <tr key={ord.id} className="border-b border-white/5 hover:bg-white/[0.02] h-14 transition-colors">
                      <td className="font-bold font-mono text-indigo-400">{ord.reference}</td>
                      <td className="text-zinc-400 font-mono">{new Date(ord.date).toLocaleString()}</td>
                      <td className="text-white font-medium">{ord.description}</td>
                      <td className="text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                          PAID
                        </span>
                      </td>
                      <td className="text-right font-mono font-bold text-emerald-400 text-sm">
                        +{formatAmount(ord.amount, { decimals: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'whatsapp' ? (
        <WhatsAppAutomationHub customers={data.customers} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Kanban Board pipeline */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] xl:col-span-2 flex flex-col gap-4">
          <h3 className="font-bold text-sm">Sales Pipeline Kanban</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 mt-2">
            {dealStages.map(stage => {
              const stageDeals = data.deals.filter((d: any) => d.stage === stage.key);
              return (
                <div key={stage.key} className="flex flex-col gap-3.5 bg-slate-900/50 border border-[var(--border)] p-3 rounded-lg min-h-[250px]">
                  <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{stage.label}</span>
                    <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono font-bold">{stageDeals.length}</span>
                  </div>

                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px]">
                    {stageDeals.map((deal: any) => (
                      <div key={deal.id} className="bg-slate-950 border border-[var(--border)] hover:border-slate-700 p-3 rounded flex flex-col gap-2 text-xs transition">
                        <div>
                          <div className="font-bold text-white truncate">{deal.company}</div>
                          <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{deal.contact}</div>
                        </div>
                        <div className="font-mono font-bold text-[var(--accent)] text-xs">{formatAmount(deal.value)}</div>
                        
                        {/* Status swappers */}
                        <div className="flex gap-1 border-t border-[var(--border)] pt-2 mt-1">
                          {dealStages.map(ds => {
                            if (ds.key === deal.stage) return null;
                            return (
                              <button
                                key={ds.key}
                                onClick={() => handleUpdateDealStage(deal.id, ds.key)}
                                className="text-[8px] bg-slate-800 hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-white px-1 py-0.5 rounded transition cursor-pointer"
                                title={`Shift to: ${ds.label}`}
                              >
                                {ds.key.substring(0, 3).toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* POS Checkout billing builder */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
          <h3 className="font-bold text-sm flex items-center gap-2 text-[var(--accent)]">
            <ShoppingCart size={16} />
            Sales POS Checkout
          </h3>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="input-label">Select Customer client</label>
              <select
                className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}
              >
                {data.customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                ))}
              </select>
            </div>

            {/* Cart intake row */}
            <div className="flex gap-2 items-end border-t border-[var(--border)] pt-3 w-full">
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <label className="input-label">Product SKU</label>
                <select
                  className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs w-full truncate h-10"
                  value={cartProductId} onChange={e => setCartProductId(e.target.value)}
                >
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({formatAmount(p.price, { decimals: 2 })} | Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 shrink-0 w-16">
                <label className="input-label text-center">Qty</label>
                <input
                  type="number" className="input-field text-center font-bold px-1 w-full h-10 animate-none" min="1"
                  value={cartQty} onChange={e => setCartQty(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="shrink-0">
                <button
                  type="button" onClick={handleAddToCart}
                  className="h-10 w-10 bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 text-white rounded-lg cursor-pointer transition flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Shopping Cart List */}
            <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-3 max-h-[140px] overflow-y-auto">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-[11px] border-b border-[var(--border)] pb-1.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{item.qty} &bull; {formatAmount(item.price, { decimals: 2 })} each</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{formatAmount(item.price * item.qty, { decimals: 2 })}</span>
                    <button 
                      onClick={() => handleRemoveFromCart(index)}
                      className="text-red-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals panel */}
            <div className="border-t border-[var(--border)] pt-3 text-xs flex flex-col gap-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Subtotal:</span>
                <span className="text-white">{formatAmount(cartSubtotal, { decimals: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-1.5">
                <span className="text-[var(--text-muted)]">VAT (10%):</span>
                <span className="text-white">{formatAmount(cartTax, { decimals: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span className="text-[var(--accent)]">Grand Total:</span>
                <span className="text-white">{formatAmount(cartTotal, { decimals: 2 })}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              disabled={cart.length === 0}
            >
              <CheckCircle2 size={14} />
              Process Billing Checkout
            </button>
          </div>
        </div>

      </div>
      )}

      {/* ==========================================
          MODALS & ADD DIALOGS
         ========================================== */}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full p-8 rounded-xl border border-[var(--border)] flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base border-b border-[var(--border)] pb-2 text-white">Register Corporate Customer</h3>
            
            <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="input-label">Customer Name</label>
                <input 
                  type="text" className="input-field" required
                  value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Email Address</label>
                <input 
                  type="email" className="input-field font-mono"
                  value={newCust.email} onChange={e => setNewCust({...newCust, email: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Phone Line</label>
                <input 
                  type="text" className="input-field font-mono"
                  value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Company Name</label>
                <input 
                  type="text" className="input-field" required
                  value={newCust.company} onChange={e => setNewCust({...newCust, company: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-[var(--border)] pt-4">
                <button 
                  type="button" onClick={() => setShowAddCustomer(false)}
                  className="btn border border-[var(--border)] bg-slate-900 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--primary-hover)] transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full p-8 rounded-xl border border-[var(--border)] flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base border-b border-[var(--border)] pb-2 text-white">Track Contract Deal</h3>
            
            <form onSubmit={handleAddDeal} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="input-label">Company Name</label>
                <input 
                  type="text" className="input-field" required
                  value={newDeal.company} onChange={e => setNewDeal({...newDeal, company: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Key Contact Name</label>
                <input 
                  type="text" className="input-field" required
                  value={newDeal.contact} onChange={e => setNewDeal({...newDeal, contact: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Contract Value ($)</label>
                <input 
                  type="number" className="input-field font-mono" required
                  value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: Number(e.target.value)})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Notes</label>
                <input 
                  type="text" className="input-field"
                  value={newDeal.notes} onChange={e => setNewDeal({...newDeal, notes: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-[var(--border)] pt-4">
                <button 
                  type="button" onClick={() => setShowAddDeal(false)}
                  className="btn border border-[var(--border)] bg-slate-900 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--primary-hover)] transition"
                >
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
