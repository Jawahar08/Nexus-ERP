'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Package, Plus, ArrowLeftRight, ShoppingBag, 
  RotateCcw, Warehouse, AlertCircle, ShoppingCart, Trash2, ScanBarcode, Sparkles, FileSpreadsheet, Upload, Download, RefreshCw, CheckCircle2, X
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';
import AutoPilotBanner from '@/components/inventory/AutoPilotBanner';
import SmartScannerPOS from '@/components/inventory/SmartScannerPOS';

type ActiveView = 'catalogue' | 'matrix' | 'pos';

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
  const [activeView, setActiveView] = useState<ActiveView>('catalogue');

  // Bulk CSV Import State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [importing, setImporting] = useState(false);

  // Daily Stock Count Sync State
  const [showDailyStockModal, setShowDailyStockModal] = useState(false);
  const [dailyStockUpdates, setDailyStockUpdates] = useState<{ [id: string]: number }>({});
  const [savingDailyStock, setSavingDailyStock] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);

        // Populate daily stock map
        const stockMap: { [id: string]: number } = {};
        payload.products.forEach((p: any) => {
          stockMap[p.id] = p.stock;
        });
        setDailyStockUpdates(stockMap);
        
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

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}" from store inventory?`)) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchInventory();
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      alert('Error deleting product SKU');
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

  // CSV Sample Template Download
  const handleDownloadSampleCSV = () => {
    const csvContent = `name,sku,category,price,cost,stock,minStock
Quantum CPU Core X9,CPU-QT-990,HARDWARE,499.00,320.00,100,10
Optic Fiber Bridge v2,NET-OFB-02,NETWORKING,189.00,110.00,50,10
Liquid Cooling Block HD,COOL-LCB-12,COOLING,125.00,75.00,80,15
Wireless Router AX6000,NET-AX-6000,NETWORKING,219.00,140.00,45,10
Ultra HD Monitor 32,DISP-UHD-32,HARDWARE,399.00,280.00,30,5`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nexus_inventory_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process Bulk CSV / Excel (.xlsx) / JSON File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      let items: any[] = [];

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        items = XLSX.utils.sheet_to_json(worksheet);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        items = JSON.parse(text);
      } else {
        // Parse CSV
        const text = await file.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim());
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            if (cols.length >= 2) {
              const item: any = {};
              headers.forEach((h, idx) => {
                item[h] = cols[idx] || '';
              });
              items.push(item);
            }
          }
        }
      }

      if (items.length === 0) {
        alert('No valid rows found in uploaded file.');
        setImporting(false);
        return;
      }

      const res = await fetch('/api/inventory/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Bulk Import Complete! ${result.message}`);
        setShowBulkImportModal(false);
        fetchInventory();
      } else {
        alert('Bulk import failed.');
      }
    } catch (err) {
      alert('Failed to parse uploaded file.');
    } finally {
      setImporting(false);
    }
  };

  // Generate & Bulk Import 500 Test Items Demonstration
  const handleGenerate500Items = async () => {
    setImporting(true);
    try {
      const categoriesList = ['HARDWARE', 'NETWORKING', 'COOLING', 'DAIRY', 'ELECTRONICS', 'ACCESSORIES'];
      const generatedItems = Array.from({ length: 500 }).map((_, i) => ({
        name: `Product Item #${i + 101}`,
        sku: `SKU-${1000 + i}`,
        category: categoriesList[i % categoriesList.length],
        price: Number((15 + (i * 2.5) % 350).toFixed(2)),
        cost: Number((10 + (i * 1.5) % 200).toFixed(2)),
        stock: Math.floor(20 + (i * 7) % 150),
        minStock: 10
      }));

      const res = await fetch('/api/inventory/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: generatedItems })
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Bulk Import Success! Added/Updated ${result.totalProcessed} inventory SKUs.`);
        setShowBulkImportModal(false);
        fetchInventory();
      }
    } catch (err) {
      alert('Bulk test generation failed.');
    } finally {
      setImporting(false);
    }
  };

  // Submit Daily Physical Stock Adjustment Sync
  const handleSaveDailyStockSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDailyStock(true);

    try {
      const updates = Object.keys(dailyStockUpdates).map(id => ({
        id,
        stock: dailyStockUpdates[id]
      }));

      const res = await fetch('/api/inventory/daily-stock-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (res.ok) {
        alert(`Daily Stock Count Saved! Updated ${updates.length} items.`);
        setShowDailyStockModal(false);
        fetchInventory();
      }
    } catch (err) {
      alert('Failed to save daily stock count.');
    } finally {
      setSavingDailyStock(false);
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
          <h2 className="text-xl font-bold">Inventory & Warehouse Management</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Single product CRUD, 500-1000+ item bulk CSV import, daily physical stock sync, and POS scanning.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowBulkImportModal(true)}
            className="btn flex items-center gap-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            Bulk Import (500+ Items)
          </button>

          <button 
            onClick={() => setShowDailyStockModal(true)}
            className="btn flex items-center gap-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw size={14} />
            Daily Stock Sync
          </button>

          <button 
            onClick={() => setActiveView('pos')}
            className={`btn flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              activeView === 'pos' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-[var(--border)] text-indigo-300 hover:bg-[var(--border)]'
            }`}
          >
            <ScanBarcode size={14} />
            Smart POS
          </button>

          <button 
            onClick={() => setShowAddProduct(true)}
            className="btn flex items-center gap-2 bg-[var(--primary)] text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--primary-hover)] transition cursor-pointer"
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
                Catalog List ({data.products.length} SKUs)
              </button>
              <button 
                onClick={() => setActiveView('matrix')}
                className={`text-xs font-semibold pb-2 border-b-2 transition cursor-pointer ${
                  activeView === 'matrix' ? 'border-[var(--primary)] text-white' : 'border-transparent text-[var(--text-muted)] hover:text-white'
                }`}
              >
                Warehouse Stock Matrix
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
                          <div className="flex items-center justify-end gap-1.5">
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
                              Movement
                            </button>

                            <button 
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition cursor-pointer"
                              title="Delete Product SKU"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.warehouses.map((wh: any) => {
                const whProducts = data.products.filter((p: any) => p.warehouseId === wh.id);
                const totalStock = whProducts.reduce((acc: number, p: any) => acc + p.stock, 0);
                
                return (
                  <div key={wh.id} className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border)] flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Warehouse size={14} className="text-[var(--primary)]" />
                          {wh.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded">
                          {wh.location}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{whProducts.length} SKUs registered</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-xs">
                      <span className="text-[var(--text-muted)]">Total Units:</span>
                      <span className="font-mono font-bold text-emerald-400">{totalStock} Units</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          </div>

          {/* Right sidebar: Stock Movements Audit Trail & POs */}
          <div className="flex flex-col gap-6">
            
            {/* Recent Audit movements */}
            <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <RotateCcw size={16} />
                Movement Log History
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {data.movements.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No movement logs recorded.</p>
                ) : (
                  data.movements.slice(0, 10).map((m: any) => (
                    <div key={m.id} className="p-2.5 rounded bg-[rgba(255,255,255,0.01)] border border-[var(--border)] text-xs flex flex-col gap-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="uppercase text-[10px] tracking-wider text-[var(--primary)]">{m.type}</span>
                        <span className="font-mono text-[var(--text-muted)] text-[10px]">{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-white">{m.product?.name || 'Product'}</span>
                        <span className="font-bold text-emerald-400">Qty: {m.qty}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Purchase orders */}
            <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShoppingBag size={16} />
                Purchase Orders (POs)
              </h3>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {data.purchaseOrders.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No POs generated.</p>
                ) : (
                  data.purchaseOrders.map((po: any) => (
                    <div key={po.id} className="p-3 rounded bg-[rgba(255,255,255,0.01)] border border-[var(--border)] text-xs flex items-center justify-between">
                      <div>
                        <span className="font-mono text-white font-bold block">PO-{po.id.substring(0, 5).toUpperCase()}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{po.supplier?.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-white block">{formatAmount(po.total, { decimals: 2 })}</span>
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${po.status === 'approved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                          {po.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* BULK CSV/JSON IMPORT MODAL */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass max-w-xl w-full p-6 rounded-2xl border border-purple-500/40 bg-slate-900/95 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowBulkImportModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-white/5 border border-white/10"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <FileSpreadsheet size={22} className="text-purple-400" />
                Bulk CSV / JSON File Importer (500–1,000+ Items)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Upload a CSV or JSON file to batch import or update hundreds of inventory SKUs in a single click.
              </p>
            </div>

            {/* Template Download & Auto-Generate 500 Items */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadSampleCSV}
                className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download size={16} className="text-purple-400" />
                Download Sample CSV Template
              </button>

              <button
                onClick={handleGenerate500Items}
                disabled={importing}
                className="p-3.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-xs font-semibold text-purple-300 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles size={16} className="text-purple-400" />
                Generate & Import 500 Test Items
              </button>
            </div>

            {/* File Upload Zone */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-purple-500/30 bg-purple-950/10 text-center space-y-3">
              <Upload size={32} className="mx-auto text-purple-400 animate-pulse" />
              <div>
                <span className="text-sm font-bold text-white block">Upload CSV or JSON Inventory File</span>
                <span className="text-xs text-zinc-400">Accepts headers: name, sku, category, price, cost, stock, minStock</span>
              </div>

              <input
                type="file"
                accept=".csv, .json"
                onChange={handleFileUpload}
                disabled={importing}
                className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
              />
            </div>

            {importing && (
              <div className="flex items-center justify-center gap-2 text-xs text-purple-300 font-mono">
                <RefreshCw size={14} className="animate-spin" /> Batch processing inventory items...
              </div>
            )}
          </div>
        </div>
      )}

      {/* DAILY STOCK PHYSICAL COUNT SYNC MODAL */}
      {showDailyStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass max-w-2xl w-full p-6 rounded-2xl border border-indigo-500/40 bg-slate-900/95 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <RefreshCw size={20} className="text-indigo-400" />
                    Daily Physical Stock Count Batch Adjuster
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Update current physical stock levels across your inventory catalog for end-of-day reconciliation.
                  </p>
                </div>
                <button
                  onClick={() => setShowDailyStockModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg bg-white/5 border border-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Inventory Table */}
              <form onSubmit={handleSaveDailyStockSync} className="space-y-4">
                <div className="max-h-[350px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400 h-9 uppercase font-bold">
                        <th className="pb-2">Product Name</th>
                        <th className="pb-2">SKU</th>
                        <th className="pb-2 text-right">Current System Stock</th>
                        <th className="pb-2 text-right">Updated Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.products.map((prod: any) => (
                        <tr key={prod.id} className="border-b border-white/5 h-12">
                          <td className="font-bold text-white">{prod.name}</td>
                          <td className="font-mono text-zinc-400">{prod.sku}</td>
                          <td className="text-right font-mono font-bold text-zinc-400">{prod.stock}</td>
                          <td className="text-right">
                            <input
                              type="number"
                              min="0"
                              value={dailyStockUpdates[prod.id] ?? prod.stock}
                              onChange={(e) =>
                                setDailyStockUpdates((prev) => ({
                                  ...prev,
                                  [prod.id]: Number(e.target.value),
                                }))
                              }
                              className="w-24 h-8 bg-slate-900 border border-white/10 rounded-lg px-2 text-right font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-white/10 pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDailyStockModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded-xl border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDailyStock}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    {savingDailyStock ? 'Saving Stock Sync...' : 'Save Daily Physical Stock Count'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ADD SINGLE PRODUCT MODAL */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="glass max-w-lg w-full p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4 relative">
            <h3 className="font-bold text-base">Onboard New Product SKU</h3>
            
            <form onSubmit={handleAddProductSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[var(--text-muted)] block mb-1">Product Title / Name</label>
                <input 
                  type="text" required placeholder="e.g. Quantum CPU Core X9"
                  value={newProd.name}
                  onChange={e => setNewProd({...newProd, name: e.target.value})}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Unique SKU Code</label>
                  <input 
                    type="text" required placeholder="e.g. CPU-QT-990"
                    value={newProd.sku}
                    onChange={e => setNewProd({...newProd, sku: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Category</label>
                  <input 
                    type="text" required placeholder="e.g. Hardware"
                    value={newProd.category}
                    onChange={e => setNewProd({...newProd, category: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Retail Selling Price ($)</label>
                  <input 
                    type="number" step="0.01" required placeholder="499.00"
                    value={newProd.price}
                    onChange={e => setNewProd({...newProd, price: Number(e.target.value)})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Wholesale Cost ($)</label>
                  <input 
                    type="number" step="0.01" required placeholder="320.00"
                    value={newProd.cost}
                    onChange={e => setNewProd({...newProd, cost: Number(e.target.value)})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Initial Stock Units</label>
                  <input 
                    type="number" required placeholder="100"
                    value={newProd.stock}
                    onChange={e => setNewProd({...newProd, stock: Number(e.target.value)})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Min Threshold Alert</label>
                  <input 
                    type="number" required placeholder="10"
                    value={newProd.minStock}
                    onChange={e => setNewProd({...newProd, minStock: Number(e.target.value)})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Target Warehouse</label>
                  <select 
                    value={newProd.warehouseId}
                    onChange={e => setNewProd({...newProd, warehouseId: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white"
                  >
                    {data.warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Primary Supplier</label>
                  <select 
                    value={newProd.supplierId}
                    onChange={e => setNewProd({...newProd, supplierId: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white"
                  >
                    {data.suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 rounded border border-[var(--border)] hover:bg-[var(--border)] cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] cursor-pointer"
                >
                  Register Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENT WORKFLOW MODAL */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="glass max-w-lg w-full p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4 relative">
            <h3 className="font-bold text-base">Execute Inventory Movement Workflow</h3>

            <form onSubmit={handleMovementSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[var(--text-muted)] block mb-1">Workflow Type</label>
                <select 
                  value={movementForm.type}
                  onChange={e => setMovementForm({...movementForm, type: e.target.value})}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white"
                >
                  <option value="transfer">Warehouse Transfer</option>
                  <option value="replenish">Purchase Replenishment (PO)</option>
                  <option value="return">Sales Return / Refund</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Product SKU</label>
                <select 
                  value={movementForm.productId}
                  onChange={e => setMovementForm({...movementForm, productId: e.target.value})}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white"
                >
                  {data.products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.stock}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1">Quantity Units</label>
                <input 
                  type="number" min="1" required
                  value={movementForm.qty}
                  onChange={e => setMovementForm({...movementForm, qty: Number(e.target.value)})}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white font-mono"
                />
              </div>

              {movementForm.type === 'transfer' && (
                <div>
                  <label className="text-[var(--text-muted)] block mb-1">Destination Warehouse</label>
                  <select 
                    value={movementForm.toWarehouseId}
                    onChange={e => setMovementForm({...movementForm, toWarehouseId: e.target.value})}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white"
                  >
                    {data.warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {movementForm.type === 'replenish' && (
                <>
                  <div>
                    <label className="text-[var(--text-muted)] block mb-1">Supplier</label>
                    <select 
                      value={movementForm.supplierId}
                      onChange={e => setMovementForm({...movementForm, supplierId: e.target.value})}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white"
                    >
                      {data.suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[var(--text-muted)] block mb-1">Total Order Cost ($)</label>
                    <input 
                      type="number" step="0.01" required
                      value={movementForm.totalCost}
                      onChange={e => setMovementForm({...movementForm, totalCost: Number(e.target.value)})}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 rounded border border-[var(--border)] hover:bg-[var(--border)] cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] cursor-pointer"
                >
                  Execute Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
