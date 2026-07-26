"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Plus,
  Send,
  Truck,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Mail,
  Phone,
  ArrowRight
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useCurrencyStore } from "@/store/currencyStore";
import { cn } from "@/lib/utils";

interface B2BProcurementHubProps {
  products: any[];
  suppliers: any[];
  purchaseOrders: any[];
  onRefresh: () => void;
}

export default function B2BProcurementHub({
  products,
  suppliers,
  purchaseOrders,
  onRefresh
}: B2BProcurementHubProps) {
  const { formatAmount } = useCurrencyStore();
  const [supplierHealth, setSupplierHealth] = useState<any[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [activeTab, setActiveTab] = useState<"pos" | "suppliers">("pos");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // RFQ Modal State
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [rfqQty, setRfqQty] = useState<number>(50);
  const [rfqNotes, setRfqNotes] = useState("");
  const [submittingRfq, setSubmittingRfq] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchSupplierHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await fetch("/api/inventory/procurement/suppliers-health");
      if (res.ok) {
        const data = await res.json();
        setSupplierHealth(data.suppliers || []);
      }
    } catch (err) {
      console.error("Failed to fetch supplier health:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchSupplierHealth();
  }, [purchaseOrders]);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) return;

    try {
      setSubmittingRfq(true);
      const res = await fetch("/api/inventory/procurement/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId || null,
          supplierId: selectedSupplierId,
          qty: rfqQty,
          notes: rfqNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({ message: data.message || "Automated RFQ & PO generated successfully!", type: "success" });
        setShowRfqModal(false);
        setRfqNotes("");
        onRefresh();
      } else {
        setNotification({ message: data.error || "Failed to issue RFQ", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Network error generating procurement RFQ", type: "error" });
    } finally {
      setSubmittingRfq(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/inventory/procurement/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({
          message: newStatus === "received" 
            ? "Order Intake Received! Stock levels & financial expense ledger updated automatically." 
            : `Order status updated to '${newStatus}'.`,
          type: "success"
        });
        onRefresh();
      }
    } catch (err) {
      setNotification({ message: "Failed to update Purchase Order status", type: "error" });
    }
  };

  // Compute Metrics
  const pendingOrders = purchaseOrders.filter((po) => po.status === "pending" || po.status === "confirmed");
  const inTransitOrders = purchaseOrders.filter((po) => po.status === "in_transit");
  const totalSpend = purchaseOrders.reduce((acc, po) => acc + (po.total || 0), 0);
  const avgLeadTime = supplierHealth.length > 0
    ? Math.round(supplierHealth.reduce((acc, s) => acc + s.avgLeadTimeDays, 0) / supplierHealth.length)
    : 3;

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    const supplierName = po.supplier?.name || "";
    const matchesSearch = supplierName.toLowerCase().includes(searchQuery.toLowerCase()) || po.id.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

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
      <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/60 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-400" /> B2B AUTONOMOUS PROCUREMENT ENGINE
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Supplier Portal & Reorder Automation
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Issue automated Requests for Quotation (RFQs), evaluate supplier health scorecards, track live shipments, and auto-sync received stock directly into financial ledgers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <AnimatedButton
              onClick={() => {
                if (products.length > 0) setSelectedProductId(products[0].id);
                if (suppliers.length > 0) setSelectedSupplierId(suppliers[0].id);
                setShowRfqModal(true);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} /> Create Automated RFQ
            </AnimatedButton>
          </div>
        </div>
      </GlassCard>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Active Orders / RFQs</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{pendingOrders.length + inTransitOrders.length}</div>
            <span className="text-[10px] text-zinc-400">{pendingOrders.length} pending, {inTransitOrders.length} in transit</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total B2B Spend</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{formatAmount(totalSpend)}</div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><TrendingUp size={10} /> Active ledger sync</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Avg Vendor Lead Time</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{avgLeadTime} Days</div>
            <span className="text-[10px] text-zinc-400">Based on historical fulfillment</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Verified Suppliers</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{suppliers.length}</div>
            <span className="text-[10px] text-amber-400">Active B2B network nodes</span>
          </div>
        </GlassCard>
      </div>

      {/* VIEW TABS & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("pos")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "pos"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <FileCheck size={14} /> Purchase Orders & RFQs ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "suppliers"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Building2 size={14} /> Supplier Health Scorecards ({suppliers.length})
          </button>
        </div>

        {activeTab === "pos" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search PO or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-9 pr-3 bg-white/[0.04] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_transit">In Transit</option>
              <option value="received">Received</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: PURCHASE ORDERS & RFQS */}
      {activeTab === "pos" && (
        <GlassCard className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">Supplier Vendor</th>
                  <th className="pb-3 px-3">Quantity</th>
                  <th className="pb-3 px-3">Total Amount</th>
                  <th className="pb-3 px-3">Created Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((po) => {
                  const statusColors: { [key: string]: string } = {
                    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    confirmed: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                    in_transit: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                    received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  };

                  return (
                    <tr key={po.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3 font-mono text-zinc-300 font-bold">
                        PO-{po.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-white">{po.supplier?.name || "Standard Vendor"}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{po.supplier?.email || "vendor@b2b.com"}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-zinc-300">
                        {po.qty || 20} units
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white font-mono">
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
                              onClick={() => handleStatusChange(po.id, "confirmed")}
                              className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-[10px] transition cursor-pointer"
                            >
                              Confirm PO
                            </button>
                          )}
                          {po.status === "confirmed" && (
                            <button
                              onClick={() => handleStatusChange(po.id, "in_transit")}
                              className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold text-[10px] transition cursor-pointer flex items-center gap-1"
                            >
                              <Truck size={10} /> Mark In Transit
                            </button>
                          )}
                          {po.status === "in_transit" && (
                            <button
                              onClick={() => handleStatusChange(po.id, "received")}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 size={10} /> Receive & Intake Stock
                            </button>
                          )}
                          {po.status === "received" && (
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <CheckCircle2 size={12} /> Stock & Ledger Synced
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                      No Purchase Orders found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* TAB 2: SUPPLIER HEALTH SCORECARDS */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplierHealth.map((sup) => (
            <GlassCard key={sup.id} className="p-5 relative space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {sup.name}
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{sup.contact}</span>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider",
                  sup.healthScore >= 85
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                )}>
                  {sup.healthScore}/100 {sup.status}
                </span>
              </div>

              {/* Progress Bar for Score */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Vendor Performance Rating</span>
                  <span className="font-bold text-white">{sup.fulfillmentRate}% On-Time Delivery</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      sup.healthScore >= 85 ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: `${sup.healthScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                <div className="bg-white/[0.02] p-2 rounded border border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Total PO Volume</span>
                  <span className="font-bold text-white">{sup.poCount} Orders</span>
                </div>
                <div className="bg-white/[0.02] p-2 rounded border border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Total Procurement Spend</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatAmount(sup.totalSpend)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400 border-t border-white/5">
                <span className="flex items-center gap-1 text-zinc-500">
                  <Clock size={12} /> Lead Time: <strong className="text-zinc-200">{sup.avgLeadTimeDays} Days</strong>
                </span>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${sup.email}`} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition">
                    <Mail size={13} />
                  </a>
                  <a href={`tel:${sup.phone || "+15550192"}`} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition">
                    <Phone size={13} />
                  </a>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* CREATE RFQ MODAL */}
      <AnimatePresence>
        {showRfqModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRfqModal(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-lg p-6 rounded-2xl relative z-10 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-indigo-400" size={18} /> Issue B2B Purchase Order / RFQ
                </h3>
                <button onClick={() => setShowRfqModal(false)} className="text-zinc-500 hover:text-white text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRfq} className="space-y-4 text-xs">
                <div>
                  <label className="text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                    Select Target Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full h-10 bg-white/[0.04] border border-white/10 rounded-lg px-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Product Catalogue Item --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                        {p.name} (Stock: {p.stock} | Cost: ${p.cost})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                    Select B2B Supplier Vendor
                  </label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full h-10 bg-white/[0.04] border border-white/10 rounded-lg px-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Registered Vendor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                        {s.name} ({s.contact})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                      Quantity Requested
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={rfqQty}
                      onChange={(e) => setRfqQty(Number(e.target.value))}
                      className="w-full h-10 bg-white/[0.04] border border-white/10 rounded-lg px-3 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                      Estimated PO Total
                    </label>
                    <div className="w-full h-10 bg-white/[0.02] border border-white/10 rounded-lg px-3 text-indigo-400 font-bold font-mono flex items-center">
                      {formatAmount((products.find((p) => p.id === selectedProductId)?.cost || 50) * rfqQty)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                    Special Procurement Terms / Delivery Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify delivery timeline, packing guidelines, or payment terms..."
                    value={rfqNotes}
                    onChange={(e) => setRfqNotes(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRfqModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 font-medium"
                  >
                    Cancel
                  </button>
                  <AnimatedButton
                    type="submit"
                    isLoading={submittingRfq}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/20"
                  >
                    Submit Purchase Order RFQ <ArrowRight size={14} />
                  </AnimatedButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
