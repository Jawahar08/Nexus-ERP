'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Package, Plus, ArrowLeftRight, ShoppingBag, 
  RotateCcw, Warehouse, AlertCircle, ShoppingCart, Trash2, ScanBarcode, Sparkles, FileSpreadsheet, Upload, Download, RefreshCw, CheckCircle2, X, Building2, Truck, Tag, QrCode
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';
import AutoPilotBanner from '@/components/inventory/AutoPilotBanner';
import SmartScannerPOS from '@/components/inventory/SmartScannerPOS';
import B2BProcurementHub from '@/components/inventory/B2BProcurementHub';
import OrderFulfillmentHub from '@/components/inventory/OrderFulfillmentHub';
import PromotionsManagerHub from '@/components/inventory/PromotionsManagerHub';
import BarcodeStudioHub from '@/components/inventory/BarcodeStudioHub';

type ActiveView = 'catalogue' | 'matrix' | 'pos' | 'procurement' | 'orders' | 'promotions' | 'barcodes';

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

  const fetchInventory = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
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
  // Generate & Bulk Import 500 Supermarket Items Demonstration
  const handleGenerate500Items = async () => {
    setImporting(true);
    try {
      const superCategories = [
        { cat: 'BEVERAGES', items: ['Organic Orange Juice 1L', 'Sparkling Lime Water 500ml', 'Arabica Dark Roast Coffee 250g', 'Green Tea Mint 25 Bags', 'Energy Drink 250ml', 'Almond Milk Unsweetened 1L', 'Pure Coconut Water 330ml', 'Mango Nectar Juice 1L'] },
        { cat: 'BAKERY', items: ['Whole Wheat Sandwich Bread', 'Artisanal Sourdough Loaf', 'Butter Croissants 4 Pack', 'Chocolate Muffin 2 Pack', 'Vanilla Sponge Cake 400g', 'Multigrain Toast Rusk 300g', 'Blueberry Bagels 4 Pack', 'Gluten Free Oat Bread'] },
        { cat: 'DAIRY', items: ['Fresh Full Cream Milk 1L', 'Greek Yogurt Strawberry 200g', 'Aged Cheddar Cheese Slice 200g', 'Unsalted Cultured Butter 500g', 'Organic Cottage Cheese 250g', 'Heavy Whipping Cream 250ml', 'Low Fat Slim Milk 1L', 'Gouda Cheese Block 200g'] },
        { cat: 'SNACKS', items: ['Crispy Potato Chips Salted 150g', 'Roasted Salted Almonds 200g', '70% Dark Belgian Chocolate 100g', 'Oatmeal Raisin Cookies 250g', 'Honey Roasted Cashews 150g', 'Nachos Cheese Flavour 150g', 'Pretzel Thins Sea Salt 120g', 'Trail Mix Dried Fruit 250g'] },
        { cat: 'STAPLES', items: ['Premium Extra Long Basmati Rice 5kg', 'Whole Wheat Chakki Atta 5kg', 'Organic Toor Dal 1kg', 'Extra Virgin Olive Oil 1L', 'Refined Sunflower Cooking Oil 1L', 'Pink Himalayan Salt 1kg', 'Pure Cane White Sugar 1kg', 'Raw Organic Honey 500g'] },
        { cat: 'PERSONAL CARE', items: ['Herbal Nourishing Shampoo 400ml', 'Moisturizing Bath Soap 125g', 'Triple Action Toothpaste 150g', 'Gentle Foaming Face Wash 100ml', 'Hydrating Hand Sanitizer 250ml', 'Deep Moisture Body Lotion 400ml', 'Aloe Vera Hair Conditioner 200ml', 'Antiseptic Liquid Handwash 250ml'] },
        { cat: 'HOUSEHOLD', items: ['Lemon Dishwashing Gel 750ml', 'Disinfectant Floor Cleaner 1L', 'Concentrated Laundry Detergent 1L', 'Soft 2-Ply Facial Tissues 200s', 'Heavy Duty Garbage Bags 30s', 'Multi-Surface Cleaner Spray 500ml', 'Microfiber Cleaning Cloth 4 Pack', 'Fabric Softener Fresh 1L'] }
      ];

      const brandList = ['Nestle', 'Dabur', 'Britannia', 'Amul', 'Sunfeast', 'Parle', 'Pepsico', 'Unilever', 'Colgate', 'Kelloggs'];

      const generatedItems = Array.from({ length: 500 }).map((_, i) => {
        const catGroup = superCategories[i % superCategories.length];
        const baseName = catGroup.items[i % catGroup.items.length];
        const brand = brandList[i % brandList.length];
        const costVal = Number((2.50 + (i * 1.35) % 85).toFixed(2));

        return {
          name: `${brand} - ${baseName} (Batch #${Math.floor(i / superCategories.length) + 1})`,
          sku: `SMP-${(1000 + i + 1).toString()}`,
          category: catGroup.cat,
          price: Number((costVal * 1.4).toFixed(2)),
          cost: costVal,
          stock: Math.floor(15 + (i * 11) % 250),
          minStock: 15
        };
      });

      const res = await fetch('/api/inventory/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: generatedItems })
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Supermarket Import Complete! Successfully loaded ${result.totalProcessed} supermarket SKUs into Nexus ERP inventory.`);
        setShowBulkImportModal(false);
        fetchInventory();
      }
    } catch (err) {
      alert('Bulk supermarket test generation failed.');
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
      <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[#14171F]">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#14171F]">Inventory & Warehouse Management</h2>
          <p className="text-xs text-[#4F5565] font-medium mt-0.5">Single product CRUD, 500-1000+ item bulk CSV import, daily physical stock sync, and POS scanning.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <FileSpreadsheet size={14} className="text-purple-700" />
            Bulk Import (500+ Items)
          </button>

          <button 
            onClick={() => setShowDailyStockModal(true)}
            className="flex items-center gap-2 bg-[#FAF7F2] hover:bg-white border border-[#14171F]/10 text-[#14171F] px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className="text-[#5C64ED]" />
            Daily Stock Sync
          </button>

          <button 
            onClick={() => setActiveView('procurement')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
              activeView === 'procurement' ? 'bg-[#14171F] text-white border-[#14171F] shadow-sm' : 'bg-[#FAF7F2] border-[#14171F]/10 text-[#4F5565] hover:text-[#14171F] hover:bg-white'
            }`}
          >
            <Building2 size={14} />
            B2B Supplier Portal & RFQ
          </button>

          <button 
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 bg-[#5C64ED] hover:bg-[#4B52D9] text-white px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            Add Product
          </button>
        </div>
      </div>

      {/* AI AUTO-PILOT PREDICTIVE RESTOCKING BANNER */}
      <AutoPilotBanner onRestockExecuted={fetchInventory} />

      {/* View Switcher View Content */}
      {activeView === 'barcodes' ? (
        <BarcodeStudioHub products={data.products} />
      ) : activeView === 'promotions' ? (
        <PromotionsManagerHub />
      ) : activeView === 'orders' ? (
        <OrderFulfillmentHub />
      ) : activeView === 'procurement' ? (
        <B2BProcurementHub 
          products={data.products} 
          suppliers={data.suppliers} 
          purchaseOrders={data.purchaseOrders} 
          onRefresh={fetchInventory} 
        />
      ) : activeView === 'pos' ? (
        <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs text-[#14171F]">
          <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-4 mb-6">
            <div>
              <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2">
                <ScanBarcode size={20} className="text-[#5C64ED]" />
                Live Store POS Terminal
              </h3>
              <p className="text-xs text-[#4F5565] font-medium mt-0.5">Instant Checkout Terminal using Webcam Barcode Scanner or Voice Search Commands.</p>
            </div>
            <button
              onClick={() => setActiveView('catalogue')}
              className="text-xs text-[#14171F] font-bold px-4 py-2 rounded-full border border-[#14171F]/10 bg-[#FAF7F2] hover:bg-white cursor-pointer shadow-xs"
            >
              Back to Catalog
            </button>
          </div>
          <SmartScannerPOS products={data.products} onCheckoutComplete={() => fetchInventory(false)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Products Table list */}
          <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs xl:col-span-2 flex flex-col gap-4 text-[#14171F]">
            
            {/* Tab selectors */}
            <div className="flex gap-4 border-b border-[#14171F]/10 pb-2 mb-2">
              <button 
                onClick={() => setActiveView('catalogue')}
                className={`text-xs font-serif font-bold pb-2 border-b-2 transition cursor-pointer ${
                  activeView === 'catalogue' ? 'border-[#5C64ED] text-[#5C64ED]' : 'border-transparent text-[#4F5565] hover:text-[#14171F]'
                }`}
              >
                Catalog List ({data.products.length} SKUs)
              </button>
              <button 
                onClick={() => setActiveView('matrix')}
                className={`text-xs font-serif font-bold pb-2 border-b-2 transition cursor-pointer ${
                  activeView === 'matrix' ? 'border-[#5C64ED] text-[#5C64ED]' : 'border-transparent text-[#4F5565] hover:text-[#14171F]'
                }`}
              >
                Warehouse Stock Matrix
              </button>
            </div>

          {activeView === 'catalogue' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#14171F]/10 text-[#4F5565] h-11 uppercase tracking-wider font-bold font-mono text-[11px]">
                    <th className="pb-3 px-2">Name</th>
                    <th className="pb-3 px-2">SKU</th>
                    <th className="pb-3 px-2">Warehouse</th>
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 px-2 text-right">Price</th>
                    <th className="pb-3 px-2 text-right">Stock</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14171F]/10">
                  {data.products.map((p: any) => {
                    const isLow = p.stock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF7F2] h-13 transition-colors">
                        <td className="font-bold text-[#14171F] px-2">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {isLow && (
                              <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-bold">
                                Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-[#4F5565] font-semibold px-2">{p.sku}</td>
                        <td className="text-[#4F5565] font-medium px-2">{p.warehouse?.name || 'Main Hub'}</td>
                        <td className="px-2">
                          <span className="bg-[#FAF7F2] text-[#14171F] border border-[#14171F]/10 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase">
                            {p.category}
                          </span>
                        </td>
                        <td className="text-right font-mono font-bold text-[#14171F] px-2">{formatAmount(p.price, { decimals: 2 })}</td>
                        <td className="text-right px-2">
                          <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${isLow ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-[#FAF7F2] text-[#14171F] border border-[#14171F]/10'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="text-right px-2">
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
                              className="bg-[#5C64ED]/10 hover:bg-[#5C64ED]/20 text-[#5C64ED] px-3 py-1 rounded-full text-xs font-bold border border-[#5C64ED]/30 transition cursor-pointer"
                            >
                              Movement
                            </button>

                            <button 
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-700 transition cursor-pointer"
                              title="Delete Product SKU"
                            >
                              <Trash2 size={14} />
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
                  <div key={wh.id} className="p-5 rounded-[22px] bg-[#FAF7F2] border border-[#14171F]/10 flex flex-col justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#14171F] flex items-center gap-1.5">
                          <Warehouse size={15} className="text-[#5C64ED]" />
                          {wh.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#4F5565] bg-white border border-[#14171F]/10 px-2.5 py-0.5 rounded-full">
                          {wh.location}
                        </span>
                      </div>
                      <p className="text-xs text-[#4F5565] font-medium">{whProducts.length} SKUs registered</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#14171F]/10 pt-2 text-xs">
                      <span className="text-[#4F5565] font-mono font-medium">Total Units:</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm">{totalStock} Units</span>
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
            <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col gap-4 text-[#14171F]">
              <h3 className="font-serif font-bold text-sm text-[#14171F] flex items-center gap-2">
                <RotateCcw size={16} className="text-[#5C64ED]" />
                Movement Log History
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {data.movements.length === 0 ? (
                  <p className="text-xs text-[#4F5565] font-medium">No movement logs recorded.</p>
                ) : (
                  data.movements.slice(0, 10).map((m: any) => (
                    <div key={m.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#14171F]/10 text-xs flex flex-col gap-1.5 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <span className="uppercase text-[10px] tracking-wider text-[#5C64ED] font-mono font-bold">{m.type}</span>
                        <span className="font-mono text-[#4F5565] text-[10px]">{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#14171F] font-bold truncate max-w-[150px]">{m.product?.name || 'Product'}</span>
                        <span className="font-mono font-bold text-emerald-800 text-xs">Qty: {m.qty}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Purchase orders */}
            <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col gap-4 text-[#14171F]">
              <h3 className="font-serif font-bold text-sm text-[#14171F] flex items-center gap-2">
                <ShoppingBag size={16} className="text-[#5C64ED]" />
                Purchase Orders (POs)
              </h3>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {data.purchaseOrders.length === 0 ? (
                  <p className="text-xs text-[#4F5565] font-medium">No POs generated.</p>
                ) : (
                  data.purchaseOrders.map((po: any) => (
                    <div key={po.id} className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#14171F]/10 text-xs flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="font-mono text-[#14171F] font-bold block">PO-{po.id.substring(0, 5).toUpperCase()}</span>
                        <span className="text-[10px] text-[#4F5565] font-mono block mt-0.5">{po.supplier?.name || 'B2B Supplier'}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-[#14171F] block text-xs">{formatAmount(po.total, { decimals: 2 })}</span>
                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${po.status === 'approved' || po.status === 'received' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-xl w-full p-6 rounded-[28px] bg-white border border-[#14171F]/15 space-y-5 shadow-2xl relative text-[#14171F]">
            <button
              onClick={() => setShowBulkImportModal(false)}
              className="absolute right-5 top-5 text-[#4F5565] hover:text-[#14171F] p-1.5 rounded-full hover:bg-[#FAF7F2] transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-lg font-serif font-bold text-[#14171F] flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-[#5C64ED]" />
                Bulk CSV / JSON File Importer (500–1,000+ Items)
              </h3>
              <p className="text-xs text-[#4F5565] mt-1 font-medium">
                Upload a CSV or JSON file to batch import or update hundreds of inventory SKUs in a single click.
              </p>
            </div>

            {/* Template Download & Auto-Generate 500 Items */}
            <div className="grid grid-cols-2 gap-3 font-sans">
              <button
                onClick={handleDownloadSampleCSV}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#14171F]/10 text-xs font-bold text-[#14171F] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download size={16} className="text-[#5C64ED]" />
                Download CSV Template
              </button>

              <button
                onClick={handleGenerate500Items}
                disabled={importing}
                className="p-3.5 rounded-2xl bg-[#5C64ED]/10 hover:bg-[#5C64ED]/20 border border-[#5C64ED]/30 text-xs font-bold text-[#5C64ED] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles size={16} className="text-[#5C64ED]" />
                Generate 500 Demo Items
              </button>
            </div>

            {/* File Upload Zone */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-[#5C64ED]/30 bg-[#FAF7F2] text-center space-y-3">
              <Upload size={32} className="mx-auto text-[#5C64ED]" />
              <div>
                <span className="text-sm font-bold text-[#14171F] block">Upload CSV or JSON Inventory File</span>
                <span className="text-xs text-[#4F5565] font-mono">Headers: name, sku, category, price, cost, stock, minStock</span>
              </div>

              <input
                type="file"
                accept=".csv, .json"
                onChange={handleFileUpload}
                disabled={importing}
                className="block w-full text-xs text-[#4F5565] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#14171F] file:text-white hover:file:bg-[#202532] cursor-pointer"
              />
            </div>

            {importing && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#5C64ED] font-mono font-bold">
                <RefreshCw size={14} className="animate-spin" /> Batch processing inventory items...
              </div>
            )}
          </div>
        </div>
      )}

      {/* DAILY STOCK PHYSICAL COUNT SYNC MODAL */}
      {showDailyStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-2xl w-full p-6 rounded-[28px] bg-white border border-[#14171F]/15 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col justify-between text-[#14171F]">
            <div>
              <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#14171F] flex items-center gap-2">
                    <RefreshCw size={18} className="text-[#5C64ED]" />
                    Daily Physical Stock Count Batch Adjuster
                  </h3>
                  <p className="text-xs text-[#4F5565] mt-0.5 font-medium">
                    Update current physical stock levels across your inventory catalog for end-of-day reconciliation.
                  </p>
                </div>
                <button
                  onClick={() => setShowDailyStockModal(false)}
                  className="text-[#4F5565] hover:text-[#14171F] p-1.5 rounded-full hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Inventory Table */}
              <form onSubmit={handleSaveDailyStockSync} className="space-y-4">
                <div className="max-h-[350px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-[#14171F]/10 text-[#4F5565] h-9 uppercase font-bold font-mono text-[11px]">
                        <th className="pb-2 px-2">Product Name</th>
                        <th className="pb-2 px-2">SKU</th>
                        <th className="pb-2 px-2 text-right">System Stock</th>
                        <th className="pb-2 px-2 text-right">Updated Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14171F]/10">
                      {data.products.map((prod: any) => (
                        <tr key={prod.id} className="h-12 hover:bg-[#FAF7F2]">
                          <td className="font-bold text-[#14171F] px-2">{prod.name}</td>
                          <td className="font-mono text-[#4F5565] px-2">{prod.sku}</td>
                          <td className="text-right font-mono font-bold text-[#4F5565] px-2">{prod.stock}</td>
                          <td className="text-right px-2">
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
                              className="w-24 h-8.5 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-2.5 text-right font-mono font-bold text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[#14171F]/10 pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDailyStockModal(false)}
                    className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDailyStock}
                    className="px-5 py-2 bg-[#14171F] hover:bg-[#202532] text-white text-xs font-bold rounded-full shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-lg w-full p-6 rounded-[28px] bg-white border border-[#14171F]/15 flex flex-col gap-4 relative shadow-2xl text-[#14171F]">
            <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-3">
              <h3 className="font-serif font-bold text-lg text-[#14171F]">Onboard New Product SKU</h3>
              <button onClick={() => setShowAddProduct(false)} className="text-[#4F5565] hover:text-[#14171F] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddProductSubmit} className="flex flex-col gap-3.5 text-xs font-sans">
              <div>
                <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Product Title / Name</label>
                <input 
                  type="text" required placeholder="e.g. Quantum CPU Core X9"
                  value={newProd.name}
                  onChange={e => setNewProd({...newProd, name: e.target.value})}
                  className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Unique SKU Code</label>
                  <input 
                    type="text" required placeholder="e.g. CPU-QT-990"
                    value={newProd.sku}
                    onChange={e => setNewProd({...newProd, sku: e.target.value})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] font-mono focus:outline-none focus:border-[#5C64ED]"
                  />
                </div>
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Category</label>
                  <input 
                    type="text" required placeholder="e.g. Hardware"
                    value={newProd.category}
                    onChange={e => setNewProd({...newProd, category: e.target.value})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Retail Selling Price ($)</label>
                  <input 
                    type="number" step="0.01" required placeholder="499.00"
                    value={newProd.price}
                    onChange={e => setNewProd({...newProd, price: Number(e.target.value)})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] font-mono focus:outline-none focus:border-[#5C64ED]"
                  />
                </div>
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Wholesale Cost ($)</label>
                  <input 
                    type="number" step="0.01" required placeholder="320.00"
                    value={newProd.cost}
                    onChange={e => setNewProd({...newProd, cost: Number(e.target.value)})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] font-mono focus:outline-none focus:border-[#5C64ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Initial Stock Units</label>
                  <input 
                    type="number" required placeholder="100"
                    value={newProd.stock}
                    onChange={e => setNewProd({...newProd, stock: Number(e.target.value)})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] font-mono focus:outline-none focus:border-[#5C64ED]"
                  />
                </div>
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Min Threshold Alert</label>
                  <input 
                    type="number" required placeholder="10"
                    value={newProd.minStock}
                    onChange={e => setNewProd({...newProd, minStock: Number(e.target.value)})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] font-mono focus:outline-none focus:border-[#5C64ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Target Warehouse</label>
                  <select 
                    value={newProd.warehouseId}
                    onChange={e => setNewProd({...newProd, warehouseId: e.target.value})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                  >
                    {data.warehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Primary Supplier</label>
                  <select 
                    value={newProd.supplierId}
                    onChange={e => setNewProd({...newProd, supplierId: e.target.value})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                  >
                    {data.suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#14171F]/10">
                <button 
                  type="button" 
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#14171F] hover:bg-[#202532] text-white text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  Register Product SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENT WORKFLOW MODAL */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-lg w-full p-6 rounded-[28px] bg-white border border-[#14171F]/15 flex flex-col gap-4 relative shadow-2xl text-[#14171F]">
            <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-3">
              <h3 className="font-serif font-bold text-lg text-[#14171F]">Execute Inventory Movement Workflow</h3>
              <button onClick={() => setShowMovementModal(false)} className="text-[#4F5565] hover:text-[#14171F] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="flex flex-col gap-3.5 text-xs font-sans">
              <div>
                <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Workflow Type</label>
                <select 
                  value={movementForm.type}
                  onChange={e => setMovementForm({...movementForm, type: e.target.value})}
                  className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                >
                  <option value="transfer">Warehouse Transfer</option>
                  <option value="replenish">Purchase Replenishment (PO)</option>
                  <option value="return">Sales Return / Refund</option>
                </select>
              </div>

              <div>
                <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Product SKU</label>
                <select 
                  value={movementForm.productId}
                  onChange={e => setMovementForm({...movementForm, productId: e.target.value})}
                  className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                >
                  {data.products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.stock}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Quantity Units</label>
                <input 
                  type="number" min="1" required
                  value={movementForm.qty}
                  onChange={e => setMovementForm({...movementForm, qty: Number(e.target.value)})}
                  className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] font-mono focus:outline-none focus:border-[#5C64ED]"
                />
              </div>

              {movementForm.type === 'transfer' && (
                <div>
                  <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Destination Warehouse</label>
                  <select 
                    value={movementForm.toWarehouseId}
                    onChange={e => setMovementForm({...movementForm, toWarehouseId: e.target.value})}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
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
                    <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Supplier</label>
                    <select 
                      value={movementForm.supplierId}
                      onChange={e => setMovementForm({...movementForm, supplierId: e.target.value})}
                      className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                    >
                      {data.suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#4F5565] font-bold uppercase font-mono text-[11px] block mb-1">Total Order Cost ($)</label>
                    <input 
                      type="number" step="0.01" required
                      value={movementForm.totalCost}
                      onChange={e => setMovementForm({...movementForm, totalCost: Number(e.target.value)})}
                      className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3.5 py-2.5 text-[#14171F] font-mono focus:outline-none focus:border-[#5C64ED]"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[#14171F]/10">
                <button 
                  type="button" 
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#14171F] hover:bg-[#202532] text-white text-xs font-bold shadow-xs cursor-pointer transition"
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
