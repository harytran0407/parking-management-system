import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { createPortal } from "react-dom";
import {
  MapPin,
  Clock,
  XCircle,
  Calendar,
  Star,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Share2,
  Navigation,
  ExternalLink,
  Car,
  Bike,
  Building,
  Layers,
  Info,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

// ==========================================
// STATIC PRESENTATION CONSTANTS
// ==========================================
const STATIC_IMAGES = [
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1000",
];

const FALLBACK_MAP_URL =
  "https://maps.google.com/maps?q=92+Nam+Ky+Khoi+Nghia,+Ho+Chi+Minh&t=&z=16&ie=UTF8&iwloc=&output=embed";

const fmtVND = (val) => (val != null ? val.toLocaleString("vi-VN") : "0");

export default function UserDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRulesModal, setShowRulesModal] = useState(false);

  const [buildingInfo, setBuildingInfo] = useState({
    building_id: "",
    building_name: "",
    address: "",
    total_floors: 0,
    total_slots: 0,
    status: "",
    operation_hours: { weekday_hours: "", weekend_hours: "", is_24_7: false },
    current_occupancy: { total_occupied: 0, total_available: 0, occupancy_rate: 0 },
    vehicle_type_availability: [],
  });

  const [pricingPolicy, setPricingPolicy] = useState([]);
  const [floors, setFloors] = useState([]);

  // ==========================================
  // FETCH REALTIME DATA
  // ==========================================
  useEffect(() => {
    const fetchRealtimeDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        try {
          const buildingRes = await api.get("/parking/buildings/info");
          if (buildingRes.data?.success) setBuildingInfo(buildingRes.data.data);
        } catch (buildingErr) {
          throw new Error(
            buildingErr.response?.data?.message ||
            (language === "en"
              ? "Failed to load parking building information."
              : "Tải thông tin tòa nhà đỗ xe thất bại.")
          );
        }

        try {
          const pricingRes = await api.get("/parking/buildings/pricing/current");
          if (pricingRes.data?.success) setPricingPolicy(pricingRes.data.data);
        } catch {
          setPricingPolicy([
            {
              policy_id: 1,
              vehicle_type_id: 1,
              vehicle_type_name: language === "en" ? "Automobile (Car)" : "Ô tô",
              base_price: 15000,
              base_hours: 4,
              subsequent_rate: 10000,
              subsequent_hours: 1,
              daily_max_price: 150000,
              handling_fee: 20000,
              effective_date: "2026-01-01",
            },
            {
              policy_id: 2,
              vehicle_type_id: 2,
              vehicle_type_name: language === "en" ? "Motorbike" : "Xe máy",
              base_price: 5000,
              base_hours: 4,
              subsequent_rate: 2000,
              subsequent_hours: 1,
              daily_max_price: 30000,
              handling_fee: 10000,
              effective_date: "2026-01-01",
            },
          ]);
        }

        try {
          const floorsRes = await api.get("/parking/floors");
          if (floorsRes.data?.success) {
            const sortedFloors = floorsRes.data.data
              .filter((z) => z.status === "ACTIVE")
              .sort((a, b) => a.floor_number - b.floor_number || a.zone_name.localeCompare(b.zone_name));
            setFloors(sortedFloors);
          }
        } catch (floorsErr) {
          console.error("Failed to load floors allocation:", floorsErr);
        }
      } catch (err) {
        setError(
          err.message ||
          (language === "en"
            ? "Cannot connect to the parking management server."
            : "Không thể kết nối đến máy chủ quản lý đỗ xe.")
        );
      } finally {
        setLoading(false);
      }
    };
    fetchRealtimeDashboard();
  }, [language]);

  // Auto-carousel
  useEffect(() => {
    const t = setInterval(
      () => setCurrentImgIndex((p) => (p + 1) % STATIC_IMAGES.length),
      5000
    );
    return () => clearInterval(t);
  }, []);

  // Handle ESC key for closing the rules modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowRulesModal(false);
    };
    if (showRulesModal) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRulesModal]);

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((p) => (p + 1) % STATIC_IMAGES.length);
  };
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((p) => (p - 1 + STATIC_IMAGES.length) % STATIC_IMAGES.length);
  };

  const availableSlotsCount = buildingInfo.current_occupancy?.total_available ?? 0;
  const totalSlots = buildingInfo.total_slots || 0;

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl transition-colors duration-300">
        <RefreshCw className="w-7 h-7 text-blue-500 dark:text-blue-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {language === "en" ? "Updating live parking status..." : "Đang cập nhật trạng thái đỗ xe..."}
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================
  if (error) {
    return (
      <div className="w-full p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl flex flex-col items-center text-center space-y-3 transition-colors duration-300">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h4 className="text-base font-black text-rose-700 dark:text-rose-400">
          {language === "en" ? "Connection Error" : "Lỗi kết nối"}
        </h4>
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400/80 max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition active:scale-95">
          {language === "en" ? "RELOAD DATA" : "TẢI LẠI DỮ LIỆU"}
        </button>
      </div>
    );
  }

  // ==========================================
  // VEHICLE ICON HELPER
  // ==========================================
  const vehicleIcon = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("xe máy") || n.includes("motorbike") || n.includes("motor")) {
      return <Bike size={14} className="shrink-0" />;
    }
    return <Car size={14} className="shrink-0" />;
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="animate-slide-in w-full font-sans transition-colors duration-300">

      {/* ── HERO SECTION ── */}
      <div className="relative w-full rounded-xl overflow-hidden min-h-[320px] md:min-h-[400px] group">
        {/* Background carousel */}
        <div
          className="absolute inset-0 flex transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}>
          {STATIC_IMAGES.map((url, i) => (
            <img
              key={i}
              src={url}
              alt="Parking"
              className="w-full h-full object-cover shrink-0 select-none scale-100 group-hover:scale-105 transition-transform duration-[8000ms]"
            />
          ))}
        </div>

        {/* Dark gradient overlay — same in both modes (hero always dark for readability) */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-slate-950/90 z-10" />

        {/* Info button on the top-right of the building image */}
        <button
          type="button"
          onClick={() => setShowRulesModal(true)}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/55 hover:bg-blue-600 border border-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-black/40 backdrop-blur-sm"
          title={language === "en" ? "Parking Rules" : "Nội quy bãi xe"}
        >
          <Info size={15} className="text-white" />
        </button>



        {/* Carousel controls */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-blue-600 backdrop-blur text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10">
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-blue-600 backdrop-blur text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10">
          <ChevronRight size={16} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-[130px] md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {STATIC_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentImgIndex(i)}
              className={`h-1  transition-all duration-500 ${currentImgIndex === i ? "w-6 bg-blue-400" : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
            />
          ))}
        </div>

        {/* Hero content — always on dark overlay so text stays white */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-5 md:p-7">
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-2 drop-shadow-lg">
            {buildingInfo.building_name || (language === "en" ? "Smart Parking Lot" : "Bãi đỗ xe thông minh")}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-1.5">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-white">4.9</span>
              <span className="text-slate-400 text-xs">(142 {language === "en" ? "Reviews" : "đánh giá"})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-400 shrink-0" />
              <span className="text-slate-300 text-xs leading-tight max-w-xs">
                {buildingInfo.address || "92 - 94 Nam Kỳ Khởi Nghĩa, Sài Gòn, Hồ Chí Minh 70000, Việt Nam"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
              <Share2 size={13} />
              {language === "en" ? "Share" : "Chia sẻ"}
            </button>
            {availableSlotsCount > 0 ? (
              <button
                type="button"
                onClick={() => navigate("/user/book")}
                className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] uppercase tracking-wide">
                <Calendar size={14} className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span>{language === "en" ? "Book A Slot" : "Đặt chỗ ngay"}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 bg-rose-700/50 text-rose-300 text-xs font-extrabold px-4 py-2 rounded-xl cursor-not-allowed uppercase tracking-wide">
                <XCircle size={13} />
                {language === "en" ? "Parking Full" : "Hết chỗ"}
              </button>
            )}
          </div>
        </div>
      </div>



      {/* ── MAIN CONTENT GRID ── */}
      <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* LEFT COL */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* Pricing Rates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={13} />
                {language === "en" ? "Parking Rates" : "Bảng giá đỗ xe"}
              </h3>
              <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {language === "en" ? "Standard" : "Tiêu chuẩn"}
              </span>
            </div>

            {pricingPolicy.length > 0 ? (
              <div className="space-y-4">
                {pricingPolicy.map((policy) => (
                  <div key={policy.policy_id || policy.vehicle_type_id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-blue-500 dark:text-blue-400">{vehicleIcon(policy.vehicle_type_name)}</div>
                      <span className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wide">
                        {policy.vehicle_type_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3">
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mb-1">
                          {language === "en" ? `Base Price (${policy.base_hours}h)` : `Giá vào cổng (${policy.base_hours}h)`}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-black text-sm">{fmtVND(policy.base_price)}đ</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3">
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mb-1">
                          {language === "en" ? `Subsequent (${policy.subsequent_hours}h)` : `Block sau (${policy.subsequent_hours}h)`}
                        </p>
                        <p className="text-amber-600 dark:text-amber-400 font-black text-sm">+{fmtVND(policy.subsequent_rate)}đ</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3">
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mb-1">
                          {language === "en" ? "Daily Max 24h" : "Trần 24h"}
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{fmtVND(policy.daily_max_price)}đ</p>
                      </div>
                    </div>
                    {/* {policy.handling_fee > 0 && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 font-semibold flex justify-between">
                        <span>{language === "en" ? "Lost Card Penalty" : "Phí báo mất thẻ"}:</span>
                        <span className="font-bold text-rose-500">{fmtVND(policy.handling_fee)}đ</span>
                      </div>
                    )} */}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">
                {language === "en" ? "Loading pricing rates..." : "Đang tải bảng giá..."}
              </p>
            )}


          </div>

          {/* Operating Hours */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-300">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Clock size={13} />
              {language === "en" ? "Operating Hours" : "Giờ hoạt động"}
            </h3>
            <div className="space-y-0">
              {[
                {
                  day: language === "en" ? "Mon – Fri" : "Thứ 2 – Thứ 6",
                  hours: buildingInfo.operation_hours?.is_24_7
                    ? (language === "en" ? "Open 24/7" : "Mở cửa 24/7")
                    : (buildingInfo.operation_hours?.weekday_hours || "Open 24/7"),
                },
                {
                  day: language === "en" ? "Weekend/Holiday" : "Cuối Tuần/Ngày lễ",
                  hours: buildingInfo.operation_hours?.is_24_7
                    ? (language === "en" ? "Open 24/7" : "Mở cửa 24/7")
                    : (buildingInfo.operation_hours?.weekend_hours || "Open 24/7"),
                },

              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{row.day}</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{row.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors duration-300">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={13} />
                  {language === "en" ? "Location & Surroundings" : "Vị trí & Xung quanh"}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {language === "en" ? "92 - 94 Nam Ky Khoi Nghia, Ho Chi Minh" : "92 - 94 Nam Kỳ Khởi Nghĩa, Hồ Chí Minh"}
                </p>
              </div>
              <MapPin size={14} className="text-blue-500" />
            </div>
            <div className="h-48 w-full">
              <iframe
                src={FALLBACK_MAP_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.open("https://www.google.com/maps/dir/?api=1&destination=92+Nam+Ky+Khoi+Nghia,+Ho+Chi+Minh", "_blank")}
                className="flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition border-r border-slate-100 dark:border-slate-800">
                <Navigation size={13} className="text-blue-500 dark:text-blue-400" />
                {language === "en" ? "Get Directions" : "Chỉ đường"}
              </button>
              <button
                type="button"
                onClick={() => window.open("https://www.google.com/maps/search/?api=1&query=92+Nam+Ky+Khoi+Nghia,+Ho+Chi+Minh", "_blank")}
                className="flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <ExternalLink size={13} className="text-blue-500 dark:text-blue-400" />
                {language === "en" ? "Open in Google Maps" : "Mở Google Maps"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COL */}
        <div className="flex flex-col gap-3">

          {/* Live Availability */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {language === "en" ? "Live Availability" : "Chỗ trống hiện tại"}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>

            {buildingInfo.vehicle_type_availability && buildingInfo.vehicle_type_availability.length > 0 ? (
              buildingInfo.vehicle_type_availability.map((vt) => {
                const available = vt.available_slots;
                const cap = vt.total_slots;
                const pct = cap > 0 ? Math.min(100, Math.round(((cap - available) / cap) * 100)) : 0;
                const isHighOccupancy = pct > 70;

                return (
                  <div key={vt.vehicle_type_id} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="text-blue-500 dark:text-blue-400">{vehicleIcon(vt.vehicle_type_name)}</div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{vt.vehicle_type_name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-white">
                        {available} <span className="text-slate-400 dark:text-slate-500 font-normal">/ {cap}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isHighOccupancy
                          ? "bg-gradient-to-r from-amber-500 to-rose-500"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[10px] font-bold ${isHighOccupancy ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {pct}% {language === "en" ? "Capacity Reached" : "Đã sử dụng"}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400">
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              pricingPolicy.map((policy) => {
                const isCar = policy.vehicle_type_id === 2;
                const available = isCar ? availableSlotsCount : Math.round(availableSlotsCount * 0.6);
                const cap = isCar ? totalSlots : Math.round(totalSlots * 0.6);
                const pct = cap > 0 ? Math.min(100, Math.round(((cap - available) / cap) * 100)) : 0;
                const isHighOccupancy = pct > 70;

                return (
                  <div key={policy.policy_id} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="text-blue-500 dark:text-blue-400">{vehicleIcon(policy.vehicle_type_name)}</div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{policy.vehicle_type_name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-white">
                        {available} <span className="text-slate-400 dark:text-slate-500 font-normal">/ {cap}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isHighOccupancy
                          ? "bg-gradient-to-r from-amber-500 to-rose-500"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[10px] font-bold ${isHighOccupancy ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {pct}% {language === "en" ? "Capacity Reached" : "Đã sử dụng"}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400">
                        {available} {language === "en" ? "Available" : "Còn trống"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {/* Total Capacity & Floors */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 dark:bg-blue-950/50 p-1.5 rounded-lg">
                  <Building size={13} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{language === "en" ? "Capacity" : "Sức chứa"}</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white">{totalSlots}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 dark:bg-indigo-950/50 p-1.5 rounded-lg">
                  <Layers size={13} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{language === "en" ? "Floors" : "Số tầng"}</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white">{buildingInfo?.total_floors}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floor Allocation Map Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-300">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              {language === "en" ? "Floor Map" : "Bản đồ tầng"}
            </h3>

            {floors.length > 0 ? (
              <div className="space-y-3">
                {floors.map((fl) => {
                  const isCar = fl.vehicle_type_id === 2;
                  return (
                    <div
                      key={fl.zone_id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-850/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                          <span className="text-xs font-black font-mono">F{fl.floor_number}</span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">
                            {language === "en" ? `Floor ${fl.floor_number}` : `Tầng ${fl.floor_number}`} — {fl.zone_name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                            {language === "en" ? `Capacity: ${fl.capacity} slots` : `Sức chứa: ${fl.capacity} xe`}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isCar
                        ? "bg-blue-50/80 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"
                        : "bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                        }`}>
                        {isCar ? <Car size={13} /> : <Bike size={13} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">
                {language === "en" ? "Loading floor configurations..." : "Đang tải cấu hình phân tầng..."}
              </p>
            )}
          </div>

          {/* Latest Feedback */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-300">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              {language === "en" ? "Latest Feedback" : "Đánh giá gần đây"}
            </h3>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                J
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  {language === "en"
                    ? '"Best parking experience in the area. The automated entry is flawless."'
                    : '"Trải nghiệm đỗ xe tốt nhất khu vực. Hệ thống vào tự động rất mượt mà."'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-bold">
                  James R. · {language === "en" ? "2 hours ago" : "2 giờ trước"}
                </p>
              </div>
            </div>
          </div>


        </div>
      </div>

      {showRulesModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans antialiased animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowRulesModal(false)} />

          <div className="relative w-full max-w-4xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[90vh]">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-xl transition-colors bg-slate-50 dark:bg-slate-800"
            >
              <XCircle size={18} />
            </button>

            {/* Header */}
            <div className="mb-6 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0 shadow-md">
                <Info size={20} />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {language === "en" ? "PARKING LOT REGULATIONS" : "NỘI QUY BÃI GIỮ XE"}
                </h3>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                  {language === "en"
                    ? "Please strictly comply with the following regulations for safety and security."
                    : "Để đảm bảo an toàn tài sản, phòng chống cháy nổ và giữ gìn trật tự chung."}
                </p>
              </div>
            </div>

            {/* Content Table Container */}
            <div className="overflow-y-auto pr-1 flex-1 min-h-0 space-y-4 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-850 rounded-xl">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-350 font-black uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                      <th className="py-3 px-4 w-[25%]">{language === "en" ? "Scenario / Process" : "Quy trình / Tình huống"}</th>
                      <th className="py-3 px-4 w-[45%]">{language === "en" ? "Mandatory Action" : "Hành động bắt buộc"}</th>
                      <th className="py-3 px-4 w-[30%]">{language === "en" ? "Important Note" : "Lưu ý quan trọng"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {/* Row 1 */}
                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {language === "en" ? "1. VEHICLE ENTRY" : "1. KHI VÀO BÃI XE"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-350 leading-relaxed">
                        {language === "en" ? (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Slow down, stop at the designated line.</li>
                            <li>Take a paper ticket or scan RFID card as instructed.</li>
                            <li>Only enter when the barrier gate opens.</li>
                          </ul>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Giảm tốc độ, dừng đúng vạch quy định.</li>
                            <li>Nhận vé giấy hoặc quẹt thẻ từ theo hướng dẫn.</li>
                            <li>Chỉ di chuyển vào bãi khi có tín hiệu/barie mở.</li>
                          </ul>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 leading-relaxed">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {language === "en" ? "Keep your card/ticket safe" : "Bảo quản thẻ/vé cẩn thận"}
                        </span>
                        {language === "en"
                          ? ", do not tear, wet, or lose it."
                          : ", không làm rách, ướt hoặc làm mất."}
                      </td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {language === "en" ? "2. MOVEMENT & PARKING" : "2. DI CHUYỂN & ĐỖ XE"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-350 leading-relaxed">
                        {language === "en" ? (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Speed limit inside the lot is <strong className="text-blue-600">under 5 km/h</strong>.</li>
                            <li>Park in designated zones (motorbike, car,...).</li>
                          </ul>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Tốc độ di chuyển bên trong bãi <strong className="text-blue-500">dưới 5 km/h</strong>.</li>
                            <li>Đỗ đúng phân khu quy định (xe máy, ô tô,...).</li>
                          </ul>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 leading-relaxed">
                        {language === "en"
                          ? "Do not block walkways, emergency exits, or firefighting equipment areas."
                          : "Không đỗ xe chặn lối đi, lối thoát hiểm hoặc khu vực để thiết bị PCCC."}
                      </td>
                    </tr>




                    {/* Row 4 */}
                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {language === "en" ? "3. PERSONAL PROPERTY" : "3. TÀI SẢN CÁ NHÂN"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-350 leading-relaxed">
                        {language === "en" ? (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Keep helmets and raincoats secured on the vehicle.</li>
                            <li><strong className="text-red-600 dark:text-red-400">DO NOT</strong> leave cash, jewelry, laptops, or phones inside the glove compartment or vehicle cabin.</li>
                          </ul>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Tự bảo quản mũ bảo hiểm, áo mưa treo trên xe.</li>
                            <li><strong className="text-red-600 dark:text-red-400">KHÔNG để</strong> tiền bạc, trang sức, điện thoại, laptop... trong cốp xe hoặc trong khoang ô tô.</li>
                          </ul>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 leading-relaxed">
                        {language === "en"
                          ? "The parking lot is only responsible for the vehicle, not contents inside/on it."
                          : "Bãi xe chỉ bảo quản chiếc xe, không chịu trách nhiệm đối với đồ đạc bên trong/trên xe."}
                      </td>
                    </tr>

                    {/* Row 5 */}
                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {language === "en" ? "5. VEHICLE EXIT" : "5. KHI RA KHỎI BÃI"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-350 leading-relaxed">
                        {language === "en" ? (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Present paper ticket or scan RFID card at the gate.</li>
                            <li>Wait for staff or system to verify matching license plate.</li>
                            <li>Pay parking fee according to the listed tariff.</li>
                          </ul>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Xuất trình vé giấy hoặc quẹt lại thẻ từ tại quầy.</li>
                            <li>Chờ nhân viên/hệ thống đối chiếu trùng khớp biển số.</li>
                            <li>Thanh toán phí gửi xe theo đúng biểu giá niêm yết.</li>
                          </ul>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 leading-relaxed">
                        {language === "en"
                          ? "Real plate and entry card data must match 100%."
                          : "Biển số xe thực tế và dữ liệu thẻ lúc vào phải trùng khớp 100%."}
                      </td>
                    </tr>

                    {/* Row 6 */}
                    <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {language === "en" ? "6. LOST TICKET/CARD" : "6. XỬ LÝ MẤT THẺ/VÉ"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-350 leading-relaxed">
                        {language === "en" ? (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Report immediately to management or security.</li>
                            <li>Present ID card and vehicle registration card.</li>
                            <li>Sign commitment form and pay lost card penalty.</li>
                          </ul>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Báo ngay cho ban quản lý/bảo vệ bãi xe.</li>
                            <li>Xuất trình CCCD/CMND + Giấy đăng ký xe (Cà-vẹt).</li>
                            <li>Ký biên bản cam kết và đóng phí phạt mất thẻ.</li>
                          </ul>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 leading-relaxed">
                        {language === "en"
                          ? "Security reserves the right to hold the vehicle if legal ownership is not proven."
                          : "Bảo vệ có quyền giữ xe lại nếu khách không chứng minh được quyền sở hữu hợp pháp."}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer banner */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider uppercase">
                {language === "en" ? "eParking - Smart Parking System" : "eParking - Hệ thống bãi đỗ xe thông minh"}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}