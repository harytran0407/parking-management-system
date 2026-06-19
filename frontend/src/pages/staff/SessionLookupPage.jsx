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

const fmtVND = (val) => (val != null ? Number(val).toLocaleString("vi-VN") : "0");

export default function SessionLookupPage() {
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
        if (!isSilent) setError("Không tìm thấy phiên đỗ xe đang hoạt động cho biển số này.");
      }
    } catch (err) {
      setSession(null);
      if (!isSilent) {
        if (err.response?.status === 404) {
          setError("Không tìm thấy phiên đỗ xe. Vui lòng kiểm tra lại biển số.");
        } else {
          setError(err.response?.data?.message || "Không tìm thấy phiên đỗ xe. Vui lòng kiểm tra lại biển số.");
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
    new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });

  const floorLabel = (floor) => {
    if (floor === 0) return "Tầng G";
    return `Tầng ${floor}`;
  };

  const isWalkIn = session && !session.booking_id;

  return (
    <div className="animate-slide-in w-full max-w-3xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-4 md:px-6 xl:px-8 py-4 md:py-6 transition-colors duration-300">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl xl:text-2xl font-black text-slate-800 dark:text-white leading-tight">
          Tra cứu phiên đỗ xe
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Tìm kiếm thông tin phiên đỗ xe đang hoạt động theo biển số
        </p>
      </div>

      {/* ── SEARCH CARD ── */}
      <div className="bg-white dark:bg-slate-900 rounded-md shadow-lg shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 p-6 xl:p-7 mb-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Nhập biển số xe
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
              placeholder="VD: 51F-123.45"
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
            Tìm phương tiện
          </button>
        </form>

        {/* Error */}
        {searched && error && (
          <div className="mt-4 flex items-start gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-md p-4">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Lỗi</p>
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
                      Đang đỗ
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{session.vehicle_type_name || "—"}</p>
                </div>
              </div>
              {/* Live duration */}
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Clock size={11} />
                  Thời lượng
                </p>
                <p className="text-xl xl:text-2xl font-semibold text-slate-700 dark:text-white tracking-wider tabular-nums min-w-[7rem] text-right">
                  {formatDuration(session.duration_minutes, elapsedSeconds)}
                </p>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-6 xl:px-7 py-5 grid grid-cols-2 xl:grid-cols-4 gap-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar size={11} />
                  Ngày vào
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatDate(session.check_in_time)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <LogOut size={11} className="rotate-180" />
                  Giờ vào
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatTime(session.check_in_time)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Layers size={13} />
                  Tầng
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {floorLabel(session.floor)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={11} />
                  Khu vực
                </p>
                <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                  {session.zone_name || "—"}
                </span>
              </div>
            </div>

            {/* Booking & Overdue Info */}
            {!isWalkIn && (
              <div className={`px-6 xl:px-7 py-5 border-b ${
                session.is_overdue 
                  ? "bg-rose-50/40 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/40" 
                  : "bg-blue-50/20 dark:bg-blue-950/5 border-slate-100 dark:border-slate-800"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    session.is_overdue ? "text-rose-700 dark:text-rose-400" : "text-blue-700 dark:text-blue-400"
                  }`}>
                    <Calendar size={13} />
                    Thông tin đặt chỗ
                  </h4>
                  {session.is_overdue ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 animate-pulse">
                      Quá hạn
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      Trong hạn
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Giờ vào dự kiến:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatTime(session.expected_arrival)} {formatDate(session.expected_arrival)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Giờ ra dự kiến:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatTime(session.expired_at)} {formatDate(session.expired_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Trạng thái đặt chỗ:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
                        {session.booking_status || "Đang hoạt động"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-5">
                    {session.is_overdue ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">Thời gian quá hạn:</span>
                          <span className="font-black text-rose-700 dark:text-rose-400 tabular-nums">
                            {formatDuration(session.overdue_minutes)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-rose-600 dark:text-rose-400 font-bold font-sans">Phí phạt quá hạn:</span>
                          <span className="font-black text-rose-700 dark:text-rose-400 tracking-wider">
                            {fmtVND(session.overdue_fee)} VNĐ
                          </span>
                        </div>
                        <div className="text-[10px] text-rose-600/90 dark:text-rose-400/90 bg-rose-50 dark:bg-rose-950/20 rounded p-2 border border-rose-100 dark:border-rose-900/30 font-medium leading-relaxed mt-1 flex items-start gap-1">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          <span>Xe đỗ quá giờ đăng ký. Nhân viên vui lòng nhắc nhở và kiểm tra kỹ khi cho xe ra.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">
                        <CheckCircle size={18} className="text-emerald-500 mb-1.5" />
                        Phương tiện đỗ đúng hạn đăng ký
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Ticket type */}
            <div className="px-6 xl:px-7 py-4 flex items-center gap-3">
              <Hash size={13} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại vé:</span>
              <span className={`text-xs font-black ${isWalkIn ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                {isWalkIn ? "Vé vãng lai" : "Đặt trước"}
              </span>
            </div>
          </div>

          {/* RIGHT COL — fee summary (2/5) */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            {/* Fee card */}
            <div className="bg-blue-700 dark:bg-blue-800 rounded-md shadow-lg shadow-blue-700/25 overflow-hidden flex-1">
              <div className="px-6 xl:px-7 pt-6 pb-5">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3">
                  Phí tạm tính
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl xl:text-5xl font-black text-white leading-none">
                    {fmtVND(session.current_fee)}
                  </span>
                  <span className="text-base font-bold text-blue-300">VNĐ</span>
                </div>
                <p className="text-[10px] text-blue-300 mt-2 leading-relaxed">
                  Phí này cập nhật theo thời gian thực và có thể thay đổi khi xe ra.
                </p>
              </div>

              <div className="px-6 xl:px-7 pb-6">
                <div className="bg-blue-800/50 dark:bg-blue-900/50 rounded-md px-4 py-3 border border-blue-600/30 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-blue-300">Trạng thái</span>
                    <span className="font-black text-white uppercase">{session.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-blue-300">Thanh toán</span>
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
                <p className="text-xs font-black text-blue-700 dark:text-blue-400 mb-1">Chỉ xem thông tin</p>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
                  Trang này chỉ dùng để tra cứu trạng thái xe. Thanh toán và check-out được thực hiện tại màn hình Check-Out.
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
            Nhập biển số xe để tra cứu trạng thái đỗ xe, khu vực, thời lượng và phí tạm tính theo thời gian thực.
          </p>
        </div>
      )}
    </div>
  );
}
