'use client';

import React, { useState, useMemo } from 'react';
import {
    Users, ChevronDown, UserCheck, UserX,
    HeartHandshake, Beaker, PlusCircle, BarChart3, ArrowRight, Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OverviewAnalyticsProps {
    members: any[];
    guests: any[];
    attendance: any[];
    sessions: any[];
}

export default function OverviewAnalytics({ members = [], guests = [], attendance = [], sessions = [] }: OverviewAnalyticsProps) {
    const router = useRouter();
    const now = new Date();

    // 🧪 TESTING MODE & SIMULATION
    const [testSimulatedDate, setTestSimulatedDate] = useState<string>(now.toISOString().split('T')[0]);
    const [localAttendance, setLocalAttendance] = useState<any[]>(attendance);

    React.useEffect(() => {
        setLocalAttendance(attendance);
    }, [attendance]);

    // Core Worshipper Counts
    const activeMembers = members.filter((m: any) => !m.is_deleted);
    const totalWorshippers = activeMembers.length + guests.length;

    const memberMaleCount = activeMembers.filter((m: any) => m.gender === 'Male').length;
    const memberFemaleCount = activeMembers.filter((m: any) => m.gender === 'Female').length;
    const guestMaleCount = guests.filter((g: any) => g.gender === 'Male').length;
    const guestFemaleCount = guests.filter((g: any) => g.gender === 'Female').length;
    const upgradeEligibleGuests = guests.filter((g: any) => !g.is_converted_to_member && (g.attendance_count >= 3 || g.total_visits >= 3));

    // Normalize date string helper
    const normalizeDate = (raw: any): string => {
        if (!raw) return '';
        if (typeof raw === 'string') return raw.slice(0, 10);
        if (raw instanceof Date) return raw.toISOString().slice(0, 10);
        return '';
    };

    const activeDailyDate = testSimulatedDate;

    // Daily Check-In Calculations (Accurate & Isolated)
    const dailyMemberAttendance = useMemo(() => {
        return localAttendance.filter((a: any) => {
            const sessionObj = sessions.find((s: any) => s.id === a.session_id);
            const aDate = normalizeDate(a.session_date) || normalizeDate(a.checked_in_at) || normalizeDate(sessionObj?.session_date);
            return aDate === activeDailyDate;
        });
    }, [localAttendance, sessions, activeDailyDate]);

    const dailyPresentMemberIds = useMemo(() => {
        return new Set(dailyMemberAttendance.map((a: any) => a.user_id || a.member_id || a.profile_id));
    }, [dailyMemberAttendance]);

    const dailyAttendedMembers = useMemo(() => {
        return activeMembers.filter((m: any) => dailyPresentMemberIds.has(m.id));
    }, [activeMembers, dailyPresentMemberIds]);

    const dailyAbsentees = useMemo(() => {
        return activeMembers.filter((m: any) => !dailyPresentMemberIds.has(m.id));
    }, [activeMembers, dailyPresentMemberIds]);

    const habitualAbsenteesToday = useMemo(() => {
        return activeMembers.filter((m: any) => {
            const totalVisits = localAttendance.filter((a: any) => (a.user_id || a.member_id) === m.id).length;
            const attendedToday = dailyPresentMemberIds.has(m.id);
            return totalVisits >= 3 && !attendedToday;
        });
    }, [activeMembers, localAttendance, dailyPresentMemberIds]);

    const dailyAttendedGuests = useMemo(() => {
        return guests.filter((g: any) => {
            const firstAtt = normalizeDate(g.first_attended_at);
            const lastAtt = normalizeDate(g.last_attended_at);
            const created = normalizeDate(g.created_at);
            return firstAtt === activeDailyDate || lastAtt === activeDailyDate || created === activeDailyDate;
        });
    }, [guests, activeDailyDate]);

    const totalDailyAttendance = dailyAttendedMembers.length + dailyAttendedGuests.length;
    const dailyTurnoutRate = activeMembers.length > 0 ? Math.round((dailyAttendedMembers.length / activeMembers.length) * 100) : 0;

    const handleSimulateCheckIn = () => {
        if (activeMembers.length === 0) return;
        const randomMember = activeMembers[Math.floor(Math.random() * activeMembers.length)];
        if (dailyPresentMemberIds.has(randomMember.id)) return;

        const newRecord = {
            id: `test-sim-${Date.now()}`,
            user_id: randomMember.id,
            session_date: activeDailyDate,
            checked_in_at: new Date().toISOString(),
        };
        setLocalAttendance([newRecord, ...localAttendance]);
    };

    return (
        <div className="space-y-6">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-5 shadow-xl sm:col-span-1">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Worshippers</span>
                    <div className="text-3xl font-extrabold text-white mt-2">{totalWorshippers}</div>
                    <p className="text-[10px] text-slate-400 mt-1">Active Members + Guests</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">Total Members</span>
                    <div className="text-2xl font-extrabold text-white mt-2">{activeMembers.length}</div>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">Total Guests</span>
                    <div className="text-2xl font-extrabold text-amber-400 mt-2">{guests.length}</div>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">Pastoral Care Alert</span>
                    <div className="text-2xl font-extrabold text-red-400 mt-2">{habitualAbsenteesToday.length}</div>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
                    <span className="text-xs font-semibold text-slate-400">Upgrade Eligible</span>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-2">{upgradeEligibleGuests.length}</div>
                </div>
            </div>

            {/* Demographic Split */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Demographic & Gender Split</h3>
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

            {/* Dedicated Analytics Engine Gateway Banner */}
            <div className="rounded-3xl border border-emerald-500/40 bg-linear-to-r from-emerald-950/60 via-slate-900 to-slate-900 p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-xl">
                <div className="space-y-1 text-center sm:text-left">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <BarChart3 className="w-3.5 h-3.5" /> Deep Statistical Suite
                    </span>
                    <h3 className="text-lg font-bold text-white">Looking for the Full Executive Analytics Engine?</h3>
                    <p className="text-xs text-slate-300 max-w-xl">
                        Access comprehensive daily, monthly, quarterly, and yearly reporting, peak turnout trends, visitor conversion breakdowns, and automated pastoral care lists in a dedicated workspace.
                    </p>
                </div>

                <button
                    onClick={() => router.push('/admin/analytics')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all shrink-0 cursor-pointer"
                >
                    <span>Open Analytics Engine</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Daily Operational Snapshot & Testing Bar */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl space-y-6">

                {/* 🧪 Testing Control Bar */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2 font-semibold">
                        <Beaker className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Daily Simulation Engine: Test Any Date & Check-Ins</span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                            <label className="text-[11px] text-amber-300 whitespace-nowrap">Simulate Date:</label>
                            <input
                                type="date"
                                value={testSimulatedDate}
                                onChange={(e) => setTestSimulatedDate(e.target.value)}
                                className="rounded-lg border border-amber-500/30 bg-slate-950 px-2.5 py-1 text-xs text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>

                        <button
                            onClick={handleSimulateCheckIn}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-950 transition cursor-pointer shrink-0"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Simulate Check-In</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-400" /> Operational Snapshot for {activeDailyDate}
                    </h3>
                </div>

                {/* Daily Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Attendance</span>
                        <p className="text-2xl font-extrabold text-emerald-400 mt-1">{totalDailyAttendance}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Turnout Rate</span>
                        <p className="text-2xl font-extrabold text-amber-400 mt-1">{dailyTurnoutRate}%</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total Absentees</span>
                        <p className="text-2xl font-extrabold text-red-400 mt-1">{dailyAbsentees.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Visitors Today</span>
                        <p className="text-2xl font-extrabold text-blue-400 mt-1">{dailyAttendedGuests.length}</p>
                    </div>
                </div>

                {/* Collapsible Dropdowns */}
                <div className="space-y-3">
                    <details className="group rounded-2xl border border-emerald-500/30 bg-slate-950/60 p-4">
                        <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-emerald-400">
                            <span className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4" /> Members Who Attended Today ({dailyAttendedMembers.length})
                            </span>
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-800 text-xs">
                            {dailyAttendedMembers.length > 0 ? (
                                dailyAttendedMembers.map((m: any) => (
                                    <div key={m.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                                        <span className="font-semibold text-white">{m.first_name} {m.last_name}</span>
                                        <span className="text-[10px] text-slate-400">{m.phone_number}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-xs py-2 col-span-2">No members checked in for this date yet.</p>
                            )}
                        </div>
                    </details>

                    <details className="group rounded-2xl border border-red-500/30 bg-slate-950/60 p-4" open>
                        <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-red-400">
                            <span className="flex items-center gap-2">
                                <HeartHandshake className="w-4 h-4 text-red-400" /> Pastoral Care Alert: Regular Members Missed Today ({habitualAbsenteesToday.length})
                            </span>
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="text-[11px] text-slate-400 mt-2">Members with 3+ past visits who are missing today. High priority for follow-up.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-800 text-xs">
                            {habitualAbsenteesToday.length > 0 ? (
                                habitualAbsenteesToday.map((m: any) => (
                                    <div key={m.id} className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20 flex justify-between items-center">
                                        <div>
                                            <span className="font-bold text-white block">{m.first_name} {m.last_name}</span>
                                            <span className="text-[10px] text-slate-400">{m.phone_number || 'No Phone'}</span>
                                        </div>
                                        <a href={`tel:${m.phone_number}`} className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-semibold text-[10px] hover:bg-red-500/30 transition">Call Now</a>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-xs py-2 col-span-2">All regular members attended today!</p>
                            )}
                        </div>
                    </details>

                    <details className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-slate-300">
                            <span className="flex items-center gap-2">
                                <UserX className="w-4 h-4 text-slate-400" /> All Absentees ({dailyAbsentees.length})
                            </span>
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-800 text-xs max-h-60 overflow-y-auto">
                            {dailyAbsentees.map((m: any) => (
                                <div key={m.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                                    <span className="font-semibold text-slate-300">{m.first_name} {m.last_name}</span>
                                    <span className="text-[10px] text-slate-500">{m.phone_number || 'Nil'}</span>
                                </div>
                            ))}
                        </div>
                    </details>

                    <details className="group rounded-2xl border border-amber-500/30 bg-slate-950/60 p-4">
                        <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-amber-400">
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-amber-400" /> Visitors Logged Today ({dailyAttendedGuests.length})
                            </span>
                            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-800 text-xs">
                            {dailyAttendedGuests.length > 0 ? (
                                dailyAttendedGuests.map((g: any) => (
                                    <div key={g.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold text-amber-300 block">{g.full_name}</span>
                                            <span className="text-[10px] text-slate-400">{g.phone_number}</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Visits: {g.attendance_count || 1}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-xs py-2 col-span-2">No new visitors logged on this date.</p>
                            )}
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}