import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { toast } from "sonner";
import { Grid, RefreshCw, Settings, Sliders, BatteryCharging, Accessibility, Clock, Car, Layers, Trash2 } from "lucide-react";

export default function SlotGateManagementPage() {

  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [slotsData, setSlotsData] = useState([]);
  const [slotsSummary, setSlotsSummary] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [activeSlot, setActiveSlot] = useState(null);
  const [newSlotStatus, setNewSlotStatus] = useState("MAINTENANCE");
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [estDuration, setEstDuration] = useState(60);

  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(false);

  const fetchSlotsSummaryAndMatrix = useCallback(async () => {
    setIsFetchingSlots(true);
    try {
      const response = await api.get(`/parking/slots`, {
        params: {
          floor: selectedFloor || undefined,
          zone: selectedZone || undefined,
          vehicle_type_id: selectedVehicleType ? Number(selectedVehicleType) : undefined,
          status: selectedStatus || undefined,
          page: currentPage,
          page_size: pageSize
        }
      });

      if (response.data.success) {
        setSlotsSummary(response.data.data.summary);
        setSlotsData(response.data.data.slots);
        if (response.data.data.pagination) {
          setTotalPages(response.data.data.pagination.total_pages);
        }
      }
    } catch (err) {
      console.error("Fetch Slots Error:", err);
      toast.error(err.response?.data?.message || "Cannot load slot map!");
    } finally {
      setIsFetchingSlots(false);
    }
  }, [selectedFloor, selectedZone, selectedVehicleType, selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchSlotsSummaryAndMatrix();
  }, [fetchSlotsSummaryAndMatrix]);

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "floor") setSelectedFloor(value);
    if (filterType === "zone") setSelectedZone(value);
    if (filterType === "vehicleType") setSelectedVehicleType(value);
    if (filterType === "status") setSelectedStatus(value);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        if (activeSlot) {
          handleCancelSelection();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlot]);

  useEffect(() => {
    if (newSlotStatus === "AVAILABLE" || newSlotStatus === "RESERVED") {
      setEstDuration(0);
    } else if (newSlotStatus === "MAINTENANCE") {
      setEstDuration(60);
    }
  }, [newSlotStatus]);

  const handleClearFilters = () => {
    setCurrentPage(1);
    setSelectedFloor("");
    setSelectedZone("");
    setSelectedVehicleType("");
    setSelectedStatus("");
  };

  const handleUpdateSlotStatus = async (e) => {
    if (e) e.preventDefault();
    if (!activeSlot) return;

    setIsUpdatingSlot(true);
    const toastId = toast.loading(`Đang cập nhật trạng thái ô ${activeSlot.slot_name}...`);

    try {
      const response = await api.put(
        `/parking/slots/${activeSlot.slot_id}/status`,
        {
          status: newSlotStatus,
          reason: maintenanceReason,
          estimated_duration_minutes: Number(estDuration),
        }
      );

      if (response.status === 200 || response.data.success) {
        toast.success(`Cập nhật thành công ô ${activeSlot.slot_name} sang [${newSlotStatus}].`, {
          id: toastId,
        });

        setActiveSlot(null);
        setMaintenanceReason("");
        setEstDuration(60);

        await fetchSlotsSummaryAndMatrix();
      }
    } catch (err) {
      console.error("Update Slot Error:", err);
      toast.error(err.response?.data?.message || "Lỗi cập nhật trạng thái lên máy chủ.", {
        id: toastId,
      });
    } finally {
      setIsUpdatingSlot(false);
    }
  };

  const handleCancelSelection = () => {
    setActiveSlot(null);
    setMaintenanceReason("");
    setEstDuration(60);
  };

  const getPercentage = (value) => {
    if (!slotsSummary || !slotsSummary.total_slots) return 0;
    return ((value / slotsSummary.total_slots) * 100).toFixed(1);
  };

  return (
    <div className="w-full h-auto pb-12 space-y-4 font-sans antialiased text-slate-700 dark:text-slate-200">

      {/* SECTION 1: KHU VỰC THỐNG KÊ */}
      {slotsSummary && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg text-center">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Slots</span>
              <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-mono">{slotsSummary.total_slots}</span>
            </div>
            <div className="p-3 bg-emerald-100/100 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-center">
              <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">Available ({getPercentage(slotsSummary.available)}%)</span>
              <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{slotsSummary.available}</span>
            </div>
            <div className="p-3 bg-red-100/100 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-center">
              <span className="text-xs font-bold text-red-500 uppercase block mb-1">Occupied ({getPercentage(slotsSummary.occupied)}%)</span>
              <span className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 font-mono">{slotsSummary.occupied}</span>
            </div>
            <div className="p-3 bg-amber-100/100 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-lg text-center">
              <span className="text-xs font-bold text-amber-500 uppercase block mb-1">Reserved ({getPercentage(slotsSummary.reserved)}%)</span>
              <span className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono">{slotsSummary.reserved}</span>
            </div>
            <div className="p-3 bg-slate-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center col-span-2 md:col-span-1">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Maintenance ({getPercentage(slotsSummary.maintenance)}%)</span>
              <span className="text-2xl md:text-3xl font-bold text-slate-600 dark:text-slate-400 font-mono">{slotsSummary.maintenance}</span>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${getPercentage(slotsSummary.available)}%` }} className="bg-emerald-500 transition-all duration-500" title={`Available: ${getPercentage(slotsSummary.available)}%`} />
            <div style={{ width: `${getPercentage(slotsSummary.occupied)}%` }} className="bg-red-500 transition-all duration-500" title={`Occupied: ${getPercentage(slotsSummary.occupied)}%`} />
            <div style={{ width: `${getPercentage(slotsSummary.reserved)}%` }} className="bg-amber-500 transition-all duration-500" title={`Reserved: ${getPercentage(slotsSummary.reserved)}%`} />
            <div style={{ width: `${getPercentage(slotsSummary.maintenance)}%` }} className="bg-slate-500 dark:bg-slate-400 transition-all duration-500" title={`Maintenance: ${getPercentage(slotsSummary.maintenance)}%`} />
          </div>
        </div>
      )}

      {/* SECTION 2: BỘ LỌC FILTER SYSTEM BAR */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mr-2">
          <Sliders size={16} className="text-blue-500" /> Filters
        </div>

        <select
          value={selectedFloor}
          onChange={(e) => handleFilterChange("floor", e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer">
          <option value="">All Floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
        </select>

        <select
          value={selectedVehicleType}
          onChange={(e) => handleFilterChange("vehicleType", e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer">
          <option value="">All Vehicles</option>
          <option value="1">Motorbike</option>
          <option value="2">Car</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none cursor-pointer">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="RESERVED">Reserved</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        {(selectedFloor || selectedVehicleType || selectedStatus) && (
          <button
            onClick={handleClearFilters}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-600 rounded-lg transition-all dark:border-red-900/50 dark:hover:bg-red-900"
            title="Delete All Active Filters">
            <Trash2 size={14} />
            <span>Delete Filters</span>
          </button>
        )}
      </div>

      {/* SECTION 3: WORKSPACE GRID CHÍNH */}
      <div className={`grid gap-5 items-stretch transition-all duration-300 ${activeSlot ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>

        {/* LEFT PANEL: PARKING SLOTS MAP */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 shadow-sm flex flex-col justify-between min-h-[480px]">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Grid size={16} className="text-blue-500" />
              Parking Slots Map
              <span className="text-xs font-semibold px-2 py-0.5 ml-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md flex items-center gap-1 font-mono">
                <Layers size={12} /> {selectedFloor ? `Floor ${selectedFloor}` : "All Floors"}
              </span>
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-md p-4 flex flex-col space-y-2 text-sm text-slate-400">
              <div className="flex flex-wrap gap-x-5 gap-y-1 font-sans font-semibold text-sm">
                <span className="text-emerald-600">● Available</span>
                <span className="text-red-600">● Occupied</span>
                <span className="text-amber-600">● Reserved</span>
                <span className="text-slate-500">● Maintenance</span>
              </div>
            </div>

            {isFetchingSlots && slotsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-semibold gap-2">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                <span>Loading parking spaces...</span>
              </div>
            ) : slotsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-md">
                <span>No slots found matching the selected filters.</span>
              </div>
            ) : (
              <div className={`grid gap-3 transition-all ${activeSlot ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"}`}>
                {slotsData.map((slot) => {
                  const isSelected = activeSlot?.slot_id === slot.slot_id;
                  let statusClasses = "bg-emerald-600 text-white dark:bg-emerald-700 border-none";
                  if (slot.status === "OCCUPIED") statusClasses = "bg-red-600 text-white dark:bg-red-700 border-none";
                  if (slot.status === "RESERVED") statusClasses = "bg-amber-600 text-white dark:bg-amber-700 border-none";
                  if (slot.status === "MAINTENANCE") statusClasses = "bg-slate-600 text-white dark:bg-slate-700 border-none";

                  return (
                    <div
                      key={slot.slot_id}
                      onClick={() => setActiveSlot(slot)}
                      className={`p-4 border rounded-md flex flex-col justify-between cursor-pointer transition-all relative ${statusClasses} ${isSelected ? "ring-4 ring-offset-2 ring-blue-600 dark:ring-offset-slate-900 scale-[0.98] shadow-lg" : "hover:scale-[1.02] hover:shadow-md"}`}>

                      <div className="flex justify-between items-start">
                        <span className="text-base font-bold font-mono">{slot.slot_name}</span>
                        <div className="flex items-center gap-1 text-white/80">
                          {slot.is_electric_charging && <BatteryCharging size={14} className="text-teal-200" title="EV Charging Available" />}
                          {slot.is_handicap && <Accessibility size={14} className="text-indigo-200" title="Accessible Space" />}
                        </div>
                      </div>

                      <div className="mt-3 text-xs font-semibold font-mono opacity-80">
                        {slot.zone}
                      </div>

                      {slot.occupied_by_plate ? (
                        <div className="mt-2 pt-1.5 border-t border-dashed border-white/30 text-sm font-bold font-mono truncate flex items-center gap-1">
                          <Car size={14} className="text-white" /> {slot.occupied_by_plate}
                        </div>
                      ) : (
                        <div className="mt-2 pt-1.5 border-t border-dashed border-transparent text-sm h-6"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-800 disabled:opacity-40 transition-all">
                  Previous
                </button>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1 text-xs font-semibold border rounded-lg bg-slate-50 dark:bg-slate-800 disabled:opacity-40 transition-all">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: ACTIONS SYSTEM */}
        {activeSlot && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 shadow-sm flex flex-col justify-between min-h-[480px] animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-4 h-full flex flex-col">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Settings size={16} className="text-blue-500" /> Update Slot Status
              </h3>

              <form onSubmit={handleUpdateSlotStatus} className="space-y-4 text-sm flex-1 flex flex-col justify-between">
                <div className="space-y-4">

                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-md flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-blue-500 uppercase block">Selected Space</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white font-mono">Slot Name: {activeSlot.slot_name}</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white dark:bg-slate-900 text-slate-500 font-mono uppercase border border-slate-200 dark:border-slate-700">
                      Current: {activeSlot.status}
                    </span>
                  </div>

                  {activeSlot.status === "OCCUPIED" && activeSlot.occupied_since && (
                    <div className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-md text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        Occupied by <strong>{activeSlot.occupied_by_plate || "Unknown Car"}</strong> since{" "}
                        {new Date(activeSlot.occupied_since).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(activeSlot.occupied_since).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Change Status to</label>
                      <select
                        value={newSlotStatus}
                        onChange={(e) => setNewSlotStatus(e.target.value)}
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                        <option value="AVAILABLE">AVAILABLE (Free Space)</option>
                        <option value="MAINTENANCE">MAINTENANCE (Block / Lock)</option>
                        <option value="RESERVED">RESERVED (Hold / Book)</option>
                      </select>
                    </div>

                    {newSlotStatus === "MAINTENANCE" && (
                      <div className="animate-in fade-in duration-200">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Duration (Minutes)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={estDuration}
                          onChange={(e) => setEstDuration(Number(e.target.value))}
                          className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Reason</label>
                    <input
                      type="text"
                      required
                      value={maintenanceReason}
                      onChange={(e) => setMaintenanceReason(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., Damaged occupancy sensor, scheduling cleaning..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-auto border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancelSelection}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-md font-bold text-xs transition-all">
                    Cancel (Esc)
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingSlot}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-md font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2">
                    {isUpdatingSlot && <RefreshCw size={14} className="animate-spin" />}
                    {isUpdatingSlot ? "Saving Changes..." : "Confirm Update (Enter)"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}