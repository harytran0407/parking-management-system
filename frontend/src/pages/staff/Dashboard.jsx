import React, { useState, useEffect } from "react";
import {
  Car,
  LogIn,
  LogOut,
  DollarSign,
  AlertTriangle,
  Ticket,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

export default function StaffDashboard() {
  // Mock data
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Giả lập cuộc gọi API fetch dữ liệu từ endpoint /api/v1/staff/dashboard
    const fetchDashboardData = () => {
      setIsLoading(true);
      setTimeout(() => {
        setDashboardData({
          success: true,
          data: {
            current_occupancy: {
              total: 500,
              occupied: 320,
              available: 180,
              trend: "increasing", // hoặc "decreasing", "stable"
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
              {
                type: "full_floor",
                floor: 1,
                message: "Floor 1 at 95% capacity",
              },
              {
                type: "system_error",
                floor: null,
                message: "Gate In 02 camera connection unstable",
              },
            ],
          },
        });
        setIsLoading(false);
      }, 600); // Hiệu ứng loading mượt mà
    };

    fetchDashboardData();
  }, []);

  if (isLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500 font-medium animate-pulse">
          <RefreshCw className="animate-spin" size={20} />
          Loading dashboard data...
        </div>
      </div>
    );
  }

  const { current_occupancy, today_stats, pending_payments, alerts } =
    dashboardData.data;

  // Tính tỷ lệ lấp đầy bãi xe (Occupancy Rate) thực tế
  const occupancyRate = (
    (current_occupancy.occupied / current_occupancy.total) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* SECTION 1: WELCOME & REAL-TIME STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Operational Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time parking statistics for the current shift.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-200 dark:border-green-900/50">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          Live Monitoring Active
        </div>
      </div>

      {/* SECTION 2: CORE COUNTERS GRID (Today's Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Check-Ins */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Check-Ins
            </span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              {today_stats.check_ins}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <LogIn size={24} />
          </div>
        </div>

        {/* Total Check-Outs */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Check-Outs
            </span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              {today_stats.check_outs}
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <LogOut size={24} />
          </div>
        </div>

        {/* Today's Cash Revenue Collected */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Revenue
            </span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {today_stats.revenue_vnd.toLocaleString("vi-VN")}{" "}
              <span className="text-sm font-normal">VND</span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Pending Payments / Unpaid Sessions at counter */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pending Payments
            </span>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pending_payments}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <RefreshCw size={24} />
          </div>
        </div>
      </div>

      {/* SECTION 3: OCCUPANCY & LIVE ALERTS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Occupancy Visualizer Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Car size={18} className="text-blue-500" />
                Current Lot Occupancy
              </h4>
              {current_occupancy.trend === "increasing" && (
                <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-md">
                  <TrendingUp size={14} /> Traffic Rising
                </span>
              )}
            </div>

            {/* Progress Bar Display */}
            <div className="space-y-2 mt-4">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    parseFloat(occupancyRate) > 85
                      ? "bg-red-500"
                      : parseFloat(occupancyRate) > 60
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>0% Empty</span>
                <span>{occupancyRate}% Occupied</span>
                <span>100% Full</span>
              </div>
            </div>
          </div>

          {/* Sub Counters Grid */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
            <div className="text-center space-y-1">
              <span className="text-xs text-slate-400 block font-medium">
                Total Capacity
              </span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                {current_occupancy.total}
              </span>
            </div>
            <div className="text-center space-y-1 border-x border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">
                Occupied Slots
              </span>
              <span className="text-lg font-bold text-slate-800 dark:text-white">
                {current_occupancy.occupied}
              </span>
            </div>
            <div className="text-center space-y-1">
              <span className="text-xs text-slate-400 block font-medium">
                Available Empty
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {current_occupancy.available}
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Critical System & Floor Alerts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            Live System Alerts
          </h4>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[190px] pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                    alert.type === "full_floor"
                      ? "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-400"
                      : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block capitalize mb-0.5">
                      {alert.type.replace("_", " ")}
                    </span>
                    {alert.message}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 py-6">
                <span className="text-xs font-medium">
                  No active anomalies detected
                </span>
              </div>
            )}
          </div>

          {/* Sub Stats Footer (Lost Tickets & Open Exceptions) */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-xs font-medium">
            <div className="flex items-center gap-2 text-slate-500">
              <Ticket size={14} className="text-slate-400" />
              Lost Tickets:{" "}
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {today_stats.lost_tickets}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 justify-end">
              <AlertTriangle size={14} className="text-amber-500" />
              Open Incidents:{" "}
              <span className="font-bold text-amber-600">
                {today_stats.open_incidents}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
