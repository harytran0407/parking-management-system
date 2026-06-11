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

export default function AdminLogs() {
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

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
      message: `System role changed for user ${targetName} from ${oldRole} to ${newRole}`,
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

  const fetchLogs = async () => {
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success("Role audit logs updated in real-time.");
      }, 600);
    });
  };

  const handleClear = () => {
    setLogs([]);
    toast.success("Role audit logs cleared locally.");
  };

  const handleExport = () => {
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
    toast.success("Audit Logs downloaded as CSV.");
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

  const filteredLogs = logs.filter((log) => {
    const targetUserId = log.details?.targetUserId || "";
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.operator.toLowerCase().includes(search.toLowerCase()) ||
      targetUserId.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Terminal size={22} className="text-blue-600" />
            Role Audit Logs
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            Track and monitor administrator role assignments and history.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="flex-1 sm:flex-none p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={handleClear}
            disabled={logs.length === 0}
            className="flex-1 sm:flex-none p-2 bg-red-50 hover:bg-red-100/80 dark:bg-red-955/20 text-red-650 border border-red-200 dark:border-red-900/30 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
          >
            <Trash2 size={14} />
            Clear List
          </button>
        </div>
      </div>

      {/* SEARCH PANEL */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by operator, target user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-450 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4 text-center">Previous Role</th>
                <th className="py-3 px-4 text-center">New Role</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                    No role audit records match search criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const details = log.details || {};
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
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
                            title="View Details"
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
        </div>
      </div>

      {/* PORTAL LOG DETAILS MODAL */}
      {selectedLog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl z-10 text-slate-700 dark:text-slate-300">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg">
                <Activity size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
                Role Audit Log Details
              </h3>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Log ID</span>
                  <strong className="text-slate-850 dark:text-white">{selectedLog.id}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Timestamp</span>
                  <strong className="text-slate-850 dark:text-white">{new Date(selectedLog.timestamp).toLocaleString()}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Operator</span>
                  <strong className="text-slate-850 dark:text-white font-mono">{selectedLog.operator}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Target User</span>
                  <strong className="text-slate-850 dark:text-white font-mono">
                    {selectedLog.targetUserName ? selectedLog.targetUserName : selectedLog.details?.targetUserId || "-"}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Previous Role</span>
                  <span className={`inline-block mt-0.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(selectedLog.details?.previousRole)}`}>
                    {selectedLog.details?.previousRole || "None"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">New Role</span>
                  <span className={`inline-block mt-0.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(selectedLog.details?.newRole)}`}>
                    {selectedLog.details?.newRole || "None"}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Log Message</span>
                <p className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 mt-1 leading-normal font-medium">
                  {selectedLog.message}
                </p>
              </div>

              <div>
                <span className="block text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-wider">Event Details Payload</span>
                <pre className="bg-slate-950 dark:bg-slate-950 text-emerald-400 p-3 rounded-lg mt-1 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-850">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
