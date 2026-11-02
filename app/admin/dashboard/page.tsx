'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, QrCode, Users, LogOut, Calendar, BookOpen } from 'lucide-react';
import Footer from '@/Components/Footer';

export default function AdminDashboard() {
    const [adminName, setAdminName] = useState('Admin');
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAdminSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/auth/admin');
                return;
            }

            // Verify admin profile role
            const { data: profile, error } = await supabase
                .from('admin_profiles')
                .select('first_name, last_name, role')
                .eq('id', session.user.id)
                .single();

            if (error || !profile) {
                await supabase.auth.signOut();
                router.push('/auth/admin');
                return;
            }

            setAdminName(`${profile.first_name} ${profile.last_name} (${profile.role})`);
            setLoading(false);
        };

        void checkAdminSession();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('didache_admin_name');
        router.push('/auth/admin');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400">
                <div className="text-sm font-medium animate-pulse">Verifying admin clearance...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-12 max-w-6xl mx-auto">
            {/* Top Header */}
            <header className="flex items-center justify-between pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-white">
                            Welcome, {adminName}
                        </h1>
                        <p className="text-xs text-slate-400">Milk & Honey Sunday School • Admin Console</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-red-400 hover:border-red-500/30 transition"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                </button>
            </header>

            {/* Main Admin Content */}
            <main className="my-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-slate-400">Active Sessions</span>
                            <Calendar className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-extrabold text-white">0</div>
                        <p className="text-[11px] text-slate-400 mt-1">Ready to create Sunday session</p>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-slate-400">Check-Ins Today</span>
                            <Users className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="text-2xl font-extrabold text-white">0</div>
                        <p className="text-[11px] text-slate-400 mt-1">Live attendee count</p>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-slate-400">QR Status</span>
                            <QrCode className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-2xl font-extrabold text-amber-400">Inactive</div>
                        <p className="text-[11px] text-slate-400 mt-1">Generate session QR below</p>
                    </div>
                </div>

                {/* Next placeholder card for QR Session Manager */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-4">
                    <div className="flex items-center gap-2 text-base font-bold text-white">
                        <QrCode className="w-5 h-5 text-emerald-400" />
                        <span>Step 2: Sunday Session & Dynamic QR Generator</span>
                    </div>
                    <p className="text-xs text-slate-400">
                        This module will manage active Sunday service sessions and display the secure dynamic QR code for hall check-ins.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}