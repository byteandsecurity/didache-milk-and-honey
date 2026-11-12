'use client';

import React from 'react';
import {DidacheGeometricIcon} from "@/Components/DidacheIcon";

interface LoadingSpinnerProps {
    text?: string;
    icon?: React.ElementType;
}

export default function LoadingSpinner({ text = 'Loading...', icon: Icon = DidacheGeometricIcon }: LoadingSpinnerProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-950/40 rounded-3xl border border-slate-900 my-auto">
            <div className="relative flex items-center justify-center">
                {/* Outer spinning ring */}
                <div className="absolute w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>

                {/* Inner glassmorphic icon container */}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-xl backdrop-blur-md">
                    <Icon className="h-6 w-6 animate-pulse" />
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200 tracking-wide">{text}</p>
                <p className="text-xs text-slate-500">RCCG Milk & Honey • Didache Portal</p>
            </div>
        </div>
    );
}