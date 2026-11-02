'use client';

import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, Users, ChevronDown } from 'lucide-react';
import AttendanceTrends from '@/Components/admin/analytics/AttendanceTrends'

export default function OverviewAnalytics({ members, guests, attendance, sessions }: any) {
    const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'daily' | 'monthly' | 'quarterly' | 'yearly'>('daily');
    const [selectedYear, setSelectedYear] = useState<string>('2026-2027');

    const totalWorshippers = members.length + guests.length;
    const memberMaleCount = members.filter((m: any) => m.gender === 'Male').length;
    const memberFemaleCount = members.filter((m: any) => m.gender === 'Female').length;
    const guestMaleCount = guests.filter((g: any) => g.gender === 'Male').length;
    const guestFemaleCount = guests.filter((g: any) => g.gender === 'Female').length;
    const upgradeEligibleGuests = guests.filter((g: any) => !g.is_converted_to_member && g.attendance_count >= 3);

    // Latest Sunday Check-in metrics (Nov 1, 2026 session check)
    const novFirstSessionDate = '2026-11-01';
    const novFirstAttendance = attendance.filter((a: any) => {
        const sessionObj = sessions.find((s: any) => s.id === a.session_id);
        return sessionObj?.session_date === novFirstSessionDate || a.checked_in_at?.startsWith(novFirstSessionDate);
    });
    const novFirstPresentMemberIds = new Set(novFirstAttendance.map((a: any) => a.user_id));

    const allAbsenteesToday = members.filter((m: any) => !novFirstPresentMemberIds.has(m.id));
    const highPriorityAbsentees = members.filter((m: any) => {
        const memberCheckIns = attendance.filter((a: any) => a.user_id === m.id).length;
        const attendedToday = novFirstPresentMemberIds.has(m.id);
        return memberCheckIns >= 3 && !attendedToday;
    });

    return (
        <div className="space-y-6">
            {/* Top Metric Cards - Collapsible Accordion on Mobile, Full Grid on Laptop */}
            <div className="sm:hidden">
                <details className="group rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
                    <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-white">
                        <span className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-400" /> Key Metrics Summary ({totalWorshippers} Worshippers)
                        </span>
                        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="grid grid-cols-1 gap-3 pt-4 mt-3 border-t border-slate-800">
                        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-4">
                            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Total Unique Worshippers</span>
                            <div className="text-2xl font-extrabold text-white mt-1">{totalWorshippers}</div>
                            <p className="text-[10px] text-slate-400">Active Members + Guests</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                                <span className="text-[11px] font-semibold text-slate-400">Members</span>
                                <div className="text-xl font-extrabold text-white mt-1">{members.length}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                                <span className="text-[11px] font-semibold text-slate-400">Guests</span>
                                <div className="text-xl font-extrabold text-amber-400 mt-1">{guests.length}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                                <span className="text-[11px] font-semibold text-slate-400">Sundays This Month</span>
                                <div className="text-xl font-extrabold text-indigo-400 mt-1">5</div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                                <span className="text-[11px] font-semibold text-slate-400">Upgrade Eligible</span>
                                <div className="text-xl font-extrabold text-emerald-400 mt-1">{upgradeEligibleGuests.length}</div>
                            </div>
                        </div>
                    </div>
                </details>
            </div>

            {/* Laptop View: Always Expanded Grid */}
            <div className="hidden sm:grid grid-cols-5 gap-4">
                <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Unique Worshippers</span>
                    <div className="text-3xl font-extrabold text-white mt-2">{totalWorshippers}</div>
                    <p className="text-[10px] text-slate-400 mt-1">Active Members + Guests</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">Total Members</span>
                    <div className="text-2xl font-extrabold text-white mt-2">{members.length}</div>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">Total Guests</span>
                    <div className="text-2xl font-extrabold text-amber-400 mt-2">{guests.length}</div>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">Sundays This Month</span>
                    <div className="text-2xl font-extrabold text-indigo-400 mt-2">5</div>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">Upgrade Eligible</span>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-2">{upgradeEligibleGuests.length}</div>
                </div>
            </div>

            {/* Comprehensive Gender Matrix Table - Collapsible on Mobile, Full on Laptop */}
            <div className="sm:hidden">
                <details className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-slate-300 uppercase tracking-wider">
                        <span>Demographic & Gender Split</span>
                        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="text-[11px] text-slate-400 mt-2">
                        Breakdown of male and female ratios across registered members, visiting guests, and the overall congregation.
                    </p>
                    <div className="grid grid-cols-1 gap-3 pt-3 mt-3 border-t border-slate-800 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400 font-medium">Members Gender Split</span>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-blue-400 font-bold">Male: {memberMaleCount}</span>
                                <span className="text-pink-400 font-bold">Female: {memberFemaleCount}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400 font-medium">Guests Gender Split</span>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-blue-400 font-bold">Male: {guestMaleCount}</span>
                                <span className="text-pink-400 font-bold">Female: {guestFemaleCount}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-emerald-400 font-medium">Total Congregation Split</span>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-blue-400 font-bold">Male: {memberMaleCount + guestMaleCount}</span>
                                <span className="text-pink-400 font-bold">Female: {memberFemaleCount + guestFemaleCount}</span>
                            </div>
                        </div>
                    </div>
                </details>
            </div>

            {/* Laptop View: Always Expanded Demographic Split */}
            <div className="hidden sm:block rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Demographic & Gender Split</h3>
                <p className="text-[11px] text-slate-400">
                    Breakdown of male and female ratios across registered members, visiting guests, and the overall congregation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 font-medium">Members Gender Split</span>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-blue-400 font-bold">Male: {memberMaleCount}</span>
                            <span className="text-pink-400 font-bold">Female: {memberFemaleCount}</span>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 font-medium">Guests Gender Split</span>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-blue-400 font-bold">Male: {guestMaleCount}</span>
                            <span className="text-pink-400 font-bold">Female: {guestFemaleCount}</span>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-emerald-400 font-medium">Total Congregation Split</span>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-blue-400 font-bold">Male: {memberMaleCount + guestMaleCount}</span>
                            <span className="text-pink-400 font-bold">Female: {memberFemaleCount + guestFemaleCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render Modular Analytics Engine Tiers */}
            <AttendanceTrends members={members} attendance={attendance} sessions={sessions} />

        </div>
    );
}