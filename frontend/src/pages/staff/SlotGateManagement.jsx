import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { toast } from "sonner";
import {
  Grid, RefreshCw, Settings, Sliders, BatteryCharging, Accessibility,
  Car, Layers, Trash2, Activity, ParkingSquare, Wrench, CheckCircle2,
  Calendar, ChevronLeft, ChevronRight, Users
} from "lucide-react";

// ─── Zone Header Card ────────────────────────────────────────────────────────
function ZoneHeaderCard({ zone, selectedFloor }) {
  const {
    zoneName, capacity, occupiedCount, bookedCount,
    maintenanceCount, availableCapacity, isAggregate
  } = zone;

  const totalCalculated = availableCapacity + occupiedCount + bookedCount + maintenanceCount;
  // Hàm tính phần trăm dựa trên capacity của zone
  const getPercentage = (val) => capacity > 0 ? ((val / capacity) * 100).toFixed(1) : 0;

  // Tự động chuyển đổi tiêu đề: Nếu chọn tầng cụ thể thì hiển thị "Floor X", ngược lại hiển thị "All Floors"
  const displayTitle = selectedFloor ? `Floor ${selectedFloor}` : "All Floors";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-4">

      {/* 1. Header Title Row */}
      <div className="flex items-center gap-2">
        <Layers size={16} className={isAggregate ? "text-slate-400" : "text-blue-500"} />
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
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Slots</span>
          <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white ">
            {capacity}
          </span>
        </div>

        {/* Available */}
        <div className="p-3 bg-emerald-100/100 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">
            Available ({getPercentage(availableCapacity)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 ">
            {availableCapacity}
          </span>
        </div>

        {/* Occupied */}
        <div className="p-3 bg-red-100/100 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-red-500 uppercase block mb-1">
            Occupied ({getPercentage(occupiedCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 ">
            {occupiedCount}
          </span>
        </div>

        {/* Booked / Reserved */}
        <div className="p-3 bg-amber-100/100 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-lg text-center flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-amber-500 uppercase block mb-1">
            Reserved ({getPercentage(bookedCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 ">
            {bookedCount}
          </span>
        </div>

        {/* Maintenance */}
        <div className="p-3 bg-slate-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center col-span-2 md:col-span-1 flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
            Maintenance ({getPercentage(maintenanceCount)}%)
          </span>
          <span className="text-2xl md:text-3xl font-bold text-slate-600 dark:text-slate-400 ">
            {maintenanceCount}
          </span>
        </div>
      </div>

      {/* 3. Multi-color Progress Bar */}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
        {availableCapacity > 0 && (
          <div
            style={{ width: `${(availableCapacity / totalCalculated) * 100}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Available: ${availableCapacity}`}
          />
        )}
        {occupiedCount > 0 && (
          <div
            style={{ width: `${(occupiedCount / totalCalculated) * 100}%` }}
            className="bg-red-500 transition-all duration-500"
            title={`Occupied: ${occupiedCount}`}
          />
        )}
        {bookedCount > 0 && (
          <div
            style={{ width: `${(bookedCount / totalCalculated) * 100}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Booked: ${bookedCount}`}
          />
        )}
        {maintenanceCount > 0 && (
          <div
            style={{ width: `${(maintenanceCount / totalCalculated) * 100}%` }}
            className="bg-slate-400 dark:bg-slate-500 transition-all duration-500"
            title={`Maintenance: ${maintenanceCount}`}
          />
        )}
      </div>

    </div>
  );
}



// ─── Slot Card ───────────────────────────────────────────────────────────────
function SlotCard({ slot, isSelected, onClick }) {
  const isAvailable = slot.status === "AVAILABLE";
  const isMaintenance = slot.status === "MAINTENANCE";

  let cardClasses = "";
  let labelClasses = "";

  if (isAvailable) {
    cardClasses = "bg-emerald-600 dark:bg-emerald-700 border-transparent";
    labelClasses = "text-emerald-100";
  } else if (isMaintenance) {
    cardClasses = "bg-slate-500 dark:bg-slate-600 border-transparent";
    labelClasses = "text-slate-200";
  } else {
    cardClasses = "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600";
    labelClasses = "text-slate-500";
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
        <span className="text-sm font-bold text-white truncate">{slot.slot_name}</span>
        <div className="flex items-center gap-0.5 ml-1 shrink-0">
          {slot.is_electric_charging && (
            <BatteryCharging size={11} className="text-teal-200" title="EV Charging" />
          )}
          {slot.is_handicap && (
            <Accessibility size={11} className="text-indigo-200" title="Accessible" />
          )}
        </div>
      </div>

      {isMaintenance && (
        <div className="mt-1.5 flex items-center gap-1">
          <Wrench size={10} className="text-slate-300" />
          <span className="text-[10px] font-semibold text-slate-300">Maintenance</span>
        </div>
      )}

      {isAvailable && (
        <div className="mt-1.5">
          <span className="text-[10px] font-semibold text-emerald-200">Available</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SlotGateManagementPage() {
  // Filter State
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Data State
  const [slotsData, setSlotsData] = useState([]);
  const [zoneStats, setZoneStats] = useState([]);

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
          status: selectedStatus || undefined,
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
      toast.error(err.response?.data?.message || "Không thể tải danh sách ô đỗ.");
    } finally {
      setIsFetchingSlots(false);
    }
  }, [selectedFloor, selectedZone, selectedVehicleType, selectedStatus, currentPage, pageSize]);

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
      setActiveSlot(next.length === 1 ? slotsData.find((x) => x.slot_id === next[0]) || null : null);
    } else {
      const next = [...selectedSlotIds, slot.slot_id];
      setSelectedSlotIds(next);
      setActiveSlot(next.length === 1 ? slot : null);
    }
  };

  const handleUpdateSlotStatus = async (e) => {
    if (e) e.preventDefault();
    if (!activeSlot) return;
    setIsUpdatingSlot(true);
    const toastId = toast.loading(`Đang cập nhật ô ${activeSlot.slot_name}...`);
    try {
      await api.put(`/parking/slots/${activeSlot.slot_id}/status`, {
        status: newSlotStatus,
        reason: maintenanceReason,
        estimated_duration_minutes: Number(estDuration),
      });
      toast.success(`Cập nhật thành công ô ${activeSlot.slot_name} → [${newSlotStatus}].`, { id: toastId });
      setActiveSlot(null);
      setSelectedSlotIds([]);
      setMaintenanceReason("");
      setEstDuration(60);
      await Promise.all([fetchSlots(), fetchZoneStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật trạng thái.", { id: toastId });
    } finally {
      setIsUpdatingSlot(false);
    }
  };

  const handleBulkUpdateSlotStatus = async (e) => {
    if (e) e.preventDefault();
    if (selectedSlotIds.length === 0) return;
    setIsBulkUpdating(true);
    const toastId = toast.loading(`Đang cập nhật ${selectedSlotIds.length} ô đỗ...`);
    try {
      await api.put("/parking/slots/bulk-status", {
        slot_ids: selectedSlotIds,
        status: bulkStatus,
        reason: bulkReason,
        estimated_duration_minutes: Number(bulkEstDuration),
      });
      toast.success(`Cập nhật thành công ${selectedSlotIds.length} ô đỗ → [${bulkStatus}].`, { id: toastId });
      setSelectedSlotIds([]);
      setActiveSlot(null);
      setBulkReason("");
      setBulkEstDuration(60);
      await Promise.all([fetchSlots(), fetchZoneStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật hàng loạt.", { id: toastId });
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
  const aggregatedZone = !hasHeaderFilter && zoneStats.length > 0 ? {
    zoneId: "all",
    zoneName: "All Zones",
    floorNumber: null,
    capacity: zoneStats.reduce((s, z) => s + (z.capacity ?? 0), 0),
    availableCapacity: zoneStats.reduce((s, z) => s + (z.available_capacity ?? z.availableCapacity ?? 0), 0),
    occupiedCount: zoneStats.reduce((s, z) => s + (z.occupied_count ?? z.occupiedCount ?? 0), 0),
    bookedCount: zoneStats.reduce((s, z) => s + (z.booked_count ?? z.bookedCount ?? 0), 0),
    maintenanceCount: zoneStats.reduce((s, z) => s + (z.maintenance_count ?? z.maintenanceCount ?? 0), 0),
    vehicleTypeName: null,
    isAggregate: true,
  } : null;

  // Khi có filter → chỉ hiển thị zone phù hợp; không filter → hiển thị 1 card tổng
  const displayZones = hasHeaderFilter ? filteredZoneStats : null;

  // ── Normalise keys (handle camelCase vs snake_case from API) ─────────────
  const normalizeZone = (z) => ({
    zoneId: z.zone_id ?? z.zoneId,
    zoneName: z.zone_name ?? z.zoneName ?? "—",
    floorNumber: z.floor_number ?? z.floorNumber ?? 0,
    capacity: z.capacity ?? 0,
    availableCapacity: z.available_capacity ?? z.availableCapacity ?? 0,
    occupiedCount: z.occupied_count ?? z.occupiedCount ?? 0,
    bookedCount: z.booked_count ?? z.bookedCount ?? 0,
    maintenanceCount: z.maintenance_count ?? z.maintenanceCount ?? 0,
    vehicleTypeName: z.vehicle_type_name ?? z.vehicleTypeName ?? "—",
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-auto pb-12 space-y-4 font-sans antialiased text-slate-700 dark:text-slate-200">

      {/* ── SECTION 1: ZONE OVERVIEW HEADERS ── */}
      <div className="space-y-2">
        {isFetchingZones && zoneStats.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <RefreshCw size={14} className="animate-spin text-blue-500" />
            <span>Đang tải thống kê Zone...</span>
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
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mr-1">
          <Sliders size={15} className="text-blue-500" />
          Filters
        </div>

        {/* Floor */}
        <select
          value={selectedFloor}
          onChange={(e) => handleFilterChange("floor", e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer"
        >
          <option value="">All Floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
        </select>

        {/* Vehicle Type */}
        <select
          value={selectedVehicleType}
          onChange={(e) => handleFilterChange("vehicleType", e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer"
        >
          <option value="">All Vehicles</option>
          <option value="1">Motorbike</option>
          <option value="2">Car</option>
        </select>

        {/* Status – chỉ giữ AVAILABLE & MAINTENANCE */}
        <select
          value={selectedStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        {/* Refresh button */}
        <button
          onClick={() => { fetchSlots(); fetchZoneStats(); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-900/50 hover:bg-blue-600 dark:hover:bg-blue-900 rounded-lg transition-all"
          title="Refresh data"
        >
          <RefreshCw size={13} className={isFetchingSlots || isFetchingZones ? "animate-spin" : ""} />
          Refresh
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-600 dark:border-red-900/50 dark:hover:bg-red-900 rounded-lg transition-all"
          >
            <Trash2 size={13} />
            Clear Filters
          </button>
        )}
      </div>

      {/* ── SECTION 3: MAIN WORKSPACE ── */}
      <div className={`grid gap-5 items-stretch transition-all duration-300 ${(activeSlot || isBulkMode) ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>

        {/* LEFT PANEL: SLOT GRID */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm flex flex-col min-h-[480px]">
          {/* Panel header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Grid size={15} className="text-blue-500" />
              Slot Map
              {selectedFloor && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md flex items-center gap-1">
                  <Layers size={11} /> Floor {selectedFloor}
                </span>
              )}
            </h3>
            {selectedSlotIds.length > 0 && (
              <span className="text-xs font-bold px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                {selectedSlotIds.length} selected
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              <span className="text-emerald-700 dark:text-emerald-400">Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-500 inline-block" />
              <span className="text-slate-500 dark:text-slate-400">Maintenance</span>
            </span>
            <span className="flex items-center gap-1.5 ml-auto text-slate-400 dark:text-slate-500">
              Click to select
            </span>
          </div>

          {/* Grid */}
          <div className="flex-1">
            {isFetchingSlots && slotsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 gap-2">
                <RefreshCw size={22} className="animate-spin text-blue-500" />
                <span className="text-sm font-semibold">Loading parking slots...</span>
              </div>
            ) : slotsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <ParkingSquare size={32} className="mb-2 opacity-30" />
                <span className="text-sm">No slots found for selected filters.</span>
              </div>
            ) : (
              <div
                className={`grid gap-2.5 transition-all ${(activeSlot || isBulkMode)
                  ? "grid-cols-3 sm:grid-cols-4"
                  : "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7"
                  }`}
              >
                {slotsData.map((slot) => (
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
                Page {currentPage} / {totalPages}
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
              Update Slot Status
            </h3>

            <form onSubmit={handleUpdateSlotStatus} className="flex flex-col flex-1 gap-4">
              {/* Slot info */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-blue-500 uppercase block">Selected Slot</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{activeSlot.slot_name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{activeSlot.zone} — Floor {activeSlot.floor}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${activeSlot.status === "AVAILABLE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}>
                  {activeSlot.status}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {/* Change to */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Change Status To</label>
                  <select
                    value={newSlotStatus}
                    onChange={(e) => setNewSlotStatus(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE — Mở lại ô đỗ</option>
                    <option value="MAINTENANCE">MAINTENANCE — Đưa vào bảo trì</option>
                  </select>
                </div>

                {/* Duration (maintenance only) */}
                {newSlotStatus === "MAINTENANCE" && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Estimated Duration (minutes)</label>
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
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Reason</label>
                  <input
                    type="text"
                    required
                    value={maintenanceReason}
                    onChange={(e) => setMaintenanceReason(e.target.value)}
                    placeholder={newSlotStatus === "MAINTENANCE" ? "e.g. Damaged sensor, scheduled cleaning..." : "e.g. Maintenance completed, slot cleared..."}
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
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSlot}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUpdatingSlot && <RefreshCw size={13} className="animate-spin" />}
                  {isUpdatingSlot ? "Saving..." : "Confirm Update"}
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
              Bulk Update Slots
            </h3>

            <form onSubmit={handleBulkUpdateSlotStatus} className="flex flex-col flex-1 gap-4">
              {/* Selected slots */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                <span className="text-xs font-semibold text-blue-500 uppercase block mb-1">
                  {selectedSlotIds.length} Slots Selected
                </span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto mt-1">
                  {selectedSlotIds.map((id) => {
                    const s = slotsData.find((x) => x.slot_id === id);
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
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Change Status To</label>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE — Mở lại các ô đỗ</option>
                    <option value="MAINTENANCE">MAINTENANCE — Đưa vào bảo trì</option>
                  </select>
                </div>

                {/* Duration */}
                {bulkStatus === "MAINTENANCE" && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Estimated Duration (minutes)</label>
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
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Reason</label>
                  <input
                    type="text"
                    required
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder="e.g. Bulk scheduled maintenance, sensor cleanup..."
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
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  disabled={isBulkUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isBulkUpdating && <RefreshCw size={13} className="animate-spin" />}
                  {isBulkUpdating ? "Saving..." : `Confirm Bulk Update (${selectedSlotIds.length} slots)`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}