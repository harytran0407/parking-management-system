import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import {
    Sliders, Calendar, RefreshCcw, Info,
    Search, ChevronLeft, ChevronRight, Trash2
} from "lucide-react";

export default function HistoryPage() {
    // Dữ liệu và trạng thái tải
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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
                setErrorMessage("Không thể tải danh sách dữ liệu từ hệ thống.");
            }
        } catch (error) {
            console.error("Failed to fetch parking history:", error);
            setErrorMessage(error.response?.data?.message || "Đã xảy ra lỗi khi kết nối tới máy chủ.");
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <div className="w-full text-slate-900 dark:text-slate-100 h-full flex flex-col gap-5 overflow-hidden font-sans">

            {/* FILTER CONTROLS BAR */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mr-2">
                    <Sliders size={16} className="text-blue-500" /> Filters
                </div>

                {/* Tìm kiếm biển số */}
                <div className="relative flex items-center">
                    <Search size={14} className="absolute left-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Enter license plate..."
                        value={filterPlate}
                        onChange={(e) => handleFilterChange("plate", e.target.value)}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-lg outline-none pl-9 pr-3 w-44 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:font-sans placeholder:font-normal"
                    />
                </div>

                {/* Lọc loại xe */}
                <select
                    value={filterVehicleType}
                    onChange={(e) => handleFilterChange("vehicleType", e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer focus:bg-white dark:focus:bg-slate-900 transition-all">
                    <option value="">All Vehicles</option>
                    <option value="1">Motorbike</option>
                    <option value="2">Car</option>
                </select>

                {/* Lọc trạng thái */}
                <select
                    value={filterStatus}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer focus:bg-white dark:focus:bg-slate-900 transition-all">
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="LOST-TICKET">Lost Ticket</option>
                </select>

                {/* Từ ngày */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                    <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                    <input
                        type="date"
                        value={filterFromDate}
                        onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                        className="bg-transparent font-semibold outline-none cursor-pointer text-slate-900 dark:text-white color-scheme-dark"
                    />
                </div>

                {/* Đến ngày */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white">
                    <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                    <input
                        type="date"
                        value={filterToDate}
                        onChange={(e) => handleFilterChange("toDate", e.target.value)}
                        className="bg-transparent font-semibold outline-none cursor-pointer text-slate-900 dark:text-white color-scheme-dark"
                    />
                </div>

                {/* Nút Xoá toàn bộ bộ lọc đặt ở cuối góc phải */}
                {(filterPlate || filterVehicleType || filterStatus || filterFromDate || filterToDate) && (
                    <button
                        onClick={handleResetFilters}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-600 rounded-lg transition-all dark:border-red-900/50 dark:hover:bg-red-900"
                        title="Delete All Active Filters">
                        <Trash2 size={17} />
                    </button>
                )}
            </div>

            {/* DATA TABLE VIEWPORT (ĐÃ CẬP NHẬT DARK MODE VÀ FONT CHỮ) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 flex-1 min-h-0 flex flex-col shadow-sm overflow-hidden transition-all">

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold rounded-md flex items-center gap-2 shrink-0">
                        <Info size={14} />
                        {errorMessage}
                    </div>
                )}

                <div className="overflow-y-auto flex-1 min-h-0 relative">
                    <table className="w-full text-left text-xs border-collapse relative">
                        <thead>
                            <tr className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">
                                <th className="pb-3 font-semibold pl-2">License Plate</th>
                                <th className="pb-3 font-semibold">Type</th>
                                <th className="pb-3 font-semibold">Zone</th>
                                <th className="pb-3 font-semibold">Check-in Time</th>
                                <th className="pb-3 font-semibold">Check-out Time</th>
                                <th className="pb-3 font-semibold">Status</th>
                                <th className="pb-3 font-semibold text-right pr-2">Total Fee</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20 text-slate-400 dark:text-slate-500 font-semibold">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCcw size={20} className="animate-spin text-slate-900 dark:text-white" />
                                            <span>Loading parking history...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20 text-slate-400 dark:text-slate-500 italic font-semibold text-sm">
                                        No activity history found or no data matches the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                activities.map((log, index) => (
                                    <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 transition-all duration-150 group cursor-default">
                                        <td className="py-3.5 pl-2 font-mono font-bold text-slate-900 dark:text-white text-sm tracking-wide">
                                            {log.licensePlateIn || log.license_plate || "—"}
                                        </td>
                                        <td className="py-3.5 text-xs font-semibold tracking-wide">
                                            {String(log.vehicleTypeId || log.vehicle_type) === "2" ? "Car" : "Motorbike"}
                                        </td>
                                        <td className="py-3.5 font-mono text-amber-700 dark:text-amber-500 font-bold text-sm group-hover:translate-x-0.5 transition-transform origin-left">
                                            {log.zoneName || log.zone_name || "—"}
                                        </td>
                                        <td className="py-3.5 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                                            {log.checkInTime || log.check_in_time ? new Date(log.checkInTime || log.check_in_time).toLocaleString("en-US") : "—"}
                                        </td>
                                        <td className="py-3.5 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                                            {log.checkOutTime || log.check_out_time ? new Date(log.checkOutTime || log.check_out_time).toLocaleString("en-US") : "—"}
                                        </td>
                                        <td className="py-3.5">
                                            <span className={`inline-flex text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border transition-all ${log.status?.toUpperCase() === "COMPLETED"
                                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30"
                                                : log.status?.toUpperCase() === "ACTIVE"
                                                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30"
                                                    : log.status?.toUpperCase() === "LOST_TICKET" || log.status?.toUpperCase() === "LOST-TICKET"
                                                        ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                                }`}>
                                                {log.status || "UNKNOWN"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-right pr-2 font-mono font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all">
                                            {log.totalFee !== undefined && log.totalFee !== null ? `${log.totalFee.toLocaleString()} VND` :
                                                log.total_fee !== undefined && log.total_fee !== null ? `${log.total_fee.toLocaleString()} VND` : "0 VND"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 font-semibold">
                    <button
                        onClick={() => fetchHistoryData(currentPage)}
                        disabled={isLoading}
                        className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:border-slate-800 dark:hover:border-slate-400 rounded-md px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>

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
                            <span className="font-bold text-slate-800 dark:text-white">Trang {currentPage}</span>
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
        </div>
    );
}