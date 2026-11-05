import { Shield } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="w-full border-t border-slate-800/60 bg-slate-950/40 py-6 text-center text-xs text-slate-500 backdrop-blur-sm mt-auto">
            <div className="max-w-md mx-auto px-4 flex flex-col items-center gap-2">
                <p className="text-slate-400 font-medium">
                    Didache &copy; {2026} RCCG Milk & Honey
                </p>

                {/* Brand Attribution */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-400">
                    <span>Engineered by</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        Byte&Security
                    </span>
                </div>
            </div>
        </footer>
    );
}