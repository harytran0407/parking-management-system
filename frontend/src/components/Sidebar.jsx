import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, PanelLeftClose } from "lucide-react";

export default function Sidebar({
  navigationItems = [],
  isCollapsed,
  setIsCollapsed,
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // LOGIC: Chuẩn hóa kiểm tra trạng thái Active chính xác cho sub-routes
  const checkIsActive = (path) => {
    const currentPath = location.pathname.replace(/\/$/, "");
    const targetPath = path.replace(/\/$/, "");

    if (
      targetPath === "/staff" ||
      targetPath === "/user" ||
      targetPath === "/admin" ||
      targetPath === ""
    ) {
      return currentPath === targetPath;
    }

    return (
      currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
    );
  };

  return (
    <>
      {/* 📱 NÚT MENU TOGGLE CHO MOBILE (Đã fix hỗ trợ bo góc mềm mại) */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl backdrop-blur-md shadow-sm transition-all focus:outline-none"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ========================================== */}
      {/* 💎 COMPONENT ASIDE SIDEBAR CHUẨN HIỆN ĐẠI */}
      {/* ========================================== */}
      <aside
        className={`fixed lg:relative h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 custom-scrollbar shadow-sm
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-0 lg:p-0 lg:border-none opacity-0 lg:pointer-events-none" : "w-64 opacity-100"}
        `}
      >
        {/* CONTAINER LOGO VÀ Header */}
        <div className="h-20 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-base shadow-md shadow-blue-500/20 shrink-0">
              S
            </div>

            <div className="whitespace-nowrap">
              <h2 className="text-base font-black text-slate-800 dark:text-white tracking-tight leading-none">
                Smartpark
              </h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                Parking Suite
              </p>
            </div>
          </div>

          {/* Nút đóng thu nhỏ Sidebar trên Desktop giữ nguyên */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* ========================================== */}
        {/*  (PILL-BACKGROUND EFFECT) */}
        {/* ========================================== */}
        <nav className="p-4 space-y-1.5 flex-1 relative">
          {navigationItems.map((item) => {
            const isActive = checkIsActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group whitespace-nowrap font-bold text-sm
                  ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200"
                  }
                `}
              >
                <div className="flex items-center gap-3.5 z-10">
                  <div
                    className={`transition-transform duration-200 group-hover:scale-105 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="leading-none">{item.label}</span>
                </div>

                {/* Khối hiển thị Badge số đếm (Ví dụ: Số xe, Số vé active) */}
                <div className="flex items-center gap-2 z-10">
                  {item.badge && (
                    <span className="bg-blue-600 text-white text-[10px] font-black font-mono px-2 py-0.5 rounded-md shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* (Visual Indicator Pill) */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-600 dark:bg-blue-500 rounded-l-full shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 text-center shrink-0">
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
            Smartpark v1.0
          </p>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden z-30 animate-fade-in"
        />
      )}
    </>
  );
}
