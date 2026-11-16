'use client';

import React from 'react';
import { Layers, BarChart3 } from 'lucide-react';
import { QuarterlyMetrics } from '@/lib/analytics/admin/engine';

interface QuarterlyViewProps {
    q1Metrics: QuarterlyMetrics;
    isTestingMode: boolean;
}

export default function QuarterlyView({ q1Metrics, isTestingMode }: QuarterlyViewProps) {
    return (
        <div className="space-y-6">
            <details className="group rounded-3xl border border-slate-700 bg-slate-900/90 shadow-2xl overflow-hidden" open>
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none bg-slate-900 hover:bg-slate-850 transition border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/30">
                            Active Session
                        </span>
                        <div>
                            <h2 className="text-lg font-extrabold text-white">Year 2026–2027 (Quarterly Rollups)</h2>
                            <p className="text-xs text-slate-400">Fiscal Rollups & Quarterly Performance</p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼ Click to collapse/expand</span>
                </summary>

                <div className="p-6 space-y-8">
                    <details className="group rounded-3xl border border-emerald-500/40 bg-slate-900/90 shadow-xl overflow-hidden" open>
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none bg-slate-900/80 hover:bg-slate-900 transition">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">
                                    {isTestingMode ? 'Testing / Active' : q1Metrics.status}
                                </span>
                                <div>
                                    <h3 className="text-xl font-extrabold text-white">{q1Metrics.quarterTitle}</h3>
                                    <p className="text-xs text-slate-400">September – November Rollup</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼ Click to collapse/expand</span>
                        </summary>

                        <div className="p-6 space-y-8 border-t border-slate-800">
                            {/* Section A: Monthly Summary Cards */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-amber-400" /> Section A: Condensed Monthly Summary Cards
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {q1Metrics.monthlyCards.map(m => (
                                        <div key={m.monthKey} className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-4 shadow-xl">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                                <h5 className="text-sm font-bold text-white">{m.monthTitle}</h5>
                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">{m.status}</span>
                                            </div>
                                            <div className="space-y-2 text-xs text-slate-300">
                                                <div className="flex justify-between"><span>Avg Attendance Rate:</span> <strong className="text-emerald-400">{m.averageAttendanceRate}%</strong></div>
                                                <div className="flex justify-between"><span>Avg Present:</span> <strong className="text-white">{m.averagePresent} members</strong></div>
                                                <div className="flex justify-between"><span>Total Visitors:</span> <strong className="text-blue-400">{m.totalVisitorVisits} visits ({m.uniqueVisitors} unique)</strong></div>
                                                <div className="flex justify-between"><span>New Members:</span> <strong className="text-white">{m.totalNewMembers}</strong></div>
                                                <div className="flex justify-between"><span>Growth:</span> <strong className="text-emerald-400">+{m.monthlyGrowthRate}%</strong></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section B: Deep Analytics */}
                            <div className="rounded-3xl border border-emerald-500/30 bg-slate-950 p-8 shadow-2xl space-y-6">
                                <h4 className="text-lg font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" /> Section B: Comprehensive Quarterly Analytics & Deep Dive
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                        <span className="text-slate-400">Quarter Growth Rate</span>
                                        <div className="text-xl font-bold text-emerald-400 mt-1">+{q1Metrics.quarterGrowthRate}%</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                        <span className="text-slate-400">Quarter Visitor Conversion</span>
                                        <div className="text-xl font-bold text-amber-400 mt-1">{q1Metrics.quarterVisitorConversion}%</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                        <span className="text-slate-400">Unique Visitors</span>
                                        <div className="text-xl font-bold text-blue-400 mt-1">{q1Metrics.uniqueVisitorsQuarter} people</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                        <span className="text-slate-400">Repeat Visitor Rate</span>
                                        <div className="text-xl font-bold text-purple-400 mt-1">{q1Metrics.repeatVisitorRateQuarter}%</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
                                        <h5 className="font-bold text-white uppercase tracking-wider mb-2">Service Performance Highlights</h5>
                                        <div className="flex justify-between"><span>Best Sunday in Quarter:</span> <strong className="text-white">{q1Metrics.bestSundayInQuarter.label} ({q1Metrics.bestSundayInQuarter.count} present)</strong></div>
                                        <div className="flex justify-between"><span>Worst Sunday in Quarter:</span> <strong className="text-white">{q1Metrics.worstSundayInQuarter.label} ({q1Metrics.worstSundayInQuarter.count} present)</strong></div>
                                        <div className="flex justify-between"><span>Best Month by Rate:</span> <strong className="text-emerald-400">{q1Metrics.bestMonthByRate.label} ({q1Metrics.bestMonthByRate.rate}%)</strong></div>
                                        <div className="flex justify-between"><span>Quarterly Retention:</span> <strong className="text-emerald-400">{q1Metrics.retentionQuarter}%</strong></div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
                                        <h5 className="font-bold text-white uppercase tracking-wider mb-2">Quarterly Verdict</h5>
                                        <p className="text-slate-300 leading-relaxed">{q1Metrics.qoqComparison.verdict}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            </details>
        </div>
    );
}