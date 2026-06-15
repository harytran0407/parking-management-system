import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../utils/api";
import {
  Search,
  RefreshCw,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Eye,
  Activity,
  Terminal,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../hooks/useLanguage";

export default function AdminLogs() {
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    let formattedStr = dateStr;
    if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+") && !dateStr.match(/-\d{2}:\d{2}$/)) {
      formattedStr = dateStr + "Z";
    }
    return new Date(formattedStr).toLocaleString();
  };

  // System Logs Tab States
  const [activeTab, setActiveTab] = useState("role"); // "role" | "system"
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemLevel, setSystemLevel] = useState("ALL");
  const [systemPage, setSystemPage] = useState(1);
  const [systemTotalPages, setSystemTotalPages] = useState(1);
  const [systemTotalItems, setSystemTotalItems] = useState(0);
  const [systemPageSize] = useState(20);

  const mapRoleAuditLogToUiLog = (apiLog) => {
    const oldRole = apiLog.old_role_name || "None";
    const newRole = apiLog.new_role_name || "None";
    const targetName = apiLog.target_user_name || apiLog.target_user_id;
    return {
      id: `db_log_${apiLog.log_id}`,
      timestamp: apiLog.changed_at,
      level: "INFO",
      module: "AUTH",
      operator: apiLog.admin_name || apiLog.admin_id,
      targetUserName: targetName,
      ipAddress: "127.0.0.1",
      message: language === "en" 
        ? `Role updated for ${targetName} from ${oldRole} to ${newRole}`
        : `Quyền của người dùng ${targetName} thay đổi từ ${oldRole} sang ${newRole}`,
      details: {
        action: "ROLE_CHANGE",
        previousRole: oldRole,
        newRole: newRole,
        targetUserId: apiLog.target_user_id,
        targetUserName: targetName,
        adminId: apiLog.admin_id,
        logId: apiLog.log_id,
      }
    };
  };

  const fetchRoleLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/role-audit-logs");
      if (response.data && response.data.success) {
        const mapped = response.data.data.map(mapRoleAuditLogToUiLog);
        setLogs(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch role audit logs from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/logs", {
        params: {
          level: systemLevel !== "ALL" ? systemLevel : undefined,
          page: systemPage,
          page_size: systemPageSize
        }
      });
      if (response.data && response.data.success) {
        setSystemLogs(response.data.data.items || []);
        setSystemTotalPages(response.data.data.pagination?.total_pages || 1);
        setSystemTotalItems(response.data.data.pagination?.total_items || 0);
      }
    } catch (err) {
      console.error("Failed to fetch system logs from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "role") {
      fetchRoleLogs();
    } else {
      fetchSystemLogs();
    }
  }, [activeTab, systemLevel, systemPage, language]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === "role") {
        await fetchRoleLogs();
      } else {
        await fetchSystemLogs();
      }
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success(
          language === "en" ? "Logs updated." : "Đã cập nhật lịch sử nhật ký."
        );
      }, 600);
    } catch (error) {
      setIsRefreshing(false);
    }
  };

  const handleClear = () => {
    if (activeTab === "role") {
      setLogs([]);
    } else {
      setSystemLogs([]);
    }
    toast.success(
      language === "en" ? "Logs list cleared locally." : "Đã xóa danh sách hiển thị tạm thời."
    );
  };

  const handleExport = () => {
    if (activeTab === "role") {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        ["ID,Timestamp,Operator,Target User,Previous Role,New Role,Message"]
          .concat(
            filteredLogs.map(
              (l) =>
                `"${l.id}","${l.timestamp}","${l.operator}","${l.details?.targetUserId || ""}","${l.details?.previousRole || ""}","${l.details?.newRole || ""}","${l.message.replace(/"/g, '""')}"`
            )
          )
          .join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pms_role_audit_logs_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(language === "en" ? "CSV report downloaded!" : "Báo cáo CSV tải xuống thành công!");
    } else {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        ["Log ID,Timestamp,Level,Source,Message"]
          .concat(
            filteredSystemLogs.map(
              (l) =>
                `"${l.log_id}","${l.created_at || ""}","${l.log_level}","${(l.source || "").replace(/"/g, '""')}","${l.message.replace(/"/g, '""')}"`
            )
          )
          .join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pms_system_logs_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(language === "en" ? "CSV report downloaded!" : "Báo cáo CSV tải xuống thành công!");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SystemAdmin":
        return "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30";
      case "ParkingManager":
        return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30";
      case "ParkingStaff":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30";
    }
  };

  const getSystemLevelBadgeColor = (level) => {
    switch (level?.toUpperCase()) {
      case "ERROR":
      case "CRITICAL":
        return "bg-red-50 text-red-700 border border-red-200 dark:bg-red-955/20 dark:text-red-400 dark:border-red-900/30";
      case "WARNING":
        return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30";
      case "INFO":
        return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30";
    }
  };

  const filteredLogs = logs.filter((log) => {
    const targetUserId = log.details?.targetUserId || "";
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.operator.toLowerCase().includes(search.toLowerCase()) ||
      targetUserId.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const filteredSystemLogs = systemLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      (log.source || "").toLowerCase().includes(search.toLowerCase()) ||
      log.log_level.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const isSystemLog = selectedLog && 'log_id' in selectedLog;

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Terminal size={22} className="text-blue-600" />
            {activeTab === "role" 
              ? (language === "en" ? "Role Audit Logs" : "Nhật Ký Phân Quyền")
              : (language === "en" ? "System Logs" : "Nhật Ký Hệ Thống")}
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            {activeTab === "role"
              ? (language === "en"
                ? "Track and monitor administrator role assignments and history."
                : "Theo dõi và giám sát lịch sử phân chia vai trò quản trị hệ thống.")
              : (language === "en"
                ? "View system operational activities and severity logs."
                : "Xem nhật ký hoạt động vận hành và các cảnh báo mức độ từ hệ thống.")}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto text-xs font-bold">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {language === "en" ? "Refresh" : "Làm Mới"}
          </button>
          <button
            onClick={handleExport}
            disabled={activeTab === "role" ? filteredLogs.length === 0 : filteredSystemLogs.length === 0}
            className="flex-1 sm:flex-none p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <Download size={14} className="text-emerald-500 dark:text-emerald-400" />
            {language === "en" ? "Export CSV" : "Xuất File CSV"}
          </button>
          <button
            onClick={handleClear}
            disabled={activeTab === "role" ? logs.length === 0 : systemLogs.length === 0}
            className="flex-1 sm:flex-none p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} className="text-red-500 dark:text-red-400" />
            {language === "en" ? "Clear List" : "Xóa Danh Sách"}
          </button>
        </div>
      </div>

      {/* TABS SWITCHER */}
      <div className="flex border-b border-slate-200 dark:border-slate-850">
        <button
          onClick={() => {
            setActiveTab("role");
            setSearch("");
          }}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeTab === "role"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold"
              : "border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          {language === "en" ? "Role Audit Logs" : "Nhật ký phân quyền"}
        </button>
        <button
          onClick={() => {
            setActiveTab("system");
            setSearch("");
            setSystemPage(1);
          }}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeTab === "system"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold"
              : "border-transparent text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          {language === "en" ? "System Logs" : "Nhật ký hệ thống"}
        </button>
      </div>

      {/* SEARCH & FILTER PANEL */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === "role"
                ? (language === "en" ? "Search operator, user..." : "Tìm người thực hiện, người bị ảnh hưởng...")
                : (language === "en" ? "Search message, source..." : "Tìm nội dung, nguồn log...")
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-450 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {activeTab === "system" && (
          <div className="w-full md:w-48">
            <select
              value={systemLevel}
              onChange={(e) => {
                setSystemLevel(e.target.value);
                setSystemPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-colors font-bold"
            >
              <option value="ALL">{language === "en" ? "All Levels" : "Tất cả mức độ"}</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        )}
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === "role" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                  <th className="py-3 px-4">{language === "en" ? "Timestamp" : "Thời gian"}</th>
                  <th className="py-3 px-4">{language === "en" ? "Operator" : "Người thực hiện"}</th>
                  <th className="py-3 px-4">{language === "en" ? "Target User" : "Tài khoản bị ảnh hưởng"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Previous Role" : "Quyền hạn cũ"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "New Role" : "Quyền hạn mới"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Details" : "Chi tiết"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-455 text-xs">
                      <RefreshCw size={20} className="animate-spin inline-block mr-2 text-blue-500" />
                      {language === "en" ? "Loading logs..." : "Đang tải nhật ký..."}
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                      {language === "en" ? "No audit logs found." : "Không có nhật ký nào được ghi nhận."}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const details = log.details || {};
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold font-mono text-xs">
                          {formatDateTime(log.timestamp)}
                        </td>

                        {/* Admin */}
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                          {log.operator === "SYSTEM" ? (
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">SYSTEM</span>
                          ) : (
                            log.operator
                          )}
                        </td>

                        {/* Target User */}
                        <td className="py-3 px-4 text-slate-850 dark:text-white font-bold">
                          {log.targetUserName ? log.targetUserName : details.targetUserId || "-"}
                        </td>

                        {/* Old Role */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(details.previousRole)}`}>
                            {details.previousRole || "None"}
                          </span>
                        </td>

                        {/* New Role */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(details.newRole)}`}>
                            {details.newRole || "None"}
                          </span>
                        </td>

                        {/* Details Action */}
                        <td className="py-3 px-4">
                          <div className="flex justify-center items-center">
                            <button
                              onClick={() => setSelectedLog(log)}
                              title={language === "en" ? "View Details" : "Xem chi tiết"}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                  <th className="py-3 px-4">{language === "en" ? "Timestamp" : "Thời gian"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Level" : "Mức độ"}</th>
                  <th className="py-3 px-4">{language === "en" ? "Source" : "Nguồn log"}</th>
                  <th className="py-3 px-4">{language === "en" ? "Message" : "Nội dung"}</th>
                  <th className="py-3 px-4 text-center">{language === "en" ? "Details" : "Chi tiết"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-455 text-xs">
                      <RefreshCw size={20} className="animate-spin inline-block mr-2 text-blue-500" />
                      {language === "en" ? "Loading system logs..." : "Đang tải nhật ký hệ thống..."}
                    </td>
                  </tr>
                ) : filteredSystemLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium">
                      {language === "en" ? "No system logs found." : "Không có nhật ký nào được ghi nhận."}
                    </td>
                  </tr>
                ) : (
                  filteredSystemLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold font-mono text-xs whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black tracking-wide ${getSystemLevelBadgeColor(log.log_level)}`}>
                          {log.log_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-750 dark:text-slate-350 font-bold font-mono text-xs">
                        {log.source || "System"}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium max-w-lg truncate">
                        {log.message}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center items-center">
                          <button
                            onClick={() => setSelectedLog(log)}
                            title={language === "en" ? "View Details" : "Xem chi tiết"}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PAGINATION CONTROLS */}
      {activeTab === "system" && systemTotalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-4 py-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-550 dark:text-slate-450 font-bold">
            {language === "en" 
              ? `Showing page ${systemPage} of ${systemTotalPages} (${systemTotalItems} items)` 
              : `Hiển thị trang ${systemPage} / ${systemTotalPages} (${systemTotalItems} bản ghi)`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSystemPage(p => Math.max(1, p - 1))}
              disabled={systemPage <= 1 || loading}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 text-slate-655 dark:text-slate-300 rounded-lg font-bold text-xs transition-colors"
            >
              {language === "en" ? "Previous" : "Trước"}
            </button>
            <button
              onClick={() => setSystemPage(p => Math.min(systemTotalPages, p + 1))}
              disabled={systemPage >= systemTotalPages || loading}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 text-slate-655 dark:text-slate-300 rounded-lg font-bold text-xs transition-colors"
            >
              {language === "en" ? "Next" : "Sau"}
            </button>
          </div>
        </div>
      )}

      {/* PORTAL LOG DETAILS MODAL */}
      {selectedLog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl z-10 text-slate-700 dark:text-slate-350">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-550 rounded-lg">
                <Activity size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                {isSystemLog 
                  ? (language === "en" ? "System Log Details" : "Chi Tiết Nhật Ký Hệ Thống")
                  : (language === "en" ? "Role Audit Log Details" : "Chi Tiết Nhật Ký Phân Quyền")}
              </h3>
            </div>

            {isSystemLog ? (
              <div className="space-y-4 text-xs font-semibold font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Log ID</span>
                    <strong className="text-slate-850 dark:text-white font-mono">#{selectedLog.log_id}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      {language === "en" ? "Timestamp" : "Thời gian"}
                    </span>
                    <strong className="text-slate-850 dark:text-white font-mono">
                      {formatDateTime(selectedLog.created_at)}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      {language === "en" ? "Log Level" : "Mức độ log"}
                    </span>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded text-[10px] font-black tracking-wide ${getSystemLevelBadgeColor(selectedLog.log_level)}`}>
                      {selectedLog.log_level}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      {language === "en" ? "Source" : "Nguồn log"}
                    </span>
                    <strong className="text-slate-850 dark:text-white font-mono">{selectedLog.source || "System"}</strong>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    {language === "en" ? "Log Message" : "Nội dung nhật ký"}
                  </span>
                  <p className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 mt-1 leading-relaxed font-semibold whitespace-pre-wrap">
                    {selectedLog.message}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Log ID</span>
                    <strong className="text-slate-850 dark:text-white">{selectedLog.id}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      {language === "en" ? "Timestamp" : "Thời gian"}
                    </span>
                    <strong className="text-slate-850 dark:text-white">{formatDateTime(selectedLog.timestamp)}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      {language === "en" ? "Operator" : "Người thực hiện"}
                    </span>
                    <strong className="text-slate-850 dark:text-white font-mono">{selectedLog.operator}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider font-mono">
                      {language === "en" ? "Target User" : "Tài khoản bị ảnh hưởng"}
                    </span>
                    <strong className="text-slate-850 dark:text-white font-mono">
                      {selectedLog.targetUserName ? selectedLog.targetUserName : selectedLog.details?.targetUserId || "-"}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      {language === "en" ? "Previous Role" : "Quyền hạn cũ"}
                    </span>
                    <span className={`inline-block mt-0.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(selectedLog.details?.previousRole)}`}>
                      {selectedLog.details?.previousRole || "None"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                      {language === "en" ? "New Role" : "Quyền hạn mới"}
                    </span>
                    <span className={`inline-block mt-0.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(selectedLog.details?.newRole)}`}>
                      {selectedLog.details?.newRole || "None"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    {language === "en" ? "Log Message" : "Nội dung thông báo"}
                  </span>
                  <p className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 mt-1 leading-normal font-medium">
                    {selectedLog.message}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    {language === "en" ? "Event Details Payload" : "Chi tiết dữ liệu JSON"}
                  </span>
                  <pre className="bg-slate-950 dark:bg-slate-950 text-emerald-450 p-3 rounded-lg mt-1 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-850">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
