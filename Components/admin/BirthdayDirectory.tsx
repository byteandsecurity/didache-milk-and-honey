'use client';

import React, { useMemo } from 'react';
import { Cake, Calendar, ChevronDown, Gift, Sparkles, PartyPopper } from 'lucide-react';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    date_of_birth?: string | null;
    gender?: string;
}

interface BirthdayDirectoryProps {
    members: Member[];
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_THEMES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    January: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: '❄️ Winter Glow' },
    February: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', badge: '💖 Love & Praise' },
    March: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: '🌱 Spring Bloom' },
    April: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', badge: '✝️ Resurrection Season' },
    May: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: '🌼 Sunshine Grace' },
    June: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', badge: '☀️ Summer Joy' },
    July: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: '🌊 Freedom Celebration' },
    August: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: '🌾 Harvest Blessings' },
    September: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: '📚 New Academic Year' },
    October: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: '🍂 Autumn Thanksgiving' },
    November: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', badge: '🦃 Gratitude Month' },
    December: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: '🎄 Christmas & Victory' },
};

export default function BirthdayDirectory({ members }: BirthdayDirectoryProps) {
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-indexed (Nov = 10)
    const currentDay = today.getDate();
    const currentMonthName = MONTH_NAMES[currentMonthIndex];

    // Helper: Parse DOB string safely handling YYYY-MM-DD or MM-DD or 1900-MM-DD
    const parseDOB = (dobStr?: string | null) => {
        if (!dobStr) return null;
        if (dobStr.includes('-')) {
            const parts = dobStr.split('-');
            if (parts.length === 3) {
                const yr = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                return { monthIndex: m, day: d, year: yr > 1905 ? yr : null };
            } else if (parts.length === 2) {
                // MM-DD format (year omitted)
                const m = parseInt(parts[0], 10) - 1;
                const d = parseInt(parts[1], 10);
                return { monthIndex: m, day: d, year: null };
            }
        }
        return null;
    };

    const getCountdownText = (day: number) => {
        const diff = day - currentDay;
        if (diff === 0) return { label: '🎉 Today!', color: 'bg-emerald-500 text-slate-950 font-black animate-pulse' };
        if (diff === 1) return { label: '⏳ Tomorrow!', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' };
        if (diff > 1) return { label: `⏳ ${diff} days to go`, color: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' };
        return { label: `Passed on Nov ${day}`, color: 'bg-slate-800 text-slate-500' };
    };

    const monthlyBirthdays = useMemo(() => {
        const groups: Record<string, any[]> = {};
        MONTH_NAMES.forEach((m) => { groups[m] = []; });

        members.forEach((m) => {
            const parsed = parseDOB(m.date_of_birth);
            if (parsed && parsed.monthIndex >= 0 && parsed.monthIndex < 12) {
                const monthName = MONTH_NAMES[parsed.monthIndex];
                groups[monthName].push({
                    ...m,
                    dobDay: parsed.day,
                    dobYear: parsed.year,
                });
            }
        });

        MONTH_NAMES.forEach((m) => {
            groups[m].sort((a, b) => a.dobDay - b.dobDay);
        });

        return groups;
    }, [members]);

    const activeMonthMembers = monthlyBirthdays[currentMonthName] || [];

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Cake className="w-5 h-5 text-rose-400" /> Member Birthday Directory
                    </h2>
                    <p className="text-xs text-slate-400">
                        Pastoral care tracker for member celebrations and upcoming birthday anniversaries.
                    </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Current Month: <strong className="text-white">{currentMonthName} {today.getFullYear()}</strong></span>
                </div>
            </div>

            {/* COLLAPSIBLE SPOTLIGHT HERO: Active Month Celebrations with Countdowns */}
            <details open className="group rounded-3xl border border-rose-500/30 bg-linear-to-r from-rose-950/40 via-slate-900 to-slate-900/90 shadow-2xl overflow-hidden transition">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none select-none border-b border-rose-500/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                            <PartyPopper className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                Spotlight: {currentMonthName} Celebrations
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    {activeMonthMembers.length} Celebrants
                                </span>
                            </h3>
                            <p className="text-[11px] text-slate-400">Tap to toggle view of this active month's countdowns</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                        <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
                    </div>
                </summary>

                <div className="p-6 space-y-4">
                    {activeMonthMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {activeMonthMembers.map((m) => {
                                const countdown = getCountdownText(m.dobDay);
                                return (
                                    <div key={m.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 flex flex-col justify-between shadow">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-bold text-white text-xs sm:text-sm">{m.first_name} {m.last_name}</h4>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {m.phone_number || 'No phone'}
                                                </p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${countdown.color}`}>
                                                {countdown.label}
                                            </span>
                                        </div>

                                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400 flex items-center gap-1">
                                                <Gift className="w-3.5 h-3.5 text-rose-400" />
                                                {currentMonthName} {m.dobDay}{m.dobYear ? `, ${m.dobYear}` : ''}
                                            </span>
                                            {m.gender && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {m.gender}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                            No member birthdays recorded for {currentMonthName} yet.
                        </div>
                    )}
                </div>
            </details>

            {/* ALL 12 MONTH ACCORDIONS (JANUARY TO DECEMBER) */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
                    All Months Breakdown (Jan – Dec)
                </h3>

                {/* items-start prevents neighboring month card from stretching vertically when expanded */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    {MONTH_NAMES.map((month) => {
                        const theme = MONTH_THEMES[month] || MONTH_THEMES['January'];
                        const monthMembers = monthlyBirthdays[month] || [];
                        const isCurrent = month === currentMonthName;

                        return (
                            <details
                                key={month}
                                className={`group rounded-2xl border ${isCurrent ? 'border-rose-500/50 bg-slate-900/90' : 'border-slate-800 bg-slate-900/50'} overflow-hidden transition`}
                                open={isCurrent}
                            >
                                <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${theme.bg} ${theme.border} border ${theme.text} font-bold text-xs`}>
                                            {month.substring(0, 3)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-white">{month}</h4>
                                                {isCurrent && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400">{theme.badge}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-300">
                                            {monthMembers.length} {monthMembers.length === 1 ? 'Birthday' : 'Birthdays'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
                                    </div>
                                </summary>

                                <div className="p-4 pt-0 border-t border-slate-800/60 bg-slate-950/40 space-y-2">
                                    {monthMembers.length > 0 ? (
                                        <div className="divide-y divide-slate-800/60 text-xs">
                                            {monthMembers.map((m) => (
                                                <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                                                    <div>
                                                        <span className="font-semibold text-white">{m.first_name} {m.last_name}</span>
                                                        <div className="text-[10px] text-slate-400">{m.phone_number || 'No phone'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`font-extrabold text-xs ${theme.text}`}>
                                                            {month} {m.dobDay}
                                                        </span>
                                                        {m.dobYear ? (
                                                            <span className="text-[10px] text-slate-500 block">Year: {m.dobYear}</span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-3 text-center text-[11px] text-slate-500 italic">
                                            No birthdays registered in {month}.
                                        </div>
                                    )}
                                </div>
                            </details>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}