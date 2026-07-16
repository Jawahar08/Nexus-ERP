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
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

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
    { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Inventory Intelligence", icon: Package, path: "/dashboard/inventory" },
    { label: "CRM Pipeline", icon: Users, path: "/dashboard/crm" },
    { label: "HR Experience", icon: Briefcase, path: "/dashboard/hr" },
    { label: "Executive Finance", icon: Coins, path: "/dashboard/finance" },
    { label: "Visual Workflows", icon: ShieldCheck, path: "/dashboard/workflows" },
  ];

  const filteredNavigation = navigationItems; // Full access for showcase

  return (
    <DashboardContext.Provider value={{ user, changeRole, notifications, dismissNotification, matrix, refreshMatrix }}>
      <div className="flex h-screen bg-[#070709] overflow-hidden text-zinc-100 font-sans">
        {/* Glow Spots */}
        <div className="absolute top-[-300px] left-[-300px] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.03)_0%,transparent_70%)] pointer-events-none" />

        {/* SIDEBAR - Desktop */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 80 : 260 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "hidden md:flex flex-col h-full bg-[#09090b]/80 border-r border-white/5 backdrop-blur-xl relative z-30 shrink-0",
            sidebarCollapsed ? "items-center" : ""
          )}
        >
          {/* Brand/Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 w-full">
            {!sidebarCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="font-extrabold text-sm tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                  NEXUS ERP
                </span>
              </motion.div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Sparkles size={16} className="text-white" />
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Collapsed toggle helper */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="mt-4 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition"
            >
              <ChevronRight size={16} />
            </button>
          )}

          {/* Tenant Sandbox Selector */}
          {!sidebarCollapsed ? (
            <div className="m-4 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Building size={10} /> Tenant Node
              </div>
              <div className="text-xs font-bold text-zinc-200 mt-1 truncate">
                {user.tenantSlug || "acme-corp"}
              </div>
            </div>
          ) : (
            <div className="my-4 text-center">
              <Building size={16} className="text-zinc-600 mx-auto" />
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
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer",
                    active
                      ? "bg-white/10 text-white shadow-[0_4px_12px_rgba(255,255,255,0.03)] border border-white/10"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.02] border border-transparent"
                  )}
                >
                  <item.icon
                    size={18}
                    className={cn(
                      "shrink-0 transition-transform group-hover:scale-105",
                      active ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"
                    )}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-indigo-500 rounded-r-full"
                    />
                  )}
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
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Top Bar Navigation */}
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/40 backdrop-blur-xl z-20 shrink-0">
            <div className="flex items-center gap-4">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition"
              >
                <Menu size={20} />
              </button>

              {/* Ctrl+K Search visual trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 text-xs transition cursor-pointer"
              >
                <Search size={14} />
                <span>Search system...</span>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono text-zinc-400">
                  Ctrl+K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Command Palette button icon for mobile */}
              <button
                onClick={() => setSearchOpen(true)}
                className="sm:hidden p-2 rounded-lg border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <Command size={16} />
              </button>

              {/* Sandbox Switcher Info Badges */}
              <div className="hidden md:flex items-center gap-1.5 border border-white/5 bg-white/[0.02] rounded-lg px-3 py-1.5 text-xs text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>Role: <strong className="text-white font-semibold">{user.role}</strong></span>
              </div>

              {/* Notifications Center */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer relative"
                >
                  <Bell size={16} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
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
                        className="glass-panel absolute right-0 mt-2 w-80 p-4 rounded-xl z-40 shadow-xl"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                          <span className="font-bold text-xs text-white">System Alerts ({notifications.length})</span>
                          <button
                            onClick={() => setNotificationsOpen(false)}
                            className="text-[10px] text-zinc-500 hover:text-white"
                          >
                            Close
                          </button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className="p-2 rounded bg-white/[0.02] border border-white/5 text-[11px] space-y-1 relative group"
                            >
                              <div className="flex justify-between items-start">
                                <span className={cn(
                                  "font-semibold",
                                  n.type === "warning" ? "text-amber-400" : n.type === "success" ? "text-emerald-400" : "text-indigo-400"
                                )}>
                                  {n.title}
                                </span>
                                <span className="text-[9px] text-zinc-500">{n.time}</span>
                              </div>
                              <p className="text-zinc-400 leading-normal">{n.message}</p>
                              <button
                                onClick={() => dismissNotification(n.id)}
                                className="absolute top-1 right-1 p-0.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {notifications.length === 0 && (
                            <p className="text-xs text-zinc-500 text-center py-4">No notifications present</p>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick profile drop for actions */}
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center font-bold text-xs text-white">
                {user.fullName?.charAt(0) || "U"}
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
