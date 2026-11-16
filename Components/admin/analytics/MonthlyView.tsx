'use client';

import React from 'react';
import { Layers, BarChart3, Award, Users } from 'lucide-react';
import { MonthlyMetrics } from '@/lib/analytics/admin/engine';
import { DailyCardItem } from './DailyView';

interface MonthlyViewProps {
    novemberMetrics: MonthlyMetrics;
    isTestingMode: boolean;
}

export default function MonthlyView({ novemberMetrics, isTestingMode }: MonthlyViewProps) {
    return (
        <div className="space-y-6">
            {/* Year Session Accordion Card */}
            <details className="group rounded-3xl border border-slate-700 bg-slate-900/90 shadow-2xl overflow-hidden" open>
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none bg-slate-900 hover:bg-slate-850 transition border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/30">
                            Active Session
                        </span>
                        <div>
                            <h2 className="text-lg font-extrabold text-white">Year 2026–2027 (Redeem Session)</h2>
                            <p className="text-xs text-slate-400">September 2026 – August 2027</p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼ Click to collapse/expand</span>
                </summary>

                <div className="p-6 space-y-6">
                    {/* Quarter Accordion Card */}
                    <details className="group rounded-3xl border border-emerald-500/40 bg-slate-900/90 shadow-xl overflow-hidden" open>
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none bg-slate-900/80 hover:bg-slate-900 transition">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">
                                    Q1 Active
                                </span>
                                <div>
                                    <h3 className="text-base font-extrabold text-white">Quarter 1: Sept – Nov 2026</h3>
                                    <p className="text-xs text-slate-400">September, October, November Rollup</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼ Click to collapse/expand</span>
                        </summary>

                        <div className="p-6 space-y-8 border-t border-slate-800">

                            {/* Past Months (Sept & Oct) Summary Card */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-white uppercase">September 2026</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Visitors Logged</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Visitor data recorded successfully. No member attendance tracked (pre-launch period).</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-white uppercase">October 2026</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Visitors Logged</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Visitor data recorded successfully. Transitioning to active member rollups.</p>
                                </div>
                            </div>

                            {/* Current Active Month: November 2026 */}
                            <details className="group rounded-3xl border border-emerald-500/40 bg-slate-950 shadow-xl overflow-hidden" open>
                                <summary className="flex items-center justify-between p-6 cursor-pointer list-none bg-slate-900/80 hover:bg-slate-900 transition">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">
                                            {isTestingMode ? 'Testing / Ongoing' : novemberMetrics.status}
                                        </span>
                                        <div>
                                            <h4 className="text-lg font-extrabold text-white">{novemberMetrics.monthTitle}</h4>
                                            <p className="text-xs text-slate-400">{novemberMetrics.sundayCount} Scheduled Services</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼ Click to collapse/expand</span>
                                </summary>

                                <div className="p-6 space-y-8 border-t border-slate-800">
                                    {/* Section A: Daily Cards */}
                                    <div className="space-y-4">
                                        <h5 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-amber-400" /> Section A: Daily Service Cards
                                        </h5>
                                        {novemberMetrics.dailyCards.map((card, idx, arr) => (
                                            <DailyCardItem key={card.date} card={card} defaultOpen={idx === arr.length - 1} />
                                        ))}
                                    </div>

                                    {/* Section B: Monthly Analytics Deep Dive */}
                                    <div className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-8 space-y-6">
                                        <h5 className="text-lg font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                                            <BarChart3 className="w-5 h-5" /> Section B: Monthly Analytics & Visitor Deep Dive
                                        </h5>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                                <span className="text-slate-400">Total Members (Start → End)</span>
                                                <div className="text-xl font-bold text-white mt-1">
                                                    {novemberMetrics.totalMembersStart} → {novemberMetrics.totalMembersEnd}{' '}
                                                    <span className="text-emerald-400 text-xs font-normal">(+{novemberMetrics.monthlyGrowthRate}%)</span>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                                <span className="text-slate-400">Average Attendance Rate</span>
                                                <div className="text-xl font-bold text-amber-400 mt-1">{novemberMetrics.averageAttendanceRate}%</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                                <span className="text-slate-400">Unique Visitors / Total Visits</span>
                                                <div className="text-xl font-bold text-blue-400 mt-1">{novemberMetrics.uniqueVisitors} Unique / {novemberMetrics.totalVisitorVisits} Visits</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                                <span className="text-slate-400">Repeat Visitor Rate</span>
                                                <div className="text-xl font-bold text-emerald-400 mt-1">{novemberMetrics.repeatRate}% <span className="text-slate-400 text-xs">({novemberMetrics.repeatVisitorsCount} visitors)</span></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                                                <h6 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                    <Award className="w-4 h-4 text-amber-400" /> Best & Worst Services
                                                </h6>
                                                <div className="space-y-2 text-xs text-slate-300">
                                                    <div className="flex justify-between"><span>Best by Count:</span> <strong className="text-white">{novemberMetrics.bestSundayByCount.label} ({novemberMetrics.bestSundayByCount.count} present)</strong></div>
                                                    <div className="flex justify-between"><span>Worst by Count:</span> <strong className="text-white">{novemberMetrics.worstSundayByCount.label} ({novemberMetrics.worstSundayByCount.count} present)</strong></div>
                                                    <div className="flex justify-between"><span>Best by Rate:</span> <strong className="text-white">{novemberMetrics.bestSundayByRate.label} ({novemberMetrics.bestSundayByRate.rate}%)</strong></div>
                                                    <div className="flex justify-between"><span>Worst by Rate:</span> <strong className="text-white">{novemberMetrics.worstSundayByRate.label} ({novemberMetrics.worstSundayByRate.rate}%)</strong></div>
                                                </div>
                                            </div>

                                            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                                                <h6 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-emerald-400" /> Member Consistency & Pastoral Care
                                                </h6>
                                                <div className="space-y-2 text-xs text-slate-300">
                                                    <div className="flex justify-between"><span>Retention (Attended ≥3 Sundays):</span> <strong className="text-emerald-400">{novemberMetrics.retentionRate3PlusSundays}%</strong></div>
                                                    <div className="flex justify-between"><span>Highly Consistent (All Sundays):</span> <strong className="text-white">{novemberMetrics.highlyConsistentCount} members</strong></div>
                                                    <div className="flex justify-between"><span>At Risk (0 appearances):</span> <strong className="text-red-400">{novemberMetrics.atRiskZeroAttendanceCount} members</strong></div>
                                                    <div className="flex justify-between"><span>Slipping (1 appearance):</span> <strong className="text-amber-400">{novemberMetrics.slippingOneAttendanceCount} members</strong></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </details>
                </div>
            </details>
        </div>
    );
}