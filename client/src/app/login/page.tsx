"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Store,
  Building2,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Search,
  Globe,
  Users,
  Package,
  KeyRound,
  X,
  ShieldAlert,
  Truck,
  ShoppingBag
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { cn } from "@/lib/utils";

interface TenantProfile {
  id: string;
  name: string;
  domain: string;
  _count?: {
    users: number;
    products: number;
    customers: number;
  };
}

export default function LoginPage() {
  const router = useRouter();

  // Portal Identity Role: shopkeeper | vendor | customer
  const [portalRole, setPortalRole] = useState<"shopkeeper" | "vendor" | "customer">("shopkeeper");

  // Step 1: Shop Selection, Step 2: User Login
  const [step, setStep] = useState<1 | 2>(1);

  // Shop state
  const [shopDomain, setShopDomain] = useState("nexus.erp");
  const [selectedShop, setSelectedShop] = useState<TenantProfile | null>({
    id: "41a7f4d5-62b7-45d8-8108-9597ff3852cc",
    name: "Nexus Global Store",
    domain: "nexus.erp",
    _count: { users: 5, products: 3, customers: 2 },
  });
  const [tenants, setTenants] = useState<TenantProfile[]>([
    {
      id: "41a7f4d5-62b7-45d8-8108-9597ff3852cc",
      name: "Nexus Global Store",
      domain: "nexus.erp",
      _count: { users: 5, products: 3, customers: 2 },
    },
    {
      id: "apex-tenant-id",
      name: "Apex Industries Store",
      domain: "apex.erp",
      _count: { users: 2, products: 1, customers: 1 },
    },
  ]);

  // Store Passkey State
  const [passkeyInput, setPasskeyInput] = useState("");
  const [showPasskeyText, setShowPasskeyText] = useState(false);
  const [verifyingPasskey, setVerifyingPasskey] = useState(false);
  const [showDemoKeys, setShowDemoKeys] = useState(false);

  // User auth state
  const [email, setEmail] = useState("admin@nexus.erp");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch available shop tenants on load
  useEffect(() => {
    async function loadShops() {
      try {
        const res = await fetch("/api/auth/tenants");
        if (res.ok) {
          const data = await res.json();
          if (data.tenants && data.tenants.length > 0) {
            setTenants(data.tenants);
          }
        }
      } catch (err) {
        console.warn("Could not fetch server tenant list, using default demo shops.");
      }
    }
    loadShops();
  }, []);

  const handleDirectShopPasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopDomain.trim() || !passkeyInput.trim()) return;

    setError("");
    setVerifyingPasskey(true);

    try {
      const res = await fetch("/api/auth/verify-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: shopDomain.trim(),
          passkey: passkeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid Store ID or Store Security Passkey.");
      }

      setSelectedShop(data.tenant);
      setShopDomain(data.tenant.domain);
      setError("");

      if (data.tenant.domain === "apex.erp") {
        setEmail("admin@apex.erp");
      } else {
        setEmail("admin@nexus.erp");
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate store ID and passkey.");
    } finally {
      setVerifyingPasskey(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantDomain: selectedShop?.domain || shopDomain,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to authenticate into shop.");
      }

      // Store in localStorage
      localStorage.setItem("nexus_access_token", data.data.accessToken);
      localStorage.setItem("nexus_user", JSON.stringify(data.data));

      // Save cookie for middleware verification
      const isSecure = window.location.protocol === "https:";
      document.cookie = `nexus_token=${data.data.accessToken}; path=/; max-age=86400; SameSite=Lax${isSecure ? "; Secure" : ""}`;

      if (portalRole === "vendor") {
        router.push("/supplier/dashboard");
      } else if (portalRole === "customer") {
        router.push("/shop");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "System failed to contact shop authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen h-full w-full flex bg-[#080B11] text-zinc-100 overflow-y-auto overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Ambient Radial Mesh Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-radial from-indigo-600/15 via-purple-600/5 to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-radial from-purple-600/15 via-indigo-600/5 to-transparent blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-radial from-cyan-600/5 via-transparent to-transparent blur-[140px]" />
      </div>

      {/* Futuristic Geometric Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-stretch">
        
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* LEFT SIDE: Hero, Features & Enterprise Brand                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 border-r border-white/10 relative">
          
          {/* Logo Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-white/20">
              <Cpu size={22} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-2xl tracking-wider text-white flex items-center gap-1.5 font-sans">
                NEXUS <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ERP</span>
              </span>
              <span className="text-[11px] tracking-widest uppercase font-semibold text-zinc-400 block">
                Enterprise Multi-Tenant SaaS
              </span>
            </div>
          </motion.div>

          {/* Main Hero Copy */}
          <div className="my-auto max-w-lg space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="space-y-5"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs font-semibold text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Multi-Tenant Store Hub Active</span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
                Every Shop.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                  Its Own Isolated Command Center.
                </span>
              </h1>

              <p className="text-sm xl:text-base text-zinc-300/80 font-normal leading-relaxed">
                Connect your organization account to view live sales analytics, smart POS registers, automated inventory controls, and payroll in complete multi-tenant security.
              </p>
            </motion.div>

            {/* Feature Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-indigo-500/30 transition-all duration-300 flex items-start gap-3.5 shadow-lg shadow-black/20"
              >
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Strict Isolation</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-normal">
                    Isolated databases & role permissions per tenant.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-purple-500/30 transition-all duration-300 flex items-start gap-3.5 shadow-lg shadow-black/20"
              >
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Realtime Sync</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-normal">
                    Live revenue, cashier POS & stock tracking.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-between text-xs text-zinc-500 pt-4"
          >
            <span>&copy; {new Date().getFullYear()} Nexus ERP Systems Inc.</span>
            <span className="font-mono text-[11px] bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-full text-zinc-400">
              v2.4 Enterprise
            </span>
          </motion.div>

        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* RIGHT SIDE: Authentication Terminal Box                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 lg:p-12 relative">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[470px] relative z-10"
          >
            {/* Terminal Glass Container Card */}
            <div className="rounded-3xl bg-[#0D121F]/90 backdrop-blur-2xl border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-7 sm:p-9 relative overflow-hidden text-zinc-100">
              
              {/* Subtle top card glow line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-70" />

              {/* Progress Breadcrumb Stepper */}
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step === 1
                      ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                      : "bg-indigo-950 text-indigo-300 border border-indigo-500/40"
                  )}>
                    1
                  </span>
                  <span className={cn("text-xs font-semibold", step === 1 ? "text-white" : "text-zinc-400")}>
                    Select Store
                  </span>
                </div>

                <div className="w-12 h-[1px] bg-white/10" />

                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step === 2
                      ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                      : "bg-white/[0.05] text-zinc-500 border border-white/10"
                  )}>
                    2
                  </span>
                  <span className={cn("text-xs font-semibold", step === 2 ? "text-white" : "text-zinc-500")}>
                    User Login
                  </span>
                </div>
              </div>

              {/* Error Alert Box */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-xs text-red-300 mb-6 shadow-inner"
                  >
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                    <span className="leading-tight">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STEP 1: SHOP ID & PASSKEY GATE */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest text-indigo-300 bg-indigo-500/15 rounded-lg border border-indigo-500/25 uppercase inline-flex items-center gap-1.5 mb-2.5">
                      <ShieldCheck size={13} className="text-indigo-400" /> Secure SaaS Terminal
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Connect Portal Terminal
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Select your <strong>Portal Identity</strong> and enter credentials to enter your dedicated portal.
                    </p>
                  </div>

                  {/* 3-Way Portal Identity Role Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Portal Identity / Role Access
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPortalRole("shopkeeper")}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                          portalRole === "shopkeeper"
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                        )}
                      >
                        <Store size={17} className={portalRole === "shopkeeper" ? "text-indigo-400" : "text-zinc-400"} />
                        <span className="text-[11px] font-bold block leading-tight">Shopkeeper</span>
                        <span className="text-[9px] opacity-70 block">ERP Terminal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPortalRole("vendor")}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                          portalRole === "vendor"
                            ? "bg-purple-600/20 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                        )}
                      >
                        <Truck size={17} className={portalRole === "vendor" ? "text-purple-400" : "text-zinc-400"} />
                        <span className="text-[11px] font-bold block leading-tight">B2B Vendor</span>
                        <span className="text-[9px] opacity-70 block">Supplier Node</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPortalRole("customer");
                          router.push("/shop/nexus.erp");
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                          portalRole === "customer"
                            ? "bg-emerald-600/20 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                        )}
                      >
                        <ShoppingBag size={17} className={portalRole === "customer" ? "text-emerald-400" : "text-zinc-400"} />
                        <span className="text-[11px] font-bold block leading-tight">Customer</span>
                        <span className="text-[9px] opacity-70 block">Storefront</span>
                      </button>
                    </div>
                  </div>

                  {portalRole === "customer" ? (
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center space-y-3.5">
                      <div className="text-xs text-emerald-300 font-medium">
                        🛍️ No login credentials needed for shoppers!
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push("/shop/nexus.erp")}
                        className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                      >
                        Open Customer Storefront <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleDirectShopPasskeySubmit} className="space-y-4 pt-1">
                      
                      {/* Shop ID / Domain Input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 block">
                          Shop ID / Store Domain
                        </label>
                        <div className="relative">
                          <Store size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. nexus.erp or apex.erp"
                            value={shopDomain}
                            onChange={(e) => setShopDomain(e.target.value)}
                            className="w-full h-11.5 bg-[#141A2E]/90 border border-white/15 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Store Passkey Input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 block">
                          Store Security Passkey
                        </label>
                        <div className="relative">
                          <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type={showPasskeyText ? "text" : "password"}
                            required
                            placeholder="••••••••••••"
                            value={passkeyInput}
                            onChange={(e) => setPasskeyInput(e.target.value)}
                            className="w-full h-11.5 bg-[#141A2E]/90 border border-white/15 rounded-xl pl-10 pr-11 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPasskeyText(!showPasskeyText)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {showPasskeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={verifyingPasskey}
                        className="w-full h-12 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 mt-5 cursor-pointer disabled:opacity-50"
                      >
                        {verifyingPasskey ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Authenticate Store</span>
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Developer Demo Test Helper */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowDemoKeys(!showDemoKeys)}
                      className="text-xs text-zinc-400 hover:text-indigo-300 font-mono flex items-center justify-between w-full p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <KeyRound size={13} className="text-indigo-400" />
                        <span>{showDemoKeys ? "Hide Demo Shop Keys" : "Show Demo Shop Keys (Testing)"}</span>
                      </span>
                      <ChevronRight size={14} className={cn("transition-transform", showDemoKeys && "rotate-90")} />
                    </button>

                    <AnimatePresence>
                      {showDemoKeys && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 gap-2 text-xs font-mono pt-1"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShopDomain("nexus.erp");
                              setPasskeyInput("NEXUS-2026");
                            }}
                            className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-left hover:border-indigo-400 transition-all cursor-pointer"
                          >
                            <span className="text-indigo-300 font-bold block">Nexus Store</span>
                            <span className="text-zinc-300 text-[11px] block truncate">ID: nexus.erp</span>
                            <span className="text-zinc-400 text-[10px] block truncate">Passkey: NEXUS-2026</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShopDomain("apex.erp");
                              setPasskeyInput("APEX-2026");
                            }}
                            className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-left hover:border-purple-400 transition-all cursor-pointer"
                          >
                            <span className="text-purple-300 font-bold block">Apex Store</span>
                            <span className="text-zinc-300 text-[11px] block truncate">ID: apex.erp</span>
                            <span className="text-zinc-400 text-[10px] block truncate">Passkey: APEX-2026</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: USER CREDENTIALS LOGIN */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Active Selected Shop Banner */}
                  <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
                        <Store size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-300 tracking-wider uppercase block">
                          Connected Store
                        </span>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {selectedShop?.name || shopDomain}
                        </h4>
                        <p className="text-xs text-zinc-300 font-mono">
                          Domain: {selectedShop?.domain || shopDomain}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep(1);
                      }}
                      className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium bg-white/[0.08] hover:bg-white/[0.15] px-3 py-1.5 rounded-lg border border-white/15 transition-all cursor-pointer"
                    >
                      <ArrowLeft size={13} /> Change
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      Store User Credentials
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Enter your email and password registered for this store.
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 block">
                        Store User Email
                      </label>
                      <div className="relative">
                        <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="email"
                          required
                          disabled={loading}
                          placeholder="user@shop.erp"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-11.5 bg-[#141A2E]/90 border border-white/15 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 block">
                        Security Password
                      </label>
                      <div className="relative">
                        <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          disabled={loading}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-11.5 bg-[#141A2E]/90 border border-white/15 rounded-xl pl-10 pr-11 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 mt-5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Enter Store Terminal</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Sandbox Profiles for selected shop */}
                  <div className="mt-6 border-t border-white/10 pt-5 space-y-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center block">
                      Quick 1-Click Login for {selectedShop?.name || "this Shop"}
                    </span>

                    {selectedShop?.domain === "apex.erp" ? (
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setEmail("admin@apex.erp")}
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-purple-500/15 border border-white/10 hover:border-purple-400/40 text-left transition-all cursor-pointer"
                        >
                          <span className="text-[10px] text-purple-400 font-bold block">Apex Manager</span>
                          <span className="text-white truncate block">admin@apex.erp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmail("sales@apex.erp")}
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-pink-500/15 border border-white/10 hover:border-pink-400/40 text-left transition-all cursor-pointer"
                        >
                          <span className="text-[10px] text-pink-400 font-bold block">Sales Rep</span>
                          <span className="text-white truncate block">sales@apex.erp</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setEmail("admin@nexus.erp")}
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-indigo-500/15 border border-white/10 hover:border-indigo-400/40 text-left transition-all cursor-pointer"
                        >
                          <span className="text-[10px] text-indigo-400 font-bold block">Nexus Admin</span>
                          <span className="text-white truncate block">admin@nexus.erp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmail("hr@nexus.erp")}
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-purple-500/15 border border-white/10 hover:border-purple-400/40 text-left transition-all cursor-pointer"
                        >
                          <span className="text-[10px] text-purple-400 font-bold block">HR Manager</span>
                          <span className="text-white truncate block">hr@nexus.erp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmail("finance@nexus.erp")}
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-left transition-all cursor-pointer"
                        >
                          <span className="text-[10px] text-cyan-400 font-bold block">Finance Officer</span>
                          <span className="text-white truncate block">finance@nexus.erp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmail("sales@nexus.erp")}
                          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-pink-500/15 border border-white/10 hover:border-pink-400/40 text-left transition-all cursor-pointer"
                        >
                          <span className="text-[10px] text-pink-400 font-bold block">Sales Rep</span>
                          <span className="text-white truncate block">sales@nexus.erp</span>
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-zinc-400 text-center font-mono bg-white/[0.02] border border-white/10 py-2 rounded-xl">
                      Default Password: <span className="text-indigo-300 font-bold bg-indigo-500/20 px-1.5 py-0.5 rounded ml-1">password123</span>
                    </p>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
