// src/pages/user/UserDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
  MapPin,
  Clock,
  Layers,
  XCircle,
  Calendar,
  Star,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

// ==========================================
// STATIC PRESENTATION CONSTANTS (Fallback Data)
// ==========================================
const STATIC_IMAGES = [
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1000",
];

// Embedded Google Maps URL assigned properly to a variable
const FALLBACK_MAP_URL = "https://maps.google.com/maps?q=Saigon%20Hi-Tech%20Park,%20Ho%20Chi%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // STATE MANAGEMENT (Matches Backend DTO Structure)
  // ==========================================
  const [buildingInfo, setBuildingInfo] = useState({
    building_id: "",
    building_name: "",
    address: "",
    total_floors: 0,
    total_slots: 0,
    status: "",
    operation_hours: {
      weekday_hours: "",
      weekend_hours: "",
      is_24_7: false,
    },
    current_occupancy: {
      total_occupied: 0,
      total_available: 0,
      occupancy_rate: 0,
    },
  });

  const [pricingPolicy, setPricingPolicy] = useState([]);

  // ==========================================
  // FETCH REALTIME DATA FROM BACKEND API
  // ==========================================
  useEffect(() => {
    const fetchRealtimeDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch Core Data (Parking Building Information)
        try {
          const buildingRes = await api.get("/parking/buildings/info");
          if (buildingRes.data && buildingRes.data.success) {
            setBuildingInfo(buildingRes.data.data);
          }
        } catch (buildingErr) {
          console.error("Core building API error:", buildingErr);
          throw new Error(buildingErr.response?.data?.message || (language === "en" ? "Failed to load parking building information." : "Tải thông tin tòa nhà đỗ xe thất bại."));
        }

        // 2. Fetch Helper Data (Pricing Policy)
        try {
          const pricingRes = await api.get("/parking/buildings/pricing/current");
          if (pricingRes.data && pricingRes.data.success) {
            setPricingPolicy(pricingRes.data.data);
          }
        } catch (pricingErr) {
          console.warn("Pricing API fallback activated:", pricingErr);
          setPricingPolicy([
            {
              policy_id: 1,
              vehicle_type_id: 1,
              vehicle_type_name: language === "en" ? "Automobile (Car)" : "Ô tô",
              base_price: 15000,
              hourly_rate: 10000,
              overnight_fee: 30000,
              effective_date: "2026-01-01",
            },
            {
              policy_id: 2,
              vehicle_type_id: 2,
              vehicle_type_name: language === "en" ? "Motorbike" : "Xe máy",
              base_price: 5000,
              hourly_rate: 2000,
              overnight_fee: 10000,
              effective_date: "2026-01-01",
            },
          ]);
        }
      } catch (err) {
        console.error("Dashboard synchronization failed:", err);
        setError(err.message || (language === "en" ? "Cannot connect to the parking management server." : "Không thể kết nối đến máy chủ quản lý đỗ xe."));
      } finally {
        setLoading(false);
      }
    };

    fetchRealtimeDashboard();
  }, [language]);

  // Auto-play timer for the image carousel slider
  useEffect(() => {
    const autoSlideTimer = setInterval(() => {
      setCurrentImgIndex((prevIndex) => (prevIndex + 1) % STATIC_IMAGES.length);
    }, 5000);
    return () => clearInterval(autoSlideTimer);
  }, []);

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prevIndex) => (prevIndex + 1) % STATIC_IMAGES.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prevIndex) => (prevIndex - 1 + STATIC_IMAGES.length) % STATIC_IMAGES.length);
  };

  // Safe checks for calculations
  const availableSlotsCount = buildingInfo.current_occupancy?.total_available || 0;
  const occupancyPercent = Math.min(100, Math.max(0, Math.round(buildingInfo.current_occupancy?.occupancy_rate || 0)));

  // Dynamic status configurations helper
  const renderStatusBadge = (status) => {
    const normalizedStatus = status?.toUpperCase() || "";
    if (normalizedStatus === "ACTIVE" || normalizedStatus === "OPEN") {
      return (
        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider h-fit mt-1.5">
          {language === "en" ? "Open" : "Hoạt động"}
        </span>
      );
    }
    if (normalizedStatus === "MAINTENANCE") {
      return (
        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider h-fit mt-1.5">
          {language === "en" ? "Maintenance" : "Bảo trì"}
        </span>
      );
    }
    return status ? (
      <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider h-fit mt-1.5">
        {status}
      </span>
    ) : null;
  };

  // STATE 1: LOADING DATA FROM SERVER
  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
        <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {language === "en" ? "Updating live parking status..." : "Đang cập nhật trạng thái đỗ xe trực tiếp..."}
        </p>
      </div>
    );
  }

  // STATE 2: CONNECTION ERROR DISPLAY
  if (error) {
    return (
      <div className="w-full p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h4 className="text-base font-black text-rose-800 dark:text-rose-400">
          {language === "en" ? "Connection Error" : "Lỗi kết nối"}
        </h4>
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400/80 max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95">
          {language === "en" ? "RELOAD DATA" : "TẢI LẠI DỮ LIỆU"}
        </button>
      </div>
    );
  }

  // STATE 3: RENDER DASHBOARD SUCCESSFULLY
  return (
    <div className="animate-slide-in w-full h-full space-y-0 ">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col lg:flex-row transition-colors duration-300 h-full ">
        {/* LEFT COMPONENT: IMAGE CAROUSEL SLIDER */}
        <div className="w-full lg:w-2/5 relative min-h-[340px] lg:min-h-full group overflow-hidden bg-slate-950">
          <div className="absolute inset-0 flex transition-transform duration-[1000ms] cubic-bezier(0.4, 0, 0.2, 1)" style={{ transform: `translateX(-${currentImgIndex * 100}%)` }}>
            {STATIC_IMAGES.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Parking Lot View"
                className="w-full h-full object-cover shrink-0 select-none transition-transform duration-[1000ms] group-hover:scale-[1.04]"
              />
            ))}
          </div>

          {/* Deep dark gradient overlay at the bottom and top to blend image beautifully */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none z-10"></div>

          <button
            type="button"
            onClick={handlePrevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600 text-white p-2.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hover:scale-110 border border-white/10">
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600 text-white p-2.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hover:scale-110 border border-white/10">
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {STATIC_IMAGES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentImgIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${currentImgIndex === idx ? "w-6 bg-blue-500" : "w-1.5 bg-white/40 hover:bg-white"}`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT COMPONENT: METRICS & DETAILS CONTENTS */}
        <div className="w-full lg:w-3/5 p-4 md:p-5 lg:p-6 flex flex-col justify-between">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {buildingInfo.building_name || (language === "en" ? "Smart Parking Lot" : "Bãi đỗ xe thông minh")}
              </h3>
              {renderStatusBadge(buildingInfo.status)}
            </div>
            <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
              <MapPin className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
              <p className="text-sm md:text-base font-medium leading-relaxed">{buildingInfo.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col space-y-5 justify-between">
              {/* BLOCK 1: OPERATING HOURS */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Clock size={14} /> {language === "en" ? "Operating Hours" : "Giờ hoạt động"}
                </p>
                <div className="space-y-1 text-xs md:text-sm bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 p-3 rounded-xl font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>{language === "en" ? "Weekdays:" : "Ngày thường:"}</span>
                    <span className="font-bold">{buildingInfo.operation_hours?.weekday_hours || "06:00 - 22:00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === "en" ? "Weekends / Holidays:" : "Cuối tuần / Ngày lễ:"}</span>
                    <span className="font-bold">{buildingInfo.operation_hours?.weekend_hours || "07:00 - 23:00"}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  <Layers size={14} /> {language === "en" ? "Parking Status" : "Trạng thái đỗ xe"}
                </p>
                {(() => {
                  const totalAvailable = buildingInfo.current_occupancy?.total_available ?? 0;
                  const isClosed = buildingInfo.status?.toUpperCase() === "MAINTENANCE" || buildingInfo.status?.toUpperCase() === "CLOSED";

                  let statusTitle = language === "en" ? "Available" : "Còn chỗ trống";
                  let statusDesc = language === "en"
                    ? `${totalAvailable} / ${buildingInfo.total_slots || 0} slots are open for booking.`
                    : `Còn trống ${totalAvailable} / ${buildingInfo.total_slots || 0} vị trí sẵn sàng đặt chỗ.`;
                  let statusColorClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-800/40";
                  let dotColorClass = "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]";

                  if (isClosed) {
                    statusTitle = language === "en" ? "Maintenance / Closed" : "Đóng cửa / Bảo trì";
                    statusDesc = language === "en"
                      ? "The parking building is temporarily closed for maintenance."
                      : "Tòa nhà đỗ xe đang tạm thời đóng cửa để bảo trì.";
                    statusColorClass = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-800/40";
                    dotColorClass = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]";
                  } else if (totalAvailable === 0) {
                    statusTitle = language === "en" ? "Parking Full" : "Đã hết chỗ";
                    statusDesc = language === "en"
                      ? `0 / ${buildingInfo.total_slots || 0} slots available. All spaces are occupied.`
                      : `Hết chỗ trống (0 / ${buildingInfo.total_slots || 0}). Tất cả các vị trí đã có xe đỗ.`;
                    statusColorClass = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-800/40";
                    dotColorClass = "bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]";
                  } else if (totalAvailable <= 10) {
                    statusTitle = language === "en" ? "Limited Spaces" : "Sắp hết chỗ";
                    statusDesc = language === "en"
                      ? `Only ${totalAvailable} / ${buildingInfo.total_slots || 0} slots left. Book a spot quickly!`
                      : `Chỉ còn lại ${totalAvailable} / ${buildingInfo.total_slots || 0} chỗ trống. Hãy đặt chỗ ngay!`;
                    statusColorClass = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-800/40";
                    dotColorClass = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]";
                  }

                  return (
                    <div className={`p-4 rounded-2xl border flex gap-3.5 items-start transition-all duration-300 ${statusColorClass}`}>
                      <div className="relative flex h-3 w-3 mt-1 shrink-0">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColorClass}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColorClass.split(" ")[0]}`}></span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider leading-none mb-1.5">{statusTitle}</h4>
                        <p className="text-xs font-semibold opacity-90 leading-normal">{statusDesc}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="h-40 w-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner min-h-[160px] mb-3">
                <iframe
                  src={FALLBACK_MAP_URL}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>

            <div className="flex flex-col justify-between h-full space-y-2">

              {/* CARD REVIEW DISPLAY SCORING */}
              <div className="p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 dark:bg-amber-950/40 p-1.5 rounded-lg text-amber-500 shrink-0">
                    <Star size={14} className="fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {language === "en" ? "Score" : "Đánh giá"}
                    </p>
                    <p className="text-xs font-black text-slate-800 dark:text-white">
                      4.9 <span className="text-[10px] font-normal text-slate-400">/ 5.0</span>
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                  {language === "en" ? "142 Reviews" : "142 đánh giá"}
                </span>
              </div>

              {/* =========================================================
                   BLOCK 4: Pricing Policies Display
                  ========================================================= */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-500" />
                  {language === "en" ? "Parking Rates" : "Bảng giá đỗ xe"}
                </p>
                {pricingPolicy.length > 0 ? (
                  <div className="flex flex-col gap-2 text-[11px] ">
                    {pricingPolicy.map((policy) => (
                      <div
                        key={policy.policy_id || policy.vehicle_type_id}
                        className="p-3 bg-slate-50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800 rounded-xl flex flex-col justify-between gap-1.5 transition-all hover:border-slate-200 dark:hover:border-slate-700">
                        {/* Header: Full Vehicle Type Name (Left) + Darker/Bolder Effective Date (Right) */}
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">
                            {policy.vehicle_type_name}
                          </span>
                          {policy.effective_date && (
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono">
                              {language === "en" ? "Applied:" : "Áp dụng:"} {policy.effective_date}
                            </span>
                          )}
                        </div>

                        {/* Content: Inline pricing fields safely handled with calculations */}
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold text-[11px] px-0.5">
                          <p>
                            {language === "en" ? "Base:" : "Giá sàn:"} <span className="text-blue-600 dark:text-blue-400 font-bold">{policy.base_price?.toLocaleString()}đ</span>
                          </p>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <p>
                            {language === "en" ? "Hour:" : "Giá giờ:"} <span className="text-amber-600 dark:text-amber-500 font-bold">+{policy.hourly_rate?.toLocaleString()}đ/h</span>
                          </p>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <p>
                            {language === "en" ? "Overnight:" : "Qua đêm:"} <span className="text-emerald-600 dark:text-emerald-400 font-bold">{policy.overnight_fee?.toLocaleString()}đ</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/40 text-center text-xs font-medium text-slate-400 rounded-xl italic">
                    {language === "en" ? "Loading pricing rates..." : "Đang tải bảng giá đỗ xe..."}
                  </div>
                )}
              </div>

              {/* BOOKING GUARANTEE NOTICE */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-2.5">
                <div className="bg-blue-100 dark:bg-blue-900/45 p-1.5 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                  <AlertCircle size={14} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {language === "en" ? "Booking Guarantee" : "Cam kết giữ chỗ"}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-450 font-semibold leading-relaxed mt-0.5">
                    {language === "en"
                      ? "Your reserved slot is guaranteed and held for up to "
                      : "Vị trí đặt chỗ của bạn được đảm bảo và giữ tối đa trong "}
                    <span className="font-bold text-slate-800 dark:text-white">
                      {language === "en" ? "30 minutes" : "30 phút"}
                    </span>
                    {language === "en"
                      ? " past your selected booking time. Prepayment via VNPay is required."
                      : " tính từ thời gian đặt chỗ đã chọn. Yêu cầu thanh toán trước qua VNPay."}
                  </p>
                </div>
              </div>

              {/* ACTION TRIGGER BUTTON */}
              {availableSlotsCount > 0 ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/user/book")}
                    className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-3.5 rounded-xl font-extrabold shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.99] text-xs tracking-wider uppercase">
                    <Calendar size={15} className="group-hover:rotate-12 transition-transform duration-300" />
                    {language === "en" ? "Book A Slot Now" : "Đặt chỗ đỗ xe ngay"} &rarr;
                  </button>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 p-3.5 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs justify-center uppercase tracking-wider shadow-inner">
                  <XCircle size={16} />
                  {language === "en" ? "Parking Lot is Full" : "Bãi đỗ xe đã hết chỗ"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
