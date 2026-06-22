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
import { useLanguage } from "../../hooks/useLanguage";

// Reusable SVG-based Area Line Chart Component
function LineAreaChart({ title, subtitle, dataPoints, getValue, valueFormatter, strokeColor, gradientId, gradientColors, icon, language }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const width = 600;
  const height = 180;
  const paddingX = 45;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const maxVal = dataPoints.length
    ? Math.max(...dataPoints.map(getValue), 1)
    : 1;

  const points = dataPoints.map((p, idx) => {
    const val = getValue(p);
    const x = paddingX + (idx / (dataPoints.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (val / maxVal) * chartHeight;
    return { x, y, rawValue: val, ...p };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;

    if (points.length > 0) {
      const closest = points.reduce((prev, curr) => {
        return Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev;
      });
      setHoveredPoint(closest);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between relative h-full overflow-visible">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-black text-slate-855 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            {icon}
            {title}
          </h3>
          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-0.5 block">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-visible select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientColors.start} stopOpacity="0.4" />
              <stop offset="100%" stopColor={gradientColors.end} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y Axis Helper Grid Lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f1f5f9" className="dark:stroke-slate-800/40" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + chartHeight / 2} x2={width - paddingX} y2={paddingY + chartHeight / 2} stroke="#f1f5f9" className="dark:stroke-slate-800/40" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" className="dark:stroke-slate-850/60" />

          {/* Area under the line */}
          {areaPath && (
            <path d={areaPath} fill={`url(#${gradientId})`} />
          )}

          {/* Stroke Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Hover Indicators */}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={paddingY}
                x2={hoveredPoint.x}
                y2={height - paddingY}
                stroke={strokeColor}
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill={strokeColor}
                stroke="#fff"
                strokeWidth="2"
              />
            </>
          )}

          {/* X Axis Labels (Hours) */}
          {points.filter((_, idx) => idx % 4 === 0 || idx === points.length - 1).map((p) => (
            <text
              key={p.hour}
              x={p.x}
              y={height - 4}
              textAnchor="middle"
              className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500 font-mono"
            >
              {String(p.hour).padStart(2, "0")}h
            </text>
          ))}

          {/* Y Axis Labels (Min / Max) */}
          <text x={paddingX - 8} y={paddingY + 4} textAnchor="end" className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500 font-mono">
            {valueFormatter(maxVal)}
          </text>
          <text x={paddingX - 8} y={height - paddingY + 2} textAnchor="end" className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500 font-mono">
            0
          </text>
        </svg>

        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`
            }}
            className="absolute bg-slate-900/95 dark:bg-slate-900/95 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg -translate-x-1/2 -translate-y-full -mt-3.5 pointer-events-none z-30 flex flex-col items-center gap-0.5 border border-slate-800"
          >
            <span className="text-slate-450 text-[8px] font-extrabold uppercase tracking-wide">
              {String(hoveredPoint.hour).padStart(2, "0")}:00
            </span>
            <span className="font-extrabold">
              {valueFormatter(hoveredPoint.rawValue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { language } = useLanguage();
  const periods = [
    { key: "day", labelEn: "Today", labelVi: "Hôm nay" },
    { key: "week", labelEn: "Last 7 days", labelVi: "7 ngày qua" },
    { key: "month", labelEn: "Last 30 Days", labelVi: "30 ngày qua" },
    { key: "custom", labelEn: "Custom Range", labelVi: "Tùy chọn" }
  ];
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

  const maxVehicleRevenue = data?.breakdown_by_vehicle_type?.length
    ? Math.max(...data.breakdown_by_vehicle_type.map((vt) => Number(vt.revenue)), 1)
    : 1;

  const paymentMethods = data?.revenue?.by_payment_method ? Object.entries(data.revenue.by_payment_method) : [];
  const maxPaymentRevenue = paymentMethods.length
    ? Math.max(...paymentMethods.map(([_, amount]) => Number(amount)), 1)
    : 1;

  const avgRevenuePerCheckIn = data?.vehicle_count?.total_check_ins > 0
    ? (Number(data.revenue.total) / data.vehicle_count.total_check_ins)
    : 15000;

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-10">
      {/* 1. TOP HEADER & METRIC ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-855 dark:text-white tracking-tight">
              {language === "en" ? "Dashboard Overview" : "Tổng quan Báo cáo"}
            </h2>
            {isDemoMode && (
              <span className="bg-amber-550/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-900/40 animate-pulse">
                {language === "en" ? "DEMO MODE" : "CHẾ ĐỘ MÔ PHỎNG"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {language === "en"
              ? "Monitor occupancy, vehicle activity, and revenue in real time."
              : "Theo dõi mật độ đỗ xe, hoạt động phương tiện và doanh thu theo thời gian thực."}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Demo toggle switch */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`text-[11px] font-extrabold px-3 py-2 rounded-xl transition border flex items-center gap-1.5 shadow-xs
              ${
                isDemoMode
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white"
                  : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
              }`}
          >
            <Sparkles size={13} />
            {isDemoMode
              ? (language === "en" ? "Exit Demo" : "Thoát mô phỏng")
              : (language === "en" ? "Show Demo Data" : "Dữ liệu mô phỏng")}
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition disabled:opacity-50"
            title={language === "en" ? "Refresh Data" : "Làm mới dữ liệu"}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exportLoading || !data}
            className="bg-blue-650 bg-blue-700 disabled:bg-slate-400 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-xs hover:shadow-sm transition flex items-center gap-2"
          >
            {exportLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            {language === "en" ? "Export Report" : "Xuất báo cáo"}
          </button>
        </div>
      </div>

      {/* ERROR ALERT DISPLAY */}
      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/40 text-red-655 dark:text-red-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* 2. TABBED FILTER SYSTEM & DATE RANGE SELECTOR */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Period Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl w-full md:w-auto">
          {periods.map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition
                ${
                  period === item.key
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-black"
                    : "text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                }`}
            >
              {language === "en" ? item.labelEn : item.labelVi}
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
              <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {language === "en" ? "Start Date" : "Ngày bắt đầu"}
              </span>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {language === "en" ? "End Date" : "Ngày kết thúc"}
              </span>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-955/20 dark:hover:bg-blue-900/40 text-blue-650 dark:text-blue-400 text-xs font-bold px-4 py-2 h-[34px] rounded-xl border border-blue-100 dark:border-blue-900/60 transition"
            >
              {language === "en" ? "Apply" : "Áp dụng"}
            </button>
          </form>
        )}
      </div>

      {loading && !data ? (
        <div className="h-64 flex flex-col justify-center items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs text-slate-400">
            {language === "en" ? "Loading analytics payload..." : "Đang tải dữ liệu báo cáo..."}
          </p>
        </div>
      ) : data ? (
        <>
          {/* 3. CORE METRIC STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Slot Occupancy Ring Gauge */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {language === "en" ? "Capacity Occupancy" : "Mật độ lấp đầy"}
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {data.occupancy.occupancy_rate_percent}%
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mt-1">
                  {language === "en"
                    ? `${data.occupancy.occupied_slots} / ${data.occupancy.total_slots} slots full`
                    : `Đã đầy ${data.occupancy.occupied_slots} / ${data.occupancy.total_slots} chỗ`}
                </span>
              </div>
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-850"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      data.occupancy.occupancy_rate_percent >= 90
                        ? "text-rose-500"
                        : data.occupancy.occupancy_rate_percent >= 60
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }
                    strokeDasharray={`${data.occupancy.occupancy_rate_percent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ParkingCircle size={16} className={
                    data.occupancy.occupancy_rate_percent >= 90
                      ? "text-rose-500"
                      : data.occupancy.occupancy_rate_percent >= 60
                        ? "text-amber-500"
                        : "text-emerald-500"
                  } />
                </div>
              </div>
            </div>

            {/* Card 2: Currently Parked */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {language === "en" ? "Active Vehicles" : "Xe đang gửi"}
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {data.vehicle_count.currently_parked}
                </span>
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                  <span>{language === "en" ? "In:" : "Vào:"} <strong className="text-slate-700 dark:text-slate-300">{data.vehicle_count.total_check_ins}</strong></span>
                  <span className="text-slate-200 dark:text-slate-800">|</span>
                  <span>{language === "en" ? "Out:" : "Ra:"} <strong className="text-slate-700 dark:text-slate-300">{data.vehicle_count.total_check_outs}</strong></span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-xl">
                <Users size={22} />
              </div>
            </div>

            {/* Card 3: Total Revenue */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between sm:col-span-2">
              <div className="w-full">
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {language === "en" ? "Total Revenue" : "Tổng doanh thu"}
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between w-full mt-1 gap-2">
                  <span className="text-2xl font-black text-slate-850 dark:text-white">
                    {formatCurrency(data.revenue.total)}
                  </span>
                  <div className="flex gap-2">
                    {Object.entries(data.revenue.by_payment_method).map(([method, amount]) => (
                      <div
                        key={method}
                        className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400"
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

          {/* Row 1: TRAFFIC DASHBOARD ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch mb-6">
            <div className="lg:col-span-3">
              <LineAreaChart
                title={language === "en" ? "Vehicle Entries by Hour" : "Lượt xe vào theo giờ"}
                subtitle={language === "en" ? "Number of vehicles entering the parking lot throughout the day." : "Số lượng xe vào bãi đỗ xe theo từng khung giờ trong ngày."}
                dataPoints={data.peak_hours}
                getValue={(p) => p.check_ins}
                valueFormatter={(val) => language === "en" ? `${val} entries` : `${val} lượt vào`}
                strokeColor="#3b82f6"
                gradientId="checkinsGradient"
                gradientColors={{ start: "#3b82f6", end: "#60a5fa" }}
                icon={<Clock size={16} className="text-blue-500" />}
              />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">
                      {language === "en" ? "Vehicle Type Summary" : "Tổng hợp theo Loại xe"}
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                      {language === "en"
                        ? "Check-in counts and revenue split by vehicle categories."
                        : "Lượt xe vào và phân chia doanh thu theo loại xe."}
                    </span>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <BarChart3 size={16} />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {data.breakdown_by_vehicle_type.map((vt) => {
                    const totalCheckIns = data.vehicle_count.total_check_ins || 1;
                    const checkInPercent = Math.round((vt.check_ins / totalCheckIns) * 100);
                    const revenuePercent = data.revenue.total > 0
                      ? Math.round((Number(vt.revenue) / Number(data.revenue.total)) * 100)
                      : 0;
                    const isCar = vt.vehicle_type_name.toLowerCase().includes("car") || vt.vehicle_type_name.toLowerCase().includes("ô tô");

                    return (
                      <div key={vt.vehicle_type_id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-slate-700/60 shadow-xs">
                              {isCar ? (
                                <Car size={14} className="text-blue-500" />
                              ) : (
                                <Bike size={14} className="text-indigo-500" />
                              )}
                            </div>
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                              {vt.vehicle_type_name}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-350 font-mono">
                            {formatCurrency(vt.revenue)}
                          </span>
                        </div>

                        <div className="space-y-2 text-[10px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400 dark:text-slate-500 font-semibold">
                              <span>{language === "en" ? "Check-ins" : "Lượt xe vào"}</span>
                              <span className="font-bold text-slate-600 dark:text-slate-400">
                                {vt.check_ins} ({checkInPercent}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${checkInPercent}%` }}
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-650 rounded-full transition-all duration-350"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400 dark:text-slate-500 font-semibold">
                              <span>{language === "en" ? "Revenue Contribution" : "Đóng góp doanh thu"}</span>
                              <span className="font-bold text-slate-655 dark:text-slate-400">{revenuePercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${revenuePercent}%` }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-650 rounded-full transition-all duration-350"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  {language === "en" ? "Check-ins" : "Lượt xe vào"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                  {language === "en" ? "Revenue" : "Doanh thu"}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: REVENUE DASHBOARD ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            <div className="lg:col-span-3">
              <LineAreaChart
                title={language === "en" ? "Hourly Income" : "Doanh thu theo giờ"}
                subtitle={language === "en" ? "Revenue generated each hour from parking fees and ticket payments." : "Doanh thu phát sinh mỗi giờ từ phí đỗ xe và thanh toán."}
                dataPoints={data.peak_hours}
                getValue={(p) => p.check_ins * avgRevenuePerCheckIn}
                valueFormatter={(val) => formatCurrency(val)}
                strokeColor="#10b981"
                gradientId="revenueGradient"
                gradientColors={{ start: "#10b981", end: "#34d399" }}
                icon={<TrendingUp size={16} className="text-emerald-500" />}
              />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between overflow-visible">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-855 dark:text-white uppercase tracking-wider">
                      {language === "en" ? "Revenue Sources" : "Nguồn doanh thu"}
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                      {language === "en" ? "Income distribution by payment channels." : "Phân bổ doanh thu theo kênh thanh toán."}
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450 rounded-xl">
                    <DollarSign size={16} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {language === "en" ? "Payment Channels" : "Kênh thanh toán"}
                    </span>
                    {paymentMethods.map(([method, amount]) => {
                      const percent = data.revenue.total > 0
                        ? Math.round((Number(amount) / Number(data.revenue.total)) * 100)
                        : 0;
                      return (
                        <div key={method} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1 font-bold">
                              {method.toUpperCase() === "CASH" ? <Wallet size={12} className="text-amber-500" /> : <CreditCard size={12} className="text-blue-500" />}
                              {method}
                            </span>
                            <span className="font-bold">{formatCurrency(amount)} ({percent}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${percent}%` }}
                              className={`h-full rounded-full transition-all duration-355 ${
                                method.toUpperCase() === "VNPAY" ? "bg-gradient-to-r from-blue-500 to-sky-400" : "bg-gradient-to-r from-amber-500 to-orange-400"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-455">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  {language === "en" ? "Online (VNPAY)" : "Trực tuyến (VNPAY)"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                  {language === "en" ? "Cash (CASH)" : "Tiền mặt (CASH)"}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl text-center space-y-3">
          <AlertCircle size={28} className="text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
            {language === "en" ? "No dashboard analytics report generated." : "Chưa tạo báo cáo thống kê."}
          </p>
          <button
            onClick={() => setIsDemoMode(true)}
            className="btn-primary text-xs mx-auto"
          >
            {language === "en" ? "Load Demo Data" : "Tải dữ liệu mẫu"}
          </button>
        </div>
      )}
    </div>
  );
}
