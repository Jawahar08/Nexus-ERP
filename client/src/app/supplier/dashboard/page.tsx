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
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useCurrencyStore } from "@/store/currencyStore";
import { cn } from "@/lib/utils";

export default function SupplierDashboardPage() {
  const { formatAmount } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    supplier: null,
    vmiStock: [],
    purchaseOrders: [],
    metrics: { activeOrdersCount: 0, vmiSkusCount: 0, totalReceivables: 0, avgDispatchDays: 2 }
  });

  const [activeTab, setActiveTab] = useState<"vmi" | "orders" | "ledger">("vmi");
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
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
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-xl border text-sm font-medium flex items-center justify-between shadow-lg",
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BANNER */}
      <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-zinc-900/60 border-purple-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1">
                <Truck size={11} className="text-purple-400" /> INTERCONNECTED B2B SUPPLIER NODE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              {supplier?.name || "Intelisys Vendor Operations"}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Live Vendor-Managed Inventory (VMI) monitor, incoming retail store Purchase Orders, dispatch tracking, and financial B2B ledger clearing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <AnimatedButton
              onClick={fetchSupplierData}
              variant="outline"
              size="sm"
              className="gap-1.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            >
              <RefreshCw size={13} /> Refresh Data
            </AnimatedButton>
          </div>
        </div>
      </GlassCard>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Active B2B Orders</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{metrics.activeOrdersCount}</div>
            <span className="text-[10px] text-purple-300">Pending & In Transit</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Package size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Monitored VMI SKUs</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{metrics.vmiSkusCount}</div>
            <span className="text-[10px] text-zinc-400">Connected shop warehouses</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total B2B Receivables</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{formatAmount(metrics.totalReceivables)}</div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><TrendingUp size={10} /> Active shop ledger</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Avg Dispatch Speed</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{metrics.avgDispatchDays} Days</div>
            <span className="text-[10px] text-amber-400">Order-to-ship SLA</span>
          </div>
        </GlassCard>
      </div>

      {/* NAVIGATION TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("vmi")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "vmi"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Package size={14} /> Live VMI Stock Monitor ({vmiStock.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "orders"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <FileCheck size={14} /> B2B Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "ledger"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <DollarSign size={14} /> B2B Invoices & Payouts
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search items or orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-9 pr-3 bg-white/[0.04] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* TAB 1: LIVE VMI STOCK MONITOR */}
      {activeTab === "vmi" && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-400" /> Vendor-Managed Inventory (VMI) Balances
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Real-time stock monitoring of your products across connected retailer shop warehouses.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">Product Name</th>
                  <th className="pb-3 px-3">SKU</th>
                  <th className="pb-3 px-3">Target Warehouse</th>
                  <th className="pb-3 px-3 text-right">Unit Wholesale Cost</th>
                  <th className="pb-3 px-3 text-right">Live Shop Stock</th>
                  <th className="pb-3 px-3 text-right">Restock Threshold</th>
                  <th className="pb-3 px-3">Stock Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVmi.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-white">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-zinc-400">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-3 text-zinc-300">
                      {item.warehouseName}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-zinc-200">
                      {formatAmount(item.cost || item.price * 0.6)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-white">
                      {item.stock} units
                    </td>
                    <td className="py-3.5 px-3 text-right text-zinc-400 font-mono">
                      {item.minStock} units
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider inline-flex items-center gap-1",
                          item.isLowStock
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        )}
                      >
                        {item.isLowStock ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredVmi.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                      No VMI product records found for this vendor node.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* TAB 2: INCOMING B2B PURCHASE ORDERS */}
      {activeTab === "orders" && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileCheck size={16} className="text-purple-400" /> Incoming Retailer Purchase Orders & RFQs
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Manage incoming B2B supply orders, accept POs, update dispatch status, and trigger stock intake.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">PO Number</th>
                  <th className="pb-3 px-3">Target Retailer</th>
                  <th className="pb-3 px-3">Requested Qty</th>
                  <th className="pb-3 px-3">Total Value</th>
                  <th className="pb-3 px-3">Date Received</th>
                  <th className="pb-3 px-3">Current Status</th>
                  <th className="pb-3 px-3 text-right">Vendor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((po: any) => {
                  const statusColors: { [key: string]: string } = {
                    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    confirmed: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                    in_transit: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  };

                  const isLoadingThis = actionLoading === po.id;

                  return (
                    <tr key={po.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3 font-mono text-white font-bold">
                        PO-{po.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-white">{po.supplier?.name || "Retail Shop"}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Domain: nexus.erp</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-zinc-300">
                        {po.qty || 50} units
                      </td>
                      <td className="py-3.5 px-3 font-bold text-emerald-400 font-mono">
                        {formatAmount(po.total || 0)}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-400">
                        {new Date(po.date || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", statusColors[po.status] || statusColors.pending)}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === "pending" && (
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleOrderAction(po.id, "accept")}
                              className="px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-semibold text-[10px] transition cursor-pointer"
                            >
                              Accept PO
                            </button>
                          )}
                          {po.status === "confirmed" && (
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleOrderAction(po.id, "dispatch")}
                              className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-semibold text-[10px] transition cursor-pointer flex items-center gap-1"
                            >
                              <Truck size={10} /> Dispatch Shipment
                            </button>
                          )}
                          {po.status === "in_transit" && (
                            <button
                              disabled={isLoadingThis}
                              onClick={() => handleOrderAction(po.id, "deliver")}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 size={10} /> Confirm Delivery Intake
                            </button>
                          )}
                          {po.status === "received" && (
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <CheckCircle2 size={12} /> Fulfilled & Cleared
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
        </GlassCard>
      )}

      {/* TAB 3: B2B INVOICES & LEDGER */}
      {activeTab === "ledger" && (
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-400" /> B2B Financial Settlement Ledger
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Summary of order receivables, fulfilled invoices, and pending store payouts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Invoiced Amount</span>
              <div className="text-2xl font-extrabold text-white font-mono">{formatAmount(metrics.totalReceivables)}</div>
              <span className="text-[10px] text-zinc-400">Cumulative order value</span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Cleared Payouts</span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {formatAmount(purchaseOrders.filter((po: any) => po.status === "received").reduce((acc: number, po: any) => acc + (po.total || 0), 0))}
              </div>
              <span className="text-[10px] text-emerald-400">Stock received & expense booked</span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Pending Processing</span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {formatAmount(purchaseOrders.filter((po: any) => po.status !== "received").reduce((acc: number, po: any) => acc + (po.total || 0), 0))}
              </div>
              <span className="text-[10px] text-amber-400">Active shipments & POs</span>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
