'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { verifyUserLocation } from '@/lib/geofence';

interface GuestQrScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (scannedDate: string) => void;
}

export default function GuestQrScanner({ isOpen, onClose, onSuccess }: GuestQrScannerProps) {
    const [scannerStatus, setScannerStatus] = useState<string | null>(null);
    const [resultState, setResultState] = useState<'none' | 'success' | 'warning'>('none');
    const [resultMessage, setResultMessage] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const processingScanRef = useRef<boolean>(false);

    const stopCamera = useCallback(() => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            mediaStreamRef.current = null;
        }
    }, []);

    const processScannedValue = useCallback(async (rawValue: string) => {
        if (processingScanRef.current) return;
        processingScanRef.current = true;

        // 1. EXTRACT DATE AND EXPIRATION FROM RAW QR DATA
        let scannedDateStr: string | null = null;
        let expiryTimestamp: number | null = null;

        try {
            const urlObj = new URL(rawValue);
            scannedDateStr = urlObj.searchParams.get('date');
            const expiresParam = urlObj.searchParams.get('expires');
            if (expiresParam) expiryTimestamp = parseInt(expiresParam, 10);
        } catch {
            try {
                const parsedJson = JSON.parse(rawValue);
                scannedDateStr = parsedJson.date || null;
                if (parsedJson.expires) expiryTimestamp = parseInt(parsedJson.expires, 10);
            } catch {
                if (rawValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    scannedDateStr = rawValue.trim();
                }
            }
        }

        if (!scannedDateStr) {
            setResultMessage('Error: Invalid QR code format.');
            setResultState('warning');
            processingScanRef.current = false;
            return;
        }

        // 2. CHECK EXPIRATION TIMESTAMP
        if (expiryTimestamp && !isNaN(expiryTimestamp) && Date.now() > expiryTimestamp) {
            setResultMessage('⏳ This QR code has expired. Please ask the teacher to generate a new QR code so you can check in.');
            setResultState('warning');
            processingScanRef.current = false;
            return;
        }

        // 3. VERIFY GEOFENCE LOCATION
        setScannerStatus('Verifying location...');
        const geoCheck = await verifyUserLocation();
        if (!geoCheck.allowed) {
            setResultMessage(`❌ ${geoCheck.message || "You are outside the check-in radius."}`);
            setResultState('warning');
            processingScanRef.current = false;
            return;
        }

        localStorage.setItem('didache_qr_date', scannedDateStr);

        setResultMessage(`QR Code verified for ${scannedDateStr}!`);
        setResultState('success');

        // Notify parent FIRST to trigger instant database check-in
        onSuccess(scannedDateStr);

        setTimeout(() => {
            onClose();
            processingScanRef.current = false;
        }, 900);
    }, [onClose, onSuccess]);

    const startCamera = useCallback(async () => {
        setScannerStatus('Starting camera...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { exact: 'environment' } }
            }).catch(() => {
                return navigator.mediaDevices.getUserMedia({ video: true });
            });

            mediaStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsInline', 'true');
                await videoRef.current.play();
            }

            setScannerStatus('Camera active! Point at Sunday QR code.');

            if ('BarcodeDetector' in window) {
                // @ts-expect-error - BarcodeDetector is supported in modern mobile/Chrome browsers
                const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });

                scanIntervalRef.current = setInterval(() => {
                    void (async () => {
                        if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;
                        try {
                            const barcodes = await barcodeDetector.detect(videoRef.current);
                            if (barcodes.length > 0) {
                                const rawValue = barcodes[0].rawValue;
                                stopCamera();
                                await processScannedValue(rawValue);
                            }
                        } catch {
                            // Suppress frame scan noise
                        }
                    })();
                }, 500);
            } else {
                setScannerStatus('Live camera scanning requires Chrome Mobile or supported browser.');
            }
        } catch (err) {
            console.error('Camera error:', err);
            setScannerStatus('Camera access blocked. Please check permissions.');
        }
    }, [stopCamera, processScannedValue]);

    useEffect(() => {
        if (isOpen) {
            setResultState('none');
            processingScanRef.current = false;
            void startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, startCamera, stopCamera]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-amber-400" /> Visitor Service QR Scanner
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {resultState !== 'none' ? (
                    <div className="py-8 space-y-4 flex flex-col items-center justify-center">
                        {resultState === 'success' ? (
                            <CheckCircle2 className="w-16 h-16 text-amber-400 animate-bounce" />
                        ) : (
                            <AlertTriangle className="w-14 h-14 text-amber-400" />
                        )}
                        <p className="text-sm font-bold text-white px-4 leading-relaxed">{resultMessage}</p>
                        <button
                            onClick={onClose}
                            className="mt-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-6 py-2.5 text-xs font-semibold text-slate-200 transition"
                        >
                            Close Scanner
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
                            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 border-2 border-amber-500/40 rounded-2xl m-8 pointer-events-none animate-pulse flex items-center justify-center">
                                <div className="w-32 h-32 border border-dashed border-amber-400/60 rounded-xl" />
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">{scannerStatus}</p>

                        <button
                            onClick={onClose}
                            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}