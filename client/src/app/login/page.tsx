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
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";

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
  const [verifyingShop, setVerifyingShop] = useState(false);

  // Store Passkey State
  const [passkeyInput, setPasskeyInput] = useState("");
  const [showPasskeyText, setShowPasskeyText] = useState(false);
  const [verifyingPasskey, setVerifyingPasskey] = useState(false);
  const [showDemoKeys, setShowDemoKeys] = useState(false);

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

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "System failed to contact shop authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex bg-[#030303] overflow-hidden text-zinc-100">
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* LEFT SIDE - Aurora & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] blur-[80px]" />

        {/* Logo Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-wider text-white block">
              NEXUS <span className="text-indigo-400">ERP</span>
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-400 block">
              Multi-Shop Operating System
            </span>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="my-auto relative z-10 flex flex-col gap-8 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <span className="px-3 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/10 rounded-full border border-indigo-500/20 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <Store size={13} className="text-indigo-400" /> Multi-Tenant Store Hub Enabled
            </span>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Every Shop.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Its Own Isolated Command Center.
              </span>
            </h1>
            <p className="text-base text-zinc-400 font-medium leading-relaxed">
              Connect your store account to view live sales statistics, inventory controls, employee payroll, and AI growth predictions in complete isolation.
            </p>
          </motion.div>

          {/* Floating glass key metrics/features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <GlassCard className="p-4 flex items-start gap-3 hover:border-indigo-500/20 transition-all duration-300">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Strict Store Boundaries</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Isolated databases per business shop.</p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <GlassCard className="p-4 flex items-start gap-3 hover:border-purple-500/20 transition-all duration-300">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Live Shop Analytics</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Real-time revenue & stock tracking.</p>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xs text-zinc-600 relative z-10"
        >
          &copy; {new Date().getFullYear()} Nexus ERP Systems Inc. All rights reserved.
        </motion.div>
      </div>

      {/* RIGHT SIDE - Multi-Step Store Portal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Glow Behind Portal Card */}
        <div className="absolute w-[340px] h-[340px] rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] z-10"
        >
          <GlassCard className="p-8 sm:p-10 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.4)] relative overflow-hidden">

            {/* Top Step Breadcrumb Indicator */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === 1 ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'}`}>
                  1
                </span>
                <span className={`text-xs font-semibold ${step === 1 ? 'text-white' : 'text-zinc-500'}`}>
                  Select Shop
                </span>
              </div>
              <ChevronRight size={14} className="text-zinc-600" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === 2 ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-zinc-800 text-zinc-500'}`}>
                  2
                </span>
                <span className={`text-xs font-semibold ${step === 2 ? 'text-white' : 'text-zinc-500'}`}>
                  User Login
                </span>
              </div>
            </div>

            {/* Error Notification */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 mb-6"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEP 1: SECURE SHOP ID & PASSKEY GATE (NO PUBLIC SHOP LIST) */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-indigo-400 bg-indigo-500/10 rounded border border-indigo-500/20 uppercase inline-flex items-center gap-1 mb-2">
                    <ShieldCheck size={12} /> Secure SaaS Terminal
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Connect Store Terminal
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Enter your registered <strong>Shop ID / Store Domain</strong> and <strong>Store Passkey</strong> to proceed.
                  </p>
                </div>

                <form onSubmit={handleDirectShopPasskeySubmit} className="space-y-4">
                  {/* Shop ID / Domain Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                      Shop ID / Store Domain
                    </label>
                    <div className="relative">
                      <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. nexus.erp or apex.erp"
                        value={shopDomain}
                        onChange={(e) => setShopDomain(e.target.value)}
                        className="w-full h-11 bg-white/[0.04] border border-white/10 rounded-lg pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Store Passkey Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                      Store Security Passkey
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type={showPasskeyText ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        value={passkeyInput}
                        onChange={(e) => setPasskeyInput(e.target.value)}
                        className="w-full h-11 bg-white/[0.04] border border-white/10 rounded-lg pl-10 pr-11 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPasskeyText(!showPasskeyText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPasskeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <AnimatedButton
                    type="submit"
                    isLoading={verifyingPasskey}
                    className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 mt-6"
                  >
                    Authenticate Store <ArrowRight size={14} />
                  </AnimatedButton>
                </form>

                {/* Developer Demo Test Helper (Discreet Toggle) */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowDemoKeys(!showDemoKeys)}
                    className="text-[10px] text-zinc-500 hover:text-indigo-300 font-mono flex items-center justify-between w-full p-2 rounded bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <KeyRound size={11} className="text-indigo-400" />
                      <span>{showDemoKeys ? "Hide Demo Shop Keys" : "Show Demo Shop Keys (Testing)"}</span>
                    </span>
                    <ChevronRight size={12} className={`transition-transform ${showDemoKeys ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showDemoKeys && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShopDomain("nexus.erp");
                            setPasskeyInput("NEXUS-2026");
                          }}
                          className="p-2 rounded bg-indigo-500/10 border border-indigo-500/20 text-left hover:border-indigo-500/40 transition-colors"
                        >
                          <span className="text-indigo-300 font-bold block">Nexus Store</span>
                          <span className="text-zinc-400 block truncate">ID: nexus.erp</span>
                          <span className="text-zinc-500 block truncate">Passkey: NEXUS-2026</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShopDomain("apex.erp");
                            setPasskeyInput("APEX-2026");
                          }}
                          className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-left hover:border-purple-500/40 transition-colors"
                        >
                          <span className="text-purple-300 font-bold block">Apex Store</span>
                          <span className="text-zinc-400 block truncate">ID: apex.erp</span>
                          <span className="text-zinc-500 block truncate">Passkey: APEX-2026</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SHOP USER AUTHENTICATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Active Selected Shop Banner */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                      <Store size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block">
                        Connected Store
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {selectedShop?.name || shopDomain}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono">
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
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 transition-all"
                  >
                    <ArrowLeft size={12} /> Change
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Store User Credentials
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Enter your email and password registered for this store.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Store User Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        required
                        disabled={loading}
                        placeholder="user@shop.erp"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Security Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        disabled={loading}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-11 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <AnimatedButton
                    type="submit"
                    isLoading={loading}
                    className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 mt-6"
                  >
                    Enter Store Terminal <ArrowRight size={14} />
                  </AnimatedButton>
                </form>

                {/* Sandbox Profiles for selected shop */}
                <div className="mt-6 border-t border-white/5 pt-5 space-y-2.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center block">
                    Available Profiles for {selectedShop?.name || "this Shop"}
                  </span>

                  {selectedShop?.domain === "apex.erp" ? (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setEmail("admin@apex.erp")}
                        className="p-2 rounded bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 text-left transition-colors"
                      >
                        <span className="text-[10px] text-purple-400 font-semibold block">Apex Manager</span>
                        <span className="text-white truncate block">admin@apex.erp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmail("sales@apex.erp")}
                        className="p-2 rounded bg-white/[0.02] hover:bg-pink-500/10 border border-white/5 text-left transition-colors"
                      >
                        <span className="text-[10px] text-pink-400 font-semibold block">Sales Rep</span>
                        <span className="text-white truncate block">sales@apex.erp</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setEmail("admin@nexus.erp")}
                        className="p-2 rounded bg-white/[0.02] hover:bg-indigo-500/10 border border-white/5 text-left transition-colors"
                      >
                        <span className="text-[10px] text-indigo-400 font-semibold block">Nexus Admin</span>
                        <span className="text-white truncate block">admin@nexus.erp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmail("hr@nexus.erp")}
                        className="p-2 rounded bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 text-left transition-colors"
                      >
                        <span className="text-[10px] text-purple-400 font-semibold block">HR Manager</span>
                        <span className="text-white truncate block">hr@nexus.erp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmail("finance@nexus.erp")}
                        className="p-2 rounded bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 text-left transition-colors"
                      >
                        <span className="text-[10px] text-cyan-400 font-semibold block">Finance Officer</span>
                        <span className="text-white truncate block">finance@nexus.erp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmail("sales@nexus.erp")}
                        className="p-2 rounded bg-white/[0.02] hover:bg-pink-500/10 border border-white/5 text-left transition-colors"
                      >
                        <span className="text-[10px] text-pink-400 font-semibold block">Sales Representative</span>
                        <span className="text-white truncate block">sales@nexus.erp</span>
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-500 text-center font-mono bg-white/[0.01] border border-white/5 py-1.5 rounded">
                    Password: <span className="text-white bg-white/10 px-1 py-0.5 rounded font-bold">password123</span>
                  </p>
                </div>
              </motion.div>
            )}

          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

