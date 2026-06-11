// src/components/AboutUsModal.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, AlertTriangle, Clock, HelpCircle, Info } from "lucide-react";

export default function AboutUsModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans antialiased animate-in fade-in zoom-in-95 duration-200">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#141f38] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 rounded-[8px] shadow-2xl z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-[8px] transition-colors">
          <X size={14} />
        </button>

        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0 shadow-sm">S</div>
          <h3 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">Parking Rules</h3>
        </div>

        {/* CONTENT - BENTO GRID */}
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. BOOKING */}
            <div className="p-4 bg-slate-50/50 dark:bg-[#0b1326] border border-slate-200/60 dark:border-slate-800/80 rounded-[8px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-950 dark:text-white uppercase mb-2">
                <Clock size={13} className="text-blue-500" /> Booking
              </div>
              <p>
                Reserved slots are held for <strong className="text-blue-600 dark:text-blue-400">15 minutes</strong> only. Please check in on time to avoid automatic cancellation.
              </p>
            </div>

            {/* 2. SPEED */}
            <div className="p-4 bg-slate-50/50 dark:bg-[#0b1326] border border-slate-200/60 dark:border-slate-800/80 rounded-[8px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-950 dark:text-white uppercase mb-2">
                <AlertTriangle size={13} className="text-amber-500" /> Safety
              </div>
              <p>
                Speed limit inside the facility is <strong className="text-amber-600 dark:text-amber-400">5 km/h</strong>. Please park strictly within the marked lines.
              </p>
            </div>
          </div>

          {/* 3. LOST TICKET */}
          <div className="p-4 bg-slate-50/50 dark:bg-[#0b1326] border border-slate-200/60 dark:border-slate-800/80 rounded-[8px]">
            <div className="flex items-center gap-1.5 font-bold text-slate-950 dark:text-white uppercase mb-2">
              <ShieldCheck size={13} className="text-emerald-500" /> Lost Ticket
            </div>
            <p>
              Lost ticket or QR code requires manual verification at the gate and incurs a <strong className="text-emerald-600 dark:text-emerald-400">50,000 VND</strong> processing
              fee.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
          <Info size={12} />
          <span>Need help? Contact gate staff for immediate assistance.</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
