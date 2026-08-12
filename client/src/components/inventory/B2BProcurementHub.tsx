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
  ArrowRight,
  X
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

  // Fetch live supplier scorecards
  const fetchSupplierHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await fetch("/api/inventory/supplier-health");
      if (res.ok) {
        const data = await res.json();
        setSupplierHealth(data.scorecards || []);
      }
    } catch (err) {
      console.error("Failed to load supplier health scorecards:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchSupplierHealth();
  }, [suppliers, purchaseOrders]);

  // Handle PO status progression (Confirm -> In Transit -> Receive)
  const handleStatusChange = async (poId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/inventory/update-po-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poId, status: newStatus })
      });

      if (res.ok) {
        setNotification({
          message: `PO status upgraded to ${newStatus.toUpperCase()} and synced with inventory ledger.`,
          type: "success"
        });
        onRefresh();
        fetchSupplierHealth();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      setNotification({ message: "Network error updating PO status.", type: "error" });
    }
  };

  // Handle Manual RFQ Submit
  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedSupplierId) {
      alert("Please select both product and supplier.");
      return;
    }

    setSubmittingRfq(true);
    try {
      const selectedProd = products.find((p) => p.id === selectedProductId);
      const unitCost = selectedProd?.cost || 50;
      const totalAmount = unitCost * rfqQty;

      const res = await fetch("/api/inventory/create-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          supplierId: selectedSupplierId,
          qty: rfqQty,
          total: totalAmount,
          notes: rfqNotes
        })
      });

      if (res.ok) {
        setShowRfqModal(false);
        setRfqNotes("");
        setNotification({
          message: `Autonomous RFQ created successfully (+${rfqQty} units request dispatched).`,
          type: "success"
        });
        onRefresh();
      } else {
        throw new Error("Failed to create RFQ");
      }
    } catch (err) {
      alert("Failed to submit RFQ");
    } finally {
      setSubmittingRfq(false);
    }
  };

  // Filter Purchase Orders
  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesStatus = statusFilter === "all" || po.status?.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      po.id?.toLowerCase().includes(query) ||
      po.supplier?.name?.toLowerCase().includes(query) ||
      po.status?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Calculate summary metrics
  const pendingOrders = purchaseOrders.filter((p) => p.status === "pending");
  const inTransitOrders = purchaseOrders.filter((p) => p.status === "in_transit");
  const totalSpend = purchaseOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const avgLeadTime = supplierHealth.length > 0
    ? Math.round(supplierHealth.reduce((acc, curr) => acc + (curr.avgLeadTimeDays || 3), 0) / supplierHealth.length)
    : 3;

  return (
    <div className="space-y-6 text-[#14171F]">
      {/* NOTIFICATION TOAST */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-xs",
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-rose-50 text-rose-900 border-rose-300"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700" />
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
                <Sparkles size={12} className="text-[#5C64ED]" /> B2B AUTONOMOUS PROCUREMENT ENGINE
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#14171F] tracking-tight">
              Supplier Portal & Reorder Automation
            </h2>
            <p className="text-xs text-[#4F5565] mt-1 max-w-2xl leading-relaxed font-medium">
              Issue automated Requests for Quotation (RFQs), evaluate supplier health scorecards, track live shipments, and auto-sync received stock directly into financial ledgers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (products.length > 0) setSelectedProductId(products[0].id);
                if (suppliers.length > 0) setSelectedSupplierId(suppliers[0].id);
                setShowRfqModal(true);
              }}
              className="bg-[#14171F] hover:bg-[#202532] text-white font-bold text-xs px-4.5 py-2.5 rounded-full shadow-xs flex items-center gap-2 cursor-pointer transition"
            >
              <Plus size={14} /> Create Automated RFQ
            </button>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#5C64ED]/10 text-[#5C64ED] border border-[#5C64ED]/20">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Active Orders / RFQs</span>
            <div className="text-xl font-extrabold text-[#14171F] font-mono mt-0.5">{pendingOrders.length + inTransitOrders.length}</div>
            <span className="text-[10px] text-[#4F5565]">{pendingOrders.length} pending, {inTransitOrders.length} in transit</span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Total B2B Spend</span>
            <div className="text-xl font-extrabold text-[#14171F] font-mono mt-0.5">{formatAmount(totalSpend)}</div>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5"><TrendingUp size={11} /> Active ledger sync</span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Avg Vendor Lead Time</span>
            <div className="text-xl font-extrabold text-[#14171F] font-mono mt-0.5">{avgLeadTime} Days</div>
            <span className="text-[10px] text-[#4F5565]">Historical fulfillment rate</span>
          </div>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-[#14171F]/10 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">Verified Suppliers</span>
            <div className="text-xl font-extrabold text-[#14171F] font-mono mt-0.5">{suppliers.length}</div>
            <span className="text-[10px] text-amber-700 font-bold">Active network partners</span>
          </div>
        </div>
      </div>

      {/* VIEW TABS & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#14171F]/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("pos")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-2xs",
              activeTab === "pos"
                ? "bg-[#14171F] text-white border-[#14171F]"
                : "bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10 hover:bg-[#F2ECE4]"
            )}
          >
            <FileCheck size={14} /> Purchase Orders & RFQs ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-2xs",
              activeTab === "suppliers"
                ? "bg-[#14171F] text-white border-[#14171F]"
                : "bg-[#FAF7F2] text-[#14171F] border-[#14171F]/10 hover:bg-[#F2ECE4]"
            )}
          >
            <Building2 size={14} /> Supplier Health Scorecards ({suppliers.length})
          </button>
        </div>

        {activeTab === "pos" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4F5565]" />
              <input
                type="text"
                placeholder="Search PO or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-9 pr-3.5 bg-[#FAF7F2] border border-[#14171F]/10 rounded-full text-xs text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8.5 px-3 bg-[#FAF7F2] border border-[#14171F]/10 rounded-full text-xs text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
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
        <div className="p-6 bg-white rounded-[28px] border border-[#14171F]/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#14171F]/10 text-[#4F5565] font-bold uppercase tracking-wider font-mono">
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">Supplier Vendor</th>
                  <th className="pb-3 px-3">Quantity</th>
                  <th className="pb-3 px-3">Total Amount</th>
                  <th className="pb-3 px-3">Created Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14171F]/10">
                {filteredOrders.map((po) => {
                  const statusColors: { [key: string]: string } = {
                    pending: "bg-amber-100 text-amber-900 border-amber-300",
                    confirmed: "bg-indigo-100 text-indigo-900 border-indigo-300",
                    in_transit: "bg-purple-100 text-purple-900 border-purple-300",
                    received: "bg-emerald-100 text-emerald-900 border-emerald-300"
                  };

                  return (
                    <tr key={po.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3.5 px-3 font-mono text-[#14171F] font-bold">
                        PO-{po.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#14171F]">{po.supplier?.name || "Standard Vendor"}</div>
                        <div className="text-[10px] text-[#4F5565] font-mono">{po.supplier?.email || "vendor@b2b.com"}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#14171F] font-mono">
                        {po.qty || 20} units
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#14171F] font-mono">
                        {formatAmount(po.total || 0)}
                      </td>
                      <td className="py-3.5 px-3 text-[#4F5565] font-mono">
                        {new Date(po.date || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider font-mono", statusColors[po.status] || statusColors.pending)}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === "pending" && (
                            <button
                              onClick={() => handleStatusChange(po.id, "confirmed")}
                              className="px-3 py-1 rounded-full bg-[#5C64ED]/10 hover:bg-[#5C64ED]/20 border border-[#5C64ED]/30 text-[#5C64ED] font-bold text-[10px] transition cursor-pointer"
                            >
                              Confirm PO
                            </button>
                          )}
                          {po.status === "confirmed" && (
                            <button
                              onClick={() => handleStatusChange(po.id, "in_transit")}
                              className="px-3 py-1 rounded-full bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                            >
                              <Truck size={11} /> Mark In Transit
                            </button>
                          )}
                          {po.status === "in_transit" && (
                            <button
                              onClick={() => handleStatusChange(po.id, "received")}
                              className="px-3 py-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 size={11} /> Receive & Intake Stock
                            </button>
                          )}
                          {po.status === "received" && (
                            <span className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 size={13} /> Stock & Ledger Synced
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#4F5565] text-xs font-medium">
                      No Purchase Orders found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIER HEALTH SCORECARDS */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplierHealth.map((sup) => (
            <div key={sup.id} className="p-5 rounded-[24px] bg-white border border-[#14171F]/10 shadow-xs relative space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#14171F] flex items-center gap-2">
                    {sup.name}
                  </h4>
                  <span className="text-[10px] text-[#4F5565] font-mono block mt-0.5">{sup.contact}</span>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider font-mono",
                  sup.healthScore >= 85
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                )}>
                  {sup.healthScore}/100 {sup.status}
                </span>
              </div>

              {/* Progress Bar for Score */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#4F5565] font-mono">
                  <span>Vendor Performance Rating</span>
                  <span className="font-bold text-[#14171F]">{sup.fulfillmentRate}% On-Time</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF7F2] border border-[#14171F]/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      sup.healthScore >= 85 ? "bg-emerald-600" : "bg-amber-600"
                    )}
                    style={{ width: `${sup.healthScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#14171F]/10">
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#14171F]/10">
                  <span className="text-[10px] text-[#4F5565] block font-mono">Total PO Volume</span>
                  <span className="font-bold text-[#14171F] text-sm mt-0.5 block">{sup.poCount} Orders</span>
                </div>
                <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#14171F]/10">
                  <span className="text-[10px] text-[#4F5565] block font-mono">Procurement Spend</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm mt-0.5 block">{formatAmount(sup.totalSpend)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-[#4F5565] border-t border-[#14171F]/10 font-mono">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Lead Time: <strong className="text-[#14171F]">{sup.avgLeadTimeDays} Days</strong>
                </span>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${sup.email}`} className="p-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#14171F]/10 text-[#14171F] transition">
                    <Mail size={13} />
                  </a>
                  <a href={`tel:${sup.phone || "+15550192"}`} className="p-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#14171F]/10 text-[#14171F] transition">
                    <Phone size={13} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE RFQ MODAL */}
      <AnimatePresence>
        {showRfqModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRfqModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg p-6 rounded-[28px] bg-white border border-[#14171F]/15 shadow-2xl relative z-10 space-y-5 text-[#14171F]"
            >
              <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-3">
                <h3 className="text-lg font-serif font-bold text-[#14171F] flex items-center gap-2">
                  <Sparkles className="text-[#5C64ED]" size={18} /> Issue B2B Purchase Order / RFQ
                </h3>
                <button onClick={() => setShowRfqModal(false)} className="text-[#4F5565] hover:text-[#14171F] text-sm cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRfq} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="text-[#4F5565] font-bold uppercase tracking-wider block mb-1 font-mono text-[11px]">
                    Select Target Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                  >
                    <option value="">-- Select Product Catalogue Item --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock} | Cost: ${p.cost})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#4F5565] font-bold uppercase tracking-wider block mb-1 font-mono text-[11px]">
                    Select B2B Supplier Vendor
                  </label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-[#14171F] focus:outline-none focus:border-[#5C64ED]"
                  >
                    <option value="">-- Select Registered Vendor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contact})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#4F5565] font-bold uppercase tracking-wider block mb-1 font-mono text-[11px]">
                      Quantity Requested
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={rfqQty}
                      onChange={(e) => setRfqQty(Number(e.target.value))}
                      className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-[#14171F] focus:outline-none focus:border-[#5C64ED] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[#4F5565] font-bold uppercase tracking-wider block mb-1 font-mono text-[11px]">
                      Estimated PO Total
                    </label>
                    <div className="w-full h-10 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-[#5C64ED] font-bold font-mono flex items-center">
                      {formatAmount((products.find((p) => p.id === selectedProductId)?.cost || 50) * rfqQty)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[#4F5565] font-bold uppercase tracking-wider block mb-1 font-mono text-[11px]">
                    Special Procurement Terms / Delivery Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify delivery timeline, packing guidelines, or payment terms..."
                    value={rfqNotes}
                    onChange={(e) => setRfqNotes(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl p-3 text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
                  />
                </div>

                <div className="pt-3 border-t border-[#14171F]/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRfqModal(false)}
                    className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#14171F] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRfq}
                    className="px-5 py-2 rounded-full bg-[#14171F] hover:bg-[#202532] text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingRfq ? "Submitting..." : <><span>Submit Purchase Order RFQ</span> <ArrowRight size={14} /></>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
