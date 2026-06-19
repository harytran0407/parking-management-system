import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ParkingCircle, 
  DollarSign, 
  Calendar, 
  Download, 
  CreditCard, 
  Wallet, 
  Car, 
  Bike, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  Loader2, 
  RefreshCw 
} from "lucide-react";
import api from "../../utils/api";

export default function ManagerDashboard() {
  const [period, setPeriod] = useState("day");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [data, setData] = useState(null);

  // Sample mockup data matching the exact DTO structure for Demo Mode or Empty State fallbacks
  const demoData = {
    period: "day",
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    vehicle_count: {
      total_check_ins: 148,
      total_check_outs: 112,
      currently_parked: 36,
    },
    revenue: {
      total: 5850000,
      by_payment_method: {
        CASH: 2150000,
        VNPAY: 3700000,
      },
    },
    occupancy: {
      total_slots: 450,
      occupied_slots: 268,
      occupancy_rate_percent: 59.6,
    },
    peak_hours: [
      { hour: 7, check_ins: 12 },
      { hour: 8, check_ins: 28 },
      { hour: 9, check_ins: 22 },
      { hour: 11, check_ins: 10 },
      { hour: 12, check_ins: 15 },
      { hour: 13, check_ins: 8 },
      { hour: 17, check_ins: 32 },
      { hour: 18, check_ins: 25 },
      { hour: 19, check_ins: 14 },
    ],
    breakdown_by_vehicle_type: [
      {
        vehicle_type_id: 1,
        vehicle_type_name: "Car",
        check_ins: 58,
        revenue: 3480000,
      },
      {
        vehicle_type_id: 2,
        vehicle_type_name: "Motorbike",
        check_ins: 90,
        revenue: 2370000,
      },
    ],
  };

  const fetchDashboardData = async () => {
    if (isDemoMode) {
      setData({
        ...demoData,
        period,
        from: period === "custom" ? startDate : demoData.from,
        to: period === "custom" ? endDate : demoData.to,
      });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = { period };
      if (period === "custom") {
        if (!startDate || !endDate) {
          setError("Please select both start and end dates.");
          setLoading(false);
          return;
        }
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const response = await api.get("/admin/dashboard", { params });
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setError("Failed to fetch dashboard data.");
      }
    } catch (err) {
      console.error("[Manager Dashboard API Error]:", err);
      // Auto fallback to demo mode to ensure beautiful UI rendering if local server DB is unseeded
      setError(
        "Could not connect to backend API. Switched to Interactive Demo Mode."
      );
      setIsDemoMode(true);
      setData({
        ...demoData,
        period,
        from: period === "custom" ? startDate : demoData.from,
        to: period === "custom" ? endDate : demoData.to,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, isDemoMode]);

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      if (isDemoMode) {
        // Mock download logic
        const header = "Report Period,Total Check-ins,Total Check-outs,Currently Parked,Total Revenue,Occupancy Rate\n";
        const content = `${data.from} to ${data.to},${data.vehicle_count.total_check_ins},${data.vehicle_count.total_check_outs},${data.vehicle_count.currently_parked},${data.revenue.total},${data.occupancy.occupancy_rate_percent}%\n`;
        const blob = new Blob([header + content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `demo_dashboard_report_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const params = { period };
      if (period === "custom") {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const response = await api.get("/admin/dashboard/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dashboard_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("[Export Report Failure]:", err);
      alert("Failed to export dashboard report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // Helper formatter for currency (VND)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  // Helper to get max check-ins value from peak hours to compute graph bar heights scale
  const maxCheckIns = data?.peak_hours?.length
    ? Math.max(...data.peak_hours.map((p) => p.check_ins), 10)
    : 10;

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-10">
      {/* 1. TOP HEADER & METRIC ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
              Dashboard Overview
            </h2>
            {isDemoMode && (
              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40 animate-pulse">
                DEMO MODE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Real-time parking analytics, occupancy logs, and financial breakdown report metrics.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Demo toggle switch */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition border flex items-center gap-1.5 shadow-sm
              ${
                isDemoMode
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white"
                  : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350"
              }`}
          >
            <Sparkles size={14} />
            {isDemoMode ? "Exit Demo" : "Toggle Demo data"}
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exportLoading || !data}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition flex items-center gap-2"
          >
            {exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Export Report
          </button>
        </div>
      </div>

      {/* ERROR ALERT DISPLAY */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* 2. TABBED FILTER SYSTEM & DATE RANGE SELECTOR */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Period Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full md:w-auto">
          {["day", "week", "month", "custom"].map((item) => (
            <button
              key={item}
              onClick={() => setPeriod(item)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition
                ${
                  period === item
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {period === "custom" && (
          <form
            onSubmit={handleApplyCustomFilter}
            className="flex flex-wrap items-end gap-3 w-full md:w-auto"
          >
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Start Date
              </span>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                End Date
              </span>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-2 h-[34px] rounded-xl border border-blue-100 dark:border-blue-900/60 transition"
            >
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {loading && !data ? (
        <div className="h-64 flex flex-col justify-center items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs text-slate-400">Loading analytics payload...</p>
        </div>
      ) : data ? (
        <>
          {/* 3. CORE METRIC STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Slot Occupancy Ring Gauge */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Capacity Occupancy
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {data.occupancy.occupancy_rate_percent}%
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mt-1">
                  {data.occupancy.occupied_slots} / {data.occupancy.total_slots} slots full
                </span>
              </div>
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600"
                    strokeDasharray={`${data.occupancy.occupancy_rate_percent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ParkingCircle size={16} className="text-blue-500" />
                </div>
              </div>
            </div>

            {/* Card 2: Currently Parked */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Currently Parked
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {data.vehicle_count.currently_parked}
                </span>
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                  <span>In: <strong>{data.vehicle_count.total_check_ins}</strong></span>
                  <span className="text-slate-200 dark:text-slate-800">|</span>
                  <span>Out: <strong>{data.vehicle_count.total_check_outs}</strong></span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Users size={22} />
              </div>
            </div>

            {/* Card 3: Total Revenue */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between sm:col-span-2">
              <div className="w-full">
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Period Revenue
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between w-full mt-1 gap-2">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">
                    {formatCurrency(data.revenue.total)}
                  </span>
                  
                  {/* Payment Methods breakdown bubbles */}
                  <div className="flex gap-2">
                    {Object.entries(data.revenue.by_payment_method).map(([method, amount]) => (
                      <div
                        key={method}
                        className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-lg flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400"
                      >
                        {method.toUpperCase() === "CASH" ? (
                          <Wallet size={10} className="text-emerald-500" />
                        ) : (
                          <CreditCard size={10} className="text-blue-500" />
                        )}
                        <span>{method}: {formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 self-start sm:self-center">
                <DollarSign size={22} />
              </div>
            </div>
          </div>

          {/* 4. TWO-COLUMN INTERACTIVE DETAIL CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Column A: Peak Traffic Hour Timeline (Span 3) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wider">
                    Hourly In-Traffic Distribution
                  </h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                    Displays peak check-ins hourly across the selected range.
                  </span>
                </div>
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Clock size={16} />
                </div>
              </div>

              {/* Pure CSS/SVG Timeline Bar Chart */}
              {data.peak_hours.length === 0 ? (
                <div className="h-56 flex flex-col justify-center items-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Clock size={24} className="stroke-1 mb-1.5" />
                  <span className="text-[11px]">No vehicle traffic logs found in this period.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Grid visual representation */}
                  <div className="h-48 flex items-end justify-between gap-1.5 pt-4 px-2 border-b border-slate-100 dark:border-slate-800/80 relative">
                    {/* Background helper Y-grid lines */}
                    <div className="absolute left-0 right-0 bottom-1/3 border-b border-dashed border-slate-100 dark:border-slate-850 pointer-events-none" />
                    <div className="absolute left-0 right-0 bottom-2/3 border-b border-dashed border-slate-100 dark:border-slate-850 pointer-events-none" />

                    {data.peak_hours.map((p) => {
                      const heightPercent = (p.check_ins / maxCheckIns) * 100;
                      return (
                        <div key={p.hour} className="flex-1 flex flex-col items-center group relative">
                          {/* Tooltip widget */}
                          <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none z-20 whitespace-nowrap">
                            {p.check_ins} check-ins
                          </div>
                          
                          {/* Colored bar */}
                          <div 
                            style={{ height: `${Math.max(heightPercent, 4)}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 relative overflow-hidden group-hover:brightness-95
                              ${
                                p.check_ins === maxCheckIns
                                  ? "bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-400 dark:group-hover:bg-slate-700"
                              }`}
                          />
                          
                          {/* Hourly Label */}
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 block tracking-tight font-mono">
                            {String(p.hour).padStart(2, "0")}h
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-4 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-blue-600 to-indigo-500 inline-block" />
                      Peak Traffic
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800 inline-block" />
                      Normal traffic
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Column B: Vehicle Type Breakdown (Span 2) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wider">
                      Breakdown by Vehicle Type
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                      Check-in counts and revenue split by vehicle categories.
                    </span>
                  </div>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <BarChart3 size={16} />
                  </div>
                </div>

                {/* List categories with progress lines */}
                <div className="space-y-4">
                  {data.breakdown_by_vehicle_type.map((vt) => {
                    // Calculate relative ratios
                    const totalCheckIns = data.vehicle_count.total_check_ins || 1;
                    const checkInPercent = Math.round((vt.check_ins / totalCheckIns) * 100);
                    const revenuePercent = data.revenue.total > 0 
                      ? Math.round((Number(vt.revenue) / Number(data.revenue.total)) * 100)
                      : 0;

                    return (
                      <div
                        key={vt.vehicle_type_id}
                        className="p-3 bg-slate-50/50 dark:bg-[#0b1326]/50 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-slate-700/60 shadow-sm">
                              {vt.vehicle_type_name.toLowerCase().includes("car") ? (
                                <Car size={14} className="text-blue-500" />
                              ) : (
                                <Bike size={14} className="text-indigo-500" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              {vt.vehicle_type_name}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-350">
                            {formatCurrency(vt.revenue)}
                          </span>
                        </div>

                        {/* Progress Indicators */}
                        <div className="space-y-2 text-[10px]">
                          {/* Check-ins Ratio */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400 font-semibold">
                              <span>Check-ins</span>
                              <span>
                                {vt.check_ins} ({checkInPercent}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${checkInPercent}%` }}
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>

                          {/* Revenue Contribution Ratio */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400 font-semibold">
                              <span>Revenue Contribution</span>
                              <span>{revenuePercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${revenuePercent}%` }}
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total aggregated footer statistics */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-blue-500 inline-block" />
                  Check-ins
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-emerald-500 inline-block" />
                  Revenue
                </span>
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl text-center space-y-3">
          <AlertCircle size={28} className="text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
            No dashboard analytics report generated.
          </p>
          <button
            onClick={() => setIsDemoMode(true)}
            className="btn-primary text-xs mx-auto"
          >
            Load Demo Data
          </button>
        </div>
      )}
    </div>
  );
}
