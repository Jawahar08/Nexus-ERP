"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  Store,
  Menu,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrencyStore, COUNTRIES } from "@/store/currencyStore";

interface SupplierContextType {
  activeTab: "vmi" | "orders" | "ledger";
  setActiveTab: (tab: "vmi" | "orders" | "ledger") => void;
}

const SupplierContext = createContext<SupplierContextType>({
  activeTab: "vmi",
  setActiveTab: () => {}
});

export const useSupplier = () => useContext(SupplierContext);

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentCountry, setCountry } = useCurrencyStore();
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeTab, setActiveTabState] = useState<"vmi" | "orders" | "ledger">("vmi");

  const setActiveTab = (tab: "vmi" | "orders" | "ledger") => {
    setActiveTabState(tab);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as "vmi" | "orders" | "ledger";
      if (tab && ["vmi", "orders", "ledger"].includes(tab)) {
        setActiveTabState(tab);
      }
    }
  }, [pathname]);

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
    document.cookie = "nexus_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    router.push("/login");
  };

  const navItems = [
    { id: "vmi", label: "Overview & VMI Stock", icon: Truck },
    { id: "orders", label: "B2B Purchase Orders", icon: FileText },
    { id: "ledger", label: "B2B Invoices & Ledger", icon: DollarSign }
  ];

  if (!user) return null;

  return (
    <SupplierContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="flex h-screen w-full bg-[#FAF7F2] overflow-hidden text-[#14171F] font-sans antialiased selection:bg-[#5C64ED]/20 selection:text-[#5C64ED]">
        
        {/* Mobile Drawer Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 84 : 260 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "h-full bg-[#F5F0E6] border-r border-[#14171F]/10 flex flex-col justify-between relative z-30 shrink-0 transition-all",
            mobileOpen ? "fixed inset-y-0 left-0 z-50 flex w-64 shadow-2xl" : "hidden md:flex"
          )}
        >
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Brand Logo Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#14171F]/10 w-full shrink-0">
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#14171F] flex items-center justify-center text-white shadow-xs">
                    <Truck size={16} />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-sm tracking-tight text-[#14171F] block">
                      NEXUS VENDOR
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#5C64ED] font-bold block">
                      B2B Supplier Portal
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#14171F] flex items-center justify-center text-white mx-auto shadow-xs">
                  <Truck size={16} />
                </div>
              )}

              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:flex p-1.5 rounded-full text-[#4F5565] hover:text-[#14171F] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>

            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="mt-3 p-1.5 rounded-full text-[#4F5565] hover:text-[#14171F] hover:bg-[#FAF7F2] transition mx-auto cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            )}

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 w-full font-sans">
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      router.push(`/supplier/dashboard?tab=${item.id}`);
                      if (mobileOpen) setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer relative",
                      active
                        ? "bg-white text-[#14171F] border border-[#14171F]/10 shadow-xs"
                        : "text-[#4F5565] hover:text-[#14171F] hover:bg-white/60"
                    )}
                  >
                    <item.icon size={17} className={active ? "text-[#5C64ED]" : "text-[#4F5565]"} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Account Section */}
          <div className="p-3.5 border-t border-[#14171F]/10 w-full shrink-0">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-[#14171F]/10 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#14171F] text-white flex items-center justify-center font-bold text-xs shrink-0 font-serif">
                    {user.fullName?.charAt(0) || "V"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#14171F] truncate">{user.fullName || "Vendor"}</div>
                    <div className="text-[10px] text-[#4F5565] truncate font-mono">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-full text-[#4F5565] hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-xl bg-white border border-[#14171F]/10 flex items-center justify-center text-[#4F5565] hover:text-rose-700 hover:bg-rose-50 transition mx-auto cursor-pointer shadow-2xs"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </motion.aside>

        {/* WORKSPACE RIGHT CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Top Header */}
          <header className="h-16 border-b border-[#14171F]/10 flex items-center justify-between px-6 bg-[#FAF7F2]/90 backdrop-blur-xl z-20 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-1.5 rounded-full text-[#4F5565] hover:text-[#14171F] hover:bg-white transition"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2 border border-[#14171F]/10 bg-white rounded-full px-3 py-1 text-xs text-[#4F5565] shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px]">B2B Vendor Node Active</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Country & Currency Switcher */}
              <div className="relative">
                <button
                  onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#14171F]/10 bg-white text-[#14171F] hover:bg-[#FAF7F2] transition cursor-pointer text-xs shadow-xs"
                  title="Switch currency & region"
                >
                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-[#FAF7F2] border border-[#14171F]/10 text-[#4F5565] font-mono tracking-wider">
                    {currentCountry.code}
                  </span>
                  <span className="font-bold text-[#14171F] font-mono">{currentCountry.currencyCode}</span>
                  <span className="text-xs font-bold text-[#5C64ED] font-mono">({currentCountry.symbol})</span>
                </button>

                <AnimatePresence>
                  {currencyDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setCurrencyDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 p-2.5 rounded-2xl bg-white border border-[#14171F]/15 shadow-2xl z-40 space-y-1 text-[#14171F]"
                      >
                        <div className="text-[10px] font-bold text-[#4F5565] uppercase tracking-wider px-3 py-1.5 border-b border-[#14171F]/10 mb-1 font-mono">
                          Workspace Currency
                        </div>
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            onClick={() => {
                              setCountry(c.code);
                              setCurrencyDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left",
                              currentCountry.code === c.code ? "bg-[#14171F] text-white" : "text-[#14171F] hover:bg-[#FAF7F2]"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border text-center shrink-0 font-mono w-8",
                                currentCountry.code === c.code
                                  ? "bg-white/20 border-white/20 text-white"
                                  : "bg-[#FAF7F2] border-[#14171F]/10 text-[#4F5565]"
                              )}>
                                {c.code}
                              </span>
                              <span>{c.name}</span>
                            </div>
                            <span className="font-mono text-xs font-bold">{c.currencyCode} ({c.symbol})</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Interactive User Avatar Menu with Logout */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-9 h-9 rounded-full bg-[#14171F] hover:bg-[#202532] text-white flex items-center justify-center font-bold text-xs shadow-xs transition cursor-pointer border border-[#14171F]/20 relative"
                  title="Vendor profile & actions"
                >
                  <span className="font-serif uppercase tracking-wider">{user.fullName?.charAt(0) || "V"}</span>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 p-3 rounded-2xl bg-white border border-[#14171F]/15 shadow-2xl z-40 text-[#14171F] space-y-3"
                      >
                        {/* User Info Header */}
                        <div className="flex items-center gap-3 p-2 bg-[#FAF7F2] rounded-xl border border-[#14171F]/10">
                          <div className="w-10 h-10 rounded-xl bg-[#14171F] text-white flex items-center justify-center font-bold text-sm shrink-0 font-serif">
                            {user.fullName?.charAt(0) || "V"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#14171F] truncate">{user.fullName || "Intelisys Vendor"}</div>
                            <div className="text-[10px] text-[#4F5565] truncate font-mono">{user.email || "vendor@intelisys.com"}</div>
                            <div className="text-[9px] font-bold text-[#5C64ED] font-mono mt-0.5 uppercase tracking-wider">
                              {user.role || "SUPPLIER"} NODE
                            </div>
                          </div>
                        </div>

                        {/* Quick Logout */}
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer border border-rose-200"
                          >
                            <LogOut size={15} className="text-rose-700" />
                            <span>Sign Out / Log Out</span>
                          </button>
                        </div>
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
    </SupplierContext.Provider>
  );
}
