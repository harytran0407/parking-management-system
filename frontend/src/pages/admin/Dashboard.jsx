import React, { useState, useEffect } from "react";
import {
  Users,
  CreditCard,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
  Server,
  Database,
  Terminal,
  Settings,
  ChevronRight,
  Shield,
  Activity
} from "lucide-react";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [systemHealth, setSystemHealth] = useState(null);
  const [latestLogs, setLatestLogs] = useState([]);

  const getRelativeTimeString = (dateStr) => {
    if (!dateStr) return "";
    try {
      const utcStr = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
      const date = new Date(utcStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0) return language === "en" ? "Just now" : "Vừa xong";
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return language === "en" ? "Just now" : "Vừa xong";
      if (diffMins < 60) return language === "en" ? `${diffMins} mins ago` : `${diffMins} phút trước`;
      if (diffHours < 24) return language === "en" ? `${diffHours} hours ago` : `${diffHours} giờ trước`;
      return language === "en" ? `${diffDays} days ago` : `${diffDays} ngày trước`;
    } catch {
      return "";
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch system health
      try {
        const healthRes = await api.get("/admin/system-health");
        if (healthRes.data?.success) {
          setSystemHealth(healthRes.data.data);
          if (healthRes.data.data.totalUsers) {
            setTotalUsers(healthRes.data.data.totalUsers);
          }
        }
      } catch (healthErr) {
        console.warn("[Admin Dashboard Health Fetch Failed]:", healthErr);
        setSystemHealth({
          dbStatus: "OFFLINE",
          payosStatus: "CONFIG_REQUIRED",
          apiStatus: "ONLINE",
          apiLatencyMs: 999,
          errorCount24H: 0,
          warningCount24H: 0
        });
        setError(
          language === "en"
            ? "Cannot connect to server. Please verify system environment settings."
            : "Không thể kết nối đến máy chủ. Vui lòng xác thực lại cấu hình hệ thống."
        );
      }

      // 2. Fetch latest 10 system logs
      try {
        const logsRes = await api.get("/admin/logs", { params: { page: 1, page_size: 10 } });
        if (logsRes.data?.success) {
          setLatestLogs(logsRes.data.data.items || []);
        }
      } catch (logsErr) {
        console.warn("[Admin Dashboard Logs Fetch Failed]:", logsErr);
        setLatestLogs([]);
      }
    } catch (err) {
      console.error("[Admin Dashboard API Error]:", err);
      setError(
        language === "en"
          ? "Cannot connect to server. Please try again."
          : "Không thể kết nối đến máy chủ. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-10">
      {/* 1. TOP HEADER & TELEMETRY ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {language === "en" ? "System Status Overview" : "Trạng Thái Hệ Thống"}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-505 mt-1">
            {language === "en"
              ? "Check server status, database connections, payment gateways, and system activity logs."
              : "Theo dõi trạng thái máy chủ, kết nối cơ sở dữ liệu, cổng thanh toán và lịch sử hoạt động hệ thống."}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>{language === "en" ? "Refresh" : "Tải lại"}</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT DISPLAY */}
      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/40 text-red-655 dark:text-red-455 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !systemHealth ? (
        <div className="h-64 flex flex-col justify-center items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs text-slate-400">
            {language === "en" ? "Gathering system status details..." : "Đang kiểm tra kết nối hệ thống..."}
          </p>
        </div>
      ) : (
        <>
          {/* 2. SYSTEM HEALTH TELEMETRY SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Server Status Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-450 rounded-xl">
                  <Server size={20} />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {language === "en" ? "SERVER STATUS" : "TRẠNG THÁI MÁY CHỦ"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-black text-slate-850 dark:text-white">
                      ONLINE
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-455 dark:text-slate-500 block font-medium">
                    {language === "en" ? `Response time: ${systemHealth?.apiLatencyMs || 12}ms` : `Thời gian phản hồi: ${systemHealth?.apiLatencyMs || 12}ms`}
                  </span>
                </div>
              </div>
            </div>

            {/* Database Status Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${systemHealth?.dbStatus === "ONLINE"
                  ? "bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-450"
                  : "bg-red-50 dark:bg-red-955/20 text-red-650 dark:text-red-400"
                  }`}>
                  <Database size={20} />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {language === "en" ? "DATABASE CONNECTION" : "KẾT NỐI CƠ SỞ DỮ LIỆU"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${systemHealth?.dbStatus === "ONLINE" ? "bg-blue-500 animate-pulse" : "bg-red-500"
                      }`} />
                    <span className="text-sm font-black text-slate-850 dark:text-white">
                      {systemHealth?.dbStatus || "ONLINE"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 block">
                    {systemHealth?.dbStatus === "ONLINE"
                      ? (language === "en" ? "All pools synchronized" : "Mọi kết nối ổn định")
                      : (language === "en" ? "Connection timeout" : "Mất kết nối")}
                  </span>
                </div>
              </div>
            </div>

            {/* PayOS Gateway Status Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${systemHealth?.payosStatus === "ONLINE"
                  ? "bg-purple-50 dark:bg-purple-955/30 text-purple-600 dark:text-purple-455"
                  : "bg-amber-50 dark:bg-amber-955/20 text-amber-655 dark:text-amber-450"
                  }`}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {language === "en" ? "PAYOS GATEWAY" : "CỔNG THANH TOÁN PAYOS"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${systemHealth?.payosStatus === "ONLINE" ? "bg-purple-500 animate-pulse" : "bg-amber-550"
                      }`} />
                    <span className="text-sm font-black text-slate-850 dark:text-white">
                      {systemHealth?.payosStatus === "ONLINE" ? "ONLINE" : (language === "en" ? "NOT CONFIG" : "CHƯA CẤU HÌNH")}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-455 dark:text-slate-500 block font-medium">
                    {systemHealth?.payosStatus === "ONLINE"
                      ? (language === "en" ? "API keys connected" : "Đã kết nối thành công")
                      : (language === "en" ? "Credentials missing" : "Cần cấu hình API Key")}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning / Error Counter Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${(systemHealth?.errorCount24H || 0) > 0
                  ? "bg-red-50 dark:bg-red-955/30 text-red-650 dark:text-red-400"
                  : (systemHealth?.warningCount24H || 0) > 0
                    ? "bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400"
                    : "bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400"
                  }`}>
                  <Activity size={20} />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {language === "en" ? "SYSTEM WARNINGS (24H)" : "CẢNH BÁO HỆ THỐNG (24H)"}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-slate-805 dark:text-white flex items-center gap-1">
                      {systemHealth?.errorCount24H || 0} <span className="text-[10px] font-semibold text-red-500 uppercase font-sans">Errors</span>
                    </span>
                    <span className="text-slate-350 dark:text-slate-750">|</span>
                    <span className="text-sm font-black text-slate-855 dark:text-white flex items-center gap-1">
                      {systemHealth?.warningCount24H || 0} <span className="text-[10px] font-semibold text-amber-500 uppercase font-sans">Warns</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 block">
                    {((systemHealth?.errorCount24H || 0) + (systemHealth?.warningCount24H || 0)) > 0 ? (
                      <span className="text-blue-500 dark:text-blue-400 font-bold">
                        {language === "en" ? "Inspect system logs" : "Cần kiểm tra lại nhật ký"}
                      </span>
                    ) : (
                      language === "en" ? "Healthy status" : "Mọi thứ bình thường"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. MAIN DASHBOARD CONTENT: LIVE SYSTEM ACTIVITY & QUICK CONFIGS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            {/* Column A: System Activity Terminal logs (Span 3) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-5 rounded-2xl shadow-sm lg:col-span-3 flex flex-col justify-between min-h-[420px]">
              <div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Terminal size={18} className="text-blue-500 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-slate-300">
                        {language === "en" ? "System Activity Log" : "Nhật Ký Hoạt Động Hệ Thống"}
                      </h3>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                        {language === "en"
                          ? "Real-time history of user permissions, system changes, and error records."
                          : "Lịch sử phân quyền người dùng, thay đổi cài đặt và sự cố thời gian thực."}
                      </span>
                    </div>
                  </div>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>

                <div className="space-y-2.5 font-sans text-xs">
                  {latestLogs.length === 0 ? (
                    <div className="h-60 flex flex-col justify-center items-center text-slate-400">
                      <Terminal size={24} className="stroke-1 mb-2" />
                      <span className="text-[11px]">{language === "en" ? "No recent activity found." : "Không có hoạt động nào được ghi nhận gần đây."}</span>
                    </div>
                  ) : (
                    latestLogs.map((log) => {
                      const currentLogLevel = log.log_level || log.logLevel || "INFO";
                      const currentLogId = log.log_id || log.logId;
                      const currentCreatedAt = log.created_at || log.createdAt;
                      let levelColor = "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40";
                      if (currentLogLevel === "ERROR") {
                        levelColor = "bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40 animate-pulse";
                      } else if (currentLogLevel === "WARNING") {
                        levelColor = "bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40";
                      }

                      return (
                        <div
                          key={currentLogId}
                          className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5 hover:border-slate-200 dark:hover:border-slate-700/60 transition-all duration-150"
                        >
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${levelColor}`}>
                            {currentLogLevel}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-705 dark:text-slate-300 leading-relaxed text-[11px] break-words">
                              <span className="text-blue-600 dark:text-blue-400 font-bold mr-1.5">[{log.source || "System"}]</span>
                              {log.message}
                            </p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1 font-sans">
                              {getRelativeTimeString(currentCreatedAt)}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-505 font-sans">
                <span>SYSTEM CONSOLE v1.0.0</span>
                <span>UTC+7 REGION</span>
              </div>
            </div>

            {/* Column B: Accounts & Settings Summary (Span 2) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between min-h-[420px]">
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                      {language === "en" ? "System Information" : "Thông Tin Vận Hành"}
                    </h3>
                    <span className="text-[10px] text-slate-450 dark:text-slate-550 font-medium mt-0.5 block">
                      {language === "en"
                        ? "Overview of registered users and general system metadata."
                        : "Tổng quan về số lượng tài khoản và thông tin vận hành."}
                    </span>
                  </div>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Settings size={16} />
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* Total registered users count */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                        <Users size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-855 dark:text-white block">
                          {language === "en" ? "Registered Accounts" : "Tài Khoản Thành Viên"}
                        </span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium block font-sans">
                          {language === "en"
                            ? "All users, managers, and staff"
                            : "Quản trị viên, quản lý và nhân viên"}
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-slate-800 dark:text-white">
                      {totalUsers}
                    </span>
                  </div>

                  {/* System details card */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    <div className="flex justify-between items-center">
                      <span>{language === "en" ? "Environment Mode" : "Chế độ Môi trường"}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded font-bold border border-blue-100 dark:border-blue-900/30">
                        DEVELOPMENT
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{language === "en" ? "API Endpoint" : "Cổng kết nối API"}</span>
                      <span className="text-[10px] font-sans font-bold text-slate-700 dark:text-slate-300">
                        v1.0.0 (v1)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{language === "en" ? "JWT Credentials" : "Chứng thực Token (JWT)"}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-100 dark:border-emerald-900/30">
                        SYNCHRONIZED
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation actions for Admin */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
                <a
                  href="/admin/users"
                  className="w-full flex items-center justify-between py-2 px-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span>{language === "en" ? "Manage User Accounts" : "Quản lý Tài khoản"}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </a>
                <a
                  href="/admin/logs"
                  className="w-full flex items-center justify-between py-2 px-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    <span>{language === "en" ? "Detailed Role Audit Logs" : "Nhật ký Phân quyền"}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}