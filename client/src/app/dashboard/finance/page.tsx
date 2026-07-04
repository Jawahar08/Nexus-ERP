'use client';

import React, { useState, useEffect } from 'react';
import { 
  Coins, Plus, ArrowUpRight, ArrowDownRight, 
  DollarSign, FileText, PieChart, RefreshCw
} from 'lucide-react';

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Action form state
  const [showAddTx, setShowAddTx] = useState(false);
  const [newTx, setNewTx] = useState({
    type: 'expense',
    category: 'Rent',
    amount: 0,
    description: '',
    reference: ''
  });

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance');
      if (res.ok) {
        const payload = await res.json();
        setTransactions(payload);
      }
    } catch (err) {
      console.error('Failed to load ledger transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });
      if (res.ok) {
        setShowAddTx(false);
        setNewTx({ type: 'expense', category: 'Rent', amount: 0, description: '', reference: '' });
        fetchFinance();
      }
    } catch (err) {
      alert('Failed to log transaction');
    }
  };

  // 1. Calculate transaction sums
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryAllocations: any = {};

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      categoryAllocations[t.category] = (categoryAllocations[t.category] || 0) + t.amount;
    }
  });

  const netCashFlow = totalIncome - totalExpense;

  // Compile allocations list
  const allocations = Object.keys(categoryAllocations).map(cat => ({
    name: cat,
    value: categoryAllocations[cat],
    percent: totalExpense > 0 ? (categoryAllocations[cat] / totalExpense) * 100 : 0
  })).sort((a,b) => b.value - a.value);

  const categories = ['Rent', 'Infrastructure', 'Marketing', 'Payroll', 'Purchasing', 'Sales Return', 'Other'];

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Financial Accounting & Ledgers</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Control transaction postings, analyze overhead costs, and log expenses.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={fetchFinance}
            className="btn flex items-center gap-2 bg-slate-900 border border-[var(--border)] px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
          >
            <RefreshCw size={12} />
            Reconcile
          </button>
          <button 
            onClick={() => setShowAddTx(true)}
            className="btn flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[var(--primary-hover)] transition cursor-pointer"
          >
            <Plus size={14} />
            Record Transaction
          </button>
        </div>
      </div>

      {/* Cash Flow metrics strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Income total */}
        <div className="glass p-5 rounded-xl border border-[var(--border)] flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Gross Inflow</span>
            <div className="text-xl font-bold text-white mt-1">${totalIncome.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-950/45 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight size={18} />
          </div>
        </div>

        {/* Expenses total */}
        <div className="glass p-5 rounded-xl border border-[var(--border)] flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Gross Outflow</span>
            <div className="text-xl font-bold text-white mt-1">${totalExpense.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-950/45 text-rose-400 flex items-center justify-center">
            <ArrowDownRight size={18} />
          </div>
        </div>

        {/* Net cashflow */}
        <div className="glass p-5 rounded-xl border border-[var(--border)] flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Net Cash Flow Balance</span>
            <div className={`text-xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netCashFlow < 0 ? '-' : ''}${Math.abs(netCashFlow).toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-cyan-950/45 text-cyan-400 flex items-center justify-center">
            <Coins size={18} />
          </div>
        </div>

      </div>

      {/* Main Ledger grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Ledger transaction database */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] xl:col-span-2 flex flex-col gap-4">
          <h3 className="font-bold text-sm">Corporate General Ledger Account Sheet</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] h-10 uppercase tracking-wider font-bold">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Reference</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.01)] h-12 transition-colors">
                      <td className="font-mono text-[var(--text-muted)]">{new Date(tx.date).toLocaleDateString()}</td>
                      <td>
                        <span className="bg-slate-800 text-[var(--text-muted)] px-2 py-0.5 rounded text-[10px]">
                          {tx.category}
                        </span>
                      </td>
                      <td className="font-medium text-white">{tx.description}</td>
                      <td className="font-mono text-[var(--text-muted)]">{tx.reference}</td>
                      <td className={`text-right font-mono font-bold text-xs ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIncome ? '+' : '-'}${tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Category pie breakdown */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <PieChart size={16} className="text-[var(--primary)]" />
            Overhead Expense Allocations
          </h3>

          <div className="flex-1 flex flex-col gap-4 justify-center">
            {allocations.length > 0 ? (
              <div className="flex flex-col gap-4">
                
                {/* Visual horizontal CSS bars */}
                <div className="flex flex-col gap-3">
                  {allocations.map((a: any) => (
                    <div key={a.name} className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[var(--text-muted)]">{a.name}</span>
                        <span className="text-white font-mono">{a.percent.toFixed(0)}% (${a.value.toLocaleString()})</span>
                      </div>
                      
                      {/* Custom color bars based on categories */}
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            a.name === 'Payroll' ? 'bg-indigo-500' :
                            a.name === 'Rent' ? 'bg-amber-500' :
                            a.name === 'Infrastructure' ? 'bg-cyan-500' :
                            a.name === 'Purchasing' ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                          style={{ width: `${a.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-[var(--text-muted)] py-10 text-xs">
                No expense allocations recorded.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ==========================================
          MODALS
         ========================================== */}

      {/* Record Transaction Modal */}
      {showAddTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full p-8 rounded-xl border border-[var(--border)] flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base border-b border-[var(--border)] pb-2 text-white">Record Ledger Transaction</h3>
            
            <form onSubmit={handleAddTx} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="input-label">Posting Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" onClick={() => setNewTx({...newTx, type: 'expense'})}
                    className={`h-9 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      newTx.type === 'expense' ? 'bg-rose-950 text-rose-400 border-rose-500/50' : 'bg-slate-900 text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    Expense Outflow
                  </button>
                  <button 
                    type="button" onClick={() => setNewTx({...newTx, type: 'income'})}
                    className={`h-9 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      newTx.type === 'income' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50' : 'bg-slate-900 text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    Revenue Inflow
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Accounting Category</label>
                <select 
                  className="input-field bg-slate-900 border border-[var(--border)] rounded text-xs"
                  value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Amount Value ($)</label>
                <input 
                  type="number" step="0.01" className="input-field font-mono" required
                  value={newTx.amount} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Description / Purpose</label>
                <input 
                  type="text" className="input-field" required placeholder="e.g. AWS Core cloud bill"
                  value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="input-label">Document Reference Code</label>
                <input 
                  type="text" className="input-field font-mono" placeholder="e.g. EXP-1092"
                  value={newTx.reference} onChange={e => setNewTx({...newTx, reference: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-[var(--border)] pt-4">
                <button 
                  type="button" onClick={() => setShowAddTx(false)}
                  className="btn border border-[var(--border)] bg-slate-900 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--border)] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--primary-hover)] transition"
                >
                  Save Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
