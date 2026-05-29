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
  // ==========================================
  // STATE MANAGEMENT (Parking Staff Metrics context)
  // ==========================================
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
  });

  // ==========================================
  // [AXIOS API INTEGRATION]: LIVE BACKGROUND SYNC POLLING
  // ==========================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        /* const response = await axios.get('http://localhost:5000/api/v1/staff/dashboard');
        if (response.data.success) {
          setDashboardData(response.data.data);
        }
        */
      } catch (error) {
        console.error("Failed to sync realtime operational metrics:", error);
      }
    };

    fetchDashboardData();
    // Realtime polling loop setup: Refresh background data metrics every 30 seconds
    const syncInterval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(syncInterval);
  }, []);

  const { current_occupancy, today_stats, pending_payments, alerts } =
    dashboardData;

  // Compute absolute lot utilization percentage securely
  const occupancyRate = (
    (current_occupancy.occupied / current_occupancy.total) *
    100
  ).toFixed(1);

  return (
   
    <div className="animate-slide-in w-full h-full space-y-6">
      {/* SECTION 1: HEADER OPERATIONS META CAPTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
            Operational Overview
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Real-time parking statistics for the current system shift session.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          Live Monitoring Active
        </div>
      </div>

      {/* SECTION 2: SHIFT PERFORMANCE COUNTERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Today's Gate Entry Check-Ins */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-300">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Today's Check-Ins
            </span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              {today_stats.check_ins}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shadow-inner">
            <LogIn size={22} />
          </div>
        </div>

        {/* Metric 2: Today's Gate Terminal Check-Outs */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-300">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Today's Check-Outs
            </span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              {today_stats.check_outs}
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-inner">
            <LogOut size={22} />
          </div>
        </div>

        {/* Metric 3: Shift Cumulative Cash Financial Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-300">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Today's Revenue
            </span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {today_stats.revenue_vnd.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-bold text-slate-400 uppercase">
                đ
              </span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-inner">
            <DollarSign size={22} />
          </div>
        </div>

        {/* Metric 4: Pending Unsettled Counter Transactions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-300">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Pending Payments
            </span>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {pending_payments}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shadow-inner">
            <RefreshCw size={22} />
          </div>
        </div>
      </div>

      {/* SECTION 3: REAL-TIME TRAFFIC VISUALIZATION & CRITICAL MONITORING LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layout Column Block 1 & 2: Dynamic Occupancy Meter Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2 tracking-tight text-base">
                <Car size={18} className="text-blue-500" />
                Current Lot Occupancy Status
              </h4>
              {current_occupancy.trend === "increasing" && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-wide">
                  <TrendingUp size={12} /> Traffic Rising
                </span>
              )}
            </div>

            {/* Hardware accelerated dynamic fluid utilization progress layout indicator */}
            <div className="space-y-3 mt-6">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden border border-slate-200/20 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    parseFloat(occupancyRate) > 85
                      ? "bg-red-500 shadow-lg shadow-red-500/20"
                      : parseFloat(occupancyRate) > 60
                        ? "bg-amber-500 shadow-lg shadow-amber-500/20"
                        : "bg-blue-600 shadow-lg shadow-blue-500/20"
                  }`}
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>0% Empty</span>
                <span
                  className={
                    parseFloat(occupancyRate) > 85
                      ? "text-red-500"
                      : parseFloat(occupancyRate) > 60
                        ? "text-amber-500"
                        : "text-blue-600"
                  }
                >
                  {occupancyRate}% Capacity Filled
                </span>
                <span>100% Full</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Allocation Matrix Footprints */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-6 font-mono text-center">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-bold uppercase tracking-wider block">
                Total Capacity
              </span>
              <span className="text-lg font-black text-slate-700 dark:text-slate-400">
                {current_occupancy.total}
              </span>
            </div>
            <div className="space-y-1 border-x border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-bold uppercase tracking-wider block">
                Occupied Slots
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-white">
                {current_occupancy.occupied}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-bold uppercase tracking-wider block">
                Available Empty
              </span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                {current_occupancy.available}
              </span>
            </div>
          </div>
        </div>

        {/* Layout Column Block 3: Hardware Exceptions & Live Infrastructure System Alerts */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4 tracking-tight text-base">
              <AlertTriangle size={18} className="text-amber-500" />
              Live System Anomalies
            </h4>

            {/* Container for scrollable exceptions with custom styling layout masks */}
            <div className="space-y-2.5 overflow-y-auto max-h-[190px] pr-0.5 custom-scrollbar">
              {alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium leading-normal ${
                      alert.type === "full_floor"
                        ? "bg-red-50/40 border-red-100 dark:bg-red-950/10 dark:border-red-900/40 text-red-700 dark:text-red-400"
                        : "bg-amber-50/40 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/40 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block capitalize tracking-wide text-[11px] mb-0.5">
                        {alert.type.replace("_", " ")}
                      </span>
                      {alert.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    No anomalies active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Operational Shift Exception Metrics Footer Nodes */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-5 text-[11px] font-bold uppercase tracking-wide">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Ticket size={14} className="text-slate-400" />
              Lost Cards:{" "}
              <span className="font-black text-slate-800 dark:text-slate-300">
                {today_stats.lost_tickets}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 justify-end">
              <AlertTriangle size={14} className="text-amber-500" />
              Incidents:{" "}
              <span className="font-black text-amber-600 dark:text-amber-400">
                {today_stats.open_incidents}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
