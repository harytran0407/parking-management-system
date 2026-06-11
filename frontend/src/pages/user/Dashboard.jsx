// src/pages/user/UserDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
  MapPin,
  Clock,
  Layers,
  AlertTriangle,
  XCircle,
  Calendar,
  Star,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// ==========================================
// STATIC PRESENTATION CONSTANTS (Fallback Data)
// ==========================================
const STATIC_IMAGES = [
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1000",
];

const STATIC_RULES = [
  "Maximum speed limit inside the parking lot is 5 km/h.",
  "Please take care of your personal belongings and valuables.",
  "Park correctly inside the designated lines.",
];

// Embedded Google Maps URL assigned properly to a variable
const FALLBACK_MAP_URL = "https://maps.google.com/maps?q=Saigon%20Hi-Tech%20Park,%20Ho%20Chi%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed";

export default function UserDashboard() {
  const navigate = useNavigate();
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
          throw new Error(buildingErr.response?.data?.message || "Failed to load parking building information.");
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
              vehicle_type_name: "Automobile (Car)",
              base_price: 15000,
              hourly_rate: 10000,
              overnight_fee: 30000,
              effective_date: "2026-01-01",
            },
            {
              policy_id: 2,
              vehicle_type_id: 2,
              vehicle_type_name: "Motorbike",
              base_price: 5000,
              hourly_rate: 2000,
              overnight_fee: 10000,
              effective_date: "2026-01-01",
            },
          ]);
        }
      } catch (err) {
        console.error("Dashboard synchronization failed:", err);
        setError(err.message || "Cannot connect to the parking management server.");
      } finally {
        setLoading(false);
      }
    };

    fetchRealtimeDashboard();
  }, []);

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
          Open
        </span>
      );
    }
    if (normalizedStatus === "MAINTENANCE") {
      return (
        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider h-fit mt-1.5">
          Maintenance
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
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Updating live parking status...</p>
      </div>
    );
  }

  // STATE 2: CONNECTION ERROR DISPLAY
  if (error) {
    return (
      <div className="w-full p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h4 className="text-base font-black text-rose-800 dark:text-rose-400">Connection Error</h4>
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400/80 max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95">
          RELOAD DATA
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
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{buildingInfo.building_name || "Smart Parking Lot"}</h3>
              {/*  MODIFIED: Dynamic status badge displaying dynamic database states side-by-side */}
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
                  <Clock size={14} /> Operating Hours
                </p>
                <div className="space-y-1 text-xs md:text-sm bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 p-3 rounded-xl font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Weekdays:</span>
                    <span className="font-bold">{buildingInfo.operation_hours?.weekday_hours || "06:00 - 22:00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekends / Holidays:</span>
                    <span className="font-bold">{buildingInfo.operation_hours?.weekend_hours || "07:00 - 23:00"}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  <Layers size={14} /> Parking Status
                </p>
                {(() => {
                  const totalAvailable = buildingInfo.current_occupancy?.total_available ?? 0;
                  const isClosed = buildingInfo.status?.toUpperCase() === "MAINTENANCE" || buildingInfo.status?.toUpperCase() === "CLOSED";
                  
                  let statusTitle = "Available";
                  let statusDesc = "Plenty of parking spaces are open for Motorbikes and Cars.";
                  let statusColorClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-800/40";
                  let dotColorClass = "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]";

                  if (isClosed) {
                    statusTitle = "Maintenance / Closed";
                    statusDesc = "The parking building is temporarily closed for maintenance.";
                    statusColorClass = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-800/40";
                    dotColorClass = "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]";
                  } else if (totalAvailable === 0) {
                    statusTitle = "Parking Full";
                    statusDesc = "All parking slots are occupied. Booking is temporarily disabled.";
                    statusColorClass = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-800/40";
                    dotColorClass = "bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]";
                  } else if (totalAvailable <= 10) {
                    statusTitle = "Limited Spaces";
                    statusDesc = "Parking spaces are almost full. Book a spot quickly!";
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

              {/*  MODIFIED: Map pushed lower and lengthened vertically to seamlessly consume empty bottom gaps */}
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
              {/* BLOCK 3: PARKING RULES */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" /> Parking Area Rules
                </p>
                <ul className="space-y-1.5">
                  {STATIC_RULES.map((rule, idx) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                      <p className="leading-tight font-medium">{rule}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CARD REVIEW DISPLAY SCORING */}
              <div className="p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 dark:bg-amber-950/40 p-1.5 rounded-lg text-amber-500 shrink-0">
                    <Star size={14} className="fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Score</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white">
                      4.9 <span className="text-[10px] font-normal text-slate-400">/ 5.0</span>
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">142 Reviews</span>
              </div>

              {/* =========================================================
                   BLOCK 4 MODIFIED: Full name display + Bold Effective Date + Stacked Rows
                  ========================================================= */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-500" /> Parking Rates
                </p>
                {pricingPolicy.length > 0 ? (
                  <div className="flex flex-col gap-2 text-[11px] ">
                    {pricingPolicy.map((policy) => (
                      <div
                        key={policy.policy_id || policy.vehicle_type_id}
                        className="p-3 bg-slate-50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800 rounded-xl flex flex-col justify-between gap-1.5 transition-all hover:border-slate-200 dark:hover:border-slate-700">
                        {/* Header: Full Vehicle Type Name (Left) + Darker/Bolder Effective Date (Right) */}
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/60 pb-1">
                          <span className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">{policy.vehicle_type_name}</span>
                          {policy.effective_date && <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono">Applied: {policy.effective_date}</span>}
                        </div>

                        {/* Content: Inline pricing fields safely handled with calculations */}
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold text-[11px] px-0.5">
                          <p>
                            Base: <span className="text-blue-600 dark:text-blue-400 font-bold">{policy.base_price?.toLocaleString()}đ</span>
                          </p>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <p>
                            Hour: <span className="text-amber-600 dark:text-amber-500 font-bold">+{policy.hourly_rate?.toLocaleString()}đ/h</span>
                          </p>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <p>
                            Overnight: <span className="text-slate-700 dark:text-slate-200 font-bold">{policy.overnight_fee?.toLocaleString()}đ</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/40 text-center text-xs font-medium text-slate-400 rounded-xl italic">Loading pricing rates...</div>
                )}
              </div>

              {/* ACTION TRIGGER BUTTON */}
              {availableSlotsCount > 0 ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/user/book")}
                    className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-3.5 rounded-xl font-extrabold shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.99] text-xs tracking-wider uppercase">
                    <Calendar size={15} className="group-hover:rotate-12 transition-transform duration-300" />
                    Book A Slot Now &rarr;
                  </button>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 p-3.5 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs justify-center uppercase tracking-wider shadow-inner">
                  <XCircle size={16} /> Parking Lot is Full
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
