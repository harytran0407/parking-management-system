import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Car,
  Bike,
  QrCode,
  Clock,
  Edit,
  Ban,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  MapPin,
  CheckCircle,
  X,
  Search,
  Hash,
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
    thisMonthNew: 0,
    activeSessions: 0,
    totalCost: 0,
  });

  const [bookingHistory, setBookingHistory] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Search & Filter Client States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'completed' | 'cancelled'

  // Modal Controllers
  const [activeModal, setActiveModal] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const [adjustTimeData, setAdjustTimeData] = useState({
    startTime: "",
    endTime: "",
  });
  const [adjustError, setAdjustError] = useState("");
  const [newPrice, setNewPrice] = useState(0);

  // Load dashboard, active and history bookings
  const loadBookingDashboard = async () => {
    try {
      const statsRes = await api.get("/bookings/stats");
      if (statsRes.data && statsRes.data.success) {
        const rawStats = statsRes.data.data;
        setStats({
          totalBookings: rawStats.total_bookings ?? 0,
          thisMonthNew: rawStats.this_month_new ?? 0,
          activeSessions: rawStats.active_sessions ?? 0,
          totalCost: rawStats.total_cost ?? 0
        });
      }

      const activeRes = await api.get("/bookings/active");
      if (activeRes.data && activeRes.data.success) {
        const list = activeRes.data.data.map(b => {
          const isCar = b.vehicle_type !== "Motorbike";
          const defaultPrice = isCar ? 15000 : 5000;
          return {
            id: b.booking_id,
            slotId: b.slot_id || "N/A",
            slotName: b.slot_name || (language === "en" ? "Assigned at Check-in" : "Chỉ định lúc Check-in"),
            floorName: b.floor_name || "TBD",
            vehicleType: isCar ? "car" : "motorbike",
            plate_number: b.vehicle_plate_number,
            startTime: b.expected_arrival,
            endTime: b.expired_at,
            totalPrice: b.estimated_fee || b.deposit_paid || defaultPrice,
            depositPaid: b.deposit_paid || defaultPrice,
            remainingBalance: (b.status?.toLowerCase() === "pending" || b.status?.toLowerCase() === "confirmed")
              ? 0
              : Math.max(0, (b.estimated_fee || 0) - (b.deposit_paid || 0)),
            status: b.status.toLowerCase(),
            qrCodeData: b.qr_code_data
          };
        });
        setBookings(list);
      }

      const historyRes = await api.get("/bookings/history");
      if (historyRes.data && historyRes.data.success) {
        const list = historyRes.data.data.map(b => {
          const isCar = b.vehicle_type !== "Motorbike";
          const defaultPrice = isCar ? 15000 : 5000;
          return {
            id: b.booking_id,
            location: b.slot_id
              ? `${language === "en" ? "Slot" : "Vị trí"} ${b.slot_name || b.slot_id} - ${b.floor_name || "TBD"}`
              : `${language === "en" ? "Assigned at Check-in" : "Chỉ định lúc Check-in"}`,
            plate_number: b.vehicle_plate_number,
            date: b.booking_time ? b.booking_time.substring(0, 10) : "",
            time: formatTimeOnly(b.expected_arrival),
            fee: b.estimated_fee || b.deposit_paid || defaultPrice,
            status: b.status.toLowerCase(),
          };
        });
        setBookingHistory(list);
      }
    } catch (error) {
      console.error("Lỗi đồng bộ API lịch sử đặt chỗ:", error);
    }
  };

  useEffect(() => {
    loadBookingDashboard();
  }, []);

  const formatTimeOnly = (dtString) => {
    if (!dtString) return "";
    try {
      const date = new Date(dtString);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch (e) {
      return "";
    }
  };

  // LOGIC: ĐẾM NGƯỢC 5S KHÓA NÚT HUỶ
  useEffect(() => {
    let timer;
    if (activeModal === "cancel" && cancelCountdown > 0) {
      timer = setInterval(() => setCancelCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeModal, cancelCountdown]);

  // LOGIC: TÍNH LẠI TIỀN ĐỘNG KHI THAY ĐỔI KHUNG GIỜ (TRONG MODAL ADJUST)
  useEffect(() => {
    if (
      activeModal === "adjust" &&
      adjustTimeData.startTime &&
      selectedBooking
    ) {
      const start = new Date(adjustTimeData.startTime).getTime();
      const now = new Date().getTime();

      let error = "";
      if (start < now - 10 * 60 * 1000) {
        error = language === "en" ? "Entry time cannot be in the past." : "Thời gian vào không được ở quá khứ.";
      }
      setAdjustError(error);
      setNewPrice(selectedBooking.depositPaid || (selectedBooking.vehicleType === "car" ? 15000 : 5000));
    }
  }, [adjustTimeData.startTime, activeModal, selectedBooking]);

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

  const openModal = (type, booking) => {
    setSelectedBooking(booking);
    setActiveModal(type);
    if (type === "cancel") setCancelCountdown(5);
    if (type === "adjust") {
      // format datetime local
      const pad = (n) => n.toString().padStart(2, '0');
      const toLocalISO = (dString) => {
        if (!dString) return "";
        const d = new Date(dString);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setAdjustTimeData({
        startTime: toLocalISO(booking.startTime),
        endTime: "",
      });
      setAdjustError("");
      setNewPrice(booking.totalPrice);
    }
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

  const handleConfirmAdjust = async () => {
    try {
      const payload = {
        expected_arrival: new Date(adjustTimeData.startTime).toISOString(),
        expired_at: null,
      };
      const response = await api.put(`/bookings/${selectedBooking.id}/adjust`, payload);
      if (response.data && response.data.success) {
        await loadBookingDashboard();
        closeModal();
      }
    } catch (error) {
      console.error("Lỗi điều chỉnh giờ:", error);
      alert(error.response?.data?.message || (language === "en" ? "Failed to adjust booking schedule." : "Điều chỉnh lịch đặt thất bại."));
    }
  };

  const handleConfirmPay = async () => {
    try {
      const response = await api.put(`/bookings/${selectedBooking.id}/pay`);
      if (response.data && response.data.success) {
        await loadBookingDashboard();
        closeModal();
      }
    } catch (error) {
      console.error("Lỗi xử lý thanh toán:", error);
      alert(error.response?.data?.message || (language === "en" ? "Failed to complete payment." : "Thanh toán thất bại."));
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
          {language === "en" ? "My Bookings" : "Lịch đặt của tôi"}
        </h2>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-semibold mb-2">
            {language === "en" ? "Total Sessions" : "Tổng lượt đặt"}
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
              {stats.totalBookings}
            </h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2.5 py-1 rounded-full">
              {language === "en" ? `This month: +${stats.thisMonthNew}` : `Tháng này: +${stats.thisMonthNew}`}
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-semibold mb-2">
            {language === "en" ? "Active Parking" : "Đang đỗ xe"}
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
              {stats.activeSessions}
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full animate-pulse">
              ● {language === "en" ? "In Lot" : "Trong bãi"}
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-400 font-semibold mb-2">
            {language === "en" ? "Total Expended" : "Tổng chi tiêu"}
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
              {stats.totalCost.toLocaleString()}đ
            </h3>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400 px-2.5 py-1 rounded-full">
              {language === "en" ? "Accumulated" : "Tích lũy"}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE/UPCOMING BOOKINGS LIST */}
      <div className="shrink-0 mb-8 space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Calendar
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {language === "en" ? "You have no active booking sessions." : "Bạn không có lượt đặt chỗ nào đang hoạt động."}
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center transition-all duration-300"
            >
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
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${booking.status === "confirmed" || booking.status === "pending" || booking.status === "active"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      : booking.status === "completed"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                    }`}
                >
                  {getStatusLabel(booking.status)}
                </span>
              </div>

              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex flex-wrap items-center gap-2">
                      {booking.slotId && booking.slotId !== "N/A"
                        ? `${language === "en" ? "Slot" : "Vị trí"} ${booking.slotName || booking.slotId}`
                        : (language === "en" ? "Assigned at Check-in" : "Chỉ định lúc Check-in")}
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Hash size={12} />
                        {booking.id}
                      </span>
                      <span className="text-xs font-mono font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-0.5 rounded-md tracking-wide">
                        {booking.plate_number}
                      </span>
                    </h3>
                    {booking.slotId && booking.slotId !== "N/A" && (
                      <p className="text-slate-450 dark:text-slate-500 text-xs font-bold flex items-center gap-1 mt-1.5 uppercase tracking-wider">
                        <MapPin size={13} className="text-blue-500" />{" "}
                        {booking.floorName}
                      </p>
                    )}
                  </div>

                  {booking.status !== "cancelled" && (
                    <button
                      onClick={() => openModal("qr", booking)}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <QrCode size={16} /> {language === "en" ? "Show Ticket" : "Xem vé"}
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 font-medium">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5">
                      {language === "en" ? "Expected Entry Time" : "Thời gian vào dự kiến"}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold font-mono">
                      {formatDate(booking.startTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto md:min-w-[180px] flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-right">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    {language === "en" ? "Remaining Balance" : "Số dư còn lại"}
                  </p>
                  <p
                    className={`text-2xl font-black font-mono tracking-tight ${booking.status === "completed" ? "text-emerald-500" : "text-slate-800 dark:text-white"}`}
                  >
                    {booking.remainingBalance.toLocaleString()}{" "}
                    <span className="text-xs font-sans font-bold">VND</span>
                  </p>
                </div>

                {(booking.status === "confirmed" || booking.status === "pending") && (
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => openModal("pay", booking)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <CreditCard size={14} /> {language === "en" ? "Pay" : "Thanh toán"}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openModal("adjust", booking)}
                        className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Edit size={12} /> {language === "en" ? "Adjust" : "Điều chỉnh"}
                      </button>
                      <button
                        onClick={() => openModal("cancel", booking)}
                        className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Ban size={12} /> {language === "en" ? "Cancel" : "Hủy"}
                      </button>
                    </div>
                  </div>
                )}
                {booking.status === "completed" && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold p-2.5 rounded-xl flex items-center justify-center gap-1.5">
                    <CheckCircle size={14} /> {language === "en" ? "Paid in Full" : "Đã thanh toán"}
                  </div>
                )}
                {booking.status === "cancelled" && (
                  <div className="bg-slate-50 dark:bg-slate-800 text-slate-400 text-xs font-bold p-2.5 rounded-xl text-center">
                    {language === "en" ? "Session Cancelled" : "Đã hủy phiên"}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* HISTORICAL BOOKINGS TABLE */}
      <div className="shrink-0 mt-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {language === "en" ? "Booking History" : "Lịch sử đặt chỗ"}
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "en" ? "Search ID, Plate or Slot..." : "Tìm ID, biển số hoặc vị trí..."}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white text-slate-800 dark:bg-slate-900 dark:text-white font-medium"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="all">{language === "en" ? "All Status" : "Tất cả trạng thái"}</option>
              <option value="completed">{language === "en" ? "Completed" : "Hoàn thành"}</option>
              <option value="cancelled">{language === "en" ? "Cancelled" : "Đã hủy"}</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs uppercase text-slate-400 dark:text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 tracking-wider">
                <tr>
                  <th className="px-6 py-4">{language === "en" ? "Plate Number" : "Biển số xe"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Location" : "Vị trí"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Date" : "Ngày"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Entry Time" : "Giờ vào"}</th>
                  <th className="px-6 py-4 text-right">{language === "en" ? "Fee Paid" : "Phí thanh toán"}</th>
                  <th className="px-6 py-4 text-center">{language === "en" ? "Status" : "Trạng thái"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredBookingHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      {language === "en" ? "No matching historical records found." : "Không tìm thấy lịch sử đặt chỗ tương ứng."}
                    </td>
                  </tr>
                ) : (
                  filteredBookingHistory.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
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
                          {getStatusLabel(item.status).toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500">
            <span>
              {language === "en"
                ? `Showing 1-${filteredBookingHistory.length} of ${filteredBookingHistory.length} items`
                : `Hiển thị 1-${filteredBookingHistory.length} trong tổng số ${filteredBookingHistory.length} mục`}
            </span>
            <div className="flex gap-1">
              <button className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 transition-colors rounded-lg hover:bg-slate-100">
                {language === "en" ? "Prev" : "Trước"}
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded-lg shadow-sm">
                1
              </button>
              <button className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 transition-colors rounded-lg hover:bg-slate-100">
                {language === "en" ? "Next" : "Sau"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS SYSTEM */}
      {activeModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col border border-slate-100 dark:border-slate-800">
            {activeModal === "qr" && (
              <div className="p-8 text-center relative">
                <button
                  onClick={closeModal}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-1 flex items-center justify-center gap-1.5">
                  <QrCode className="text-blue-500" size={22} /> {language === "en" ? "E-Ticket" : "Vé điện tử"}
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-mono font-bold mb-6">
                  ID: {selectedBooking.id} | {language === "en" ? "PLATE" : "BIỂN SỐ"}: {selectedBooking.plate_number}
                </p>

                <div className="bg-white p-4 rounded-2xl inline-block border-4 border-slate-800 mb-5 shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Ticket_Booking_${selectedBooking.id}_Plate_${selectedBooking.plate_number}`}
                    alt="Ticket QR"
                    className="w-44 h-44"
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 mb-6 text-left flex gap-2.5 items-start text-amber-700 dark:text-amber-400 text-xs font-medium leading-relaxed">
                  <Info className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <p>
                    {language === "en"
                      ? "Note: The gate camera will scan your license plate. Show this QR code to staff if needed."
                      : "Lưu ý: Camera tại cổng sẽ quét biển số xe của bạn. Hãy xuất trình mã QR này cho nhân viên khi được yêu cầu."}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all"
                >
                  {language === "en" ? "Close" : "Đóng"}
                </button>
              </div>
            )}

            {activeModal === "cancel" && (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2">
                  {language === "en" ? "Cancel Booking?" : "Hủy đặt chỗ?"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 font-medium">
                  {language === "en" ? "Are you sure to release reservation for " : "Bạn có chắc chắn muốn hủy đặt chỗ cho vị trí "}
                  <span className="font-black text-slate-700 dark:text-slate-200">
                    {selectedBooking.slotId && selectedBooking.slotId !== "N/A"
                      ? `${language === "en" ? "Slot" : "Vị trí"} ${selectedBooking.slotName || selectedBooking.slotId}`
                      : (selectedBooking.slotName || (language === "en" ? "Assigned at Check-in" : "Chỉ định lúc Check-in"))}
                  </span>
                  ?
                </p>

                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-3.5 mb-6 text-left">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    {language === "en" ? "Notice:" : "Lưu ý:"}
                  </p>
                  <p className="text-[11px] font-medium text-red-500 mt-1 leading-normal">
                    {language === "en"
                      ? `Your booking deposit of ${selectedBooking.depositPaid.toLocaleString()} VND is non-refundable if you cancel.`
                      : `Khoản tiền đặt cọc của bạn là ${selectedBooking.depositPaid.toLocaleString()} VND sẽ không được hoàn lại nếu bạn hủy bỏ.`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    {language === "en" ? "Go Back" : "Quay lại"}
                  </button>
                  <button
                    disabled={cancelCountdown > 0}
                    onClick={handleConfirmCancel}
                    className={`flex-1 font-bold py-3 rounded-xl transition-all text-sm shadow-md ${cancelCountdown > 0 ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"}`}
                  >
                    {cancelCountdown > 0
                      ? (language === "en" ? `Confirm (${cancelCountdown}s)` : `Xác nhận (${cancelCountdown}s)`)
                      : (language === "en" ? "Cancel Booking" : "Hủy đặt chỗ")}
                  </button>
                </div>
              </div>
            )}

            {activeModal === "adjust" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-1.5">
                    <Clock className="text-blue-500" size={18} /> {language === "en" ? "Change Schedule" : "Thay đổi giờ đặt"}
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
                      {language === "en" ? "New Expected Entry Time:" : "Giờ vào dự kiến mới:"}
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
                  {adjustError && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1.5">
                      ⚠️ {adjustError}
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-3.5 mb-6 border border-blue-100 dark:border-blue-900/30 text-xs font-semibold text-blue-800 dark:text-blue-300 leading-relaxed">
                  💡 {language === "en"
                    ? "Updating your expected entry time does not change your paid deposit. The final parking fee will be calculated when you leave the parking lot."
                    : "Cập nhật thời gian vào không làm thay đổi tiền cọc đã nộp. Phí gửi xe thực tế sẽ được tính toán khi bạn lấy xe ra khỏi bãi."}
                </div>
                <button
                  disabled={!!adjustError || !adjustTimeData.startTime}
                  onClick={handleConfirmAdjust}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 text-sm"
                >
                  {language === "en" ? "Save Changes" : "Lưu thay đổi"}
                </button>
              </div>
            )}

            {activeModal === "pay" && (
              <div className="p-8 text-center">
                <button
                  onClick={closeModal}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-1 flex items-center justify-center gap-1.5">
                  <CreditCard className="text-emerald-500" size={20} /> {language === "en" ? "Pay Remaining Fee" : "Thanh toán số dư"}
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mb-5">
                  {language === "en" ? "Scan QR code to pay the remaining balance." : "Quét mã QR để thanh toán phí còn lại."}
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
                    {language === "en" ? "Amount:" : "Số tiền:"}
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
                    {language === "en" ? "Go Back" : "Quay lại"}
                  </button>
                  <button
                    onClick={handleConfirmPay}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-md shadow-emerald-500/20"
                  >
                    {language === "en" ? "Confirm Paid" : "Xác nhận đã trả"}
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
