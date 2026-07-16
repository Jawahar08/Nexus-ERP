"use client";

import React, { useState } from "react";
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
  Layers,
  Cpu,
} from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: "nexus-demo", // Standard demo tenant slug as default
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to authenticate");
      }

      // Store in localStorage
      localStorage.setItem("nexus_access_token", data.data.accessToken);
      localStorage.setItem("nexus_user", JSON.stringify(data.data));

      // Save cookie for middleware verification
      const isSecure = window.location.protocol === "https:";
      document.cookie = `nexus_token=${data.data.accessToken}; path=/; max-age=86400; SameSite=Lax${isSecure ? "; Secure" : ""}`;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "System failed to contact authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex bg-[#030303] overflow-hidden">
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* LEFT SIDE - Aurora & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,transparent_70%)] blur-[80px]" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-2 relative z-10"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Cpu size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-wider text-white">
            NEXUS <span className="text-indigo-400">AI</span>
          </span>
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
              <Sparkles size={12} className="animate-pulse" /> Phase UI-2 Active
            </span>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Enterprise Intelligence.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                One Unified Platform.
              </span>
            </h1>
            <p className="text-base text-zinc-400 font-medium">
              Inventory, CRM, Finance, HR, and AI prediction modules running from a single command center. Built for elite enterprises.
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
                  <h4 className="text-sm font-semibold text-white">Bank-Grade Isolation</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Strict multi-tenant boundary parameters.</p>
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
                  <h4 className="text-sm font-semibold text-white">Microsecond HMR</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Instant action sync with low latency.</p>
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
          &copy; {new Date().getFullYear()} Nexus ERP AI Inc. All rights reserved.
        </motion.div>
      </div>

      {/* RIGHT SIDE - Auth Portal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Glow Behind Login Card */}
        <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] z-10"
        >
          <GlassCard className="p-8 sm:p-10 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.4)] relative">
            <div className="flex flex-col gap-2 mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white text-center sm:text-left">
                Access Workspace
              </h2>
              <p className="text-sm text-zinc-400 text-center sm:text-left">
                Enter your credentials to connect to the platform.
              </p>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Workspace Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    disabled={loading}
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Security Password
                  </label>
                </div>
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
                Connect Terminal <ArrowRight size={14} />
              </AnimatedButton>
            </form>

            {/* Premium Sandbox Demo Access Grid */}
            <div className="mt-8 border-t border-white/5 pt-6 space-y-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center block">
                Sandbox Profiles
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 font-mono">
                <div className="p-1.5 rounded bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[10px] text-indigo-400 font-semibold mb-0.5">Admin Role</span>
                  <span className="text-white truncate">admin@nexus.erp</span>
                </div>
                <div className="p-1.5 rounded bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[10px] text-purple-400 font-semibold mb-0.5">HR Role</span>
                  <span className="text-white truncate">hr@nexus.erp</span>
                </div>
                <div className="p-1.5 rounded bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[10px] text-cyan-400 font-semibold mb-0.5">Finance Role</span>
                  <span className="text-white truncate">finance@nexus.erp</span>
                </div>
                <div className="p-1.5 rounded bg-white/[0.02] border border-white/5 flex flex-col">
                  <span className="text-[10px] text-pink-400 font-semibold mb-0.5">Sales Role</span>
                  <span className="text-white truncate">sales@nexus.erp</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 text-center font-medium font-mono bg-white/[0.01] border border-white/5 py-1.5 rounded">
                Unified Password: <span className="text-white bg-white/10 px-1 py-0.5 rounded font-bold">password123</span>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
