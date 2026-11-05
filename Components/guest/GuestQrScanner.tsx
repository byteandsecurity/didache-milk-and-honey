'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, CheckCircle2 } from 'lucide-react';

interface GuestQrScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (scannedDate: string) => void;
}

export default function GuestQrScanner({ isOpen, onClose, onSuccess }: GuestQrScannerProps) {
    const [scannerStatus, setScannerStatus] = useState<string | null>(null);
    const [isSuccessState, setIsSuccessState] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

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

    const processScannedDate = useCallback(async (scannedDateStr: string) => {
        if (processingScanRef.current) return;
        processingScanRef.current = true;

        localStorage.setItem('didache_qr_date', scannedDateStr);

        setSuccessMessage(`QR Code verified for ${scannedDateStr}!`);
        setIsSuccessState(true);

        // Notify parent FIRST to trigger instant database check-in
        onSuccess(scannedDateStr);

        setTimeout(() => {
            onClose();
            processingScanRef.current = false;
        }, 800);
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
                                let dateParam: string | null = null;

                                try {
                                    const urlObj = new URL(rawValue);
                                    dateParam = urlObj.searchParams.get('date');
                                } catch {
                                    if (rawValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                        dateParam = rawValue.trim();
                                    }
                                }

                                if (dateParam) {
                                    stopCamera();
                                    await processScannedDate(dateParam);
                                }
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
    }, [stopCamera, processScannedDate]);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsSuccessState(false);
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

                {isSuccessState ? (
                    <div className="py-10 space-y-3 flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-16 h-16 text-amber-400 animate-bounce" />
                        <p className="text-sm font-bold text-white">{successMessage}</p>
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