'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, RefreshCw, Sparkles, Clock, CheckCircle2, Phone, FileText } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

export default function WhatsAppAutomationHub({ customers }: { customers: any[] }) {
  const { formatAmount } = useCurrencyStore();
  const [loading, setLoading] = useState(true);
  const [remindersData, setRemindersData] = useState<any>(null);

  // Digital Receipt Form state
  const [receiptPhone, setReceiptPhone] = useState('+15550192834');
  const [receiptName, setReceiptName] = useState('Sarah Jenkins');
  const [receiptItem, setReceiptItem] = useState('Quantum CPU Core X9');
  const [receiptAmount, setReceiptAmount] = useState('499.00');
  const [sendingReceipt, setSendingReceipt] = useState(false);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/whatsapp-reminders');
      if (res.ok) {
        const payload = await res.json();
        setRemindersData(payload);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleSendDigitalReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptPhone || !receiptAmount) return;

    setSendingReceipt(true);
    try {
      const res = await fetch('/api/crm/send-receipt-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: receiptPhone,
          customerName: receiptName,
          items: [{ name: receiptItem, qty: 1 }],
          totalAmount: Number(receiptAmount),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.whatsappUrl) {
          window.open(result.whatsappUrl, '_blank');
        }
      } else {
        alert('Failed to generate WhatsApp digital receipt link.');
      }
    } catch (err) {
      alert('Error creating digital receipt.');
    } finally {
      setSendingReceipt(false);
    }
  };

  const handleSendReminder = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Banner */}
      <div className="glass p-6 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/40 to-teal-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">WhatsApp & SMS Customer Retention Hub</h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Automated Direct Messaging
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Send instant WhatsApp digital receipts and AI re-order reminders directly to customers to maximize repeat business.
            </p>
          </div>
        </div>

        <button
          onClick={fetchReminders}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Reminders
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: AI Customer Re-Order Reminders Table */}
        <div className="glass p-6 rounded-xl border border-white/10 xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400" />
                AI Re-Order Customer Reminders
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                AI predicts when regular customers are due for restocking based on purchase intervals.
              </p>
            </div>

            {remindersData?.summary && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-[10px] px-2.5 py-1 rounded-full">
                {remindersData.summary.dueRemindersCount} Restock Reminders Due
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw size={24} className="animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 h-10 uppercase tracking-wider font-bold">
                    <th className="pb-2">Customer & Company</th>
                    <th className="pb-2">Last Product</th>
                    <th className="pb-2">Days Elapsed</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {remindersData?.reminders?.map((rem: any) => (
                    <tr key={rem.id} className="border-b border-white/5 hover:bg-white/[0.02] h-14 transition-colors">
                      <td className="font-bold text-white">
                        <div>
                          <div className="flex items-center gap-1.5">
                            {rem.name}
                            {rem.isDue && (
                              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                                Restock Due
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono block font-normal">{rem.company} &bull; {rem.phone}</span>
                        </div>
                      </td>
                      <td className="text-indigo-300 font-mono">{rem.lastPurchasedItem}</td>
                      <td>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${rem.isDue ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30' : 'text-zinc-400'}`}>
                          ~{rem.daysSinceLastOrder} days ago
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleSendReminder(rem.whatsappUrl)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ml-auto transition cursor-pointer"
                        >
                          <MessageSquare size={13} /> Send WhatsApp Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT COL: 1-Click WhatsApp Digital Receipt Dispatcher */}
        <div className="glass p-6 rounded-xl border border-white/10 flex flex-col justify-between gap-5 bg-slate-900/80">
          <div className="flex flex-col gap-4">
            <div className="border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                1-Click WhatsApp Digital Receipt
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Send a digital PDF receipt link directly to a customer's WhatsApp number.
              </p>
            </div>

            <form onSubmit={handleSendDigitalReceipt} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase">Customer Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={receiptPhone}
                    onChange={(e) => setReceiptPhone(e.target.value)}
                    className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg pl-9 pr-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase">Customer Name</label>
                <input
                  type="text"
                  required
                  value={receiptName}
                  onChange={(e) => setReceiptName(e.target.value)}
                  className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase">Item Description</label>
                <input
                  type="text"
                  required
                  value={receiptItem}
                  onChange={(e) => setReceiptItem(e.target.value)}
                  className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase">Total Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="w-full h-9 bg-slate-900 border border-white/10 rounded-lg px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={sendingReceipt}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send size={14} />
                {sendingReceipt ? 'Generating Receipt...' : 'Send WhatsApp Digital Receipt'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
