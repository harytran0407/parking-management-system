import React, { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format VND currency */
const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0
  );

/**
 * Normalize raw peak_hours array (sparse, only hours with activity) into a
 * full 24-point dataset so the line chart never has unexplained gaps.
 */
function normalize24h(peakHours = []) {
  const map = {};
  peakHours.forEach((p) => {
    map[p.hour] = p;
  });
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    check_ins: map[h]?.check_ins ?? 0,
    revenue: map[h]?.revenue ?? 0,
  }));
}

// ─── SVG Area Line Chart ─────────────────────────────────────────────────────

function LineAreaChart({
  title,
  subtitle,
  dataPoints,
  getValue,
  valueFormatter,
  strokeColor,
  gradientId,
  gradientStart,
  icon,
  warning,
  language,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const W = 600;
  const H = 170;
  const PX = 48;
  const PY = 18;
  const cW = W - PX * 2;
  const cH = H - PY * 2;

  const maxVal = Math.max(...dataPoints.map(getValue), 1);

  const points = dataPoints.map((p, idx) => ({
    ...p,
    x: PX + (idx / (dataPoints.length - 1)) * cW,
    y: PY + cH - (getValue(p) / maxVal) * cH,
    rawValue: getValue(p),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${H - PY} L ${points[0].x} ${H - PY} Z`
    : "";

  const peakPoint = points.reduce(
    (best, p) => (p.rawValue > best.rawValue ? p : best),
    points[0] || { rawValue: 0 }
  );

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const xSvg = xRatio * W;
    const closest = points.reduce((prev, curr) =>
      Math.abs(curr.x - xSvg) < Math.abs(prev.x - xSvg) ? curr : prev
    );
    setHoveredPoint(closest);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3 h-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[11px] font-black text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            {icon}
            {title}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Estimated-data warning */}
      {warning && (
        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg">
          <AlertTriangle size={11} />
          {language === "en"
            ? "Estimated values — actual hourly revenue requires backend support."
            : "Giá trị ước tính — doanh thu theo giờ thực cần backend hỗ trợ."}
        </div>
      )}

      <div
        className="relative w-full select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientStart} stopOpacity="0.3" />
              <stop offset="100%" stopColor={gradientStart} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={PX}
              y1={PY + t * cH}
              x2={W - PX}
              y2={PY + t * cH}
              stroke={t === 1 ? "#cbd5e1" : "#f1f5f9"}
              className={t === 1 ? "dark:stroke-slate-700" : "dark:stroke-slate-800/40"}
              strokeDasharray={t === 1 ? undefined : "3 3"}
              strokeWidth={t === 1 ? 1 : 0.8}
            />
          ))}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* Stroke */}
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

          {/* Peak indicator */}
          {peakPoint && peakPoint.rawValue > 0 && (
            <>
              <line
                x1={peakPoint.x}
                y1={PY}
                x2={peakPoint.x}
                y2={H - PY}
                stroke={strokeColor}
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.5"
              />
              <circle cx={peakPoint.x} cy={peakPoint.y} r="5" fill={strokeColor} stroke="#fff" strokeWidth="2" />
            </>
          )}

          {/* Hover crosshair */}
          {hoveredPoint && hoveredPoint.rawValue > 0 && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={PY}
                x2={hoveredPoint.x}
                y2={H - PY}
                stroke={strokeColor}
                strokeDasharray="3 3"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill={strokeColor} stroke="#fff" strokeWidth="2" />
            </>
          )}

          {/* X-axis hour labels — every 4 hours */}
          {points
            .filter((_, i) => i % 4 === 0 || i === points.length - 1)
            .map((p) => (
              <text
                key={p.hour}
                x={p.x}
                y={H - 3}
                textAnchor="middle"
                fontSize="9"
                fill={
                  peakPoint && p.hour === peakPoint.hour
                    ? strokeColor
                    : "#94a3b8"
                }
                fontWeight={peakPoint && p.hour === peakPoint.hour ? "700" : "500"}
              >
                {String(p.hour).padStart(2, "0")}h
              </text>
            ))}

          {/* Y-axis labels */}
          <text x={PX - 6} y={PY + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
            {valueFormatter(maxVal)}
          </text>
          <text x={PX - 6} y={H - PY + 2} textAnchor="end" fontSize="9" fill="#94a3b8">
            0
          </text>
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              left: `${(hoveredPoint.x / W) * 100}%`,
              top: `${(hoveredPoint.y / H) * 100}%`,
            }}
            className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full -mt-3 bg-slate-900/95 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-lg flex flex-col items-center gap-0.5"
          >
            <span className="text-slate-400 text-[8px] font-extrabold uppercase tracking-wide">
              {String(hoveredPoint.hour).padStart(2, "0")}:00
            </span>
            <span>{valueFormatter(hoveredPoint.rawValue)}</span>
          </div>
        )}
      </div>

      {/* Summary stats row */}
      {peakPoint && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-2">
          {[
            {
              label: language === "en" ? "Busiest hour" : "Giờ cao điểm",
              value: `${String(peakPoint.hour).padStart(2, "0")}:00`,
            },
            {
              label: language === "en" ? "Peak value" : "Giá trị đỉnh",
              value: valueFormatter(peakPoint.rawValue),
            },
            {
              label: language === "en" ? "Active hours" : "Giờ có hoạt động",
              value: dataPoints.filter((p) => getValue(p) > 0).length,
            },
            {
              label: language === "en" ? "Avg/hour" : "TB/giờ",
              value: valueFormatter(
                Math.round(
                  dataPoints.reduce((s, p) => s + getValue(p), 0) /
                  Math.max(dataPoints.filter((p) => getValue(p) > 0).length, 1)
                )
              ),
            },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-[13px] font-black text-slate-800 dark:text-white leading-tight">
                {item.value}
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ slices }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;

  let offset = 0;
  const segments = slices.map((sl) => {
    const pct = sl.value / total;
    const dash = pct * circ;
    const seg = { ...sl, dash, gap: circ - dash, offset };
    offset += dash;
    return seg;
  });

  const largest = segments.reduce((a, b) => (a.value > b.value ? a : b), segments[0]);

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="15" />
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth="15"
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={-seg.offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      ))}
      {largest && (
        <>
          <text x="50" y="47" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" className="fill-slate-800 dark:fill-white">
            {Math.round((largest.value / total) * 100)}%
          </text>
          <text x="50" y="58" textAnchor="middle" fontSize="8" fill="#94a3b8">
            {largest.label}
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_DATA = {
  period: "day",
  from: new Date().toISOString().slice(0, 10),
  to: new Date().toISOString().slice(0, 10),
  vehicle_count: { total_check_ins: 148, total_check_outs: 112, currently_parked: 36 },
  revenue: {
    total: 5850000,
    by_payment_method: { CASH: 2150000, VNPAY: 3700000 },
  },
  occupancy: { total_slots: 450, occupied_slots: 268, occupancy_rate_percent: 59.6 },
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
    { vehicle_type_id: 1, vehicle_type_name: "Car", check_ins: 58, revenue: 3480000 },
    { vehicle_type_id: 2, vehicle_type_name: "Motorbike", check_ins: 90, revenue: 2370000 },
  ],
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { language } = useLanguage();

  const periods = [
    { key: "day", labelEn: "Today", labelVi: "Hôm nay" },
    { key: "week", labelEn: "Last 7 days", labelVi: "7 ngày qua" },
    { key: "month", labelEn: "Last 30 days", labelVi: "30 ngày qua" },
    { key: "custom", labelEn: "Custom range", labelVi: "Tùy chọn" },
  ];

  const [period, setPeriod] = useState("day");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [data, setData] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDashboardData = async () => {
    if (isDemoMode) {
      setData({ ...DEMO_DATA, period });
      return;
    }
    try {
      setLoading(true);
      setError("");
      const params = { period };
      if (period === "custom") {
        if (!startDate || !endDate) {
          setError(
            language === "en"
              ? "Please select both start and end dates."
              : "Vui lòng chọn ngày bắt đầu và kết thúc."
          );
          return;
        }
        params.start_date = startDate;
        params.end_date = endDate;
      }
      const response = await api.get("/admin/dashboard", { params });
      if (response.data?.success) {
        setData(response.data.data);
      } else {
        setError(
          language === "en"
            ? "Failed to fetch dashboard data."
            : "Không thể tải dữ liệu dashboard."
        );
      }
    } catch (err) {
      console.error("[ManagerDashboard] API error:", err);
      setError(
        language === "en"
          ? "Could not connect to backend — switched to demo mode."
          : "Không kết nối được backend — đã chuyển sang chế độ mô phỏng."
      );
      setIsDemoMode(true);
      setData({ ...DEMO_DATA, period });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, isDemoMode]);

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      if (isDemoMode) {
        const header =
          "Period,From,To,Check-ins,Check-outs,Currently Parked,Total Revenue,Occupancy Rate\n";
        const row = `${data.period},${data.from},${data.to},${data.vehicle_count.total_check_ins},${data.vehicle_count.total_check_outs},${data.vehicle_count.currently_parked},${data.revenue.total},${data.occupancy.occupancy_rate_percent}%\n`;
        const blob = new Blob([header + row], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `demo_report_${period}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[Export]", err);
      alert(
        language === "en"
          ? "Export failed. Please try again."
          : "Xuất báo cáo thất bại. Vui lòng thử lại."
      );
    } finally {
      setExportLoading(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const normalizedHours = normalize24h(data?.peak_hours);

  const avgRevenuePerCheckIn =
    data?.vehicle_count?.total_check_ins > 0
      ? Number(data.revenue.total) / data.vehicle_count.total_check_ins
      : 0;

  const peakHour = normalizedHours.reduce(
    (best, p) => (p.check_ins > best.check_ins ? p : best),
    normalizedHours[0] || { hour: 0, check_ins: 0 }
  );

  const paymentMethods = data?.revenue?.by_payment_method
    ? Object.entries(data.revenue.by_payment_method)
    : [];

  const occupancyColor =
    data?.occupancy?.occupancy_rate_percent >= 90
      ? "text-rose-500"
      : data?.occupancy?.occupancy_rate_percent >= 60
        ? "text-amber-500"
        : "text-emerald-500";

  const occupancyTag =
    data?.occupancy?.occupancy_rate_percent >= 90
      ? { label: language === "en" ? "Critical" : "Gần đầy", cls: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/40" }
      : data?.occupancy?.occupancy_rate_percent >= 60
        ? { label: language === "en" ? "Moderate" : "Trung bình", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40" }
        : { label: language === "en" ? "Normal" : "Bình thường", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40" };

  const donutSlices = [
    { label: "VNPAY", value: data?.revenue?.by_payment_method?.VNPAY ?? 0, color: "#2563eb" },
    { label: "CASH", value: data?.revenue?.by_payment_method?.CASH ?? 0, color: "#f59e0b" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-slide-in font-sans pb-10">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {language === "en" ? "Dashboard overview" : "Tổng quan báo cáo"}
            </h2>
            {isDemoMode && (
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50 animate-pulse">
                {language === "en" ? "DEMO" : "MÔ PHỎNG"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {language === "en"
              ? "Monitor occupancy, vehicle activity, and revenue in real time."
              : "Theo dõi mật độ đỗ xe, hoạt động phương tiện và doanh thu theo thời gian thực."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDemoMode((d) => !d)}
            className={`text-[11px] font-extrabold px-3 py-2 rounded-xl transition border flex items-center gap-1.5 shadow-xs ${isDemoMode
                ? "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white"
                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
          >
            <Sparkles size={13} />
            {isDemoMode
              ? (language === "en" ? "Exit demo" : "Thoát mô phỏng")
              : (language === "en" ? "Show demo data" : "Dữ liệu mô phỏng")}
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            title={language === "en" ? "Refresh" : "Làm mới"}
            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exportLoading || !data}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-2"
          >
            {exportLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {language === "en" ? "Export CSV" : "Xuất CSV"}
          </button>
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* ── FILTER BAR ── */}
      <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto">
          {periods.map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${period === item.key
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-black"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                }`}
            >
              {language === "en" ? item.labelEn : item.labelVi}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <form
            onSubmit={(e) => { e.preventDefault(); fetchDashboardData(); }}
            className="flex flex-wrap items-end gap-3 w-full md:w-auto"
          >
            {[
              { label: language === "en" ? "Start date" : "Ngày bắt đầu", value: startDate, set: setStartDate },
              { label: language === "en" ? "End date" : "Ngày kết thúc", value: endDate, set: setEndDate },
            ].map(({ label, value, set }) => (
              <div key={label} className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {label}
                </span>
                <div className="relative">
                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-2 h-[34px] rounded-xl border border-blue-100 dark:border-blue-900/60 transition"
            >
              {language === "en" ? "Apply" : "Áp dụng"}
            </button>
          </form>
        )}
      </div>

      {/* ── LOADING STATE ── */}
      {loading && !data && (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs text-slate-400">
            {language === "en" ? "Loading analytics..." : "Đang tải dữ liệu..."}
          </p>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      {data && (
        <>
          {/* ── KPI CARDS: 4 hero metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* 1. Occupancy */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {language === "en" ? "Occupancy" : "Mật độ lấp đầy"}
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white">
                  {data.occupancy.occupancy_rate_percent}%
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">
                    {data.occupancy.occupied_slots}/{data.occupancy.total_slots}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${occupancyTag.cls}`}>
                    {occupancyTag.label}
                  </span>
                </div>
              </div>
              <div className="relative w-14 h-14 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path className="text-slate-100 dark:text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path
                    className={occupancyColor}
                    strokeDasharray={`${data.occupancy.occupancy_rate_percent}, 100`}
                    strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ParkingCircle size={16} className={occupancyColor} />
                </div>
              </div>
            </div>

            {/* 2. Active vehicles */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {language === "en" ? "Currently parked" : "Xe đang gửi"}
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white">
                  {data.vehicle_count.currently_parked}
                </span>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <span>{language === "en" ? "In:" : "Vào:"} <strong className="text-slate-700 dark:text-slate-300">{data.vehicle_count.total_check_ins}</strong></span>
                  <span className="text-slate-200 dark:text-slate-700">|</span>
                  <span>{language === "en" ? "Out:" : "Ra:"} <strong className="text-slate-700 dark:text-slate-300">{data.vehicle_count.total_check_outs}</strong></span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Users size={22} />
              </div>
            </div>

            {/* 3. Revenue */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {language === "en" ? "Total revenue" : "Tổng doanh thu"}
                </span>
                <span className="block text-xl font-black text-slate-800 dark:text-white">
                  {formatCurrency(data.revenue.total)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {language === "en" ? "Avg/vehicle:" : "TB/xe:"}{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {formatCurrency(Math.round(avgRevenuePerCheckIn))}
                  </strong>
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <DollarSign size={22} />
              </div>
            </div>

            {/* 4. Peak hour — NEW */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {language === "en" ? "Peak hour" : "Giờ cao điểm"}
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white">
                  {String(peakHour.hour).padStart(2, "0")}:00
                </span>
                <span className="text-[11px] text-slate-400">
                  {peakHour.check_ins}{" "}
                  {language === "en" ? "entries · busiest slot" : "lượt vào · đỉnh cao nhất"}
                </span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Clock size={22} />
              </div>
            </div>
          </div>

          {/* ── ROW 1: Traffic chart + Vehicle type panel ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
            <div className="lg:col-span-3">
              <LineAreaChart
                title={language === "en" ? "Vehicle entries by hour" : "Lượt xe vào theo giờ"}
                subtitle={
                  language === "en"
                    ? "Normalized to 24 hours — missing slots show 0 entries."
                    : "Chuẩn hóa 24 giờ — các khung giờ không có dữ liệu hiển thị 0 lượt."
                }
                dataPoints={normalizedHours}
                getValue={(p) => p.check_ins}
                valueFormatter={(v) => (language === "en" ? `${v} entries` : `${v} lượt`)}
                strokeColor="#2563eb"
                gradientId="checkinsGrad"
                gradientStart="#2563eb"
                icon={<Clock size={14} className="text-blue-500" />}
                language={language}
              />
            </div>

            {/* Vehicle type breakdown */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[11px] font-black text-slate-700 dark:text-white uppercase tracking-wider">
                    {language === "en" ? "Vehicle type breakdown" : "Tổng hợp theo loại xe"}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === "en"
                      ? "Check-in share and revenue by category."
                      : "Tỉ lệ lượt vào và đóng góp doanh thu theo loại xe."}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <BarChart3 size={15} />
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                {data.breakdown_by_vehicle_type.map((vt) => {
                  const totalIn = data.vehicle_count.total_check_ins || 1;
                  const inPct = Math.round((vt.check_ins / totalIn) * 100);
                  const revPct = data.revenue.total > 0
                    ? Math.round((Number(vt.revenue) / Number(data.revenue.total)) * 100)
                    : 0;
                  const isCar =
                    vt.vehicle_type_name.toLowerCase().includes("car") ||
                    vt.vehicle_type_name.toLowerCase().includes("ô tô");

                  return (
                    <div key={vt.vehicle_type_id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-xs">
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
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">
                          {formatCurrency(vt.revenue)}
                        </span>
                      </div>

                      <div className="space-y-2 text-[10px]">
                        {[
                          {
                            label: language === "en" ? "Check-ins" : "Lượt xe vào",
                            pct: inPct,
                            count: vt.check_ins,
                            color: "bg-blue-500",
                          },
                          {
                            label: language === "en" ? "Revenue share" : "Đóng góp doanh thu",
                            pct: revPct,
                            color: "bg-emerald-500",
                          },
                        ].map(({ label, pct, count, color }) => (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-slate-400 dark:text-slate-500 font-semibold">
                              <span>{label}</span>
                              <span className="font-bold text-slate-600 dark:text-slate-400">
                                {count !== undefined ? `${count} (${pct}%)` : `${pct}%`}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full ${color} rounded-full transition-all duration-300`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[10px] font-bold text-slate-400">
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

          {/* ── ROW 2: Revenue chart + Payment methods ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
            <div className="lg:col-span-3">
              <LineAreaChart
                title={language === "en" ? "Hourly income" : "Doanh thu theo giờ"}
                subtitle={
                  language === "en"
                    ? "Revenue generated each hour from parking fees."
                    : "Doanh thu phát sinh mỗi giờ từ phí đỗ xe."
                }
                dataPoints={normalizedHours}
                getValue={(p) => Math.round(p.check_ins * avgRevenuePerCheckIn)}
                valueFormatter={formatCurrency}
                strokeColor="#10b981"
                gradientId="revenueGrad"
                gradientStart="#10b981"
                icon={<TrendingUp size={14} className="text-emerald-500" />}
                /* Show warning only when backend doesn't return per-hour revenue */
                warning={!normalizedHours.some((p) => p.revenue > 0)}
                language={language}
              />
            </div>

            {/* Payment methods */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-[11px] font-black text-slate-700 dark:text-white uppercase tracking-wider">
                    {language === "en" ? "Payment channels" : "Kênh thanh toán"}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === "en"
                      ? "Revenue split by payment method."
                      : "Phân bổ doanh thu theo hình thức thanh toán."}
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <DollarSign size={15} />
                </div>
              </div>

              {/* Donut chart */}
              <div className="my-3">
                <DonutChart slices={donutSlices} />
              </div>

              {/* Payment bars */}
              <div className="space-y-4 flex-1">
                {paymentMethods.map(([method, amount]) => {
                  const pct = data.revenue.total > 0
                    ? Math.round((Number(amount) / Number(data.revenue.total)) * 100)
                    : 0;
                  const isVnpay = method.toUpperCase() === "VNPAY";
                  return (
                    <div key={method} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 font-bold">
                          {isVnpay ? (
                            <CreditCard size={12} className="text-blue-500" />
                          ) : (
                            <Wallet size={12} className="text-amber-500" />
                          )}
                          {method}
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(amount)}{" "}
                          <span className="text-slate-400 font-medium">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${isVnpay ? "bg-blue-500" : "bg-amber-500"
                            }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-bold">
                  {language === "en" ? "Total" : "Tổng cộng"}
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">
                  {formatCurrency(data.revenue.total)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && !data && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-10 rounded-2xl text-center space-y-3">
          <AlertCircle size={28} className="text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
            {language === "en" ? "No data available." : "Chưa có dữ liệu."}
          </p>
          <button
            onClick={() => setIsDemoMode(true)}
            className="mx-auto text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition"
          >
            <Sparkles size={13} />
            {language === "en" ? "Load demo data" : "Tải dữ liệu mô phỏng"}
          </button>
        </div>
      )}
    </div>
  );
}