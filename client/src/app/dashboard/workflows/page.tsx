'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import { 
  ShieldCheck, FileText, CheckCircle2, XCircle, 
  Clock, History, ShoppingBag, Calendar, AlertCircle
} from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

export default function WorkflowsPage() {
  const { formatAmount } = useCurrencyStore();
  const { user } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<any>({
    pendingPOs: [],
    pendingLeaves: [],
    approvedPOs: []
  });

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workflows/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleProcessApproval = async (type: 'po' | 'leave', id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/workflows/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, status })
      });
      
      if (res.ok) {
        // Automatically dispatch notification check
        window.dispatchEvent(new Event('refresh-dashboard-data'));
        fetchApprovals();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update approval status');
      }
    } catch (err) {
      alert('Network error executing approval action');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  // Verify Role has access (only Admin, Manager, Finance)
  const isAuthorized = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Finance';

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center max-w-md mx-auto gap-3">
        <AlertCircle size={32} className="text-[var(--danger)]" />
        <h3 className="font-bold text-white text-base">Access Restressed</h3>
        <p className="text-xs text-[var(--text-muted)]">Your active workspace profile ("{user?.role}") lacks privileges to access the Manager Approval Desk. Switch roles to Admin or Manager to proceed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header title */}
      <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs text-[#14171F]">
        <h2 className="text-xl font-serif font-bold text-[#14171F]">Manager Approval Desk</h2>
        <p className="text-xs text-[#4F5565] font-medium mt-0.5">Authorise budget acquisitions, purchase orders, and employee absence schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-[#14171F]">
        
        {/* Purchase Order Approval workflow */}
        <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col gap-4 text-[#14171F]">
          <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2 border-b border-[#14171F]/10 pb-3">
            <ShoppingBag size={16} className="text-[#5C64ED]" />
            Pending PO Restocks ({approvals.pendingPOs.length})
          </h3>

          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto">
            {approvals.pendingPOs.length > 0 ? (
              approvals.pendingPOs.map((po: any) => (
                <div key={po.id} className="border border-[#14171F]/10 bg-[#FAF7F2] p-4 rounded-2xl flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-[#14171F]">PO Ref: PO-{po.id.substring(0, 5).toUpperCase()}</span>
                      <div className="text-[10px] text-[#4F5565] font-mono mt-0.5">Supplier: {po.supplier.name}</div>
                    </div>
                    <span className="font-mono font-bold text-[#5C64ED] text-sm">{formatAmount(po.total)}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#14171F]/10 text-[10px] text-[#4F5565] font-mono">
                    Trigger item ID: <code className="text-[#14171F] font-bold">{po.productId?.substring(0, 8)}</code> &bull; Target Volume: <code className="text-[#14171F] font-bold">{po.qty} units</code>
                  </div>

                  <div className="flex gap-2 border-t border-[#14171F]/10 pt-3">
                    <button
                      onClick={() => handleProcessApproval('po', po.id, 'approved')}
                      className="flex-1 h-8 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 size={12} /> Approve PO
                    </button>
                    <button
                      onClick={() => handleProcessApproval('po', po.id, 'rejected')}
                      className="flex-1 h-8 bg-rose-700 hover:bg-rose-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <XCircle size={12} /> Deny PO
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[#4F5565] py-10 text-xs flex flex-col gap-2 items-center font-medium">
                <CheckCircle2 size={24} className="text-emerald-700" />
                No pending purchase orders.
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests Approval workflow */}
        <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col gap-4 text-[#14171F]">
          <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2 border-b border-[#14171F]/10 pb-3">
            <Calendar size={16} className="text-[#5C64ED]" />
            Absence Sabbatical approvals ({approvals.pendingLeaves.length})
          </h3>

          <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto">
            {approvals.pendingLeaves.length > 0 ? (
              approvals.pendingLeaves.map((l: any) => (
                <div key={l.id} className="border border-[#14171F]/10 bg-[#FAF7F2] p-4 rounded-2xl flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-[#14171F]">{l.employeeName}</span>
                      <div className="text-[10px] text-[#4F5565] font-mono mt-0.5">{l.startDate} to {l.endDate}</div>
                    </div>
                    <span className="bg-amber-100 border border-amber-300 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase">Pending</span>
                  </div>

                  <div className="text-[10px] text-[#4F5565] italic font-medium">Reason: "{l.reason}"</div>

                  <div className="flex gap-2 border-t border-[#14171F]/10 pt-3">
                    <button
                      onClick={() => handleProcessApproval('leave', l.id, 'approved')}
                      className="flex-1 h-8 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 size={12} /> Approve Leave
                    </button>
                    <button
                      onClick={() => handleProcessApproval('leave', l.id, 'rejected')}
                      className="flex-1 h-8 bg-rose-700 hover:bg-rose-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <XCircle size={12} /> Reject Leave
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[#4F5565] py-10 text-xs flex flex-col gap-2 items-center font-medium">
                <CheckCircle2 size={24} className="text-emerald-700" />
                No pending leaves.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Reconciled approvals audits history */}
      <div className="bg-white p-6 rounded-[28px] border border-[#14171F]/10 shadow-xs flex flex-col gap-4 text-[#14171F]">
        <h3 className="font-serif font-bold text-base text-[#14171F] flex items-center gap-2 border-b border-[#14171F]/10 pb-3">
          <History size={16} className="text-emerald-700" />
          Recently Reconciled Purchase Orders
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#14171F]/10 text-[#4F5565] h-10 uppercase tracking-wider font-bold font-mono">
                <th className="pb-2">PO Code</th>
                <th className="pb-2">Supplier</th>
                <th className="pb-2">Date processed</th>
                <th className="pb-2 text-right">Acquisition Total</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14171F]/5 text-[#14171F]">
              {approvals.approvedPOs.map((po: any) => (
                <tr key={po.id} className="hover:bg-[#FAF7F2]/60 h-14 transition-colors">
                  <td className="font-mono text-[#5C64ED] font-bold">PO-{po.id.substring(0, 5).toUpperCase()}</td>
                  <td className="font-bold text-[#14171F]">{po.supplier.name}</td>
                  <td className="text-[#4F5565] font-mono">{new Date(po.date).toLocaleDateString()}</td>
                  <td className="text-right font-mono font-bold text-[#14171F]">{formatAmount(po.total)}</td>
                  <td className="text-right">
                    <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase">
                      approved
                    </span>
                  </td>
                </tr>
              ))}
              {approvals.approvedPOs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-[#4F5565] font-medium">No historical entries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
