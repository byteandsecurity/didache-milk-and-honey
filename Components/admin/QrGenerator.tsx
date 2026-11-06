'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Clock, RefreshCw, Printer, Download } from 'lucide-react';

const ALLOW_ANYDAY_TESTING = true; // Toggle this to false when returning to Sundays-only

export default function QrGenerator() {
    const [selectedSessionDate, setSelectedSessionDate] = useState('');
    const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
    const [qrExpiryTime, setQrExpiryTime] = useState<number | null>(null);
    const [qrGenCount, setQrGenCount] = useState<number>(0);
    const [qrErrorMsg, setQrErrorMsg] = useState<string | null>(null);

    // Live countdown state
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Soft-refresh / load state handler
    const loadStoredQrState = () => {
        const savedDate = localStorage.getItem('didache_qr_date');
        const savedQr = localStorage.getItem('didache_qr_code');
        const savedExpiry = localStorage.getItem('didache_qr_expiry');
        const savedCount = localStorage.getItem('didache_qr_count');
        const todayStr = new Date().toISOString().split('T')[0];

        setSelectedSessionDate(savedDate || todayStr);
        if (savedQr) setActiveQrCode(savedQr);
        if (savedExpiry) {
            const expiryNum = parseInt(savedExpiry, 10);
            setQrExpiryTime(expiryNum);
            // Check if already expired on load
            if (Date.now() >= expiryNum) {
                setTimeLeft(0);
            }
        }
        if (savedCount) setQrGenCount(parseInt(savedCount, 10));
    };

    useEffect(() => {
        loadStoredQrState();
    }, []);

    // Live Countdown Timer Effect with Soft-Refresh safety check
    useEffect(() => {
        if (!qrExpiryTime) return;

        const updateTimer = () => {
            const remaining = qrExpiryTime - Date.now();
            if (remaining <= 0) {
                setTimeLeft(0);
            } else {
                setTimeLeft(remaining);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [qrExpiryTime]);

    const handleGenerateQr = (dateStr: string) => {
        setQrErrorMsg(null);
        const targetDate = new Date(dateStr);

        // If testing flag is false, block non-Sundays (Day 0 = Sunday)
        if (!ALLOW_ANYDAY_TESTING && targetDate.getDay() !== 0) {
            setQrErrorMsg('QR Codes can only be generated for Sunday sessions (Testing mode is OFF).');
            return;
        }

        const qrUrl = `https://didache-milk-and-honey.vercel.app/checking?date=${dateStr}`;
        const expiryTimestamp = Date.now() + (60 * 60 * 1000); // 1 Hour Expiry
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

    const handleRefresh = () => {
        loadStoredQrState();
        setQrErrorMsg(null);
    };

    // Isolated QR-Only Print Handler
    const handlePrint = () => {
        if (!activeQrCode) return;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(activeQrCode)}`;

        const printWindow = window.open('', '_blank', 'width=450,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Sunday QR - ${selectedSessionDate}</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                text-align: center;
                                padding: 40px;
                                background: #fff;
                                color: #000;
                            }
                            .card {
                                border: 2px dashed #333;
                                border-radius: 16px;
                                padding: 30px;
                                display: inline-block;
                            }
                            h2 {
                                margin-bottom: 5px;
                                font-size: 18px;
                                color: #111;
                            }
                            p {
                                font-size: 14px;
                                color: #555;
                                margin-top: 10px;
                                font-weight: bold;
                            }
                            img {
                                width: 220px;
                                height: 220px;
                                margin-top: 15px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h2>RCCG Milk & Honey Sunday School</h2>
                            <p>Session Date: ${selectedSessionDate}</p>
                            <img src="${qrImageUrl}" alt="Session QR Code" />
                            <p style="font-size: 11px; color: #777; margin-top: 15px;">Scan with your camera or phone to check in.</p>
                        </div>
                        <script>
                            window.onload = function() {
                                window.print();
                                window.close();
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleDownloadPdfImage = async () => {
        if (!activeQrCode) return;
        try {
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(activeQrCode)}`;
            const response = await fetch(qrImageUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `didache-qr-${selectedSessionDate}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download error:', err);
            window.alert('Failed to download QR code image.');
        }
    };

    // Format milliseconds into MM:SS
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const isExpired = timeLeft !== null && timeLeft <= 0;
    const remainingGenerations = 10 - qrGenCount >= 0 ? 10 - qrGenCount : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Generator Panel */}
            <div className="md:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-emerald-400" /> Session QR Generator{' '}
                        {ALLOW_ANYDAY_TESTING && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md">
                                Testing Mode Active
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition"
                        title="Soft Refresh State"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh</span>
                    </button>
                </div>

                <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Select Session Date</label>
                    <input
                        type="date"
                        value={selectedSessionDate}
                        onChange={(e) => setSelectedSessionDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
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
                    Generate Active Session QR ({remainingGenerations} left today)
                </button>
            </div>

            {/* Right Display & Action Panel */}
            <div className="md:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                {activeQrCode ? (
                    isExpired ? (
                        <div className="p-6 rounded-2xl bg-slate-950 border border-red-500/30 text-red-400 text-xs space-y-1">
                            <Clock className="w-8 h-8 mx-auto text-red-400 animate-pulse" />
                            <p className="font-bold">QR Code Expired</p>
                            <p className="text-[11px] text-slate-400">Generations expire 60 mins post-creation.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 w-full flex flex-col items-center">
                            <div className="p-4 bg-white rounded-2xl shadow-2xl space-y-2">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeQrCode)}`}
                                    alt="QR"
                                    className="w-40 h-40 mx-auto"
                                />
                                <p className="text-[11px] text-slate-900 font-bold">{selectedSessionDate}</p>

                                {/* Live Countdown Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-extrabold">
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                    <span>Expires in: {timeLeft !== null ? formatTime(timeLeft) : '60:00'}</span>
                                </div>
                            </div>

                            {/* Print and Save Actions */}
                            <div className="grid grid-cols-2 gap-2 w-full max-w-xs pt-1">
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 transition"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print QR</span>
                                </button>
                                <button
                                    onClick={() => void handleDownloadPdfImage()}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-semibold text-white shadow transition"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Save Image</span>
                                </button>
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