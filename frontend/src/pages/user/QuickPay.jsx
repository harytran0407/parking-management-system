import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  CreditCard,
  Shield,
  LogOut,
  Info,
  Hash,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

const fmtVND = (val) => (val != null ? val.toLocaleString("vi-VN") : "0");

export default function SessionLookup() {
  const { language } = useLanguage();
  const [licensePlate, setLicensePlate] = useState("");
  const [ticketSuffix, setTicketSuffix] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [loadingPay, setLoadingPay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [graceSeconds, setGraceSeconds] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      handleSearch(null, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [session, licensePlate, ticketSuffix]);

  useEffect(() => {
    if (session && session.grace_period_remaining_seconds != null) {
      setGraceSeconds(session.grace_period_remaining_seconds);
    } else {
      setGraceSeconds(null);
    }
  }, [session]);

  // Tick every second for live duration display
  useEffect(() => {
    if (!session) return;

    const calculateElapsed = () => {
      if (!session.check_in_time) return 0;
      const checkInDate = new Date(session.check_in_time);
      const diffMs = Date.now() - checkInDate.getTime();
      return Math.max(0, Math.floor(diffMs / 1000));
    };

    setElapsedSeconds(calculateElapsed());

    const ticker = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(ticker);
  }, [session]);

  useEffect(() => {
    if (graceSeconds === null || graceSeconds <= 0) return;
    const timer = setInterval(() => {
      setGraceSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSearch(null, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [graceSeconds]);

  const handleSearch = async (e, isSilent = false) => {
    if (e) e.preventDefault();
    if (!licensePlate.trim()) return;
    const cleanSuffix = ticketSuffix.trim().toUpperCase();
    if (!isSilent && (!cleanSuffix || cleanSuffix.length !== 5)) {
      setError(language === "en"
        ? "Please enter exactly 5 characters of the ticket code suffix."
        : "Vui lòng nhập đúng 5 ký tự cuối của mã vé xe.");
      return;
    }
    if (!isSilent) {
      setLoading(true);
      setError("");
      setSuccessMessage("");
    }
    try {
      const cleanPlate = licensePlate.replace(/[-.\s]/g, "").toUpperCase();
      const url = cleanSuffix
        ? `/parking/sessions/active/${cleanPlate}?ticketSuffix=${cleanSuffix}`
        : `/parking/sessions/active/${cleanPlate}`;
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setSession(res.data.data);
      } else {
        setSession(null);
        setError(language === "en"
          ? "License plate not found."
          : "Không tìm thấy biển số xe.");
      }
    } catch (err) {
      setSession(null);
      if (err.response?.status === 404) {
        setError(language === "en"
          ? "License plate or ticket code not found."
          : "Không tìm thấy biển số xe hoặc mã vé.");
      } else {
        setError(err.response?.data?.message || (language === "en"
          ? "License plate or ticket code not found."
          : "Không tìm thấy biển số xe hoặc mã vé."));
      }
    } finally {
      if (!isSilent) { setLoading(false); setSearched(true); }
    }
  };

  const handlePay = async () => {
    if (!session || !session.session_id) return;
    setLoadingPay(true);
    setSuccessMessage("");
    setError("");
    try {
      const res = await api.post(`/parking/sessions/active/${session.session_id}/pay`, {
        payment_method: "MOCK"
      });
      if (res.data && res.data.success) {
        setSuccessMessage(res.data.message || (language === "en" ? "Payment successful!" : "Thanh toán thành công!"));
        await handleSearch(null, true);
      }
    } catch (err) {
      setError(err.response?.data?.message || (language === "en" ? "Payment failed. Please try again." : "Thanh toán thất bại. Vui lòng thử lại."));
    } finally {
      setLoadingPay(false);
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
    new Date(iso).toLocaleTimeString(language === "en" ? "en-US" : "vi-VN", {
      hour: "2-digit", minute: "2-digit",
    });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const floorLabel = (floor) => {
    if (floor === 0) return language === "en" ? "Ground Floor" : "Tầng G";
    return language === "en" ? `Floor ${floor}` : `Tầng ${floor}`;
  };

  return (
    <div className="animate-slide-in w-full max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-4 md:px-6 xl:px-8 py-4 md:py-6 transition-colors duration-300">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/user"
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl xl:text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {language === "en" ? "Active Session Lookup" : "Tra cứu phiên đỗ xe"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === "en"
              ? "Check your vehicle's parking status, location, and current fee in real-time"
              : "Kiểm tra trạng thái, vị trí ô đỗ và chi phí tạm tính theo thời gian thực"}
          </p>
        </div>
      </div>

      {/* ── SEARCH CARD ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 p-6 xl:p-7 mb-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          {language === "en" ? "Enter License Plate & Ticket Code" : "Nhập biển số xe & 5 ký tự cuối mã vé"}
        </p>
        <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500">
              <Car size={17} />
            </span>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              placeholder={language === "en" ? "Plate (e.g. 51F-123.45)" : "Biển số xe (VD: 51F-123.45)"}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white text-base font-bold placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all tracking-widest"
              required
            />
          </div>

          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500">
              <Hash size={17} />
            </span>
            <input
              type="text"
              value={ticketSuffix}
              onChange={(e) => setTicketSuffix(e.target.value.toUpperCase().slice(0, 5))}
              placeholder={language === "en" ? "Ticket Code" : "Mã vé"}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white text-base font-bold placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all tracking-wider"
              maxLength={5}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !licensePlate.trim() || ticketSuffix.trim().length !== 5}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-700/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            {language === "en" ? "Find My Vehicle" : "Tìm phương tiện"}
          </button>
        </form>

        {/* Error */}
        {searched && error && (
          <div className="mt-4 flex items-start gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                {language === "en" ? "Error" : "Lỗi"}
              </p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mt-4 flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {language === "en" ? "Success" : "Thành công"}
              </p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5 leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── SESSION RESULT ── */}
      {searched && session && (
        /* Two-column on large screens */
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 animate-fade-in">

          {/* LEFT COL — vehicle info (3/5) */}
          <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 overflow-hidden">

            {/* Vehicle header */}
            <div className="px-6 xl:px-7 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                  <Car size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-800 dark:text-white tracking-widest text-base xl:text-lg">
                      {session.license_plate_in || licensePlate}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {language === "en" ? "Active" : "Đang đỗ"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {session.vehicle_type_name}
                  </p>
                </div>
              </div>
              {/* Live duration */}
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Clock size={11} />
                  {language === "en" ? "Duration" : "Thời lượng"}
                </p>
                <p className="text-xl xl:text-2xl font-black text-slate-700 dark:text-white tracking-wider tabular-nums min-w-[7rem] text-right">
                  {formatDuration(0, elapsedSeconds)}
                </p>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-6 xl:px-7 py-5 grid grid-cols-2 xl:grid-cols-4 gap-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar size={11} />
                  {language === "en" ? "Entry Date" : "Ngày vào"}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatDate(session.check_in_time)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <LogOut size={11} className="rotate-180" />
                  {language === "en" ? "Entry Time" : "Giờ vào"}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatTime(session.check_in_time)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Layers size={13} />
                  {language === "en" ? "Floor" : "Tầng"}
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  {floorLabel(session.floor)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={11} />
                  {language === "en" ? "Zone" : "Khu vực"}
                </p>
                <span className="inline-block  text-sm font-black text-blue-700 dark:text-blue-300  rounded-lg">
                  {session.zone_name}
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT COL — fee + actions (2/5) */}
          <div className="xl:col-span-2 flex flex-col gap-4">

            {session.payment_status?.toUpperCase() === "PAID" ? (
              /* PAID status card with countdown */
              <div className="bg-emerald-600 dark:bg-emerald-700 rounded-3xl shadow-lg shadow-emerald-700/25 overflow-hidden flex-1 flex flex-col justify-between p-6 text-white border border-emerald-500/20">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-emerald-100 font-bold uppercase tracking-widest text-[10px]">
                    <CheckCircle size={14} className="text-white shrink-0 animate-pulse" />
                    {language === "en" ? "Payment Completed" : "Đã thanh toán thành công"}
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed mb-4">
                    {language === "en"
                      ? "Your parking fee is fully paid. Please exit the gate before the timer expires."
                      : "Phí đỗ xe đã thanh toán. Vui lòng di chuyển ra khỏi bãi trong thời gian còn lại."}
                  </p>
                </div>
                {graceSeconds !== null && (
                  <div className="mt-auto bg-emerald-700/50 rounded-2xl p-4 border border-emerald-500/30 text-center animate-pulse">
                    <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-black mb-1">
                      {language === "en" ? "Remaining Exit Time" : "Thời gian còn lại để ra xe"}
                    </p>
                    <p className="text-3xl font-black font-mono tracking-wider text-white">
                      {Math.floor(graceSeconds / 3600) > 0 ? `${Math.floor(graceSeconds / 3600)}h ` : ""}{Math.floor((graceSeconds % 3600) / 60)}m {String(graceSeconds % 60).padStart(2, "0")}s
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Fee card */
              <div className="bg-blue-700 dark:bg-blue-800 rounded-3xl shadow-lg shadow-blue-700/25 overflow-hidden flex-1">
                <div className="px-6 xl:px-7 pt-6 pb-5">
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3">
                    {language === "en" ? "Total Amount Due" : "Phí tạm tính"}
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl xl:text-5xl font-black text-white leading-none">
                      {fmtVND(session.current_fee)}
                    </span>
                    <span className="text-base font-bold text-blue-300">VNĐ</span>
                  </div>
                </div>

                <div className="px-6 xl:px-7 pb-6 space-y-3">
                  <button
                    onClick={handlePay}
                    disabled={loadingPay}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-blue-700 font-black text-sm rounded-2xl shadow-lg shadow-blue-900/30 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {loadingPay ? (
                      <RefreshCw size={17} className="animate-spin" />
                    ) : (
                      <CreditCard size={17} />
                    )}
                    {language === "en" ? "Pay & Exit Now" : "Thanh toán & Ra xe"}
                  </button>
                </div>
              </div>
            )}

            {/* Grace period notice */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-900/40 shadow-lg shadow-slate-200/60 dark:shadow-slate-950/60 px-6 xl:px-7 py-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Info size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-700 dark:text-amber-400 mb-1">
                  {language === "en" ? "Exit Window Notice" : "Thông báo thời gian ra xe"}
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/70 leading-relaxed">
                  {session?.payment_status?.toUpperCase() === "PAID" && graceSeconds !== null ? (
                    language === "en" ? (
                      <>You have <strong>{Math.floor(graceSeconds / 3600) > 0 ? `${Math.floor(graceSeconds / 3600)}h ` : ""}{Math.floor((graceSeconds % 3600) / 60)}m {graceSeconds % 60}s</strong> remaining to exit after payment without extra fees.</>
                    ) : (
                      <>Bạn còn <strong>{Math.floor(graceSeconds / 3600) > 0 ? `${Math.floor(graceSeconds / 3600)} giờ ` : ""}{Math.floor((graceSeconds % 3600) / 60)} phút {graceSeconds % 60} giây</strong> để ra khỏi bãi xe mà không bị tính thêm phí.</>
                    )
                  ) : (
                    language === "en" ? (
                      <>You can exit the parking lot for free during the <strong>remaining time</strong> of the paid hour block. Overstaying will incur additional charges.</>
                    ) : (
                      <>Bạn có thể ra khỏi bãi miễn phí trong <strong>khoảng thời gian còn lại</strong> của block giờ đã trả. Quá thời gian sẽ tính phí thêm.</>
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {!searched && (
        <div className="flex flex-col gap-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
              {language === "en"
                ? "Enter your vehicle's license plate and the last 5 characters of your ticket code to view parking status, slot location, and current fee in real-time."
                : "Nhập biển số xe và 5 ký tự cuối của mã vé xe để kiểm tra trạng thái đỗ xe, vị trí ô đỗ và chi phí tạm tính theo thời gian thực."}
            </p>
          </div>
          <div className="flex items-start gap-3 border-t border-blue-100/30 dark:border-blue-900/20 pt-3">
            <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed">
              {language === "en"
                ? "Note: Quick Pay is exclusively for registered walk-in vehicles. Booking-based parking sessions must be checked out at the gates."
                : "Lưu ý: Quick Pay chỉ dành cho xe vãng lai đã đăng ký tài khoản. Các lượt gửi xe đặt trước (Booking) vui lòng thực hiện check-out tại cổng."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}