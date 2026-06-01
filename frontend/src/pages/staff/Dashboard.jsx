import React, { useState, useEffect } from "react";
import { Car, LogIn, LogOut, DollarSign, AlertTriangle, Ticket, TrendingUp, RefreshCw, Clock } from "lucide-react";
// TODO: Bỏ comment dòng dưới khi kết nối API thật
// import api from "../utils/api";

export default function StaffDashboard() {
  const [dashboardData, setDashboardData] = useState({
    current_occupancy: {
      total: 500,
      occupied: 320,
      available: 180,
      trend: "increasing",
    },
    today_stats: {
      check_ins: 156,
      check_outs: 98,
      revenue_vnd: 2150000,
      lost_tickets: 2,
      open_incidents: 5,
    },
    active_sessions_count: 320,
    pending_payments: 12,
    alerts: [
      { type: "full_floor", floor: 1, message: "Floor 1 at 95% capacity" },
      { type: "system_error", floor: null, message: "Gate In 02 camera connection unstable" },
    ],
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // ── Đồng hồ thời gian thực ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── [AXIOS] Polling tự động mỗi 30 giây ─────────────────────────────────
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // [AXIOS] Bỏ comment block dưới khi backend sẵn sàng
        // Endpoint: GET /api/v1/staff/dashboard
        // const response = await api.get("/staff/dashboard");
        // if (response.data?.success) {
        //   setDashboardData(response.data.data);
        // }
      } catch (error) {
        // Lỗi network/server sẽ được bắt bởi GlobalHttpListener
        // Không cần xử lý thêm ở đây
        console.error("Dashboard polling error:", error);
      }
    };

    fetchDashboardData();
    const syncInterval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(syncInterval);
  }, []);

  // ── [AXIOS] Manual refresh khi nhấn nút ─────────────────────────────────
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // [AXIOS] Bỏ comment block dưới khi backend sẵn sàng
      // Endpoint: GET /api/v1/staff/dashboard
      // const response = await api.get("/staff/dashboard");
      // if (response.data?.success) {
      //   setDashboardData(response.data.data);
      // }

      // Xóa dòng mock delay dưới khi đã có API thật
      await new Promise((r) => setTimeout(r, 600));
    } catch (error) {
      console.error("Manual refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  const { current_occupancy, today_stats, pending_payments, alerts, active_sessions_count } = dashboardData;

  const occupancyRate = ((current_occupancy.occupied / current_occupancy.total) * 100).toFixed(1);

  const progressColor = parseFloat(occupancyRate) > 85 ? "#E24B4A" : parseFloat(occupancyRate) > 60 ? "#BA7517" : "#185FA5";

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="w-full space-y-4 animate-slide-in pb-0">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight">Operational overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatDate(currentTime)} — {formatTime(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900/40">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            Live monitoring
          </div>
        </div>
      </div>

      {/* ── 5 METRIC CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Check-ins",
            // [AXIOS] today_stats.check_ins → response.data.data.today_stats.check_ins
            value: today_stats.check_ins,
            icon: <LogIn size={18} />,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/40",
          },
          {
            label: "Check-outs",
            // [AXIOS] today_stats.check_outs → response.data.data.today_stats.check_outs
            value: today_stats.check_outs,
            icon: <LogOut size={18} />,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-indigo-950/40",
          },
          {
            label: "Revenue",
            // [AXIOS] today_stats.revenue_vnd → response.data.data.today_stats.revenue_vnd
            value: today_stats.revenue_vnd.toLocaleString("vi-VN") + " đ",
            icon: <DollarSign size={18} />,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
            small: true,
          },
          {
            label: "Active sessions",
            // [AXIOS] active_sessions_count → response.data.data.active_sessions_count
            value: active_sessions_count,
            icon: <Car size={18} />,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/40",
          },
          {
            label: "Pending payments",
            // [AXIOS] pending_payments → response.data.data.pending_payments
            value: pending_payments,
            icon: <Clock size={18} />,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/40",
          },
        ].map((m, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`font-semibold text-slate-800 dark:text-white ${m.small ? "text-base" : "text-xl"}`}>{m.value}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${m.bg} ${m.color} shrink-0`}>{m.icon}</div>
          </div>
        ))}
      </div>

      {/* ── OCCUPANCY + ALERTS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Occupancy card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Car size={16} className="text-blue-500" />
                Lot occupancy status
              </h4>
              {current_occupancy.trend === "increasing" && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                  <TrendingUp size={11} /> Traffic rising
                </span>
              )}
            </div>

            {/* Progress bar — màu thay đổi theo ngưỡng occupancy */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${occupancyRate}%`, backgroundColor: progressColor }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1.5">
              <span>0% empty</span>
              <span style={{ color: progressColor }}>{occupancyRate}% filled</span>
              <span>100% full</span>
            </div>
          </div>

          {/* [AXIOS] current_occupancy → response.data.data.current_occupancy */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-center">
            {[
              { label: "Total capacity", value: current_occupancy.total, color: "text-slate-700 dark:text-slate-300" },
              { label: "Occupied", value: current_occupancy.occupied, color: "text-slate-800 dark:text-white" },
              { label: "Available", value: current_occupancy.available, color: "text-blue-600 dark:text-blue-400" },
            ].map((o, i) => (
              <div key={i} className={i === 1 ? "border-x border-slate-100 dark:border-slate-800" : ""}>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{o.label}</p>
                <p className={`text-lg font-semibold mt-1 ${o.color}`}>{o.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-500" />
              Live anomalies
            </h4>

            {/* [AXIOS] alerts → response.data.data.alerts */}
            <div className="space-y-2 overflow-y-auto max-h-[160px]">
              {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border flex items-start gap-2 text-xs font-medium ${
                      alert.type === "full_floor"
                        ? "bg-red-50/60 border-red-100 dark:bg-red-950/10 dark:border-red-900/40 text-red-700 dark:text-red-400"
                        : "bg-amber-50/60 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/40 text-amber-700 dark:text-amber-400"
                    }`}>
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase tracking-wide block mb-0.5">{alert.type.replace("_", " ")}</span>
                      {alert.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">No anomalies detected</div>
              )}
            </div>
          </div>

          {/* [AXIOS] today_stats.lost_tickets / open_incidents → response.data.data.today_stats */}
          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Ticket size={13} className="text-slate-400" />
              Lost tickets:
              <strong className="text-slate-700 dark:text-slate-300 ml-1">{today_stats.lost_tickets}</strong>
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={13} />
              Incidents:
              <strong className="ml-1">{today_stats.open_incidents}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
