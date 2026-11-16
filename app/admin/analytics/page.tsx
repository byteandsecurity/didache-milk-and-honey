'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/Components/LoadingSpinner';
import { DidacheGeometricIcon } from '@/Components/DidacheIcon';
import { computeMonthlyMetrics, computeQuarterlyMetrics, computeYearlyMetrics } from '@/lib/analytics/admin/engine';

import DailyView from '@/Components/admin/analytics/DailyView';
import MonthlyView from '@/Components/admin/analytics/MonthlyView';
import QuarterlyView from '@/Components/admin/analytics/QuaterlyView';
import YearlyView from '@/Components/admin/analytics/YearlyView';

export default function ExecutiveAnalyticsDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

    //  Testing vs Production Mode Toggle
    const [isTestingMode, setIsTestingMode] = useState<boolean>(true);

    // Search &  User-Selectable Pagination Size
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(5);

    const [members, setMembers] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [guestAttendance, setGuestAttendance] = useState<any[]>([]);
    const [guestProfiles, setGuestProfiles] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [mRes, aRes, gaRes, gpRes] = await Promise.all([
                supabase.from('profiles').select('*'),
                supabase.from('attendance').select('*'),
                supabase.from('guest_attendance').select('*'),
                supabase.from('guest_profiles').select('*'),
            ]);

            if (mRes.data) setMembers(mRes.data);
            if (aRes.data) setAttendance(aRes.data);
            if (gaRes.data) setGuestAttendance(gaRes.data);
            if (gpRes.data) setGuestProfiles(gpRes.data);
            setLoading(false);
        };

        void fetchData();
    }, [supabase]);

    if (loading) {
        return <LoadingSpinner text="Loading Executive Analytics Engine..." icon={DidacheGeometricIcon} />;
    }

    const novemberSundays = ['2026-11-02', '2026-11-05', '2026-11-06', '2026-11-12'];
    const novemberMetrics = computeMonthlyMetrics('2026-11', 'November 2026', novemberSundays, members, attendance, guestAttendance, guestProfiles);

    const q1Metrics = computeQuarterlyMetrics(
        'Q1-2026',
        'Q1: Sept - Nov 2026',
        [
            { key: '2026-09', title: 'September 2026', sundays: ['2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27'] },
            { key: '2026-10', title: 'October 2026', sundays: ['2026-10-04', '2026-10-11', '2026-10-18', '2026-10-25'] },
            { key: '2026-11', title: 'November 2026', sundays: novemberSundays },
        ],
        members,
        attendance,
        guestAttendance,
        guestProfiles
    );

    const yearlyMetrics = computeYearlyMetrics('2026-2027', 'Year 2026-2027 - Sept to Aug', [q1Metrics], members, attendance, guestAttendance);

    const matchesSearch = (title: string) => {
        if (!searchQuery.trim()) return true;
        return title.toLowerCase().includes(searchQuery.toLowerCase());
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-12 text-slate-100 max-w-7xl mx-auto space-y-8">
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                        onClick={() => router.push('/admin/dashboard')}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 transition cursor-pointer self-start"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Admin Dashboard</span>
                    </button>

                    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl self-start sm:self-auto">
                        <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-slate-300">Testing Mode:</span>
                        <button
                            onClick={() => setIsTestingMode(!isTestingMode)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isTestingMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                        >
                            {isTestingMode ? 'Enabled (Flexible)' : 'Disabled (Production)'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                        <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Executive Analytics Suite</span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Multi-Tier Intelligence Engine</h1>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
                        {(['daily', 'monthly', 'quarterly', 'yearly'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                                    activeTab === tab ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab !== 'daily' && (
                    <div className="relative max-w-md">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by year (e.g. 2026) or month (e.g. November)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                )}
            </div>

            {/* Tab Views */}
            {activeTab === 'daily' && <DailyView dailyCards={novemberMetrics.dailyCards} />}

            {activeTab === 'monthly' && matchesSearch(novemberMetrics.monthTitle) && (
                <div className="space-y-6">
                    <MonthlyView novemberMetrics={novemberMetrics} isTestingMode={isTestingMode} />
                    <PaginationBar currentPage={currentPage} pageSize={pageSize} totalItems={1} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

            {activeTab === 'quarterly' && matchesSearch(q1Metrics.quarterTitle) && (
                <div className="space-y-6">
                    <QuarterlyView q1Metrics={q1Metrics} isTestingMode={isTestingMode} />
                    <PaginationBar currentPage={currentPage} pageSize={pageSize} totalItems={1} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}

            {activeTab === 'yearly' && matchesSearch(yearlyMetrics.yearTitle) && (
                <div className="space-y-6">
                    <YearlyView yearlyMetrics={yearlyMetrics} />
                    <PaginationBar currentPage={currentPage} pageSize={pageSize} totalItems={1} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
                </div>
            )}
        </div>
    );
}

// User-Selectable Pagination Bar Component
function PaginationBar({ currentPage, pageSize, totalItems, onPageChange, onPageSizeChange }: { currentPage: number; pageSize: number; totalItems: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void }) {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-xs gap-4">
            <div className="flex items-center gap-3">
                <span className="text-slate-400">Showing page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong></span>
                <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">Per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white focus:outline-none"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}