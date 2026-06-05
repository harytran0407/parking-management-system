import React, { useState, useEffect, useMemo } from "react";
import {ArrowLeft,Car,Bike,QrCode,Clock,Edit,Ban,CreditCard,AlertTriangle,CheckCircle2,Info,Calendar,MapPin,CheckCircle,X,Search,Filter,Hash,} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyBookings() {
  const navigate = useNavigate();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [stats, setStats] = useState({
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

  // Modal Controllers
  const [activeModal, setActiveModal] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelCountdown, setCancelCountdown] = useState(5);
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
  const openModal = (type, booking) => {
    setSelectedBooking(booking);
    setActiveModal(type);
    if (type === "cancel") setCancelCountdown(5);
    if (type === "adjust") {
      setAdjustTimeData({
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
      setNewPrice(booking.totalPrice);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedBooking(null);
  };

  const handleConfirmCancel = async () => {
    try {
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
    }
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            </select>
          </div>
        </div>

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
                    disabled={cancelCountdown > 0}
                    onClick={handleConfirmCancel}
                    className={`flex-1 font-bold py-3 rounded-xl transition-all text-sm shadow-md ${cancelCountdown > 0 ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"}`}
                  >
                    {cancelCountdown > 0
                      ? `Confirm (${cancelCountdown}s)`
                      : "Confirm Cancel"}
                  </button>
                </div>
              </div>
            )}

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
