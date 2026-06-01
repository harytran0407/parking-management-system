import React, { useState, useEffect } from "react";
// import axios from "axios"; // Uncomment this when you use real API calls
import { Grid, RefreshCw, Eye, Settings, ShieldAlert, Sliders, Unlock, Lock, BatteryCharging, Accessibility, AlertTriangle } from "lucide-react";

// Setup API URL from environment variable (.env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function SlotGateManagementPage() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState(""); // Matched with API §3.2
  const [selectedStatus, setSelectedStatus] = useState("");

  const [slotsData, setSlotsData] = useState([]);
  const [slotsSummary, setSlotsSummary] = useState(null);

  const [activeSlot, setActiveSlot] = useState(null);
  const [newSlotStatus, setNewSlotStatus] = useState("MAINTENANCE");
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [estDuration, setEstDuration] = useState(60);

  const [activeGateId, setActiveGateId] = useState("gate_in_01");
  const [gateAction, setGateAction] = useState("open");
  const [gateReason, setGateReason] = useState("");

  // UI State: Loading and Errors
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(false);
  const [isOverridingGate, setIsOverridingGate] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [operationLogs, setOperationLogs] = useState([]);

  // Get current staff ID from local storage (Fallback to 'usr_001')
  const currentStaffId = localStorage.getItem("staff_id") || "usr_001";

  // Reload data when filters change
  useEffect(() => {
    fetchSlotsSummaryAndMatrix();
  }, [selectedFloor, selectedZone, selectedVehicleType, selectedStatus]);

  // ==========================================
  // 2. API CALLS (WITH MOCK DATA & AXIOS BLUEPRINTS)
  // ==========================================

  // --- API CALL 1: FETCH SLOTS DATA (API §3.2) ---
  const fetchSlotsSummaryAndMatrix = async () => {
    setIsFetchingSlots(true);
    setGlobalError(null);

    try {
      /* 
      // === REAL AXIOS API CODE (Uncomment to use) ===
      const response = await axios.get(`${API_BASE_URL}/api/v1/parking/slots`, {
        params: {
          floor: selectedFloor || undefined,
          zone: selectedZone || undefined,
          vehicle_type_id: selectedVehicleType || undefined,
          status: selectedStatus || undefined,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.data.success) {
        setSlotsSummary(response.data.data.summary);
        setSlotsData(response.data.data.slots);
      }
      // ==============================================
      */

      // === MOCK DATA CODE (Delete when connecting to Backend) ===
      setTimeout(() => {
        setSlotsSummary({
          total_slots: 500,
          available: 180,
          occupied: 290,
          reserved: 20,
          maintenance: 10,
        });

        setSlotsData([
          {
            slot_id: "slt_001",
            slot_name: "A101",
            floor: 1,
            zone: "A",
            vehicle_type_id: 1,
            status: "AVAILABLE",
            is_handicap: false,
            is_electric_charging: true,
            current_session_id: null,
          },
          {
            slot_id: "slt_002",
            slot_name: "A102",
            floor: 1,
            zone: "A",
            vehicle_type_id: 1,
            status: "OCCUPIED",
            is_handicap: false,
            is_electric_charging: false,
            current_session_id: "sess_123",
            occupied_by_plate: "51H-123.45",
          },
          {
            slot_id: "slt_003",
            slot_name: "B204",
            floor: 2,
            zone: "B",
            vehicle_type_id: 1,
            status: "RESERVED",
            is_handicap: true,
            is_electric_charging: false,
            current_session_id: "sess_481",
          },
          {
            slot_id: "slt_004",
            slot_name: "C312",
            floor: 3,
            zone: "C",
            vehicle_type_id: 2,
            status: "MAINTENANCE",
            is_handicap: false,
            is_electric_charging: false,
            current_session_id: null,
          },
          {
            slot_id: "slt_005",
            slot_name: "A105",
            floor: 1,
            zone: "A",
            vehicle_type_id: 1,
            status: "AVAILABLE",
            is_handicap: false,
            is_electric_charging: false,
            current_session_id: null,
          },
          {
            slot_id: "slt_006",
            slot_name: "B209",
            floor: 2,
            zone: "B",
            vehicle_type_id: 1,
            status: "OCCUPIED",
            is_handicap: false,
            is_electric_charging: true,
            current_session_id: "sess_986",
            occupied_by_plate: "43A-567.89",
          },
        ]);
        setIsFetchingSlots(false);
      }, 300);
    } catch (err) {
      console.error("Fetch Error:", err);
      setGlobalError(err.response?.data?.message || "Failed to load slots map.");
      setIsFetchingSlots(false);
    }
  };

  // --- API CALL 2: UPDATE SLOT STATUS (API §3.3) ---
  const handleUpdateSlotStatus = async (e) => {
    e.preventDefault();
    if (!activeSlot) return;
    setIsUpdatingSlot(true);
    setGlobalError(null);

    try {
      /*
      // === REAL AXIOS API CODE (Uncomment to use) ===
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/parking/slots/${activeSlot.slot_id}/status`,
        {
          status: newSlotStatus,
          reason: maintenanceReason,
          estimated_duration_minutes: estDuration,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.data.success) {
        setSlotsData((prev) => prev.map((s) => s.slot_id === activeSlot.slot_id ? { ...s, status: newSlotStatus } : s));
        logAction("SLOT", `Slot ${activeSlot.slot_name} changed to ${newSlotStatus}`);
        setActiveSlot(null);
        setMaintenanceReason("");
        fetchSlotsSummaryAndMatrix(); // Refresh counters
      }
      // ==============================================
      */

      // === MOCK DATA CODE (Delete when connecting to Backend) ===
      setTimeout(() => {
        setSlotsData((prev) => prev.map((s) => (s.slot_id === activeSlot.slot_id ? { ...s, status: newSlotStatus } : s)));
        logAction("SLOT", `Slot ${activeSlot.slot_name} forced to ${newSlotStatus}`);
        setIsUpdatingSlot(false);
        setActiveSlot(null);
        setMaintenanceReason("");
      }, 400);
    } catch (err) {
      console.error("Update Slot Error:", err);
      setGlobalError(err.response?.data?.message || "Failed to change slot status.");
      setIsUpdatingSlot(false);
    }
  };

  // --- API CALL 3: EMERGENCY GATE CONTROL (API §7.3) ---
  const handleGateControlOverride = async (e) => {
    e.preventDefault();
    if (!gateReason) return;
    setIsOverridingGate(true);
    setGlobalError(null);

    try {
      /*
      // === REAL AXIOS API CODE (Uncomment to use) ===
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/staff/gate-control`,
        {
          gate_id: activeGateId,
          action: gateAction,
          reason: gateReason,
          staff_id: currentStaffId,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.data.success) {
        logAction("GATE", `Sent [${gateAction.toUpperCase()}] to ${activeGateId}`);
        setGateReason("");
      }
      // ==============================================
      */

      // === MOCK DATA CODE (Delete when connecting to Backend) ===
      setTimeout(() => {
        logAction("GATE", `Manual [${gateAction.toUpperCase()}] signal sent to ${activeGateId}`);
        setIsOverridingGate(false);
        setGateReason("");
      }, 400);
    } catch (err) {
      console.error("Gate Control Error:", err);
      setGlobalError(err.response?.data?.message || "Failed to send gate signal.");
      setIsOverridingGate(false);
    }
  };

  const logAction = (module, message) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setOperationLogs((prev) => [`[${timestamp}] [${module}] ${message}`, ...prev].slice(0, 4));
  };

  return (
    <div className="w-full h-auto pb-12 space-y-4 font-sans antialiased text-slate-700 dark:text-slate-200">
      {/* ERROR MESSAGE DISPLAY */}
      {globalError && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-4 rounded-xl text-sm text-red-600 dark:text-red-400">
          <AlertTriangle size={18} className="shrink-0" />
          <div className="font-semibold">{globalError}</div>
        </div>
      )}

      {/* SECTION 1: SLOTS COUNTER BAR */}
      {slotsSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg text-center">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Slots</span>
            <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-mono">{slotsSummary.total_slots}</span>
          </div>
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-center">
            <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">Available</span>
            <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{slotsSummary.available}</span>
          </div>
          <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-center">
            <span className="text-xs font-bold text-red-500 uppercase block mb-1">Occupied</span>
            <span className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 font-mono">{slotsSummary.occupied}</span>
          </div>
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-lg text-center">
            <span className="text-xs font-bold text-amber-500 uppercase block mb-1">Reserved</span>
            <span className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono">{slotsSummary.reserved}</span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center col-span-2 md:col-span-1">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Maintenance</span>
            <span className="text-2xl md:text-3xl font-bold text-slate-600 dark:text-slate-400 font-mono">{slotsSummary.maintenance}</span>
          </div>
        </div>
      )}

      {/* FILTER SYSTEM BAR */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mr-2">
          <Sliders size={16} className="text-blue-500" /> Filters
        </div>

        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none">
          <option value="">All Floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
        </select>

        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none">
          <option value="">All Zones</option>
          <option value="A">Zone A</option>
          <option value="B">Zone B</option>
          <option value="C">Zone C</option>
        </select>

        <select
          value={selectedVehicleType}
          onChange={(e) => setSelectedVehicleType(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none">
          <option value="">All Vehicles</option>
          <option value="1">Car</option>
          <option value="2">Motorbike</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="RESERVED">Reserved</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        {isFetchingSlots && <RefreshCw size={16} className="animate-spin text-blue-500 ml-auto" />}
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* LEFT PANEL: PARKING SLOTS MAP */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[480px]">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Grid size={16} className="text-blue-500" /> Parking Slots Map
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slotsData.map((slot) => {
                const isSelected = activeSlot?.slot_id === slot.slot_id;
                let statusClasses = "border-emerald-200 bg-emerald-50/40 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400";
                if (slot.status === "OCCUPIED") statusClasses = "border-red-200 bg-red-50/40 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400";
                if (slot.status === "RESERVED") statusClasses = "border-amber-200 bg-amber-50/40 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400";
                if (slot.status === "MAINTENANCE") statusClasses = "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400";

                return (
                  <div
                    key={slot.slot_id}
                    onClick={() => setActiveSlot(slot)}
                    className={`p-4 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${statusClasses} ${isSelected ? "ring-2 ring-blue-600 border-transparent" : "hover:shadow-sm"}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-base font-bold font-mono">{slot.slot_name}</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        {slot.is_electric_charging && <BatteryCharging size={14} className="text-teal-500" />}
                        {slot.is_handicap && <Accessibility size={14} className="text-indigo-500" />}
                      </div>
                    </div>

                    <div className="mt-3 text-xs font-semibold font-mono opacity-90">
                      <span>
                        Floor {slot.floor} • Zone {slot.zone}
                      </span>
                    </div>

                    {slot.occupied_by_plate && (
                      <div className="mt-2 pt-1.5 border-t border-dashed border-inherit text-sm font-bold text-slate-900 dark:text-slate-100 font-mono truncate">
                        🚘 {slot.occupied_by_plate}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col space-y-2 text-sm text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
              <Eye size={14} /> Map Guide
            </span>
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-sans font-semibold text-sm">
              <span className="text-emerald-600">● Available</span>
              <span className="text-red-600">● Occupied</span>
              <span className="text-amber-600">● Reserved</span>
              <span className="text-slate-500">● Maintenance</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: ACTIONS SYSTEM */}
        <div className="flex flex-col gap-5 h-full justify-between">
          {/* PANEL 1: UPDATE SLOT STATUS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Settings size={16} className="text-blue-500" /> Update Slot Status
              </h3>

              {activeSlot ? (
                <form onSubmit={handleUpdateSlotStatus} className="space-y-4 text-sm">
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-blue-500 uppercase block">Selected Slot</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white font-mono">Name: {activeSlot.slot_name}</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white dark:bg-slate-900 text-slate-500 font-mono uppercase border border-slate-200 dark:border-slate-700">
                      Now: {activeSlot.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Change Status to</label>
                      <select
                        value={newSlotStatus}
                        onChange={(e) => setNewSlotStatus(e.target.value)}
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                        <option value="AVAILABLE">AVAILABLE (Free Slot)</option>
                        <option value="MAINTENANCE">MAINTENANCE (Lock Slot)</option>
                        <option value="RESERVED">RESERVED (Hold Slot)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Duration (Minutes)</label>
                      <input
                        type="number"
                        required
                        value={estDuration}
                        onChange={(e) => setEstDuration(Number(e.target.value))}
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Reason</label>
                    <input
                      type="text"
                      required
                      value={maintenanceReason}
                      onChange={(e) => setMaintenanceReason(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., Broken sensor, cleaning oil leak..."
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSlot(null)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingSlot}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm">
                      {isUpdatingSlot ? "Saving..." : "Confirm Update"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="h-28 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-center p-5 text-sm font-semibold text-slate-400">
                  Please click on a slot from the map to modify its status.
                </div>
              )}
            </div>
          </div>

          {/* PANEL 2: GATE CONTROL PANEL */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <ShieldAlert className="text-red-500" size={16} /> Gate Control Panel
              </h3>

              <form onSubmit={handleGateControlOverride} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Target Gate</label>
                    <select
                      value={activeGateId}
                      onChange={(e) => setActiveGateId(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="gate_in_01">GATE IN 01 (Entrance)</option>
                      <option value="gate_out_01">GATE OUT 01 (Exit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Action Signal</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGateAction("open")}
                        className={`py-2 border rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${gateAction === "open" ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600" : "border-slate-200 dark:border-slate-800 text-slate-500"}`}>
                        <Unlock size={14} /> Open
                      </button>
                      <button
                        type="button"
                        onClick={() => setGateAction("close")}
                        className={`py-2 border rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${gateAction === "close" ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600" : "border-slate-200 dark:border-slate-800 text-slate-500"}`}>
                        <Lock size={14} /> Close
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Emergency Reason</label>
                  <input
                    type="text"
                    required
                    value={gateReason}
                    onChange={(e) => setGateReason(e.target.value)}
                    className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., VIP escort caravan, sensor malfunction hardware fix..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isOverridingGate || !gateReason}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-blue-900/20 dark:disabled:bg-blue-950/40 disabled:text-blue-700/40 dark:disabled:text-blue-400/30 font-bold text-sm py-3 rounded-xl text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 border border-transparent disabled:border-blue-900/10 dark:disabled:border-blue-500/10">
                  {isOverridingGate ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                  Send Signal (Press Enter)
                </button>
              </form>
            </div>

            {/* LIVE ACTION LOG FEED */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase block font-mono">Recent Actions Log</span>
              <div className="space-y-1.5">
                {operationLogs.length > 0 ? (
                  operationLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-medium font-mono text-slate-800 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-800/20 p-2 rounded border border-slate-100 dark:border-slate-800/40">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-medium font-mono text-slate-400 py-1">No actions sent in this work shift.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
