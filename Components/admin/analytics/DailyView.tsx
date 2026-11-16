'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateLabel, DailyMetrics } from '@/lib/analytics/admin/engine';

interface DailyViewProps {
    dailyCards: DailyMetrics[];
}

export default function DailyView({ dailyCards }: DailyViewProps) {
    // Pick strictly the most recent Sunday or today's active card
    const mostRecentCard = dailyCards[dailyCards.length - 1];

    if (!mostRecentCard) {
        return <div className="text-slate-400 text-xs py-4">No recent daily service record found.</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" /> Latest Sunday Service Record
            </h2>
            <DailyCardItem card={mostRecentCard} defaultOpen={true} />
        </div>
    );
}

// Reusable Daily Card Item
export function DailyCardItem({ card, defaultOpen = false }: { card: DailyMetrics; defaultOpen?: boolean }) {
    const [expanded, setExpanded] = useState(defaultOpen);
    const [showRoster, setShowRoster] = useState(false);

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5 transition hover:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{formatDateLabel(card.date)}</span>
                    <h3 className="text-lg font-extrabold text-white">Sunday Service Record</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        card.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            card.status === 'Ongoing' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' :
                                'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                        {card.status}
                    </span>
                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-xl">
                        Total In Room: <strong className="text-white">{card.totalInRoom}</strong>
                    </span>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg transition"
                    >
                        {expanded ? 'Collapse ▲' : 'Expand ▼'}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="space-y-5 animate-in fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Total Members</span>
                            <div className="text-xl font-extrabold text-white mt-1">{card.totalMembers}</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Members Present</span>
                            <div className="text-xl font-extrabold text-emerald-400 mt-1">{card.present}</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Member Absentees</span>
                            <div className="text-xl font-extrabold text-red-400 mt-1">{card.absent}</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Visitors Present</span>
                            <div className="text-xl font-extrabold text-blue-400 mt-1">{card.visitors}</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">New Members</span>
                            <div className="text-xl font-extrabold text-amber-400 mt-1">{card.newMembers}</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">First Timers</span>
                            <div className="text-xl font-extrabold text-purple-400 mt-1">{card.firstTimers}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                        <div>Attendance Rate: <strong className="text-white block">{card.attendanceRate}%</strong></div>
                        <div>Absence Rate: <strong className="text-white block">{card.absenceRate}%</strong></div>
                        <div>Visitor Rate: <strong className="text-white block">{card.visitorRate}%</strong></div>
                        <div>New Member Rate: <strong className="text-white block">{card.newMemberRate}%</strong></div>
                        <div>Visitor Conversion: <strong className="text-white block">{card.visitorConversion}%</strong></div>
                        <div>First Timer Rate: <strong className="text-white block">{card.firstTimerRate}%</strong></div>
                    </div>
                </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <button
                    onClick={() => setShowRoster(!showRoster)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                >
                    {showRoster ? 'Hide Roster Details ▲' : 'Tap to open full list of who came, who missed, who visited ▼'}
                </button>
            </div>

            {showRoster && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs animate-in fade-in">
                    <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20">
                        <h5 className="font-bold text-emerald-400 mb-2">Present Members ({card.attendeesList.length})</h5>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {card.attendeesList.map(m => (
                                <div key={m.id} className="text-slate-300">{m.first_name} {m.last_name}</div>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-red-500/20">
                        <h5 className="font-bold text-red-400 mb-2">Absent Members ({card.absenteesList.length})</h5>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {card.absenteesList.map(m => (
                                <div key={m.id} className="text-slate-400">{m.first_name} {m.last_name}</div>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/20">
                        <h5 className="font-bold text-blue-400 mb-2">Visitors Today ({card.visitorsList.length})</h5>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {card.visitorsList.map(g => (
                                <div key={g.id} className="text-slate-300">{g.guest_name}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}