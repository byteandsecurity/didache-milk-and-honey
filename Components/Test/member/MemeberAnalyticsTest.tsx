'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, XCircle, Award, Clock, Beaker, PlusCircle, AlertCircle, MinusCircle } from 'lucide-react';

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

export default function MemberAnalyticsTestable({ attendanceHistory, profileCreatedAt }: MemberAnalyticsProps) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);

    // TEST MODE STATE: Simulate any date as "today"
    const [simulatedToday, setSimulatedToday] = useState<string>(now.toISOString().split('T')[0]);

    // Local state to allow testing check-in interaction instantly without database roundtrips
    const [localAttendance, setLocalAttendance] = useState<AttendanceRecord[]>(attendanceHistory);

    // Sync if props change
    React.useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalAttendance(attendanceHistory);
    }, [attendanceHistory]);

    const todayDateOnly = useMemo(() => {
        return new Date(simulatedToday);
    }, [simulatedToday]);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Generate EVERY SINGLE DAY in the selected month for thorough testing
    const daysInMonthList = useMemo(() => {
        const days: string[] = [];
        const date = new Date(selectedYear, selectedMonth, 1);

        while (date.getMonth() === selectedMonth) {
            const yearStr = date.getFullYear();
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            days.push(`${yearStr}-${monthStr}-${dayStr}`);
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [selectedYear, selectedMonth]);

    const attendedDatesSet = useMemo(() => {
        return new Set(localAttendance.map((att) => att.session_date));
    }, [localAttendance]);

    // Check if selected month is entirely before profile creation
    const isMonthBeforeMembership = useMemo(() => {
        if (!profileCreatedAt) return false;
        const profileDate = new Date(profileCreatedAt);
        const selectedMonthLastDay = new Date(selectedYear, selectedMonth + 1, 0);
        return selectedMonthLastDay < new Date(profileDate.getFullYear(), profileDate.getMonth(), profileDate.getDate());
    }, [profileCreatedAt, selectedYear, selectedMonth]);

    const attendedCountInMonth = useMemo(() => {
        if (isMonthBeforeMembership) return 0;
        return daysInMonthList.filter((dDate) => {
            if (profileCreatedAt) {
                const dObj = new Date(dDate);
                const pObj = new Date(profileCreatedAt);
                const pDateOnly = new Date(pObj.getFullYear(), pObj.getMonth(), pObj.getDate());
                if (dObj < pDateOnly) return false;
            }
            return attendedDatesSet.has(dDate);
        }).length;
    }, [daysInMonthList, attendedDatesSet, isMonthBeforeMembership, profileCreatedAt]);

    // Handler to simulate checking in for the simulated today date
    const handleSimulateCheckIn = () => {
        if (attendedDatesSet.has(simulatedToday)) return;
        const newRecord: AttendanceRecord = {
            id: `test-simulated-${Date.now()}`,
            user_id: 'test-user',
            session_date: simulatedToday,
            checked_in_at: new Date().toISOString(),
        };
        setLocalAttendance([newRecord, ...localAttendance]);
    };

    return (
        <div className="space-y-4">
            {/* 🧪 Testing Control Toolbar */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold">
                    <Beaker className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Test Mode: Showing All Days of Month (Any-day testing enabled)</span>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[11px] text-amber-300">Simulate Today:</label>
                        <input
                            type="date"
                            value={simulatedToday}
                            onChange={(e) => setSimulatedToday(e.target.value)}
                            className="rounded-lg border border-amber-500/30 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                    </div>

                    <button
                        onClick={handleSimulateCheckIn}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950 transition cursor-pointer"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Check In Today</span>
                    </button>
                </div>
            </div>

            {/* Main Analytics Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-400" /> Attendance Test Analytics
                        </h3>
                        <p className="text-xs text-slate-400">Daily breakdown view for testing check-in states</p>
                    </div>

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

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Attendance Count</span>
                        <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                            {isMonthBeforeMembership ? 'N/A' : `${attendedCountInMonth} Days`}
                        </p>
                        <span className="text-[10px] text-slate-400">Checked-In Days</span>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Lifetime Logs</span>
                        <p className="text-2xl font-extrabold text-amber-400 mt-1">
                            {localAttendance.length}
                        </p>
                        <span className="text-[10px] text-slate-400">Total Check-Ins Recorded</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300">
                        Full Daily Breakdown for {monthNames[selectedMonth]} {selectedYear}
                    </span>

                    {isMonthBeforeMembership ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
                            <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                            <p className="text-xs text-slate-400">No records available prior to your account creation date.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 max-h-96 overflow-y-auto pr-1">
                            {daysInMonthList.map((dayDateStr) => {
                                const dayObj = new Date(dayDateStr);
                                const profileDateObj = profileCreatedAt ? new Date(profileCreatedAt) : null;
                                const profileDateOnly = profileDateObj ? new Date(profileDateObj.getFullYear(), profileDateObj.getMonth(), profileDateObj.getDate()) : null;

                                const isBeforeAccountCreation = profileDateOnly && dayObj < profileDateOnly;
                                const isAttended = attendedDatesSet.has(dayDateStr);
                                const isFuture = dayObj > todayDateOnly;
                                const isToday = dayObj.toDateString() === todayDateOnly.toDateString();

                                let cardStyle = 'border-slate-800 bg-slate-950 text-slate-400';
                                let statusBadge = null;

                                if (isBeforeAccountCreation) {
                                    cardStyle = 'border-slate-800/40 bg-slate-950/40 text-slate-600';
                                    statusBadge = (
                                        <span className="flex items-center gap-1 font-bold text-slate-600 text-[11px]">
                                            <MinusCircle className="w-3.5 h-3.5" /> -
                                        </span>
                                    );
                                } else if (isAttended) {
                                    cardStyle = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
                                    statusBadge = (
                                        <span className="flex items-center gap-1 font-bold text-emerald-400 text-[11px]">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Present ✓
                                        </span>
                                    );
                                } else if (isToday) {
                                    cardStyle = 'border-amber-500/30 bg-amber-500/10 text-amber-300';
                                    statusBadge = (
                                        <span className="flex items-center gap-1 font-bold text-amber-400 text-[11px]">
                                            <Clock className="w-3.5 h-3.5" /> Ongoing Today ⏳
                                        </span>
                                    );
                                } else if (isFuture) {
                                    cardStyle = 'border-slate-800 bg-slate-950 text-slate-400';
                                    statusBadge = (
                                        <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                                            <Calendar className="w-3.5 h-3.5" /> Upcoming
                                        </span>
                                    );
                                } else {
                                    cardStyle = 'border-red-500/30 bg-red-500/10 text-red-400';
                                    statusBadge = (
                                        <span className="flex items-center gap-1 text-red-400 text-[11px]">
                                            <XCircle className="w-3.5 h-3.5" /> Absent ✕
                                        </span>
                                    );
                                }

                                return (
                                    <div
                                        key={dayDateStr}
                                        className={`rounded-xl border p-2.5 flex items-center justify-between text-xs transition ${cardStyle}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>
                                                {dayObj.toLocaleDateString(undefined, {
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
        </div>
    );
}