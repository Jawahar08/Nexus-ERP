'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Printer,
  ExternalLink,
  MapPin,
  User,
  Phone,
  Calendar,
  AlertCircle,
  QrCode,
  Tag,
  X,
  Send,
  RefreshCw,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

interface Order {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryType: 'delivery' | 'pickup';
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: 'Pending' | 'Packing' | 'Dispatched' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  carrierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  notes?: string;
  createdAt: string;
}

export default function OrderFulfillmentHub() {
  const { formatAmount } = useCurrencyStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Selected Order for Dispatch & Fulfillment Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [isShippingLabelModalOpen, setIsShippingLabelModalOpen] = useState(false);

  // Fulfillment Form State
  const [formStatus, setFormStatus] = useState<string>('Pending');
  const [formCarrier, setFormCarrier] = useState<string>('Shiprocket');
  const [formTrackingNo, setFormTrackingNo] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shop/orders');
      if (res.ok) {
        const payload = await res.json();
        setOrders(payload.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openFulfillModal = (order: Order) => {
    setSelectedOrder(order);
    setFormStatus(order.fulfillmentStatus);
    setFormCarrier(order.carrierName !== 'Unassigned' ? order.carrierName : 'Shiprocket');
    setFormTrackingNo(order.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormNotes(order.notes || '');
    setIsFulfillModalOpen(true);
  };

  const openLabelModal = (order: Order) => {
    setSelectedOrder(order);
    setIsShippingLabelModalOpen(true);
  };

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/shop/orders/${selectedOrder.orderId}/fulfillment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentStatus: formStatus,
          carrierName: formCarrier,
          trackingNumber: formTrackingNo,
          notes: formNotes,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.orderId === selectedOrder.orderId ? payload.order : o))
        );
        setIsFulfillModalOpen(false);
      } else {
        alert('Failed to update order fulfillment');
      }
    } catch (err) {
      alert('Network error updating order');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ? true : o.fulfillmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Packing':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Dispatched':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Out for Delivery':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Delivered':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP DISPATCH HUB HEADER & STATS SUMMARY                       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="glass p-5 rounded-2xl border border-indigo-500/20 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Truck className="text-indigo-400" size={20} />
            Order Dispatch, Shipping & Fulfillment Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage e-commerce order lifecycle, assign 3PL carriers (Shiprocket, BlueDart, Porter), print packing slips & shipping labels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded-xl border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Orders
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. STAGE FILTER TABS & SEARCH BAR                                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Stage Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'Packing', 'Dispatched', 'Out for Delivery', 'Delivered'].map((st) => {
            const count = st === 'All' ? orders.length : orders.filter((o) => o.fulfillmentStatus === st).length;
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-900/80 text-zinc-400 border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{st}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Order ID or Customer Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. ORDERS GRID / LIST CARDS                                      */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="animate-spin text-indigo-400" size={24} />
          <span>Loading store orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass p-12 rounded-2xl border border-white/10 text-center text-zinc-500 text-xs space-y-2">
          <Package size={32} className="mx-auto text-zinc-600" />
          <p className="font-bold text-sm text-zinc-400">No orders found</p>
          <p>Orders placed via storefront checkout or POS will appear here for fulfillment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isDelivery = order.deliveryType === 'delivery';
            const isUnpaid = order.paymentStatus.includes('NOT YET PAID');

            return (
              <div
                key={order.orderId}
                className="glass p-5 rounded-2xl border border-white/10 bg-slate-900/80 hover:border-indigo-500/40 transition flex flex-col justify-between gap-4 relative group"
              >
                
                {/* Header: Order ID & Fulfillment Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-indigo-300">{order.orderId}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border font-mono ${getStatusBadgeClass(order.fulfillmentStatus)}`}>
                        {order.fulfillmentStatus}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                      {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isDelivery ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                    {isDelivery ? '📦 Delivery' : '🏪 Pickup'}
                  </span>
                </div>

                {/* Customer & Address Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <User size={13} className="text-zinc-400 shrink-0" />
                    <span>{order.customerName}</span>
                    <span className="text-zinc-400 font-mono text-[11px]">({order.customerPhone})</span>
                  </div>

                  <div className="flex items-start gap-2 text-zinc-400 text-[11px]">
                    <MapPin size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span className="truncate max-w-[240px]">{order.address}</span>
                  </div>
                </div>

                {/* Order Items Checklist Breakdown */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1 text-xs font-mono">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 flex justify-between">
                    <span>Items ({order.items.reduce((acc, i) => acc + i.qty, 0)})</span>
                    <span>Subtotal</span>
                  </div>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-300 text-[11px]">
                      <span className="truncate max-w-[170px]">• {item.name} (x{item.qty})</span>
                      <span>{formatAmount(item.price * item.qty, { decimals: 2 })}</span>
                    </div>
                  ))}
                </div>

                {/* Total & Payment Status */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Payment Status:</span>
                    <span className={`font-bold text-[11px] ${isUnpaid ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isUnpaid ? '⏳ Pay on Pickup/Delivery' : '✓ PAID'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 block text-[10px]">Total Amount:</span>
                    <span className="font-mono font-bold text-sm text-indigo-400">
                      {formatAmount(order.totalAmount, { decimals: 2 })}
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => openFulfillModal(order)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Truck size={14} />
                    Fulfill & Dispatch
                  </button>

                  <button
                    onClick={() => openLabelModal(order)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs rounded-xl border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={14} />
                    Label
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 4. DISPATCH & FULFILLMENT UPDATE MODAL                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isFulfillModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Truck size={18} className="text-indigo-400" />
                  Order Dispatch & Fulfillment
                </h3>
                <span className="text-xs font-mono text-indigo-300 font-bold">{selectedOrder.orderId}</span>
              </div>
              <button onClick={() => setIsFulfillModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateFulfillment} className="space-y-4 text-xs">
              
              {/* Stage Selector */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5 uppercase tracking-wider text-[10px]">
                  Fulfillment Lifecycle Stage
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Pending">⏳ Pending (Pick list created)</option>
                  <option value="Packing">📦 Packing (In warehouse bin)</option>
                  <option value="Dispatched">🚚 Dispatched (Handed to courier)</option>
                  <option value="Out for Delivery">🛵 Out for Delivery (Final mile)</option>
                  <option value="Delivered">✅ Delivered (Completed)</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>

              {/* Logistics Carrier Selector */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5 uppercase tracking-wider text-[10px]">
                  Logistics Carrier / Partner
                </label>
                <select
                  value={formCarrier}
                  onChange={(e) => setFormCarrier(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Shiprocket">Shiprocket Courier</option>
                  <option value="BlueDart">BlueDart Express</option>
                  <option value="Porter">Porter Local Delivery</option>
                  <option value="FedEx">FedEx International</option>
                  <option value="In-House Delivery">In-House Store Fleet</option>
                </select>
              </div>

              {/* Airway Bill / Tracking Number */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5 uppercase tracking-wider text-[10px]">
                  Airway Bill / Tracking ID
                </label>
                <input
                  type="text"
                  value={formTrackingNo}
                  onChange={(e) => setFormTrackingNo(e.target.value)}
                  placeholder="e.g. TRK-88992200"
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1.5 uppercase tracking-wider text-[10px]">
                  Dispatch & Delivery Instructions
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Leave package with front security desk..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  {updating ? 'Updating Order...' : 'Save & Update Fulfillment Status'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 5. PRINTABLE PACKING SLIP & SHIPPING LABEL MODAL                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isShippingLabelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Printer size={18} className="text-indigo-400" />
                Print Shipping Label & Packing Slip
              </h3>
              <button onClick={() => setIsShippingLabelModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            {/* Printable Shipping Label Element */}
            <div
              id="shipping-label"
              className="bg-white text-black p-5 rounded-lg border-2 border-black space-y-3 font-mono text-[11px] leading-tight select-none shadow-inner"
            >
              
              {/* Header Label Barcode */}
              <div className="border-b-2 border-black pb-2 text-center">
                <h2 className="font-black text-base uppercase tracking-wider">NEXUS LOGISTICS DISPATCH</h2>
                <p className="text-[10px] font-bold mt-0.5">AIRWAY BILL: {selectedOrder.trackingNumber || 'TRK-PENDING'}</p>
                <div className="mt-1 inline-block border border-black px-3 py-1 bg-zinc-100 font-black text-xs">
                  CARRIER: {selectedOrder.carrierName.toUpperCase()}
                </div>
              </div>

              {/* Ship To Details */}
              <div className="border-b border-black pb-2 space-y-0.5">
                <p className="font-bold text-[10px] text-zinc-600">SHIP TO (CUSTOMER):</p>
                <p className="font-black text-xs uppercase">{selectedOrder.customerName}</p>
                <p className="text-[10px]">{selectedOrder.address}</p>
                <p className="text-[10px]">Tel: {selectedOrder.customerPhone}</p>
              </div>

              {/* Warehouse Picking Checklist */}
              <div className="border-b border-black pb-2">
                <p className="font-bold text-[10px] text-zinc-600 mb-1">WAREHOUSE PICKING LIST:</p>
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-zinc-400">
                      <th>ITEM</th>
                      <th className="text-center">QTY</th>
                      <th className="text-right">CHECK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-200">
                        <td className="py-0.5 truncate max-w-[140px]">{item.name}</td>
                        <td className="py-0.5 text-center font-bold">{item.qty}</td>
                        <td className="py-0.5 text-right">[ &nbsp; ]</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer barcode QR simulation */}
              <div className="text-center pt-1 space-y-1">
                <p className="font-black text-[11px]">ORDER REF: {selectedOrder.orderId}</p>
                <p className="text-[9px] text-zinc-500">Scan QR Code for Live Carrier Dispatch Verification</p>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={16} />
                Print Shipping Label (4x6" / A4)
              </button>
              <button
                onClick={() => setIsShippingLabelModalOpen(false)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer"
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
