'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, XCircle, Award, Clock, AlertCircle } from 'lucide-react';

interface AttendanceRecord {
    id: string;
    user_id: string;
    session_date: string;
    checked_in_at?: string;
}

interface MemberAnalyticsProps {
    attendanceHistory: AttendanceRecord[];
    profileCreatedAt?: string;
}

export default function MemberAnalytics({ attendanceHistory, profileCreatedAt }: MemberAnalyticsProps) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth(); // 0-11
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Compute all Sundays for the selected Year & Month
    const sundayDatesInMonth = useMemo(() => {
        const sundays: string[] = [];
        const date = new Date(selectedYear, selectedMonth, 1);

        while (date.getMonth() === selectedMonth) {
            if (date.getDay() === 0) { // Sunday
                const yearStr = date.getFullYear();
                const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                const dayStr = String(date.getDate()).padStart(2, '0');
                sundays.push(`${yearStr}-${monthStr}-${dayStr}`);
            }
            date.setDate(date.getDate() + 1);
        }
        return sundays;
    }, [selectedYear, selectedMonth]);

    // Map checked-in status for calculated Sundays
    const attendedDatesSet = useMemo(() => {
        return new Set(attendanceHistory.map((att) => att.session_date));
    }, [attendanceHistory]);

    // Check if selected month is before profile creation or before app launch
    const isBeforeMembership = useMemo(() => {
        if (!profileCreatedAt) return false;
        const profileDate = new Date(profileCreatedAt);
        const selectedMonthFirstDay = new Date(selectedYear, selectedMonth, 1);
        return selectedMonthFirstDay < new Date(profileDate.getFullYear(), profileDate.getMonth(), 1);
    }, [profileCreatedAt, selectedYear, selectedMonth]);

    const attendedCountInMonth = useMemo(() => {
        if (isBeforeMembership) return 0;
        return sundayDatesInMonth.filter((sDate) => attendedDatesSet.has(sDate)).length;
    }, [sundayDatesInMonth, attendedDatesSet, isBeforeMembership]);

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-400" /> Attendance Analytics
                    </h3>
                    <p className="text-xs text-slate-400">Review your Sunday School engagement history</p>
                </div>

                {/* Multi-Year and Month Selection Dropdowns */}
                <div className="flex items-center gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                        {monthNames.map((name, idx) => (
                            <option key={name} value={idx}>{name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                        <option value={2028}>2028</option>
                    </select>
                </div>
            </div>

            {/* Scorecard Metric Banner */}
            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Attendance Rate</span>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                        {isBeforeMembership ? 'N/A' : `${attendedCountInMonth} / ${sundayDatesInMonth.length}`}
                    </p>
                    <span className="text-[10px] text-slate-400">Sundays Attended</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Lifetime Visits</span>
                    <p className="text-2xl font-extrabold text-amber-400 mt-1">
                        {attendanceHistory.length}
                    </p>
                    <span className="text-[10px] text-slate-400">Total Services Logged</span>
                </div>
            </div>

            {/* Sunday Service Log Cards Grid */}
            <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">
                    Services Breakdown for {monthNames[selectedMonth]} {selectedYear}
                </span>

                {isBeforeMembership ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
                        <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400">No records available prior to your account creation date.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {sundayDatesInMonth.map((sundayDate) => {
                            const isAttended = attendedDatesSet.has(sundayDate);
                            const sundayObj = new Date(sundayDate);
                            const isFuture = sundayObj > todayDateOnly;
                            const isToday = sundayObj.getTime() === todayDateOnly.getTime();

                            let cardStyle = 'border-slate-800 bg-slate-950 text-slate-400';
                            let statusBadge = (
                                <span className="flex items-center gap-1 text-slate-500">
                                    <Clock className="w-4 h-4" /> Upcoming
                                </span>
                            );

                            if (isAttended) {
                                cardStyle = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
                                statusBadge = (
                                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4" /> Present
                                    </span>
                                );
                            } else if (isToday) {
                                cardStyle = 'border-amber-500/30 bg-amber-500/10 text-amber-300';
                                statusBadge = (
                                    <span className="flex items-center gap-1 font-bold text-amber-400">
                                        <Clock className="w-4 h-4" /> Ongoing Today
                                    </span>
                                );
                            } else if (isFuture) {
                                cardStyle = 'border-slate-800 bg-slate-950 text-slate-400';
                                statusBadge = (
                                    <span className="flex items-center gap-1 text-slate-500">
                                        <Calendar className="w-4 h-4" /> Upcoming
                                    </span>
                                );
                            } else {
                                cardStyle = 'border-red-500/30 bg-red-500/10 text-red-400';
                                statusBadge = (
                                    <span className="flex items-center gap-1 text-red-400">
                                        <XCircle className="w-4 h-4" /> Absent
                                    </span>
                                );
                            }

                            return (
                                <div
                                    key={sundayDate}
                                    className={`rounded-xl border p-3 flex items-center justify-between text-xs transition ${cardStyle}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>
                                            {sundayObj.toLocaleDateString(undefined, {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    {statusBadge}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}