import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom"; // Giữ nguyên các import định tuyến
import { Bell, Sun, Moon, User, LogOut, KeyRound } from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

export default function Header({ title, isSidebarCollapsed, setIsSidebarCollapsed }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Khởi tạo trạng thái đóng mở của Modal đổi mật khẩu trung tâm
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const dropdownRef = useRef(null);

  // ==========================================
  // DYNAMIC PATH MAPPING WITH MULTI-LANGUAGE
  // ==========================================
  const pageTitles = {
    en: {
      "/user": "Dashboard",
      "/user/book": "Book Slot",
      "/user/bookings": "Booking Sessions",
      "/user/vehicle": "My Vehicles",
      "/user/issues": "Reports",
      "/user/profile": "Edit My Profile",
      "/staff/checkin": "Gate Entry Operation",
      "/staff/checkout": "Gate Exit & Payment",
      "/staff/incidents": "Incident Handling",
      "/staff": "Dashboard",
      "/staff/slots": "Slots and Gate Management",
      "/staff/history": "Parking History",
      "/admin": "Admin Dashboard",
      "/admin/users": "User Accounts & Roles",
      "/admin/logs": "Role Audit Logs",
      "/admin/settings": "System Settings",
      "/manager": "Manager Dashboard",
      "/manager/slots": "Parking Slots Management",
      "/manager/building": "Building Information",
      "/manager/pricing": "Pricing Configuration",
      "/manager/staff": "Staff Attendants",
      "/manager/issues": "Reported Issues",
    },
    vi: {
      "/user": "Trang chủ",
      "/user/book": "Đặt vị trí đỗ",
      "/user/bookings": "Lịch sử đặt chỗ",
      "/user/vehicle": "Phương tiện của tôi",
      "/user/issues": "Báo cáo sự cố",
      "/user/profile": "Hồ sơ cá nhân",
      "/staff/checkin": "Cho xe vào cổng",
      "/staff/checkout": "Thanh toán xe ra",
      "/staff/incidents": "Báo cáo sự cố",
      "/staff": "Bảng điều khiển",
      "/staff/slots": "Giám sát ô đỗ",
      "/staff/history": "Lịch sử đỗ xe",
      "/admin": "Bảng điều khiển Admin",
      "/admin/users": "Quản lý tài khoản",
      "/admin/logs": "Nhật ký phân quyền",
      "/admin/settings": "Cấu hình hệ thống",
      "/manager": "Bảng điều khiển Quản lý",
      "/manager/slots": "Quản lý vị trí đỗ",
      "/manager/building": "Thông tin tòa nhà",
      "/manager/pricing": "Cấu hình bảng giá",
      "/manager/staff": "Danh sách nhân viên",
      "/manager/issues": "Sự cố phản hồi",
    }
  };

  // CLEAR AVATAR LINK (GIỮ NGUYÊN VẸN CỦA BẠN)
  const getBackendRootUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return baseUrl.replace("/api/v1", "");
  };

  // ==========================================
  // ROLE-BASED CONTEXT RESOLUTION (GIỮ NGUYÊN VẸN CỦA BẠN)
  // ==========================================
  const getFallbackTitle = () => {
    if (language === "en") {
      if (user?.role === "SystemAdmin") return "System Admin Dashboard";
      if (user?.role === "ParkingStaff") return "Operator Dashboard";
      if (user?.role === "ParkingManager") return "Manager Dashboard";
      return "Driver Dashboard";
    } else {
      if (user?.role === "SystemAdmin") return "Bảng điều khiển Admin";
      if (user?.role === "ParkingStaff") return "Bảng điều khiển nhân viên";
      if (user?.role === "ParkingManager") return "Bảng điều khiển Quản lý";
      return "Bảng điều khiển Khách hàng";
    }
  };

  const currentTitle = title || pageTitles[language][location.pathname] || getFallbackTitle();
  const targetProfileRoute =
    user?.role === "SystemAdmin" ? "/admin/profile" :
      user?.role === "ParkingManager" ? "/manager/profile" :
        user?.role === "ParkingStaff" ? "/staff/profile" :
          "/user/profile";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userAvatar = user?.avatar || user?.avatar_url || "";

  // 🚀 ĐÃ SỬA: Thay thế biến undefined thành phương thức Heuristic kiểm tra chuỗi URL Avatar tuyệt đối của Google
  const isGoogleAccount = userAvatar.startsWith("http://") || userAvatar.startsWith("https://");

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    navigate(targetProfileRoute);
  };

  return (
    <header className="sticky top-0 z-40 w-full h-20 flex items-center justify-between transition-all duration-300 bg-white dark:bg-slate-900 px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="pl-20 lg:pl-0 flex items-center transition-all duration-300 min-w-0">
        <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight transition-all duration-300 truncate">{currentTitle}</h1>
      </div>

      {/* RIGHT AREA: UTILITIES & AVATAR POPOVER */}
      <div className="flex items-center gap-3 lg:gap-3.5 ml-auto">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-black text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none flex items-center gap-1.5"
          title={language === "en" ? "Switch to Vietnamese" : "Chuyển sang Tiếng Anh"}
        >
          <span>🌐</span>
          <span>{language === "en" ? "EN" : "VI"}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none">
          {theme === "dark" ? <Sun size={18} className="text-amber-400 fill-amber-400/20" /> : <Moon size={18} className="text-slate-600" />}
        </button>

        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

        {/* AVATAR POPOVER SYSTEM */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 overflow-hidden ${user?.role === "ParkingStaff" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700"
              } ${isDropdownOpen ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900" : ""}`}>
            {userAvatar ? (
              <img src={isGoogleAccount ? userAvatar : `${getBackendRootUrl()}${userAvatar}`} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black uppercase">{user?.full_name ? user.full_name.charAt(0) : "U"}</span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3.5 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate leading-tight">{user?.full_name || "Guest User"}</p>
                <div className="mt-1.5">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${user?.role === "ParkingStaff"
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      }`}>
                    {user?.role === "SystemAdmin" ? (language === "en" ? "System Admin" : "Quản trị viên") :
                      user?.role === "ParkingManager" ? (language === "en" ? "Facility Manager" : "Quản lý Bãi xe") :
                        user?.role === "ParkingStaff" ? (language === "en" ? "Gate Staff" : "Nhân viên Cổng") :
                          user?.role === "ParkingUser" ? (language === "en" ? "User" : "Khách hàng") :
                            (user?.role || (language === "en" ? "Guest" : "Khách"))}
                  </span>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5 font-bold text-xs text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-left hover:text-slate-800 dark:hover:text-slate-200">
                  <User size={14} className="text-slate-400 dark:text-slate-500" />
                  {language === "en" ? "Profile Settings" : "Cài đặt hồ sơ"}
                </button>

                {/* 🚀 ĐÃ SỬA: Đổi điều kiện kiểm tra sang biến logic cục bộ isGoogleAccount và loại bỏ SystemAdmin */}
                {!isGoogleAccount && user?.role !== "SystemAdmin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors text-left hover:text-slate-800 dark:hover:text-slate-200 mt-0.5">
                    <KeyRound size={14} className="text-slate-400 dark:text-slate-500" />
                    {language === "en" ? "Change Password" : "Đổi mật khẩu"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors text-left mt-0.5">
                  <LogOut size={14} />
                  {language === "en" ? "Account Sign Out" : "Đăng xuất tài khoản"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quản lý cổng hiển thị Modal đổi mật khẩu an toàn */}
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </header>
  );
}
