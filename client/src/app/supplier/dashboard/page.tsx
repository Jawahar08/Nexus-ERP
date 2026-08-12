"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Package,
  Building2,
  FileCheck,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  Send,
  Plus
} from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import { useSupplier } from "../layout";
import { cn } from "@/lib/utils";

export default function SupplierDashboardPage() {
  const { formatAmount } = useCurrencyStore();
  const supplierContext = useSupplier();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    supplier: null,
    vmiStock: [],
    purchaseOrders: [],
    metrics: { activeOrdersCount: 0, vmiSkusCount: 0, totalReceivables: 0, avgDispatchDays: 2 }
  });

  const [localTab, setLocalTab] = useState<"vmi" | "orders" | "ledger">("vmi");
  const activeTab = supplierContext?.activeTab || localTab;
  const setActiveTab = (tab: "vmi" | "orders" | "ledger") => {
    if (supplierContext?.setActiveTab) {
      supplierContext.setActiveTab(tab);
    } else {
      setLocalTab(tab);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/supplier/dashboard");
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.error("Failed to load supplier dashboard dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch("/api/supplier/order-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action })
      });

      const result = await res.json();
      if (res.ok) {
        setNotification({
          message: result.message || `Order #${orderId.slice(0, 8)} updated successfully.`,
          type: "success"
        });
        fetchSupplierData();
      } else {
        setNotification({ message: result.error || "Action failed", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Network error processing order action", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="animate-spin text-[#5C64ED]" />
          <span className="text-xs font-mono font-bold text-[#4F5565]">Loading live vendor node...</span>
        </div>
      </div>
    );
  }

  const { supplier, vmiStock, purchaseOrders, metrics } = data;

  const filteredVmi = vmiStock.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = purchaseOrders.filter((po: any) =>
    (po.supplier?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || po.id.includes(searchQuery)
  );

  return (
    <div className="space-y-6 text-[#14171F]">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs",
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-700" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BANNER */}
      <div className="p-6 rounded-[28px] bg-white border border-[#14171F]/10 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-[#5C64ED] bg-[#5C64ED]/10 border border-[#5C64ED]/20 rounded-full flex items-center gap-1.5 font-mono">
                <Truck size={12} className="text-[#5C64ED]" /> INTERCONNECTED B2B SUPPLIER NODE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#14171F] tracking-tight">
              {supplier?.name || "Intelisys Vendor Operations"}
            </h1>
            <p className="text-xs text-[#4F5565] mt-1 max-w-2xl leading-relaxed font-medium">
              Live Vendor-Managed Inventory (VMI) monitor, incoming retail store Purchase Orders, dispatch tracking, and financial B2B ledger clearing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchSupplierData}
              className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] border border-[#14171F]/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <RefreshCw size={13} className="text-[#5C64ED]" /> Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#5C64ED]/10 text-[#5C64ED] border border-[#5C64ED]/20">
            <FileCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Active B2B Orders</span>
            <div className="text-xl font-extrabold text-[#14171F] font-mono mt-0.5">{metrics.activeOrdersCount}</div>
            <span className="text-[10px] text-[#4F5565]">Pending & In Transit</span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Package size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Monitored VMI SKUs</span>
            <div className="text-xl font-extrabold text-[#14171F] font-mono mt-0.5">{metrics.vmiSkusCount}</div>
            <span className="text-[10px] text-[#4F5565]">Connected warehouses</span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Total Receivables</span>
            <div className="text-xl font-extrabold text-[#14171F] font-mono mt-0.5">{formatAmount(metrics.totalReceivables)}</div>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5"><TrendingUp size={11} /> Active shop ledger</span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Avg Dispatch Speed</span>
            <div className="text-xl font-extrabold text-[#14171F] font-mono mt-0.5">{metrics.avgDispatchDays} Days</div>
            <span className="text-[10px] text-amber-700 font-bold">Order-to-ship SLA</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#14171F]/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("vmi")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-2xs",
              activeTab === "vmi"
                ? "bg-[#14171F] text-white border-[#14171F]"
                : "bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10 hover:bg-[#F2ECE4]"
            )}
          >
            <Package size={14} /> Live VMI Stock Monitor ({vmiStock.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-2xs",
              activeTab === "orders"
                ? "bg-[#14171F] text-white border-[#14171F]"
                : "bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10 hover:bg-[#F2ECE4]"
            )}
          >
            <FileCheck size={14} /> B2B Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-2xs",
              activeTab === "ledger"
                ? "bg-[#14171F] text-white border-[#14171F]"
                : "bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10 hover:bg-[#F2ECE4]"
            )}
          >
            <DollarSign size={14} /> B2B Invoices & Payouts
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4F5565]" />
          <input
            type="text"
            placeholder="Search items or orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8.5 pl-9 pr-3.5 bg-[#FAF7F2] border border-[#14171F]/10 rounded-full text-xs text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
          />
        </div>
      </div>

      {/* TAB 1: LIVE VMI STOCK MONITOR */}
      {activeTab === "vmi" && (
        <div className="p-6 rounded-[28px] bg-white border border-[#14171F]/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2">
                <ShieldCheck size={17} className="text-[#5C64ED]" /> Vendor-Managed Inventory (VMI) Balances
              </h3>
              <p className="text-xs text-[#4F5565] mt-0.5 font-medium">Real-time stock monitoring of your products across connected retailer shop warehouses.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#14171F]/10 text-[#4F5565] font-bold uppercase tracking-wider font-mono text-[11px]">
                  <th className="pb-3 px-3">Product Name</th>
                  <th className="pb-3 px-3">SKU</th>
                  <th className="pb-3 px-3">Target Warehouse</th>
                  <th className="pb-3 px-3 text-right">Unit Wholesale Cost</th>
                  <th className="pb-3 px-3 text-right">Live Shop Stock</th>
                  <th className="pb-3 px-3 text-right">Restock Threshold</th>
                  <th className="pb-3 px-3">Stock Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14171F]/10">
                {filteredVmi.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2] transition-colors h-12">
                    <td className="py-3 px-3 font-bold text-[#14171F]">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#4F5565] font-semibold">
                      {item.sku}
                    </td>
                    <td className="py-3 px-3 text-[#4F5565] font-medium">
                      {item.warehouseName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#14171F]">
                      {formatAmount(item.cost || item.price * 0.6)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#14171F] font-mono">
                      {item.stock} units
                    </td>
                    <td className="py-3 px-3 text-right text-[#4F5565] font-mono font-medium">
                      {item.minStock} units
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider inline-flex items-center gap-1 font-mono",
                          item.isLowStock
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-emerald-100 text-emerald-900 border-emerald-300"
                        )}
                      >
                        {item.isLowStock ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredVmi.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#4F5565] text-xs font-medium">
                      No VMI product records found for this vendor node.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INCOMING B2B PURCHASE ORDERS */}
      {activeTab === "orders" && (
        <div className="p-6 rounded-[28px] bg-white border border-[#14171F]/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2">
                <FileCheck size={17} className="text-[#5C64ED]" /> Incoming Retailer Purchase Orders & RFQs
              </h3>
              <p className="text-xs text-[#4F5565] mt-0.5 font-medium">Manage incoming B2B supply orders, accept POs, update dispatch status, and trigger stock intake.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#14171F]/10 text-[#4F5565] font-bold uppercase tracking-wider font-mono text-[11px]">
                  <th className="pb-3 px-3">PO Number</th>
                  <th className="pb-3 px-3">Target Retailer</th>
                  <th className="pb-3 px-3">Requested Qty</th>
                  <th className="pb-3 px-3">Total Value</th>
                  <th className="pb-3 px-3">Date Received</th>
                  <th className="pb-3 px-3">Current Status</th>
                  <th className="pb-3 px-3 text-right">Vendor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14171F]/10">
                {filteredOrders.map((po: any) => {
                  const statusColors: { [key: string]: string } = {
                    pending: "bg-amber-100 text-amber-900 border-amber-300",
                    confirmed: "bg-indigo-100 text-indigo-900 border-indigo-300",
                    in_transit: "bg-purple-100 text-purple-900 border-purple-300",
                    received: "bg-emerald-100 text-emerald-900 border-emerald-300"
                  };

                  const isLoadingThis = actionLoading === po.id;

                  return (
                    <tr key={po.id} className="hover:bg-[#FAF7F2] transition-colors h-13">
                      <td className="py-3 px-3 font-mono text-[#14171F] font-bold">
                        PO-{po.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#14171F]">{po.supplier?.name || "Retail Shop"}</div>
                        <div className="text-[10px] text-[#4F5565] font-mono">Domain: nexus.erp</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#14171F] font-mono">
                        {po.qty || 50} units
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-800 font-mono text-sm">
                        {formatAmount(po.total || 0)}
                      </td>
                      <td className="py-3 px-3 text-[#4F5565] font-mono">
                        {new Date(po.date || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider font-mono", statusColors[po.status] || statusColors.pending)}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === "pending" && (
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleOrderAction(po.id, "accept")}
                              className="px-3 py-1 rounded-full bg-[#5C64ED] hover:bg-[#4B52D9] text-white font-bold text-[10px] transition cursor-pointer shadow-xs"
                            >
                              Accept PO
                            </button>
                          )}
                          {po.status === "confirmed" && (
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleOrderAction(po.id, "dispatch")}
                              className="px-3 py-1 rounded-full bg-[#14171F] hover:bg-[#202532] text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Truck size={11} /> Dispatch Shipment
                            </button>
                          )}
                          {po.status === "in_transit" && (
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleOrderAction(po.id, "deliver")}
                              className="px-3 py-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 size={11} /> Confirm Delivery Intake
                            </button>
                          )}
                          {po.status === "received" && (
                            <span className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 size={13} /> Fulfilled & Cleared
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: B2B INVOICES & LEDGER */}
      {activeTab === "ledger" && (
        <div className="p-6 rounded-[28px] bg-white border border-[#14171F]/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2">
                <DollarSign size={17} className="text-[#5C64ED]" /> B2B Financial Settlement Ledger
              </h3>
              <p className="text-xs text-[#4F5565] mt-0.5 font-medium">Summary of order receivables, fulfilled invoices, and pending store payouts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-[22px] bg-[#FAF7F2] border border-[#14171F]/10 space-y-1">
              <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Total Invoiced Amount</span>
              <div className="text-2xl font-extrabold text-[#14171F] font-mono mt-1">{formatAmount(metrics.totalReceivables)}</div>
              <span className="text-[10px] text-[#4F5565] font-mono">Cumulative order value</span>
            </div>

            <div className="p-5 rounded-[22px] bg-[#FAF7F2] border border-[#14171F]/10 space-y-1">
              <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Cleared Payouts</span>
              <div className="text-2xl font-extrabold text-emerald-800 font-mono mt-1">
                {formatAmount(purchaseOrders.filter((po: any) => po.status === "received").reduce((acc: number, po: any) => acc + (po.total || 0), 0))}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold font-mono">Stock received & ledger booked</span>
            </div>

            <div className="p-5 rounded-[22px] bg-[#FAF7F2] border border-[#14171F]/10 space-y-1">
              <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Pending Processing</span>
              <div className="text-2xl font-extrabold text-amber-800 font-mono mt-1">
                {formatAmount(purchaseOrders.filter((po: any) => po.status !== "received").reduce((acc: number, po: any) => acc + (po.total || 0), 0))}
              </div>
              <span className="text-[10px] text-amber-700 font-bold font-mono">Active shipments & POs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
