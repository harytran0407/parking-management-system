import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Car,
  Bike,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  Search,
  Unlock,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";

export default function MyBookings() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return language === "en" ? "Confirmed" : "Đã xác nhận";
      case "pending": return language === "en" ? "Pending" : "Chờ xử lý";
      case "active": return language === "en" ? "Active" : "Đang đỗ";
      case "completed": return language === "en" ? "Completed" : "Hoàn thành";
      case "cancelled": return language === "en" ? "Cancelled" : "Đã hủy";
      default: return status;
    }
  };

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeSessions: 0,
  });

  const [bookings, setBookings] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [expandedBookings, setExpandedBookings] = useState({});

  // Search & Filter Client States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" or "oldest"

  // Modal Controllers
  const [activeModal, setActiveModal] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelCountdown, setCancelCountdown] = useState(5);

  const toggleExpand = (bookingId) => {
    setExpandedBookings((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

  // Load dashboard and active bookings
  const loadBookingDashboard = async () => {
    try {
      const activeRes = await api.get("/bookings/my");
      if (activeRes.data && activeRes.data.success) {
        const list = activeRes.data.data.map(b => {
          const typeId = b.vehicle_type_id;
          const typeNameLower = b.vehicle_type?.toLowerCase() || "";
          const isCar = typeId === 2 || typeNameLower.includes("car") || typeNameLower.includes("ô tô") || typeNameLower.includes("automobile") || (typeNameLower !== "motorbike" && typeNameLower !== "xe máy" && typeNameLower !== "1");
          const defaultPrice = isCar ? 15000 : 5000;
          return {
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
            status: b.status.toLowerCase(),
            isLocked: b.is_locked,
          };
        });
        setBookings(list);

        // Calculate dynamic stats
        const totalCount = list.length;
        const activeCount = list.filter(b => b.status === "active").length;

        setStats({
          totalBookings: totalCount,
          activeSessions: activeCount,
        });
      }
    } catch (error) {
      console.error("Lỗi đồng bộ API đặt chỗ:", error);
    }
  };

  useEffect(() => {
    loadBookingDashboard();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCurrentlyLocked = (booking) => {
    if (booking.isLocked === false) return false;
    if (booking.isLocked === true) return true;

    // If null/undefined (default), auto-unlock 5 minutes before expiration
    if (!booking.endTime) return true;
    const endTime = new Date(booking.endTime).getTime();
    const unlockTime = endTime - 5 * 60 * 1000;
    return currentTime < unlockTime;
  };

  const getCountdownText = (booking) => {
    if (!booking.endTime) return "00:00:00";
    const endTime = new Date(booking.endTime).getTime();
    const unlockTime = endTime - 5 * 60 * 1000;
    const diff = unlockTime - currentTime;

    if (diff <= 0) {
      return "00:00:00";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const getOverdueDuration = (booking) => {
    if (!booking.endTime) return "";
    const endMs = new Date(booking.endTime).getTime();
    const diffMs = currentTime - endMs;
    if (diffMs <= 0) return "";
    const totalMinutes = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return language === "en" ? `${h}h ${m}m` : `${h}g ${m}ph`;
    return language === "en" ? `${m}m` : `${m}ph`;
  };

  const formatTimeOnly = (dtString) => {
    if (!dtString) return "";
    try {
      const date = new Date(dtString);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    let timer;
    if (activeModal === "cancel" && cancelCountdown > 0) {
      timer = setInterval(() => setCancelCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeModal, cancelCountdown]);



  const sortedAndFilteredBookings = useMemo(() => {
    // 1. Filter bookings based on searchQuery and statusFilter
    const filtered = bookings.filter((b) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        b.id.toLowerCase().includes(query) ||
        b.plate_number.toLowerCase().includes(query) ||
        (b.slotName && b.slotName.toLowerCase().includes(query));

      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = b.status === "active";
      } else if (statusFilter === "pending") {
        matchesStatus = b.status === "pending" || b.status === "confirmed";
      } else if (statusFilter === "cancelled") {
        matchesStatus = b.status === "cancelled";
      } else if (statusFilter === "completed") {
        matchesStatus = b.status === "completed";
      }

      return matchesSearch && matchesStatus;
    });

    // 2. Sort filtered bookings by startTime based on sortOrder
    return filtered.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      if (sortOrder === "earliest") {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    });
  }, [bookings, searchQuery, statusFilter, sortOrder]);

  const openModal = (type, booking) => {
    setSelectedBooking(booking);
    setActiveModal(type);
    if (type === "cancel") setCancelCountdown(5);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedBooking(null);
  };

  const handleConfirmCancel = async () => {
    try {
      const response = await api.put(`/bookings/${selectedBooking.id}/cancel`);
      if (response.data && response.data.success) {
        await loadBookingDashboard();
        closeModal();
      }
    } catch (error) {
      console.error("Lỗi huỷ đặt chỗ:", error);
      alert(error.response?.data?.message || (language === "en" ? "Failed to cancel booking." : "Hủy đặt chỗ thất bại."));
    }
  };


  const handleConfirmUnlock = async () => {
    try {
      const response = await api.put(`/bookings/${selectedBooking.id}/unlock`);
      if (response.data && response.data.success) {
        await loadBookingDashboard();
        closeModal();
      }
    } catch (error) {
      console.error("Lỗi mở khóa xe:", error);
      alert(error.response?.data?.message || (language === "en" ? "Failed to unlock vehicle." : "Mở khóa xe thất bại."));
    }
  };

  const handleConfirmLock = async () => {
    try {
      const response = await api.put(`/bookings/${selectedBooking.id}/lock`);
      if (response.data && response.data.success) {
        await loadBookingDashboard();
        closeModal();
      }
    } catch (error) {
      console.error("Lỗi khóa xe:", error);
      alert(error.response?.data?.message || (language === "en" ? "Failed to lock vehicle." : "Khóa bảo vệ xe thất bại."));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(language === "en" ? "en-US" : "vi-VN", options);
  };

  return (
    <div className="h-[calc(100vh-4rem)] xl:h-[calc(100vh-6rem)] flex flex-col overflow-y-auto custom-scrollbar pr-2 pb-8 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto w-full">
      {/* Header Title */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/user")}
              className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {language === "en" ? "My Bookings" : "Lịch đặt của tôi"}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 pl-14">
            {language === "en" ? "Manage your upcoming bookings." : "Quản lý các lượt đặt chỗ sắp tới của bạn."}
          </p>
        </div>

        {/* Regulations Button with Tooltip */}
        <div className="relative group ml-14 sm:ml-0">
          <button
            onClick={() => setActiveModal("regulations")}
            className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <Info size={20} />
          </button>

          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10 border border-slate-800">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-t border-l border-slate-800"></div>
            <span className="relative z-10">{language === "en" ? "Rules" : "Quy định"}</span>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 shrink-0">
        {/* Total Bookings Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {language === "en" ? "Total Bookings" : "Tổng lượt đặt chỗ"}
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.totalBookings}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <Calendar size={24} />
          </div>
        </div>

        {/* Active Parked Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {language === "en" ? "Vehicles Parked" : "Tổng xe đang đỗ"}
            </p>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-455 font-mono">
              {stats.activeSessions}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-455">
            <Car size={24} />
          </div>
        </div>
      </div>

      {/* SECTION: DIGITAL ENTRY PASS */}
      <div className="mb-8 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {language === "en" ? "Booking History" : "Lịch sử đặt chỗ"}
          </h3>

          {/* SEARCH & FILTER FOR CURRENT ACTIVE BOOKINGS */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 min-w-[150px] sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "en" ? "Search License Plate, ID..." : "Tìm biển số, mã đặt..."}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white text-slate-800 dark:bg-slate-900 dark:text-white font-medium shadow-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer shadow-sm"
            >
              <option value="all">{language === "en" ? "All Status" : "Tất cả trạng thái"}</option>
              <option value="active">{language === "en" ? "Active (Inside)" : "Đang đỗ (Trong bãi)"}</option>
              <option value="pending">{language === "en" ? "Awaiting Check-in" : "Chờ xe vào bãi"}</option>
              <option value="cancelled">{language === "en" ? "Cancelled" : "Đã hủy"}</option>
              <option value="completed">{language === "en" ? "Completed" : "Hoàn thành"}</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer shadow-sm"
            >
              <option value="newest">{language === "en" ? "Newest to Oldest" : "Mới nhất"}</option>
              <option value="oldest">{language === "en" ? "Oldest to Newest" : "Cũ nhất"}</option>
            </select>
          </div>
        </div>

        {sortedAndFilteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Calendar size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {language === "en" ? "No active bookings found." : "Không tìm thấy vé xe nào phù hợp."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {sortedAndFilteredBookings.map((booking) => {
              const locked = isCurrentlyLocked(booking);
              const isCar = booking.vehicleType === "car";
              const isExpanded = expandedBookings[booking.id] ?? false;

              // Check if parked past expiration time
              const isOverdue = booking.status === "active" && booking.endTime && currentTime > new Date(booking.endTime).getTime();
              // Check if late to check-in
              const isLateToCheckIn = (booking.status === "pending" || booking.status === "confirmed") && currentTime > new Date(booking.startTime).getTime();

              // Standard background and border for all
              const bgClass = "bg-white dark:bg-slate-900";
              const borderClass = "border border-slate-200/70 dark:border-slate-800/80 shadow-sm";

              return (
                <div
                  key={booking.id}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 ${bgClass} ${borderClass}`}
                >
                  {/* Collapsed Header View */}
                  <div
                    onClick={() => toggleExpand(booking.id)}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/20 select-none gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                      {/* Vehicle icon */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/60 rounded-xl text-slate-500 dark:text-slate-400 shadow-sm">
                        {isCar ? <Car size={24} /> : <Bike size={24} />}
                      </div>

                      {/* License plate & Slot/Zone location */}
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5  ">
                          {booking.plate_number}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-505 font-medium flex items-center gap-1.5 flex-wrap">
                          {booking.status === "active" ? (
                            <>
                              <span className="font-bold text-emerald-600 dark:text-emerald-405">{booking.zoneName}</span>
                            </>
                          ) : booking.status === "cancelled" ? (
                            <span className="text-red-650 dark:text-red-455 font-bold">
                              {language === "en" ? "Status: Cancelled" : "Trạng thái: Đã hủy"}
                            </span>
                          ) : booking.status === "completed" ? (
                            <span className="text-emerald-600 dark:text-emerald-405 font-bold">
                              {language === "en" ? "Status: Completed" : "Trạng thái: Hoàn thành"}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-405 font-bold">
                              {language === "en" ? "Status: Awaiting Check-in" : "Trạng thái: Chờ xe vào bãi"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>



                    {/* Summarized details (visible before expanding) */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400 w-full sm:w-auto">
                      {/* Overtime Fee display */}
                      {isOverdue && (booking.totalPrice - booking.depositPaid > 0) && (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl">
                          <div>
                            <p className="text-[9px] text-red-500 dark:text-red-400 uppercase font-bold tracking-wider mb-0.5">
                              {language === "en" ? "Overtime" : "Quá hạn"}
                            </p>
                            <p className="text-red-600 dark:text-red-400 font-extrabold">
                              {(booking.totalPrice - booking.depositPaid).toLocaleString()}đ
                              {getOverdueDuration(booking) && (
                                <span className="text-[9px] text-red-500 dark:text-red-400 font-medium ml-1">
                                  ({getOverdueDuration(booking)})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Time Window */}
                      <div className="min-w-[90px]">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                          {language === "en" ? "Time" : "Thời gian"}
                        </p>
                        <p className="text-slate-700 dark:text-slate-200">
                          {formatTimeOnly(booking.startTime)} - {formatTimeOnly(booking.endTime) || "18:00"}
                        </p>
                      </div>

                      {/* Vehicle Type */}
                      <div className="min-w-[70px]">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                          {language === "en" ? "Type" : "Loại xe"}
                        </p>
                        <p className="text-slate-700 dark:text-slate-200">
                          {isCar ? (language === "en" ? "Car" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")}
                        </p>
                      </div>

                      {/* Amount Paid */}
                      <div className="min-w-[80px]">
                        <p className="text-[9px] text-slate-455 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5">
                          {language === "en" ? "Paid" : "Đã trả"}
                        </p>
                        <p className="text-slate-700 dark:text-slate-200 ">
                          {booking.depositPaid.toLocaleString()}đ
                        </p>
                      </div>



                      {/* Lock status pill and expansion toggle */}
                      <div className="flex items-center gap-3 ml-auto sm:ml-0">
                        {isLateToCheckIn && (
                          <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-455 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {language === "en" ? "Late Check-in" : "Trễ hẹn"}
                          </span>
                        )}

                        {booking.status === "active" ? (
                          locked ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30">
                              <Lock size={10} /> {language === "en" ? "LOCKED" : "ĐÃ KHÓA"}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-455 border border-emerald-100 dark:border-emerald-900/30">
                              <Unlock size={10} /> {language === "en" ? "UNLOCKED" : "ĐÃ MỞ KHÓA"}
                            </span>
                          )
                        ) : booking.status === "cancelled" ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                            <X size={10} /> {language === "en" ? "CANCELLED" : "ĐÃ HỦY"}
                          </span>
                        ) : booking.status === "completed" ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                            <CheckCircle2 size={10} /> {language === "en" ? "COMPLETED" : "HOÀN THÀNH"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-455 border border-blue-100 dark:border-blue-900/30">
                            <Clock size={10} /> {language === "en" ? "CONFIRMED" : "ĐÃ XÁC NHẬN"}
                          </span>
                        )}

                        <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded View with Smooth Slide Animation */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? "max-h-[1000px] opacity-100 py-4" : "max-h-0 opacity-0"}`}
                  >

                    <div className="pt-4">
                      {/* Red Overdue Warning Alert Box */}
                      {isOverdue && (
                        <div className="bg-red-50 dark:bg-red-955/40   p-4 mb-6 text-left flex gap-3 items-start text-red-700 dark:text-red-400 text-xs font-semibold shadow-sm">
                          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="font-extrabold text-sm">{language === "en" ? "Overdue Parking Alert!" : "Cảnh báo quá hạn giờ đỗ!"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                              {booking.totalPrice - booking.depositPaid > 0 ? (
                                language === "en"
                                  ? `Your vehicle has exceeded the reserved checkout time by ${getOverdueDuration(booking)}. Current penalty fee is ${(booking.totalPrice - booking.depositPaid).toLocaleString()}đ. Please pay by cash at the exit gate to check-out.`
                                  : `Phương tiện của bạn đã đỗ quá giờ hẹn ${getOverdueDuration(booking)}. Số tiền phạt hiện tại là ${(booking.totalPrice - booking.depositPaid).toLocaleString()}đ. Vui lòng thanh toán bằng tiền mặt trực tiếp tại cổng checkout để hoàn tất.`
                              ) : (
                                language === "en"
                                  ? `You have a 15-minute grace period to exit the parking lot without penalty. Please proceed to checkout.`
                                  : `Bạn đang trong thời gian ân hạn 15 phút để check-out xe mà không bị tính phí phạt.`
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Red/Yellow Late Check-in Warning Alert Box */}
                      {isLateToCheckIn && (
                        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 mb-6 text-left flex gap-3 items-start text-rose-700 dark:text-rose-455 text-xs font-semibold shadow-sm">
                          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                          <div>
                            <p className="font-extrabold text-sm">{language === "en" ? "Late Arrival Warning!" : "Cảnh báo trễ giờ đỗ xe!"}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                              {language === "en"
                                ? "The reserved arrival time has passed, but the vehicle is not parked yet. Please enter the parking lot or adjust your booking schedule."
                                : "Đã quá giờ hẹn vào bãi đỗ nhưng phương tiện chưa vào vị trí. Vui lòng di chuyển xe vào bãi hoặc thực hiện điều chỉnh lại lịch đặt."}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Cột trái: Smart Lock hoặc Badge chờ xe vào bãi */}
                        {booking.status === "active" ? (
                          <div className="lg:col-span-5 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 dark:from-slate-950/40 dark:to-slate-900/20 p-6 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
                            {locked ? (
                              <>
                                <div className="p-4 bg-red-300 text-red-950 dark:text-red-50 rounded-full mb-3 shadow-inner">
                                  <Lock size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                  {language === "en" ? "Slot Locked" : "Vị trí đang khóa"}
                                </h4>
                                <p className="text-[11px] text-slate-450 dark:text-slate-500 text-center mb-5 max-w-[220px] leading-relaxed">
                                  {booking.isLocked === true
                                    ? (language === "en" ? "Security active. Keep locked until you manually unlock." : "Bảo mật đang bật. Xe sẽ được giữ khóa an toàn cho đến khi bạn mở khóa.")
                                    : (language === "en" ? "Security active. Auto-unlocks when 5 mins remaining." : "Bảo mật đang bật. Tự động mở khóa khi còn lại 5 phút.")}
                                </p>

                                {/* Ô hiển thị Auto Unlock hoặc trạng thái khóa thủ công */}
                                {booking.isLocked === true ? (
                                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/30 px-6 py-2 rounded-xl text-center w-full max-w-[240px] mb-4 shadow-sm">
                                    <p className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400 tracking-wider">
                                      {language === "en" ? "Manual Lock Active" : "Đã khóa thủ công"}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 px-6 py-2.5 rounded-xl text-center w-full max-w-[240px] mb-4 shadow-sm">
                                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                                      {language === "en" ? "Auto-unlock in" : "Tự động mở khóa sau"}
                                    </p>
                                    <p className="text-lg font-bold text-slate-950 dark:text-white font-mono">
                                      {getCountdownText(booking)}
                                    </p>
                                  </div>
                                )}

                                {/* Nút Manual Unlock chính */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openModal("unlockConfirm", booking);
                                  }}
                                  className="w-full max-w-[240px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all text-xs active:scale-[0.98]"
                                >
                                  <Unlock size={14} /> {language === "en" ? "Unlock Early" : "Mở khóa để ra sớm"}
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="p-4 bg-emerald-300 text-emerald-950 dark:text-emerald-50 rounded-full mb-3 shadow-inner">
                                  <Unlock size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                  {language === "en" ? "Slot Unlocked" : "Đã mở khóa"}
                                </h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-550 text-center mb-5 max-w-[220px] leading-relaxed">
                                  {language === "en" ? "Unlocked. You can exit the parking lot early, or lock again to protect your vehicle." : "Đã mở khóa. Bạn có thể lái xe ra hoặc khóa bảo vệ xe trở lại."}
                                </p>

                                {/* Nút Khóa bảo vệ xe linh hoạt */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openModal("lockConfirm", booking);
                                  }}
                                  className="w-full max-w-[240px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all text-xs active:scale-[0.98]"
                                >
                                  <Lock size={14} /> {language === "en" ? "Lock Vehicle" : "Khóa bảo vệ xe"}
                                </button>
                              </>
                            )}
                          </div>
                        ) : booking.status === "cancelled" ? (
                          <div className="lg:col-span-5 bg-gradient-to-b from-red-200/50 to-rose-200/30 dark:from-slate-950/40 dark:to-slate-900/20 p-6  flex flex-col items-center justify-center border border-slate-200/60 dark:border-slate-800 shadow-sm">
                            <div className="p-4 bg-red-500/10 text-red-500 dark:text-red-450 rounded-full mb-3 shadow-inner">
                              <X size={32} className="text-red-500" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                              {language === "en" ? "Booking Cancelled" : "Đã hủy đặt chỗ"}
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-5 max-w-[220px] leading-relaxed">
                              {language === "en" ? "This booking has been cancelled." : "Yêu cầu đặt chỗ này đã bị hủy."}
                            </p>

                            <div className="w-full max-w-[240px] py-2.5 text-center border border-dashed border-red-300 dark:border-red-700/60 rounded-xl bg-red-50/30 dark:bg-red-955/10 text-red-650 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                              {language === "en" ? "Status: Cancelled" : "Trạng thái: Đã hủy"}
                            </div>
                          </div>
                        ) : booking.status === "completed" ? (
                          <div className="lg:col-span-5 bg-gradient-to-b from-emerald-50/50 to-teal-50/30 dark:from-slate-950/40 dark:to-slate-900/20 p-6 flex flex-col items-center justify-center border border-slate-200/60 dark:border-slate-800 shadow-sm">
                            <div className="p-4 bg-emerald-500/10 text-emerald-500 dark:text-emerald-450 rounded-full mb-3 shadow-inner">
                              <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                              {language === "en" ? "Parking Completed" : "Hoàn thành gửi xe"}
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-5 max-w-[220px] leading-relaxed">
                              {language === "en" ? "This parking session has completed." : "Lượt gửi xe này đã hoàn tất."}
                            </p>

                            <div className="w-full max-w-[240px] py-2.5 text-center border border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-455 text-[10px] font-bold uppercase tracking-wider">
                              {language === "en" ? "Status: Completed" : "Trạng thái: Hoàn thành"}
                            </div>
                          </div>
                        ) : (
                          <div className="lg:col-span-5 bg-gradient-to-b from-amber-50/50 to-orange-50/30 dark:from-slate-950/40 dark:to-slate-900/20 p-6 flex flex-col items-center justify-center border border-slate-200/60 dark:border-slate-800 shadow-sm">
                            <div className="p-4 bg-amber-500/10 text-amber-500 dark:text-amber-455 rounded-full mb-3 shadow-inner">
                              <Clock size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                              {language === "en" ? "Awaiting Check-in" : "Chờ xe vào bãi"}
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-5 max-w-[220px] leading-relaxed">
                              {language === "en" ? "This booking has not checked in yet." : "Đặt chỗ này chưa quét xe vào bãi."}
                            </p>

                            <div className="w-full max-w-[240px] py-2.5 text-center border border-dashed border-amber-300 dark:border-amber-700/60 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 text-amber-600 dark:text-amber-455 text-[10px] font-bold uppercase tracking-wider">
                              {language === "en" ? "Status: Confirmed" : "Trạng thái: Đã xác nhận"}
                            </div>
                          </div>
                        )}

                        {/* Cột phải: Chi tiết thông tin đăng ký */}
                        <div className="lg:col-span-7 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {language === "en" ? "Registered Vehicle" : "Phương tiện đăng ký"}
                              </p>
                              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 ">
                                {booking.plate_number}
                              </h4>
                            </div>

                            {/* Danh sách thuộc tính */}
                            <div className="space-y-2">
                              {/* Hàng Vehicle Type */}
                              <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                                <div className="p-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg shadow-sm">
                                  {isCar ? <Car size={16} /> : <Bike size={16} />}
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-400 dark:text-slate-505 uppercase font-bold tracking-wider">
                                    {language === "en" ? "Vehicle Type" : "Loại xe"}
                                  </p>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {isCar ? (language === "en" ? "Car" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")}
                                  </p>
                                </div>
                              </div>

                              {/* Hàng Amount Paid */}
                              <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                                <div className="p-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg shadow-sm">
                                  <Calendar size={16} />
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-400 dark:text-slate-505 uppercase font-bold tracking-wider">
                                    {language === "en" ? "Amount Paid" : "Số tiền đã nộp"}
                                  </p>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {booking.totalPrice.toLocaleString()}đ
                                  </p>
                                </div>
                              </div>

                              {/* Hàng Time Window */}
                              <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                                <div className="p-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg shadow-sm">
                                  <Clock size={16} />
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-400 dark:text-slate-555 uppercase font-bold tracking-wider">
                                    {language === "en" ? "Time Window" : "Khung thời gian"}
                                  </p>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {formatTimeOnly(booking.startTime)} - {formatTimeOnly(booking.endTime) || "18:00"} ({language === "en" ? "Today" : "Hôm nay"})
                                  </p>
                                </div>
                              </div>

                              {/* Overtime Fee warning detail box */}
                              {isOverdue && (booking.totalPrice - booking.depositPaid > 0) && (
                                <div className="flex items-center justify-between p-3.5 bg-red-50/50 dark:bg-red-955/15 border border-red-200/60 dark:border-red-900/40 rounded-xl mt-3 shadow-sm">
                                  <div className="w-full">
                                    <p className="text-[9px] text-red-500 dark:text-red-400 uppercase font-black tracking-wider">
                                      {language === "en" ? "Overtime Penalty Fee" : "Phí phát sinh do quá giờ"}
                                    </p>
                                    <p className="text-base font-black text-red-650 dark:text-red-400 mt-0.5">
                                      {(booking.totalPrice - booking.depositPaid).toLocaleString()}đ
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-semibold">
                                      {language === "en"
                                        ? "Overtime fee must be paid in cash at the exit gate."
                                        : "Phí quá giờ phải thanh toán bằng tiền mặt tại cổng check-out."}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Nút tác vụ nhanh bên dưới */}
                          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            {(() => {
                              if (booking.status === "cancelled" || booking.status === "completed") return null;
                              const canCancel = booking.status !== "active" && booking.status !== "completed" && booking.status !== "cancelled" && new Date(booking.startTime).getTime() - new Date().getTime() >= 60 * 60 * 1000;
                              return (
                                <button
                                  disabled={!canCancel}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openModal("cancel", booking);
                                  }}
                                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${canCancel
                                    ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 cursor-pointer"
                                    : "text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
                                    }`}
                                >
                                  {canCancel
                                    ? (language === "en" ? "Cancel Reservation" : "Hủy đặt chỗ này")
                                    : (language === "en" ? "Cannot Cancel" : "Không thể hủy")}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS SYSTEM */}
      {activeModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`bg-white dark:bg-slate-900 w-full rounded-2xl shadow-2xl overflow-hidden relative flex flex-col border border-slate-100 dark:border-slate-800 animate-scale-up ${activeModal === "regulations" ? "max-w-lg" : "max-w-md"}`}>

            {/* Modal: Confirm Smart Lock Unlock */}
            {activeModal === "unlockConfirm" && (
              <div className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-900/30">
                  <Unlock size={24} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-2">
                  {language === "en" ? "Unlock Early?" : "Mở khóa sớm?"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  {language === "en"
                    ? "Are you sure you want to unlock your vehicle early to prepare for departure?"
                    : "Bạn muốn mở khóa để chuẩn bị xuất bãi sớm?"}
                </p>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    {language === "en" ? "Go Back" : "Quay lại"}
                  </button>
                  <button
                    onClick={handleConfirmUnlock}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm"
                  >
                    {language === "en" ? "Confirm Unlock" : "Xác nhận mở khóa"}
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Confirm Smart Lock Lock */}
            {activeModal === "lockConfirm" && (
              <div className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/30">
                  <Lock size={24} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-2">
                  {language === "en" ? "Lock Vehicle?" : "Khóa bảo vệ xe?"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  {language === "en"
                    ? "Are you sure you want to lock your vehicle again to secure your parking slot?"
                    : "Bạn muốn khóa bảo vệ xe trở lại để đảm bảo an toàn?"}
                </p>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    {language === "en" ? "Go Back" : "Quay lại"}
                  </button>
                  <button
                    onClick={handleConfirmLock}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm"
                  >
                    {language === "en" ? "Confirm Lock" : "Xác nhận khóa"}
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Cancel Booking */}
            {activeModal === "cancel" && (
              <div className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900/30">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-1">
                  {language === "en" ? "Cancel Booking?" : "Hủy đặt chỗ?"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-5">
                  {language === "en" ? "Are you sure to release reservation for " : "Bạn có chắc chắn muốn hủy đặt chỗ cho vị trí "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedBooking?.slotId && selectedBooking?.slotId !== "N/A"
                      ? `${language === "en" ? "Slot" : "Vị trí"} ${selectedBooking?.slotName || selectedBooking?.slotId}`
                      : (selectedBooking?.slotName || (language === "en" ? "Assigned at Check-in" : "Chỉ định lúc Check-in"))}
                  </span>
                </p>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 rounded-xl p-3 mb-6 text-left">
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 leading-normal">
                    ✓ {language === "en"
                      ? `You will receive a 100% refund of your deposit of ${selectedBooking?.depositPaid?.toLocaleString()} VND because you are cancelling early (over 1 hour in advance).`
                      : `Bạn sẽ được hoàn lại 100% số tiền cọc ${selectedBooking?.depositPaid?.toLocaleString()}đ vì bạn hủy lịch sớm (trước giờ hẹn trên 1 tiếng).`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    {language === "en" ? "Go Back" : "Quay lại"}
                  </button>
                  <button
                    disabled={cancelCountdown > 0}
                    onClick={handleConfirmCancel}
                    className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm ${cancelCountdown > 0 ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"}`}
                  >
                    {cancelCountdown > 0 ? `Confirm (${cancelCountdown}s)` : (language === "en" ? "Cancel Booking" : "Xác nhận hủy")}
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Regulations */}
            {activeModal === "regulations" && (
              <div className="p-6 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                    <Info className="text-blue-500" size={20} />
                    {language === "en" ? "Booking Regulations" : "Quy định đặt chỗ đỗ xe"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium custom-scrollbar">

                  {/* Quy định 2: Phân bổ ô đỗ tự động (Vé chờ) */}
                  <div className="flex gap-2.5">
                    <span className="text-blue-500 font-extrabold">1.</span>
                    <p>
                      {language === "en"
                        ? "Park only in your designated zone. Specific slots are dynamically allocated at the entry barrier upon successful check-in."
                        : "Đỗ xe đúng khu vực quy định. Vị trí đỗ thực tế  sẽ được hệ thống tự động phân bổ ngay khi bạn check-in tại cổng vào."}
                    </p>
                  </div>

                  {/* Quy định 4: Check-in Sớm*/}
                  <div className="flex gap-2.5">
                    <span className="text-blue-500 font-extrabold">2.</span>
                    <p>
                      {language === "en"
                        ? "Free check-in is allowed up to 15 mins early. If you arrive earlier than 15 mins, you will be charged extra fees according to the policy."
                        : "Hệ thống hỗ trợ vào bãi sớm tối đa 15 phút miễn phí. Nếu tới sớm hơn 15 phút, bạn sẽ phải trả thêm phí theo quy định."}
                    </p>
                  </div>

                  {/* Quy định 5: Check-in Muộn */}
                  <div className="flex gap-2.5">
                    <span className="text-blue-500 font-extrabold">3.</span>
                    <p>
                      {language === "en"
                        ? "Reservations are held for a maximum of 30 mins from the scheduled time; past this window, the booking is automatically cancelled with NO REFUND."
                        : "Suất đặt chỗ chỉ được giữ tối đa 30 phút so với giờ hẹn, quá thời gian này lịch đặt sẽ tự động hủy và không hoàn tiền."}
                    </p>
                  </div>

                  {/* Quy định 6: Quá giờ & Phạt chiếm dụng slot */}
                  <div className="flex gap-2.5">
                    <span className="text-blue-500 font-extrabold">4.</span>
                    <p>
                      {language === "en"
                        ? "Overstaying your reserved window will incur an overtime penalty fee (2x the base hourly rate) calculated per 60-minute block, payable at the exit gate. You have a 15-minute grace period to check-out after the reservation expires before any penalties are calculated."
                        : "Trường hợp đỗ quá khung giờ đã đặt, hệ thống sẽ áp dụng phí phạt quá giờ (gấp 2 lần giá gốc) tính theo block 60 phút. Bạn cần thanh toán số tiền phát sinh này tại cổng ra để mở rào chắn. Khách hàng được ân hạn thêm 15 phút để check-out xe mà không bị tính phí phạt."}
                    </p>
                  </div>

                  {/* Quy định 6: Chính sách hủy lịch & Hoàn tiền */}
                  <div className="flex gap-2.5">
                    <span className="text-blue-500 font-extrabold">5.</span>
                    <p>
                      {language === "en"
                        ? "Cancellations made at least 60 minutes prior to the scheduled arrival time will receive a 100% refund into your wallet and do not count as spam. Cancellations are strictly prohibited once the vehicle has checked in or within 1 hour of the scheduled arrival time."
                        : "Hủy lịch sớm trước giờ hẹn ít nhất 1 tiếng sẽ được hoàn 100% tiền cọc vào ví người dùng và không tính vào giới hạn spam. Không được phép hủy đặt chỗ khi xe đã check-in hoặc trong vòng 1 tiếng trước giờ hẹn."}
                    </p>
                  </div>

                  {/* Quy định 6: Tính năng khóa xe bảo mật */}
                  <div className="flex gap-2.5">
                    <span className="text-blue-500 font-extrabold">6.</span>
                    <p>
                      {language === "en"
                        ? "For absolute security, you can activate the 'Lock Vehicle' feature on the app after parking. The exit barrier will remain locked until you unlock it via the app."
                        : "Để đảm bảo an toàn tài sản, bạn có thể kích hoạt tính năng 'Khóa xe' trên ứng dụng sau khi đỗ. Rào chắn lối ra sẽ chặn hoàn toàn biển số xe này cho đến khi bạn chủ động 'Mở khóa' trên app."}
                    </p>
                  </div>

                  {/* Quy định 7: Ràng buộc chống Spam */}
                  <div className="flex gap-2.5">
                    <span className="text-blue-500 font-extrabold">7.</span>
                    <p>
                      {language === "en"
                        ? "If an account cancels bookings (unpaid) more than 3 times a day, the system will trigger a spam warning and lock the booking feature for the next 24 hours."
                        : "Nếu tài khoản chủ động hủy lịch quá 3 lần/ngày (đối với đơn chưa thanh toán), hệ thống sẽ kích hoạt cảnh báo spam và khóa tính năng đặt chỗ trước trong 24 giờ tiếp theo."}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                  <button
                    onClick={closeModal}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    {language === "en" ? "Close" : "Đóng"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
