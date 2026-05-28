import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Car,
  Bike,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Calendar,
  Star,
  DollarSign,
} from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // ==========================================
  // STATE MANAGEMENT (Khớp 100% cấu trúc API 3.1 và bảng DB)
  // ==========================================
  const [buildingInfo, setBuildingInfo] = useState(null);
  const [pricingPolicy, setPricingPolicy] = useState([]); // Khớp với bảng PRICING_POLICY trong DB

  // ==========================================
  // 🚀 [AXIOS API INTEGRATION]: FETCH DATA REALTIME từ BACKEND
  // ==========================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        /* 🚀 BỎ COMMENT ĐOẠN NÀY KHI CÓ BACKEND ĐỂ KẾT NỐI DATABASE THỰC TẾ
        // API 1: Lấy thông tin bãi xe và occupancy (API 3.1)
        const buildingRes = await axios.get('http://localhost:5000/api/v1/parking/buildings/info');
        setBuildingInfo(buildingRes.data.data);

        // API 2: Lấy thông tin bảng giá hiện hành dựa trên chính sách (Khớp bảng PRICING_POLICY)
        // Thông thường Backend sẽ tự động trả về các policy đang có hiệu lực (Effective Date)
        const pricingRes = await axios.get('http://localhost:5000/api/v1/admin/pricing/current');
        setPricingPolicy(pricingRes.data.data);
        
        setLoading(false);
        return;
        */

        // MOCK DATA CHUẨN: Mô phỏng chính xác cấu trúc JSON của API 3.1 và DB_PMS
        setTimeout(() => {
          setBuildingInfo({
            building_id: "B01",
            building_name: "Smartpark Innovation Hub",
            address: "Saigon Hi-Tech Park, Thu Duc City, Ho Chi Minh City",
            map_url:
              "https://maps.google.com/maps?q=Saigon%20Hi-Tech%20Park,%20Ho%20Chi%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed",
            image_url:
              "https://i2-prod.leicestermercury.co.uk/article9542323.ece/ALTERNATES/s1200/0_GettyImages-1458811529.jpg",
            operation_hours: {
              weekday_hours: "06:00 - 22:00",
              weekend_hours: "07:00 - 23:00",
              is_24_7: false,
            },
            current_occupancy: {
              car_available: 12, // Số lượng ô tô trống thực tế
              motorbike_available: 0, // Mô phỏng trường hợp xe máy HẾT CHỖ -> Hiện FULL (FR-INFO-01)
            },
            // Dữ liệu đánh giá tổng hợp từ hệ thống Feedback
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

          // Mô phỏng cấu hình bảng giá nạp lên từ bảng PRICING_POLICY trong DB
          setPricingPolicy([
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

          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Lỗi tải thông tin Dashboard:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Tính toán tổng số lượng slot trống an toàn để quyết định ẩn/hiện nút Đặt chỗ nhanh (FR-INFO-02)
  const totalAvailableSlots = useMemo(() => {
    if (!buildingInfo) return 0;
    return (
      (buildingInfo.current_occupancy.car_available || 0) +
      (buildingInfo.current_occupancy.motorbike_available || 0)
    );
  }, [buildingInfo]);

  // RENDER TRẠNG THÁI LOADING TỐI ƯU TRẢI NGHIỆM
  if (loading || !buildingInfo) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading Parking System Dashboard...
      </div>
    );
  }

  return (
    <div className="animate-slide-in w-full h-full space-y-0">
      {/* KHỐI CARD CHÍNH (MAIN TOWER INFO CARD) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col lg:flex-row transition-all duration-300">
        {/* Khối Ảnh Tòa Nhà (Bên trái) */}
        <div className="w-full lg:w-2/5 relative min-h-[300px] lg:min-h-full">
          <img
            src={buildingInfo.image_url}
            alt={buildingInfo.building_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>

        {/* Khối Thông Tin Chi Tiết (Bên phải) */}
        <div className="w-full lg:w-3/5 p-6 md:p-8 lg:p-10 flex flex-col justify-between">
          {/* Tên và Địa Chỉ Tòa Nhà */}
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

          {/* CHIA LƯỚI GRID THÔNG TIN NGHIỆP VỤ CÂN ĐỐI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* LƯU LƯỢNG 1: THỜI GIAN HOẠT ĐỘNG, SỨC CHỨA & GOOGLE MAPS */}
            <div className="flex flex-col space-y-5">
              {/* Giờ hoạt động */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Clock size={14} /> Operation Hours
                </p>
                <div className="space-y-1 text-xs md:text-sm bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3 rounded-xl font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mon - Fri:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {buildingInfo.operation_hours.weekday_hours}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Weekend:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {buildingInfo.operation_hours.weekend_hours}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sức chứa hiện tại (Đã fix chữ FULL màu đỏ đậm theo FR-INFO-01) */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info size={14} /> Real-time Availability
                </p>
                <div className="flex gap-3 font-mono">
                  {/* Ô tô slot counter */}
                  <div
                    className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center justify-center transition-colors ${buildingInfo.current_occupancy.car_available > 0 ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30" : "bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-900"}`}
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
                      className={`text-base font-black mt-0.5 ${buildingInfo.current_occupancy.car_available > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-500"}`}
                    >
                      {buildingInfo.current_occupancy.car_available > 0
                        ? buildingInfo.current_occupancy.car_available
                        : "FULL"}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Cars
                    </span>
                  </div>

                  {/* Xe máy slot counter */}
                  <div
                    className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center justify-center transition-colors ${buildingInfo.current_occupancy.motorbike_available > 0 ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30" : "bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-900"}`}
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
                      className={`text-base font-black mt-0.5 ${buildingInfo.current_occupancy.motorbike_available > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-500"}`}
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

              {/* Tích hợp Google Maps */}
              <div className="h-36 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 flex-grow shadow-inner">
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

            {/* LƯU LƯỢNG 2: QUY ĐỊNH, ĐÁNH GIÁ SAO & BẢNG GIÁ DỊCH VỤ */}
            <div className="flex flex-col justify-between h-full space-y-5">
              {/* Nội quy bãi xe */}
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

              {/* ⭐️ ĐÃ THÊM: KHỐI ĐÁNH GIÁ CÓ SAO (RATING SYSTEM) THEO ĐÚNG YÊU CẦU CỦA BẠN */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-lg text-amber-500 shrink-0">
                    <Star size={16} className="fill-amber-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      User Score
                    </p>
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      {buildingInfo.system_rating.average_score}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        / 5.0
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-md">
                  {buildingInfo.system_rating.total_reviews} Reviews
                </span>
              </div>

              {/* 💎 ĐÃ THÊM: KHỐI BẢNG GIÁ ĐỂ HOÀN THIỆN ĐẶC TẢ NGHIỆP VỤ FR-INFO-01 */}
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-500" /> Pricing
                  Tariffs
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] md:text-xs">
                  {pricingPolicy.map((policy) => (
                    <div
                      key={policy.vehicle_type_id}
                      className="p-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl"
                    >
                      <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 border-b border-slate-200 dark:border-slate-800 pb-0.5">
                        {policy.vehicle_type_name}
                      </p>
                      <p className="text-slate-500">
                        Base price:{" "}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {policy.base_price.toLocaleString()}đ
                        </span>
                      </p>
                      <p className="text-slate-500">
                        Hourly:{" "}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          +{policy.hourly_rate.toLocaleString()}đ/h
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nút Đặt Chỗ Nhanh (Chỉ hiện khi tổng slot bãi xe còn trống > 0 - Theo FR-INFO-02) */}
              {totalAvailableSlots > 0 ? (
                <div className="mt-4 pt-2">
                  <button
                    onClick={() => navigate("/user/book")}
                    className="group w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.99] text-sm tracking-wide"
                  >
                    <Calendar
                      size={16}
                      className="group-hover:rotate-12 transition-transform"
                    />
                    BOOK A SLOT NOW
                  </button>
                </div>
              ) : (
                /* Thẻ thông báo nếu bãi xe thực sự hết sạch chỗ gửi */
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs justify-center uppercase tracking-wider">
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
