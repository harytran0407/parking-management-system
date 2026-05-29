import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Sun, Moon, User, LogOut } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ==========================================
  // DYNAMIC PATH MAPPING
  // ==========================================
  const pageTitles = {
    // --- ParkingUser (Driver) Routes ---
    "/user": "Parking Info",
    "/user/book": "Booking Slot",
    "/user/bookings": "Booking Sessions",
    "/user/vehicles": "My Vehicles",
    "/user/issues": "Reports",
    "/user/profile": "Edit My Profile",

    // --- ParkingStaff (Operator) Routes ---
    "/staff/checkin": "Gate Entry Operation",
    "/staff/checkout": "Gate Exit & Payment",
    "/staff/incidents": "Incident Handling",
    "/staff": "Dashboard",
    "/staff/slots": "Slots and Gate Management",
  };

  // ==========================================
  // ROLE-BASED CONTEXT RESOLUTION
  // ==========================================
  const getFallbackTitle = () => {
    if (user?.role === "ParkingStaff") return "Operator Dashboard";
    if (user?.role === "ParkingManager") return "Manager Dashboard";
    return "Driver Dashboard";
  };

  const currentTitle = pageTitles[location.pathname] || getFallbackTitle();

  const targetProfileRoute =
    user?.role === "ParkingStaff" ? "/staff/profile" : "/user/profile";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🛠️ ĐÃ SỬA: Đổi từ user?.name sang user?.full_name theo đúng cấu trúc API kết quả đăng nhập
  const initial = user?.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : "U";

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    navigate(targetProfileRoute); // Điều hướng động theo Role của phiên làm việc
  };

  return (
    <header className="sticky top-0 z-40 w-full h-20 flex items-center justify-between transition-all duration-300 bg-white dark:bg-slate-900 px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      {/* LEFT AREA: Tiêu đề động tự động cập nhật theo tính năng thực tế đang chạy */}
      <div className="pl-20 lg:pl-0 flex items-center transition-all duration-300 min-w-0">
        <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight transition-all duration-300 truncate">
          {currentTitle}
        </h1>
      </div>

      {/* RIGHT AREA: UTILITIES & AVATAR POPOVER */}
      <div className="flex items-center gap-3 lg:gap-3.5 ml-auto">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none"
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-amber-400 fill-amber-400/20" />
          ) : (
            <Moon size={18} className="text-slate-600" />
          )}
        </button>

        {/* Live Notification Dot Center */}
        <button className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900">
            <span className="absolute inset-0 w-full h-full bg-red-400 rounded-full animate-ping opacity-75"></span>
          </span>
        </button>

        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

        {/* AVATAR POPOVER SYSTEM */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 overflow-hidden ${
              user?.role === "ParkingStaff"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-blue-600 hover:bg-blue-700"
            } ${isDropdownOpen ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900" : ""}`}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              initial
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3.5 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                {/* 🛠️ ĐÃ SỬA: Đồng bộ hiển thị từ user?.name sang user?.full_name */}
                <p className="text-sm font-black text-slate-900 dark:text-white truncate leading-tight">
                  {user?.full_name || "Guest User"}
                </p>
                <div className="mt-1.5">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      user?.role === "ParkingStaff"
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    }`}
                  >
                    {user?.role || "Guest"}
                  </span>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5 font-bold text-xs text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-left hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <User
                    size={14}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  Profile Settings
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors text-left mt-0.5"
                >
                  <LogOut size={14} />
                  Account Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
