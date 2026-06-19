import React, { useState, useEffect, useMemo } from "react";
<<<<<<< HEAD
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
=======
import {ArrowLeft,Car,Bike,QrCode,Clock,Edit,Ban,CreditCard,AlertTriangle,CheckCircle2,Info,Calendar,MapPin,CheckCircle,X,Search,Filter,
Hash,} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyBookings() {
  const navigate = useNavigate();
>>>>>>> origin/main

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [stats, setStats] = useState({
<<<<<<< HEAD
    totalBookings: 0,
    activeSessions: 0,
  });

  const [bookings, setBookings] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [expandedBookings, setExpandedBookings] = useState({});

  // Search & Filter Client States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("earliest"); // "earliest" or "latest"
=======
    totalBookings: 42,
    thisMonthNew: 5,
    activeSessions: 2,
    totalCost: 1250000,
  });

  const [bookingHistory, setBookingHistory] = useState([
    {
      id: "#SP-12845",
      location: "Slot S12 - Basement B1",
      plate_number: "51H-123.45",
      date: "2026-05-20",
      time: "08:00 - 17:30",
      fee: 85000,
      status: "completed",
    },
    {
      id: "#SP-12733",
      location: "Slot S05 - Basement B2",
      plate_number: "29A-888.88",
      date: "2026-05-18",
      time: "09:00 - 11:00",
      fee: 25000,
      status: "cancelled",
    },
    {
      id: "#SP-12601",
      location: "Slot S40 - Floor 1 (VIP)",
      plate_number: "43A-567.89",
      date: "2026-05-15",
      time: "14:00 - 20:00",
      fee: 120000,
      status: "completed",
    },
    {
      id: "#SP-12588",
      location: "Slot S18 - Basement B1",
      plate_number: "51H-123.45",
      date: "2026-05-12",
      time: "18:00 - 22:00",
      fee: 40000,
      status: "completed",
    },
  ]);

  const [bookings, setBookings] = useState([
    {
      id: "BKG-9823",
      slotId: "S15",
      floorName: "Basement B1",
      vehicleType: "car",
      plate_number: "51H-123.45", //  ĐÃ THÊM: Biển số xe để khớp luồng quét AI Camera ở cổng vào
      startTime: "2026-05-28T08:00",
      endTime: "2026-05-28T17:00",
      totalPrice: 180000,
      depositPaid: 10000,
      remainingBalance: 170000,
      status: "active",
      qrCodeData: "Ticket_Valid_S15_Plate_51H12345",
    },
    {
      id: "BKG-1045",
      slotId: "S42",
      floorName: "Floor 1 (VIP)",
      vehicleType: "motorbike",
      plate_number: "43A-567.89", 
      startTime: "2026-05-29T09:00",
      endTime: "2026-05-29T12:00",
      totalPrice: 15000,
      depositPaid: 10000,
      remainingBalance: 5000,
      status: "active",
      qrCodeData: "Ticket_Valid_S42_Plate_43A56789",
    },
  ]);

  // Search & Filter Client States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'completed' | 'cancelled'
>>>>>>> origin/main

  // Modal Controllers
  const [activeModal, setActiveModal] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelCountdown, setCancelCountdown] = useState(5);
<<<<<<< HEAD

  const toggleExpand = (bookingId) => {
    setExpandedBookings((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

  // Load dashboard and active bookings
  const loadBookingDashboard = async () => {
    try {
      const activeRes = await api.get("/bookings/active");
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

=======
  const [adjustTimeData, setAdjustTimeData] = useState({
    startTime: "",
    endTime: "",
  });
  const [newPrice, setNewPrice] = useState(0);

  // ==========================================
  // 🚀 [AXIOS API INTEGRATION]: ĐẦU NỐI LOAD DỮ LIỆU ĐỒNG BỘ TỪ DB
  // ==========================================
  useEffect(() => {
    const fetchUserBookingDashboard = async () => {
      try {
        /* BỎ COMMENT KHI RÁP BACKEND
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // API 1: Lấy các thông số thống kê ở thẻ card trên cùng
        const statsRes = await axios.get('http://localhost:5000/api/v1/user/bookings/stats', { headers });
        setStats(statsRes.data.data);

        // API 2: Lấy danh sách lượt đặt chỗ sắp diễn ra hoặc đang đỗ
        const activeRes = await axios.get('http://localhost:5000/api/v1/user/bookings/active', { headers });
        setBookings(activeRes.data.data);

        // API 3: Lấy toàn bộ lịch sử gửi xe trong quá khứ trích xuất từ bảng BOOKING lịch sử
        const historyRes = await axios.get('http://localhost:5000/api/v1/user/bookings/history', { headers });
        setBookingHistory(historyRes.data.data);
        */
      } catch (error) {
        console.error("Lỗi đồng bộ API lịch sử đặt chỗ:", error);
      }
    };
    fetchUserBookingDashboard();
  }, []);

  // LOGIC: ĐẾM NGƯỢC 5S KHÓA NÚT HUỶ (FR-BK-06)
>>>>>>> origin/main
  useEffect(() => {
    let timer;
    if (activeModal === "cancel" && cancelCountdown > 0) {
      timer = setInterval(() => setCancelCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeModal, cancelCountdown]);

<<<<<<< HEAD


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

=======
  // LOGIC: TÍNH LẠI TIỀN ĐỘNG KHI THAY ĐỔI KHUNG GIỜ (TRONG MODAL ADJUST)
  useEffect(() => {
    if (
      activeModal === "adjust" &&
      adjustTimeData.startTime &&
      adjustTimeData.endTime &&
      selectedBooking
    ) {
      const start = new Date(adjustTimeData.startTime).getTime();
      const end = new Date(adjustTimeData.endTime).getTime();

      if (end > start) {
        const hours = (end - start) / (1000 * 60 * 60);
        const ratePerHour =
          selectedBooking.vehicleType === "car" ? 20000 : 5000;
        setNewPrice(Math.ceil(hours) * ratePerHour);
      } else {
        setNewPrice(0);
      }
    }
  }, [adjustTimeData, activeModal, selectedBooking]);

  // ==========================================
  // XỬ LÝ SEARCH & FILTER ĐỘNG TRÊN TABLE LỊCH SỬ
  // ==========================================
  const filteredBookingHistory = useMemo(() => {
    return bookingHistory.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [bookingHistory, searchQuery, statusFilter]);

  // ==========================================
  // ACTION HANDLERS & ĐẦU NỐI API POST/PUT
  // ==========================================
>>>>>>> origin/main
  const openModal = (type, booking) => {
    setSelectedBooking(booking);
    setActiveModal(type);
    if (type === "cancel") setCancelCountdown(5);
<<<<<<< HEAD
=======
    if (type === "adjust") {
      setAdjustTimeData({
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
      setNewPrice(booking.totalPrice);
    }
>>>>>>> origin/main
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedBooking(null);
  };

  const handleConfirmCancel = async () => {
    try {
<<<<<<< HEAD
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
=======
      /*  [AXIOS API INTEGRATION]: GỌI API HUỶ LƯỢT ĐẶT CHỖ
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/v1/bookings/${selectedBooking.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      */
      setBookings(
        bookings.map((b) =>
          b.id === selectedBooking.id ? { ...b, status: "cancelled" } : b,
        ),
      );
      closeModal();
    } catch (error) {
      console.error("Lỗi huỷ đặt chỗ:", error);
    }
  };

  const handleConfirmAdjust = async () => {
    try {
      /*  [AXIOS API INTEGRATION]: GỌI API THAY ĐỔI KHUNG GIỜ ĐẶT CHỖ (CẬP NHẬT CỘT EXPECTED_ARRIVAL TRONG DB)
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/v1/bookings/${selectedBooking.id}`, {
        start_time: adjustTimeData.startTime,
        end_time: adjustTimeData.endTime,
        total_price: newPrice
      }, { headers: { Authorization: `Bearer ${token}` } });
      */
      setBookings(
        bookings.map((b) =>
          b.id === selectedBooking.id
            ? {
                ...b,
                startTime: adjustTimeData.startTime,
                endTime: adjustTimeData.endTime,
                totalPrice: newPrice,
                remainingBalance: newPrice - b.depositPaid,
              }
            : b,
        ),
      );
      closeModal();
    } catch (error) {
      console.error("Lỗi điều chỉnh giờ:", error);
    }
  };

  const handleConfirmPay = async () => {
    try {
      /* 🚀 [AXIOS API INTEGRATION]: GỌI API THANH TOÁN SỐ DƯ KHI CHECKOUT GỬI XE
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/v1/bookings/${selectedBooking.id}/checkout-pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      */
      setBookings(
        bookings.map((b) =>
          b.id === selectedBooking.id
            ? { ...b, status: "paid", remainingBalance: 0 }
            : b,
        ),
      );
      closeModal();
    } catch (error) {
      console.error("Lỗi xử lý thanh toán:", error);
>>>>>>> origin/main
    }
  };

  const formatDate = (dateString) => {
<<<<<<< HEAD
    if (!dateString) return "N/A";
=======
>>>>>>> origin/main
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
<<<<<<< HEAD
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
=======
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <div className="animate-slide-in h-[calc(100vh-8rem)] flex flex-col overflow-y-auto custom-scrollbar pr-2">
      {/* Header Title */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/user")}
          className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          My Bookings
        </h2>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-semibold mb-2">
            Total Sessions
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
              {stats.totalBookings}
            </h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2.5 py-1 rounded-full">
              This month: +{stats.thisMonthNew}
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-semibold mb-2">
            Active Parking
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
              0{stats.activeSessions}
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full animate-pulse">
              ● In Lot
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-semibold mb-2">
            Total Expended
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
              {stats.totalCost.toLocaleString()}đ
            </h3>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400 px-2.5 py-1 rounded-full">
              Accumulated
            </span>
>>>>>>> origin/main
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* SECTION: DIGITAL ENTRY PASS */}
      <div className="mb-8 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {language === "en" ? "Booking History" : "Lịch sử đặt chỗ"}
          </h3>

          {/* SEARCH & FILTER FOR CURRENT ACTIVE BOOKINGS */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 min-w-[150px] sm:w-64">
=======
      {/* ACTIVE/UPCOMING BOOKINGS LIST */}
      <div className="shrink-0 mb-8 space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Calendar
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              You have no active booking sessions.
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center transition-all duration-300"
            >
              {/* Cột 1: Icon và thẻ Status */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center gap-3 w-full md:w-auto border-b md:border-b-0 pb-4 md:pb-0 border-slate-100 dark:border-slate-800">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md ${booking.vehicleType === "car" ? "bg-blue-600" : "bg-emerald-600"}`}
                >
                  {booking.vehicleType === "car" ? (
                    <Car size={28} />
                  ) : (
                    <Bike size={28} />
                  )}
                </div>
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    booking.status === "active"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      : booking.status === "paid"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  }`}
                >
                  {booking.status}
                </span>
              </div>

              {/* Cột 2: Chi tiết địa điểm, mã số, biển số xe */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex flex-wrap items-center gap-2">
                      Slot {booking.slotId}
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Hash size={12} />
                        {booking.id}
                      </span>
                      <span className="text-xs font-mono font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-0.5 rounded-md tracking-wide">
                        {booking.plate_number}
                      </span>
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center gap-1 mt-1.5 uppercase tracking-wider">
                      <MapPin size={13} className="text-blue-500" />{" "}
                      {booking.floorName}
                    </p>
                  </div>

                  {booking.status !== "cancelled" && (
                    <button
                      onClick={() => openModal("qr", booking)}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <QrCode size={16} /> Show Ticket
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 font-medium">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5">
                      Entry Schedule
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {formatDate(booking.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5">
                      Exit Estimation
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {formatDate(booking.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cột 3: Giá tiền & Các nút hành động điều phối */}
              <div className="w-full md:w-auto md:min-w-[180px] flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-right">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    Remaining Balance
                  </p>
                  <p
                    className={`text-2xl font-black font-mono tracking-tight ${booking.status === "paid" ? "text-emerald-500" : "text-slate-800 dark:text-white"}`}
                  >
                    {booking.remainingBalance.toLocaleString()}{" "}
                    <span className="text-xs font-sans font-bold">VND</span>
                  </p>
                </div>

                {booking.status === "active" && (
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => openModal("pay", booking)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <CreditCard size={14} /> Settle & Checkout
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openModal("adjust", booking)}
                        className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Edit size={12} /> Adjust
                      </button>
                      <button
                        onClick={() => openModal("cancel", booking)}
                        className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Ban size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
                {booking.status === "paid" && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold p-2.5 rounded-xl flex items-center justify-center gap-1.5">
                    <CheckCircle size={14} /> Paid in Full
                  </div>
                )}
                {booking.status === "cancelled" && (
                  <div className="bg-slate-50 dark:bg-slate-800 text-slate-400 text-xs font-bold p-2.5 rounded-xl text-center">
                    Session Cancelled
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==========================================
          LỊCH SỬ GỬI XE (BOOKING HISTORY TABLE ĐÃ CÓ SEARCH THỰC TẾ)
          ========================================== */}
      <div className="shrink-0 mt-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Booking History
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search form*/}
            <div className="relative flex-1 sm:w-64">
>>>>>>> origin/main
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
<<<<<<< HEAD
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
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer shadow-sm"
            >
              <option value="earliest">{language === "en" ? "Entry Time: Earliest" : "Giờ vào: Sớm nhất"}</option>
              <option value="latest">{language === "en" ? "Entry Time: Latest" : "Giờ vào: Muộn nhất"}</option>
=======
                placeholder="Search ID, Plate or Slot..."
                // 
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white text-slate-800 dark:bg-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Bộ lọc trạng thái động hóa */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
>>>>>>> origin/main
            </select>
          </div>
        </div>

<<<<<<< HEAD
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
                          {language === "en" ? "Paid" : "Đã nộp cọc"}
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
                          <div className="lg:col-span-5 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 dark:from-slate-950/40 dark:to-slate-900/20 p-6 rounded-2xl flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
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
                        ) : (
                          <div className="lg:col-span-5 bg-gradient-to-b from-amber-50/50 to-orange-50/30 dark:from-slate-950/40 dark:to-slate-900/20 p-6 rounded-2xl flex flex-col items-center justify-center border border-slate-200/60 dark:border-slate-800 shadow-sm">
                            <div className="p-4 bg-amber-500/10 text-amber-500 dark:text-amber-455 rounded-full mb-3 shadow-inner">
                              <Clock size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                              {language === "en" ? "Awaiting Check-in" : "Chờ xe vào bãi"}
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-5 max-w-[220px] leading-relaxed">
                              {language === "en" ? "This booking has not checked in yet. Smart Lock will activate upon check-in." : "Đặt chỗ này chưa quét xe vào bãi. Khóa thông minh sẽ tự động kích hoạt sau khi check-in."}
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
                              const canCancel = booking.status !== "active" && booking.status !== "completed" && new Date(booking.startTime).getTime() - new Date().getTime() >= 60 * 60 * 1000;
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
=======
        {/* Cấu trúc Bảng dữ liệu đa giao diện */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs uppercase text-slate-400 dark:text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Plate Number</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time Window</th>
                  <th className="px-6 py-4 text-right">Fee Paid</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredBookingHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      No matching historical records found.
                    </td>
                  </tr>
                ) : (
                  filteredBookingHistory.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-300">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-xs text-slate-700 dark:text-slate-300">
                        {item.plate_number}
                      </td>
                      <td className="px-6 py-4">{item.location}</td>
                      <td className="px-6 py-4 text-xs">{item.date}</td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {item.time}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-800 dark:text-slate-300">
                        {item.fee.toLocaleString()}đ
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${item.status === "completed" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
            <span>
              Showing 1-{filteredBookingHistory.length} of{" "}
              {filteredBookingHistory.length} items
            </span>
            <div className="flex gap-1">
              <button className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 transition-colors rounded-lg hover:bg-slate-100">
                Prev
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded-lg shadow-sm">
                1
              </button>
              <button className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 transition-colors rounded-lg hover:bg-slate-100">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODALS SYSTEM (ĐÃ SỬA ĐỘ LỚP PHỦ MỜ VỪA PHẢI THEO YÊU CẦU Z-[99999])
          ========================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col border border-slate-100 dark:border-slate-800">
            {/* Modal 1: XEM VÉ TICKET QR */}
            {activeModal === "qr" && (
              <div className="p-8 text-center relative">
                <button
                  onClick={closeModal}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-1 flex items-center justify-center gap-1.5">
                  <QrCode className="text-blue-500" size={22} /> E-Ticket
                  Validated
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-mono font-bold mb-6">
                  ID: {selectedBooking.id} | PLATE:{" "}
                  {selectedBooking.plate_number}
                </p>

                <div className="bg-white p-4 rounded-2xl inline-block border-4 border-slate-800 mb-5 shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedBooking.qrCodeData}`}
                    alt="Ticket QR"
                    className="w-44 h-44"
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 mb-6 text-left flex gap-2.5 items-start text-amber-700 dark:text-amber-400 text-xs font-medium leading-relaxed">
                  <Info className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <p>
                    Security camera scans your plate at gate lines. Show this
                    ticket QR to staff if camera fails.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all"
                >
                  Close Ticket Window
                </button>
              </div>
            )}

            {/* Modal 2: HUỶ ĐẶT CHỖ (CÓ KHÓA COUNTDOWN TIỀN ĐỀ) */}
            {activeModal === "cancel" && (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2">
                  Cancel Booking Session?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 font-medium">
                  Are you sure to release reservation for{" "}
                  <span className="font-black text-slate-700 dark:text-slate-200">
                    Slot {selectedBooking.slotId}
                  </span>
                  ?
                </p>

                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-3.5 mb-6 text-left">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    Penalty Forfeiture Notice:
                  </p>
                  <p className="text-[11px] font-medium text-red-500 mt-1 leading-normal">
                    Pursuant to regulations, your booking deposit fee of{" "}
                    <span className="font-bold underline">
                      {selectedBooking.depositPaid.toLocaleString()} VND
                    </span>{" "}
                    is non-refundable upon cancellation.
>>>>>>> origin/main
                  </p>
                </div>

                <div className="flex gap-3">
<<<<<<< HEAD
                  <button onClick={closeModal} className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    {language === "en" ? "Go Back" : "Quay lại"}
=======
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    Dismiss
>>>>>>> origin/main
                  </button>
                  <button
                    disabled={cancelCountdown > 0}
                    onClick={handleConfirmCancel}
<<<<<<< HEAD
                    className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm ${cancelCountdown > 0 ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"}`}
                  >
                    {cancelCountdown > 0 ? `Confirm (${cancelCountdown}s)` : (language === "en" ? "Cancel Booking" : "Xác nhận hủy")}
=======
                    className={`flex-1 font-bold py-3 rounded-xl transition-all text-sm shadow-md ${cancelCountdown > 0 ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"}`}
                  >
                    {cancelCountdown > 0
                      ? `Confirm (${cancelCountdown}s)`
                      : "Confirm Cancel"}
>>>>>>> origin/main
                  </button>
                </div>
              </div>
            )}

<<<<<<< HEAD
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
=======
            {/* Modal 3: ĐIỀU CHỈNH KHUNG GIỜ */}
            {activeModal === "adjust" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-1.5">
                    <Clock className="text-blue-500" size={18} /> Adjust
                    Schedule Window
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                      New Arrival Entry:
                    </label>
                    <input
                      type="datetime-local"
                      value={adjustTimeData.startTime}
                      onChange={(e) =>
                        setAdjustTimeData({
                          ...adjustTimeData,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                      Estimated Departure Exit:
                    </label>
                    <input
                      type="datetime-local"
                      value={adjustTimeData.endTime}
                      onChange={(e) =>
                        setAdjustTimeData({
                          ...adjustTimeData,
                          endTime: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-3.5 mb-6 border border-blue-100 dark:border-blue-900/30 text-xs font-medium space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>New Total Calculation:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {newPrice.toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 dark:border-blue-900/40 pb-1.5">
                    <span>Deposit Deducted:</span>
                    <span className="text-red-500 font-bold">
                      -{selectedBooking.depositPaid.toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 text-sm">
                    <span className="text-blue-800 dark:text-blue-300 font-bold">
                      New Remaining Owed:
                    </span>
                    <span className="font-black text-base text-blue-600 dark:text-blue-400">
                      {(newPrice - selectedBooking.depositPaid > 0
                        ? newPrice - selectedBooking.depositPaid
                        : 0
                      ).toLocaleString()}
                      đ
                    </span>
                  </div>
                </div>
                <button
                  disabled={newPrice <= 0}
                  onClick={handleConfirmAdjust}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 text-sm"
                >
                  Save Modified Schedule
                </button>
              </div>
            )}

            {/* Modal 4: THANH TOÁN SỐ DƯ CHECKOUT */}
            {activeModal === "pay" && (
              <div className="p-8 text-center">
                <button
                  onClick={closeModal}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-1 flex items-center justify-center gap-1.5">
                  <CreditCard className="text-emerald-500" size={20} /> Session
                  Settlement
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mb-5">
                  Scanning portal to complete checkout transaction
                </p>

                <div className="bg-white p-3 rounded-2xl inline-block border-2 border-slate-100 mb-4 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Pay_${selectedBooking.remainingBalance}_Slot_${selectedBooking.slotId}`}
                    alt="Banking QR"
                    className="w-44 h-44"
                  />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-6 border border-slate-100 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <p>
                    Amount Due:{" "}
                    <span className="text-emerald-500 text-lg font-black font-mono ml-1">
                      {selectedBooking.remainingBalance.toLocaleString()}đ
                    </span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleConfirmPay}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-emerald-500/20"
                  >
                    I Have Paid Balance
>>>>>>> origin/main
                  </button>
                </div>
              </div>
            )}
<<<<<<< HEAD

=======
>>>>>>> origin/main
          </div>
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
