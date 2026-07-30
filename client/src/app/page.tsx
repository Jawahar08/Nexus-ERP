'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  BarChart3,
  Package,
  Receipt,
  Truck,
  Users,
  Building2,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E9] text-[#111522] font-sans overflow-x-hidden selection:bg-[#5667F6] selection:text-white">
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. PUBLIC HEADER NAVIGATION BAR                                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4">
        <nav className="bg-white/80 backdrop-blur-md border border-[#111522]/10 rounded-full px-6 py-3 shadow-sm flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#111522] flex items-center justify-center text-white font-serif font-black text-lg group-hover:scale-105 transition">
              N
            </div>
            <span className="font-bold text-lg tracking-tight font-serif text-[#111522]">
              Nexuserp
            </span>
          </Link>

          {/* Centered Navigation Pills */}
          <div className="hidden md:flex items-center gap-1 bg-[#F5F1E9] p-1 rounded-full border border-[#111522]/5 text-xs font-semibold text-[#111522]/70">
            <a href="#features" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-[#111522] transition">Product</a>
            <a href="#modules" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-[#111522] transition">Modules</a>
            <a href="#pos" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-[#111522] transition">POS & Retail</a>
            <a href="#security" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-[#111522] transition">Enterprise</a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-[#111522] hover:opacity-75 transition px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-full bg-[#5667F6] hover:bg-[#4353E4] text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 group"
            >
              <span>Open Workspace</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

        </nav>
      </header>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. EDITORIAL HERO SECTION                                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Headline Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#111522]/10 text-xs font-semibold text-[#111522]/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#5667F6] animate-pulse" />
            <span>BUSINESS OPERATIONS, REIMAGINED</span>
          </div>

          {/* Large Expressive Headline */}
          <h1 className="text-4xl sm:text-6xl font-serif font-normal text-[#111522] leading-[1.08] tracking-tight">
            Everything your business needs.{' '}
            <span className="italic font-serif text-[#5667F6] underline decoration-[#F5C84B] decoration-wavy decoration-2">
              Beautifully under control.
            </span>
          </h1>

          <p className="text-lg text-[#111522]/70 max-w-xl leading-relaxed">
            Nexuserp connects sales, inventory, purchasing, finance, customer management, and 3PL fulfillment into one clear, intelligent business workspace.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-7 py-3.5 rounded-full bg-[#111522] hover:bg-[#1E2333] text-white font-bold text-sm shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <span>Open Your Workspace</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/shop/nexus.erp"
              className="px-6 py-3.5 rounded-full bg-white hover:bg-white/80 border border-[#111522]/15 text-[#111522] font-bold text-sm shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Public Storefront</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#111522]/10 text-xs text-[#111522]/70">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={15} className="text-[#5667F6]" />
              <span>Multi-Tenant Architecture</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={15} className="text-[#5667F6]" />
              <span>Real-Time POS & Inventory</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={15} className="text-[#5667F6]" />
              <span>3PL Carrier Shipping</span>
            </div>
          </div>

        </div>

        {/* Right Floating Metric Card & Preview */}
        <div className="lg:col-span-5 relative">
          <div className="bg-white rounded-3xl p-6 border border-[#111522]/10 shadow-xl space-y-5 relative z-10">
            
            <div className="flex items-center justify-between border-b border-[#111522]/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#111522]/50 block">LIVE SYSTEM SNAPSHOT</span>
                <h3 className="font-serif font-bold text-lg text-[#111522]">Acme Enterprise Node</h3>
              </div>
              <span className="px-3 py-1 bg-[#F5C84B]/20 text-[#111522] text-xs font-bold rounded-full border border-[#F5C84B]/40 font-mono">
                Active Node
              </span>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 rounded-2xl bg-[#F5F1E9] space-y-1">
                <span className="text-[10px] text-[#111522]/60 font-bold uppercase block">500+ SKUs</span>
                <span className="text-xl font-bold text-[#111522]">Inventory Sync</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#5667F6]/10 text-[#5667F6] space-y-1 border border-[#5667F6]/20">
                <span className="text-[10px] font-bold uppercase block">LIVE SPEED</span>
                <span className="text-xl font-bold">100% Realtime</span>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F1E9]/60">
                <span className="flex items-center gap-2">
                  <Receipt size={14} className="text-[#5667F6]" />
                  <span>Thermal Receipts & Shifts</span>
                </span>
                <span className="font-mono text-emerald-600 font-bold">ESC/POS</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F1E9]/60">
                <span className="flex items-center gap-2">
                  <Truck size={14} className="text-[#5667F6]" />
                  <span>Logistics Carrier Dispatch</span>
                </span>
                <span className="font-mono text-[#5667F6] font-bold">Shiprocket / BlueDart</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F1E9]/60">
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#5667F6]" />
                  <span>Gemini AI Business Autopilot</span>
                </span>
                <span className="font-mono text-amber-600 font-bold">Enabled</span>
              </div>
            </div>

          </div>

          {/* Subtle Background Accent Card */}
          <div className="absolute -inset-4 bg-[#F5C84B]/30 rounded-[36px] rotate-2 -z-10 blur-xs" />
        </div>

      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. ERP MODULES SHOWCASE GRID                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section id="modules" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#111522]/10">
        
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5667F6]">OPERATIONAL CORE</span>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#111522]">
            One unified operating system for every department.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {[
            {
              icon: Package,
              title: "Inventory & Supermarket Catalog",
              desc: "Manage 500-1,000+ SKUs with 1-click bulk CSV imports, warehouse transfers, and daily stock audit sync."
            },
            {
              icon: Receipt,
              title: "Smart POS & Thermal Receipts",
              desc: "Instant counter checkout using webcam barcode scanner, voice commands, cash register shifts, and printable thermal bills."
            },
            {
              icon: Truck,
              title: "Order Dispatch & Shipping Labels",
              desc: "Complete fulfillment pipeline with 3PL logistics tracking (Shiprocket, BlueDart, Porter) and 4x6\" shipping labels."
            },
            {
              icon: Zap,
              title: "Promotions & Flash Sales Engine",
              desc: "Create percentage & flat discount codes, set minimum cart value rules, and publish live storefront offer banners."
            },
            {
              icon: BarChart3,
              title: "Finance & Tax Invoice Vault",
              desc: "Centralized permanent storage for all sales receipts, revenue analytics, income/expense ledgers, and downloadable GST bills."
            },
            {
              icon: Users,
              title: "CRM & Staff HR Payroll",
              desc: "Track sales pipelines, customer records, staff attendance, sales commissions, and monthly employee payslips."
            }
          ].map((m, i) => (
            <div
              key={i}
              className="bg-white p-7 rounded-3xl border border-[#111522]/10 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#5667F6]/10 border border-[#5667F6]/20 flex items-center justify-center text-[#5667F6]">
                  <m.icon size={22} />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#111522]">{m.title}</h3>
                <p className="text-xs text-[#111522]/70 leading-relaxed">{m.desc}</p>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5667F6] hover:text-[#4353E4] transition"
              >
                <span>Launch Module</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          ))}

        </div>

      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 4. FOOTER                                                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#111522]/10 bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#111522]/60">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-base text-[#111522]">Nexuserp</span>
            <span>© 2026 Enterprise Business Operating System</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/dashboard" className="hover:text-[#111522]">Dashboard</Link>
            <Link href="/shop/nexus.erp" className="hover:text-[#111522]">Public Storefront</Link>
            <Link href="/login" className="hover:text-[#111522]">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
