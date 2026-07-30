'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, ArrowRight, Package, Receipt, Truck, Tag, BarChart3, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#14171F] font-sans overflow-x-hidden selection:bg-[#5C64ED] selection:text-white relative">
      
      {/* Exact Meridian Soft Gradient Mesh & Paper Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-radial from-[#D2D6FA]/70 via-[#E4E6FB]/30 to-transparent blur-3xl" />
        <div className="absolute top-[350px] left-0 w-[600px] h-[600px] bg-radial from-[#F4E8DB]/80 via-[#FAF7F2]/20 to-transparent blur-3xl" />
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. PUBLIC HEADER NAVIGATION BAR                                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="relative z-50 max-w-7xl mx-auto px-8 pt-7 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-[#14171F] flex items-center justify-center text-white font-serif font-black text-xl group-hover:scale-105 transition shadow-xs">
            N
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-[#14171F]">
            Nexuserp<span className="text-[#5C64ED]">.</span>
          </span>
        </Link>

        {/* Center Pill Navbar */}
        <nav className="hidden md:flex items-center bg-[#FAF7F2]/90 backdrop-blur-md border border-[#14171F]/10 rounded-full px-2 py-1.5 shadow-xs text-xs font-medium text-[#14171F]/80">
          <Link href="/" className="px-5 py-2 rounded-full bg-[#14171F] text-white font-bold transition">
            Home
          </Link>
          <a href="#modules" className="px-4.5 py-2 rounded-full hover:text-[#14171F] hover:bg-white/60 transition">
            Services
          </a>
          <a href="#about" className="px-4.5 py-2 rounded-full hover:text-[#14171F] hover:bg-white/60 transition">
            About
          </a>
          <a href="#contact" className="px-4.5 py-2 rounded-full hover:text-[#14171F] hover:bg-white/60 transition">
            Contact
          </a>
        </nav>

        {/* Top Right Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-full bg-[#14171F] hover:bg-[#202532] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 group cursor-pointer"
          >
            <span>Book a call</span>
            <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        </div>

      </header>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. EXACT MERIDIAN HERO LAYOUT                                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column Text Content */}
        <div className="lg:col-span-7 space-y-7">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#14171F]/10 text-[11px] font-bold tracking-wider uppercase text-[#4F5565] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#5C64ED]" />
            <span>NOW BOOKING Q3 ENGAGEMENTS</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-serif text-[#14171F] leading-[1.05] tracking-tight">
            Strategic marketing<br />
            for <span className="italic text-[#5C64ED] font-serif">ambitious</span> brands<span className="text-[#14171F]">.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-[#4F5565] max-w-xl leading-relaxed font-normal">
            Nexuserp is a senior consultancy partnering with founders and CMOs to ship sharper strategy, stronger brands and demand programs that actually move pipeline.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-full bg-[#14171F] hover:bg-[#202532] text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer group"
            >
              <span>Book a discovery call</span>
              <ArrowUpRight size={17} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>

            <Link
              href="/shop/nexus.erp"
              className="px-8 py-4 rounded-full bg-[#FAF7F2] hover:bg-white border border-[#14171F]/15 text-[#14171F] font-bold text-sm shadow-xs transition cursor-pointer"
            >
              Explore services
            </Link>
          </div>

        </div>

        {/* Right Stacked Cards (Exact Meridian Inspiration Layout) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Top White Card */}
          <div className="bg-white rounded-[28px] p-8 border border-[#14171F]/5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#5C64ED] text-[11px] font-bold tracking-widest uppercase font-mono">
              <Sparkles size={14} />
              <span>THIS QUARTER</span>
            </div>

            <div className="text-5xl sm:text-7xl font-serif font-normal text-[#14171F] tracking-tight">
              87%
            </div>

            <p className="text-xs text-[#4F5565] leading-relaxed font-medium">
              Average revenue growth across active client engagements in the last 12 months.
            </p>
          </div>

          {/* Bottom Dark Card */}
          <div className="bg-[#14171F] text-white rounded-[28px] p-8 shadow-xl space-y-5">
            <p className="font-serif italic text-xl sm:text-2xl leading-relaxed text-zinc-100">
              &quot;Nexuserp doesn&apos;t sell decks. They ship outcomes.&quot;
            </p>

            <div className="text-xs text-zinc-400 font-sans font-medium pt-1">
              — Marcus Chen, VP Growth at Velocity Tech
            </div>
          </div>

        </div>

      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. ERP MODULES SHOWCASE GRID                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section id="modules" className="relative z-10 max-w-7xl mx-auto px-8 py-20 border-t border-[#14171F]/10">
        
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#5C64ED] font-mono">OPERATIONAL CAPABILITIES</span>
          <h2 className="text-3xl sm:text-5xl font-serif text-[#14171F]">
            Built for total speed and clarity.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Package,
              title: "Inventory & Catalog Management",
              desc: "Manage 500-1,000+ SKUs with 1-click bulk CSV imports, warehouse transfers, and daily stock audit sync."
            },
            {
              icon: Receipt,
              title: "Smart POS & Thermal Receipts",
              desc: "Instant counter checkout using webcam barcode scanner, voice commands, cash register shifts, and printable thermal bills."
            },
            {
              icon: Truck,
              title: "Order Dispatch & Logistics",
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
              title: "CRM & Staff Payroll",
              desc: "Track sales pipelines, customer records, staff attendance, sales commissions, and monthly employee payslips."
            }
          ].map((m, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-[24px] border border-[#14171F]/10 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#5C64ED]/10 border border-[#5C64ED]/20 flex items-center justify-center text-[#5C64ED]">
                  <m.icon size={22} />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#14171F]">{m.title}</h3>
                <p className="text-xs text-[#4F5565] leading-relaxed">{m.desc}</p>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5C64ED] hover:text-[#4B52D9] transition group"
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
      <footer className="relative z-10 border-t border-[#14171F]/10 bg-white py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4F5565]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-[#14171F]">Nexuserp.</span>
            <span>© 2026 Enterprise Business Operating System</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/dashboard" className="hover:text-[#14171F]">Workspace</Link>
            <Link href="/shop/nexus.erp" className="hover:text-[#14171F]">Storefront</Link>
            <Link href="/login" className="hover:text-[#14171F]">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
