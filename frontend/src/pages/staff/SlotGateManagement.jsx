import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../utils/api";
import { toast } from "sonner";
import {
  Grid, RefreshCw, Settings, Sliders, BatteryCharging, Accessibility,
  Car, Layers, Activity, ParkingSquare, Wrench, CheckCircle2,
  Calendar, ChevronLeft, ChevronRight, ArrowLeft, Trash2
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
    reasonBulkPlaceholder: "vd: Hỏng cảm biến, vệ sinh...",
    cancelBtn: "Hủy (Esc)",
    saving: "Đang lưu...",
    confirmUpdate: "Xác nhận cập nhật",
    bulkUpdateTitle: "Cập nhật hàng loạt ô đỗ",
    slotsSelectedLabel: "ô đỗ đã chọn",
    confirmBulkUpdateBtn: "Cập nhật",
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
    floorOverview: "Tổng quan các tầng",
    backToOverview: "Quay lại tổng quan",
    totalCapacity: "Tổng sức chứa",
    occupiedRate: "Tỷ lệ sử dụng",
    viewDetails: "Xem chi tiết",
    noFloors: "Không tìm thấy dữ liệu tầng."
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
    reasonBulkPlaceholder: "e.g. Damaged sensor, cleaning...",
    cancelBtn: "Cancel (Esc)",
    saving: "Saving...",
    confirmUpdate: "Confirm Update",
    bulkUpdateTitle: "Update Slot Status",
    slotsSelectedLabel: "Slots Selected",
    confirmBulkUpdateBtn: "Update",
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
    floorOverview: "Floor Overview",
    backToOverview: "Back to Overview",
    totalCapacity: "Total Capacity",
    occupiedRate: "Occupancy Rate",
    viewDetails: "View Details",
    noFloors: "No floors found."
  }
};

// ─── Zone Header Card ────────────────────────────────────────────────────────
function ZoneHeaderCard({ zone }) {
  const { language } = useLanguage();
  const {
    zoneName, capacity, occupiedCount, bookedCount,
    maintenanceCount, isAggregate, floorNumber
  } = zone;

  const computedAvailable = Math.max(0, capacity - occupiedCount - bookedCount - maintenanceCount);
  const totalCalculated = computedAvailable + occupiedCount + bookedCount + maintenanceCount;
  const getPercentage = (val) => capacity > 0 ? ((val / capacity) * 100).toFixed(1) : 0;

  const displayTitle = isAggregate ? t[language].allFloors : `${t[language].floorLabel} ${floorNumber}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-4">
      {/* 1. Header Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-blue-500" />
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {displayTitle}
          </span>
          {!isAggregate && zoneName && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 rounded-full">
              {zoneName}
            </span>
          )}
        </div>
      </div>

      {/* 2. 5-Column Grid Stats Layout */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Slots */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">{t[language].totalSlots}</span>
          <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {capacity}
          </span>
        </div>

        {/* Available */}
        <div className="p-3 bg-emerald-100/80 dark:bg-emerald-950/20 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">
            {t[language].available} ({getPercentage(computedAvailable)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-450">
            {computedAvailable}
          </span>
        </div>

        {/* Occupied */}
        <div className="p-3 bg-red-100/80 dark:bg-red-955/20 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-red-500 uppercase block mb-1">
            {t[language].occupied} ({getPercentage(occupiedCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
            {occupiedCount}
          </span>
        </div>

        {/* Booked / Reserved */}
        <div className="p-3 bg-amber-100/80 dark:bg-amber-955/20 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-amber-505 uppercase block mb-1">
            {t[language].reserved} ({getPercentage(bookedCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-amber-605 dark:text-amber-400">
            {bookedCount}
          </span>
        </div>

        {/* Maintenance */}
        <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-lg text-center col-span-2 md:col-span-1 flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-slate-600 uppercase block mb-1">
            {t[language].maintenance} ({getPercentage(maintenanceCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-slate-600 dark:text-slate-400">
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

// ─── Floor Overview Card ─────────────────────────────────────────────────────
function FloorOverviewCard({ floorData, onClick, language }) {
  const { floorNumber, capacity, occupiedCount, bookedCount, maintenanceCount, zoneCount } = floorData;
  const availableCount = Math.max(0, capacity - occupiedCount - bookedCount - maintenanceCount);

  const occRate = capacity > 0 ? (((occupiedCount + bookedCount) / capacity) * 100).toFixed(0) : 0;

  return (
    <div
      onClick={() => onClick(floorNumber)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-305 cursor-pointer group flex flex-col justify-between space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-850 dark:text-white">
              {language === "en" ? `Floor ${floorNumber}` : `Tầng ${floorNumber}`}
            </h3>
            <p className="text-xs text-slate-400 font-semibold">
              {language === "en" ? `${zoneCount} Zones Allocated` : `${zoneCount} phân khu đã phân bổ`}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-505 dark:text-slate-400 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {language === "en" ? "View Details →" : "Xem chi tiết →"}
        </span>
      </div>

      {/* Progress occupancy rate */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-slate-400 uppercase">{language === "en" ? "Occupancy" : "Tỷ lệ sử dụng"}</span>
          <span className="text-slate-700 dark:text-white">{occRate}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${occRate}%` }}
          />
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="col-span-2 p-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg">
          <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">{language === "en" ? "Total Capacity" : "Tổng sức chứa"}</span>
          <span className="text-sm font-extrabold text-slate-850 dark:text-white">{capacity}</span>
        </div>
        <div className="p-2 bg-emerald-100/80 dark:bg-emerald-955/10 rounded-lg">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 block mb-0.5 uppercase">{language === "en" ? "Available" : "Còn trống"}</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{availableCount}</span>
        </div>
        <div className="p-2 bg-rose-100/80 dark:bg-rose-955/10 rounded-lg">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-455 block mb-0.5 uppercase">{language === "en" ? "Occupied" : "Đang đỗ"}</span>
          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{occupiedCount}</span>
        </div>
        <div className="p-2 bg-amber-100/80 dark:bg-amber-955/10 rounded-lg">
          <span className="text-[10px] font-bold text-amber-550 dark:text-amber-505 block mb-0.5 uppercase">{language === "en" ? "Booked" : "Đã đặt"}</span>
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{bookedCount}</span>
        </div>
        <div className="p-2 bg-slate-100/90 dark:bg-slate-800/60 rounded-lg">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 uppercase">{language === "en" ? "Maintenance" : "Bảo trì"}</span>
          <span className="text-sm font-extrabold text-slate-755 dark:text-slate-200">{maintenanceCount}</span>
        </div>
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
        <div className="min-w-0">
          <span className="text-sm font-bold truncate block">{slot.slot_name}</span>
        </div>
        <div className="flex items-center gap-0.5 ml-1 shrink-0 mt-0.5">
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
  const [selectedFloorForDetails, setSelectedFloorForDetails] = useState(null);

  // Data State
  const [slotsData, setSlotsData] = useState([]);
  const [zoneStats, setZoneStats] = useState([]);

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

  const floorsData = useMemo(() => {
    const map = {};
    zoneStats.forEach(z => {
      const fNum = z.floor_number ?? z.floorNumber ?? 0;
      if (!map[fNum]) {
        map[fNum] = {
          floorNumber: fNum,
          capacity: 0,
          occupiedCount: 0,
          bookedCount: 0,
          maintenanceCount: 0,
          zoneCount: 0
        };
      }
      map[fNum].capacity += z.capacity ?? 0;
      map[fNum].occupiedCount += z.occupied_count ?? z.occupiedCount ?? 0;
      map[fNum].bookedCount += z.booked_count ?? z.bookedCount ?? 0;
      map[fNum].maintenanceCount += z.maintenance_count ?? z.maintenanceCount ?? 0;
      map[fNum].zoneCount += 1;
    });
    return Object.values(map).sort((a, b) => a.floorNumber - b.floorNumber);
  }, [zoneStats]);

  // ── Virtual Slot Mapping ───────────────────────────────────────────────
  const mappedSlots = useMemo(() => {
    const sortedSlotsData = [...slotsData].sort((a, b) =>
      (a.slot_id ?? "").localeCompare(b.slot_id ?? "", undefined, { numeric: true, sensitivity: 'base' })
    );

    const slotsByZone = {};
    sortedSlotsData.forEach(slot => {
      const zName = slot.zone || "N/A";
      if (!slotsByZone[zName]) {
        slotsByZone[zName] = [];
      }
      slotsByZone[zName].push({ ...slot });
    });

    Object.keys(slotsByZone).forEach(zName => {
      const zoneStat = zoneStats.find(z => (z.zone_name ?? z.zoneName) === zName);
      if (!zoneStat) return;

      const occupiedCount = zoneStat.occupied_count ?? zoneStat.occupiedCount ?? 0;
      const bookedCount = zoneStat.booked_count ?? zoneStat.bookedCount ?? 0;

      let occupiedAssigned = 0;
      let bookedAssigned = 0;

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

    return sortedSlotsData.map(slot => {
      const zoneGroup = slotsByZone[slot.zone || "N/A"] || [];
      const found = zoneGroup.find(s => s.slot_id === slot.slot_id);
      return found || slot;
    });
  }, [slotsData, zoneStats]);

  const filteredMappedSlots = useMemo(() => {
    if (!selectedStatus) return mappedSlots;
    return mappedSlots.filter(s => s.status === selectedStatus);
  }, [mappedSlots, selectedStatus]);

  const currentPage = 1;
  const pageSize = 1000;

  // ── Capacity Guard Calculations ──────────────────────────────────────────
  const singleCheck = useMemo(() => {
    if (!activeSlot || newSlotStatus !== "MAINTENANCE" || activeSlot.status === "MAINTENANCE") {
      return { allowed: true, remaining: 0, warning: false };
    }
    const zoneStat = zoneStats.find(z => (z.zone_name ?? z.zoneName) === activeSlot.zone);
    if (!zoneStat) return { allowed: true, remaining: 0, warning: false };

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

  const bulkCheck = useMemo(() => {
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
    if (filterType === "floor") setSelectedFloor(value);
    if (filterType === "zone") setSelectedZone(value);
    if (filterType === "vehicleType") setSelectedVehicleType(value);
    if (filterType === "status") setSelectedStatus(value);
  };

  const handleClearFilters = () => {
    setSelectedStatus("");
  };

  const handleFloorCardClick = (floorNum) => {
    setSelectedFloorForDetails(floorNum);
    setSelectedFloor(floorNum.toString());
    setSelectedZone("");
  };

  const handleBackToOverview = () => {
    setSelectedFloorForDetails(null);
    setSelectedFloor("");
    setSelectedZone("");
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

      const nextActive = next.length === 1 ? mappedSlots.find((x) => x.slot_id === next[0]) || null : null;
      setActiveSlot(nextActive);
      if (nextActive) setNewSlotStatus(nextActive.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE");

      if (next.length > 1) {
        const nextSlots = next.map(id => mappedSlots.find(s => s.slot_id === id)).filter(Boolean);
        const allMaint = nextSlots.every(s => s.status === "MAINTENANCE");
        setBulkStatus(allMaint ? "AVAILABLE" : "MAINTENANCE");
      }
    } else {
      const next = [...selectedSlotIds, slot.slot_id];
      setSelectedSlotIds(next);

      const nextActive = next.length === 1 ? slot : null;
      setActiveSlot(nextActive);
      if (nextActive) setNewSlotStatus(slot.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE");

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

  const hasActiveFilters = !!selectedStatus;
  const zoneOptions = zoneStats.map((z) => ({ id: z.zone_id ?? z.zoneId, name: z.zone_name ?? z.zoneName }));
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

  const displayZones = hasHeaderFilter ? filteredZoneStats : null;

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

  return (
    <div className="w-full h-auto pb-12 space-y-4 font-sans antialiased text-slate-700 dark:text-slate-200">
      {selectedFloorForDetails === null ? (
        <>
          {/* ── OVERVIEW TOP HEADER ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {t[language].floorOverview}
            </h2>
          </div>

          {/* ── OVERVIEW FLOOR CARDS GRID ── */}
          {isFetchingZones && zoneStats.length === 0 ? (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <RefreshCw size={16} className="animate-spin text-blue-500" />
              <span>{t[language].loadingStats}</span>
            </div>
          ) : floorsData.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              {t[language].noFloors}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {floorsData.map((f) => (
                <FloorOverviewCard
                  key={f.floorNumber}
                  floorData={f}
                  onClick={handleFloorCardClick}
                  language={language}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── TOP HEADER WITH BACK TO OVERVIEW BUTTON ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToOverview}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm shrink-0"
              >
                <ArrowLeft size={14} />
                <span>{t[language].backToOverview}</span>
              </button>
            </div>
          </div>

          {/* ── SECTION 1: ZONE OVERVIEW HEADERS ── */}
          <div className="space-y-2">
            {isFetchingZones && zoneStats.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <RefreshCw size={14} className="animate-spin text-blue-500" />
                <span>{t[language].loadingStats}</span>
              </div>
            ) : displayZones && displayZones.length > 0 ? (
              displayZones.map((z) => (
                <ZoneHeaderCard
                  key={z.zone_id ?? z.zoneId}
                  zone={normalizeZone(z)}
                />
              ))
            ) : filteredZoneStats.length > 0 ? (
              filteredZoneStats.map((z) => (
                <ZoneHeaderCard
                  key={z.zone_id ?? z.zoneId}
                  zone={normalizeZone(z)}
                />
              ))
            ) : null}
          </div>

          {/* ── SECTION 2: FILTER BAR ── */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mr-1 shrink-0">
              <Sliders size={15} className="text-blue-500" />
              {t[language].filters}
            </div>

            {/* Floor (Locked in details) */}
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-850 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <Layers size={13} className="text-blue-500" />
              <span>{language === 'en' ? `Floor ${selectedFloorForDetails}` : `Tầng ${selectedFloorForDetails}`}</span>
            </div>

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
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-505 rounded-md flex items-center gap-1">
                      <Layers size={11} /> {t[language].floorLabel} {selectedFloor}
                    </span>
                  )}
                </h3>
                {selectedSlotIds.length > 0 && (
                  <span className="text-xs font-bold px-2 py-1 bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg">
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
                  <span className="w-3 h-3 rounded bg-amber-505 inline-block" />
                  <span className="text-amber-700 dark:text-amber-400">{t[language].reserved}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-500 inline-block" />
                  <span className="text-slate-500 dark:text-slate-400">{t[language].maintenance}</span>
                </span>
                <span className="flex items-center gap-1.5 ml-auto text-slate-400 dark:text-slate-505">
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
                      ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
                      : "grid-cols-3 sm:grid-cols-5 lg:grid-cols-6"
                      }`}
                  >
                    {filteredMappedSlots.map((slot) => (
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
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-955/20 border border-blue-105 dark:border-blue-900/30 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-blue-500 uppercase block">{t[language].selectedSlot}</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {activeSlot.slot_name} <span className="text-xs font-normal text-slate-505 dark:text-slate-400">(ID: {activeSlot.slot_id})</span>
                      </span>
                      <span className="text-xs text-slate-505 dark:text-slate-400 block">{activeSlot.zone} — {t[language].floorLabel} {activeSlot.floor}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${activeSlot.status === "AVAILABLE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-202 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/50"
                      : activeSlot.status === "MAINTENANCE"
                        ? "bg-slate-105 text-slate-650 border-slate-202 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        : activeSlot.status === "OCCUPIED"
                          ? "bg-rose-50 text-rose-700 border-rose-202 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/50"
                          : "bg-amber-50 text-amber-700 border-amber-202 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/50"
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

                    {/* Capacity warning banner */}
                    {newSlotStatus === "MAINTENANCE" && activeSlot.status !== "MAINTENANCE" && (
                      <div className="animate-in fade-in duration-200">
                        {activeSlot.status === "OCCUPIED" || activeSlot.status === "RESERVED" ? (
                          <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                            {t[language].cannotMaintainCapacitySingle}
                          </div>
                        ) : !singleCheck.allowed ? (
                          <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                            {t[language].cannotMaintainCapacitySingle}
                          </div>
                        ) : singleCheck.warning ? (
                          <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {t[language].warningLowCapacitySingle.replace("{count}", singleCheck.remaining)}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Duration */}
                    {newSlotStatus === "MAINTENANCE" && (
                      <div className="animate-in fade-in duration-250">
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
                  <Settings size={15} className="text-blue-505" />
                  {t[language].bulkUpdateTitle}
                </h3>

                <form onSubmit={handleBulkUpdateSlotStatus} className="flex flex-col flex-1 gap-4">
                  {/* Selected slots list */}
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-955/20 border border-blue-105 dark:border-blue-900/30 rounded-lg">
                    <span className="text-xs font-semibold text-blue-505 uppercase block mb-1">
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
                    {/* Status selection */}
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

                    {/* Capacity warning */}
                    {bulkStatus === "MAINTENANCE" && (
                      <div className="animate-in fade-in duration-200">
                        {selectedSlotIds.map(id => mappedSlots.find(s => s.slot_id === id)).some(s => s && (s.status === "OCCUPIED" || s.status === "RESERVED")) ? (
                          <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                            {t[language].cannotMaintainCapacityBulk}
                          </div>
                        ) : !bulkCheck.allowed ? (
                          <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400">
                            {t[language].cannotMaintainCapacityBulk}
                            {bulkCheck.violatedZones.map(vz => (
                              <div key={vz.zone} className="mt-1 font-bold">
                                • {vz.zone}: {t[language].available.toLowerCase()} {vz.available}, {t[language].slotsSelectedLabel.toLowerCase()} {vz.requested}
                              </div>
                            ))}
                          </div>
                        ) : bulkCheck.warning ? (
                          <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400">
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
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-505"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleCancelSelection}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 rounded-lg font-bold text-xs transition-all"
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
                      {isBulkUpdating ? t[language].saving : t[language].confirmBulkUpdateBtn}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}