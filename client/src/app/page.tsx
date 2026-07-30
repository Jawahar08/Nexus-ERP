'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, ArrowRight, Package, Receipt, Truck, Tag, BarChart3, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E9] text-[#111522] font-sans overflow-x-hidden selection:bg-[#5667F6] selection:text-white relative">
      
      {/* Background Gradient Mesh & Paper Grain Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-radial from-[#D4D6F8]/60 via-[#E8E4FD]/30 to-transparent blur-3xl" />
        <div className="absolute top-[400px] left-0 w-[500px] h-[500px] bg-radial from-[#FCE8BD]/40 via-[#F5F1E9]/20 to-transparent blur-3xl" />
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. PUBLIC HEADER NAVIGATION BAR                                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="relative z-50 max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-[#111522] flex items-center justify-center text-white font-serif font-black text-xl group-hover:scale-105 transition shadow-xs">
            N
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-[#111522]">
            Nexuserp<span className="text-[#5667F6]">.</span>
          </span>
        </Link>

        {/* Center Pill Navbar */}
        <nav className="hidden md:flex items-center bg-white/90 backdrop-blur-md border border-[#111522]/10 rounded-full px-2 py-1.5 shadow-sm text-xs font-semibold">
          <Link href="/" className="px-5 py-2 rounded-full bg-[#111522] text-white font-bold transition">
            Home
          </Link>
          <a href="#modules" className="px-4 py-2 rounded-full text-[#111522]/70 hover:text-[#111522] hover:bg-[#F5F1E9] transition">
            Modules
          </a>
          <a href="#pos" className="px-4 py-2 rounded-full text-[#111522]/70 hover:text-[#111522] hover:bg-[#F5F1E9] transition">
            POS & Retail
          </a>
          <a href="#enterprise" className="px-4 py-2 rounded-full text-[#111522]/70 hover:text-[#111522] hover:bg-[#F5F1E9] transition">
            Enterprise
          </a>
        </nav>

        {/* Top Right Action Pill */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-block text-xs font-bold text-[#111522] hover:opacity-70 transition px-2 py-1"
          >
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-full bg-[#111522] hover:bg-[#1E2333] text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 group cursor-pointer"
          >
            <span>Open Workspace</span>
            <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        </div>

      </header>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. EXACT MERIDIAN-STYLE EDITORIAL HERO SECTION                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column Content */}
        <div className="lg:col-span-7 space-y-7">
          
          {/* Status Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#111522]/10 text-[11px] font-bold tracking-wider uppercase text-[#111522]/70 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#5667F6] animate-pulse" />
            <span>NOW BOOKING Q3 BUSINESS ENGAGEMENTS</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-serif text-[#111522] leading-[1.05] tracking-tight">
            Intelligent operating system for{' '}
            <span className="italic text-[#5667F6] font-serif">ambitious</span>{' '}
            enterprises<span className="text-[#5667F6]">.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-[#111522]/70 max-w-xl leading-relaxed">
            Nexuserp connects live POS retail counters, supermarket inventory, 3PL shipping logistics, financial ledgers, and staff payroll into one clear operating workspace.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-full bg-[#111522] hover:bg-[#1E2333] text-white font-bold text-sm shadow-xl transition flex items-center gap-2 cursor-pointer group"
            >
              <span>Open your workspace</span>
              <ArrowUpRight size={17} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>

            <Link
              href="/shop/nexus.erp"
              className="px-7 py-4 rounded-full bg-white/90 hover:bg-white border border-[#111522]/15 text-[#111522] font-bold text-sm shadow-xs transition cursor-pointer"
            >
              Explore public storefront
            </Link>
          </div>

        </div>

        {/* Right Stacked Cards (Exact Meridian Inspiration Layout) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Top White Card */}
          <div className="bg-white rounded-[28px] p-7 border border-[#111522]/10 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-[#5667F6] text-[11px] font-bold tracking-widest uppercase font-mono">
              <Sparkles size={14} />
              <span>THIS QUARTER</span>
            </div>

            <div className="text-5xl sm:text-6xl font-serif font-normal text-[#111522] tracking-tight">
              99.8%
            </div>

            <p className="text-xs text-[#111522]/70 leading-relaxed font-medium">
              Average inventory accuracy & order fulfillment retention rate across active store operations over the last 12 months.
            </p>
          </div>

          {/* Bottom Dark Card */}
          <div className="bg-[#111522] text-white rounded-[28px] p-7 shadow-xl space-y-4 border border-[#111522]">
            <p className="font-serif italic text-xl leading-relaxed text-zinc-100">
              &quot;Nexuserp doesn&apos;t just store sales data. They ship outcomes and automate operating workflow.&quot;
            </p>

            <div className="text-xs text-zinc-400 font-mono pt-1 border-t border-white/10 flex items-center justify-between">
              <span>— Jawahar, Founder at Acme ERP</span>
              <span className="text-[#F5C84B] font-bold">Verified ERP</span>
            </div>
          </div>

        </div>

      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. ERP MODULES SHOWCASE GRID                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section id="modules" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-[#111522]/10">
        
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#5667F6] font-mono">OPERATIONAL MODULES</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#111522]">
            Built for total speed and clarity.
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
              icon: Tag,
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
              className="bg-white p-7 rounded-[24px] border border-[#111522]/10 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4"
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
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5667F6] hover:text-[#4353E4] transition group"
              >
                <span>Launch Module</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          ))}
        </div>

      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 4. FOOTER                                                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-[#111522]/10 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#111522]/60">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-[#111522]">Nexuserp.</span>
            <span>© 2026 Enterprise Business Operating System</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/dashboard" className="hover:text-[#111522]">Workspace</Link>
            <Link href="/shop/nexus.erp" className="hover:text-[#111522]">Storefront</Link>
            <Link href="/login" className="hover:text-[#111522]">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
