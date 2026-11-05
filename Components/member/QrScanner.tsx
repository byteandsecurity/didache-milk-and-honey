'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface QrScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QrScanner({ isOpen, onClose, onSuccess }: QrScannerProps) {
    const [scannerStatus, setScannerStatus] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<any>(null);
    const processingScanRef = useRef(false);

    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const startCamera = async () => {
        setScannerStatus('Starting camera...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { exact: 'environment' }
                }
            }).catch(() => {
                return navigator.mediaDevices.getUserMedia({ video: true });
            });

            mediaStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                await videoRef.current.play();
            }

            setScannerStatus('Camera active! Point at Sunday QR code.');

            // Initialize Native BarcodeDetector if available
            if ('BarcodeDetector' in window) {
                //@ts-ignore
                const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });

                scanIntervalRef.current = setInterval(async () => {
                    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;
                    try {
                        const barcodes = await barcodeDetector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            const rawValue = barcodes[0].rawValue;
                            try {
                                const urlObj = new URL(rawValue);
                                const dateParam = urlObj.searchParams.get('date');
                                if (dateParam) {
                                    stopCamera();
                                    await processScannedDate(dateParam);
                                }
                            } catch {
                                if (rawValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    stopCamera();
                                    await processScannedDate(rawValue);
                                }
                            }
                        }
                    } catch {
                        // Suppress scanning frame errors
                    }
                }, 500);
            } else {
                setScannerStatus('Live camera scanning requires Chrome Mobile or supported browser.');
            }
        } catch (err) {
            console.error('Camera error:', err);
            setScannerStatus('Camera access blocked. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
    };

    const processScannedDate = async (scannedDateStr: string) => {
        if (processingScanRef.current) return;
        processingScanRef.current = true;

        const memberId = localStorage.getItem('didache_member_id');
        setScannerStatus(`🎯 QR Code detected for ${scannedDateStr}! Recording attendance...`);

        // Automatically Upsert Session
        const { data: sessionMatch, error: sessionError } = await supabase
            .from('sessions')
            .upsert([
                {
                    session_date: scannedDateStr,
                    title: `Service Session (${scannedDateStr})`,
                    is_active: true
                }
            ], { onConflict: 'session_date' })
            .select('id')
            .single();

        if (sessionError || !sessionMatch) {
            alert(`❌ Error handling session: ${sessionError?.message}`);
            processingScanRef.current = false;
            onClose();
            return;
        }

        // Record Attendance
        const { error: attendanceError } = await supabase.from('attendance').insert([
            {
                user_id: memberId,
                session_id: sessionMatch.id,
                checked_in_at: new Date().toISOString(),
            }
        ]);

        onClose();

        if (attendanceError) {
            if (attendanceError.message.includes('duplicate')) {
                alert('ℹ️ You have already checked in for this session!');
            } else {
                console.error('Supabase Error Details:', attendanceError);
                alert(`❌ Supabase Error: ${attendanceError.message}`);
            }
        } else {
            alert('🎉 Check-in successfully recorded in Supabase!');
            onSuccess();
        }
        processingScanRef.current = false;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-400" /> Sunday QR Scanner
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
                    <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 border-2 border-emerald-500/40 rounded-2xl m-8 pointer-events-none animate-pulse flex items-center justify-center">
                        <div className="w-32 h-32 border border-dashed border-emerald-400/60 rounded-xl" />
                    </div>
                </div>

                <p className="text-xs text-slate-300 font-medium">{scannerStatus}</p>
            </div>
        </div>
    );
}