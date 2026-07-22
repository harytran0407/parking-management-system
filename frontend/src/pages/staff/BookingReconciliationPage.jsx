import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import {
  Search,
  User,
  Phone,
  Mail,
  Car,
  Clock,
  Calendar,
  RefreshCw,
  X,
  Info,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Camera,
  Maximize2,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

const t = {
  vi: {
    title: "Booking Record",
    subtitle: "Quản lý và đối chiếu thông tin đặt chỗ của khách hàng theo thời gian thực",
    placeholderSearch: "Tìm theo tên khách, số điện thoại, biển số xe...",
    btnRefresh: "Làm mới",
    noData: "Không tìm thấy thông tin đặt chỗ nào trùng khớp.",
    loading: "Đang tải danh sách đặt chỗ...",
    errorLoad: "Không thể tải danh sách đặt chỗ từ máy chủ.",
    colName: "Họ và tên",
    colPhone: "Số điện thoại",
    colEmail: "Email",
    colPlate: "Biển số xe",
    colType: "Loại xe",
    colTime: "Thời gian nhận & trả",
    colDuration: "Thời lượng",
    colStatus: "Trạng thái",
    statusPending: "Đang chờ",
    statusActive: "Đang đỗ",
    statusCompleted: "Đã trả xe",
    statusUnknown: "Không rõ",
    detailTitle: "Chi tiết đặt chỗ & Đối chiếu",
    detailCustomerGroup: "Thông tin khách hàng",
    detailVehicleGroup: "Thông tin xe & Vị trí",
    detailTripGroup: "Thông tin lịch hẹn",
    expectedArrival: "Thời gian nhận xe (dự kiến)",
    expectedDeparture: "Thời gian trả xe (dự kiến)",
    actualArrival: "Thời gian vào thực tế",
    actualDeparture: "Thời gian ra thực tế",
    amountPaid: "Giá tiền đã trả",
    depositLabel: "Tiền đặt chỗ",
    earlyFeeLabel: "Phí đỗ đến sớm",
    penaltyFeeLabel: "Phí phạt đỗ quá giờ",
    totalPaidLabel: "Tổng số tiền đã nộp",
    btnClose: "Đóng",
    page: "Trang",
    bookingTime: "Thời điểm đặt chỗ",
    assignedZone: "Khu vực đỗ xe",
    floorLabel: "Tầng",
    motorbike: "Xe máy",
    car: "Ô tô",
    tabPending: "Chờ đỗ (Pending)",
    tabActive: "Đang đỗ (Active)",
    tabCompleted: "Đã hoàn thành"
  },
  en: {
    title: "Booking Record",
    subtitle: "Manage and reconcile user booking details in real-time",
    placeholderSearch: "Search by customer name, phone, plate...",
    btnRefresh: "Refresh",
    noData: "No matching bookings found.",
    loading: "Loading bookings...",
    errorLoad: "Failed to load bookings from the server.",
    colName: "Full Name",
    colPhone: "Phone Number",
    colEmail: "Email",
    colPlate: "License Plate",
    colType: "Vehicle Type",
    colTime: "Arrival & Departure",
    colDuration: "Duration",
    colStatus: "Status",
    statusPending: "Pending",
    statusActive: "Active",
    statusCompleted: "Completed",
    statusUnknown: "Unknown",
    detailTitle: "Booking Details",
    detailCustomerGroup: "Customer",
    detailVehicleGroup: "Vehicle & Location",
    detailTripGroup: "Booking Details",
    expectedArrival: "Arrival Time",
    expectedDeparture: "Departure Time",
    actualArrival: "Check-in Time",
    actualDeparture: "Check-out Time",
    amountPaid: "Amount Paid",
    depositLabel: "Reservation Fee",
    earlyFeeLabel: "Early Arrival Fee",
    penaltyFeeLabel: "Overdue Penalty Fee",
    totalPaidLabel: "Total Amount Paid",
    btnClose: "Close",
    page: "Page",
    bookingTime: "Booking Time",
    assignedZone: "Assigned Zone",
    floorLabel: "Floor",
    motorbike: "Motorbike",
    car: "Car",
    tabPending: "Pending",
    tabActive: "Active",
    tabCompleted: "Completed"
  }
};

const formatDateTime = (dateVal, language = "vi") => {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const calculateDuration = (arrival, departure, language = "vi") => {
  if (!arrival || !departure) return "—";
  const start = new Date(arrival);
  const end = new Date(departure);
  const diffMs = end - start;
  if (isNaN(diffMs) || diffMs <= 0) return "—";

  const diffMins = Math.round(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (language === "vi") {
      let result = `${days} ngày`;
      if (remainingHours > 0) result += ` ${remainingHours} giờ`;
      if (mins > 0) result += ` ${mins} phút`;
      return result;
    } else {
      let result = `${days} day`;
      if (remainingHours > 0) result += ` ${remainingHours} hours`;
      if (mins > 0) result += ` ${mins} minutes`;
      return result;
    }
  }

  if (language === "vi") {
    let result = "";
    if (hours > 0) result += `${hours} giờ `;
    if (mins > 0) result += `${mins} phút`;
    return result.trim() || "0 phút";
  } else {
    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (mins > 0) result += `${mins}m`;
    return result.trim() || "0m";
  }
};

const getBackendRootUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return baseUrl.replace("/api/v1", "");
};

const getFullImageUrl = (url) => {
  if (!url) return "";
  let cleanUrl = url.replace(/\\/g, "/");
  if (cleanUrl.startsWith("data:") || cleanUrl.startsWith("http:") || cleanUrl.startsWith("https:")) {
    return cleanUrl;
  }
  const uploadsIndex = cleanUrl.indexOf("uploads/");
  if (uploadsIndex !== -1) {
    cleanUrl = "/" + cleanUrl.substring(uploadsIndex);
  }
  const backendUrl = getBackendRootUrl();
  if (cleanUrl.startsWith("/")) {
    return `${backendUrl}${cleanUrl}`;
  }
  return `${backendUrl}/${cleanUrl}`;
};

export default function BookingReconciliationPage() {
  const { language } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // "pending", "active", "completed"
  const [lightboxImage, setLightboxImage] = useState(null);

  const PAGE_SIZE = 10;

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await api.get("/bookings/staff-all");
      if (response.data && response.data.success) {
        setBookings(response.data.data || []);
      } else {
        setErrorMsg(t[language].errorLoad);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      setErrorMsg(t[language].errorLoad);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Compute stats counts for tabs
  const pendingCount = useMemo(() => {
    return bookings.filter(b => b.status?.toUpperCase() === "PENDING" || b.status?.toUpperCase() === "CONFIRMED").length;
  }, [bookings]);

  const activeCount = useMemo(() => {
    return bookings.filter(b => b.status?.toUpperCase() === "ACTIVE").length;
  }, [bookings]);

  const completedCount = useMemo(() => {
    return bookings.filter(b => b.status?.toUpperCase() === "COMPLETED").length;
  }, [bookings]);

  // Filtered booking list based on section and search query
  const filteredBookings = useMemo(() => {
    let list = bookings;

    if (activeTab === "pending") {
      list = bookings.filter(b => b.status?.toUpperCase() === "PENDING" || b.status?.toUpperCase() === "CONFIRMED");
    } else if (activeTab === "active") {
      list = bookings.filter(b => b.status?.toUpperCase() === "ACTIVE");
    } else {
      list = bookings.filter(b => b.status?.toUpperCase() === "COMPLETED");
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((b) => {
      const fullName = (b.full_name || "").toLowerCase();
      const phone = (b.phone || "").toLowerCase();
      const plate = (b.license_plate || "").toLowerCase();
      return fullName.includes(query) || phone.includes(query) || plate.includes(query);
    });
  }, [bookings, searchQuery, activeTab]);

  // Reset page when search or tab switches
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Pagination calculations
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredBookings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredBookings, currentPage]);

  const handleRowClick = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusUpper = (status || "").toUpperCase();
    if (statusUpper === "PENDING" || statusUpper === "CONFIRMED") {
      return (
        <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 ">
          {t[language].statusPending}
        </span>
      );
    }
    if (statusUpper === "ACTIVE") {
      return (
        <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400 ">
          {t[language].statusActive}
        </span>
      );
    }
    if (statusUpper === "COMPLETED") {
      return (
        <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-455 ">
          {t[language].statusCompleted}
        </span>
      );
    }
    return (
      <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
        {status || t[language].statusUnknown}
      </span>
    );
  };

  return (
    <div className="w-full text-slate-900 dark:text-slate-100 h-full flex flex-col gap-5 overflow-hidden font-sans">

      {/* TABS SELECTOR & SEARCH BAR */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">

        {/* Toggle Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 md:gap-6 no-scrollbar pb-px w-full shrink-0">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all focus:outline-none whitespace-nowrap flex items-center gap-2 ${activeTab === "pending"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            {t[language].tabPending}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "pending"
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("active")}
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all focus:outline-none whitespace-nowrap flex items-center gap-2 ${activeTab === "active"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            {t[language].tabActive}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "active"
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all focus:outline-none whitespace-nowrap flex items-center gap-2 ${activeTab === "completed"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            {t[language].tabCompleted}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "completed"
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-405"
              }`}>
              {completedCount}
            </span>
          </button>
        </div>

        {/* Search Bar & Refresh Button Input */}
        <div className="flex gap-2 items-center w-full">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t[language].placeholderSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-lg outline-none pl-10 pr-10 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-450 dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 animate-fadeIn"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all disabled:opacity-50 shrink-0 shadow-sm"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {t[language].btnRefresh}
          </button>
        </div>
      </div>

      {/* DATATABLE VIEWPORT */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex-1 min-h-0 flex flex-col shadow-sm overflow-hidden transition-all">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold rounded-md flex items-center gap-2 shrink-0">
            <Info size={14} />
            {errorMsg}
          </div>
        )}

        <div className="overflow-y-auto flex-1 min-h-0 relative pr-1">

          {/* DESKTOP VIEW */}
          <table className="hidden md:table w-full text-left text-xs border-collapse relative">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">
                <th className="pb-3 font-semibold pl-2">{t[language].colName}</th>
                <th className="pb-3 font-semibold">{t[language].colPhone}</th>
                <th className="pb-3 font-semibold">{t[language].colEmail}</th>
                <th className="pb-3 font-semibold">{t[language].colPlate}</th>
                <th className="pb-3 font-semibold">{t[language].colType}</th>
                <th className="pb-3 font-semibold">{t[language].colTime}</th>
                <th className="pb-3 font-semibold">{t[language].colDuration}</th>
                <th className="pb-3 font-semibold text-center pr-2">{t[language].colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-20 text-slate-450 dark:text-slate-500 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-blue-500" />
                      <span>{t[language].loading}</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-20 text-slate-450 dark:text-slate-500 italic font-semibold text-xs">
                    {t[language].noData}
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => (
                  <tr
                    key={b.booking_id}
                    onClick={() => handleRowClick(b)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 transition-all duration-150 group cursor-pointer"
                  >
                    <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">
                      {b.full_name || "—"}
                    </td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">
                      {b.phone || "—"}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-455 font-normal">
                      {b.email || "—"}
                    </td>
                    <td className="py-4 font-extrabold text-slate-900 dark:text-white tracking-wider text-xs">
                      {b.license_plate}
                    </td>
                    <td className="py-4 font-normal">
                      {b.vehicle_type_id === 2 ? t[language].car : t[language].motorbike}
                    </td>
                    <td className="py-4 font-normal text-slate-850 dark:text-slate-200">
                      <div className="flex flex-col">
                        <span>{formatDateTime(b.expected_arrival, language)}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(b.expired_at, language)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 font-bold text-slate-800 dark:text-slate-250">
                      {calculateDuration(b.expected_arrival, b.expired_at, language)}
                    </td>
                    <td className="py-4 text-center pr-2">
                      {getStatusBadge(b.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* MOBILE VIEW */}
          <div className="md:hidden flex flex-col gap-3">
            {isLoading ? (
              <div className="text-center py-20 text-slate-450 dark:text-slate-500 font-semibold">
                <div className="flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-blue-500" />
                  <span>{t[language].loading}</span>
                </div>
              </div>
            ) : paginatedBookings.length === 0 ? (
              <div className="text-center py-20 text-slate-450 dark:text-slate-500 italic font-semibold text-xs bg-slate-50 dark:bg-slate-855/20 rounded-md border border-dashed border-slate-200 dark:border-slate-800">
                {t[language].noData}
              </div>
            ) : (
              paginatedBookings.map((b) => (
                <div
                  key={b.booking_id}
                  onClick={() => handleRowClick(b)}
                  className="bg-slate-50 dark:bg-slate-855/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer flex flex-col gap-2.5 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-extrabold text-slate-900 dark:text-white tracking-wider">
                      {b.license_plate}
                    </span>
                    {getStatusBadge(b.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-normal">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        {t[language].colName}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{b.full_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        {t[language].colPhone}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{b.phone || "—"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-normal border-t border-slate-100 dark:border-slate-800/60 pt-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        {t[language].colTime}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatDateTime(b.expected_arrival, language)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        {t[language].colDuration}
                      </span>
                      <span className="font-bold text-slate-850 dark:text-slate-200">
                        {calculateDuration(b.expected_arrival, b.expired_at, language)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PAGINATION BAR */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-450">
              {t[language].page} {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAILS POPUP / MODAL */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col scale-up">

            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-850/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="text-blue-500" size={18} />
                {t[language].detailTitle}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Column 1: Customer & Vehicle specs */}
                <div className="flex flex-col gap-5">

                  {/* Group: Customer Contact Details */}
                  <div className="border border-slate-100 dark:border-slate-800/80 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-850/10">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-500 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                      <User size={14} />
                      {t[language].detailCustomerGroup}
                    </h4>
                    <div className="flex flex-col gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].colName}:</span>
                        <span>{selectedBooking.full_name || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].colPhone}:</span>
                        <a
                          href={`tel:${selectedBooking.phone}`}
                          className="text-blue-500 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Phone size={12} />
                          {selectedBooking.phone || "—"}
                        </a>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].colEmail}:</span>
                        <a
                          href={`mailto:${selectedBooking.email}`}
                          className="text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Mail size={12} />
                          {selectedBooking.email || "—"}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Group: Vehicle & Zone Location */}
                  <div className="border border-slate-100 dark:border-slate-800/80 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-850/10">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-500 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                      <Car size={14} />
                      {t[language].detailVehicleGroup}
                    </h4>
                    <div className="flex flex-col gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].colPlate}:</span>
                        <span className="font-bold text-slate-900 dark:text-white tracking-widest text-sm font-sans">
                          {selectedBooking.license_plate}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].colType}:</span>
                        <span>{selectedBooking.vehicle_type_id === 2 ? t[language].car : t[language].motorbike}</span>
                      </div>
                      {selectedBooking.zone_name && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].assignedZone}:</span>
                          <span className="text-slate-450 dark:text-slate-500 font-bold">
                            {selectedBooking.zone_name} ({t[language].floorLabel} {selectedBooking.floor_number ?? "—"})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group: Entry & Exit Images */}
                  {(selectedBooking.image_url_in || selectedBooking.image_url_out) && (
                    <div className="border border-slate-100 dark:border-slate-800/80 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-850/10">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-blue-500 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                        <Camera size={14} />
                        {language === "vi" ? "Hình ảnh xe vào/ra" : "Entry & Exit Images"}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedBooking.image_url_in && (
                          <div className="flex flex-col overflow-hidden relative group">
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">
                              {language === "vi" ? "Ảnh lúc vào" : "Check-in"}
                            </span>
                            <div
                              className="w-full h-24 overflow-hidden rounded-md cursor-zoom-in relative bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                              onClick={() => setLightboxImage(getFullImageUrl(selectedBooking.image_url_in))}
                            >
                              <img
                                src={getFullImageUrl(selectedBooking.image_url_in)}
                                alt="Check-in"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/0f172a/64748b?text=No+Checkin+Image"; }}
                              />
                              <div className="absolute bottom-1 right-1 bg-white/90 dark:bg-slate-900/90 rounded p-0.5 text-slate-700 dark:text-slate-250 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs border border-slate-200 dark:border-slate-700">
                                <Maximize2 size={8} />
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedBooking.image_url_out && (
                          <div className="flex flex-col overflow-hidden relative group">
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase mb-1">
                              {language === "vi" ? "Ảnh lúc ra" : "Check-out"}
                            </span>
                            <div
                              className="w-full h-24 overflow-hidden rounded-md cursor-zoom-in relative bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                              onClick={() => setLightboxImage(getFullImageUrl(selectedBooking.image_url_out))}
                            >
                              <img
                                src={getFullImageUrl(selectedBooking.image_url_out)}
                                alt="Check-out"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/0f172a/64748b?text=No+Checkout+Image"; }}
                              />
                              <div className="absolute bottom-1 right-1 bg-white/90 dark:bg-slate-900/90 rounded p-0.5 text-slate-700 dark:text-slate-250 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs border border-slate-200 dark:border-slate-700">
                                <Maximize2 size={8} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2: Trip & Parking Details */}
                <div className="flex flex-col gap-5">

                  {/* Group: Trip details & Status */}
                  <div className="border border-slate-100 dark:border-slate-800/80 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-850/10">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-500 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                      <Clock size={14} />
                      {t[language].detailTripGroup}
                    </h4>
                    <div className="flex flex-col gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      {selectedBooking.booking_time && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].bookingTime}:</span>
                          <span className="text-slate-450 dark:text-slate-500 font-semibold">
                            {formatDateTime(selectedBooking.booking_time, language)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].expectedArrival}:</span>
                        <span>{formatDateTime(selectedBooking.expected_arrival, language)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].expectedDeparture}:</span>
                        <span>{formatDateTime(selectedBooking.expired_at, language)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].colDuration}:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white font-sans">
                          {calculateDuration(selectedBooking.expected_arrival, selectedBooking.expired_at, language)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].colStatus}:</span>
                        <span>{getStatusBadge(selectedBooking.status)}</span>
                      </div>

                      {/* Detailed Fee Breakdown */}
                      <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-1.5">
                        <div className="flex justify-between items-center gap-2 text-xs font-normal">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">{t[language].depositLabel}:</span>
                          <span className="text-slate-800 dark:text-slate-200">
                            {(() => {
                              const initialDeposit = Math.max(0, (selectedBooking.deposit_paid || 0) - (selectedBooking.early_fee || 0) - (selectedBooking.penalty_fee || 0));
                              return `${initialDeposit.toLocaleString()} VND`;
                            })()}
                          </span>
                        </div>

                        {(selectedBooking.early_fee > 0 || selectedBooking.status?.toUpperCase() === "COMPLETED") && (
                          <div className="flex justify-between items-center gap-2 text-xs font-normal">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">{t[language].earlyFeeLabel}:</span>
                            <span className="text-slate-800 dark:text-slate-200">
                              {`${(selectedBooking.early_fee || 0).toLocaleString()} VND`}
                            </span>
                          </div>
                        )}

                        {(selectedBooking.penalty_fee > 0 || selectedBooking.status?.toUpperCase() === "COMPLETED") && (
                          <div className="flex justify-between items-center gap-2 text-xs font-normal">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">{t[language].penaltyFeeLabel}:</span>
                            <span className="text-red-500 dark:text-red-400 font-medium">
                              {`${(selectedBooking.penalty_fee || 0).toLocaleString()} VND`}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center gap-2 border-t border-slate-100 dark:border-slate-800/40 pt-2 mt-1">
                          <span className="text-slate-900 dark:text-white font-extrabold text-xs">{t[language].totalPaidLabel}:</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-450 text-sm">
                            {`${(selectedBooking.deposit_paid || 0).toLocaleString()} VND`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group: Parking Details (Actual Entry & Exit) */}
                  {selectedBooking.actual_check_in && (
                    <div className="border border-slate-100 dark:border-slate-800/80 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-850/10">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-blue-500 dark:text-blue-500 mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                        <Clock size={14} />
                        {language === "vi" ? "Thông tin đỗ xe thực tế" : "Parking Details"}
                      </h4>
                      <div className="flex flex-col gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].actualArrival}:</span>
                          <span className="text-slate-450 dark:text-slate-500 font-semibold">
                            {formatDateTime(selectedBooking.actual_check_in, language)}
                          </span>
                        </div>
                        {selectedBooking.actual_check_out && (
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].actualDeparture}:</span>
                            <span className="text-slate-450 dark:text-slate-500 font-semibold">
                              {formatDateTime(selectedBooking.actual_check_out, language)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-450 dark:text-slate-500 font-normal">{t[language].colDuration}:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white font-sans">
                            {calculateDuration(selectedBooking.actual_check_in, selectedBooking.actual_check_out || new Date(), language)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-850/40 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-blue-650 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
              >
                {t[language].btnClose}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-slate-955/80 dark:bg-slate-955/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 dark:text-slate-400 dark:hover:text-white bg-white/10 dark:bg-slate-900/60 p-2 rounded-full border border-slate-300 dark:border-slate-800 transition-colors">
            <X size={20} />
          </div>
          <div
            className="relative w-full max-w-[95vw] md:max-w-6xl max-h-[92vh] rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxImage} alt="Full evidence" className="w-full h-auto max-h-[85vh] md:max-h-[88vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
