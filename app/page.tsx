'use client';

import Link from 'next/link';
import { BookOpen, QrCode, ShieldCheck, UserCheck, Sparkles, ArrowRight, CheckCircle2, Zap, UserPlus } from 'lucide-react';
import Footer from "@/Components/Footer";

export default function LandingPage() {
  return (
      <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-12 max-w-6xl mx-auto relative">

        {/* Header Branding */}
        <header className="flex items-center justify-between pt-2 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10 backdrop-blur-md">
              <BookOpen className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">Didache:</h1>
              <p className="text-[11px] font-medium text-emerald-400 tracking-wider uppercase">Milk & Honey</p>
            </div>
          </div>

          <Link
              href="/auth/admin/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:border-emerald-500/40 transition"
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Admin Portal</span>
          </Link>
        </header>

        {/* Main Hero Section - Responsive Grid for Desktop */}
        <main className="my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column: Headline & Description */}
          <div className="lg:col-span-7 space-y-6 text-left">

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-md">
              <span>Sunday School Attendance & Community Portal</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Check in seamlessly. <br />
              <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Track your growth.
            </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              Welcome to the Didache portal for RCCG Milk & Honey. Scan the Sunday QR code in seconds, check in as a visiting guest, or log in to view your attendance history.
            </p>

            {/* Desktop Feature Badges */}
            <div className="hidden sm:flex items-center gap-6 pt-2 text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>No Passwords Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant Check-In</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Action Cards */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
            <div className="relative rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-3.5">
              <div className="space-y-1 mb-2">
                <h3 className="text-lg font-bold text-white">Sunday School Access</h3>
                <p className="text-xs text-slate-400">Select an option below to check in today</p>
              </div>

              {/* Regular Member Check-In */}
              <Link
                  href="/auth/member/login"
                  className="group flex w-full items-center justify-between rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 p-4 font-semibold text-white shadow-xl shadow-emerald-600/20 hover:opacity-95 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <QrCode className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm sm:text-base font-bold">Member Check-In / Scan QR</div>
                    <div className="text-xs text-emerald-100 font-normal">Registered members log attendance</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 opacity-80 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Guest / Visitor Quick Check-In */}
              <Link
                  href="/auth/guest"
                  className="group flex w-full items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 p-4 text-amber-200 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs sm:text-sm font-bold text-white">Visiting Today? Guest Check-In</div>
                    <div className="text-[11px] text-amber-300/80 font-normal">Quick 1-minute check-in (No account needed)</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400 opacity-80 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* First Time Member Registration */}
              <Link
                  href="/auth/member/register"
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs sm:text-sm font-semibold text-slate-300 hover:border-emerald-500/40 hover:bg-slate-800/60 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-amber-400 shrink-0">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                </div>
                  <div className='text-left'>
                  <div className="text-xs sm:text-sm font-bold text-white">Join Us/Become A Member</div>
                  <span>Are you a member without an account, or new and planning to stay? Start here.</span>
                </div>
                </div>
              </Link>
            </div>
          </div>
        </main>

        {/* Feature Highlights Section for Larger Screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-left backdrop-blur-sm">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">1-Tap Attendance</h3>
            <p className="text-xs text-slate-400 mt-1">Scan the printed or displayed QR code to log attendance instantly.</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-left backdrop-blur-sm">
            <Zap className="h-6 w-6 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">Zero Password Hassle</h3>
            <p className="text-xs text-slate-400 mt-1">Your phone securely retains your profile details for one-tap sign ins.</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-left sm:col-span-2 lg:col-span-1 backdrop-blur-sm">
            <Sparkles className="h-6 w-6 text-indigo-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">Growth Tracking</h3>
            <p className="text-xs text-slate-400 mt-1">View monthly attendance streaks and church activities directly on your phone.</p>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
  );
}