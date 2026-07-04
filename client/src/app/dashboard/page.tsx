'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from './layout';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, 
  AlertCircle, History, Sparkles, CheckCircle2, RefreshCw, Users
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    expenses: 0,
    dealsValue: 0,
    employeesCount: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // AI Forecasting states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch financial transactions for revenue and expenses calculation
      const finRes = await fetch('/api/finance');
      const invRes = await fetch('/api/inventory');
      const crmRes = await fetch('/api/crm');
      const hrRes = await fetch('/api/hr');
      const auditRes = await fetch('/api/audit');

      if (finRes.ok && invRes.ok && crmRes.ok && hrRes.ok && auditRes.ok) {
        const finance = await finRes.json();
        const inventory = await invRes.json();
        const crm = await crmRes.json();
        const hr = await hrRes.json();
        const audits = await auditRes.json();

        // 1. Calculate financial KPIs (past 30 days)
        let revenueSum = 0;
        let expensesSum = 0;
        finance.forEach((tx: any) => {
          if (tx.type === 'income') revenueSum += tx.amount;
          else expensesSum += tx.amount;
        });

        // 2. Active deals total
        let activeDealsSum = 0;
        crm.deals.forEach((d: any) => {
          if (d.stage !== 'won' && d.stage !== 'lost') {
            activeDealsSum += d.value;
          }
        });

        setStats({
          revenue: revenueSum,
          expenses: expensesSum,
          dealsValue: activeDealsSum,
          employeesCount: hr.employees.length
        });

        // 3. Low stock alerts
        const lowStock = inventory.products.filter((p: any) => p.stock <= p.minStock);
        setAlerts(lowStock);

        // 4. Audit Log
        setAuditLogs(audits.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAiForecast = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/forecast');
      if (res.ok) {
        const data = await res.json();
        setAiReport(data);
      }
    } catch (err) {
      console.error('AI forecasting failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for context role switch updates
    window.addEventListener('refresh-dashboard-data', fetchDashboardData);
    return () => window.removeEventListener('refresh-dashboard-data', fetchDashboardData);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Welcome back, {user?.name}</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Corporate Portal: {user?.tenantName}</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn flex items-center gap-2 border border-[var(--border)] bg-slate-900 px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--border)] transition cursor-pointer"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* ==========================================
          KPI GRID CARDS
         ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div className="glass p-5 rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Gross Revenue</span>
            <span className="text-2xl font-bold text-white">${stats.revenue.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <TrendingUp size={10} /> Active Billing ledger
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)] flex items-center justify-center text-emerald-400">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 2: Operating Expenses */}
        <div className="glass p-5 rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Operational Expense</span>
            <span className="text-2xl font-bold text-white">${stats.expenses.toLocaleString()}</span>
            <span className="text-[10px] text-rose-400 flex items-center gap-1">
              <TrendingDown size={10} /> Overhead Outflow
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] flex items-center justify-center text-rose-400">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* Card 3: CRM Deal Pipeline */}
        <div className="glass p-5 rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Pipeline Deals</span>
            <span className="text-2xl font-bold text-white">${stats.dealsValue.toLocaleString()}</span>
            <span className="text-[10px] text-cyan-400 flex items-center gap-1">
              <Sparkles size={10} /> Forecast Contracts
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[rgba(6,182,212,0.06)] border border-[rgba(6,182,212,0.15)] flex items-center justify-center text-cyan-400">
            <Briefcase size={20} />
          </div>
        </div>

        {/* Card 4: Total Personnel count */}
        <div className="glass p-5 rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Active Employees</span>
            <span className="text-2xl font-bold text-white">{stats.employeesCount}</span>
            <span className="text-[10px] text-indigo-400 flex items-center gap-1">
              <CheckCircle2 size={10} /> Workforce directory
            </span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center text-indigo-400">
            <Users size={20} />
          </div>
        </div>

      </div>

      {/* ==========================================
          CHARTS & AI FORECAST SECTION
         ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Charts */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="font-bold text-sm">Financial Cash Flow Metrics</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Visual comparison of Gross Revenue and Expenditures</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--primary)]" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> Expenses</span>
            </div>
          </div>

          {/* SVG Custom Responsive Graph */}
          <div className="h-[200px] w-full flex items-end justify-between px-4 pt-4 border-b border-[var(--border)]">
            <div className="flex flex-col items-center gap-2 w-16">
              <div className="w-full flex gap-1 items-end justify-center h-32">
                <div className="bg-[var(--primary)] w-4 rounded-t-sm" style={{ height: '75%' }} />
                <div className="bg-rose-500 w-4 rounded-t-sm" style={{ height: '25%' }} />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Q1 Actual</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-16">
              <div className="w-full flex gap-1 items-end justify-center h-32">
                <div className="bg-[var(--primary)] w-4 rounded-t-sm" style={{ height: '90%' }} />
                <div className="bg-rose-500 w-4 rounded-t-sm" style={{ height: '35%' }} />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Q2 Actual</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-16">
              <div className="w-full flex gap-1 items-end justify-center h-32">
                <div className="bg-[var(--primary)] w-4 rounded-t-sm" style={{ height: '80%' }} />
                <div className="bg-rose-500 w-4 rounded-t-sm" style={{ height: '40%' }} />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Q3 Actual</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-16">
              <div className="w-full flex gap-1 items-end justify-center h-32">
                <div className="bg-[var(--primary)] w-4 rounded-t-sm" style={{ height: '95%' }} />
                <div className="bg-rose-500 w-4 rounded-t-sm" style={{ height: '50%' }} />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Current MTD</span>
            </div>
          </div>
        </div>

        {/* AI Forecasting Module panel */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-400" />
              AI Demand Forecast
            </h3>
            <button 
              onClick={generateAiForecast}
              className="text-[10px] bg-[var(--primary)] text-white px-2.5 py-1 rounded cursor-pointer transition hover:bg-[var(--primary-hover)] font-semibold"
              disabled={aiLoading}
            >
              {aiLoading ? 'Forecasting...' : 'Run Forecast'}
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {aiReport ? (
              <div className="flex flex-col gap-4">
                <div className="bg-[rgba(245,158,11,0.03)] border border-[rgba(245,158,11,0.1)] rounded p-3 text-[11px] text-[var(--text-muted)] leading-relaxed">
                  <strong>GenAI Analysis Narrative:</strong>
                  <p className="mt-1 text-white">{aiReport.narrative}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Critical Replenishment suggestions</span>
                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                    {aiReport.recommendations.map((r: any) => (
                      <div key={r.productId} className="flex justify-between items-center text-[11px] border-b border-[var(--border)] pb-1">
                        <span>{r.name} ({r.sku})</span>
                        <span className={`font-mono font-bold ${r.status === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                          Restock +{r.recommendedRestock}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[var(--primary-glow)] flex items-center justify-center text-[var(--primary)] mx-auto mb-3 shadow-[0_0_12px_var(--primary-glow)]">
                  <Sparkles size={20} />
                </div>
                <p className="text-xs font-semibold text-white">Generate Demand Analytics</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 px-4">AI compiles sales velocity charts to recommend product purchase volumes.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ==========================================
          LOW STOCK ALERTS & AUDIT TRAIL FEED
         ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Low Stock Alerts */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <AlertCircle size={16} className="text-[var(--danger)]" />
              Safety Margin Alarms
            </h3>
            <span className="badge badge-danger text-[10px] bg-red-950 text-red-400 border border-red-800/30 px-2 py-0.5 rounded font-semibold">{alerts.length} Warnings</span>
          </div>

          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[220px]">
            {alerts.length > 0 ? (
              alerts.map((item) => (
                <div key={item.id} className="flex items-center justify-between border border-[var(--border)] bg-[rgba(239,68,68,0.02)] p-3 rounded-lg">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{item.sku} &bull; {item.warehouse.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-red-400">{item.stock} units</div>
                    <div className="text-[9px] text-[var(--text-muted)] font-medium">Min limit: {item.minStock}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-[var(--text-muted)] flex flex-col gap-2 items-center">
                <CheckCircle2 size={24} className="text-[var(--success)]" />
                All product stock levels are above safety margins.
              </div>
            )}
          </div>
        </div>

        {/* Audit Trail Logging */}
        <div className="glass p-6 rounded-xl border border-[var(--border)] lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <History size={16} className="text-[var(--primary)]" />
              System Audit Stream
            </h3>
            <span className="text-[10px] text-[var(--text-muted)]">Live operations trail</span>
          </div>

          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[220px]">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-start border-b border-[var(--border)] pb-2 text-[11px] gap-4">
                  <div className="flex gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold h-fit shrink-0 ${
                      log.module === 'Admin' ? 'bg-indigo-950 text-indigo-400' :
                      log.module === 'Inventory' ? 'bg-amber-950 text-amber-400' :
                      log.module === 'CRM' ? 'bg-cyan-950 text-cyan-400' :
                      log.module === 'Finance' ? 'bg-emerald-950 text-emerald-400' :
                      'bg-slate-800 text-[var(--text-muted)]'
                    }`}>
                      {log.module}
                    </span>
                    <span className="text-[var(--text-main)] leading-relaxed">{log.message}</span>
                  </div>
                  <div className="text-right shrink-0 text-[10px] text-[var(--text-muted)] font-mono">
                    <div>{log.userName}</div>
                    <div className="mt-0.5">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-[var(--text-muted)]">No logs registered.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
