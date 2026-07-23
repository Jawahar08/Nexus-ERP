'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, ArrowLeftRight, ShoppingBag, 
  RotateCcw, Warehouse, AlertCircle, ShoppingCart, Trash2, ScanBarcode, Sparkles
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';
import AutoPilotBanner from '@/components/inventory/AutoPilotBanner';
import SmartScannerPOS from '@/components/inventory/SmartScannerPOS';

export default function InventoryPage() {
  const { formatAmount, currentCountry } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    products: [],
    warehouses: [],
    suppliers: [],
    movements: [],
    purchaseOrders: []
  });

  // Action forms state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '', sku: '', stock: 0, minStock: 10, price: 0, cost: 0, category: '', warehouseId: '', supplierId: ''
  });

  const [movementForm, setMovementForm] = useState({
    type: 'transfer', // transfer, replenish, return
    productId: '',
    qty: 1,
    fromWarehouseId: '',
    toWarehouseId: '',
    supplierId: '',
    totalCost: 0
  });
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [activeView, setActiveView] = useState<'catalogue' | 'matrix' | 'pos'>('catalogue');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        
        // Auto select first warehouse/supplier for helper defaults
        if (payload.warehouses.length > 0) {
          setNewProd(prev => ({ ...prev, warehouseId: payload.warehouses[0].id }));
          setMovementForm(prev => ({ ...prev, fromWarehouseId: payload.warehouses[0].id }));
          if (payload.warehouses.length > 1) {
            setMovementForm(prev => ({ ...prev, toWarehouseId: payload.warehouses[1].id }));
          }
        }
        if (payload.suppliers.length > 0) {
          setNewProd(prev => ({ ...prev, supplierId: payload.suppliers[0].id }));
          setMovementForm(prev => ({ ...prev, supplierId: payload.suppliers[0].id }));
        }
        if (payload.products.length > 0) {
          setMovementForm(prev => ({ ...prev, productId: payload.products[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      if (res.ok) {
        setShowAddProduct(false);
        setNewProd({
          name: '', sku: '', stock: 0, minStock: 10, price: 0, cost: 0, category: '', warehouseId: data.warehouses[0]?.id || '', supplierId: data.suppliers[0]?.id || ''
        });
        fetchInventory();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to register product');
      }
    } catch (err) {
      alert('Network error registering product');
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementForm)
      });
      if (res.ok) {
        setShowMovementModal(false);
        setMovementForm(prev => ({ ...prev, qty: 1, totalCost: 0 }));
        fetchInventory();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Movement execution failed');
      }
    } catch (err) {
      alert('Network error executing movement');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Inventory & Warehouses</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Control stock levels, AI predictive auto-restocking, and fast POS scanning.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setActiveView('pos')}
            className={`btn flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              activeView === 'pos' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-[var(--border)] text-indigo-300 hover:bg-[var(--border)]'
            }`}
          >
            <ScanBarcode size={14} />
            Smart POS Scanner
          </button>
          <button 
            onClick={() => setShowMovementModal(true)}
            className="btn flex items-center gap-2 bg-slate-900 border border-[var(--border)] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
          >
            <ArrowLeftRight size={14} />
            Stock Workflows
          </button>
          <button 
            onClick={() => setShowAddProduct(true)}
            className="btn flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--primary-hover)] transition cursor-pointer"
          >
            <Plus size={14} />
            Add Product
          </button>
        </div>
      </div>

      {/* AI AUTO-PILOT PREDICTIVE RESTOCKING BANNER */}
      <AutoPilotBanner onRestockExecuted={fetchInventory} />

      {/* View Switcher View Content */}
      {activeView === 'pos' ? (
        <div className="glass p-6 rounded-xl border border-indigo-500/30">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ScanBarcode size={20} className="text-indigo-400" />
                Live Store POS Terminal
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Instant Checkout Terminal using Webcam Barcode Scanner or Voice Search Commands.</p>
            </div>
            <button
              onClick={() => setActiveView('catalogue')}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
          <SmartScannerPOS products={data.products} onCheckoutComplete={fetchInventory} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Products Table list */}
          <div className="glass p-6 rounded-xl border border-[var(--border)] xl:col-span-2 flex flex-col gap-4">
            
            {/* Tab selectors */}
            <div className="flex gap-4 border-b border-[var(--border)] pb-2 mb-2">
              <button 
                onClick={() => setActiveView('catalogue')}
                className={`text-xs font-semibold pb-2 border-b-2 transition cursor-pointer ${
                  activeView === 'catalogue' ? 'border-[var(--primary)] text-white' : 'border-transparent text-[var(--text-muted)] hover:text-white'
                }`}
              >
                Catalog List
              </button>
              <button 
                onClick={() => setActiveView('matrix')}
                className={`text-xs font-semibold pb-2 border-b-2 transition cursor-pointer ${
                  activeView === 'matrix' ? 'border-[var(--primary)] text-white' : 'border-transparent text-[var(--text-muted)] hover:text-white'
                }`}
              >
                Warehouse Stock Matrix
              </button>
              <button 
                onClick={() => setActiveView('pos')}
                className={`text-xs font-semibold pb-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'pos' ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <ScanBarcode size={13} /> POS Terminal
              </button>
            </div>

          {activeView === 'catalogue' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] h-10 uppercase tracking-wider font-bold">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">SKU</th>
                    <th className="pb-2">Warehouse</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Stock</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p: any) => {
                    const isLow = p.stock <= p.minStock;
                    return (
                      <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.01)] h-12 transition-colors">
                        <td className="font-bold text-white">
                          <div className="flex items-center gap-2">
                            {p.name}
                            {isLow && (
                              <span className="bg-red-950/80 text-red-400 border border-red-800/40 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold animate-pulse">
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-[var(--text-muted)]">{p.sku}</td>
                        <td>{p.warehouse?.name}</td>
                        <td>
                          <span className="bg-slate-800 text-[var(--text-muted)] px-2 py-0.5 rounded text-[10px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="text-right font-mono font-bold">{formatAmount(p.price, { decimals: 2 })}</td>
                        <td className="text-right">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${isLow ? 'bg-red-950/40 text-red-400 border border-red-800/20' : 'text-white'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="text-right">
                          <button 
                            onClick={() => {
                              setMovementForm(prev => ({ 
                                ...prev, 
                                productId: p.id,
                                fromWarehouseId: p.warehouseId || '',
                              }));
                              setShowMovementModal(true);
                            }}
                            className="bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] px-2.5 py-1 rounded text-[10px] font-bold border border-[var(--primary)]/20 transition cursor-pointer"
                          >
                            Record Movement
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] h-10 uppercase tracking-wider font-bold">
                    <th className="pb-2">Product Name</th>
                    <th className="pb-2">Base SKU</th>
                    <th className="pb-2">Category</th>
                    {data.warehouses.map((w: any) => (
                      <th key={w.id} className="pb-2 text-right">{w.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Group products by base SKU (strip warehouse tags)
                    const skuGroups: any = {};
                    data.products.forEach((p: any) => {
                      const baseSku = p.sku.split('-')[0];
                      if (!skuGroups[baseSku]) {
                        skuGroups[baseSku] = {
                          name: p.name,
                          category: p.category,
                          stocks: {}
                        };
                      }
                      skuGroups[baseSku].stocks[p.warehouse?.name || 'Unknown'] = p.stock;
                    });

                    const skuList = Object.keys(skuGroups);

                    return skuList.map((sku: string) => {
                      const grp = skuGroups[sku];
                      return (
                        <tr key={sku} className="border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.01)] h-12 transition-colors">
                          <td className="font-bold text-white">{grp.name}</td>
                          <td className="font-mono text-[var(--text-muted)]">{sku}</td>
                          <td>
                            <span className="bg-slate-800 text-[var(--text-muted)] px-2 py-0.5 rounded text-[10px]">
                              {grp.category}
                            </span>
                          </td>
                          {data.warehouses.map((w: any) => {
                            const stock = grp.stocks[w.name] || 0;
                            return (
                              <td key={w.id} className="text-right font-mono font-bold text-white">
                                {stock}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* Warehouses list & Movements history */}
        <div className="flex flex-col gap-6">
          
          {/* Warehouses */}
          <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Warehouse size={16} className="text-[var(--primary)]" />
              Registered Warehouses
            </h3>
            <div className="flex flex-col gap-2">
              {data.warehouses.map((wh: any) => (
                <div key={wh.id} className="border border-[var(--border)] bg-[rgba(255,255,255,0.01)] p-3 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white">{wh.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{wh.location}</div>
                  </div>
                  <span className="badge badge-info bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded text-[10px]">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent movements */}
          <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-cyan-400" />
              Stock Operations Log
            </h3>
            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
              {data.movements.map((m: any) => (
                <div key={m.id} className="flex justify-between items-start border-b border-[var(--border)] pb-2 text-[11px] gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-white capitalize">{m.type}</span>
                    <span className="text-[var(--text-muted)]">{m.product?.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold ${
                      m.type === 'sale' ? 'text-red-400' :
                      m.type === 'transfer' ? 'text-cyan-400' : 'text-emerald-400'
                    }`}>
                      {m.type === 'sale' ? '-' : '+'}{m.qty} units
                    </span>
                    <div className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">
                      {new Date(m.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
      )}

      {/* ==========================================
          MODALS & FORM DRAWERS
         ========================================== */}

      {/* Modal 1: Add Product */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-lg w-full p-8 rounded-xl border border-[var(--border)] flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base border-b border-[var(--border)] pb-2 text-white">Register Product Asset</h3>
            
            <form onSubmit={handleAddProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="input-label">Product Name</label>
                <input 
                  type="text" className="input-field" required
                  value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">SKU Code</label>
                <input 
                  type="text" className="input-field font-mono" required placeholder="e.g. CPU-QT-990"
                  value={newProd.sku} onChange={e => setNewProd({...newProd, sku: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Initial Stock</label>
                <input 
                  type="number" className="input-field" required
                  value={newProd.stock} onChange={e => setNewProd({...newProd, stock: Number(e.target.value)})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Safety Stock Warning Point</label>
                <input 
                  type="number" className="input-field" required
                  value={newProd.minStock} onChange={e => setNewProd({...newProd, minStock: Number(e.target.value)})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Sales Unit Price ({currentCountry.symbol})</label>
                <input 
                  type="number" step="0.01" className="input-field" required
                  value={newProd.price} onChange={e => setNewProd({...newProd, price: Number(e.target.value)})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Procurement Cost ({currentCountry.symbol})</label>
                <input 
                  type="number" step="0.01" className="input-field" required
                  value={newProd.cost} onChange={e => setNewProd({...newProd, cost: Number(e.target.value)})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Category</label>
                <input 
                  type="text" className="input-field" required placeholder="e.g. Hardware"
                  value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Storage Warehouse</label>
                <select 
                  className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                  value={newProd.warehouseId} onChange={e => setNewProd({...newProd, warehouseId: e.target.value})}
                >
                  {data.warehouses.map((wh: any) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="input-label">Primary Supplier</label>
                <select 
                  className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                  value={newProd.supplierId} onChange={e => setNewProd({...newProd, supplierId: e.target.value})}
                >
                  {data.suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 md:col-span-2 mt-4 border-t border-[var(--border)] pt-4">
                <button 
                  type="button" onClick={() => setShowAddProduct(false)}
                  className="btn border border-[var(--border)] bg-slate-900 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--primary-hover)] transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Stock Workflows (Transfer, Replenish, Return) */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-8 rounded-xl border border-[var(--border)] flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base border-b border-[var(--border)] pb-2 text-white">Stock Operations & Workflows</h3>
            
            <form onSubmit={handleMovementSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="input-label">Operation Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button" onClick={() => setMovementForm({...movementForm, type: 'transfer'})}
                    className={`h-9 rounded-lg text-[10px] uppercase font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      movementForm.type === 'transfer' ? 'bg-cyan-950 text-cyan-400 border-cyan-500/50' : 'bg-slate-900 text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    <ArrowLeftRight size={10} /> Transfer
                  </button>
                  <button 
                    type="button" onClick={() => setMovementForm({...movementForm, type: 'replenish'})}
                    className={`h-9 rounded-lg text-[10px] uppercase font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      movementForm.type === 'replenish' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50' : 'bg-slate-900 text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    <ShoppingBag size={10} /> Restock PO
                  </button>
                  <button 
                    type="button" onClick={() => setMovementForm({...movementForm, type: 'return'})}
                    className={`h-9 rounded-lg text-[10px] uppercase font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      movementForm.type === 'return' ? 'bg-yellow-950 text-yellow-400 border-yellow-500/50' : 'bg-slate-900 text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    <RotateCcw size={10} /> Returns
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="input-label">Select Product</label>
                <select 
                  className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                  value={movementForm.productId} onChange={e => setMovementForm({...movementForm, productId: e.target.value})}
                >
                  {data.products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="input-label">Quantity</label>
                <input 
                  type="number" className="input-field" required min="1"
                  value={movementForm.qty} onChange={e => setMovementForm({...movementForm, qty: Number(e.target.value)})}
                />
              </div>

              {/* Conditional parameters based on workflow selection */}
              {movementForm.type === 'transfer' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="input-label">Source WH</label>
                    <select 
                      className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                      value={movementForm.fromWarehouseId} onChange={e => setMovementForm({...movementForm, fromWarehouseId: e.target.value})}
                    >
                      {data.warehouses.map((wh: any) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="input-label">Target WH</label>
                    <select 
                      className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                      value={movementForm.toWarehouseId} onChange={e => setMovementForm({...movementForm, toWarehouseId: e.target.value})}
                    >
                      {data.warehouses.map((wh: any) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {movementForm.type === 'replenish' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="input-label">Select Supplier</label>
                    <select 
                      className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                      value={movementForm.supplierId} onChange={e => setMovementForm({...movementForm, supplierId: e.target.value})}
                    >
                      {data.suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="input-label">Total Cost ({currentCountry.symbol})</label>
                    <input 
                      type="number" step="0.01" className="input-field" required
                      value={movementForm.totalCost} onChange={e => setMovementForm({...movementForm, totalCost: Number(e.target.value)})}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 border-t border-[var(--border)] pt-4">
                <button 
                  type="button" onClick={() => setShowMovementModal(false)}
                  className="btn border border-[var(--border)] bg-slate-900 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--primary-hover)] transition"
                >
                  Execute Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
