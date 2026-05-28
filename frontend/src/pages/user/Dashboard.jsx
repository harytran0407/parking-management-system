import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Car,
  Bike,
  AlertTriangle,
  Info,
  XCircle,
  Calendar,
  Star,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [buildingInfo, setBuildingInfo] = useState({
    building_id: "B01",
    building_name: "Smartpark Innovation Hub",
    address: "Saigon Hi-Tech Park, Thu Duc City, Ho Chi Minh City",


    map_url:
      "https://maps.google.com/maps?q=Saigon%20Hi-Tech%20Park,%20Ho%20Chi%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed",

   
    image_urls: [
      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1000",
    ],
    operation_hours: {
      weekday_hours: "06:00 - 22:00",
      weekend_hours: "07:00 - 23:00",
      is_24_7: false,
    },
    current_occupancy: {
      car_available: 12,
      motorbike_available: 0,
    },
    system_rating: {
      average_score: 4.7,
      total_reviews: 142,
    },
    rules: [
      "Maximum speed limit within the area is 5 km/h.",
      "Management is not responsible for property loss.",
      "Park strictly within the designated lines.",
    ],
  });

  const [pricingPolicy, setPricingPolicy] = useState([
    {
      vehicle_type_id: 1,
      vehicle_type_name: "Automobile",
      base_price: 15000,
      hourly_rate: 10000,
      overnight_fee: 30000,
    },
    {
      vehicle_type_id: 2,
      vehicle_type_name: "Motorbike",
      base_price: 5000,
      hourly_rate: 2000,
      overnight_fee: 10000,
    },
  ]);

  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  useEffect(() => {
    // Khởi tạo bộ đếm thời gian trượt ảnh sang phải (Next Image)
    const autoSlideTimer = setInterval(() => {
      setCurrentImgIndex(
        (prevIndex) => (prevIndex + 1) % buildingInfo.image_urls.length,
      );
    }, 2000); 

    // CRITICAL CLEANUP: Hàm này vô cùng quan trọng để xóa bỏ bộ timer cũ
    // Giúp app không bị lỗi chạy dồn dập nhiều timer cùng lúc khi user click nút thủ công
    return () => clearInterval(autoSlideTimer);
  }, [currentImgIndex, buildingInfo.image_urls.length]);
  // Dependency lắng nghe cả currentImgIndex để restart lại bộ đếm 3 giây từ đầu khi có tương tác người dùng

  // ==========================================
  //  [AXIOS API INTEGRATION]: ĐẦU NỐI KẾT NỐI API BACKEND THẬT
  // ==========================================
  useEffect(() => {
    const fetchRealtimeDashboard = async () => {
      try {
        /*  
        const buildingRes = await axios.get('http://localhost:5000/api/v1/parking/buildings/info');
        setBuildingInfo(buildingRes.data.data);

        const pricingRes = await axios.get('http://localhost:5000/api/v1/admin/pricing/current');
        setPricingPolicy(pricingRes.data.data);
        */
      } catch (error) {
        console.error("Lỗi cập nhật dữ liệu API động:", error);
      }
    };
    fetchRealtimeDashboard();
  }, []);

 
  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex(
      (prevIndex) => (prevIndex + 1) % buildingInfo.image_urls.length,
    );
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex(
      (prevIndex) =>
        (prevIndex - 1 + buildingInfo.image_urls.length) %
        buildingInfo.image_urls.length,
    );
  };

  const totalAvailableSlots = useMemo(() => {
    if (!buildingInfo) return 0;
    return (
      (buildingInfo.current_occupancy.car_available || 0) +
      (buildingInfo.current_occupancy.motorbike_available || 0)
    );
  }, [buildingInfo]);

  return (
    <div className="animate-slide-in w-full h-full space-y-0">
      {/* MAIN CONTAINER CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col lg:flex-row transition-colors duration-300">
        {/* CAROUSEL SLIDER (BÊN TRÁI) */}
        <div className="w-full lg:w-2/5 relative min-h-[340px] lg:min-h-full group overflow-hidden bg-slate-900">
          <img
            src={buildingInfo.image_urls[currentImgIndex]}
            alt={`Building View ${currentImgIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out scale-100 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none"></div>

          {/* Nút lùi ảnh */}
          <button
            type="button"
            onClick={handlePrevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:scale-110"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={handleNextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:scale-110"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {buildingInfo.image_urls.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentImgIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${currentImgIndex === idx ? "w-5 bg-blue-500" : "w-2 bg-white/50 hover:bg-white"}`}
              />
            ))}
          </div>
        </div>

        <div className="w-full lg:w-3/5 p-6 md:p-8 lg:p-10 flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2.5 tracking-tight">
              {buildingInfo.building_name}
            </h3>
            <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
              <MapPin className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
              <p className="text-sm md:text-base font-medium leading-relaxed">
                {buildingInfo.address}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col space-y-5">
              {/* Giờ hoạt động */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Clock size={14} /> Operation Hours
                </p>
                <div className="space-y-1 text-xs md:text-sm bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 p-3 rounded-xl font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Mon - Fri:</span>
                    <span className="font-bold">
                      {buildingInfo.operation_hours.weekday_hours}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekend:</span>
                    <span className="font-bold">
                      {buildingInfo.operation_hours.weekend_hours}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sức chứa real-time */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info size={14} /> Real-time Availability
                </p>
                <div className="flex gap-3 font-mono">
                  <div
                    className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center justify-center transition-colors ${buildingInfo.current_occupancy.car_available > 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/30" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-500/30"}`}
                  >
                    <Car
                      size={18}
                      className={
                        buildingInfo.current_occupancy.car_available > 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    />
                    <span
                      className={`text-base font-black mt-0.5 ${buildingInfo.current_occupancy.car_available > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {buildingInfo.current_occupancy.car_available > 0
                        ? buildingInfo.current_occupancy.car_available
                        : "FULL"}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Cars
                    </span>
                  </div>

                  <div
                    className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center justify-center transition-colors ${buildingInfo.current_occupancy.motorbike_available > 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/30" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-500/30"}`}
                  >
                    <Bike
                      size={18}
                      className={
                        buildingInfo.current_occupancy.motorbike_available > 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    />
                    <span
                      className={`text-base font-black mt-0.5 ${buildingInfo.current_occupancy.motorbike_available > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {buildingInfo.current_occupancy.motorbike_available > 0
                        ? buildingInfo.current_occupancy.motorbike_available
                        : "FULL"}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Bikes
                    </span>
                  </div>
                </div>
              </div>

              {/* Bản đồ iFrame */}
              <div className="h-36 w-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner flex-grow min-h-[150px]">
                <iframe
                  src={buildingInfo.map_url}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            <div className="flex flex-col justify-between h-full space-y-5">
              {/* Nội quy */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />{" "}
                  Regulations
                </p>
                <ul className="space-y-2">
                  {buildingInfo.rules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="text-xs md:text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                      <p className="leading-tight font-medium">{rule}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SYSTEM RATES */}
              <div className="p-3 bg-slate-50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-lg text-amber-500 shrink-0">
                    <Star size={16} className="fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      User Score
                    </p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {buildingInfo.system_rating.average_score}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        / 5.0
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-md">
                  {buildingInfo.system_rating.total_reviews} Reviews
                </span>
              </div>

              {/* Price tariff*/}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-500" /> Pricing
                  Tariffs
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] md:text-xs">
                  {pricingPolicy.map((policy) => (
                    <div
                      key={policy.vehicle_type_id}
                      className="p-2 bg-slate-50 border border-slate-100 dark:bg-slate-800/20 dark:border-slate-800 rounded-xl"
                    >
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 border-b border-slate-200 dark:border-slate-800/60 pb-0.5">
                        {policy.vehicle_type_name}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Base price:{" "}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {policy.base_price.toLocaleString()}đ
                        </span>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Hourly:{" "}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          +{policy.hourly_rate.toLocaleString()}đ/h
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking button */}
              {totalAvailableSlots > 0 ? (
                <div className="mt-4 pt-2">
                 
                  <button
                    onClick={() => navigate("/user/book")}
                    className="group w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.99] text-sm tracking-wide animate-wobble-slow hover:animate-none">
                    <Calendar size={16} className="group-hover:rotate-12 transition-transform"/>
                    BOOK A SLOT NOW
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/40 p-3 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs justify-center uppercase tracking-wider">
                  <XCircle size={16} /> Building Parking is Completely Full
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
