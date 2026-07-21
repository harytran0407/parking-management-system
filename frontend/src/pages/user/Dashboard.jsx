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
  CheckCircle2,
  CalendarCheck,
  MoreVertical,
  Receipt,
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

const formatTime = (iso, language = "vi") => {
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString(language === "en" ? "en-US" : "vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return "—";
  }
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [recentBooking, setRecentBooking] = useState(null);

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

        // Fetch user's bookings to show the most recent session
        try {
          const bookingsRes = await api.get("/bookings/my");
          if (bookingsRes.data?.success && bookingsRes.data.data.length > 0) {
             // Filter out cancelled and completed; only keep confirmed / active
             const eligible = bookingsRes.data.data.filter((bk) => {
               const st = (bk.status.toLowerCase() === "active" && !bk.actual_check_in)
                 ? "confirmed"
                 : bk.status.toLowerCase();
               return st === "confirmed" || st === "active";
             });

            if (eligible.length === 0) { setRecentBooking(null); return; }

            const sorted = [...eligible].sort((a, b) => {
              const score = (bk) => {
                const stat = (bk.status.toLowerCase() === "active" && !bk.actual_check_in) ? "confirmed" : bk.status.toLowerCase();
                if (stat === "confirmed") return 4;
                return 1;
              };
              const scoreDiff = score(b) - score(a);
              if (scoreDiff !== 0) return scoreDiff;
              return new Date(b.booking_time).getTime() - new Date(a.booking_time).getTime();
            });

            const b = sorted[0];
            const typeId = b.vehicle_type_id;
            const typeNameLower = (b.vehicle_type || "").toLowerCase();
            const isCar = typeId === 2 || (typeId !== 1 && (typeNameLower.includes("car") || typeNameLower.includes("ô tô")));
            const defaultPrice = isCar ? 15000 : 5000;

            setRecentBooking({
              id: b.booking_id,
              slotId: b.slot_id || "N/A",
              slotName: b.slot_name || (language === "en" ? "Assigned at Check-in" : "Chỉ định lúc Check-in"),
              floorNumber: b.floor_number,
              zoneName: b.zone_name || "TBD",
              vehicleType: isCar ? "car" : "motorbike",
              plate_number: b.license_plate,
              startTime: b.expected_arrival,
              endTime: b.expired_at,
              totalPrice: b.estimated_fee || b.deposit_paid || defaultPrice,
              depositPaid: b.deposit_paid || defaultPrice,
              earlyFee: b.early_fee || 0,
              penaltyFee: b.penalty_fee || 0,
              actualCheckIn: b.actual_check_in || null,
              actualCheckOut: b.actual_check_out || null,
              status: (b.status.toLowerCase() === "active" && !b.actual_check_in) ? "confirmed" : b.status.toLowerCase(),
              isLocked: b.is_locked,
              bookingTime: b.booking_time,
              paymentMethod: b.payment_method || null,
            });
          } else {
            setRecentBooking(null);
          }
        } catch (bookingErr) {
          console.error("Failed to load user recent booking:", bookingErr);
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
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl transition-colors duration-300">
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
      <div className="w-full p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex flex-col items-center text-center space-y-3 transition-colors duration-300">
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
      <div className="relative w-full rounded-xl overflow-hidden min-h-[280px] sm:min-h-[340px] md:min-h-[400px] group">
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
        <div className="absolute bottom-[150px] sm:bottom-[120px] md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
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
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-5 md:p-7">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-2 drop-shadow-lg">
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
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-10 gap-6">

        {/* LEFT COL */}
        <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col gap-6">

          {/* Pricing Rates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-md">
                <Receipt size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {language === "en" ? "Parking Fee Schedule" : "Biểu phí đỗ xe"}
                </h3>
              </div>
            </div>

            {pricingPolicy.length > 0 ? (() => {
              const firstPolicy = pricingPolicy[0] || { base_hours: 4, subsequent_hours: 1 };
              const baseHoursLabel = `${firstPolicy.base_hours}H`;
              const subsequentHoursLabel = `${firstPolicy.subsequent_hours}H`;
              const lostFee = pricingPolicy.find(p => p.handling_fee > 0)?.handling_fee || 50000;

              return (
                <>
                  <div className="overflow-x-auto w-full mt-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                          <th className="py-3 px-4 font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400">
                            {language === "en" ? "Vehicle Type" : "Loại xe"}
                          </th>
                          <th className="py-3 px-4 font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400">
                            {language === "en" ? `Base Price (${baseHoursLabel})` : `Giá cổng (${baseHoursLabel})`}
                          </th>
                          <th className="py-3 px-4 font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400">
                            {language === "en" ? `Subsequent (${subsequentHoursLabel})` : `Block sau (${subsequentHoursLabel})`}
                          </th>
                          <th className="py-3 px-4 font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400 text-right">
                            {language === "en" ? "Daily Max (24H)" : "Trần 24H"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {pricingPolicy.map((policy) => {
                          const isCar = (policy.vehicle_type_name || "").toLowerCase().includes("car") || (policy.vehicle_type_name || "").toLowerCase().includes("ô tô") || policy.vehicle_type_id === 2;
                          const titleVi = isCar ? "Ô TÔ" : "XE MÁY";
                          const titleEn = isCar ? "CAR" : "MOTORBIKE";
                          const icon = isCar ? <Car size={18} className="shrink-0" /> : <Bike size={18} className="shrink-0" />;

                          return (
                            <tr key={policy.policy_id || policy.vehicle_type_id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                              {/* Col 1: Vehicle Type */}
                              <td className="py-3 px-4 flex items-center gap-3">
                                <div className="text-blue-600 dark:text-blue-400">
                                  {icon}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                    {language === "en" ? titleEn : titleVi}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                    {language === "en" ? titleVi : titleEn}
                                  </span>
                                </div>
                              </td>
                              {/* Col 2: Base Price */}
                              <td className="py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-350">
                                {fmtVND(policy.base_price)}đ
                              </td>
                              {/* Col 3: Subsequent */}
                              <td className="py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-350">
                                +{fmtVND(policy.subsequent_rate)}đ
                              </td>
                              {/* Col 4: Daily Max */}
                              <td className="py-3 px-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                                {fmtVND(policy.daily_max_price)}đ
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    <Info size={16} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="margin-0 text-[11px]">
                      {language === "en"
                        ? `Lost ticket fee is ${fmtVND(lostFee)}đ. Overnight parking is available and secure.`
                        : `Phí mất vé là ${fmtVND(lostFee)}đ. Có chỗ đỗ xe qua đêm an toàn.`}
                    </p>
                  </div>
                </>
              );
            })() : (
              <p className="text-xs text-slate-400 italic text-center py-8">
                {language === "en" ? "Loading pricing rates..." : "Đang tải bảng giá..."}
              </p>
            )}

          </div>

          {/* Operating Hours */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-300">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-md">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {language === "en" ? "Operating Hours" : "Giờ hoạt động"}
                </h3>
              </div>
            </div>
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
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {language === "en" ? "Location" : "Vị trí & Xung quanh"}
                    </h3>
                  </div>
                </div>

              </div>
            </div>
            <div className="h-44 sm:h-48 md:h-52 w-full">
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
        <div className="order-1 lg:order-2 lg:col-span-4 flex flex-col gap-6">

          {/* Parking Capacity — styled identical to Landing Page CapacityPill */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                {language === "en" ? "Parking Capacity" : "Chỗ trống hiện tại"}
              </h3>
              <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Live</span>
            </div>

            {(() => {
              const availability = buildingInfo.vehicle_type_availability || [];
              const moto = availability.find(vt => vt.vehicle_type_id === 1) || { available_slots: 0, total_slots: 0 };
              const car = availability.find(vt => vt.vehicle_type_id === 2) || { available_slots: 0, total_slots: 0 };

              const fallbackCarAvail = availableSlotsCount;
              const fallbackCarTotal = totalSlots;
              const fallbackMotoAvail = Math.round(availableSlotsCount * 0.6);
              const fallbackMotoTotal = Math.round(totalSlots * 0.6);

              const motoAvail = moto.total_slots > 0 ? moto.available_slots : fallbackMotoAvail;
              const motoTotal = moto.total_slots > 0 ? moto.total_slots : fallbackMotoTotal;
              const motoPct = motoTotal > 0 ? Math.min(100, Math.round(((motoTotal - motoAvail) / motoTotal) * 100)) : 0;

              const carAvail = car.total_slots > 0 ? car.available_slots : fallbackCarAvail;
              const carTotal = car.total_slots > 0 ? car.total_slots : fallbackCarTotal;
              const carPct = carTotal > 0 ? Math.min(100, Math.round(((carTotal - carAvail) / carTotal) * 100)) : 0;

              const Pill = ({ icon: Icon, label, avail, total, pct, minW = "120px" }) => {
                const isFull = avail === 0;
                return (
                  <div
                    style={{
                      background: "#ffffff",
                      border: `1.5px solid ${isFull ? "#dc2626" : "rgb(226,232,240)"}`,
                      borderRadius: 16,
                      padding: "18px 18px 14px",
                      flex: 1,
                      minWidth: minW,
                      boxShadow: isFull
                        ? "0 4px 18px rgba(220,38,38,0.10)"
                        : "0 4px 18px rgba(15,23,42,0.08)",
                    }}
                  >
                    {/* Label row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: isFull ? "#dc2626" : "#475569", marginBottom: 10 }}>
                      <Icon size={13} color={isFull ? "#dc2626" : "#1d4ed8"} />
                      {label}
                      {isFull && (
                        <span style={{ marginLeft: "auto", fontSize: 10, background: "#fee2e2", color: "#dc2626", padding: "1px 7px", borderRadius: 99, fontWeight: 700 }}>
                          {language === "en" ? "Full" : "Hết"}
                        </span>
                      )}
                    </div>

                    {/* Hero number: available / total */}
                    <div style={{ textAlign: "center", padding: "10px 0 12px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                        <span style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, color: isFull ? "#dc2626" : "#1d4ed8", letterSpacing: "-0.03em", textShadow: isFull ? "0 2px 16px rgba(220,38,38,0.2)" : "0 2px 16px rgba(29,78,216,0.2)" }}>
                          {avail}
                        </span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8", letterSpacing: "-0.02em" }}>
                          /{total}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: isFull ? "#ef4444" : "#1d4ed8", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4, opacity: 0.7 }}>
                        {language === "en" ? "available slots" : "chỗ trống"}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 6, borderRadius: 99, background: isFull ? "#fee2e2" : "#dbeafe", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: isFull ? "#ef4444" : "#1d4ed8", transition: "width 0.6s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: isFull ? "#ef4444" : "#93c5fd", marginTop: 5, textAlign: "right" }}>
                      {pct}% occupied
                    </div>
                  </div>
                );
              };

              const totalLiveSlots = motoTotal + carTotal;

              return (
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    <Pill icon={Bike} label={language === "en" ? "Motorbikes" : "Xe máy"} avail={motoAvail} total={motoTotal} pct={motoPct} minW="140px" />
                    <Pill icon={Car} label={language === "en" ? "Cars" : "Ô tô"} avail={carAvail} total={carTotal} pct={carPct} minW="140px" />
                  </div>

                  {/* Stats row — identical to Landing Page */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    {[
                      [totalLiveSlots > 0 ? String(totalLiveSlots) : "—", language === "en" ? "Parking Spots" : "Tổng chỗ đỗ"],
                      ["98%", language === "en" ? "On-time Check-in" : "Đúng giờ"],
                      ["24/7", language === "en" ? "Open" : "Hoạt động"],
                    ].map(([val, lbl], i) => (
                      <div key={lbl} style={{ padding: "14px 0", textAlign: "center", borderRight: i < 2 ? "1px solid #e2e8f0" : "none" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8" }}>{val}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Upcoming Booking — Premium Blue Card */}
          {recentBooking ? (() => {
            const isActive = recentBooking.status === "active";
            const isConfirmed = recentBooking.status === "confirmed";
            const isCompleted = recentBooking.status === "completed";

            /* Format date nicely */
            const fmtDate = (iso) => {
              if (!iso) return "—";
              try {
                return new Date(iso).toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
                  weekday: "short", day: "2-digit", month: "short", year: "numeric",
                });
              } catch { return "—"; }
            };

            const displayDate = fmtDate(recentBooking.startTime);
            const displayTimeRange = `${formatTime(recentBooking.startTime, language)} - ${formatTime(recentBooking.endTime, language)}`;

            let statusText = "";
            let badgeClass = "";
            if (isActive) {
              statusText = language === "en" ? "Active" : "Đang đỗ";
              badgeClass = "bg-emerald-500 ring-4 ring-emerald-500/25";
            } else if (isConfirmed) {
              statusText = language === "en" ? "Upcoming" : "Đã xác nhận";
              badgeClass = "bg-yellow-500 ring-4 ring-yellow-500/25 animate-pulse";
            } else {
              statusText = language === "en" ? "Completed" : "Hoàn tất";
              badgeClass = "bg-slate-400 dark:bg-slate-500 ring-4 ring-slate-400/20 dark:ring-slate-500/20";
            }

            return (
              <div className="rounded-[20px] overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/20 font-sans bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors duration-300">

                {/* ── HERO PANEL ── */}
                <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#3b5cf6] p-[22px] pb-[28px] relative overflow-hidden">

                  {/* Decorative rings */}
                  <div className="absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full border-[1.5px] border-white/10" />
                  <div className="absolute -top-[10px] -right-[10px] w-[80px] h-[80px] rounded-full border-[1.5px] border-white/5" />

                  {/* Header row */}
                  <div className="flex items-center justify-between mb-[18px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[10px] bg-white/15 flex items-center justify-center backdrop-blur-[4px]">
                        <CalendarCheck size={16} color="white" />
                      </div>
                      <span className="text-lg font-semibold text-white ">
                        {language === "en" ? "My Booking" : "Lịch đặt chỗ"}
                      </span>
                    </div>

                    {/* Status badge */}
                    <span className={`text-[10px] font-extrabold uppercase tracking-[0.06em] text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 ${badgeClass}`}>
                      {isConfirmed && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                        </span>
                      )}
                      {statusText}
                    </span>
                  </div>

                  {/* Building name */}
                  <div className="mb-1.5">
                    <h4 className="text-xl font-black text-white -tracking-[0.02em] leading-snug m-0">
                      {buildingInfo.building_name || (language === "en" ? "eParking Building" : "Tòa nhà eParking")}
                    </h4>
                  </div>

                  {/* Location row */}
                  <div className="flex items-center gap-1.5 mb-[18px]">
                    <MapPin size={12} className="text-white/60" />
                    <span className="text-xs text-white/60 font-medium">
                      {isActive || isCompleted
                        ? `${language === "en" ? "Floor" : "Tầng"} ${recentBooking.floorNumber} - ${recentBooking.zoneName}`
                        : (language === "en" ? "Zone: Assigned at Check-in" : "Chỉ định lúc Check-in")}
                    </span>
                  </div>

                </div>

                {/* ── DETAILS PANEL ── */}
                <div className="bg-white dark:bg-slate-900 p-[22px] pb-0 transition-colors duration-300">

                  {/* Date row */}
                  <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="w-9 h-9 rounded-[10px] shrink-0 bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                      <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-[0.08em] uppercase mb-0.5">
                        {language === "en" ? "Booked Date" : "Ngày đặt"}
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200 m-0">{displayDate}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-[0.08em] uppercase mb-0.5">
                        {language === "en" ? "Booked Time" : "Khung giờ đặt"}
                      </p>
                      <p className="text-base font-black text-blue-600 dark:text-blue-400 m-0 -tracking-[0.02em]">{displayTimeRange}</p>
                    </div>
                  </div>

                  {/* Plate row */}
                  <div className="flex items-center gap-3 py-3.5">
                    <div className="w-9 h-9 rounded-[10px] shrink-0 bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                      {recentBooking.vehicleType === "car"
                        ? <Car size={16} className="text-green-600 dark:text-green-400" />
                        : <Bike size={16} className="text-green-600 dark:text-green-400" />}
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-[0.08em] uppercase mb-0.5">
                        {language === "en" ? "License Plate" : "Biển số xe"}
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-200 tracking-[0.06em] m-0">
                        {recentBooking.plate_number || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── CTA BUTTON ── */}
                <div className="bg-white dark:bg-slate-900 p-[22px] pt-0 rounded-b-[20px] transition-colors duration-300">
                  <button
                    type="button"
                    onClick={() => navigate(isActive || isConfirmed ? "/user/bookings" : "/user/book")}
                    className={`w-full py-3 text-[13px] font-extrabold text-white rounded-xl border-0 cursor-pointer tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90 ${isCompleted ? 'bg-gradient-to-r from-slate-500 to-slate-600 shadow-md shadow-slate-500/20' : 'bg-gradient-to-r from-blue-700 to-blue-600 shadow-md shadow-blue-500/30'}`}
                  >
                    {isCompleted
                      ? <> {language === "en" ? "Book Again" : "Đặt lại"}</>
                      : <>{language === "en" ? "View Details" : "Xem chi tiết"}</>}
                  </button>
                </div>
              </div>
            );
          })() : (
            /* Empty state */
            <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1d4ed8] rounded-[20px] py-8 px-6 text-center shadow-xl shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full border-[1.5px] border-white/10" />
              <div className="w-13 h-13 rounded-2xl mx-auto mb-4  flex items-center justify-center relative z-10">
                <CalendarCheck size={24} color="rgba(255,255,255,0.85)" />
              </div>
              <p className="text-[13px] font-bold text-white/85 mb-1.5 relative z-10">
                {language === "en" ? "No Upcoming Bookings" : "Chưa có lịch đặt chỗ"}
              </p>
              <p className="text-[11px] text-white/50 mb-5 relative z-10">
                {language === "en" ? "Reserve a spot to see it here." : "Đặt chỗ ngay để xem ở đây."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/user/book")}
                className="px-7 py-[11px] bg-white text-blue-700 text-xs font-extrabold rounded-xl border-none cursor-pointer shadow-md shadow-black/15 transition-opacity hover:opacity-90 active:scale-95 relative z-10"
              >
                {language === "en" ? "Book a Spot" : "Đặt chỗ ngay"}
              </button>
            </div>
          )}



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