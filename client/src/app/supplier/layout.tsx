"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Package,
  Building2,
  FileText,
  DollarSign,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Bell,
  ArrowLeft,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrencyStore, COUNTRIES } from "@/store/currencyStore";

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentCountry, setCountry } = useCurrencyStore();
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("nexus_user");
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      const demoVendor = {
        userId: "vendor-id-1",
        tenantId: "demo-tenant-id",
        fullName: "Intelisys Vendor Operations",
        email: "robert@intelisys.com",
        role: "SUPPLIER"
      };
      localStorage.setItem("nexus_user", JSON.stringify(demoVendor));
      setUser(demoVendor);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nexus_user");
    localStorage.removeItem("nexus_access_token");
    router.push("/login");
  };

  const navItems = [
    { label: "Overview & VMI Stock", icon: Truck, path: "/supplier/dashboard" },
    { label: "B2B Purchase Orders", icon: FileText, path: "/supplier/dashboard" },
    { label: "B2B Invoices & Ledger", icon: DollarSign, path: "/supplier/dashboard" }
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-[#06070a] overflow-hidden text-zinc-100 font-sans">
      {/* Glow Effects */}
      <div className="absolute top-[-300px] left-[-300px] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex flex-col h-full bg-[#0a0b10]/90 border-r border-white/5 backdrop-blur-xl relative z-30 shrink-0"
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 w-full">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Truck size={16} className="text-white" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-indigo-200 to-white block">
                  NEXUS VENDOR
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-purple-400 block">
                  B2B Supplier Portal
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Truck size={16} className="text-white" />
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="mt-4 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition mx-auto cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 w-full">
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative",
                  active
                    ? "bg-purple-600/20 text-white border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                )}
              >
                <item.icon size={16} className={active ? "text-purple-400" : "text-zinc-400"} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Account */}
        <div className="p-4 border-t border-white/5 w-full">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">
                  {user.fullName?.charAt(0) || "V"}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{user.fullName || "Vendor"}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-red-400 transition mx-auto cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* WORKSPACE RIGHT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0b10]/50 backdrop-blur-xl z-20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-purple-300 bg-purple-500/10 rounded-full border border-purple-500/20 uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              B2B Vendor Node Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white transition cursor-pointer text-xs"
              >
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 font-mono">
                  {currentCountry.code}
                </span>
                <span className="font-semibold text-white">{currentCountry.currencyCode}</span>
                <span className="text-[10px] text-zinc-500">({currentCountry.symbol})</span>
              </button>

              <AnimatePresence>
                {currencyDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setCurrencyDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="glass-panel absolute right-0 mt-2 w-56 p-2 rounded-xl z-40 shadow-xl space-y-1"
                    >
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            setCountry(c.code);
                            setCurrencyDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left",
                            currentCountry.code === c.code ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <span>{c.name} ({c.symbol})</span>
                          <span className="font-mono text-[9px]">{c.currencyCode}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
