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

  // State management for user profile dropdown popover
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Reference area to handle click-outside event trigger
  const dropdownRef = useRef(null);

  // Dynamic Page Title Mapping according to FUNCTIONAL_REQUIREMENT modules
  const pageTitles = {
    "/user": "Dashboard",
    "/user/book": "Booking Slot",
    "/user/bookings": "Booking Sessions",
    "/user/vehicles": "My Vehicles",
    "/user/issues": "Support Center",
    "/user/profile": "Edit My Profile",
  };

  // Fallback title default configuration if path context does not match exactly
  const currentTitle = pageTitles[location.pathname] || "Driver Dashboard";

  // Hook to detect click transaction outside the dropdown component boundary
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract initial character from USERS.FULL_NAME field context as safe fallback
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Execution flow handler for UC-02: Logout event sequence
  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  // Execution flow handler for UC-01: Navigate to edit profile interface
  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    navigate("/user/profile");
  };

  return (
    /* Glassmorphism architecture container with strict fixed layout dimensions (h-20) */
    <header className="sticky top-0 z-40 w-full h-20 flex items-center justify-between transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      {/* LEFT AREA: Clean dynamic page title group without layout-breaking button elements */}
      <div className="pl-20 lg:pl-0 flex items-center transition-all duration-300 min-w-0">
        <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight transition-all duration-300 truncate">
          {currentTitle}
        </h1>
      </div>

      {/* RIGHT AREA: Utility operational controls & RBAC Profile Popover */}
      <div className="flex items-center gap-3 lg:gap-3.5 ml-auto">
        {/* Toggle Theme Configuration Button */}
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

        {/* Real-time Notification System Center (Integrated with micro-animation live ping loop) */}
        <button className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900">
            <span className="absolute inset-0 w-full h-full bg-red-400 rounded-full animate-ping opacity-75"></span>
          </span>
        </button>

        {/* Visual vertical separation axis separator */}
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

        {/* AVATAR & DROPDOWN MENU POPOVER COUPLING */}
        <div className="relative" ref={dropdownRef}>
          {/* Main User Avatar controller with active blue ring indicator constraints */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 overflow-hidden ${
              isDropdownOpen
                ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900"
                : ""
            }`}
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

          {/* Dropdown Menu Popover System */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3.5 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
              {/* Dropdown Meta Header View: Render user credentials based on USERS table criteria */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                <p className="text-sm font-black text-slate-800 dark:text-white truncate leading-tight">
                  {user?.name || "Guest User"}
                </p>
                <div className="mt-1.5">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {user?.role || "Guest"}
                  </span>
                </div>
              </div>

              {/* Action Operations Task List (Integrated with unified rounded-xl criteria) */}
              <div className="p-1.5 space-y-0.5 font-bold text-xs text-slate-600 dark:text-slate-400">
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-left hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <User
                    size={14}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  Edit My Profile
                </button>

                <button
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
