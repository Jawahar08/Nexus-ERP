"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Package,
  Users,
  CheckCircle,
  TrendingDown,
  AlertTriangle,
  Send,
  RefreshCw,
  Clock,
  ArrowUpRight,
  HelpCircle,
  MessageSquare,
  Store
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { cn } from "@/lib/utils";
import { useCurrencyStore, replaceUSDInText } from "@/store/currencyStore";
import MorningBriefingBanner from "@/components/dashboard/MorningBriefingBanner";
import BranchSwitcherModal from "@/components/dashboard/BranchSwitcherModal";

// Helper for Animated Counters
function Counter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { currentCountry, convertAmount } = useCurrencyStore();
  const isCurrency = prefix === "$";
  const end = isCurrency ? convertAmount(value) : value;

  useEffect(() => {
    let start = 0;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalDuration = 1000; // 1 second
    const incrementTime = Math.abs(Math.floor(totalDuration / end));
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 40); // larger steps for smoother animation
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, Math.max(incrementTime, 16));

    return () => clearInterval(timer);
  }, [end]);

  return (
    <span>
      {isCurrency ? currentCountry.symbol : prefix}
      {count.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      {suffix}
    </span>
  );
}

export default function DashboardHero() {
  const formatAmount = useCurrencyStore((state) => state.formatAmount);
  const [activeTab, setActiveTab] = useState("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBriefingBranches() {
      try {
        const res = await fetch('/api/ai/morning-briefing');
        if (res.ok) {
          const data = await res.json();
          if (data.branches) setBranchesList(data.branches);
        }
      } catch (err) {}
    }
    loadBriefingBranches();
  }, []);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Good day Jawahar! I can assist with low stock alerts, inventory risk warnings, or generating financial summaries. What can I calculate for you today?" }
  ]);

  const handleExportReport = () => {
    const dateStr = new Date().toLocaleDateString();
    const storeState = useCurrencyStore.getState();
    const currency = storeState.currentCountry;
    
    let csvContent = "\uFEFF";
    csvContent += `Nexus ERP - Executive Workspace Report\n`;
    csvContent += `Generated Date,${dateStr}\n`;
    csvContent += `Active Workspace,Acme Corp\n`;
    csvContent += `Workspace Currency,${currency.currencyCode} (${currency.symbol})\n`;
    csvContent += `Exchange Rate relative to USD,${currency.rate}\n\n`;
    
    csvContent += `Key Performance Indicators\n`;
    csvContent += `Indicator,Value,Trend,Description\n`;
    kpis.forEach(kpi => {
      let displayVal = kpi.value;
      if (kpi.prefix === "$") {
        const converted = storeState.convertAmount(kpi.value);
        const formatted = `${currency.symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        csvContent += `"${kpi.title}","${formatted}","${kpi.trend}","${kpi.desc}"\n`;
      } else {
        csvContent += `"${kpi.title}","${displayVal}${kpi.suffix || ''}","${kpi.trend}","${kpi.desc}"\n`;
      }
    });
    csvContent += `\n`;
    
    csvContent += `System AI Insights\n`;
    csvContent += `Title,Risk Level,Description\n`;
    aiInsights.forEach(insight => {
      const descText = replaceUSDInText(insight.desc, formatAmount);
      csvContent += `"${insight.title}","${insight.risk}","${descText.replace(/"/g, '""')}"\n`;
    });
    csvContent += `\n`;
    
    csvContent += `Recent Activity Audit Logs\n`;
    csvContent += `Activity,Responsible User,Time,Module\n`;
    timelineItems.forEach(item => {
      const actionText = replaceUSDInText(item.action, formatAmount);
      csvContent += `"${actionText.replace(/"/g, '""')}","${item.user}","${item.time}","${item.module}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nexus_ERP_Executive_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle AI Chat Input submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    const promptToSend = chatInput;
    setChatInput("");

    // Add a temporary loading state
    setChatMessages((prev) => [...prev, { role: "assistant", content: "Thinking..." }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToSend }),
      });

      const data = await res.json();
      setChatMessages((prev) => {
        const messages = [...prev];
        if (messages.length > 0 && messages[messages.length - 1].content === "Thinking...") {
          messages.pop();
        }
        return [...messages, { role: "assistant", content: data.reply || "Failed to generate response." }];
      });
    } catch (err) {
      setChatMessages((prev) => {
        const messages = [...prev];
        if (messages.length > 0 && messages[messages.length - 1].content === "Thinking...") {
          messages.pop();
        }
        return [...messages, { role: "assistant", content: "Network error calling Gemini AI." }];
      });
    }
  };

  // Mock Data
  const kpis = [
    { title: "Gross Revenue", value: 142500, prefix: "$", trend: "+12.4%", desc: "vs last month", icon: TrendingUp, color: "text-emerald-600" },
    { title: "Product Inventory", value: 2450, suffix: " units", trend: "-2.3%", desc: "safety limits alert", icon: Package, color: "text-amber-600" },
    { title: "Active Workforce", value: 34, suffix: " members", trend: "+4.1%", desc: "all departments active", icon: Users, color: "text-[#5C64ED]" },
    { title: "Pending Approvals", value: 8, suffix: " tasks", trend: "0%", desc: "awaiting audit review", icon: CheckCircle, color: "text-purple-600" },
  ];

  const aiInsights = [
    { title: "Inventory Risk", risk: "Medium", desc: "Industrial Copper Wire & Steel Rods will run out of stock in 6 days if demand velocity continues.", icon: AlertTriangle, statusColor: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
    { title: "Sales Forecast", risk: "High Optimism", desc: "Visual pipeline indicating a 15% increase in deals closed (estimated +$62,000) for Q3.", icon: TrendingUp, statusColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
    { title: "Revenue Trend", risk: "Optimal", desc: "Contract growth remains steady. Billing operations in Acme Corp show 99.8% retention rates.", icon: Sparkles, statusColor: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5" },
  ];

  const timelineItems = [
    { action: "Admin user created sandbox profile", user: "admin@nexus.erp", time: "10 mins ago", module: "Security" },
    { action: "Stock updated: Industrial Copper Wire (+150 units)", user: "inventory@nexus.erp", time: "1 hour ago", module: "Inventory" },
    { action: "Invoice cleared: ID-294711 ($4,250.00)", user: "finance@nexus.erp", time: "3 hours ago", module: "Finance" },
  ];

  return (
    <div className="space-y-8 relative pb-20">
      {/* EXECUTIVE 30-SECOND MORNING BRIEFING HERO */}
      <MorningBriefingBanner onOpenBranchSwitcher={() => setShowBranchModal(true)} />

      {/* Dynamic welcome hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-[#5667F6] bg-[#5667F6]/10 border border-[#5667F6]/20 rounded-full flex items-center gap-1.5 uppercase font-mono">
              <Sparkles size={11} className="text-[#5667F6]" /> NEXUSERP AUTOPILOT ACTIVE
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif text-[#14171F] leading-tight">
            Good Morning, Jawahar
          </h1>
          <p className="text-sm text-[#4F5565] mt-1">
            Operational workspace view for <span className="text-[#5C64ED] font-semibold">Acme Corp</span> • {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <AnimatedButton variant="outline" size="sm" className="gap-1.5">
            <RefreshCw size={12} /> Sync Ledger
          </AnimatedButton>
          <AnimatedButton 
            onClick={handleExportReport}
            variant="default" 
            size="sm" 
            className="gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            Export Report <ArrowUpRight size={14} />
          </AnimatedButton>
        </motion.div>
      </div>

      {/* KPI GRID CARDS WITH ANIMATIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <GlassCard interactive className="p-5 flex justify-between items-start relative overflow-hidden group bg-white border border-[#14171F]/10 rounded-[24px] shadow-xs hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4F5565] uppercase tracking-wider block font-mono">
                  {kpi.title}
                </span>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#14171F] mt-1 font-mono">
                  <Counter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[#4F5565] mt-2">
                  <span className={kpi.trend.startsWith("+") ? "text-emerald-600 font-bold" : "text-amber-700 font-bold"}>
                    {kpi.trend}
                  </span>
                  <span>{kpi.desc}</span>
                </div>
              </div>
              <div className={cn("p-2.5 rounded-xl bg-[#FAF7F2] border border-[#14171F]/10 shadow-2xs", kpi.color)}>
                <kpi.icon size={18} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* DETAILED BUSINESS STATS & GRAPH SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Cash Flow Line Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-6 h-[400px] flex flex-col justify-between bg-white border border-[#14171F]/10 rounded-[28px] shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-[#14171F]">Financial Cash Flow Metrics</h3>
                <p className="text-xs text-[#4F5565] mt-0.5 font-mono">Real-time comparison ledger index</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#5C64ED]" /> Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F5C84B]" /> Expenses</span>
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="flex-1 w-full flex items-center justify-center min-h-[220px] relative px-2">
              <svg className="w-full h-full min-h-[220px] max-h-[240px]" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5C64ED" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#5C64ED" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5C84B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#F5C84B" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(20,23,31,0.06)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(20,23,31,0.06)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(20,23,31,0.06)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Revenue Filled Area */}
                <path d="M 0 160 Q 100 80, 200 110 T 400 60 T 500 40 L 500 200 L 0 200 Z" fill="url(#revGrad)" />
                {/* Revenue Path */}
                <path d="M 0 160 Q 100 80, 200 110 T 400 60 T 500 40" fill="none" stroke="#5C64ED" strokeWidth="2.5" strokeLinecap="round" />

                {/* Expenses Filled Area */}
                <path d="M 0 180 Q 100 140, 200 150 T 400 110 T 500 100 L 500 200 L 0 200 Z" fill="url(#expGrad)" />
                {/* Expenses Path */}
                <path d="M 0 180 Q 100 140, 200 150 T 400 110 T 500 100" fill="none" stroke="#D9A825" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex justify-between text-[10px] text-[#4F5565] font-mono mt-2">
              <span>JAN</span>
              <span>MAR</span>
              <span>MAY</span>
              <span>JUL</span>
              <span>SEP</span>
              <span>NOV</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Business Health Score - Radial Circle Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GlassCard className="p-6 h-[400px] flex flex-col justify-between items-center text-center bg-white border border-[#14171F]/10 rounded-[28px] shadow-xs">
            <div className="w-full flex justify-between items-center border-b border-[#14171F]/10 pb-3">
              <h3 className="text-sm font-serif font-bold text-[#14171F] text-left">Enterprise health</h3>
              <span className="px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full font-mono">EXCELLENT</span>
            </div>

            {/* Radial score */}
            <div className="relative my-auto flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="rgba(20,23,31,0.06)" strokeWidth="8" fill="transparent" />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#radialGrad)"
                  strokeWidth="8"
                  strokeDasharray="440"
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * 92) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="radialGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5C64ED" />
                    <stop offset="100%" stopColor="#F5C84B" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0.5">
                <span className="text-4xl font-serif font-bold text-[#14171F] tracking-tight">92</span>
                <span className="text-[10px] text-[#4F5565] font-bold uppercase tracking-wider font-mono">Health index</span>
              </div>
            </div>

            <p className="text-xs text-[#4F5565] leading-normal px-2 mt-2 font-medium">
              Based on active CRM deal pipeline, safety stock level checks, and quick ledger audit balances.
            </p>
          </GlassCard>
        </motion.div>
      </div>

      {/* AI INSIGHTS & REAL-TIME TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights panel */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="text-base font-serif font-bold text-[#14171F] flex items-center gap-2">
            <Sparkles size={16} className="text-[#5C64ED]" /> System AI Insights
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {aiInsights.map((insight, idx) => (
              <GlassCard key={insight.title} className="p-5 flex flex-col justify-between gap-4 bg-white border border-[#14171F]/10 rounded-[24px] shadow-xs hover:shadow-md transition-all duration-300">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#14171F]/10 text-[#5C64ED]">
                      <insight.icon size={14} />
                    </div>
                    <span className="text-xs font-bold text-[#14171F]">{insight.title}</span>
                  </div>
                  <p className="text-xs text-[#4F5565] mt-2 leading-relaxed font-medium">
                    {replaceUSDInText(insight.desc, formatAmount)}
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full border border-[#14171F]/10 bg-[#FAF7F2] text-[#14171F] text-[10px] font-bold w-fit uppercase font-mono">
                  {insight.risk}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Real-time Activity Timeline */}
        <div className="space-y-5">
          <h3 className="text-base font-serif font-bold text-[#14171F] flex items-center gap-2">
            <Clock size={16} className="text-[#5C64ED]" /> Recent Audit Activity
          </h3>

          <GlassCard className="p-5 space-y-4 bg-white border border-[#14171F]/10 rounded-[28px] shadow-xs">
            {timelineItems.map((item, idx) => (
              <div key={idx} className="flex gap-3 relative pb-4 last:pb-0 group">
                {idx < timelineItems.length - 1 && (
                  <span className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-[#14171F]/10 group-last:hidden" />
                )}
                <div className="w-5 h-5 rounded-full bg-[#5C64ED]/10 border border-[#5C64ED]/30 flex items-center justify-center font-bold text-[9px] text-[#5C64ED] z-10 shrink-0 font-mono">
                  {idx + 1}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-semibold text-[#14171F] leading-normal truncate font-mono">
                    {replaceUSDInText(item.action, formatAmount)}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-[#4F5565] font-mono">
                    <span className="truncate">{item.user}</span>
                    <span>&bull;</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>

      {/* FLOATING AI ASSISTANT PANEL */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-80 h-96 rounded-2xl overflow-hidden shadow-2xl flex flex-col mb-4 bg-white border border-[#14171F]/15 text-[#14171F]"
            >
              {/* Header */}
              <div className="bg-[#FAF7F2] border-b border-[#14171F]/10 p-3.5 flex justify-between items-center">
                <span className="font-bold text-xs text-[#14171F] flex items-center gap-1.5 font-mono">
                  <Sparkles size={13} className="text-[#5C64ED]" /> Nexus Copilot AI
                </span>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-[#4F5565] hover:text-[#14171F] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message History */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#FAF7F2]/50">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-2xs font-sans",
                      msg.role === "user"
                        ? "bg-[#5C64ED] text-white ml-auto rounded-tr-none"
                        : "bg-white text-[#14171F] border border-[#14171F]/10 mr-auto rounded-tl-none font-medium"
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="p-3 border-t border-[#14171F]/10 bg-white flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a dashboard query..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 h-9 bg-[#FAF7F2] border border-[#14171F]/10 rounded-xl px-3 text-xs text-[#14171F] placeholder-[#4F5565] focus:outline-none focus:border-[#5C64ED]"
                />
                <button
                  type="submit"
                  className="h-9 w-9 bg-[#5C64ED] hover:bg-[#4B52D9] rounded-xl flex items-center justify-center text-white shrink-0 transition cursor-pointer shadow-xs"
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setChatOpen((prev) => !prev)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
        >
          <MessageSquare size={20} />
        </button>
      </div>

      {/* MULTI-BRANCH STORE SWITCHER MODAL */}
      <BranchSwitcherModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        branches={branchesList}
        activeBranchId={activeBranchId || undefined}
        onSelectBranch={(id) => setActiveBranchId(id)}
      />
    </div>
  );
}

// Re-export X icon internally
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
