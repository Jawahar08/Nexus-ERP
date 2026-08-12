"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Users,
  Briefcase,
  Coins,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Settings,
  HelpCircle,
  Command,
  X,
  Building,
  Menu,
  Receipt,
  ScanBarcode,
  Truck,
  QrCode,
  Tag,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { useCurrencyStore, COUNTRIES } from "@/store/currencyStore";

interface DashboardContextType {
  user: any;
  changeRole: (role: string) => Promise<void>;
  notifications: any[];
  dismissNotification: (id: string) => void;
  matrix: any;
  refreshMatrix: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardLayout");
  return ctx;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const { currentCountry, setCountry } = useCurrencyStore();
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matrix, setMatrix] = useState<any>({
    ADMIN: { dashboard: true, inventory: true, crm: true, hr: true, finance: true, admin: true },
    MANAGER: { dashboard: true, inventory: true, crm: true, hr: true, finance: true, admin: false },
    HR: { dashboard: true, inventory: false, crm: false, hr: true, finance: false, admin: false },
    SALES: { dashboard: true, inventory: false, crm: true, hr: false, finance: false, admin: false },
    INVENTORY: { dashboard: true, inventory: true, crm: false, hr: false, finance: false, admin: false },
    FINANCE: { dashboard: true, inventory: false, crm: false, hr: false, finance: true, admin: false },
  });

  const [notifications, setNotifications] = useState([
    { id: "1", title: "Low Stock Alert", message: "Industrial Copper Wire in Warehouse A is below threshold (5 left)", time: "2m ago", type: "warning" },
    { id: "2", title: "New Deal Won", message: "Acme Corp Deal closed successfully for $45,000", time: "1h ago", type: "success" },
    { id: "3", title: "Audit Alert", message: "Settings modified by user admin@nexus.erp", time: "3h ago", type: "info" }
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("nexus_user");
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      // Create a default demo user for presentation if not present
      const demoUser = {
        userId: "demo-user-id",
        tenantId: "demo-tenant-id",
        tenantSlug: "acme-corp",
        fullName: "Jawahar",
        email: "jawahar@nexus.erp",
        role: "ADMIN",
      };
      localStorage.setItem("nexus_user", JSON.stringify(demoUser));
      setUser(demoUser);
    }
  }, []);

  // Listen for Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const changeRole = async (role: string) => {
    if (!user) return;
    const updated = { ...user, role };
    localStorage.setItem("nexus_user", JSON.stringify(updated));
    setUser(updated);
    router.refresh();
  };

  const handleLogout = () => {
    localStorage.removeItem("nexus_user");
    localStorage.removeItem("nexus_access_token");
    document.cookie = "nexus_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    router.push("/login");
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const refreshMatrix = async () => {
    // Mock refresh permissions matrix dynamically
  };

  if (!user) return null;

  const navigationItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Smart POS", icon: ScanBarcode, path: "/dashboard/pos" },
    { label: "Invoices & Bills", icon: Receipt, path: "/dashboard/invoices" },
    { label: "Order Dispatch", icon: Truck, path: "/dashboard/orders" },
    { label: "Barcode Studio", icon: QrCode, path: "/dashboard/barcodes" },
    { label: "Promotions & Coupons", icon: Tag, path: "/dashboard/promotions" },
    { label: "Inventory & Catalog", icon: Package, path: "/dashboard/inventory" },
    { label: "CRM", icon: Users, path: "/dashboard/crm" },
    { label: "HR", icon: Briefcase, path: "/dashboard/hr" },
    { label: "Finance", icon: Coins, path: "/dashboard/finance" },
    { label: "Workflows", icon: ShieldCheck, path: "/dashboard/workflows" },
  ];

  const filteredNavigation = navigationItems; // Full access for showcase

  return (
    <DashboardContext.Provider value={{ user, changeRole, notifications, dismissNotification, matrix, refreshMatrix }}>
      <div className="flex h-screen bg-[#FAF7F2] overflow-hidden text-[#14171F] font-sans selection:bg-[#5C64ED] selection:text-white">
        {/* Soft Background Warm Glow Spots */}
        <div className="absolute top-[-300px] left-[-300px] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(210,214,250,0.35)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(244,232,219,0.5)_0%,transparent_70%)] pointer-events-none" />

        {/* SIDEBAR - Desktop */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 80 : 260 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "hidden md:flex flex-col h-full bg-[#F5F0E6] border-r border-[#14171F]/10 relative z-30 shrink-0",
            sidebarCollapsed ? "items-center" : ""
          )}
        >
          {/* Brand/Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#14171F]/10 w-full">
            {!sidebarCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-full bg-[#14171F] flex items-center justify-center text-white font-serif font-black text-base shadow-xs">
                  N
                </div>
                <span className="font-serif font-bold text-base tracking-tight text-[#14171F]">
                  Nexuserp<span className="text-[#5C64ED]">.</span>
                </span>
              </motion.div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#14171F] flex items-center justify-center text-white font-serif font-black text-base mx-auto shadow-xs">
                N
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded-md text-[#4F5565] hover:text-[#14171F] hover:bg-white/60 transition"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Collapsed toggle helper */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="mt-4 p-1 rounded-md text-[#4F5565] hover:text-[#14171F] hover:bg-white/60 transition"
            >
              <ChevronRight size={16} />
            </button>
          )}

          {/* Tenant Sandbox Selector */}
          {!sidebarCollapsed ? (
            <div className="m-4 p-3 rounded-xl border border-[#14171F]/10 bg-white/70">
              <div className="text-[10px] font-bold text-[#4F5565] uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Building size={10} /> Tenant Node
              </div>
              <div className="text-xs font-bold text-[#14171F] mt-0.5 truncate">
                {user.tenantSlug || "acme-corp"}
              </div>
            </div>
          ) : (
            <div className="my-4 text-center">
              <Building size={16} className="text-[#4F5565] mx-auto" />
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-2 space-y-1.5 w-full">
            {filteredNavigation.map((item) => {
              const active = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all group relative cursor-pointer",
                    active
                      ? "bg-[#14171F] text-white shadow-sm border border-[#14171F]"
                      : "text-[#4F5565] hover:text-[#14171F] hover:bg-white/60 border border-transparent"
                  )}
                >
                  <item.icon
                    size={17}
                    className={cn(
                      "shrink-0 transition-transform group-hover:scale-105",
                      active ? "text-[#5C64ED]" : "text-[#4F5565] group-hover:text-[#14171F]"
                    )}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer / Account Profile */}
          <div className="p-4 border-t border-white/5 w-full">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-sm text-indigo-400 shrink-0">
                    {user.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">{user.fullName || "User"}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer mx-auto"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </motion.aside>

        {/* WORKSPACE & TOP BAR */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Top Bar Navigation */}
          <header className="h-16 border-b border-[#14171F]/10 flex items-center justify-between px-6 bg-[#FAF7F2]/90 backdrop-blur-xl z-20 shrink-0">
            <div className="flex items-center gap-4">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-1 rounded-md text-[#4F5565] hover:text-[#14171F] hover:bg-white/60 transition"
              >
                <Menu size={20} />
              </button>

              {/* Ctrl+K Search visual trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 bg-white border border-[#14171F]/10 rounded-full text-[#4F5565] hover:text-[#14171F] text-xs transition cursor-pointer shadow-xs"
              >
                <Search size={14} className="text-[#5C64ED]" />
                <span>Search system...</span>
                <kbd className="px-1.5 py-0.5 bg-[#F5F0E6] rounded-md text-[9px] font-mono text-[#14171F] border border-[#14171F]/10">
                  Ctrl+K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Command Palette button icon for mobile */}
              <button
                onClick={() => setSearchOpen(true)}
                className="sm:hidden p-2 rounded-lg border border-[#14171F]/10 text-[#4F5565] hover:text-[#14171F] hover:bg-white/60 transition cursor-pointer"
              >
                <Command size={16} />
              </button>

              {/* Sandbox Switcher Info Badges */}
              <div className="hidden md:flex items-center gap-1.5 border border-[#14171F]/10 bg-white rounded-full px-3 py-1.5 text-xs text-[#4F5565] shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5C64ED] animate-pulse" />
                <span>Role: <strong className="text-[#14171F] font-semibold">{user.role}</strong></span>
              </div>

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
                        transition={{ duration: 0.2 }}
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
                              currentCountry.code === c.code
                                ? "bg-[#14171F] text-white"
                                : "text-[#14171F] hover:bg-[#FAF7F2]"
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

              {/* Notifications Center */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-full border border-[#14171F]/10 bg-white text-[#4F5565] hover:text-[#14171F] hover:bg-[#FAF7F2] transition cursor-pointer relative shadow-xs"
                  title="System notifications"
                >
                  <Bell size={16} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5C64ED]" />
                  )}
                </button>

                {/* Notifications Popup */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 p-4 rounded-2xl bg-white border border-[#14171F]/15 shadow-2xl z-40 text-[#14171F]"
                      >
                        <div className="flex items-center justify-between border-b border-[#14171F]/10 pb-2 mb-2">
                          <span className="font-bold text-xs text-[#14171F]">System Alerts ({notifications.length})</span>
                          <button
                            onClick={() => setNotificationsOpen(false)}
                            className="text-[10px] text-[#4F5565] hover:text-[#14171F] cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#14171F]/10 text-[11px] space-y-1 relative group"
                            >
                              <div className="flex justify-between items-start">
                                <span className={cn(
                                  "font-bold",
                                  n.type === "warning" ? "text-amber-800" : n.type === "success" ? "text-emerald-800" : "text-[#5C64ED]"
                                )}>
                                  {n.title}
                                </span>
                                <span className="text-[9px] text-[#4F5565] font-mono">{n.time}</span>
                              </div>
                              <p className="text-[#4F5565] leading-normal">{n.message}</p>
                              <button
                                onClick={() => dismissNotification(n.id)}
                                className="absolute top-1.5 right-1.5 p-0.5 opacity-0 group-hover:opacity-100 text-[#4F5565] hover:text-[#14171F] transition-opacity cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {notifications.length === 0 && (
                            <p className="text-xs text-[#4F5565] text-center py-4">No notifications present</p>
                          )}
                        </div>
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
                  title="User profile & actions"
                >
                  <span className="font-serif uppercase tracking-wider">{user.fullName?.charAt(0) || "U"}</span>
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
                          <div className="w-10 h-10 rounded-xl bg-[#14171F] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {user.fullName?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#14171F] truncate">{user.fullName || "Jawahar"}</div>
                            <div className="text-[10px] text-[#4F5565] truncate font-mono">{user.email || "admin@nexus.erp"}</div>
                            <div className="text-[9px] font-bold text-[#5C64ED] font-mono mt-0.5 uppercase tracking-wider">
                              {user.role || "ADMIN"} ACCESS
                            </div>
                          </div>
                        </div>

                        {/* Quick links & Logout */}
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              router.push("/dashboard/admin");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#14171F] hover:bg-[#FAF7F2] rounded-xl transition cursor-pointer"
                          >
                            <Settings size={15} className="text-[#5C64ED]" />
                            <span>Workspace Settings</span>
                          </button>

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

          {/* MAIN PAGE COMPONENT AREA */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
            {children}
          </main>
        </div>
      </div>

      {/* MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 w-64 z-50 bg-[#09090b] border-r border-white/5 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-400" size={18} />
                    <span className="font-extrabold text-sm tracking-wider text-white">NEXUS ERP</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-zinc-500 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <nav className="space-y-1">
                  {filteredNavigation.map((item) => {
                    const active = pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          setMobileOpen(false);
                          router.push(item.path);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                          active
                            ? "bg-white/10 text-white border border-white/10"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                        )}
                      >
                        <item.icon size={18} className={active ? "text-indigo-400" : "text-zinc-400"} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400">
                    {user.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{user.fullName}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* COMMAND PALETTE MODAL (Ctrl+K) */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="glass-panel w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative z-10 border border-white/10"
            >
              <div className="flex items-center border-b border-white/5 px-4 h-12 bg-white/[0.02]">
                <Search size={16} className="text-zinc-500 mr-3" />
                <input
                  type="text"
                  placeholder="Type a command or search page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Suggestions Grid */}
              <div className="p-4 max-h-80 overflow-y-auto space-y-4">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Quick Navigation Links
                  </div>
                  <div className="space-y-1">
                    {filteredNavigation
                      .filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((n) => (
                        <button
                          key={n.path}
                          onClick={() => {
                            setSearchOpen(false);
                            router.push(n.path);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <n.icon size={16} className="text-zinc-500" />
                            <span>{n.label}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">Go to &rarr;</span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    System Commands
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut size={16} className="text-red-400" />
                        <span>Sign Out System Session</span>
                      </div>
                      <kbd className="px-1.5 py-0.5 bg-red-500/20 rounded text-[9px] font-mono">
                        LOGOUT
                      </kbd>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardContext.Provider>
  );
}
