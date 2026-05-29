import React, { useState, useEffect } from "react";
import {
  Grid,
  CheckCircle2,
  RefreshCw,
  Eye,
  Settings,
  ShieldAlert,
  Sliders,
  Unlock,
  Lock,
  BatteryCharging,
  Accessibility,
} from "lucide-react";

export default function SlotGateManagementPage() {
  // ==========================================
  // CORE STATE MANAGEMENT (Khớp chuẩn DB & API)
  // ==========================================
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
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

  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(false);
  const [isOverridingGate, setIsOverridingGate] = useState(false);
  const [operationLogs, setOperationLogs] = useState([]);

  // ==========================================
  // INITIAL MOUNT: Tải sơ đồ slots thời gian thực
  // ==========================================
  useEffect(() => {
    fetchSlotsSummaryAndMatrix();
  }, [selectedFloor, selectedZone, selectedStatus]);

  const fetchSlotsSummaryAndMatrix = () => {
    setIsFetchingSlots(true);
    /**
     *  BACKEND API INTEGRATION BLUEPRINT:
     * Target Endpoint: GET /api/v1/parking/slots
     * Documentation Ref: Section 3.2 (Get Parking Slots with Real-time Status)
     * Request Headers: { "Authorization": "Bearer JWT_ACCESS_TOKEN" }
     * Query Parameters: ?floor=${selectedFloor}&zone=${selectedZone}&status=${selectedStatus}
     */
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
          current_session_id: "sess_12345",
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
          current_session_id: "sess_4812",
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
          current_session_id: "sess_9861",
          occupied_by_plate: "43A-567.89",
        },
      ]);
      setIsFetchingSlots(false);
    }, 400);
  };

  // ==========================================
  // TRANSACTION 1: CẬP NHẬT TRẠNG THÁI Ô ĐỖ
  // ==========================================
  const handleUpdateSlotStatus = (e) => {
    e.preventDefault();
    if (!activeSlot) return;
    setIsUpdatingSlot(true);

    /**
     *  BACKEND API INTEGRATION BLUEPRINT:
     * Target Endpoint: PUT /api/v1/parking/slots/{slot_id}/status
     * Documentation Ref: Section 3.3 (Update Slot Status)
     */
    setTimeout(() => {
      setSlotsData((prev) =>
        prev.map((s) =>
          s.slot_id === activeSlot.slot_id
            ? { ...s, status: newSlotStatus }
            : s,
        ),
      );

      logAction(
        `SLOT OVR`,
        `Slot ${activeSlot.slot_name} forced to ${newSlotStatus}. Reason: ${maintenanceReason || "None"}`,
      );
      setIsUpdatingSlot(false);
      setActiveSlot(null);
      setMaintenanceReason("");
    }, 600);
  };

  // ==========================================
  // TRANSACTION 2: ĐIỀU KHIỂN CỔNG BARRIER THỦ CÔNG
  // ==========================================
  const handleGateControlOverride = (e) => {
    e.preventDefault();
    setIsOverridingGate(true);

    /**
     *  BACKEND API INTEGRATION BLUEPRINT:
     * Target Endpoint: POST /api/v1/staff/gate-control
     * Documentation Ref: Section 7.3 (Manual Gate Control khẩn cấp)
     */
    setTimeout(() => {
      logAction(
        `GATE OVR`,
        `Manual signal [${gateAction.toUpperCase()}] sent to ${activeGateId}. Reason: ${gateReason}`,
      );
      setIsOverridingGate(false);
      setGateReason("");
    }, 600);
  };

  const logAction = (module, message) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setOperationLogs((prev) =>
      [`[${timestamp}] [${module}] ${message}`, ...prev].slice(0, 4),
    );
  };

  return (
    <div className="animate-slide-in w-full h-auto pb-12 space-y-4 font-sans antialiased text-slate-700 dark:text-slate-200">
      {/* SECTION 1: SYSTEM OVERVIEW & METRICS BAR */}
      {slotsSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-lg text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Lots
            </span>
            <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-mono">
              {slotsSummary.total_slots}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-center">
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block mb-1">
              Available
            </span>
            <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {slotsSummary.available}
            </span>
          </div>
          <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-lg text-center">
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider block mb-1">
              Occupied
            </span>
            <span className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 font-mono">
              {slotsSummary.occupied}
            </span>
          </div>
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-lg text-center">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block mb-1">
              Reserved
            </span>
            <span className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {slotsSummary.reserved}
            </span>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center col-span-2 md:col-span-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Maintenance
            </span>
            <span className="text-2xl md:text-3xl font-bold text-slate-600 dark:text-slate-400 font-mono">
              {slotsSummary.maintenance}
            </span>
          </div>
        </div>
      )}

      {/* FILTER SEARCH SYSTEM BAR */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/*  ĐÃ SỬA: Tăng tiêu đề bộ lọc lên text-base */}
        <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mr-2">
          <Sliders size={16} className="text-blue-500" /> Matrix Filters
        </div>
        {/*  ĐÃ SỬA: Tăng kích thước chữ bên trong dropdown lên text-sm */}
        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
        </select>

        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Zones</option>
          <option value="A">Zone A</option>
          <option value="B">Zone B</option>
          <option value="C">Zone C</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="RESERVED">Reserved</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        {isFetchingSlots && (
          <RefreshCw size={16} className="animate-spin text-blue-500 ml-auto" />
        )}
      </div>

      {/* SECTION 2: GRID LAYOUT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* LEFT COMPONENT PANEL: REAL-TIME SLOT MATRIX */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[480px]">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 tracking-tight">
              <Grid size={16} className="text-blue-500" />
              Real-time Parking Slot Infrastructure Matrix
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slotsData.map((slot) => {
                const isSelected = activeSlot?.slot_id === slot.slot_id;
                let statusClasses =
                  "border-emerald-200 bg-emerald-50/40 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-400";
                if (slot.status === "OCCUPIED")
                  statusClasses =
                    "border-red-200 bg-red-50/40 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400";
                if (slot.status === "RESERVED")
                  statusClasses =
                    "border-amber-200 bg-amber-50/40 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-400";
                if (slot.status === "MAINTENANCE")
                  statusClasses =
                    "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400";

                return (
                  <div
                    key={slot.slot_id}
                    onClick={() => setActiveSlot(slot)}
                    className={`p-4 border rounded-xl flex flex-col justify-between cursor-pointer transition-all relative ${statusClasses} ${isSelected ? "ring-2 ring-blue-600 border-transparent scale-[0.98]" : "hover:shadow-sm"}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-base font-bold font-mono tracking-wide">
                        {slot.slot_name}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400">
                        {slot.is_electric_charging && (
                          <BatteryCharging
                            size={14}
                            className="text-teal-500"
                          />
                        )}
                        {slot.is_handicap && (
                          <Accessibility
                            size={14}
                            className="text-indigo-500"
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center text-xs font-semibold font-mono opacity-90 uppercase tracking-wider">
                      <span>
                        F{slot.floor} • Z{slot.zone}
                      </span>
                      <span className="font-sans text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-inherit shadow-2xs">
                        {slot.status}
                      </span>
                    </div>

                    {slot.occupied_by_plate && (
                      <div className="mt-2 pt-1.5 border-t border-dashed border-inherit text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tracking-wide truncate">
                        🚘 {slot.occupied_by_plate}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col space-y-2 text-sm text-slate-400 font-mono">
            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Eye size={14} /> Matrix Legend
            </span>
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-sans font-semibold text-sm">
              <span className="text-emerald-600 flex items-center gap-1">
                ● Available
              </span>
              <span className="text-red-600 flex items-center gap-1">
                ● Occupied
              </span>
              <span className="text-amber-600 flex items-center gap-1">
                ● Reserved
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                ● Maintenance
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT PANEL: ACTION OVERRIDES */}
        <div className="flex flex-col gap-5 h-full justify-between">
          {/* SUB-PANEL 1: FORCED SLOT STATUS EFFECTOR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 tracking-tight">
                <Settings size={16} className="text-blue-500" />
                Infrastructure Slot Override Controls
              </h3>

              {activeSlot ? (
                <form
                  onSubmit={handleUpdateSlotStatus}
                  className="space-y-4 text-sm"
                >
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block">
                        Target Selection
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        Slot ID: {activeSlot.slot_name}
                      </span>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white dark:bg-slate-900 text-slate-500 font-mono uppercase border border-slate-200 dark:border-slate-700">
                      Current: {activeSlot.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Override Status
                      </label>
                      <select
                        value={newSlotStatus}
                        onChange={(e) => setNewSlotStatus(e.target.value)}
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="AVAILABLE">
                          AVAILABLE (Force Vacant)
                        </option>
                        <option value="MAINTENANCE">
                          MAINTENANCE (Lock Slot)
                        </option>
                        <option value="RESERVED">RESERVED (Hold Slot)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Est. Duration (Minutes)
                      </label>
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Modification Reason
                    </label>
                    <input
                      type="text"
                      required
                      value={maintenanceReason}
                      onChange={(e) => setMaintenanceReason(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      placeholder="e.g., Sensor fault, Hardware structural cleaning..."
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveSlot(null)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase tracking-wider text-xs transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingSlot}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-slate-200 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-sm"
                    >
                      {isUpdatingSlot
                        ? "Applying Override..."
                        : "Push Status Update"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="h-28 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-center p-5 text-sm font-semibold text-slate-400">
                  Select any slot from the infrastructure matrix to apply forced
                  status overrides.
                </div>
              )}
            </div>
          </div>

          {/* SUB-PANEL 2: EMERGENCY GATE OVERRIDE DASHBOARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 tracking-tight">
                <ShieldAlert className="text-red-500" size={16} />
                Emergency Hardware Gate Overrides (Manual Signals)
              </h3>

              <form
                onSubmit={handleGateControlOverride}
                className="space-y-4 text-sm"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Target Barrier Gate Terminal
                    </label>
                    <select
                      value={activeGateId}
                      onChange={(e) => setActiveGateId(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="gate_in_01">
                        GATE_IN_01 (Entrance Turnstile)
                      </option>
                      <option value="gate_out_01">
                        GATE_OUT_01 (Main Exit Barrier)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Manual Action Signal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGateAction("open")}
                        className={`py-2 border rounded-lg font-bold uppercase text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 ${gateAction === "open" ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600" : "border-slate-200 dark:border-slate-800 text-slate-500"}`}
                      >
                        <Unlock size={14} /> Open
                      </button>
                      <button
                        type="button"
                        onClick={() => setGateAction("close")}
                        className={`py-2 border rounded-lg font-bold uppercase text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 ${gateAction === "close" ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600" : "border-slate-200 dark:border-slate-800 text-slate-500"}`}
                      >
                        <Lock size={14} /> Close
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Emergency Override Reason
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={gateReason}
                      onChange={(e) => setGateReason(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      placeholder="e.g., VIP Convoy Escort, Hardware loop replacement trigger..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOverridingGate || !gateReason}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 font-bold uppercase tracking-wider text-sm py-3 rounded-xl text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
                >
                  {isOverridingGate ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <ShieldAlert size={14} />
                  )}
                  Transmit Gate Pulse Signal (Enter)
                </button>
              </form>
            </div>

            {/* Audit Log Operation Feed */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Live Audit Signals Issued
              </span>
              <div className="space-y-1.5">
                {operationLogs.length > 0 ? (
                  operationLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-medium font-mono text-slate-800 dark:text-slate-400 truncate leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-2 rounded border border-slate-100 dark:border-slate-800/40"
                    >
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-medium font-mono text-slate-400 py-1">
                    No emergency overrides dispatched in this shift.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
