'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '../layout';
import { 
  ShieldCheck, FileText, CheckCircle2, XCircle, 
  Clock, History, ShoppingBag, Calendar, AlertCircle
} from 'lucide-react';

export default function WorkflowsPage() {
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
      <div>
        <h2 className="text-xl font-bold">Manager Approval Desk</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Authorise budget acquisitions, purchase orders, and employee absence schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Purchase Order Approval workflow */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
          <h3 className="font-bold text-sm flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <ShoppingBag size={16} className="text-[var(--primary)]" />
            Pending PO Restocks ({approvals.pendingPOs.length})
          </h3>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            {approvals.pendingPOs.length > 0 ? (
              approvals.pendingPOs.map((po: any) => (
                <div key={po.id} className="border border-[var(--border)] bg-slate-900/50 p-4 rounded-lg flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white">PO Ref: PO-{po.id.substring(0, 5).toUpperCase()}</span>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Supplier: {po.supplier.name}</div>
                    </div>
                    <span className="font-mono font-bold text-yellow-400 text-sm">${po.total.toLocaleString()}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                    Trigger item ID: <code className="text-white">{po.productId?.substring(0, 8)}</code> &bull; Target Volume: <code className="text-white">{po.qty} units</code>
                  </div>

                  <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                    <button
                      onClick={() => handleProcessApproval('po', po.id, 'approved')}
                      className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckCircle2 size={12} /> Approve PO
                    </button>
                    <button
                      onClick={() => handleProcessApproval('po', po.id, 'rejected')}
                      className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <XCircle size={12} /> Deny PO
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[var(--text-muted)] py-10 text-xs flex flex-col gap-2 items-center">
                <CheckCircle2 size={24} className="text-[var(--success)]" />
                No pending purchase orders.
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests Approval workflow */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
          <h3 className="font-bold text-sm flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Calendar size={16} className="text-cyan-400" />
            Absence Sabbatical approvals ({approvals.pendingLeaves.length})
          </h3>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            {approvals.pendingLeaves.length > 0 ? (
              approvals.pendingLeaves.map((l: any) => (
                <div key={l.id} className="border border-[var(--border)] bg-slate-900/50 p-4 rounded-lg flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white">{l.employeeName}</span>
                      <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{l.startDate} to {l.endDate}</div>
                    </div>
                    <span className="bg-amber-950 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">Pending</span>
                  </div>

                  <div className="text-[10px] text-[var(--text-muted)] italic">Reason: "{l.reason}"</div>

                  <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                    <button
                      onClick={() => handleProcessApproval('leave', l.id, 'approved')}
                      className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckCircle2 size={12} /> Approve Leave
                    </button>
                    <button
                      onClick={() => handleProcessApproval('leave', l.id, 'rejected')}
                      className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <XCircle size={12} /> Reject Leave
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-[var(--text-muted)] py-10 text-xs flex flex-col gap-2 items-center">
                <CheckCircle2 size={24} className="text-[var(--success)]" />
                No pending leaves.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Reconciled approvals audits history */}
      <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
        <h3 className="font-bold text-sm flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <History size={16} className="text-emerald-400" />
          Recently Reconciled Purchase Orders
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] h-10 uppercase tracking-wider font-bold">
                <th className="pb-2">PO Code</th>
                <th className="pb-2">Supplier</th>
                <th className="pb-2">Date processed</th>
                <th className="pb-2 text-right">Acquisition Total</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {approvals.approvedPOs.map((po: any) => (
                <tr key={po.id} className="border-b border-[var(--border)] h-12">
                  <td className="font-mono text-white">PO-{po.id.substring(0, 5).toUpperCase()}</td>
                  <td>{po.supplier.name}</td>
                  <td className="text-[var(--text-muted)] font-mono">{new Date(po.date).toLocaleDateString()}</td>
                  <td className="text-right font-mono font-bold text-white">${po.total.toLocaleString()}</td>
                  <td className="text-right">
                    <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                      approved
                    </span>
                  </td>
                </tr>
              ))}
              {approvals.approvedPOs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-[var(--text-muted)]">No historical entries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
