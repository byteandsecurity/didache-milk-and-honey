'use client';

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode, AlertCircle } from 'lucide-react';

interface GuestQrScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (scannedDate: string) => void;
}

export default function GuestQrScanner({ isOpen, onClose, onSuccess }: GuestQrScannerProps) {
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Initialize html5-qrcode scanner instance
        const scanner = new Html5QrcodeScanner(
            'reader-guest',
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                try {
                    // Extract date param if QR is a full URL or raw date string (e.g. 2026-11-05)
                    let extractedDate = new Date().toISOString().split('T')[0];

                    if (decodedText.includes('date=')) {
                        const urlParams = new URLSearchParams(decodedText.split('?')[1]);
                        const dateFromUrl = urlParams.get('date');
                        if (dateFromUrl) extractedDate = dateFromUrl;
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(decodedText.trim())) {
                        extractedDate = decodedText.trim();
                    }

                    // Save QR date context for Guest check-in
                    localStorage.setItem('didache_qr_date', extractedDate);

                    // Clear scanner
                    scanner.clear().catch((err) => console.error('Error clearing scanner:', err));

                    // Callback to parent without executing ANY member attendance inserts
                    onSuccess(extractedDate);
                } catch (err) {
                    setScanError('Invalid QR Code format. Please scan today\'s service QR code.');
                }
            },
            (error) => {
                // Minor scanning noise; ignore
            }
        );

        return () => {
            scanner.clear().catch(() => {});
        };
    }, [isOpen, onSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                        <QrCode className="w-4 h-4" />
                        <span>Visitor Service QR Scanner</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-slate-300">
                    Point your camera at the Sunday School QR code displayed in the hall to unlock visitor check-in.
                </p>

                {scanError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{scanError}</span>
                    </div>
                )}

                {/* HTML5 QR Reader Container */}
                <div id="reader-guest" className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950" />

                <button
                    onClick={onClose}
                    className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}