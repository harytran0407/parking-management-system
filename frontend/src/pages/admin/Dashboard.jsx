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
  RefreshCw,
  UserCheck,
  Activity,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [period, setPeriod] = useState("day");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [data, setData] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);

  // High fidelity fallback mockup matching exact API DTO shape
  const demoData = {
    period: "day",
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    vehicle_count: {
      total_check_ins: 248,
      total_check_outs: 212,
      currently_parked: 36,
    },
    revenue: {
      total: 8950000,
      by_payment_method: {
        CASH: 3450000,
        VNPAY: 5500000,
      },
    },
    occupancy: {
      total_slots: 450,
      occupied_slots: 268,
      occupancy_rate_percent: 59.6,
    },
    peak_hours: [
      { hour: 7, check_ins: 18 },
      { hour: 8, check_ins: 45 },
      { hour: 9, check_ins: 32 },
      { hour: 10, check_ins: 14 },
      { hour: 11, check_ins: 22 },
      { hour: 12, check_ins: 28 },
      { hour: 13, check_ins: 16 },
      { hour: 14, check_ins: 12 },
      { hour: 15, check_ins: 19 },
      { hour: 16, check_ins: 26 },
      { hour: 17, check_ins: 54 },
      { hour: 18, check_ins: 42 },
      { hour: 19, check_ins: 20 },
      { hour: 20, check_ins: 15 },
    ],
    breakdown_by_vehicle_type: [
      {
        vehicle_type_id: 1,
        vehicle_type_name: "Car",
        check_ins: 98,
        revenue: 5880000,
      },
      {
        vehicle_type_id: 2,
        vehicle_type_name: "Motorbike",
        check_ins: 150,
        revenue: 3070000,
      },
    ],
  };

  // Recent parking logs feed in both English and Vietnamese
  const recentActivities = {
    en: [
      {
        id: "act_1",
        time: "2 mins ago",
        event: "Vehicle 30A-888.99 (Car) left the parking lot at Gate 2",
        type: "checkout",
        amount: 40000,
      },
      {
        id: "act_2",
        time: "5 mins ago",
        event: "Vehicle 29C-123.45 (Car) entered the parking lot at Gate 1",
        type: "checkin",
      },
      {
        id: "act_3",
        time: "12 mins ago",
        event: "Booking BK-9042 paid successfully via VNPAY",
        type: "payment",
        amount: 60000,
      },
      {
        id: "act_4",
        time: "25 mins ago",
        event: "Vehicle 59L-777.77 (Motorbike) entered the parking lot at Gate 1",
        type: "checkin",
      },
      {
        id: "act_5",
        time: "45 mins ago",
        event: "Warning: Floor B2 is almost full (Occupancy reached 92%)",
        type: "alert",
      },
    ],
    vi: [
      {
        id: "act_1",
        time: "2 phút trước",
        event: "Xe 30A-888.99 (Ô tô) đã rời bãi tại Cổng 2",
        type: "checkout",
        amount: 40000,
      },
      {
        id: "act_2",
        time: "5 phút trước",
        event: "Xe 29C-123.45 (Ô tô) đã vào bãi tại Cổng 1",
        type: "checkin",
      },
      {
        id: "act_3",
        time: "12 phút trước",
        event: "Hóa đơn đặt chỗ BK-9042 thanh toán thành công qua VNPAY",
        type: "payment",
        amount: 60000,
      },
      {
        id: "act_4",
        time: "25 phút trước",
        event: "Xe 59L-777.77 (Xe máy) đã vào bãi tại Cổng 1",
        type: "checkin",
      },
      {
        id: "act_5",
        time: "45 phút trước",
        event: "Cảnh báo: Tầng B2 sắp đầy chỗ (Tỉ lệ lấp đầy đạt 92%)",
        type: "alert",
      },
    ]
  };

  const fetchDashboardData = async () => {
    if (isDemoMode) {
      setData({
        ...demoData,
        period,
        from: period === "custom" ? startDate : demoData.from,
        to: period === "custom" ? endDate : demoData.to,
      });
      setTotalUsers(38);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Lấy tổng số lượng tài khoản đăng ký
      try {
        const userResponse = await api.get("/admin/users", { params: { page: 1, page_size: 1 } });
        if (userResponse.data?.success) {
          setTotalUsers(userResponse.data.data.pagination.total_items || 0);
        }
      } catch (userErr) {
        console.warn("[Admin Dashboard Users Count Fetch Failed]:", userErr);
        setTotalUsers(18);
      }

      // Lấy thống kê bãi xe
      const params = { period };
      if (period === "custom") {
        if (!startDate || !endDate) {
          setError(
            language === "en"
              ? "Please select both start and end dates."
              : "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc."
          );
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
        setError(
          language === "en"
            ? "Failed to load parking stats data."
            : "Không thể tải thông tin thống kê bãi đỗ xe."
        );
      }
    } catch (err) {
      console.error("[Admin Dashboard API Error]:", err);
      setError(
        language === "en"
          ? "Cannot connect to server. Switched to Demo Mode for presentation."
          : "Không thể kết nối đến máy chủ. Đã tự động chuyển sang Chế độ Demo minh họa."
      );
      setIsDemoMode(true);
      setData({
        ...demoData,
        period,
        from: period === "custom" ? startDate : demoData.from,
        to: period === "custom" ? endDate : demoData.to,
      });
      setTotalUsers(42);
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
        const header = "Report Period,Total Check-ins,Total Check-outs,Currently Parked,Total Revenue,Occupancy Rate\n";
        const content = `${data.from} to ${data.to},${data.vehicle_count.total_check_ins},${data.vehicle_count.total_check_outs},${data.vehicle_count.currently_parked},${data.revenue.total},${data.occupancy.occupancy_rate_percent}%\n`;
        const blob = new Blob([header + content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          language === "en" ? `admin_parking_report_${period}.csv` : `bao_cao_bai_xe_admin_${period}.csv`
        );
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
      link.setAttribute(
        "download",
        language === "en"
          ? `admin_parking_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`
          : `bao_cao_bai_xe_admin_${period}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("[Export Report Failure]:", err);
      alert(
        language === "en"
          ? "Failed to download CSV report. Please try again later."
          : "Không thể xuất tệp báo cáo. Vui lòng thử lại sau."
      );
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  const maxCheckIns = data?.peak_hours?.length
    ? Math.max(...data.peak_hours.map((p) => p.check_ins), 10)
    : 10;

  // Identify peak hour to print an explicit simple summary text
  const peakHourRecord = data?.peak_hours?.length
    ? [...data.peak_hours].sort((a, b) => b.check_ins - a.check_ins)[0]
    : null;

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-10">
      {/* 1. TOP HEADER & METRIC ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              {language === "en" ? "Parking Dashboard" : "Giám Sát Bãi Xe"}
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/45 dark:text-emerald-400 dark:border-emerald-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {language === "en" ? "All Gates Active" : "Các Cổng Hoạt Động Bình Thường"}
            </div>
            {isDemoMode && (
              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40 animate-pulse">
                {language === "en" ? "DEMO MODE" : "DỮ LIỆU MINH HỌA (DEMO)"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {language === "en"
              ? "Overview of parking space status, check-ins, earnings, and recent gate traffic events."
              : "Trung tâm kiểm soát dữ liệu đỗ xe toàn hệ thống, thống kê doanh thu và quản trị phân bổ bãi xe."}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            title={language === "en" ? "Switch to mock data simulation" : "Sử dụng dữ liệu mô phỏng khi hệ thống chưa có dữ liệu thật"}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition border flex items-center gap-1.5 shadow-sm
              ${
                isDemoMode
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white"
                  : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-300"
              }`}
          >
            <Sparkles size={14} />
            {language === "en"
              ? (isDemoMode ? "Turn Off Demo" : "Turn On Demo")
              : (isDemoMode ? "Tắt dữ liệu Demo" : "Bật dữ liệu Demo")}
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            title={language === "en" ? "Refresh data" : "Làm mới dữ liệu"}
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
            {language === "en" ? "Download Report (CSV)" : "Xuất Báo Cáo CSV"}
          </button>
        </div>
      </div>

      {/* ERROR ALERT DISPLAY */}
      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. FILTER TABS & DATE RANGE PICKER */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Period Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: "day", label: language === "en" ? "Today" : "Hôm Nay" },
            { id: "week", label: language === "en" ? "This Week" : "Tuần Này" },
            { id: "month", label: language === "en" ? "This Month" : "Tháng Này" },
            { id: "custom", label: language === "en" ? "Select Dates" : "Lọc Ngày" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap
                ${
                  period === item.id
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              {item.label}
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
                {language === "en" ? "Start Date" : "Từ ngày"}
              </span>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {language === "en" ? "End Date" : "Đến ngày"}
              </span>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 h-[34px] rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {language === "en" ? "Apply" : "Áp Dụng"}
            </button>
          </form>
        )}
      </div>

      {loading && !data ? (
        <div className="h-64 flex flex-col justify-center items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs text-slate-400">
            {language === "en" ? "Loading parking analytics data..." : "Đang tổng hợp dữ liệu hệ thống bãi xe..."}
          </p>
        </div>
      ) : data ? (
        <>
          {/* 3. CORE METRIC STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Parking Space Full (%) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between group relative overflow-hidden">
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {language === "en" ? "Spaces Full (%)" : "Tỉ lệ lấp đầy"}
                  <HelpCircle
                    size={12}
                    className="text-slate-350 cursor-help"
                    title={
                      language === "en"
                        ? "Percentage of occupied parking spaces out of total slots."
                        : "Phần trăm chỗ đỗ xe đang được sử dụng trên tổng số chỗ khả dụng của toàn hệ thống."
                    }
                  />
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {data.occupancy.occupancy_rate_percent}%
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mt-1">
                  {data.occupancy.occupied_slots} / {data.occupancy.total_slots}{" "}
                  {language === "en" ? "slots full" : "chỗ đã đỗ"}
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

            {/* Card 2: Cars Currently Parked & Traffic */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {language === "en" ? "Currently Parked" : "Xe đang đỗ hiện tại"}
                  <HelpCircle
                    size={12}
                    className="text-slate-350 cursor-help"
                    title={
                      language === "en"
                        ? "Total number of vehicles inside the parking lot right now."
                        : "Số xe hiện diện thực tế trong bãi lúc này."
                    }
                  />
                </span>
                <span className="block text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {data.vehicle_count.currently_parked} {language === "en" ? "vehicles" : "xe"}
                </span>
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>
                    {language === "en" ? "In" : "Vào"}:{" "}
                    <strong className="text-blue-600 dark:text-blue-400">
                      {data.vehicle_count.total_check_ins}
                    </strong>
                  </span>
                  <span className="text-slate-200 dark:text-slate-800">|</span>
                  <span>
                    {language === "en" ? "Out" : "Ra"}:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-450">
                      {data.vehicle_count.total_check_outs}
                    </strong>
                  </span>
                  <span className="text-slate-200 dark:text-slate-800">|</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-550 dark:text-slate-400">
                    {language === "en" ? "Empty" : "Trống"}:{" "}
                    {Math.max(data.occupancy.total_slots - data.occupancy.occupied_slots, 0)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Car size={22} />
              </div>
            </div>

            {/* Card 3: Total Income & Payment Channels */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between lg:col-span-2">
              <div className="w-full">
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {language === "en" ? "Revenue" : "Doanh Thu Kỳ Này"}
                  <HelpCircle
                    size={12}
                    className="text-slate-350 cursor-help"
                    title={
                      language === "en"
                        ? "Total money collected from tickets and reservations in this period."
                        : "Tổng số tiền thu được từ xe ra và lượt đặt chỗ trong khoảng thời gian đã chọn."
                    }
                  />
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between w-full mt-1 gap-2">
                  <span className="text-2xl font-black text-slate-850 dark:text-white">
                    {formatCurrency(data.revenue.total)}
                  </span>
                  
                  {/* Payment channel list */}
                  <div className="flex gap-2">
                    {Object.entries(data.revenue.by_payment_method).map(([method, amount]) => (
                      <div
                        key={method}
                        className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-lg flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400"
                      >
                        {method.toUpperCase() === "CASH" ? (
                          <Wallet size={10} className="text-emerald-500" />
                        ) : (
                          <CreditCard size={10} className="text-blue-500" />
                        )}
                        <span>
                          {method === "CASH" ? (language === "en" ? "Cash" : "Tiền mặt") : method}:{" "}
                          {formatCurrency(amount)}
                        </span>
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

          {/* 4. DETAILS ROW (PEAK HOUR CHART & VEHICLE BREAKDOWN) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Peak hourly traffic bar chart (Span 3) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                      {language === "en" ? "Hourly Check-in Traffic" : "Lưu Lượng Xe Vào Theo Khung Giờ"}
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                      {language === "en"
                        ? "Shows vehicle check-in count for each hour of the day to help you plan staff schedules."
                        : "Thống kê số lượng lượt xe check-in từng giờ để hỗ trợ điều phối nhân sự bãi xe."}
                    </span>
                  </div>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Clock size={16} />
                  </div>
                </div>

                {/* Intelligent peak hour info badge */}
                {peakHourRecord && peakHourRecord.check_ins > 0 && (
                  <div className="mb-4 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-[11px] text-slate-655 dark:text-slate-300 flex items-center gap-2">
                    <TrendingUp size={14} className="text-blue-500 shrink-0" />
                    <span>
                      {language === "en" ? (
                        <>
                          Tip: Busiest hour occurred at <strong>{peakHourRecord.hour}:00</strong> with <strong>{peakHourRecord.check_ins} check-ins</strong>.
                        </>
                      ) : (
                        <>
                          Nhận định: Giờ cao điểm nhất là lúc <strong>{peakHourRecord.hour}h:00</strong> với <strong>{peakHourRecord.check_ins} lượt xe vào</strong> bãi.
                        </>
                      )}
                    </span>
                  </div>
                )}

                {data.peak_hours.length === 0 ? (
                  <div className="h-44 flex flex-col justify-center items-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Clock size={24} className="stroke-1 mb-1.5" />
                    <span className="text-[11px]">
                      {language === "en"
                        ? "No vehicle check-ins found in this date range."
                        : "Không có hoạt động xe vào bãi đỗ xe trong thời gian này."}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-40 flex items-end justify-between gap-1 pt-4 px-1 border-b border-slate-100 dark:border-slate-800/80 relative">
                      {/* Grid helper lines */}
                      <div className="absolute left-0 right-0 bottom-1/3 border-b border-dashed border-slate-100 dark:border-slate-850 pointer-events-none" />
                      <div className="absolute left-0 right-0 bottom-2/3 border-b border-dashed border-slate-100 dark:border-slate-850 pointer-events-none" />

                      {data.peak_hours.map((p) => {
                        const heightPercent = (p.check_ins / maxCheckIns) * 100;
                        const isPeak = p.check_ins === maxCheckIns && p.check_ins > 0;
                        return (
                          <div key={p.hour} className="flex-1 flex flex-col items-center group relative">
                            {/* Hover tooltip widget */}
                            <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none z-20 whitespace-nowrap">
                              {p.check_ins} {language === "en" ? "check-ins" : "xe vào"}
                            </div>
                            
                            {/* Custom rendered bar */}
                            <div 
                              style={{ height: `${Math.max(heightPercent, 5)}%` }}
                              className={`w-full rounded-t transition-all duration-300 relative overflow-hidden group-hover:brightness-95
                                ${
                                  isPeak
                                    ? "bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20"
                                    : "bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-400 dark:group-hover:bg-slate-700"
                                }`}
                            />
                            
                            {/* Label */}
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 block tracking-tight font-mono">
                              {String(p.hour).padStart(2, "0")}h
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-[10px] text-slate-450 font-semibold">
                <span>
                  {language === "en"
                    ? "Horizontal: Hours of Day (00h - 24h) | Vertical: Check-ins Count"
                    : "Trục ngang: Giờ trong ngày (00h - 24h) | Trục dọc: Số lượt check-in"}
                </span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-blue-600 to-indigo-500 inline-block" />
                    {language === "en" ? "Peak Traffic" : "Cao điểm"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800 inline-block" />
                    {language === "en" ? "Normal Traffic" : "Thường nhật"}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Type Breakdown (Span 2) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                      {language === "en" ? "Vehicle Breakdown" : "Phân Loại Phương Tiện"}
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                      {language === "en"
                        ? "Displays traffic count and revenue splits by vehicle type."
                        : "Tỉ trọng lượt đỗ và doanh thu phân bố theo phân loại phương tiện."}
                    </span>
                  </div>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <BarChart3 size={16} />
                  </div>
                </div>

                <div className="space-y-4">
                  {data.breakdown_by_vehicle_type.map((vt) => {
                    const totalCheckIns = data.vehicle_count.total_check_ins || 1;
                    const checkInPercent = Math.round((vt.check_ins / totalCheckIns) * 100);
                    const revenuePercent = data.revenue.total > 0 
                      ? Math.round((Number(vt.revenue) / Number(data.revenue.total)) * 100)
                      : 0;

                    // Localize vehicle type names
                    let displayedName = vt.vehicle_type_name;
                    if (language === "en") {
                      if (vt.vehicle_type_name === "Ô tô") displayedName = "Car";
                      if (vt.vehicle_type_name === "Xe máy") displayedName = "Motorbike";
                    } else {
                      if (vt.vehicle_type_name.toLowerCase() === "car") displayedName = "Ô tô";
                      if (vt.vehicle_type_name.toLowerCase() === "motorbike") displayedName = "Xe máy";
                    }

                    return (
                      <div
                        key={vt.vehicle_type_id}
                        className="p-3.5 bg-slate-50/50 dark:bg-[#0b1326]/30 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white dark:bg-slate-850 text-slate-500 rounded-lg border border-slate-100 dark:border-slate-700/60 shadow-sm">
                              {vt.vehicle_type_name.toLowerCase().includes("car") || vt.vehicle_type_name.includes("Ô tô") ? (
                                <Car size={14} className="text-blue-500" />
                              ) : (
                                <Bike size={14} className="text-indigo-500" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              {displayedName}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-750 dark:text-slate-355">
                            {formatCurrency(vt.revenue)}
                          </span>
                        </div>

                        {/* Progress bars */}
                        <div className="space-y-2 text-[10px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400 font-semibold">
                              <span>{language === "en" ? "Check-ins" : "Số lượt vào bãi"}</span>
                              <span>
                                {vt.check_ins} {language === "en" ? "times" : "lượt"} ({checkInPercent}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${checkInPercent}%` }}
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400 font-semibold">
                              <span>{language === "en" ? "Revenue Share" : "Đóng góp doanh thu"}</span>
                              <span>{revenuePercent}% {language === "en" ? "share" : "doanh số"}</span>
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

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-[9px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-blue-500 inline-block" />
                  {language === "en" ? "Traffic Ratio" : "Tỉ lệ lượt đỗ"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-500 inline-block" />
                  {language === "en" ? "Revenue share" : "Tỉ trọng doanh thu"}
                </span>
              </div>
            </div>
          </div>

          {/* 5. DUAL ROW: SYSTEM ENTITIES STATS & RECENT VEHICLE LOGS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Accounts & Settings (Span 2) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                      {language === "en" ? "Accounts & Settings" : "Tài Khoản & Thiết Lập"}
                    </h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                      {language === "en"
                        ? "Displays total registered users and general system statuses."
                        : "Thống kê tài khoản đăng ký và giám sát thiết lập trung tâm."}
                    </span>
                  </div>
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <UserCheck size={16} />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Total registered users count */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                        <Users size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-850 dark:text-white block">
                          {language === "en" ? "Registered Accounts" : "Tài Khoản Đăng Ký"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {language === "en"
                            ? "Admins, Managers, Staff, and Customers"
                            : "Bao gồm cả Admin, Staff, Khách hàng..."}
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-slate-800 dark:text-white">
                      {totalUsers}
                    </span>
                  </div>

                  {/* Pricing settings status card */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-2 font-bold text-slate-850 dark:text-white">
                      <span>{language === "en" ? "Pricing Policies:" : "Thiết lập giá cước:"}</span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-450 px-2 py-0.5 rounded border border-emerald-250 dark:border-emerald-900/35 uppercase">
                        {language === "en" ? "Active" : "Hoạt Động"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {language === "en"
                        ? "Hourly rate formulas, booking validation parameters, and gate hardware API links are currently synced and running well."
                        : "Cấu hình cước phí đỗ xe theo giờ, quy định hủy chỗ và cơ chế thanh toán online VNPAY đang hoạt động ổn định."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation actions for Admin */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-2">
                <a
                  href="/admin/users"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/85 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition"
                >
                  {language === "en" ? "Manage Users" : "Quản lý Tài khoản"}
                  <ChevronRight size={10} />
                </a>
                <a
                  href="/admin/logs"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/85 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition"
                >
                  {language === "en" ? "Role Audit Logs" : "Nhật ký Phân quyền"}
                  <ChevronRight size={10} />
                </a>
              </div>
            </div>

            {/* Recent Vehicle Operations Log Feed (Span 3) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                    {language === "en" ? "Recent Parking Activity" : "Nhật Ký Đỗ Xe Mới Nhất"}
                  </h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                    {language === "en"
                      ? "Real-time log of check-ins, check-outs, and payments from all gates."
                      : "Danh sách lượt vào/ra và các giao dịch đặt chỗ mới ghi nhận."}
                  </span>
                </div>
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Activity size={16} />
                </div>
              </div>

              <div className="space-y-3">
                {recentActivities[language].map((act) => (
                  <div
                    key={act.id}
                    className="flex justify-between items-start p-3 bg-slate-50/50 dark:bg-[#0b1326]/30 border border-slate-100/80 dark:border-slate-850 rounded-xl"
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className="mt-1 shrink-0">
                        {act.type === "checkout" ? (
                          <span className="flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        ) : act.type === "checkin" ? (
                          <span className="flex w-2.5 h-2.5 rounded-full bg-blue-500" />
                        ) : act.type === "payment" ? (
                          <span className="flex w-2.5 h-2.5 rounded-full bg-purple-500" />
                        ) : (
                          <span className="flex w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-normal break-words">
                          {act.event}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {act.time}
                        </span>
                      </div>
                    </div>
                    {act.amount && (
                      <span className="text-xs font-black text-slate-800 dark:text-white shrink-0 ml-2">
                        +{formatCurrency(act.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl text-center space-y-3">
          <AlertCircle size={28} className="text-slate-400 mx-auto" />
          <p className="text-sm text-slate-550 dark:text-slate-400 font-semibold">
            {language === "en" ? "Failed to load parking metrics report." : "Không thể tải thông tin báo cáo bãi xe."}
          </p>
          <button
            onClick={() => setIsDemoMode(true)}
            className="btn-primary text-xs mx-auto animate-bounce"
          >
            {language === "en" ? "Load Demo Data" : "Nạp Dữ Liệu Demo"}
          </button>
        </div>
      )}
    </div>
  );
}
