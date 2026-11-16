'use client';

import React from 'react';
import { Layers, BarChart3, Award } from 'lucide-react';
import { YearlyMetrics } from '@/lib/analytics/admin/engine';

interface YearlyViewProps {
    yearlyMetrics: YearlyMetrics;
}

export default function YearlyView({ yearlyMetrics }: YearlyViewProps) {
    return (
        <div className="space-y-6">
            <details className="group rounded-3xl border border-slate-700 bg-slate-900/90 shadow-2xl overflow-hidden" open>
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none bg-slate-900 hover:bg-slate-850 transition border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/30">
                            Fiscal Year
                        </span>
                        <div>
                            <h2 className="text-xl font-extrabold text-white">{yearlyMetrics.yearTitle}</h2>
                            <p className="text-xs text-slate-400">Complete Annual Fiscal Rollup</p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼ Click to collapse/expand</span>
                </summary>

                <div className="p-6 space-y-8">
                    {/* Section A: Condensed Quarterly Cards */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4 text-amber-400" /> Section A: Condensed Quarterly Summary Cards
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {yearlyMetrics.quarterlyCards.map(q => (
                                <div key={q.quarterKey} className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-3 shadow-xl">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-emerald-400 uppercase">{q.quarterTitle}</h4>
                                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded uppercase">{q.status}</span>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-slate-300">
                                        <div className="flex justify-between"><span>Avg Attendance:</span> <strong className="text-white">{q.averageAttendanceRateQuarter}%</strong></div>
                                        <div className="flex justify-between"><span>Unique Visitors:</span> <strong className="text-blue-400">{q.uniqueVisitorsQuarter}</strong></div>
                                        <div className="flex justify-between"><span>New Members:</span> <strong className="text-white">{q.totalNewMembersQuarter}</strong></div>
                                        <div className="flex justify-between"><span>Growth:</span> <strong className="text-emerald-400">+{q.quarterGrowthRate}%</strong></div>
                                    </div>
                                </div>
                            ))}
                            {['Q2: Dec-Feb', 'Q3: Mar-May', 'Q4: Jun-Aug'].map(q => (
                                <div key={q} className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6 space-y-3 shadow-xl opacity-60">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase">{q}</h4>
                                    <p className="text-xs text-slate-500 italic pt-2">No Data Recorded / Future Quarter</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section B: Comprehensive Yearly Analytics */}
                    <div className="rounded-3xl border border-emerald-500/30 bg-slate-950 p-8 shadow-2xl space-y-6">
                        <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" /> Section B: Comprehensive Yearly Analytics & Member Awards
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                <span className="text-slate-400">Yearly Growth Rate</span>
                                <div className="text-2xl font-extrabold text-emerald-400 mt-1">+{yearlyMetrics.yearlyGrowthRate}% <span className="text-xs font-normal text-slate-400">({yearlyMetrics.membersStartOfYear} → {yearlyMetrics.membersEndOfYear})</span></div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                <span className="text-slate-400">Annual Visitor Conversion</span>
                                <div className="text-2xl font-extrabold text-amber-400 mt-1">{yearlyMetrics.yearlyVisitorConversion}%</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                <span className="text-slate-400">Turnover Rate</span>
                                <div className="text-2xl font-extrabold text-red-400 mt-1">{yearlyMetrics.turnoverRate}%</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs text-slate-300">
                            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                                <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-400" /> Annual Highlights & Milestones
                                </h4>
                                <div className="flex justify-between"><span>Best Month in Year:</span> <strong className="text-white">{yearlyMetrics.bestMonthInYear}</strong></div>
                                <div className="flex justify-between"><span>Best Sunday in Year:</span> <strong className="text-white">{yearlyMetrics.bestSundayInYear.label} ({yearlyMetrics.bestSundayInYear.count} present)</strong></div>
                                <div className="flex justify-between"><span>Repeat Visitor Rate (Year):</span> <strong className="text-purple-400">{yearlyMetrics.repeatVisitorRateYear}%</strong></div>
                                <div className="flex justify-between"><span>At-Risk Members Count:</span> <strong className="text-red-400">{yearlyMetrics.atRiskYearlyMembers.length} members</strong></div>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                                <h4 className="font-bold text-white uppercase tracking-wider">YoY Performance Verdict</h4>
                                <p className="text-slate-300 leading-relaxed">{yearlyMetrics.yoyComparison.verdict}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
}