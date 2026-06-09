import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Filter, Calendar, RefreshCcw, CarFront, Info, 
    Search, ChevronLeft, ChevronRight, FileText
} from "lucide-react";

const API_BASE_URL = "http://localhost:5077/api/v1/parking";

export default function HistoryPage() {
    // Dữ liệu và trạng thái tải
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // State bộ lọc (Filters)
    const [filterPlate, setFilterPlate] = useState("");
    const [filterVehicleType, setFilterVehicleType] = useState("");
    const [filterFromDate, setFilterFromDate] = useState("");
    const [filterToDate, setFilterToDate] = useState("");

    // State phân trang (Pagination)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15); // Hiển thị 15 bản ghi trên một trang độc lập
    const [totalRecords, setTotalRecords] = useState(0);

    // Hàm gọi API lấy dữ liệu lịch sử
    const fetchHistoryData = async () => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const params = {
                LicensePlate: filterPlate || undefined,
                VehicleType: filterVehicleType || undefined,
                FromDate: filterFromDate || undefined,
                ToDate: filterToDate || undefined,
                Page: currentPage,
                PageSize: pageSize
            };

            const response = await axios.get(`${API_BASE_URL}/history`, { params });
            
            if (response.data && response.data.success) {
                setActivities(response.data.data || []);
                // Cập nhật tổng số bản ghi từ backend để tính số trang (nếu API có trả về, mặc định fallback nếu không có)
                setTotalRecords(response.data.totalCount || response.data.totalRecords || (response.data.data?.length || 0));
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

    // Kích hoạt gọi API khi bộ lọc thay đổi hoặc chuyển trang
    useEffect(() => {
        fetchHistoryData();
    }, [currentPage, filterVehicleType, filterFromDate, filterToDate]);

    // Reset trang về 1 khi người dùng gõ tìm kiếm biển số xe để tránh lỗi lệch trang
    const handlePlateSearchChange = (e) => {
        setFilterPlate(e.target.value.toUpperCase());
        setCurrentPage(1);
    };

    // Hàm dọn dẹp tất cả bộ lọc về mặc định
    const handleResetFilters = () => {
        setFilterPlate("");
        setFilterVehicleType("");
        setFilterFromDate("");
        setFilterToDate("");
        setCurrentPage(1);
    };

    // Tính toán tổng số trang
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    return (
        <div className="w-full text-[#0f172a] h-full flex flex-col gap-5 overflow-hidden">
            
             

            {/* THÀNH PHẦN 2: THANH BỘ LỌC TÌM KIẾM (FILTERS) */}
            <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">Filter</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Tìm kiếm biển số */}
                    <div className="relative flex items-center">
                        <Search size={14} className="absolute left-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Enter license plate..."
                            value={filterPlate}
                            onChange={handlePlateSearchChange}
                            className="border border-slate-200 rounded-md pl-9 pr-3 py-1.5 bg-slate-50 font-mono text-xs w-44 focus:outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:font-sans"
                        />
                    </div>

                    {/* Lọc loại xe */}
                    <select
                        value={filterVehicleType}
                        onChange={(e) => { setFilterVehicleType(e.target.value); setCurrentPage(1); }}
                        className="border border-slate-200 rounded-md px-3 py-1.5 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-slate-900 text-slate-700 cursor-pointer"
                    >
                        <option value="">All vehicles</option>
                        <option value="1">Motorbike</option>
                        <option value="2">Car</option>
                    </select>

                    {/* Từ ngày */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                        <span className="text-[10px] uppercase font-black text-slate-400">From</span>
                        <Calendar size={13} className="text-slate-400" />
                        <input
                            type="date"
                            value={filterFromDate}
                            onChange={(e) => { setFilterFromDate(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                        />
                    </div>

                    {/* Đến ngày */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                        <span className="text-[10px] uppercase font-black text-slate-400">To</span>
                        <Calendar size={13} className="text-slate-400" />
                        <input
                            type="date"
                            value={filterToDate}
                            onChange={(e) => { setFilterToDate(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                        />
                    </div>

                    {/* Nút Xoá bộ lọc nhanh */}
                    {(filterPlate || filterVehicleType || filterFromDate || filterToDate) && (
                        <button
                            onClick={handleResetFilters}
                            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline px-2"
                        >
                            Delete Filters
                        </button>
                    )}
                </div>
            </div>

            

            {/* THÀNH PHẦN 3: KHU VỰC HIỂN THỊ BẢNG DỮ LIỆU */}
            <div className="bg-white border border-slate-200 rounded-md p-5 flex-1 min-h-0 flex flex-col shadow-sm overflow-hidden">
                
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-md flex items-center gap-2 shrink-0 animate-fade-in">
                        <Info size={14} />
                        {errorMessage}
                    </div>
                )}

                {/* VIEWPORT CUỘN CHO BẢNG */}
                <div className="overflow-y-auto flex-1 min-h-0 relative">
                    <table className="w-full text-left text-xs border-collapse relative">
                        <thead>
                            <tr className="text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
                                <th className="pb-3 font-black pl-2">License Plate</th>
                                <th className="pb-3 font-black">Type</th>
                                <th className="pb-3 font-black">Slot</th>
                                <th className="pb-3 font-black">Check-in Time</th>
                                <th className="pb-3 font-black">Check-out Time</th>
                                <th className="pb-3 font-black">Status</th>
                                <th className="pb-3 font-black text-right pr-2">Total Fee</th>
                            </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20 text-slate-400 font-semibold">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCcw size={20} className="animate-spin text-slate-900" />
                                            <span>Loading parking history...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20 text-slate-400 italic font-semibold text-sm">
                                            No activity history found or no data matches the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                activities.map((log, index) => (
                                    <tr key={index} className="hover:bg-slate-50/80 border-b border-slate-100 transition-all duration-150 group cursor-default">
                                        
                                        {/* Biển số xe */}
                                        <td className="py-3.5 pl-2 font-mono font-black text-slate-900 text-sm tracking-wide">
                                            {log.license_plate}
                                        </td>

                                        {/* Phân loại xe */}
                                        <td className="py-3.5 text-xs font-bold text-slate-700 tracking-wide">
                                            {String(log.vehicle_type) === "2" ? "Car" : "Motorbike"}
                                        </td>

                                        {/* Vị trí đỗ */}
                                        <td className="py-3.5 font-mono text-amber-700 font-extrabold text-sm group-hover:translate-x-0.5 transition-transform origin-left">
                                            {log.slot_number || "—"}
                                        </td>

                                        {/* Giờ vào */}
                                        <td className="py-3.5 text-slate-800 font-mono text-[11px]">
                                            {log.check_in_time ? new Date(log.check_in_time).toLocaleString("en-US") : "—"}
                                        </td>

                                        {/* Giờ ra */}
                                        <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                                            {log.check_out_time ? new Date(log.check_out_time).toLocaleString("en-US") : "—"}
                                        </td>

                                        {/* Trạng thái phiên gửi */}
                                        <td className="py-3.5">
                                            <span className={`inline-flex text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border transition-all ${
                                                log.status?.toUpperCase() === "COMPLETED" || log.status?.toUpperCase() === "PAID"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : log.status?.toUpperCase() === "ACTIVE" || !log.check_out_time
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-slate-100 text-green-600 border-green-200"
                                            }`}>
                                                {log.status || (log.check_out_time ? "Completed" : "Active")}
                                            </span>
                                        </td>

                                        {/* Chi phí */}
                                        <td className="py-3.5 text-right pr-2 font-mono font-black text-slate-900 group-hover:text-emerald-600 transition-all">
                                            {log.total_fee !== undefined && log.total_fee !== null ? `${log.total_fee.toLocaleString()} VND` : "0 VND"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* THÀNH PHẦN 4: KHU VỰC PHÂN TRANG CHUYÊN NGHIỆP (PAGINATION) */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0 font-medium">
                    <button
                        onClick={fetchHistoryData}
                        disabled={isLoading}
                        className="flex items-center gap-2 border border-slate-200 hover:border-slate-800 rounded-md px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        {/* Hiển thị số trang hiện tại / Tổng số trang */}
                        <div className="flex items-center gap-1 px-1">
                            <span className="font-bold text-slate-800">Trang {currentPage}</span>
                            <span>/</span>
                            <span className="text-slate-400">{totalPages}</span>
                        </div>

                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || isLoading}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}