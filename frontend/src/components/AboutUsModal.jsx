// src/components/AboutUsModal.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

export default function AboutUsModal({ isOpen, onClose }) {
  const { language } = useLanguage();

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

      <div className="relative w-full max-w-sm bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl shadow-2xl z-10 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
        >
          <X size={16} />
        </button>

        {/* LOGO & TITLE */}
        <div className="mb-6">
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-450 tracking-widest uppercase block mb-1">
            eParking System
          </span>
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
            {language === "en" ? "About Us" : "Về chúng tôi"}
          </h3>
        </div>

        {/* METADATA LIST */}
        <div className="border-y border-slate-100 dark:border-slate-800/80 py-4 my-6 flex justify-around text-center">
          <div>
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              {language === "en" ? "Version" : "Phiên bản"}
            </span>
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-250">v1.0.0</span>
          </div>
          <div className="w-px bg-slate-100 dark:bg-slate-800/80 self-stretch" />
          <div>
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              {language === "en" ? "Released" : "Ngày phát hành"}
            </span>
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-250">21/07/2026</span>
          </div>
        </div>

        {/* DEVELOPERS SECTION */}
        <div className="mb-6">
          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-3">
            {language === "en" ? "Development Team" : "Đội ngũ phát triển"}
          </span>
          <div className="space-y-2">
            {[
              "Trần Đình Quốc Hưng",
              "Vũ Minh Tiến",
              "Lê Nguyễn Thiên Minh",
              "Huỳnh Nguyễn Bảo Khang"
            ].map((name) => (
              <div
                key={name}
                className="py-2 px-3 bg-slate-50 dark:bg-[#1f2937]/30 border border-slate-100/50 dark:border-slate-800/40 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 transition-all duration-150"
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/85 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">
          Một sản phẩm từ FPT University
        </div>
      </div>
    </div>,
    document.body
  );
}
