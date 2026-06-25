// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AboutUsModal from "./AboutUsModal";
import { Menu, X, PanelLeftClose, PanelLeftOpen, Info } from "lucide-react"; // ĐÃ BỔ SUNG: Thêm icon Info cho nhãn About us
import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../hooks/useAuth";

export default function Sidebar({ navigationItems = [], isCollapsed, setIsCollapsed }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  //  ĐÃ BỔ SUNG: Khởi tạo trạng thái quản lý đóng/mở cục bộ của Modal quy định bãi xe
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const location = useLocation();

  const handleLogoClick = () => {
    let target = "/";
    if (user?.role === "SystemAdmin") {
      target = "/admin";
    } else if (user?.role === "ParkingStaff") {
      target = "/staff/checkin";
    } else if (user?.role === "ParkingManager") {
      target = "/manager";
    } else if (user?.role === "ParkingUser" || user?.role === "User") {
      target = "/user";
    }
    window.location.href = target;
  };

  // LOGIC: Normalize and verify strict navigation active state contexts
  const checkIsActive = (path) => {
    const currentPath = location.pathname.replace(/\/$/, "");
    const targetPath = path.replace(/\/$/, "");

    if (targetPath === "/staff" || targetPath === "/user" || targetPath === "/admin" || targetPath === "/manager" || targetPath === "") {
      return currentPath === targetPath;
    }
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
  };

  return (
    <>
      {/* NÚT BẤM TOGGLE MENU CHO MOBILE */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-xl shadow-sm transition-all focus:outline-none">
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* KHUNG SIDEBAR CHÍNH */}
      <aside
        className={`fixed lg:relative h-screen transition-all duration-300 ease-in-out z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-sm
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        `}>
        {/* BRAND LOGO & TOGGLE CONTROL AREA */}
        <div
          className={`h-20 border-b border-slate-200 dark:border-slate-800 flex items-center shrink-0 transition-all duration-300 px-6
          ${isCollapsed ? "lg:px-0 lg:justify-center" : "lg:justify-between"}
        `}>
          <div className={`flex items-center justify-between w-full min-w-0 ${isCollapsed ? "lg:hidden" : "flex"}`}>
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img src="/eParkingLogo.png" alt="eParking Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm shrink-0" />
              <div className="whitespace-nowrap">
                <h2 className="text-base font-black text-blue-900 dark:text-white tracking-tight leading-none">eParking</h2>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 rounded-xl transition-all">
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div className={`w-10 h-10 items-center justify-center relative group/logo ${isCollapsed ? "hidden lg:flex" : "hidden"}`}>
            <button onClick={() => setIsCollapsed(false)} className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none">
              <img src="/eParkingLogo.png" alt="eParking Logo" className="absolute inset-0 w-10 h-10 object-contain p-1 rounded-xl  shadow-md transition-all duration-300 scale-100 opacity-100 group-hover/logo:scale-0 group-hover/logo:opacity-0" />
              <div className="absolute inset-0 border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:text-slate-500 dark:hover:text-blue-400 rounded-xl flex items-center justify-center transition-all duration-300 scale-0 opacity-0 group-hover/logo:scale-100 group-hover/logo:opacity-100">
                <PanelLeftOpen size={18} />
              </div>
            </button>
          </div>
        </div>

        {/* 🚀 NAVIGATION ROUTING CORE SYSTEM LINK CHANNELS */}
        <nav className="p-4 space-y-1.5 flex-1 relative">
          {navigationItems.map((item) => {
            const isActive = checkIsActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`relative flex w-full items-center rounded-xl transition-all duration-200 overflow-visible group font-bold text-sm h-11 px-4 py-3
                  ${isCollapsed ? "justify-between lg:justify-center" : "justify-between"}
                  ${isActive ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:bg-slate-100/70 dark:hover:bg-slate-800/40"}
                `}>
                <div className="flex items-center gap-3.5 z-10 min-w-0">
                  <div className={`transition-transform duration-200 group-hover:scale-105 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                    {item.icon}
                  </div>

                  <span className={`leading-none whitespace-nowrap ${isCollapsed ? "lg:hidden" : "block"}`}>{item.label}</span>
                </div>

                {item.badge && (
                  <div className={`items-center gap-2 z-10 ${isCollapsed ? "lg:hidden flex" : "flex"}`}>
                    <span className="bg-blue-600 text-white text-[10px] font-black font-mono px-2 py-0.5 rounded-md shadow-sm">{item.badge}</span>
                  </div>
                )}

                {/* ⭐️ HOVER-TO-REVEAL SOFT GLASSMORPHISM TOOLTIP CONTAINER */}
                <div
                  className={`absolute left-full ml-3 bg-slate-100/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] translate-x-2 group-hover:translate-x-0 whitespace-nowrap
                    ${isCollapsed ? "hidden lg:block" : "hidden"}
                  `}>
                  {item.label}
                  {item.badge && <span className="ml-2 bg-blue-600 text-white text-[9px] font-black font-mono px-1.5 py-0.5 rounded shadow-sm">{item.badge}</span>}
                </div>

                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-blue-600 dark:bg-blue-500 rounded-l-full shadow-sm" />}
              </Link>
            );
          })}
        </nav>

        {/* 🚀 ĐÃ THAY THẾ: Loại bỏ đoạn text tĩnh cũ, chèn nút liên kết mở Modal Quy định bãi xe */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)} // Gọi mở Modal trung tâm
            className={`relative flex w-full items-center rounded-xl transition-all duration-200 overflow-visible group font-bold text-sm h-11 px-4 py-3 text-slate-500 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white
              ${isCollapsed ? "justify-between lg:justify-center" : "justify-between"}
            `}>
            <div className="flex items-center gap-3.5 z-10 min-w-0">
              <div className="transition-transform duration-200 group-hover:scale-105 shrink-0 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <Info size={18} />
              </div>
              <span className={`leading-none whitespace-nowrap ${isCollapsed ? "lg:hidden" : "block"}`}>
                {language === "en" ? "About us" : "Giới thiệu"}
              </span>
            </div>

            {/* HOVER-TO-REVEAL TOOLTIP KÍNH MỜ CHO NÚT ABOUT US KHI SIDEBAR THU GỌN */}
            <div
              className={`absolute left-full ml-3 bg-slate-100/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] translate-x-2 group-hover:translate-x-0 whitespace-nowrap
                ${isCollapsed ? "hidden lg:block" : "hidden"}
              `}>
              {language === "en" ? "About us" : "Giới thiệu"}
            </div>
          </button>

          {/* Khởi chạy cổng Portal để hiển thị Hộp thoại Quy định bãi đỗ xe */}
          <AboutUsModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        </div>
      </aside>

      {/* RESPONSIVE MOBILE OVERLAY BACKGROUND MASK */}
      {isMobileOpen && <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden z-30 animate-fade-in" />}
    </>
  );
}
