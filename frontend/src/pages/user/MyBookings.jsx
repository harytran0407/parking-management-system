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
  BarChart3,
  Unlock,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info,
  DollarSign,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  QrCode,
  LogIn,
  LogOut,
  Receipt,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  CalendarCheck,
  Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import { jsPDF } from "jspdf";

export default function MyBookings() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();

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
    completedSessions: 0,
  });

  const [bookings, setBookings] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [expandedBookings, setExpandedBookings] = useState({});

  // Search & Filter Client States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" or "oldest"

  // Pagination
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Controllers
  const [activeModal, setActiveModal] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState("PAYOS");
  const [processingPayment, setProcessingPayment] = useState(false);

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
          const typeNameLower = (b.vehicle_type || "").toLowerCase();
          // typeId 1 = Motorbike, typeId 2 = Car (theo DB schema)
          // Chỉ coi là Car khi typeId = 2, hoặc typeId chưa xác định nhưng tên chứa "car"/"ô tô"
          const isCar = typeId === 2 || (typeId !== 1 && (typeNameLower.includes("car") || typeNameLower.includes("ô tô")));
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
            earlyFee: b.early_fee || 0,
            penaltyFee: b.penalty_fee || 0,
            actualCheckIn: b.actual_check_in || null,
            actualCheckOut: b.actual_check_out || null,
            status: (b.status.toLowerCase() === "active" && !b.actual_check_in) ? "confirmed" : b.status.toLowerCase(),
            isLocked: b.is_locked,
            bookingTime: b.booking_time,
            paymentMethod: b.payment_method || null,
          };
        });
        setBookings(list);

        // Calculate dynamic stats
        const totalCount = list.length;
        const activeCount = list.filter(b => b.status === "active").length;
        const completedCount = list.filter(b => b.status === "completed").length;

        setStats({
          totalBookings: totalCount,
          activeSessions: activeCount,
          completedSessions: completedCount,
        });
      }
    } catch (error) {
      console.error("Lỗi đồng bộ API đặt chỗ:", error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const vnpResponseCode = params.get("vnp_ResponseCode");

    if (vnpResponseCode) {
      if (vnpResponseCode === "00") {
        const payload = {
          vnp_Amount: params.get("vnp_Amount"),
          vnp_ResponseCode: vnpResponseCode,
          vnp_TxnRef: params.get("vnp_TxnRef"),
          vnp_SecureHash: params.get("vnp_SecureHash") || "mock_hash"
        };
        api.post("/payments/webhook/vnpay", payload)
          .then(() => {
            alert(language === "en" ? "Payment successful! Your booking is confirmed." : "Thanh toán thành công! Lịch đặt chỗ của bạn đã được xác nhận.");
            loadBookingDashboard();
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            console.error("Lỗi xác nhận VNPay:", err);
            alert(language === "en" ? "Failed to confirm payment." : "Xác nhận thanh toán thất bại.");
            loadBookingDashboard();
            window.history.replaceState({}, document.title, window.location.pathname);
          });
      } else {
        alert(language === "en" ? "Payment failed or cancelled." : "Thanh toán thất bại hoặc đã bị hủy.");
        loadBookingDashboard();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (status === "success") {
      alert(language === "en" ? "PayOS payment succeeded! Your booking is confirmed." : "Thanh toán PayOS thành công! Lịch đặt chỗ của bạn đã được xác nhận.");
      loadBookingDashboard();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === "cancelled") {
      alert(language === "en" ? "PayOS payment was cancelled." : "Thanh toán PayOS đã bị hủy bỏ.");
      loadBookingDashboard();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      loadBookingDashboard();
    }
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

    // 2. Sort filtered bookings by bookingTime based on sortOrder
    return filtered.sort((a, b) => {
      const timeA = new Date(a.bookingTime).getTime();
      const timeB = new Date(b.bookingTime).getTime();
      if (sortOrder === "oldest") {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    });
  }, [bookings, searchQuery, statusFilter, sortOrder]);

  // Reset to page 1 whenever filter/search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortOrder]);

  // Derived pagination values
  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredBookings.length / PAGE_SIZE));
  const paginatedBookings = sortedAndFilteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const formatBookedAt = (dtString) => {
    if (!dtString) return "";
    try {
      const d = new Date(dtString);
      return d.toLocaleString(language === "en" ? "en-US" : "vi-VN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch { return ""; }
  };

  const formatFullDateTime = (dtString) => {
    if (!dtString) return "—";
    try {
      const d = new Date(dtString);
      return d.toLocaleString(language === "en" ? "en-US" : "vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch { return "—"; }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return "—";
    try {
      const diffMs = new Date(end).getTime() - new Date(start).getTime();
      if (diffMs <= 0) return "—";
      const totalMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      if (hrs > 0) {
        return language === "en" ? `${hrs}h ${mins}m` : `${hrs} giờ ${remMins = mins} phút`;
      }
      return language === "en" ? `${mins}m` : `${mins} phút`;
    } catch {
      return "—";
    }
  };

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

  const handleConfirmMockPayment = async () => {
    if (!selectedBooking) return;

    setProcessingPayment(true);
    try {
      const payload = {
        booking_id: selectedBooking.id,
        payment_method: "VNPAY"
      };

      const res = await api.post("/payments/confirm-mock", payload);
      if (res.data && res.data.success) {
        alert(language === "en" ? "Mock payment succeeded!" : "Thanh toán giả lập thành công!");
        closeModal();
        await loadBookingDashboard();
      } else {
        alert(language === "en" ? "Mock payment failed." : "Thanh toán giả lập thất bại.");
      }
    } catch (err) {
      console.error("Mock payment error:", err);
      alert(err.response?.data?.message || (language === "en" ? "Payment failed. Please try again." : "Thanh toán thất bại. Vui lòng thử lại."));
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayOsPayment = async () => {
    if (!selectedBooking) return;

    setProcessingPayment(true);
    try {
      const payload = {
        booking_id: selectedBooking.id,
        payment_method: "PAYOS",
        return_url: window.location.origin + "/user/bookings?status=success",
        cancel_url: window.location.origin + "/user/bookings?status=cancelled"
      };

      const res = await api.post("/payments/create", payload);
      if (res.data && res.data.success && res.data.data?.payment_url) {
        window.location.href = res.data.data.payment_url;
      } else {
        alert(language === "en" ? "Failed to create PayOS payment link." : "Khởi tạo thanh toán PayOS thất bại.");
        setProcessingPayment(false);
      }
    } catch (err) {
      console.error("PayOS payment error:", err);
      alert(err.response?.data?.message || (language === "en" ? "Payment failed. Please try again." : "Thanh toán thất bại. Vui lòng thử lại."));
      setProcessingPayment(false);
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
      hour12: false,
    };
    return new Date(dateString).toLocaleDateString(language === "en" ? "en-US" : "vi-VN", options);
  };

  return (
    <div className="h-[calc(100vh-4rem)] xl:h-[calc(100vh-6rem)] flex flex-col overflow-y-auto custom-scrollbar pr-2 pb-8 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto w-full">
      {/* STATS OVERVIEW CARDS */}
      {(() => {
        const formatStat = (num) => String(num).padStart(2, "0");
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 shrink-0">
            {/* Card 1: Total Bookings (Blue Gradient) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1a4cbd] to-[#12399a] rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28 border border-blue-800">
              <div className="space-y-0.5 relative z-10">
                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                  {language === "en" ? "TOTAL BOOKINGS" : "TỔNG LƯỢT ĐẶT"}
                </p>
                <h3 className="text-4xl font-extrabold text-white font-sans tracking-tight">
                  {formatStat(stats.totalBookings)}
                </h3>
              </div>
              {/* Underlay faint chart icon */}
              <div className="absolute right-2 -bottom-2 text-white/10 shrink-0 pointer-events-none">
                <BarChart3 size={90} className="stroke-[1.5]" />
              </div>
            </div>

            {/* Card 2: Active Sessions (White Card with faint P outline) */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28">
              <div className="space-y-0.5 relative z-10">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === "en" ? "PARKING" : "ĐANG HOẠT ĐỘNG"}
                </p>
                <h3 className="text-4xl font-extrabold text-[#003893] dark:text-blue-400 font-sans tracking-tight">
                  {formatStat(stats.activeSessions)}
                </h3>
              </div>
              {/* Underlay faint letter P outline */}
              <div className="absolute right-4 -bottom-4 text-slate-100 dark:text-slate-800/40 shrink-0 pointer-events-none select-none">
                <span className="font-extrabold text-[85px] leading-none select-none tracking-tighter opacity-80 font-sans">P</span>
              </div>
            </div>

            {/* Card 3: Completed Sessions (White Card with faint checkcircle outline) */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-28">
              <div className="space-y-0.5 relative z-10">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {language === "en" ? "COMPLETED" : "ĐÃ HOÀN TẤT"}
                </p>
                <h3 className="text-4xl font-extrabold text-[#005bb5] dark:text-blue-400 font-sans tracking-tight">
                  {formatStat(stats.completedSessions)}
                </h3>
              </div>
              {/* Underlay faint check icon */}
              <div className="absolute right-2 -bottom-2 text-slate-100 dark:text-slate-800/40 shrink-0 pointer-events-none">
                <CheckCircle2 size={90} className="stroke-[1] opacity-75" />
              </div>
            </div>
          </div>
        );
      })()}

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
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer shadow-sm"
            >
              <option value="newest">{language === "en" ? "Newest to Oldest" : "Mới nhất"}</option>
              <option value="oldest">{language === "en" ? "Oldest to Newest" : "Cũ nhất"}</option>
            </select>

            {/* Regulations Button relocated here */}
            <button
              onClick={() => setActiveModal("regulations")}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Info size={14} className="text-blue-500" />
              {language === "en" ? "Rules" : "Quy định"}
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto gap-2 md:gap-6 no-scrollbar pb-px">
          {[
            { id: "pending", labelEn: "Confirmed", labelVi: "Đã xác nhận" },
            { id: "active", labelEn: "Parking", labelVi: "Đang đỗ" },
            { id: "completed", labelEn: "Completed", labelVi: "Đã hoàn thành" },
            { id: "cancelled", labelEn: "Cancel", labelVi: "Đã hủy" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all focus:outline-none whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {language === "en" ? tab.labelEn : tab.labelVi}
              </button>
            );
          })}
        </div>

        {sortedAndFilteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Calendar size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {language === "en" ? "No active bookings found." : "Không tìm thấy vé xe nào phù hợp."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {paginatedBookings.map((booking) => {
                const locked = isCurrentlyLocked(booking);
                const isCar = booking.vehicleType === "car";

                // Check if parked past expiration time
                const isOverdue = booking.status === "active" && booking.endTime && currentTime > new Date(booking.endTime).getTime();
                // Check if late to check-in
                const isLateToCheckIn = (booking.status === "pending" || booking.status === "confirmed") && currentTime > new Date(booking.startTime).getTime();

                // Border color per status
                let borderStyle = "border border-slate-200 dark:border-slate-800";
                if (booking.status === "active") borderStyle = "border-l-4 border-l-blue-600 border border-slate-200 dark:border-slate-800";
                else if (booking.status === "confirmed") borderStyle = "border-l-4 border-l-amber-300 border border-amber-100 dark:border-amber-900/30";
                else if (booking.status === "completed") borderStyle = "border-l-4 border-l-emerald-500 border border-slate-200 dark:border-slate-800";
                else if (booking.status === "cancelled") borderStyle = "border-l-4 border-l-red-600 border border-slate-200 dark:border-slate-800 opacity-80";
                else borderStyle = "border-l-4 border-l-amber-500 border border-amber-100 dark:border-amber-900/30";

                // Icon container background color per status (icon itself stays dark)
                let iconBgCls = "bg-amber-50 dark:bg-amber-950/20"; // default: confirmed / pending
                if (booking.status === "active") iconBgCls = "bg-blue-50 dark:bg-blue-950/40";
                else if (booking.status === "completed") iconBgCls = "bg-emerald-50 dark:bg-emerald-950/40";
                else if (booking.status === "cancelled") iconBgCls = "bg-slate-50 dark:bg-slate-800/60";

                // Status badge
                let statusText = "";
                let statusCls = "";
                if (booking.status === "confirmed") { statusText = language === "en" ? "Awaiting Check-in" : "Chờ nhận xe"; statusCls = "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"; }
                else if (booking.status === "active") { statusText = language === "en" ? "Parking" : "Đang đỗ"; statusCls = "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"; }
                else if (booking.status === "completed") { statusText = language === "en" ? "Completed" : "Đã hoàn tất"; statusCls = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"; }
                else if (booking.status === "cancelled") { statusText = language === "en" ? "Cancelled" : "Đã hủy"; statusCls = "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"; }
                else { statusText = language === "en" ? "Unpaid" : "Chưa thanh toán"; statusCls = "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"; }

                const displayPrice = booking.status === "cancelled" ? 0 : booking.depositPaid;

                return (
                  <div
                    key={booking.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm ${borderStyle} flex flex-col sm:flex-row sm:items-center p-4 sm:p-5 gap-4`}
                  >
                    {/* Left: Vehicle icon + info — grows to fill space */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-2xl shrink-0 shadow-sm ${iconBgCls}`}>
                        <span className="text-slate-700 dark:text-slate-200">
                          {isCar ? <Car size={22} /> : <Bike size={22} />}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-base font-black text-slate-900 dark:text-white tracking-wider">
                            {booking.plate_number}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCls}`}>
                            {statusText}
                          </span>
                          {/* Lock status badge for active bookings */}
                          {booking.status === "active" && locked && (
                            <span className="flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                              <Lock size={9} /> {language === "en" ? "Locked" : "Đã khóa"}
                            </span>
                          )}
                          {booking.status === "active" && !locked && (
                            <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                              <Unlock size={9} /> {language === "en" ? "Unlocked" : "Đã mở khóa"}
                            </span>
                          )}
                          {isLateToCheckIn && (
                            <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {language === "en" ? "Late" : "Trễ hẹn"}
                            </span>
                          )}
                          {isOverdue && (
                            <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                              {language === "en" ? "Overdue" : "Quá hạn"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-500 mb-0.5">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">
                            {booking.status === "active" || booking.status === "completed"
                              ? `${booking.zoneName}${booking.floorNumber ? ` - ${language === "en" ? "Floor" : "Tầng"} ${booking.floorNumber}` : ""}`
                              : (booking.slotName || (language === "en" ? "Assigned at Check-in" : "Chỉ định lúc Check-in"))}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-500 font-medium">
                          <Clock size={10} className="shrink-0" />
                          <span>{language === "en" ? "Booked:" : "Giờ đặt:"}</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {formatBookedAt(booking.bookingTime) || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Total price — fixed width so it always aligns regardless of buttons */}
                    <div className="w-28 shrink-0 flex flex-col items-end border-l border-slate-200 dark:border-slate-800 pl-4">
                      <p className="text-[9px] text-slate-600 uppercase font-extrabold tracking-wider">
                        {language === "en" ? "TOTAL" : "TỔNG CỘNG"}
                      </p>
                      <p className={`text-lg font-black font-sans ${booking.status === "cancelled" ? "text-slate-400" :
                        booking.status === "completed" ? "text-emerald-600 dark:text-emerald-400" :
                          "text-slate-900 dark:text-white"
                        }`}>
                        {displayPrice.toLocaleString()}đ
                      </p>
                    </div>

                    {/* Right: Action buttons — fixed minimum width so price column isn't pushed */}
                    <div className="w-48 shrink-0 flex items-center justify-end gap-2">
                      {/* Unpaid → only Pay button */}
                      {booking.status !== "confirmed" && booking.status !== "active" && booking.status !== "completed" && booking.status !== "cancelled" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal("payBooking", booking); }}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all active:scale-[0.98]"
                        >
                          {language === "en" ? "Pay" : "Thanh toán"}
                        </button>
                      ) : (
                        <>
                          {(booking.status === "confirmed" || booking.status === "active" || booking.status === "completed" || booking.status === "cancelled") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openModal("receipt", booking); }}
                              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold px-3 py-2 rounded-xl text-xs shadow-sm transition-all"
                            >
                              <Receipt size={13} />
                              {language === "en" ? "Receipt" : "Biên lai"}
                            </button>
                          )}

                          {/* Details button always visible for paid bookings */}
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal("details", booking); }}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all active:scale-[0.98]"
                          >
                            {language === "en" ? "Details" : "Chi tiết"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                {/* Result count */}
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {language === "en"
                    ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sortedAndFilteredBookings.length)} of ${sortedAndFilteredBookings.length} bookings`
                    : `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sortedAndFilteredBookings.length)} / ${sortedAndFilteredBookings.length} lượt đặt`}
                </p>

                {/* Page buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Prev */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-1.5 rounded-lg border transition-all ${currentPage === 1
                      ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed bg-transparent"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page number buttons */}
                  {(() => {
                    const getPageItems = () => {
                      const items = [];
                      let prev = null;
                      for (let p = 1; p <= totalPages; p++) {
                        if (
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1
                        ) {
                          if (prev !== null && p - prev > 1) {
                            items.push({ type: "ellipsis", key: `e-${p}` });
                          }
                          items.push({ type: "page", value: p });
                          prev = p;
                        }
                      }
                      return items;
                    };

                    return getPageItems().map((item) =>
                      item.type === "ellipsis" ? (
                        <span
                          key={item.key}
                          className="px-1.5 text-xs text-slate-400 dark:text-slate-600 select-none"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item.value}
                          onClick={() => setCurrentPage(item.value)}
                          className={`min-w-[32px] h-8 rounded-lg border text-xs font-bold transition-all ${currentPage === item.value
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/30"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400"
                            }`}
                        >
                          {item.value}
                        </button>
                      )
                    );
                  })()}


                  {/* Next */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 rounded-lg border transition-all ${currentPage === totalPages
                      ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed bg-transparent"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Per-page label */}
                <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium hidden sm:block">
                  {language === "en" ? "10 per page" : "10 mục / trang"}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS SYSTEM */}
      {activeModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`bg-white dark:bg-slate-900 w-full rounded-xl shadow-2xl overflow-hidden relative flex flex-col  animate-scale-up ${activeModal === "details" ? "max-w-3xl" : activeModal === "regulations" ? "max-w-lg" : "max-w-md"
            }`}>

            {/* Modal: Confirm Smart Lock Unlock */}
            {activeModal === "unlockConfirm" && (
              <div className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-900/30">
                  <Unlock size={24} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-2">
                  {language === "en" ? "Unlock?" : "Mở khóa?"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  {language === "en"
                    ? "Are you sure you want to unlock your vehicle to prepare for departure?"
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
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
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

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
                  <button
                    onClick={closeModal}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    {language === "en" ? "Close" : "Đóng"}
                  </button>
                </div>
              </div>
            )}
            {activeModal === "receipt" && selectedBooking && (
              <div className="w-full">
                {/* Green header banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 px-6 py-7 text-center text-white relative">
                  <button onClick={closeModal} className="absolute top-3 right-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all">
                    <X size={15} />
                  </button>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={26} className="text-white" />
                  </div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {selectedBooking.status === "completed"
                      ? (language === "en" ? "Parking Completed" : "Hoàn Tất Đỗ Xe")
                      : selectedBooking.status === "active"
                        ? (language === "en" ? "Currently Parked" : "Đang Đỗ Xe")
                        : selectedBooking.status === "confirmed"
                          ? (language === "en" ? "Booking Confirmed" : "Đặt Chỗ Thành Công")
                          : (language === "en" ? "Booking Cancelled" : "Đã Hủy Đặt Chỗ")}
                  </h3>

                </div>

                {/* Receipt body */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
                  {/* Big paid amount / unpaid notice */}
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {language === "en" ? "TOTAL AMOUNT PAID" : "TỔNG SỐ TIỀN ĐÃ THANH TOÁN"}
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white font-sans">
                      {selectedBooking.depositPaid.toLocaleString()} VNĐ
                    </h2>
                  </div>

                  <hr className="border-dashed border-slate-200 dark:border-slate-700" />

                  {/* Scheduled times & Duration */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      {language === "en" ? "SCHEDULE DETAILS" : "CHI TIẾT LỊCH HẸN"}
                    </p>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{language === "en" ? "Arrival Time:" : "Giờ vào dự kiến:"}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatFullDateTime(selectedBooking.startTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{language === "en" ? "Departure Time:" : "Giờ ra dự kiến:"}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatFullDateTime(selectedBooking.endTime)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 mt-1.5">
                        <span className="text-slate-400">{language === "en" ? "Duration:" : "Thời gian đỗ:"}</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {calculateDuration(selectedBooking.startTime, selectedBooking.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle info */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      {language === "en" ? "VEHICLE INFORMATION" : "THÔNG TIN PHƯƠNG TIỆN"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          {language === "en" ? "License Plate" : "Biển số xe"}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white tracking-wider text-sm">
                          {selectedBooking.plate_number}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          {language === "en" ? "Vehicle Type" : "Loại phương tiện"}
                        </p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {selectedBooking.vehicleType === "car"
                            ? (language === "en" ? "Car" : "Xe Ô tô")
                            : (language === "en" ? "Motorbike" : "Xe máy")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fee breakdown */}
                  {(() => {
                    const isCompleted = selectedBooking.status === "completed";
                    const reservationFee = isCompleted
                      ? Math.max(0, selectedBooking.depositPaid - (selectedBooking.earlyFee || 0) - (selectedBooking.penaltyFee || 0))
                      : selectedBooking.depositPaid;
                    const earlyFee = selectedBooking.earlyFee || 0;
                    const penaltyFee = selectedBooking.penaltyFee || 0;
                    const totalCost = reservationFee + earlyFee + penaltyFee;
                    const totalPaid = isCompleted ? totalCost : selectedBooking.depositPaid;
                    const amountDue = isCompleted ? 0 : (earlyFee + penaltyFee);
                    const feeMethod = selectedBooking.paymentMethod || "Paid";

                    return (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          {language === "en" ? "FEE DETAILS" : "CHI TIẾT PHÍ DỊCH VỤ"}
                        </p>
                        <div className="space-y-2 text-xs">
                          {/* Reservation Fee */}
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              {language === "en" ? "Reservation fee" : "Phí đặt chỗ cơ bản"}
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 ml-1.5 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 rounded">
                                {feeMethod}
                              </span>
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {reservationFee.toLocaleString()} VNĐ
                            </span>
                          </div>

                          {/* Early Arrival Fee */}
                          {earlyFee > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">
                                {language === "en" ? "Early arrival fee" : "Phí đến sớm"}
                                <span className="text-[9px] font-bold text-slate-500 ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                  {language === "en" ? "Cash" : "Tiền mặt"}
                                </span>
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {earlyFee.toLocaleString()} VNĐ
                              </span>
                            </div>
                          )}

                          {/* Overtime Penalty Fee */}
                          {penaltyFee > 0 && (
                            <div className="flex justify-between">
                              <span className="text-red-500 font-semibold">
                                {language === "en" ? "Overtime penalty fee" : "Phí quá hạn"}
                                <span className="text-[9px] font-bold text-red-500 ml-1.5 px-1.5 py-0.5 bg-red-50 dark:bg-red-950/20 rounded">
                                  {language === "en" ? "Cash" : "Tiền mặt"}
                                </span>
                              </span>
                              <span className="font-black text-red-500">
                                {penaltyFee.toLocaleString()} VNĐ
                              </span>
                            </div>
                          )}

                          {/* Total Cost */}
                          <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800">
                            <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">
                              {language === "en" ? "TOTAL:" : "Tổng chi phí:"}
                            </span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                              {totalCost.toLocaleString()} VNĐ
                            </span>
                          </div>


                        </div>
                      </div>
                    );
                  })()}

                  {/* PDF download */}
                  <button
                    onClick={() => {
                      try {
                        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
                        // Header bar (Green theme)
                        doc.setFillColor(16, 124, 65); doc.rect(0, 0, 148, 35, "F");
                        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
                        const headerTitle = selectedBooking.status === "completed" ? "BOOKING RECEIPT" : selectedBooking.status === "active" ? "PARKING RECEIPT" : "BOOKING RECEIPT";
                        doc.text(headerTitle, 74, 14, { align: "center" });
                        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
                        doc.text("BOOKING ID: " + selectedBooking.id, 74, 23, { align: "center" });

                        // Total Paid Amount display at the top of PDF
                        const isCompleted = selectedBooking.status === "completed";
                        const reservationFee = isCompleted
                          ? Math.max(0, selectedBooking.depositPaid - (selectedBooking.earlyFee || 0) - (selectedBooking.penaltyFee || 0))
                          : selectedBooking.depositPaid;
                        const earlyFee = selectedBooking.earlyFee || 0;
                        const penaltyFee = selectedBooking.penaltyFee || 0;
                        const totalCost = reservationFee + earlyFee + penaltyFee;
                        const totalPaid = isCompleted ? totalCost : selectedBooking.depositPaid;
                        const amountDue = isCompleted ? 0 : (earlyFee + penaltyFee);

                        doc.setTextColor(60, 60, 60); doc.setFontSize(8);
                        doc.text("TOTAL AMOUNT PAID", 74, 45, { align: "center" });
                        doc.setTextColor(16, 124, 65); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
                        doc.text(totalPaid.toLocaleString() + " VND", 74, 56, { align: "center" });

                        // Divider line
                        doc.setDrawColor(220, 220, 220); doc.line(12, 65, 136, 65);

                        // Schedule Details
                        doc.setTextColor(16, 124, 65); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
                        doc.text("SCHEDULE DETAILS", 12, 72);
                        doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
                        doc.text("Arrival Time:", 12, 78); doc.setFont("helvetica", "bold"); doc.text(formatFullDateTime(selectedBooking.startTime), 40, 78);
                        doc.setFont("helvetica", "normal"); doc.text("Departure Time:", 12, 84); doc.setFont("helvetica", "bold"); doc.text(formatFullDateTime(selectedBooking.endTime), 40, 84);
                        doc.setFont("helvetica", "normal"); doc.text("Duration:", 12, 90); doc.setFont("helvetica", "bold"); doc.text(calculateDuration(selectedBooking.startTime, selectedBooking.endTime), 40, 90);

                        // Divider line
                        doc.line(12, 96, 136, 96);

                        // Vehicle section
                        doc.setTextColor(16, 124, 65); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
                        doc.text("VEHICLE INFORMATION", 12, 103);
                        doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
                        doc.text("License Plate:", 12, 109); doc.setFont("helvetica", "bold"); doc.text(selectedBooking.plate_number, 40, 109);
                        doc.setFont("helvetica", "normal"); doc.text("Vehicle Type:", 12, 115); doc.setFont("helvetica", "bold"); doc.text(selectedBooking.vehicleType === "car" ? "Car" : "Motorbike", 40, 115);

                        // Divider line
                        doc.line(12, 121, 136, 121);

                        // Fee section
                        doc.setTextColor(16, 124, 65); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
                        doc.text("FEE DETAILS", 12, 128);
                        doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(8);

                        let feeMethod = selectedBooking.paymentMethod || "Paid";
                        doc.text(`Reservation fee (${feeMethod}):`, 12, 135);
                        doc.text(reservationFee.toLocaleString() + " VND", 136, 135, { align: "right" });

                        let nextY = 141;
                        if (earlyFee > 0) {
                          doc.text("Early arrival fee (Cash):", 12, nextY);
                          doc.text(earlyFee.toLocaleString() + " VND", 136, nextY, { align: "right" });
                          nextY += 6;
                        }
                        if (penaltyFee > 0) {
                          doc.setTextColor(200, 50, 50);
                          doc.text("Overtime penalty fee (Cash):", 12, nextY);
                          doc.text(penaltyFee.toLocaleString() + " VND", 136, nextY, { align: "right" });
                          doc.setTextColor(80, 80, 80);
                          nextY += 6;
                        }

                        // Divider line
                        doc.line(12, nextY, 136, nextY);

                        // Total cost
                        doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
                        doc.text("TOTAL:", 12, nextY + 7);
                        doc.text(totalCost.toLocaleString() + " VND", 136, nextY + 7, { align: "right" });



                        // Footer
                        doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "italic"); doc.setFontSize(7);
                        doc.text("Thank you for using eParking! We look forward to serving you again.", 74, 195, { align: "center" });
                        doc.save("receipt-" + selectedBooking.id + ".pdf");
                      } catch (e) { alert("Could not generate PDF."); }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
                  >
                    <Download size={15} />
                    {language === "en" ? "Download Receipt" : "Tải hóa đơn"}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Modal: Booking Details (Staff-style) ===== */}
            {activeModal === "details" && selectedBooking && (
              <div className="w-full flex flex-col" style={{ maxHeight: "85vh" }}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarCheck className="text-blue-500" size={17} />
                    {language === "en" ? "Booking Details" : "Chi tiết đặt chỗ"}
                  </h3>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition">
                    <X size={15} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto flex-1 space-y-5 text-sm">
                  {/* Overdue alert */}
                  {selectedBooking.status === "active" && selectedBooking.endTime && new Date().getTime() > new Date(selectedBooking.endTime).getTime() && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex gap-3 text-red-700 dark:text-red-400 text-xs font-semibold">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={17} />
                      <div>
                        <p className="font-black text-sm mb-1">{language === "en" ? "Overdue Parking!" : "Cảnh báo quá hạn giờ đỗ!"}</p>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          {selectedBooking.totalPrice - selectedBooking.depositPaid > 0
                            ? (language === "en"
                              ? `Penalty fee: ${(selectedBooking.totalPrice - selectedBooking.depositPaid).toLocaleString()}đ. Please pay at the exit gate.`
                              : `Phí phạt: ${(selectedBooking.totalPrice - selectedBooking.depositPaid).toLocaleString()}đ. Thanh toán tại cổng ra.`)
                            : (language === "en" ? "Grace period (15 min). Please check out now." : "Đang trong 15 phút ân hạn. Vui lòng ra xe ngay.")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Col 1 */}
                    <div className="space-y-4">
                      {/* Customer info */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                          <User size={13} /> {language === "en" ? "Customer" : "Thông tin khách hàng"}
                        </h4>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "Name:" : "Họ tên:"}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{user?.full_name || user?.fullName || "—"}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "Phone:" : "Điện thoại:"}</span>
                            <a href={`tel:${user?.phone}`} className="font-bold text-blue-500 hover:underline flex items-center gap-1">
                              <Phone size={11} /> {user?.phone || "—"}
                            </a>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "Email:" : "Email:"}</span>
                            <a href={`mailto:${user?.email}`} className="font-semibold text-blue-500 hover:underline flex items-center gap-1 break-all">
                              <Mail size={11} /> {user?.email || "—"}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle & location */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                          <Car size={13} /> {language === "en" ? "Vehicle & Location" : "Xe & Vị trí đỗ"}
                        </h4>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "License Plate:" : "Biển số:"}</span>
                            <span className="font-black tracking-wider text-slate-900 dark:text-white">{selectedBooking.plate_number}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "Type:" : "Loại xe:"}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBooking.vehicleType === "car" ? (language === "en" ? "Car" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "Zone / Slot:" : "Khu vực / Vị trí:"}</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-right">
                              {selectedBooking.status === "active" || selectedBooking.status === "completed"
                                ? `${selectedBooking.zoneName}${selectedBooking.floorNumber ? ` · Tầng ${selectedBooking.floorNumber}` : ""}`
                                : (selectedBooking.slotName || (language === "en" ? "Assigned at Check-in" : "Chỉ định lúc Check-in"))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="space-y-4">
                      {/* Booking times & fees */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                          <Clock size={13} /> {language === "en" ? "Schedule & Fees" : "Lịch hẹn & Phí"}
                        </h4>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "Booked at:" : "Đặt lúc:"}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatFullDateTime(selectedBooking.bookingTime)}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "Arrival:" : "Vào bãi dự kiến:"}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {formatFullDateTime(selectedBooking.startTime)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">{language === "en" ? "Departure:" : "Ra bãi dự kiến:"}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {formatFullDateTime(selectedBooking.endTime)}
                            </span>
                          </div>
                          {selectedBooking.actualCheckIn && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400">{language === "en" ? "Check-in:" : "Vào thực tế:"}</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatFullDateTime(selectedBooking.actualCheckIn)}
                              </span>
                            </div>
                          )}
                          {selectedBooking.actualCheckOut && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-400">{language === "en" ? "Check-out:" : "Ra thực tế:"}</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatFullDateTime(selectedBooking.actualCheckOut)}
                              </span>
                            </div>
                          )}

                          {/* Fee breakdown */}
                          {(() => {
                            const isCompleted = selectedBooking.status === "completed";
                            const reservationFee = isCompleted
                              ? Math.max(0, selectedBooking.depositPaid - (selectedBooking.earlyFee || 0) - (selectedBooking.penaltyFee || 0))
                              : selectedBooking.depositPaid;
                            const earlyFee = selectedBooking.earlyFee || 0;
                            const penaltyFee = selectedBooking.penaltyFee || 0;
                            const totalCost = reservationFee + earlyFee + penaltyFee;
                            const amountDue = isCompleted ? 0 : (earlyFee + penaltyFee);
                            const totalPaid = isCompleted ? totalCost : selectedBooking.depositPaid;
                            const payMethod = selectedBooking.paymentMethod || "Paid";

                            return (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                                {/* Reservation Fee */}
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400">
                                    {language === "en" ? "Reservation fee:" : "Phí đặt cọc:"}
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 ml-1.5 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 rounded">
                                      {payMethod}
                                    </span>
                                  </span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{reservationFee.toLocaleString()}đ</span>
                                </div>

                                {/* Early Arrival Fee */}
                                {earlyFee > 0 && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">
                                      {language === "en" ? "Arrival Early fee:" : "Phí đến sớm:"}
                                      <span className="text-[9px] font-bold text-slate-500 ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                        {language === "en" ? "Cash" : "Tiền mặt"}
                                      </span>
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{earlyFee.toLocaleString()}đ</span>
                                  </div>
                                )}

                                {/* Overdue Penalty Fee */}
                                {penaltyFee > 0 && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">
                                      {language === "en" ? "Overdue Penalty fee:" : "Phí phạt quá giờ:"}
                                      <span className="text-[9px] font-bold text-slate-500 ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                        {language === "en" ? "Cash" : "Tiền mặt"}
                                      </span>
                                    </span>
                                    <span className="font-black text-slate-700">{penaltyFee.toLocaleString()}đ</span>
                                  </div>
                                )}

                                {/* Total Cost */}
                                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800 text-xs">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {language === "en" ? "Total cost:" : "Tổng chi phí:"}
                                  </span>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {totalCost.toLocaleString()}đ
                                  </span>
                                </div>

                                {/* Total Paid */}
                                <div className="flex justify-between text-xs">
                                  <span className="font-bold text-slate-800 dark:text-white">
                                    {language === "en" ? "Total paid:" : "Tổng đã thanh toán:"}
                                  </span>
                                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 ">
                                    {totalPaid.toLocaleString()}đ
                                  </span>
                                </div>

                                {/* Amount Due at Exit */}
                                {amountDue > 0 && (
                                  <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800 text-xs  ">
                                    <span className="font-extrabold text-amber-800 dark:text-amber-400">
                                      {language === "en" ? "Total due:" : "Tổng còn thiếu:"}
                                    </span>
                                    <span className="font-extrabold text-amber-800 dark:text-amber-400 text-sm">
                                      {amountDue.toLocaleString()}đ
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smart Lock Status Panel — only for active bookings */}
                  {selectedBooking.status === "active" && (
                    <div className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center gap-4 ${isCurrentlyLocked(selectedBooking)
                      ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30"
                      : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                      }`}>
                      {/* Icon */}
                      <div className={`p-3 rounded-xl shrink-0 ${isCurrentlyLocked(selectedBooking)
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        }`}>
                        {isCurrentlyLocked(selectedBooking) ? <Lock size={20} /> : <Unlock size={20} />}
                      </div>

                      {/* Text + countdown */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm mb-0.5 ${isCurrentlyLocked(selectedBooking)
                          ? "text-red-700 dark:text-red-400"
                          : "text-emerald-700 dark:text-emerald-400"
                          }`}>
                          {isCurrentlyLocked(selectedBooking)
                            ? (language === "en" ? "Slot Locked" : "Vị trí đang khóa")
                            : (language === "en" ? "Slot Unlocked" : "Vị trí đã mở khóa")}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isCurrentlyLocked(selectedBooking)
                            ? (language === "en" ? "Auto-unlocks 5 min before your checkout time." : "Tự động mở khóa 5 phút trước giờ checkout.")
                            : (language === "en" ? "Your vehicle can exit freely." : "Xe có thể ra khỏi bãi tự do.")}
                        </p>
                        {/* Countdown timer: shown as long as active booking has not reached auto-unlock time */}
                        {selectedBooking.endTime && (() => {
                          const endMs = new Date(selectedBooking.endTime).getTime();
                          const unlockMs = endMs - 5 * 60 * 1000;
                          const diff = unlockMs - currentTime;
                          if (diff <= 0) return null;
                          const hh = Math.floor(diff / 3600000);
                          const mm = Math.floor((diff % 3600000) / 60000);
                          const ss = Math.floor((diff % 60000) / 1000);
                          const pad = (n) => String(n).padStart(2, "0");
                          return (
                            <div className="mt-2 inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/40 px-3 py-1.5 rounded-lg">
                              <Clock size={12} className="text-slate-500 shrink-0" />
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                {language === "en" ? "Remaining time" : "Thời gian còn lại"}
                              </span>
                              <span className="text-sm font-black text-slate-600 dark:text-slate-400 font-sans tabular-nums">
                                {`${pad(hh)}:${pad(mm)}:${pad(ss)}`}
                              </span>
                            </div>
                          );
                        })()}
                      </div>


                    </div>
                  )}

                  {/* Actions row */}
                  <div className="flex flex-wrap justify-end items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {/* Pay button if unpaid */}
                    {selectedBooking.status !== "confirmed" && selectedBooking.status !== "active" && selectedBooking.status !== "completed" && selectedBooking.status !== "cancelled" && (
                      <button
                        onClick={() => { closeModal(); setTimeout(() => openModal("payBooking", selectedBooking), 100); }}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition"
                      >
                        <CreditCard size={13} className="inline mr-1" />
                        {language === "en" ? "Pay Now" : "Thanh toán"}
                      </button>
                    )}

                    {/* Cancel if allowed */}
                    {(selectedBooking.status === "confirmed" || selectedBooking.status === "pending") && (() => {
                      const canCancel = new Date(selectedBooking.startTime).getTime() - new Date().getTime() >= 60 * 60 * 1000;
                      return (
                        <button
                          disabled={!canCancel}
                          onClick={() => { closeModal(); setTimeout(() => openModal("cancel", selectedBooking), 100); }}
                          className={`font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition ${canCancel ? "text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20" : "text-slate-400 bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
                            }`}
                        >
                          <AlertTriangle size={13} />
                          {canCancel ? (language === "en" ? "Cancel Booking" : "Hủy đặt chỗ") : (language === "en" ? "Cannot Cancel" : "Không thể hủy")}
                        </button>
                      );
                    })()}

                    {/* Lock / Unlock for active bookings */}
                    {selectedBooking.status === "active" && (
                      isCurrentlyLocked(selectedBooking) ? (
                        <button
                          onClick={() => { closeModal(); setTimeout(() => openModal("unlockConfirm", selectedBooking), 100); }}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition"
                        >
                          <Unlock size={13} /> {language === "en" ? "Unlock Vehicle" : "Mở khóa xe"}
                        </button>
                      ) : (
                        <button
                          onClick={() => { closeModal(); setTimeout(() => openModal("lockConfirm", selectedBooking), 100); }}
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition"
                        >
                          <Lock size={13} /> {language === "en" ? "Lock Vehicle" : "Khóa bảo vệ xe"}
                        </button>
                      )
                    )}

                    <button onClick={closeModal} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition">
                      {language === "en" ? "Close" : "Đóng"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Complete Payment */}
            {activeModal === "payBooking" && (
              <div className="p-6 md:p-8 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
                  <CreditCard size={24} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-1">
                  {language === "en" ? "Complete Payment" : "Hoàn tất thanh toán"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-5">
                  {language === "en"
                    ? "Choose your payment method to confirm reservation deposit."
                    : "Chọn phương thức thanh toán để xác nhận tiền cọc đặt chỗ."}
                </p>

                {/* Options */}
                <div className="space-y-3 mb-6 text-left">
                  {/* PayOS VietQR Option */}
                  <div
                    onClick={() => setPaymentMethod("PAYOS")}
                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-4 ${paymentMethod === "PAYOS"
                      ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-lg shadow-blue-500/10"
                      : "border-slate-200 dark:border-slate-800 bg-transparent hover:border-slate-350 dark:hover:border-slate-700"
                      }`}
                  >
                    <div className={`p-3 rounded-xl ${paymentMethod === "PAYOS" ? "bg-blue-500/10 text-blue-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                      <QrCode size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">
                        {language === "en" ? "PayOS VietQR" : "Cổng PayOS (Quét QR)"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === "en" ? "Instant checkout using any banking app" : "Thanh toán ngay bằng app ngân hàng"}
                      </p>
                    </div>
                  </div>

                  {/* VNPAY Mock Option */}
                  <div
                    onClick={() => setPaymentMethod("VNPAY")}
                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-4 ${paymentMethod === "VNPAY"
                      ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-lg shadow-blue-500/10"
                      : "border-slate-200 dark:border-slate-800 bg-transparent hover:border-slate-350 dark:hover:border-slate-700"
                      }`}
                  >
                    <div className={`p-3 rounded-xl ${paymentMethod === "VNPAY" ? "bg-blue-500/10 text-blue-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">
                        {language === "en" ? "VNPAY (Mock)" : "VNPAY Giả lập (Nhanh)"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === "en" ? "Instant simulated successful payment" : "Mô phỏng thanh toán thành công tức thì"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    {language === "en" ? "Go Back" : "Quay lại"}
                  </button>
                  <button
                    disabled={processingPayment}
                    onClick={paymentMethod === "PAYOS" ? handlePayOsPayment : handleConfirmMockPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {processingPayment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {language === "en" ? "Processing..." : "Đang xử lý..."}
                      </>
                    ) : (
                      language === "en" ? "Pay Now" : "Thanh toán ngay"
                    )}
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
