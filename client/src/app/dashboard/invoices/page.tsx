'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

interface BillItem {
  id?: string;
  name: string;
  sku?: string;
  price: number;
  qty: number;
}

interface BillRecord {
  id: string;
  invoiceNo: string;
  type: 'POS Counter Sale' | 'E-Commerce Storefront' | 'B2B Wholesale Invoice';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  cashier?: string;
}

export default function InvoicesAndBillsPage() {
  const { formatAmount } = useCurrencyStore();
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  // Selected Bill Modal View
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchAllBills = async () => {
    setLoading(true);
    try {
      // Fetch E-Commerce & Storefront Orders
      const shopRes = await fetch('/api/shop/orders');
      let shopOrders: BillRecord[] = [];
      if (shopRes.ok) {
        const payload = await shopRes.json();
        shopOrders = (payload.orders || []).map((o: any) => ({
          id: o.orderId,
          invoiceNo: o.orderId,
          type: 'E-Commerce Storefront',
          customerName: o.customerName || 'Online Shopper',
          customerPhone: o.customerPhone || 'N/A',
          customerEmail: o.customerEmail,
          date: new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          items: o.items || [],
          subtotal: o.totalAmount * 0.85,
          tax: o.totalAmount * 0.15,
          discount: 0,
          total: o.totalAmount,
          paymentMethod: o.paymentMethod || 'Online Gateway',
          paymentStatus: o.paymentStatus || 'PAID',
          cashier: 'Web Storefront'
        }));
      }

      // Generate seed POS & B2B Invoices for demonstration vault
      const demoBills: BillRecord[] = [
        {
          id: 'NX-POS-889910',
          invoiceNo: 'NX-POS-889910',
          type: 'POS Counter Sale',
          customerName: 'Walk-In Store Customer',
          customerPhone: '+919876543210',
          date: new Date(Date.now() - 3600000 * 2).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          items: [
            { name: 'Britannia - Aged Cheddar Cheese Slice 200g', price: 7.28, qty: 2 },
            { name: 'Amul - Oatmeal Raisin Cookies 250g', price: 9.17, qty: 1 },
            { name: 'Nestle - Organic Orange Juice 1L', price: 4.50, qty: 3 }
          ],
          subtotal: 37.23,
          tax: 6.70,
          discount: 2.00,
          total: 41.93,
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          cashier: 'Admin Cashier'
        },
        {
          id: 'NX-POS-889911',
          invoiceNo: 'NX-POS-889911',
          type: 'POS Counter Sale',
          customerName: 'Sarah Connor',
          customerPhone: '+14155552671',
          date: new Date(Date.now() - 3600000 * 4).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          items: [
            { name: 'Dabur - Extra Virgin Olive Oil 1L', price: 24.29, qty: 1 },
            { name: 'Kelloggs - Greek Yogurt Strawberry 200g', price: 20.51, qty: 2 }
          ],
          subtotal: 65.31,
          tax: 11.75,
          discount: 5.00,
          total: 72.06,
          paymentMethod: 'UPI / QR',
          paymentStatus: 'PAID',
          cashier: 'Store Counter POS'
        },
        {
          id: 'INV-2026-991',
          invoiceNo: 'INV-2026-991',
          type: 'B2B Wholesale Invoice',
          customerName: 'Acme Supermarkets Corp',
          customerPhone: '+18005550199',
          customerEmail: 'billing@acme.com',
          date: new Date(Date.now() - 3600000 * 24).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          items: [
            { name: 'Quantum Core X9 Processors (Batch 50)', price: 499.00, qty: 10 },
            { name: 'Industrial Copper Wire Spools (50m)', price: 120.00, qty: 15 }
          ],
          subtotal: 6790.00,
          tax: 1222.20,
          discount: 200.00,
          total: 7812.20,
          paymentMethod: 'Bank Wire Transfer',
          paymentStatus: 'PAID',
          cashier: 'Finance Manager'
        }
      ];

      setBills([...shopOrders, ...demoBills]);
    } catch (err) {
      console.error('Failed to fetch bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBills();
  }, []);

  const openBillModal = (bill: BillRecord) => {
    setSelectedBill(bill);
    setIsViewModalOpen(true);
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerPhone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'All' ? true : b.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const totalBillRevenue = bills.reduce((acc, b) => acc + b.total, 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. TOP BILLS REPOSITORY HEADER */}
      <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[#14171F]">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#14171F] flex items-center gap-2">
            <Receipt className="text-[#5C64ED]" size={20} />
            Bills, POS Receipts & Tax Invoices Central Vault
          </h2>
          <p className="text-xs text-[#4F5565] font-medium mt-1">
            Centralized permanent storage for all sales bills generated across Smart POS, E-Commerce Storefront, and B2B Tax Invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono bg-[#FAF7F2] px-4 py-2 rounded-2xl border border-[#14171F]/10">
            <span className="text-[10px] text-[#4F5565] block font-bold uppercase">TOTAL STORE BILLS REVENUE</span>
            <span className="font-bold text-base text-emerald-700">{formatAmount(totalBillRevenue, { decimals: 2 })}</span>
          </div>

          <button
            onClick={fetchAllBills}
            className="px-3.5 py-2.5 bg-[#14171F] hover:bg-[#202532] text-white text-xs font-bold rounded-full transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'All', label: 'All Bills' },
            { id: 'POS Counter Sale', label: '🛒 POS Counter Bills' },
            { id: 'E-Commerce Storefront', label: '🌐 Online Store Bills' },
            { id: 'B2B Wholesale Invoice', label: '📄 B2B Tax Invoices' }
          ].map((f) => {
            const count = f.id === 'All' ? bills.length : bills.filter((b) => b.type === f.id).length;
            const isActive = filterType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-[#14171F] text-white border-[#14171F] shadow-sm'
                    : 'bg-white text-[#4F5565] border-[#14171F]/10 hover:bg-[#FAF7F2] hover:text-[#14171F]'
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#14171F]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C64ED]" />
          <input
            type="text"
            placeholder="Search Invoice # or Customer Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-white border border-[#14171F]/10 rounded-full pl-10 pr-4 text-xs font-medium text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:ring-1 focus:ring-[#5C64ED]"
          />
        </div>

      </div>

      {/* 3. BILLS TABLE LIST */}
      <div className="bg-white rounded-[28px] border border-[#14171F]/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#14171F]/10 text-[#4F5565] font-bold uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="p-4">Invoice / Bill No</th>
                <th className="p-4">Bill Channel</th>
                <th className="p-4">Customer & Phone</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14171F]/5 text-[#14171F]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#4F5565]">
                    <RefreshCw className="animate-spin text-[#5C64ED] mx-auto mb-2" size={20} />
                    Loading store bills...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#4F5565] space-y-1">
                    <Receipt size={28} className="mx-auto text-[#4F5565] mb-1" />
                    <p className="font-serif font-bold text-base text-[#14171F]">No bills found</p>
                    <p>Sales made via POS or storefront checkout will be permanently stored here.</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#FAF7F2]/60 transition">
                    
                    <td className="p-4 font-mono font-bold text-[#5C64ED]">
                      {bill.invoiceNo}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        bill.type === 'POS Counter Sale'
                          ? 'bg-[#5C64ED]/10 text-[#5C64ED] border-[#5C64ED]/30'
                          : bill.type === 'E-Commerce Storefront'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {bill.type}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-[#14171F] block">{bill.customerName}</span>
                      <span className="text-[10px] text-[#4F5565] font-mono">{bill.customerPhone}</span>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-[#4F5565]">
                      {bill.date}
                    </td>

                    <td className="p-4">
                      <span className="font-mono text-[#14171F] font-bold bg-[#FAF7F2] px-2.5 py-1 rounded-full border border-[#14171F]/10 text-[10px]">
                        {bill.paymentMethod}
                      </span>
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-sm text-emerald-700">
                      {formatAmount(bill.total, { decimals: 2 })}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => openBillModal(bill)}
                        className="px-3.5 py-1.5 bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs rounded-full transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-xs"
                      >
                        <Eye size={13} />
                        View Bill
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PRINTABLE TAX INVOICE & RECEIPT MODAL */}
      {isViewModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-[#14171F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#14171F]/10 rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl relative text-[#14171F]">
            
            <div className="flex justify-between items-center border-b border-[#14171F]/10 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2">
                  <Receipt size={18} className="text-[#5C64ED]" />
                  Tax Invoice Bill Record
                </h3>
                <span className="text-xs font-mono text-[#5C64ED] font-bold">{selectedBill.invoiceNo}</span>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-[#4F5565] hover:text-[#14171F] p-1 rounded-full bg-[#FAF7F2]">
                <X size={16} />
              </button>
            </div>

            {/* Printable Bill Thermal Element */}
            <div
              id="bill-receipt"
              className="bg-[#FAF7F2] text-[#14171F] p-5 rounded-2xl border border-[#14171F]/15 space-y-3 font-mono text-[11px] leading-tight select-none shadow-inner"
            >
              <div className="text-center border-b border-[#14171F]/20 pb-2 space-y-0.5">
                <h2 className="font-black text-base uppercase tracking-wider">NEXUS RETAIL STORE</h2>
                <p className="text-[10px] text-[#4F5565]">TAX INVOICE & CASH BILL</p>
                <p className="text-[9px] font-bold">INVOICE: {selectedBill.invoiceNo}</p>
                <p className="text-[9px] text-[#4F5565]">{selectedBill.date}</p>
              </div>

              <div className="border-b border-[#14171F]/20 pb-2 text-[10px] space-y-0.5">
                <p><strong>Customer:</strong> {selectedBill.customerName}</p>
                <p><strong>Phone:</strong> {selectedBill.customerPhone}</p>
                <p><strong>Cashier/Channel:</strong> {selectedBill.cashier || selectedBill.type}</p>
              </div>

              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-[#14171F]/20">
                    <th>ITEM</th>
                    <th className="text-center">QTY</th>
                    <th className="text-right">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#14171F]/5">
                      <td className="py-1 truncate max-w-[130px]">{item.name}</td>
                      <td className="py-1 text-center font-bold">{item.qty}</td>
                      <td className="py-1 text-right font-bold">{formatAmount(item.price * item.qty, { decimals: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-[#14171F] pt-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatAmount(selectedBill.subtotal, { decimals: 2 })}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount:</span>
                    <span>-{formatAmount(selectedBill.discount, { decimals: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (GST 18%):</span>
                  <span>{formatAmount(selectedBill.tax, { decimals: 2 })}</span>
                </div>
                <div className="flex justify-between font-black text-xs border-t border-[#14171F] pt-1 text-[#14171F]">
                  <span>TOTAL BILL:</span>
                  <span>{formatAmount(selectedBill.total, { decimals: 2 })}</span>
                </div>
                <div className="flex justify-between text-[9px] pt-1">
                  <span>Payment Mode:</span>
                  <span className="font-bold">{selectedBill.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center pt-2 border-t border-[#14171F]/20">
                <p className="text-[9px] font-bold">THANK YOU FOR SHOPPING WITH US!</p>
                <p className="text-[8px] text-[#4F5565]">Visit online: nexus-erp.com/shop</p>
              </div>

            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs rounded-full shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={16} />
                Print Thermal Bill (80mm / A4)
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-3.5 bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] font-bold text-xs rounded-full border border-[#14171F]/10 transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
