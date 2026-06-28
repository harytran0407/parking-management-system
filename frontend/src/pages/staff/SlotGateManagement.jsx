import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { toast } from "sonner";
import {
  Grid, RefreshCw, Settings, Sliders, BatteryCharging, Accessibility,
  Car, Layers, Trash2, Activity, ParkingSquare, Wrench, CheckCircle2,
  Calendar, ChevronLeft, ChevronRight, Users
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

const t = {
  vi: {
    allFloors: "Tất cả các tầng",
    floorLabel: "Tầng",
    totalSlots: "Tổng số ô",
    available: "Còn trống",
    occupied: "Có xe",
    reserved: "Đã đặt",
    maintenance: "Bảo trì",
    filters: "Bộ lọc",
    allVehicles: "Tất cả loại xe",
    motorbike: "Xe máy",
    car: "Ô tô",
    allStatuses: "Tất cả trạng thái",
    refresh: "Làm mới",
    clearFilters: "Xóa bộ lọc",
    slotMap: "Sơ đồ ô đỗ",
    selectedCount: "đã chọn",
    clickSelect: "Click để chọn",
    loadingSlots: "Đang tải danh sách ô đỗ...",
    noSlots: "Không tìm thấy ô đỗ phù hợp với bộ lọc.",
    page: "Trang",
    updateStatusTitle: "Cập nhật trạng thái ô đỗ",
    selectedSlot: "Ô đỗ đã chọn",
    changeStatusLabel: "Đổi trạng thái thành",
    reopenSlotOpt: "AVAILABLE",
    reopenSlotsOpt: "AVAILABLE",
    maintenanceOpt: "MAINTENANCE",
    estDurationLabel: "Thời gian dự kiến (phút)",
    reasonLabel: "Lý do",
    reasonMaintPlaceholder: "vd: Hỏng cảm biến, vệ sinh...",
    reasonAvailPlaceholder: "vd: Đã sửa xong, giải phóng ô đỗ...",
    reasonBulkPlaceholder: "vd: Bảo trì định kỳ hàng loạt...",
    cancelBtn: "Hủy (Esc)",
    saving: "Đang lưu...",
    confirmUpdate: "Xác nhận cập nhật",
    bulkUpdateTitle: "Cập nhật hàng loạt ô đỗ",
    slotsSelectedLabel: "ô đỗ đã chọn",
    confirmBulkUpdateBtn: "Xác nhận cập nhật",
    loadingStats: "Đang tải thống kê phân khu...",
    errorLoadSlots: "Không thể tải danh sách ô đỗ.",
    toastUpdatingSlot: "Đang cập nhật ô",
    toastUpdateSuccess: "Cập nhật thành công ô",
    toastUpdateError: "Lỗi cập nhật trạng thái.",
    toastBulkUpdating: "Đang cập nhật",
    toastBulkSuccess: "Cập nhật thành công",
    toastBulkError: "Lỗi cập nhật hàng loạt.",
    cannotMaintainCapacitySingle: "Không thể bảo trì ô này vì xe đang đỗ/đã đặt.",
    cannotMaintainCapacityBulk: "Không thể bảo trì các ô này vì xe đang đỗ/đã đặt.",
    warningLowCapacitySingle: "Cảnh báo: Bảo trì ô này sẽ khiến phân khu chỉ còn {count} ô trống khả dụng.",
    warningLowCapacityBulk: "Cảnh báo: Bảo trì các ô này sẽ khiến phân khu chỉ còn {count} ô trống khả dụng.",
  },
  en: {
    allFloors: "All Floors",
    floorLabel: "Floor",
    totalSlots: "Total Slots",
    available: "Available",
    occupied: "Occupied",
    reserved: "Reserved",
    maintenance: "Maintenance",
    filters: "Filters",
    allVehicles: "All Vehicles",
    motorbike: "Motorbike",
    car: "Car",
    allStatuses: "All Statuses",
    refresh: "Refresh",
    clearFilters: "Clear Filters",
    slotMap: "Slot Map",
    selectedCount: "selected",
    clickSelect: "Click to select",
    loadingSlots: "Loading parking slots...",
    noSlots: "No slots found for selected filters.",
    page: "Page",
    updateStatusTitle: "Update Slot Status",
    selectedSlot: "Selected Slot",
    changeStatusLabel: "Change Status To",
    reopenSlotOpt: "AVAILABLE",
    reopenSlotsOpt: "AVAILABLE",
    maintenanceOpt: "MAINTENANCE",
    estDurationLabel: "Estimated Duration (minutes)",
    reasonLabel: "Reason",
    reasonMaintPlaceholder: "e.g. Damaged sensor, cleaning...",
    reasonAvailPlaceholder: "e.g. Maintenance completed...",
    reasonBulkPlaceholder: "e.g. Bulk scheduled maintenance...",
    cancelBtn: "Cancel (Esc)",
    saving: "Saving...",
    confirmUpdate: "Confirm Update",
    bulkUpdateTitle: "Bulk Update Slots",
    slotsSelectedLabel: "Slots Selected",
    confirmBulkUpdateBtn: "Confirm Update",
    loadingStats: "Loading Zone stats...",
    errorLoadSlots: "Failed to load parking slots.",
    toastUpdatingSlot: "Updating slot",
    toastUpdateSuccess: "Successfully updated slot",
    toastUpdateError: "Failed to update status.",
    toastBulkUpdating: "Updating",
    toastBulkSuccess: "Successfully updated",
    toastBulkError: "Failed to bulk update status.",
    cannotMaintainCapacitySingle: "Cannot place this slot under maintenance because this slot is OCCUPIED or RESERVED.",
    cannotMaintainCapacityBulk: "Cannot place these slots under maintenance because this slot is OCCUPIED or RESERVED.",
    warningLowCapacitySingle: "Warning: Putting this slot under maintenance will leave only {count} available slot(s) in this zone.",
    warningLowCapacityBulk: "Warning: Putting these slots under maintenance will leave only {count} available slot(s) in this zone.",
  }
};

// ─── Zone Header Card ────────────────────────────────────────────────────────
function ZoneHeaderCard({ zone }) {
  const { language } = useLanguage();
  const {
    zoneName, capacity, occupiedCount, bookedCount,
    maintenanceCount, isAggregate, floorNumber
  } = zone;

  // Tính lại available từ thực tế để tránh drift của counter trong DB
  const computedAvailable = Math.max(0, capacity - occupiedCount - bookedCount - maintenanceCount);
  const totalCalculated = computedAvailable + occupiedCount + bookedCount + maintenanceCount;
  // Hàm tính phần trăm dựa trên capacity của zone
  const getPercentage = (val) => capacity > 0 ? ((val / capacity) * 100).toFixed(1) : 0;

  // Tự động chuyển đổi tiêu đề: Nếu là card tổng hợp (isAggregate) thì hiển thị "All Floors", ngược lại hiển thị tầng tương ứng
  const displayTitle = isAggregate ? t[language].allFloors : `${t[language].floorLabel} ${floorNumber}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-4">

      {/* 1. Header Title Row */}
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-blue-500" />
        <span className="font-bold text-slate-900 dark:text-white text-sm">
          {displayTitle}
        </span>

        {/* Hiển thị phân khu (Zone) nếu có và không phải là tổng hợp toàn bộ */}
        {!isAggregate && zoneName && (
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 rounded-full">
            {zoneName}
          </span>
        )}
      </div>

      {/* 2. 5-Column Grid Stats Layout */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Slots */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{t[language].totalSlots}</span>
          <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white ">
            {capacity}
          </span>
        </div>

        {/* Available */}
        <div className="p-3 bg-emerald-100/100 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">
            {t[language].available} ({getPercentage(computedAvailable)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 ">
            {computedAvailable}
          </span>
        </div>

        {/* Occupied */}
        <div className="p-3 bg-red-100/100 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-red-500 uppercase block mb-1">
            {t[language].occupied} ({getPercentage(occupiedCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 ">
            {occupiedCount}
          </span>
        </div>

        {/* Booked / Reserved */}
        <div className="p-3 bg-amber-100/100 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-amber-500 uppercase block mb-1">
            {t[language].reserved} ({getPercentage(bookedCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 ">
            {bookedCount}
          </span>
        </div>

        {/* Maintenance */}
        <div className="p-3 bg-slate-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center col-span-2 md:col-span-1 flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
            {t[language].maintenance} ({getPercentage(maintenanceCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-slate-600 dark:text-slate-400 ">
            {maintenanceCount}
          </span>
        </div>
      </div>

      {/* 3. Multi-color Progress Bar */}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
        {computedAvailable > 0 && (
          <div
            style={{ width: `${(computedAvailable / totalCalculated) * 100}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`${t[language].available}: ${computedAvailable}`}
          />
        )}
        {occupiedCount > 0 && (
          <div
            style={{ width: `${(occupiedCount / totalCalculated) * 100}%` }}
            className="bg-red-500 transition-all duration-500"
            title={`${t[language].occupied}: ${occupiedCount}`}
          />
        )}
        {bookedCount > 0 && (
          <div
            style={{ width: `${(bookedCount / totalCalculated) * 100}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`${t[language].reserved}: ${bookedCount}`}
          />
        )}
        {maintenanceCount > 0 && (
          <div
            style={{ width: `${(maintenanceCount / totalCalculated) * 100}%` }}
            className="bg-slate-400 dark:bg-slate-500 transition-all duration-500"
            title={`${t[language].maintenance}: ${maintenanceCount}`}
          />
        )}
      </div>

    </div>
  );
}



// ─── Slot Card ───────────────────────────────────────────────────────────────
function SlotCard({ slot, isSelected, onClick }) {
  const { language } = useLanguage();
  const isAvailable = slot.status === "AVAILABLE";
  const isMaintenance = slot.status === "MAINTENANCE";
  const isOccupied = slot.status === "OCCUPIED";
  const isReserved = slot.status === "RESERVED";

  let cardClasses = "";

  if (isAvailable) {
    cardClasses = "bg-emerald-600 dark:bg-emerald-700 border-transparent text-white";
  } else if (isMaintenance) {
    cardClasses = "bg-slate-500 dark:bg-slate-600 border-transparent text-white";
  } else if (isOccupied) {
    cardClasses = "bg-rose-600 dark:bg-rose-700 border-transparent text-white";
  } else if (isReserved) {
    cardClasses = "bg-amber-500 dark:bg-amber-600 border-transparent text-white";
  } else {
    cardClasses = "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200";
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 border rounded-lg cursor-pointer transition-all duration-150 select-none
        ${cardClasses}
        ${isSelected
          ? "ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-[0.97] shadow-lg"
          : "hover:scale-[1.03] hover:shadow-md"
        }
      `}
    >
      <div className="flex justify-between items-start">
        <span className="text-sm font-bold truncate">{slot.slot_name}</span>
        <div className="flex items-center gap-0.5 ml-1 shrink-0">
          {slot.is_electric_charging && (
            <BatteryCharging size={11} className={isAvailable ? "text-teal-200" : isOccupied ? "text-rose-200" : "text-amber-200"} title="EV Charging" />
          )}
          {slot.is_handicap && (
            <Accessibility size={11} className={isAvailable ? "text-indigo-200" : isOccupied ? "text-rose-200" : "text-amber-200"} title="Accessible" />
          )}
        </div>
      </div>

      {isMaintenance && (
        <div className="mt-1.5 flex items-center gap-1">
          <Wrench size={10} className="text-slate-300" />
          <span className="text-[10px] font-semibold text-slate-200">{t[language].maintenance}</span>
        </div>
      )}

      {isAvailable && (
        <div className="mt-1.5 flex items-center gap-1">
          <CheckCircle2 size={10} className="text-emerald-200" />
          <span className="text-[10px] font-semibold text-emerald-100">{t[language].available}</span>
        </div>
      )}

      {isOccupied && (
        <div className="mt-1.5 flex items-center gap-1">
          <Car size={10} className="text-rose-200" />
          <span className="text-[10px] font-semibold text-rose-100">{t[language].occupied}</span>
        </div>
      )}

      {isReserved && (
        <div className="mt-1.5 flex items-center gap-1">
          <Calendar size={10} className="text-amber-200" />
          <span className="text-[10px] font-semibold text-amber-100">{t[language].reserved}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SlotGateManagementPage() {
  const { language } = useLanguage();

  // Filter State
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Data State
  const [slotsData, setSlotsData] = useState([]);
  const [zoneStats, setZoneStats] = useState([]);

  // ── Virtual Slot Mapping ───────────────────────────────────────────────
  const mappedSlots = React.useMemo(() => {
    // 1. Group slots by zone
    const slotsByZone = {};
    slotsData.forEach(slot => {
      const zName = slot.zone || "N/A";
      if (!slotsByZone[zName]) {
        slotsByZone[zName] = [];
      }
      slotsByZone[zName].push({ ...slot });
    });

    // 2. For each zone, virtually assign OCCUPIED and RESERVED to AVAILABLE slots
    Object.keys(slotsByZone).forEach(zName => {
      const zoneStat = zoneStats.find(z => (z.zone_name ?? z.zoneName) === zName);
      if (!zoneStat) return;

      const occupiedCount = zoneStat.occupied_count ?? zoneStat.occupiedCount ?? 0;
      const bookedCount = zoneStat.booked_count ?? zoneStat.bookedCount ?? 0;

      let occupiedAssigned = 0;
      let bookedAssigned = 0;

      // Filter slots in this zone that have status === "AVAILABLE"
      const availableSlots = slotsByZone[zName].filter(s => s.status === "AVAILABLE");

      availableSlots.forEach(slot => {
        if (occupiedAssigned < occupiedCount) {
          slot.status = "OCCUPIED";
          occupiedAssigned++;
        } else if (bookedAssigned < bookedCount) {
          slot.status = "RESERVED";
          bookedAssigned++;
        }
      });
    });

    // 3. Return flattened array maintaining original order
    return slotsData.map(slot => {
      const zoneGroup = slotsByZone[slot.zone || "N/A"] || [];
      const found = zoneGroup.find(s => s.slot_id === slot.slot_id);
      return found || slot;
    });
  }, [slotsData, zoneStats]);

  const filteredMappedSlots = React.useMemo(() => {
    if (!selectedStatus) return mappedSlots;
    return mappedSlots.filter(s => s.status === selectedStatus);
  }, [mappedSlots, selectedStatus]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30);
  const [totalPages, setTotalPages] = useState(1);

  // Selection State
  const [activeSlot, setActiveSlot] = useState(null);
  const [newSlotStatus, setNewSlotStatus] = useState("MAINTENANCE");
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [estDuration, setEstDuration] = useState(60);

  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("MAINTENANCE");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkEstDuration, setBulkEstDuration] = useState(60);

  // Loading States
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isFetchingZones, setIsFetchingZones] = useState(false);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const isBulkMode = selectedSlotIds.length > 1;

  // ── Capacity Guard Calculations ──────────────────────────────────────────
  const singleCheck = React.useMemo(() => {
    if (!activeSlot || newSlotStatus !== "MAINTENANCE" || activeSlot.status === "MAINTENANCE") {
      return { allowed: true, remaining: 0, warning: false };
    }
    const zoneStat = zoneStats.find(z => (z.zone_name ?? z.zoneName) === activeSlot.zone);
    if (!zoneStat) return { allowed: true, remaining: 0, warning: false };

    // Tính available từ thực tế để tránh drift
    const cap = zoneStat.capacity ?? 0;
    const occ = zoneStat.occupied_count ?? zoneStat.occupiedCount ?? 0;
    const bkd = zoneStat.booked_count ?? zoneStat.bookedCount ?? 0;
    const mnt = zoneStat.maintenance_count ?? zoneStat.maintenanceCount ?? 0;
    const computedAvail = Math.max(0, cap - occ - bkd - mnt);
    const remaining = computedAvail - 1;
    return {
      allowed: remaining >= 0,
      remaining,
      warning: remaining <= 1
    };
  }, [activeSlot, newSlotStatus, zoneStats]);

  const bulkCheck = React.useMemo(() => {
    if (!isBulkMode || bulkStatus !== "MAINTENANCE") {
      return { allowed: true, violatedZones: [], remainingByZone: {}, warning: false };
    }

    const selectedSlots = selectedSlotIds.map(id => mappedSlots.find(s => s.slot_id === id)).filter(Boolean);
    const maintainCountByZone = {};
    selectedSlots.forEach(slot => {
      if (slot.status !== "MAINTENANCE") {
        const zName = slot.zone || "N/A";
        maintainCountByZone[zName] = (maintainCountByZone[zName] || 0) + 1;
      }
    });

    const violatedZones = [];
    const remainingByZone = {};
    let isWarning = false;

    Object.keys(maintainCountByZone).forEach(zName => {
      const zoneStat = zoneStats.find(z => (z.zone_name ?? z.zoneName) === zName);
      // Tính available từ thực tế để tránh drift
      const cap = zoneStat ? (zoneStat.capacity ?? 0) : 0;
      const occ = zoneStat ? (zoneStat.occupied_count ?? zoneStat.occupiedCount ?? 0) : 0;
      const bkd = zoneStat ? (zoneStat.booked_count ?? zoneStat.bookedCount ?? 0) : 0;
      const mnt = zoneStat ? (zoneStat.maintenance_count ?? zoneStat.maintenanceCount ?? 0) : 0;
      const avail = Math.max(0, cap - occ - bkd - mnt);
      const count = maintainCountByZone[zName];
      const remaining = avail - count;
      remainingByZone[zName] = remaining;

      if (remaining < 0) {
        violatedZones.push({ zone: zName, available: avail, requested: count });
      } else if (remaining <= 1) {
        isWarning = true;
      }
    });

    return {
      allowed: violatedZones.length === 0,
      violatedZones,
      remainingByZone,
      warning: isWarning
    };
  }, [isBulkMode, bulkStatus, selectedSlotIds, mappedSlots, zoneStats]);

  // ── Fetch Zone Stats ──────────────────────────────────────────────────────
  const fetchZoneStats = useCallback(async () => {
    setIsFetchingZones(true);
    try {
      const response = await api.get("/parking/zones/stats");
      if (Array.isArray(response.data)) {
        setZoneStats(response.data);
      }
    } catch (err) {
      console.error("Fetch Zone Stats Error:", err);
    } finally {
      setIsFetchingZones(false);
    }
  }, []);

  // ── Fetch Slots ───────────────────────────────────────────────────────────
  const fetchSlots = useCallback(async () => {
    setIsFetchingSlots(true);
    try {
      const response = await api.get("/parking/slots", {
        params: {
          floor: selectedFloor || undefined,
          zone: selectedZone || undefined,
          vehicle_type_id: selectedVehicleType ? Number(selectedVehicleType) : undefined,
          status: (selectedStatus === "OCCUPIED" || selectedStatus === "RESERVED")
            ? "AVAILABLE"
            : (selectedStatus || undefined),
          page: currentPage,
          page_size: pageSize,
        },
      });

      if (response.data.success) {
        setSlotsData(response.data.data.slots);
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.total_pages || 1);
        }
      }
    } catch (err) {
      console.error("Fetch Slots Error:", err);
      toast.error(err.response?.data?.message || t[language].errorLoadSlots);
    } finally {
      setIsFetchingSlots(false);
    }
  }, [selectedFloor, selectedZone, selectedVehicleType, selectedStatus, currentPage, pageSize, language]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSlots();
    fetchZoneStats();
  }, [fetchSlots, fetchZoneStats]);

  useEffect(() => {
    if (newSlotStatus === "AVAILABLE") setEstDuration(0);
    else if (newSlotStatus === "MAINTENANCE") setEstDuration(60);
  }, [newSlotStatus]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Escape" || e.key === "Esc") && (activeSlot || selectedSlotIds.length)) {
        handleCancelSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlot, selectedSlotIds]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "floor") setSelectedFloor(value);
    if (filterType === "zone") setSelectedZone(value);
    if (filterType === "vehicleType") setSelectedVehicleType(value);
    if (filterType === "status") setSelectedStatus(value);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setSelectedFloor("");
    setSelectedZone("");
    setSelectedVehicleType("");
    setSelectedStatus("");
  };

  const handleCancelSelection = () => {
    setActiveSlot(null);
    setSelectedSlotIds([]);
    setMaintenanceReason("");
    setEstDuration(60);
    setBulkReason("");
    setBulkEstDuration(60);
  };

  const handleSlotClick = (slot) => {
    if (selectedSlotIds.includes(slot.slot_id)) {
      const next = selectedSlotIds.filter((id) => id !== slot.slot_id);
      setSelectedSlotIds(next);

      // Single slot fallback
      const nextActive = next.length === 1 ? mappedSlots.find((x) => x.slot_id === next[0]) || null : null;
      setActiveSlot(nextActive);
      if (nextActive) setNewSlotStatus(nextActive.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE");

      // Bulk default: nếu tất cả slot còn lại đều là MAINTENANCE → AVAILABLE
      if (next.length > 1) {
        const nextSlots = next.map(id => mappedSlots.find(s => s.slot_id === id)).filter(Boolean);
        const allMaint = nextSlots.every(s => s.status === "MAINTENANCE");
        setBulkStatus(allMaint ? "AVAILABLE" : "MAINTENANCE");
      }
    } else {
      const next = [...selectedSlotIds, slot.slot_id];
      setSelectedSlotIds(next);

      // Single slot
      const nextActive = next.length === 1 ? slot : null;
      setActiveSlot(nextActive);
      if (nextActive) setNewSlotStatus(slot.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE");

      // Bulk default: nếu tất cả slot đã chọn đều là MAINTENANCE → AVAILABLE
      if (next.length > 1) {
        const nextSlots = next.map(id => id === slot.slot_id ? slot : mappedSlots.find(s => s.slot_id === id)).filter(Boolean);
        const allMaint = nextSlots.every(s => s.status === "MAINTENANCE");
        setBulkStatus(allMaint ? "AVAILABLE" : "MAINTENANCE");
      }
    }
  };

  const handleUpdateSlotStatus = async (e) => {
    if (e) e.preventDefault();
    if (!activeSlot) return;
    setIsUpdatingSlot(true);
    const toastId = toast.loading(`${t[language].toastUpdatingSlot} ${activeSlot.slot_name}...`);
    try {
      await api.put(`/parking/slots/${activeSlot.slot_id}/status`, {
        status: newSlotStatus,
        reason: maintenanceReason,
        estimated_duration_minutes: Number(estDuration),
      });
      toast.success(`${t[language].toastUpdateSuccess} ${activeSlot.slot_name} → [${newSlotStatus}].`, { id: toastId });
      setActiveSlot(null);
      setSelectedSlotIds([]);
      setMaintenanceReason("");
      setEstDuration(60);
      await Promise.all([fetchSlots(), fetchZoneStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || t[language].toastUpdateError, { id: toastId });
    } finally {
      setIsUpdatingSlot(false);
    }
  };

  const handleBulkUpdateSlotStatus = async (e) => {
    if (e) e.preventDefault();
    if (selectedSlotIds.length === 0) return;
    setIsBulkUpdating(true);
    const toastId = toast.loading(`${t[language].toastBulkUpdating} ${selectedSlotIds.length} ${t[language].slotsSelectedLabel}...`);
    try {
      await api.put("/parking/slots/bulk-status", {
        slot_ids: selectedSlotIds,
        status: bulkStatus,
        reason: bulkReason,
        estimated_duration_minutes: Number(bulkEstDuration),
      });
      toast.success(`${t[language].toastBulkSuccess} ${selectedSlotIds.length} ${t[language].slotsSelectedLabel} → [${bulkStatus}].`, { id: toastId });
      setSelectedSlotIds([]);
      setActiveSlot(null);
      setBulkReason("");
      setBulkEstDuration(60);
      await Promise.all([fetchSlots(), fetchZoneStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || t[language].toastBulkError, { id: toastId });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const hasActiveFilters = selectedFloor || selectedVehicleType || selectedStatus || selectedZone;

  // ── Unique zones list from stats (for zone filter dropdown) ───────────────
  const zoneOptions = zoneStats.map((z) => ({ id: z.zone_id ?? z.zoneId, name: z.zone_name ?? z.zoneName }));

  // ── Lọc zone theo filter đang active ────────────────────────────────────
  const hasHeaderFilter = selectedFloor || selectedVehicleType || selectedZone;

  const filteredZoneStats = zoneStats.filter((z) => {
    const name = z.zone_name ?? z.zoneName ?? "";
    const floor = z.floor_number ?? z.floorNumber;
    const vtId = z.vehicle_type_id ?? z.vehicleTypeId;
    if (selectedZone && name !== selectedZone) return false;
    if (selectedFloor && String(floor) !== selectedFloor) return false;
    if (selectedVehicleType && String(vtId) !== selectedVehicleType) return false;
    return true;
  });

  // Khi không có filter → gộp tất cả zones thành 1 card tổng
  const aggregatedZone = !hasHeaderFilter && zoneStats.length > 0 ? (() => {
    const cap = zoneStats.reduce((s, z) => s + (z.capacity ?? 0), 0);
    const occ = zoneStats.reduce((s, z) => s + (z.occupied_count ?? z.occupiedCount ?? 0), 0);
    const bkd = zoneStats.reduce((s, z) => s + (z.booked_count ?? z.bookedCount ?? 0), 0);
    const mnt = zoneStats.reduce((s, z) => s + (z.maintenance_count ?? z.maintenanceCount ?? 0), 0);
    return {
      zoneId: "all",
      zoneName: "All Zones",
      floorNumber: null,
      capacity: cap,
      availableCapacity: Math.max(0, cap - occ - bkd - mnt),
      occupiedCount: occ,
      bookedCount: bkd,
      maintenanceCount: mnt,
      vehicleTypeName: null,
      isAggregate: true,
    };
  })() : null;

  // Khi có filter → chỉ hiển thị zone phù hợp; không filter → hiển thị 1 card tổng
  const displayZones = hasHeaderFilter ? filteredZoneStats : null;

  // ── Normalise keys (handle camelCase vs snake_case from API) ─────────────
  const normalizeZone = (z) => {
    const cap = z.capacity ?? 0;
    const occ = z.occupied_count ?? z.occupiedCount ?? 0;
    const bkd = z.booked_count ?? z.bookedCount ?? 0;
    const mnt = z.maintenance_count ?? z.maintenanceCount ?? 0;
    return {
      zoneId: z.zone_id ?? z.zoneId,
      zoneName: z.zone_name ?? z.zoneName ?? "—",
      floorNumber: z.floor_number ?? z.floorNumber ?? 0,
      capacity: cap,
      availableCapacity: Math.max(0, cap - occ - bkd - mnt),
      occupiedCount: occ,
      bookedCount: bkd,
      maintenanceCount: mnt,
      vehicleTypeName: z.vehicle_type_name ?? z.vehicleTypeName ?? "—",
    };
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-auto pb-12 space-y-4 font-sans antialiased text-slate-700 dark:text-slate-200">

      {/* ── SECTION 1: ZONE OVERVIEW HEADERS ── */}
      <div className="space-y-2">
        {isFetchingZones && zoneStats.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <RefreshCw size={14} className="animate-spin text-blue-500" />
            <span>{t[language].loadingStats}</span>
          </div>
        ) : !hasHeaderFilter && aggregatedZone ? (
          // Không có filter → hiển thị 1 card tổng hợp tất cả zones
          <ZoneHeaderCard zone={aggregatedZone} />
        ) : displayZones && displayZones.length > 0 ? (
          // Có filter → hiển thị từng zone phù hợp
          displayZones.map((z) => (
            <ZoneHeaderCard key={z.zone_id ?? z.zoneId} zone={normalizeZone(z)} />
          ))
        ) : null}
      </div>

      {/* ── SECTION 2: FILTER BAR ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mr-1 shrink-0">
          <Sliders size={15} className="text-blue-500" />
          {t[language].filters}
        </div>

        {/* Floor */}
        <select
          value={selectedFloor}
          onChange={(e) => handleFilterChange("floor", e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer"
        >
          <option value="">{t[language].allFloors}</option>
          <option value="1">{t[language].floorLabel} 1</option>
          <option value="2">{t[language].floorLabel} 2</option>
          <option value="3">{t[language].floorLabel} 3</option>
        </select>

        {/* Vehicle Type */}
        <select
          value={selectedVehicleType}
          onChange={(e) => handleFilterChange("vehicleType", e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer"
        >
          <option value="">{t[language].allVehicles}</option>
          <option value="1">{t[language].motorbike}</option>
          <option value="2">{t[language].car}</option>
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer"
        >
          <option value="">{t[language].allStatuses}</option>
          <option value="AVAILABLE">{t[language].available}</option>
          <option value="OCCUPIED">{t[language].occupied}</option>
          <option value="RESERVED">{t[language].reserved}</option>
          <option value="MAINTENANCE">{t[language].maintenance}</option>
        </select>

        {/* Refresh button */}
        <button
          onClick={() => { fetchSlots(); fetchZoneStats(); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-900/50 hover:bg-blue-600 dark:hover:bg-blue-900 rounded-lg transition-all shrink-0"
          title="Refresh data"
        >
          <RefreshCw size={13} className={isFetchingSlots || isFetchingZones ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{t[language].refresh}</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-600 dark:border-red-900/50 dark:hover:bg-red-900 rounded-lg transition-all shrink-0"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">{t[language].clearFilters}</span>
          </button>
        )}
      </div>

      {/* ── SECTION 3: MAIN WORKSPACE ── */}
      <div className={`flex flex-col gap-5 transition-all duration-300 ${(activeSlot || isBulkMode) ? "lg:grid lg:grid-cols-2" : ""}`}>

        {/* LEFT PANEL: SLOT GRID */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 md:p-5 shadow-sm flex flex-col min-h-[320px] md:min-h-[480px]">
          {/* Panel header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Grid size={15} className="text-blue-500" />
              {t[language].slotMap}
              {selectedFloor && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md flex items-center gap-1">
                  <Layers size={11} /> {t[language].floorLabel} {selectedFloor}
                </span>
              )}
            </h3>
            {selectedSlotIds.length > 0 && (
              <span className="text-xs font-bold px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                {selectedSlotIds.length} {t[language].selectedCount}
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              <span className="text-emerald-700 dark:text-emerald-400">{t[language].available}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-600 inline-block" />
              <span className="text-rose-700 dark:text-rose-400">{t[language].occupied}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
              <span className="text-amber-700 dark:text-amber-400">{t[language].reserved}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-500 inline-block" />
              <span className="text-slate-500 dark:text-slate-400">{t[language].maintenance}</span>
            </span>
            <span className="flex items-center gap-1.5 ml-auto text-slate-400 dark:text-slate-500">
              {t[language].clickSelect}
            </span>
          </div>

          {/* Grid */}
          <div className="flex-1">
            {isFetchingSlots && slotsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 gap-2">
                <RefreshCw size={22} className="animate-spin text-blue-500" />
                <span className="text-sm font-semibold">{t[language].loadingSlots}</span>
              </div>
            ) : slotsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <ParkingSquare size={32} className="mb-2 opacity-30" />
                <span className="text-sm">{t[language].noSlots}</span>
              </div>
            ) : (
              <div
                className={`grid gap-2.5 transition-all ${(activeSlot || isBulkMode)
                  ? "grid-cols-3 sm:grid-cols-4"
                  : "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7"
                  }`}
              >
                {mappedSlots.map((slot) => (
                  <SlotCard
                    key={slot.slot_id}
                    slot={slot}
                    isSelected={selectedSlotIds.includes(slot.slot_id) || activeSlot?.slot_id === slot.slot_id}
                    onClick={() => handleSlotClick(slot)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-slate-500">
                {t[language].page} {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: SINGLE SLOT UPDATE */}
        {!isBulkMode && activeSlot && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm flex flex-col min-h-[480px] animate-in fade-in slide-in-from-right-4 duration-200">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Settings size={15} className="text-blue-500" />
              {t[language].updateStatusTitle}
            </h3>

            <form onSubmit={handleUpdateSlotStatus} className="flex flex-col flex-1 gap-4">
              {/* Slot info */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-blue-500 uppercase block">{t[language].selectedSlot}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{activeSlot.slot_name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{activeSlot.zone} — {t[language].floorLabel} {activeSlot.floor}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${activeSlot.status === "AVAILABLE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                  : activeSlot.status === "MAINTENANCE"
                    ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    : activeSlot.status === "OCCUPIED"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
                  }`}>
                  {activeSlot.status === "AVAILABLE"
                    ? t[language].available
                    : activeSlot.status === "MAINTENANCE"
                      ? t[language].maintenance
                      : activeSlot.status === "OCCUPIED"
                        ? t[language].occupied
                        : t[language].reserved}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {/* Change to */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].changeStatusLabel}</label>
                  <select
                    value={newSlotStatus}
                    onChange={(e) => setNewSlotStatus(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="AVAILABLE">{t[language].reopenSlotOpt}</option>
                    <option value="MAINTENANCE">{t[language].maintenanceOpt}</option>
                  </select>
                </div>

                {/* Capacity warning / blocker banner */}
                {newSlotStatus === "MAINTENANCE" && activeSlot.status !== "MAINTENANCE" && (
                  <div className="animate-in fade-in duration-200">
                    {activeSlot.status === "OCCUPIED" || activeSlot.status === "RESERVED" ? (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                        {t[language].cannotMaintainCapacitySingle}
                      </div>
                    ) : !singleCheck.allowed ? (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                        {t[language].cannotMaintainCapacitySingle}
                      </div>
                    ) : singleCheck.warning ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {t[language].warningLowCapacitySingle.replace("{count}", singleCheck.remaining)}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Duration (maintenance only) */}
                {newSlotStatus === "MAINTENANCE" && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].estDurationLabel}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={estDuration}
                      onChange={(e) => setEstDuration(Number(e.target.value))}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].reasonLabel}</label>
                  <input
                    type="text"
                    required
                    value={maintenanceReason}
                    onChange={(e) => setMaintenanceReason(e.target.value)}
                    placeholder={newSlotStatus === "MAINTENANCE" ? t[language].reasonMaintPlaceholder : t[language].reasonAvailPlaceholder}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs transition-all"
                >
                  {t[language].cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSlot || (newSlotStatus === "MAINTENANCE" && activeSlot.status !== "MAINTENANCE" && (activeSlot.status === "OCCUPIED" || activeSlot.status === "RESERVED" || !singleCheck.allowed))}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUpdatingSlot && <RefreshCw size={13} className="animate-spin" />}
                  {isUpdatingSlot ? t[language].saving : t[language].confirmUpdate}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RIGHT PANEL: BULK UPDATE */}
        {isBulkMode && selectedSlotIds.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm flex flex-col min-h-[480px] animate-in fade-in slide-in-from-right-4 duration-200">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <Settings size={15} className="text-blue-500" />
              {t[language].bulkUpdateTitle}
            </h3>

            <form onSubmit={handleBulkUpdateSlotStatus} className="flex flex-col flex-1 gap-4">
              {/* Selected slots */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                <span className="text-xs font-semibold text-blue-500 uppercase block mb-1">
                  {selectedSlotIds.length} {t[language].slotsSelectedLabel}
                </span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto mt-1">
                  {selectedSlotIds.map((id) => {
                    const s = mappedSlots.find((x) => x.slot_id === id);
                    return (
                      <span key={id} className="text-[10px] font-bold px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300">
                        {s?.slot_name || id}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].changeStatusLabel}</label>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="AVAILABLE">{t[language].reopenSlotsOpt}</option>
                    <option value="MAINTENANCE">{t[language].maintenanceOpt}</option>
                  </select>
                </div>

                {/* Capacity warning / blocker banner */}
                {bulkStatus === "MAINTENANCE" && (
                  <div className="animate-in fade-in duration-200">
                    {selectedSlotIds.map(id => mappedSlots.find(s => s.slot_id === id)).some(s => s && (s.status === "OCCUPIED" || s.status === "RESERVED")) ? (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                        {t[language].cannotMaintainCapacityBulk}
                      </div>
                    ) : !bulkCheck.allowed ? (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                        {t[language].cannotMaintainCapacityBulk}
                        {bulkCheck.violatedZones.map(vz => (
                          <div key={vz.zone} className="mt-1 font-bold">
                            • {vz.zone}: {t[language].available.toLowerCase()} {vz.available}, {t[language].slotsSelectedLabel.toLowerCase()} {vz.requested}
                          </div>
                        ))}
                      </div>
                    ) : bulkCheck.warning ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {t[language].warningLowCapacityBulk.replace("{count}",
                          Object.keys(bulkCheck.remainingByZone)
                            .map(z => `${z} (${bulkCheck.remainingByZone[z]} ${t[language].available.toLowerCase()})`)
                            .join(", ")
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Duration */}
                {bulkStatus === "MAINTENANCE" && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].estDurationLabel}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={bulkEstDuration}
                      onChange={(e) => setBulkEstDuration(Number(e.target.value))}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t[language].reasonLabel}</label>
                  <input
                    type="text"
                    required
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder={bulkStatus === "MAINTENANCE" ? t[language].reasonBulkPlaceholder : t[language].reasonAvailPlaceholder}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs transition-all"
                >
                  {t[language].cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isBulkUpdating || (bulkStatus === "MAINTENANCE" && (
                    !bulkCheck.allowed ||
                    selectedSlotIds.map(id => mappedSlots.find(s => s.slot_id === id)).some(s => s && (s.status === "OCCUPIED" || s.status === "RESERVED"))
                  ))}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isBulkUpdating && <RefreshCw size={13} className="animate-spin" />}
                  {isBulkUpdating ? t[language].saving : `${t[language].confirmBulkUpdateBtn} (${selectedSlotIds.length} ${t[language].slotsSelectedLabel})`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}