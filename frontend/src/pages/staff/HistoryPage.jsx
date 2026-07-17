import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import {
    Sliders, Calendar, RefreshCcw, Info,
    Search, ChevronLeft, ChevronRight, Trash2, Download,
    X, Maximize2, Car, Hash, User, Clock, MapPin, Copy
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { toast } from "sonner";

const t = {
    vi: {
        filters: "Bộ lọc",
        enterPlate: "Nhập biển số xe...",
        allVehicles: "Tất cả loại xe",
        motorbike: "Xe máy",
        car: "Ô tô",
        allStatuses: "Tất cả trạng thái",
        statusActive: "Đang đỗ",
        statusCompleted: "Đã ra",
        statusLostTicket: "Mất vé",
        statusUnknown: "Không rõ",
        from: "Từ ngày",
        to: "Đến ngày",
        clearFilters: "Xóa tất cả bộ lọc",
        headerPlate: "Biển kiểm soát",
        headerType: "Loại xe",
        headerZone: "Khu vực",
        headerCheckIn: "Thời gian vào",
        headerCheckOut: "Thời gian ra",
        headerStatus: "Trạng thái",
        headerFee: "Tổng phí",
        loading: "Đang tải lịch sử đỗ xe...",
        noData: "Không tìm thấy lịch sử hoạt động hoặc không có dữ liệu khớp với bộ lọc.",
        refresh: "Làm mới",
        page: "Trang",
        errorLoad: "Không thể tải danh sách dữ liệu từ hệ thống.",
        errorConnect: "Đã xảy ra lỗi khi kết nối tới máy chủ."
    },
    en: {
        filters: "Filters",
        enterPlate: "Enter license plate...",
        allVehicles: "All Vehicles",
        motorbike: "Motorbike",
        car: "Car",
        allStatuses: "All Statuses",
        statusActive: "Parking",
        statusCompleted: "Completed",
        statusLostTicket: "Lost Ticket",
        statusUnknown: "Unknown",
        from: "From",
        to: "To",
        clearFilters: "Clear All Filters",
        headerPlate: "License Plate",
        headerType: "Vehicle Type",
        headerZone: "Parking Zone",
        headerCheckIn: "Check-in Time",
        headerCheckOut: "Check-out Time",
        headerStatus: "Status",
        headerFee: "Total Fee",
        loading: "Loading parking history...",
        noData: "No activity history found or no data matches the selected filters.",
        refresh: "Refresh",
        page: "Page",
        errorLoad: "Failed to load activity logs from the system.",
        errorConnect: "An error occurred while connecting to the server."
    }
};

export default function HistoryPage() {
    const { language } = useLanguage();

    // Dữ liệu và trạng thái tải
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [selectedSession, setSelectedSession] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);

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

        // Trích xuất đường dẫn tương đối nếu chứa thư mục uploads vật lý
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

    const getDurationMinutes = (checkIn, checkOut) => {
        if (!checkIn) return 0;
        const start = new Date(checkIn);
        const end = checkOut ? new Date(checkOut) : new Date();
        const diffMs = end.getTime() - start.getTime();
        return Math.max(0, Math.floor(diffMs / 60000));
    };

    const formatDuration = (totalMinutes) => {
        if (totalMinutes === undefined || totalMinutes === null) return "0 " + (language === "vi" ? "phút" : "mins");
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;

        let parts = [];
        if (language === "vi") {
            if (days > 0) parts.push(`${days} ngày`);
            if (hours > 0 || days > 0) parts.push(`${hours} giờ`);
            if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes} phút`);
            return parts.join(" ");
        } else {
            if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
            if (hours > 0 || days > 0) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
            if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
            return parts.join(" ");
        }
    };

    // Số lượng xe đang đỗ thực tế
    const [currentlyParkedCount, setCurrentlyParkedCount] = useState(0);

    // State bộ lọc (Filters)
    const [filterPlate, setFilterPlate] = useState("");
    const [filterVehicleType, setFilterVehicleType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterFromDate, setFilterFromDate] = useState("");
    const [filterToDate, setFilterToDate] = useState("");

    // State phân trang (Pagination)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Hàm gọi API lấy số xe đang đỗ thực tế từ zones stats
    const fetchRealtimeStats = async () => {
        try {
            const response = await api.get("/parking/zones/stats");
            if (response.data && Array.isArray(response.data)) {
                const totalOccupied = response.data.reduce((sum, zone) => sum + (zone.occupiedCount || 0), 0);
                setCurrentlyParkedCount(totalOccupied);
            }
        } catch (error) {
            console.error("Failed to fetch zone realtime stats:", error);
        }
    };

    // Hàm gọi API lấy dữ liệu lịch sử chuẩn theo cấu trúc backend thực tế
    const fetchHistoryData = async (pageNumber = currentPage) => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const params = {
                licensePlate: filterPlate.trim() || undefined,
                vehicleType: filterVehicleType || undefined,
                status: filterStatus || undefined,
                fromDate: filterFromDate || undefined,
                toDate: filterToDate || undefined,
                page: pageNumber,
                pageSize: pageSize
            };

            const response = await api.get(`/parking/history`, { params });

            if (response.data && response.data.success) {
                const result = response.data;

                // 1. Lấy mảng dữ liệu
                const items = result.data || [];
                setActivities(items);

                // 2. Lấy chính xác total_records
                const total = result.total_records ?? items.length;
                setTotalRecords(total);

                // 3. Tính toán số trang thực tế
                const calculatedPages = Math.max(1, Math.ceil(total / pageSize));
                setTotalPages(calculatedPages);

            } else {
                setErrorMessage(t[language].errorLoad);
            }
        } catch (error) {
            console.error("Failed to fetch parking history:", error);
            setErrorMessage(error.response?.data?.message || t[language].errorConnect);
        } finally {
            setIsLoading(false);
        }

        // Cập nhật số xe đang đỗ song song
        fetchRealtimeStats();
    };

    // Gọi lần đầu khi trang load
    useEffect(() => {
        fetchRealtimeStats();
    }, []);

    // Theo dõi bộ lọc và số trang để tự động gọi lại API
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchHistoryData(currentPage);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, filterPlate, filterVehicleType, filterStatus, filterFromDate, filterToDate]);

    // ĐÃ THÊM: Hàm điều hướng bộ lọc tổng hợp khớp chính xác với UI JSX của bạn
    const handleFilterChange = (filterType, value) => {
        setCurrentPage(1); // Reset về trang 1 khi thay đổi bất kỳ bộ lọc nào

        switch (filterType) {
            case "plate":
                setFilterPlate(value.toUpperCase());
                break;
            case "vehicleType":
                setFilterVehicleType(value);
                break;
            case "status":
                setFilterStatus(value);
                break;
            case "fromDate":
                setFilterFromDate(value);
                break;
            case "toDate":
                setFilterToDate(value);
                break;
            default:
                break;
        }
    };

    // Hàm xóa sạch toàn bộ bộ lọc
    const handleResetFilters = () => {
        setFilterPlate("");
        setFilterVehicleType("");
        setFilterStatus("");
        setFilterFromDate("");
        setFilterToDate("");
        setCurrentPage(1);
    };

    // Chức năng xuất dữ liệu ra file CSV của toàn bộ kết quả lọc từ database
    const handleExportCSV = async () => {
        setIsLoading(true);
        try {
            const params = {
                licensePlate: filterPlate.trim() || undefined,
                vehicleType: filterVehicleType || undefined,
                status: filterStatus || undefined,
                fromDate: filterFromDate || undefined,
                toDate: filterToDate || undefined,
                page: 1,
                pageSize: 1000000 // Tải toàn bộ số bản ghi khớp bộ lọc để xuất
            };

            const response = await api.get(`/parking/history`, { params });

            if (response.data && response.data.success) {
                const allItems = response.data.data || [];

                if (allItems.length === 0) {
                    alert(language === "vi" ? "Không có dữ liệu để xuất file!" : "No data to export!");
                    return;
                }

                // CSV Header
                const headers = language === "vi"
                    ? ["Biển kiểm soát", "Loại xe", "Khu vực", "Thời gian vào", "Thời gian ra", "Trạng thái", "Tổng phí (VND)"]
                    : ["License Plate", "Vehicle Type", "Zone", "Check-in Time", "Check-out Time", "Status", "Fee (VND)"];

                // CSV Rows
                const rows = allItems.map(log => {
                    const plate = log.licensePlateIn || log.license_plate || "—";
                    const type = String(log.vehicleTypeId || log.vehicle_type) === "2"
                        ? (language === "vi" ? "Ô tô" : "Car")
                        : (language === "vi" ? "Xe máy" : "Motorbike");
                    const zone = log.zoneName || log.zone_name || "—";
                    const checkIn = log.checkInTime || log.check_in_time
                        ? new Date(log.checkInTime || log.check_in_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US")
                        : "—";
                    const checkOut = log.checkOutTime || log.check_out_time
                        ? new Date(log.checkOutTime || log.check_out_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US")
                        : "—";

                    let statusText = "—";
                    const statusUpper = log.status?.toUpperCase();
                    if (statusUpper === "COMPLETED") statusText = language === "vi" ? "Đã ra" : "Completed";
                    else if (statusUpper === "ACTIVE") statusText = language === "vi" ? "Đang đỗ" : "Active";
                    else if (statusUpper === "LOST_TICKET" || statusUpper === "LOST-TICKET") statusText = language === "vi" ? "Mất vé" : "Lost Ticket";
                    else statusText = log.status || (language === "vi" ? "Không rõ" : "Unknown");

                    const fee = log.totalFee ?? log.total_fee ?? 0;

                    return [
                        `"${plate}"`,
                        `"${type}"`,
                        `"${zone}"`,
                        `"${checkIn}"`,
                        `"${checkOut}"`,
                        `"${statusText}"`,
                        fee
                    ];
                });

                // Combine headers and rows with UTF-8 BOM for correct Vietnamese character display in Excel
                const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `parking_history_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert(language === "vi" ? "Không thể tải danh sách dữ liệu từ máy chủ!" : "Failed to load activity logs from server.");
            }
        } catch (error) {
            console.error("Failed to export parking history:", error);
            alert(language === "vi" ? "Đã xảy ra lỗi khi kết nối tới máy chủ." : "An error occurred while connecting to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full text-slate-900 dark:text-slate-100 h-full flex flex-col gap-5 overflow-hidden font-sans">

            {/* FILTER CONTROLS BAR */}
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mr-2 shrink-0">
                    <Sliders size={16} className="text-blue-500" /> {t[language].filters}
                </div>

                {/* Tìm kiếm biển số */}
                <div className="relative flex items-center flex-1 sm:flex-none">
                    <Search size={14} className="absolute left-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t[language].enterPlate}
                        value={filterPlate}
                        onChange={(e) => handleFilterChange("plate", e.target.value)}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-lg outline-none pl-9 pr-3 w-full sm:w-44 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:font-sans placeholder:font-normal"
                    />
                </div>

                {/* Lọc loại xe */}
                <select
                    value={filterVehicleType}
                    onChange={(e) => handleFilterChange("vehicleType", e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer focus:bg-white dark:focus:bg-slate-900 transition-all">
                    <option value="">{t[language].allVehicles}</option>
                    <option value="1">{t[language].motorbike}</option>
                    <option value="2">{t[language].car}</option>
                </select>

                {/* Lọc trạng thái */}
                <select
                    value={filterStatus}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer focus:bg-white dark:focus:bg-slate-900 transition-all">
                    <option value="">{t[language].allStatuses}</option>
                    <option value="ACTIVE">{t[language].statusActive}</option>
                    <option value="COMPLETED">{t[language].statusCompleted}</option>
                    <option value="LOST-TICKET">{t[language].statusLostTicket}</option>
                </select>

                {/* Từ ngày */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white flex-1 sm:flex-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{t[language].from}</span>
                    <input
                        type="date"
                        value={filterFromDate}
                        onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                        className="bg-transparent font-semibold outline-none cursor-pointer text-slate-900 dark:text-white color-scheme-dark w-full"
                    />
                </div>

                {/* Đến ngày */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white flex-1 sm:flex-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{t[language].to}</span>
                    <input
                        type="date"
                        value={filterToDate}
                        onChange={(e) => handleFilterChange("toDate", e.target.value)}
                        className="bg-transparent font-semibold outline-none cursor-pointer text-slate-900 dark:text-white color-scheme-dark w-full"
                    />
                </div>

                {/* Nút Xoá toàn bộ bộ lọc đặt ở cuối góc phải */}
                {(filterPlate || filterVehicleType || filterStatus || filterFromDate || filterToDate) && (
                    <button
                        onClick={handleResetFilters}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-600 rounded-lg transition-all dark:border-red-900/50 dark:hover:bg-red-900 shrink-0"
                        title={t[language].clearFilters}>
                        <Trash2 size={17} />
                    </button>
                )}
            </div>

            {/* DATA VIEWPORT CONTAINER */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 flex-1 min-h-0 flex flex-col shadow-sm overflow-hidden transition-all">

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold rounded-md flex items-center gap-2 shrink-0">
                        <Info size={14} />
                        {errorMessage}
                    </div>
                )}

                <div className="overflow-y-auto flex-1 min-h-0 relative pr-1">

                    {/* DESKTOP TABLE VIEW (Visible on md screens and up) */}
                    <table className="hidden md:table w-full text-left text-xs border-collapse relative">
                        <thead>
                            <tr className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">
                                <th className="pb-3 font-semibold pl-2">{t[language].headerPlate}</th>
                                <th className="pb-3 font-semibold">{t[language].headerType}</th>
                                <th className="pb-3 font-semibold">{t[language].headerZone}</th>
                                <th className="pb-3 font-semibold">{t[language].headerCheckIn}</th>
                                <th className="pb-3 font-semibold">{t[language].headerCheckOut}</th>
                                <th className="pb-3 font-semibold">{t[language].headerStatus}</th>
                                <th className="pb-3 font-semibold text-right">{t[language].headerFee}</th>
                                <th className="pb-3 font-semibold text-right pr-2 w-24"></th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-20 text-slate-450 dark:text-slate-500 font-semibold">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCcw size={20} className="animate-spin text-blue-500" />
                                            <span>{t[language].loading}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-20 text-slate-450 dark:text-slate-500 italic font-semibold text-xs">
                                        {t[language].noData}
                                    </td>
                                </tr>
                            ) : (
                                activities.map((log, index) => (
                                    <tr key={index} onClick={() => setSelectedSession(log)} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 transition-all duration-150 group cursor-pointer">
                                        <td className="py-3.5 pl-2 font-sans font-extrabold text-xs tracking-wider text-slate-900 dark:text-white text-sm tracking-wide">
                                            {log.licensePlateIn || log.licensePlate || log.license_plate || "—"}
                                        </td>
                                        <td className="py-3.5 font-sans text-xs font-semibold tracking-wide">
                                            {String(log.vehicleTypeId || log.vehicleType || log.vehicle_type) === "2" ? t[language].car : t[language].motorbike}
                                        </td>
                                        <td className="py-3.5 font-sans font-bold text-xs tracking-wider text-amber-700 dark:text-amber-500 font-bold text-sm group-hover:translate-x-0.5 transition-transform origin-left">
                                            {log.zoneName || log.zone_name || "—"}
                                        </td>
                                        <td className="text-slate-800 dark:text-slate-200 font-semibold text-xs">
                                            {log.checkInTime || log.check_in_time ? new Date(log.checkInTime || log.check_in_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "—"}
                                        </td>
                                        <td className="text-slate-800 dark:text-slate-200 font-semibold text-xs">
                                            {log.checkOutTime || log.check_out_time ? new Date(log.checkOutTime || log.check_out_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "—"}
                                        </td>
                                        <td className="py-3.5">
                                            <span className={`inline-flex text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border transition-all ${log.status?.toUpperCase() === "COMPLETED"
                                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-455 border-emerald-200 dark:border-emerald-900/30"
                                                : log.status?.toUpperCase() === "ACTIVE"
                                                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30"
                                                    : log.status?.toUpperCase() === "LOST_TICKET" || log.status?.toUpperCase() === "LOST-TICKET"
                                                        ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                                }`}>
                                                {log.status?.toUpperCase() === "COMPLETED"
                                                    ? t[language].statusCompleted
                                                    : log.status?.toUpperCase() === "ACTIVE"
                                                        ? t[language].statusActive
                                                        : log.status?.toUpperCase() === "LOST_TICKET" || log.status?.toUpperCase() === "LOST-TICKET"
                                                            ? t[language].statusLostTicket
                                                            : log.status || t[language].statusUnknown}
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-right font-sans font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all">
                                            {log.totalFee !== undefined && log.totalFee !== null ? `${log.totalFee.toLocaleString()} VND` :
                                                log.total_fee !== undefined && log.total_fee !== null ? `${log.total_fee.toLocaleString()} VND` : "0 VND"}
                                        </td>
                                        <td className="py-3.5 text-right pr-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSession(log);
                                                }}
                                                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-white border border-blue-200 hover:bg-blue-600 dark:border-blue-900/50 dark:hover:bg-blue-900 rounded transition-all shadow-xs"
                                            >
                                                {language === "vi" ? "Chi tiết" : "Details"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* MOBILE CARD-BASED LIST VIEW (Visible below md screens) */}
                    <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isLoading ? (
                            <div className="col-span-full text-center py-20 text-slate-400 dark:text-slate-500 font-semibold">
                                <RefreshCcw size={20} className="animate-spin mx-auto mb-2 text-blue-500" />
                                <span>{t[language].loading}</span>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-slate-400 dark:text-slate-500 italic font-semibold text-xs">
                                {t[language].noData}
                            </div>
                        ) : (
                            activities.map((log, index) => (
                                <div key={index} onClick={() => setSelectedSession(log)} className="bg-slate-55/50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/80 rounded-md p-4 flex flex-col gap-3 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all duration-200">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/40">
                                        <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-sans font-extrabold text-xs tracking-wider shadow-sm">
                                            {log.licensePlateIn || log.licensePlate || log.license_plate || "—"}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${log.status?.toUpperCase() === "COMPLETED"
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-455 border-emerald-200 dark:border-emerald-900/30"
                                            : log.status?.toUpperCase() === "ACTIVE"
                                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border-blue-200 dark:border-blue-900/30"
                                                : log.status?.toUpperCase() === "LOST_TICKET" || log.status?.toUpperCase() === "LOST-TICKET"
                                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border-rose-200 dark:border-rose-900/30"
                                                    : "bg-slate-100 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                            }`}>
                                            {log.status?.toUpperCase() === "ACTIVE" && (
                                                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse shrink-0" />
                                            )}
                                            {log.status?.toUpperCase() === "COMPLETED" && (
                                                <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                            )}
                                            {log.status?.toUpperCase() === "COMPLETED"
                                                ? t[language].statusCompleted
                                                : log.status?.toUpperCase() === "ACTIVE"
                                                    ? t[language].statusActive
                                                    : log.status?.toUpperCase() === "LOST_TICKET" || log.status?.toUpperCase() === "LOST-TICKET"
                                                        ? t[language].statusLostTicket
                                                        : log.status || t[language].statusUnknown}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2 text-xs font-medium" onClick={(e) => e.stopPropagation()}>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wide mb-0.5">{t[language].headerType}</div>
                                            <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${String(log.vehicleTypeId || log.vehicleType || log.vehicle_type) === "2"
                                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-150/40"
                                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-405 border border-emerald-150/40"
                                                }`}>
                                                {String(log.vehicleTypeId || log.vehicleType || log.vehicle_type) === "2" ? t[language].car : t[language].motorbike}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wide mb-0.5">{t[language].headerZone}</div>
                                            <span className="font-sans font-bold tracking-wider text-amber-700 dark:text-amber-500 px-1.5 py-0.2 rounded text-[10px]">
                                                {log.zoneName || log.zone_name || "—"}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wide mb-0.5">{t[language].headerCheckIn}</div>
                                            <span className="font-sans text-slate-700 dark:text-slate-350">
                                                {log.checkInTime || log.check_in_time ? new Date(log.checkInTime || log.check_in_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US", { dateStyle: 'short', timeStyle: 'short' }) : "—"}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wide mb-0.5">{t[language].headerCheckOut}</div>
                                            <span className="font-sans text-slate-700 dark:text-slate-350">
                                                {log.checkOutTime || log.check_out_time ? new Date(log.checkOutTime || log.check_out_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US", { dateStyle: 'short', timeStyle: 'short' }) : "—"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800/40">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wide mb-0.5">{t[language].headerFee}</span>
                                            <span className="font-sans font-extrabold text-slate-900 dark:text-white text-sm">
                                                {log.totalFee !== undefined && log.totalFee !== null ? `${log.totalFee.toLocaleString()} VND` :
                                                    log.total_fee !== undefined && log.total_fee !== null ? `${log.total_fee.toLocaleString()} VND` : "0 VND"}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSession(log);
                                            }}
                                            className="px-3.5 py-1.5 text-xs font-bold text-blue-600 hover:text-white border border-blue-200 hover:bg-blue-600 rounded-md transition-all dark:border-blue-900/50 dark:hover:bg-blue-900 shadow-xs"
                                        >
                                            {language === "vi" ? "Chi tiết" : "Details"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 font-semibold">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchHistoryData(currentPage)}
                            disabled={isLoading}
                            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-slate-800 dark:hover:border-slate-400 rounded-md px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
                            {t[language].refresh}
                        </button>

                        <button
                            onClick={handleExportCSV}
                            disabled={isLoading}
                            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-slate-800 dark:hover:border-slate-400 rounded-md px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
                        >
                            <Download size={14} />
                            <span>{language === "vi" ? "Xuất CSV" : "Export CSV"}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Nút Lùi Trang */}
                        <button
                            onClick={() => {
                                const prevPage = Math.max(currentPage - 1, 1);
                                setCurrentPage(prevPage);
                                fetchHistoryData(prevPage);
                            }}
                            disabled={currentPage === 1 || isLoading}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1 px-1">
                            <span className="font-bold text-slate-800 dark:text-white">{t[language].page} {currentPage}</span>
                            <span>/</span>
                            <span className="text-slate-400 dark:text-slate-500">{totalPages}</span>
                        </div>

                        {/* Nút Tiến Trang */}
                        <button
                            onClick={() => {
                                const nextPage = Math.min(currentPage + 1, totalPages);
                                setCurrentPage(nextPage);
                                fetchHistoryData(nextPage);
                            }}
                            disabled={currentPage === totalPages || isLoading}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </div>

            {/* selectedSession Details Modal */}
            {selectedSession && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-4xl w-full p-5 xl:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden scaleUp transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 shrink-0">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                                <Info size={16} className="text-blue-500" />
                                {language === "vi" ? "Chi tiết phiên đỗ xe" : "Parking Session Details"}
                            </h3>
                            <button
                                onClick={() => setSelectedSession(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-4 class-scroll-em-di">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Left column: Details Info table */}
                                <div className="space-y-3">
                                    <div className="bg-slate-55/60 dark:bg-slate-950 p-4 rounded-md border border-slate-250 dark:border-slate-800 text-xs font-semibold space-y-2.5">
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{t[language].headerPlate}</span>
                                            <span className="text-slate-900 dark:text-white font-black text-xs tracking-wide">
                                                {selectedSession.licensePlateIn || selectedSession.licensePlate || selectedSession.license_plate || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{language === "vi" ? "Mã vé xe" : "Ticket Code"}</span>
                                            <span className="text-slate-900 dark:text-white font-black text-xs tracking-wide flex items-center gap-1.5">
                                                <span>{selectedSession.ticketCode || selectedSession.ticket_code || "—"}</span>
                                                {(selectedSession.ticketCode || selectedSession.ticket_code) && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(selectedSession.ticketCode || selectedSession.ticket_code);
                                                            toast.success(language === "vi" ? "Đã sao chép mã vé!" : "Ticket code copied!");
                                                        }}
                                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors flex items-center justify-center cursor-pointer"
                                                        title={language === "vi" ? "Sao chép" : "Copy"}
                                                    >
                                                        <Copy size={13} />
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{t[language].headerType}</span>
                                            <span className="text-slate-900 dark:text-white font-bold text-xs">
                                                {String(selectedSession.vehicleTypeId || selectedSession.vehicleType || selectedSession.vehicle_type) === "2" ? t[language].car : t[language].motorbike}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{language === "vi" ? "Vị trí ô đỗ / Phân khu" : "Slot / Zone"}</span>
                                            <span className="text-amber-700 dark:text-amber-500 font-extrabold uppercase text-xs">
                                                {selectedSession.zoneName || selectedSession.zone_name || "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{t[language].headerCheckIn}</span>
                                            <span className="text-slate-900 dark:text-white font-bold text-xs">
                                                {selectedSession.checkInTime || selectedSession.check_in_time ? new Date(selectedSession.checkInTime || selectedSession.check_in_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{t[language].headerCheckOut}</span>
                                            <span className="text-slate-900 dark:text-white font-bold text-xs">
                                                {selectedSession.checkOutTime || selectedSession.check_out_time
                                                    ? new Date(selectedSession.checkOutTime || selectedSession.check_out_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US")
                                                    : (language === "vi" ? "Xe đang trong bãi" : "")}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{language === "vi" ? "Thời lượng đỗ" : "Duration"}</span>
                                            <span className="text-slate-900 dark:text-white font-bold text-xs">
                                                {formatDuration(getDurationMinutes(selectedSession.checkInTime || selectedSession.check_in_time, selectedSession.checkOutTime || selectedSession.check_out_time))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{language === "vi" ? "Nhân viên check-in" : "Check-in Staff"}</span>
                                            <span className="text-slate-900 dark:text-white font-bold text-xs">
                                                {selectedSession.staffCheckIn || selectedSession.staff_check_in || "system"}
                                            </span>
                                        </div>
                                        {selectedSession.status?.toUpperCase() === "COMPLETED" && (
                                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                                <span className="text-slate-400">{language === "vi" ? "Nhân viên check-out" : "Check-out Staff"}</span>
                                                <span className="text-slate-900 dark:text-white font-bold text-xs">
                                                    {selectedSession.staffCheckOut || selectedSession.staff_check_out || "system"}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                                            <span className="text-slate-400">{t[language].headerStatus}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${selectedSession.status?.toUpperCase() === "COMPLETED"
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450"
                                                : selectedSession.status?.toUpperCase() === "ACTIVE"
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400"
                                                }`}>
                                                {selectedSession.status?.toUpperCase() === "COMPLETED"
                                                    ? t[language].statusCompleted
                                                    : selectedSession.status?.toUpperCase() === "ACTIVE"
                                                        ? t[language].statusActive
                                                        : selectedSession.status || t[language].statusUnknown}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-slate-400 uppercase">{language === "vi" ? "Tổng tiền thanh toán" : "Total Fee"}</span>
                                            <span className="text-base font-black text-slate-900 dark:white">
                                                {selectedSession.totalFee !== undefined && selectedSession.totalFee !== null ? `${selectedSession.totalFee.toLocaleString()} VND` :
                                                    selectedSession.total_fee !== undefined && selectedSession.total_fee !== null ? `${selectedSession.total_fee.toLocaleString()} VND` : "0 VND"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right column: Image snap comparision */}
                                <div className="space-y-4">
                                    {/* Check-in photo */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                            <Car size={13} />
                                            {language === "vi" ? "Ảnh check-in " : "Check-in Image"}
                                        </span>
                                        {selectedSession.imageUrlIn || selectedSession.image_url_in || selectedSession.ImageUrlIn ? (
                                            <div
                                                onClick={() => {
                                                    const imgIn = selectedSession.imageUrlIn || selectedSession.image_url_in || selectedSession.ImageUrlIn
                                                    if (imgIn) {
                                                        setLightboxImage(getFullImageUrl(imgIn));
                                                    }
                                                }}
                                                className="bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-md transition-colors duration-200 h-auto"
                                                title="Click to zoom check-in image"
                                            >
                                                <img
                                                    src={(selectedSession.imageUrlIn || selectedSession.image_url_in || selectedSession.ImageUrlIn) ? getFullImageUrl(selectedSession.imageUrlIn || selectedSession.image_url_in || selectedSession.ImageUrlIn) : "https://placehold.co/600x400/0f172a/64748b?text=No+Checkin+Image"}
                                                    alt="Check-in snapshot"
                                                    className="w-full h-auto max-h-[130px] object-contain transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                                                />
                                                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded p-1 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                                    <Maximize2 size={10} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-md border border-slate-250 dark:border-slate-800 h-[130px] flex flex-col items-center justify-center text-center p-3 text-slate-450 dark:text-slate-505 font-bold tracking-wide">
                                                <span className="text-[11px] text-slate-400">
                                                    {language === "vi" ? "No image" : "No image"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Check-out photo */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                            <Car size={13} />
                                            {language === "vi" ? "Ảnh check-out" : "Check-out Image"}
                                        </span>
                                        {selectedSession.status?.toUpperCase() === "COMPLETED" && (selectedSession.imageUrlOut || selectedSession.image_url_out || selectedSession.ImageUrlOut) ? (
                                            <div
                                                onClick={() => {
                                                    const imgOut = selectedSession.imageUrlOut || selectedSession.image_url_out || selectedSession.ImageUrlOut;
                                                    if (imgOut) {
                                                        setLightboxImage(getFullImageUrl(imgOut));
                                                    }
                                                }}
                                                className="bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-md transition-colors duration-200 h-auto"
                                                title="Click to zoom check-out image"
                                            >
                                                <img
                                                    src={getFullImageUrl(selectedSession.imageUrlOut || selectedSession.image_url_out || selectedSession.ImageUrlOut)}
                                                    alt="Check-out snapshot"
                                                    className="w-full h-auto max-h-[130px] object-contain transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                                                />
                                                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded p-1 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                                    <Maximize2 size={10} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-md border border-slate-250 dark:border-slate-800 h-[130px] flex flex-col items-center justify-center text-center p-3 text-slate-450 dark:text-slate-505 font-bold tracking-wide">
                                                <span className="text-[11px] text-slate-400">
                                                    {language === "vi" ? "No image" : "No image"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX ZOOM PREVIEW */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 dark:text-slate-400 dark:hover:text-white bg-white/10 dark:bg-slate-900/60 p-2 rounded-full border border-slate-300 dark:border-slate-800 transition-colors">
                        <X size={20} />
                    </div>
                    <div className="relative w-full max-w-[95vw] md:max-w-6xl max-h-[92vh] rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <img src={lightboxImage} alt="High Resolution Audit" className="w-full h-auto max-h-[85vh] md:max-h-[88vh] object-contain" />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 dark:bg-slate-950/80 p-3 text-center border-t border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                            <p className="font-mono font-bold tracking-widest text-sm text-yellow-500 dark:text-yellow-400">
                                {selectedSession?.licensePlateIn || selectedSession?.licensePlate || selectedSession?.license_plate || "No Plate Info"}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}