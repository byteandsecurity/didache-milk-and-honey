'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ALLOW_ANYDAY_TESTING = true; // Toggle this to false later when returning to Sundays-only

export default function QrGenerator() {
    const [selectedSessionDate, setSelectedSessionDate] = useState('');
    const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
    const [qrExpiryTime, setQrExpiryTime] = useState<number | null>(null);
    const [qrGenCount, setQrGenCount] = useState<number>(0);
    const [qrErrorMsg, setQrErrorMsg] = useState<string | null>(null);

    // Live countdown state
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const savedDate = localStorage.getItem('didache_qr_date');
        const savedQr = localStorage.getItem('didache_qr_code');
        const savedExpiry = localStorage.getItem('didache_qr_expiry');
        const savedCount = localStorage.getItem('didache_qr_count');
        const todayStr = new Date().toISOString().split('T')[0];

        setSelectedSessionDate(savedDate || todayStr);
        if (savedQr) setActiveQrCode(savedQr);
        if (savedExpiry) setQrExpiryTime(parseInt(savedExpiry, 10));
        if (savedCount) setQrGenCount(parseInt(savedCount, 10));
    }, []);

    // Live Countdown Timer Effect
    useEffect(() => {
        if (!qrExpiryTime) return;

        const updateTimer = () => {
            const remaining = qrExpiryTime - Date.now(); // Fixed math operator
            if (remaining <= 0) {
                setTimeLeft(0);
            } else {
                setTimeLeft(remaining);
            }
        };

        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [qrExpiryTime]);

    const handleGenerateQr = async (dateStr: string) => {
        setQrErrorMsg(null);
        const targetDate = new Date(dateStr);

        // If testing flag is false, block non-Sundays (Day 0 = Sunday)
        if (!ALLOW_ANYDAY_TESTING && targetDate.getDay() !== 0) {
            setQrErrorMsg('QR Codes can only be generated for Sunday sessions.');
            return;
        }

        // Automatically upsert session in Supabase so it's always ready for check-ins
        const { error: sessionError } = await supabase
            .from('sessions')
            .upsert([
                {
                    session_date: dateStr,
                    title: `Service Session (${dateStr})`,
                    is_active: true
                }
            ], { onConflict: 'session_date' });

        if (sessionError) {
            console.error('Session auto-creation error:', sessionError);
        }

        const qrUrl = `https://didache-milk-and-honey.vercel.app/checking?date=${dateStr}`;
        const expiryTimestamp = Date.now() + (60 * 60 * 1000); // Fixed math operators (1 Hour)
        const newCount = qrGenCount + 1;

        setActiveQrCode(qrUrl);
        setSelectedSessionDate(dateStr);
        setQrExpiryTime(expiryTimestamp);
        setQrGenCount(newCount);

        localStorage.setItem('didache_qr_code', qrUrl);
        localStorage.setItem('didache_qr_date', dateStr);
        localStorage.setItem('didache_qr_expiry', expiryTimestamp.toString());
        localStorage.setItem('didache_qr_count', newCount.toString());
    };

    // Format milliseconds into MM:SS
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const isExpired = timeLeft !== null && timeLeft <= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-400" /> Session QR Generator {ALLOW_ANYDAY_TESTING && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md">Testing Mode Active</span>}
                </h2>
                <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Select Session Date</label>
                    <input
                        type="date"
                        value={selectedSessionDate}
                        onChange={(e) => setSelectedSessionDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none font-semibold focus:outline-none w-full [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    />
                </div>

                {qrErrorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                        {qrErrorMsg}
                    </div>
                )}

                <button
                    onClick={() => handleGenerateQr(selectedSessionDate)}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white shadow transition"
                >
                    Generate Active Session QR ({3 - qrGenCount >= 0 ? 3 - qrGenCount : 0} left today)
                </button>
            </div>

            <div className="md:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-3">
                {activeQrCode ? (
                    isExpired ? (
                        <div className="p-6 rounded-2xl bg-slate-950 border border-red-500/30 text-red-400 text-xs space-y-1">
                            <Clock className="w-8 h-8 mx-auto text-red-400 animate-pulse" />
                            <p className="font-bold">QR Code Expired</p>
                            <p className="text-[11px] text-slate-400">Generations expire 60 mins post-creation.</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-white rounded-2xl shadow-2xl space-y-2">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeQrCode)}`} alt="QR" className="w-40 h-40 mx-auto" />
                            <p className="text-[11px] text-slate-900 font-bold">{selectedSessionDate}</p>

                            {/* Live Countdown Badge */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-extrabold">
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                                <span>Expires in: {timeLeft !== null ? formatTime(timeLeft) : '60:00'}</span>
                            </div>
                        </div>
                    )
                ) : (
                    <p className="text-xs text-slate-500">Click generate to view active QR code</p>
                )}
            </div>
        </div>
    );
}