import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import {
  Search,
  Clock,
  MapPin,
  AlertCircle,
  Car,
  Layers,
  DollarSign,
  Calendar,
  RefreshCw,
  LogOut,
  Info,
  Hash,
  CheckCircle,
  Bike,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

const fmtVND = (val) => (val != null ? Number(val).toLocaleString("vi-VN") : "0");

const t = {
  vi: {
    title: "Tra cứu phiên đỗ xe",
    subtitle: "Tìm kiếm thông tin phiên đỗ xe đang hoạt động theo biển số",
    enterPlateLabel: "Nhập biển số xe",
    placeholderPlate: "VD: 51F-123.45",
    btnSearch: "Tìm phương tiện",
    errorTitle: "Lỗi",
    errorNoSession: "Không tìm thấy biển số xe.",
    errorNotFound: "Không tìm thấy biển số xe.",
    statusParking: "Đang đỗ",
    labelDuration: "Thời lượng",
    labelCheckInDate: "Ngày vào",
    labelCheckInTime: "Giờ vào",
    labelFloor: "Tầng",
    labelZone: "Khu vực",
    bookingInfo: "Thông tin đặt chỗ",
    overdue: "Quá hạn",
    onTime: "Trong hạn",
    expectedArrival: "Giờ vào dự kiến:",
    expectedDeparture: "Giờ ra dự kiến:",
    bookingStatus: "Trạng thái đặt chỗ:",
    bookingActive: "Đang hoạt động",
    overdueDuration: "Thời gian quá hạn:",
    overdueFine: "Phí phạt quá hạn:",
    overdueAlert: "Xe đỗ quá giờ đăng ký. Nhân viên vui lòng nhắc nhở và kiểm tra kỹ khi cho xe ra.",
    onTimeAlert: "Phương tiện đỗ đúng hạn đăng ký",
    ticketTypeLabel: "Loại vé:",
    ticketWalkIn: "Vé vãng lai",
    ticketPreBooked: "Đặt trước",
    estimatedFee: "Phí tạm tính",
    feeNotice: "Phí này cập nhật theo thời gian thực và có thể thay đổi khi xe ra.",
    statusLabel: "Trạng thái",
    paymentLabel: "Thanh toán",
    viewOnlyTitle: "Chỉ xem thông tin",
    viewOnlyNotice: "Trang này chỉ dùng để tra cứu trạng thái xe. Thanh toán và check-out được thực hiện tại màn hình Check-Out.",
    emptyNotice: "Nhập biển số xe để tra cứu trạng thái đỗ xe, khu vực, thời lượng và phí tạm tính theo thời gian thực."
  },
  en: {
    title: "Session Lookup",
    subtitle: "Search for active parking session by license plate",
    enterPlateLabel: "Enter license plate",
    placeholderPlate: "e.g., 51F-123.45",
    btnSearch: "Search Vehicle",
    errorTitle: "Error",
    errorNoSession: "License plate not found.",
    errorNotFound: "License plate not found.",
    statusParking: "Parked",
    labelDuration: "Duration",
    labelCheckInDate: "Check-in Date",
    labelCheckInTime: "Check-in Time",
    labelFloor: "Floor",
    labelZone: "Zone",
    bookingInfo: "Booking Information",
    overdue: "Overdue",
    onTime: "On Time",
    expectedArrival: "Expected Arrival:",
    expectedDeparture: "Expected Departure:",
    bookingStatus: "Booking Status:",
    bookingActive: "Active",
    overdueDuration: "Overdue Duration:",
    overdueFine: "Overdue Fine:",
    overdueAlert: "Vehicle has parked past the expected departure. Please advise and check carefully at exit.",
    onTimeAlert: "Vehicle parked within the registered time",
    ticketTypeLabel: "Ticket Type:",
    ticketWalkIn: "Walk-in Ticket",
    ticketPreBooked: "Pre-booked",
    estimatedFee: "Estimated Fee",
    feeNotice: "This fee is updated in real time and may change upon exit.",
    statusLabel: "Status",
    paymentLabel: "Payment",
    viewOnlyTitle: "View Only",
    viewOnlyNotice: "This page is for lookup only. Payments and check-outs are handled on the Check-Out screen.",
    emptyNotice: "Enter a license plate to lookup parking status, zone, duration and real-time estimated fee."
  }
};

export default function SessionLookupPage() {
  const { language } = useLanguage();
  const [licensePlate, setLicensePlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Auto-refresh every 30 s when a session is displayed
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => handleSearch(null, true), 30000);
    return () => clearInterval(interval);
  }, [session, licensePlate]);

  // Live second ticker for duration display
  useEffect(() => {
    if (!session) return;
    const ticker = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    return () => clearInterval(ticker);
  }, [session]);

  const handleSearch = async (e, isSilent = false) => {
    if (e) e.preventDefault();
    if (!licensePlate.trim()) return;
    if (!isSilent) {
      setLoading(true);
      setError("");
    }
    try {
      const cleanPlate = licensePlate.replace(/[-.\s]/g, "").toUpperCase();
      const res = await api.get(`/parking/sessions/active/${cleanPlate}`);
      if (res.data && res.data.success) {
        setSession(res.data.data);
        if (!isSilent) setElapsedSeconds(0);
      } else {
        setSession(null);
        if (!isSilent) setError(t[language].errorNoSession);
      }
    } catch (err) {
      setSession(null);
      if (!isSilent) {
        if (err.response?.status === 404) {
          setError(t[language].errorNotFound);
        } else {
          setError(err.response?.data?.message || t[language].errorNotFound);
        }
      }
    } finally {
      if (!isSilent) { setLoading(false); setSearched(true); }
    }
  };

  const formatDuration = (totalMinutes, extraSeconds = 0) => {
    const totalSec = totalMinutes * 60 + extraSeconds;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "short", year: "numeric" });

  const floorLabel = (floor) => {
    if (floor === 0) return language === "vi" ? "Tầng G" : "Ground Floor";
    return language === "vi" ? `Tầng ${floor}` : `Floor ${floor}`;
  };

  const isWalkIn = session && !session.booking_id;

  return (
    <div className="animate-slide-in w-full max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-4 md:px-6 xl:px-8 py-4 md:py-6 transition-colors duration-300">



      {/* ── SEARCH CARD ── */}
      <div className="bg-white dark:bg-slate-900 rounded-md shadow-lg shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 p-6 xl:p-7 mb-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          {t[language].enterPlateLabel}
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500">
              <Car size={17} />
            </span>
            <input
              type="text"
              id="staff-session-lookup-plate"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              placeholder={t[language].placeholderPlate}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white text-base font-bold placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all tracking-widest"
              required
            />
          </div>
          <button
            type="submit"
            id="staff-session-lookup-btn"
            disabled={loading || !licensePlate.trim()}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-sm rounded-md shadow-lg shadow-blue-700/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            {t[language].btnSearch}
          </button>
        </form>

        {/* Error */}
        {searched && error && (
          <div className="mt-4 flex items-start gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-md p-4">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{t[language].errorTitle}</p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── SESSION RESULT ── */}
      {searched && session && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 animate-fade-in">

          {/* LEFT COL — vehicle info (3/5) */}
          <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-md shadow-lg shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 overflow-hidden">

            {/* Vehicle header */}
            <div className="px-6 xl:px-7 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                  {session.vehicle_type_name?.toLowerCase().includes("motor") || session.vehicle_type_name?.toLowerCase().includes("máy")
                    ? <Bike size={22} className="text-blue-600 dark:text-blue-400" />
                    : <Car size={22} className="text-blue-600 dark:text-blue-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-800 dark:text-white tracking-widest text-base xl:text-lg">
                      {session.license_plate_in || licensePlate}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {t[language].statusParking}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{session.vehicle_type_name || "—"}</p>
                </div>
              </div>
              {/* Live duration */}
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Clock size={11} />
                  {t[language].labelDuration}
                </p>
                <p className="text-xl xl:text-2xl font-bold text-slate-700 dark:text-white tracking-wider tabular-nums min-w-[7rem] text-right">
                  {formatDuration(session.duration_minutes, elapsedSeconds)}
                </p>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-6 xl:px-7 py-5 grid grid-cols-2 xl:grid-cols-4 gap-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar size={11} />
                  {t[language].labelCheckInDate}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatDate(session.check_in_time)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <LogOut size={11} className="rotate-180" />
                  {t[language].labelCheckInTime}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatTime(session.check_in_time)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Layers size={13} />
                  {t[language].labelFloor}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {floorLabel(session.floor)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={11} />
                  {t[language].labelZone}
                </p>
                <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                  {session.zone_name || "—"}
                </span>
              </div>
            </div>

            {/* Booking & Overdue Info */}
            {!isWalkIn && (
              <div className={`px-6 xl:px-7 py-5 border-b ${session.is_overdue
                ? "bg-rose-50/40 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/40"
                : "bg-blue-50/20 dark:bg-blue-950/5 border-slate-100 dark:border-slate-800"
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${session.is_overdue ? "text-rose-700 dark:text-rose-400" : "text-blue-700 dark:text-blue-400"
                    }`}>
                    <Calendar size={13} />
                    {t[language].bookingInfo}
                  </h4>
                  {session.is_overdue ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 animate-pulse">
                      {t[language].overdue}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      {t[language].onTime}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">{t[language].expectedArrival}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatTime(session.expected_arrival)} {formatDate(session.expected_arrival)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">{t[language].expectedDeparture}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatTime(session.expired_at)} {formatDate(session.expired_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">{t[language].bookingStatus}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
                        {session.booking_status === "ACTIVE" ? t[language].bookingActive : (session.booking_status || "—")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-5">
                    {session.is_overdue ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{t[language].overdueDuration}</span>
                          <span className="font-black text-rose-700 dark:text-rose-400 tabular-nums">
                            {formatDuration(session.overdue_minutes)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-rose-600 dark:text-rose-400 font-bold font-sans">{t[language].overdueFine}</span>
                          <span className="font-black text-rose-700 dark:text-rose-400 tracking-wider">
                            {fmtVND(session.overdue_fee)} VNĐ
                          </span>
                        </div>
                        <div className="text-[10px] text-rose-600/90 dark:text-rose-400/90 bg-rose-50 dark:bg-rose-950/20 rounded p-2 border border-rose-100 dark:border-rose-900/30 font-medium leading-relaxed mt-1 flex items-start gap-1">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          <span>{t[language].overdueAlert}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">
                        <CheckCircle size={18} className="text-emerald-500 mb-1.5" />
                        {t[language].onTimeAlert}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Ticket type */}
            <div className="px-6 xl:px-7 py-4 flex items-center gap-3">
              <Hash size={13} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t[language].ticketTypeLabel}</span>
              <span className={`text-xs font-black ${isWalkIn ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                {isWalkIn ? t[language].ticketWalkIn : t[language].ticketPreBooked}
              </span>
            </div>
          </div>

          {/* RIGHT COL — fee summary (2/5) */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            {/* Fee card */}
            <div className="bg-blue-700 dark:bg-blue-800 rounded-md shadow-lg shadow-blue-700/25 overflow-hidden flex-1">
              <div className="px-6 xl:px-7 pt-6 pb-5">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3">
                  {t[language].estimatedFee}
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl xl:text-5xl font-black text-white leading-none">
                    {fmtVND(session.current_fee)}
                  </span>
                  <span className="text-base font-bold text-blue-300">VNĐ</span>
                </div>
                <p className="text-[10px] text-blue-300 mt-2 leading-relaxed">
                  {t[language].feeNotice}
                </p>
              </div>

              <div className="px-6 xl:px-7 pb-6">
                <div className="bg-blue-800/50 dark:bg-blue-900/50 rounded-md px-4 py-3 border border-blue-600/30 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-blue-300">{t[language].statusLabel}</span>
                    <span className="font-black text-white uppercase">{session.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-blue-300">{t[language].paymentLabel}</span>
                    <span className={`font-black uppercase ${session.payment_status === "PAID" ? "text-emerald-300" : "text-amber-300"}`}>
                      {session.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info notice */}
            <div className="bg-white dark:bg-slate-900 rounded-md border border-blue-100 dark:border-blue-900/40 shadow-lg shadow-slate-200/60 dark:shadow-slate-950/60 px-6 xl:px-7 py-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Info size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-black text-blue-700 dark:text-blue-400 mb-1">{t[language].viewOnlyTitle}</p>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                  {t[language].viewOnlyNotice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searched && (
        <div className="flex items-start gap-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-md p-4">
          <CheckCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
            {t[language].emptyNotice}
          </p>
        </div>
      )}
    </div>
  );
}
