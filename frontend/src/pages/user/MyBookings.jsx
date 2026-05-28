import React, { useState, useEffect } from "react";
import {ArrowLeft,Car,Bike,QrCode,Clock,Edit, Ban,CreditCard,AlertTriangle,CheckCircle2, Info,Calendar,MapPin,CheckCircle, X,Search,Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyBookings() {
  const navigate = useNavigate();
  // ==========================================
  // [API INTEGRATION] - FETCH SUMMARY STATS
  // Sau này gọi API: axios.get('/api/v1/user/bookings/stats').then(...)
  // ==========================================
  const [stats, setStats] = useState({
    totalBookings: 42,
    thisMonthNew: 5,
    activeSessions: 2,
    totalCost: 1250000,
  });
  // ==========================================
  // [API INTEGRATION] - FETCH BOOKING HISTORY
  // Sau này thay bằng: axios.get('/api/v1/user/bookings/history?page=1').then(...)
  // ==========================================
  const [bookingHistory, setBookingHistory] = useState([
    {
      id: "#SP-12845",
      location: "Slot S12 - Basement B1",
      date: "20/05/2023",
      time: "08:00 - 17:30",
      fee: 85000,
      status: "completed",
    },
    {
      id: "#SP-12733",
      location: "Slot S05 - Basement B2",
      date: "18/05/2023",
      time: "09:00 - 11:00",
      fee: 25000,
      status: "cancelled",
    },
    {
      id: "#SP-12601",
      location: "Slot S40 - Floor 1 (VIP)",
      date: "15/05/2023",
      time: "14:00 - 20:00",
      fee: 120000,
      status: "completed",
    },
    {
      id: "#SP-12588",
      location: "Slot S18 - Basement B1",
      date: "12/05/2023",
      time: "18:00 - 22:00",
      fee: 40000,
      status: "completed",
    },
  ]);
  // ==========================================
  // [API INTEGRATION] - FETCH BOOKINGS
  // Replace this mock data with an API call: axios.get('/api/user/bookings').then(...)
  // ==========================================
  const [bookings, setBookings] = useState([
    {
      id: "BKG-9823",
      slotId: "S15",
      floorName: "Basement B1",
      vehicleType: "car",
      startTime: "2026-05-20T08:00",
      endTime: "2026-05-20T17:00",
      totalPrice: 180000,
      depositPaid: 10000,
      remainingBalance: 170000,
      status: "active", // 'active', 'paid', 'cancelled'
      qrCodeData: "Ticket_Valid_S15",
    },
    {
      id: "BKG-1045",
      slotId: "S42",
      floorName: "Floor 1 (VIP)",
      vehicleType: "motorbike",
      startTime: "2026-05-21T09:00",
      endTime: "2026-05-21T12:00",
      totalPrice: 15000,
      depositPaid: 10000,
      remainingBalance: 5000,
      status: "active",
      qrCodeData: "Ticket_Valid_S42",
    },
  ]);

  // Modal State Management
  const [activeModal, setActiveModal] = useState(null); // 'qr', 'cancel', 'adjust', 'pay'
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Specific States for Modals
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const [adjustTimeData, setAdjustTimeData] = useState({
    startTime: "",
    endTime: "",
  });
  const [newPrice, setNewPrice] = useState(0);

  // ==========================================
  // LOGIC: CANCEL COUNTDOWN (5 seconds)
  // ==========================================
  useEffect(() => {
    let timer;
    if (activeModal === "cancel" && cancelCountdown > 0) {
      timer = setInterval(() => {
        setCancelCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeModal, cancelCountdown]);

  // ==========================================
  // LOGIC: DYNAMIC PRICING FOR ADJUSTMENT
  // ==========================================
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
  // HANDLERS FOR MODALS & API CALLS
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

  // [API INTEGRATION] - Cancel Booking: axios.post(`/api/bookings/${selectedBooking.id}/cancel`)
  const handleConfirmCancel = () => {
    setBookings(
      bookings.map((b) =>
        b.id === selectedBooking.id ? { ...b, status: "cancelled" } : b,
      ),
    );
    closeModal();
  };

  // [API INTEGRATION] - Adjust Time: axios.put(`/api/bookings/${selectedBooking.id}`, { startTime, endTime })
  const handleConfirmAdjust = () => {
    setBookings(
      bookings.map((b) => {
        if (b.id === selectedBooking.id) {
          return {
            ...b,
            startTime: adjustTimeData.startTime,
            endTime: adjustTimeData.endTime,
            totalPrice: newPrice,
            remainingBalance: newPrice - b.depositPaid,
          };
        }
        return b;
      }),
    );
    closeModal();
  };

  // [API INTEGRATION] - Pay Balance: axios.post(`/api/bookings/${selectedBooking.id}/pay`)
  const handleConfirmPay = () => {
    setBookings(
      bookings.map((b) =>
        b.id === selectedBooking.id
          ? { ...b, status: "paid", remainingBalance: 0 }
          : b,
      ),
    );
    closeModal();
  };

  // Helper function to format date
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
      {/* Header */}
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

      {/* ==========================================
          (SUMMARY CARDS)
          ========================================== */}
      {/* ==========================================
          (SUMMARY CARDS)
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Total Bookings
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
              {stats.totalBookings}
            </h3>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2.5 py-1 rounded-full">
              This month: +{stats.thisMonthNew}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Active Sessions
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
              0{stats.activeSessions}
            </h3>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full">
              In Lot
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Total Cost (VND)
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
              {stats.totalCost.toLocaleString()}
            </h3>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400 px-2.5 py-1 rounded-full">
              Accumulated
            </span>
          </div>
        </div>
      </div>

      {/* Booking List */}
      {/* Booking List */}
      <div className="shrink-0 mb-8 space-y-4">
        
        {bookings.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Calendar
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <p className="text-slate-500 dark:text-slate-400">
              You have no bookings yet.
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center"
            >
              {/* Left: Icon & Status */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center gap-3">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${booking.vehicleType === "car" ? "bg-blue-600" : "bg-emerald-600"}`}
                >
                  {booking.vehicleType === "car" ? (
                    <Car size={32} />
                  ) : (
                    <Bike size={32} />
                  )}
                </div>
                {booking.status === "active" && (
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Active
                  </span>
                )}
                {booking.status === "paid" && (
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Paid
                  </span>
                )}
                {booking.status === "cancelled" && (
                  <span className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Cancelled
                  </span>
                )}
              </div>

              {/* Middle: Details */}
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      Slot {booking.slotId}
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {booking.id}
                      </span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {booking.floorName} (
                      {booking.vehicleType.toUpperCase()})
                    </p>
                  </div>

                  {/* Show QR Button (Always visible unless cancelled) */}
                  {booking.status !== "cancelled" && (
                    <button
                      onClick={() => openModal("qr", booking)}
                      className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                      <QrCode size={18} /> Show Ticket
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">
                      Entry Time
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {formatDate(booking.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">
                      Exit Time
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {formatDate(booking.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Pricing & Actions */}
              <div className="w-full md:w-auto md:min-w-[200px] flex flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                <div className="text-right mb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Remaining Balance
                  </p>
                  <p
                    className={`text-2xl font-black ${booking.status === "paid" ? "text-emerald-500" : "text-slate-800 dark:text-white"}`}
                  >
                    {booking.remainingBalance.toLocaleString()}{" "}
                    <span className="text-sm">VND</span>
                  </p>
                </div>

                {/* Actions: Only show if Active */}
                {booking.status === "active" && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => openModal("pay", booking)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                    >
                      <CreditCard size={16} /> Pay Online
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openModal("adjust", booking)}
                        className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
                      >
                        <Edit size={14} /> Adjust
                      </button>
                      <button
                        onClick={() => openModal("cancel", booking)}
                        className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
                      >
                        <Ban size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
                {booking.status === "paid" && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium p-3 rounded-xl text-center flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Paid in Full
                  </div>
                )}
                {booking.status === "cancelled" && (
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm font-medium p-3 rounded-xl text-center">
                    Booking Cancelled
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==========================================
          BOOKING HISTORY TABLE
          ========================================== */}
      <div className="shrink-0 mt-8 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Booking History
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search booking ID..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 transition">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Fee (VND)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bookingHistory.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-300">
                      {item.id}
                    </td>
                    <td className="px-6 py-4">{item.location}</td>
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4">{item.time}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      {item.fee.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.status === "completed" ? (
                        <span className="inline-block bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs font-semibold">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-block bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-md text-xs font-semibold">
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing 1-4 of {stats.totalBookings} bookings
            </span>
            <div className="flex gap-1">
              <button className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors rounded text-sm disabled:opacity-50">
                Prev
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded text-sm shadow-sm">
                1
              </button>
              <button className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors rounded text-sm">
                2
              </button>
              <button className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors rounded text-sm">
                3
              </button>
              <button className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors rounded text-sm">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ==========================================
          MODALS
          ========================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
            {/* Modal: SHOW QR TICKET */}
            {activeModal === "qr" && (
              <div className="p-8 text-center">
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2">
                  E-Ticket: Slot {selectedBooking.slotId}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Booking ID: {selectedBooking.id}
                </p>

                <div className="bg-white p-4 rounded-2xl inline-block border-4 border-slate-800 mb-4 shadow-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedBooking.qrCodeData}`}
                    alt="Ticket QR"
                    className="w-48 h-48"
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 mb-6 text-left flex gap-3 items-start">
                  <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                    Note: Please show this QR code to the security staff when
                    entering and exiting the station.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
                >
                  OK
                </button>
              </div>
            )}

            {/* Modal: CANCEL BOOKING */}
            {activeModal === "cancel" && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2">
                  Cancel Booking?
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                  Are you sure you want to cancel the booking for{" "}
                  <span className="font-bold">
                    Slot {selectedBooking.slotId}
                  </span>
                  ?
                </p>
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    Penalty Notice:
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    Your deposit fee of{" "}
                    {selectedBooking.depositPaid.toLocaleString()} VND will{" "}
                    <span className="underline">NOT</span> be refunded if you
                    cancel.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    disabled={cancelCountdown > 0}
                    onClick={handleConfirmCancel}
                    className={`flex-1 font-bold py-3.5 rounded-xl transition-all shadow-lg ${cancelCountdown > 0 ? "bg-red-300 cursor-not-allowed text-white/70" : "bg-red-600 hover:bg-red-700 text-white shadow-red-500/30"}`}
                  >
                    {cancelCountdown > 0
                      ? `Confirm (${cancelCountdown}s)`
                      : "Confirm Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* Modal: ADJUST TIME */}
            {activeModal === "adjust" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 dark:text-white text-xl">
                    Adjust Booking Time
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                      <Clock size={16} /> New Entry Time:
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
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                      <Clock size={16} /> New Exit Time:
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
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 mb-6 border border-blue-100 dark:border-blue-500/20">
                  <div className="flex justify-between items-center mb-1 text-sm text-slate-600 dark:text-slate-400">
                    <span>New Total Fee:</span>
                    <span>{newPrice.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>Deposit Paid:</span>
                    <span>
                      - {selectedBooking.depositPaid.toLocaleString()} VND
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-500/20">
                    <span className="text-blue-800 dark:text-blue-300 font-bold">
                      New Balance:
                    </span>
                    <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                      {(newPrice - selectedBooking.depositPaid > 0
                        ? newPrice - selectedBooking.depositPaid
                        : 0
                      ).toLocaleString()}{" "}
                      VND
                    </span>
                  </div>
                </div>
                <button
                  disabled={newPrice <= 0}
                  onClick={handleConfirmAdjust}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            )}

            {/* Modal: PAY ONLINE */}
            {activeModal === "pay" && (
              <div className="p-8 text-center">
                <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2">
                  Pay Remaining Balance
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  Note: Once paid, you cannot cancel or adjust this booking.
                </p>
                <div className="bg-white p-4 rounded-2xl inline-block border-2 border-slate-200 mb-4 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Pay_${selectedBooking.remainingBalance}_Slot_${selectedBooking.slotId}`}
                    alt="Banking QR"
                    className="w-48 h-48"
                  />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-6">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Amount:{" "}
                    <span className="text-emerald-500 font-bold text-lg">
                      {selectedBooking.remainingBalance.toLocaleString()} VND
                    </span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPay}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30"
                  >
                    I have paid
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
