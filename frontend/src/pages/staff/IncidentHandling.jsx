import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Hash, ShieldAlert, History, RefreshCw, Search, Phone, HelpCircle, AlertCircle, CarFront, Paperclip } from "lucide-react";

const getBackendRootUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5077";
  return baseUrl.replace("/api/v1", "");
};
// import axios from "axios"; 


export default function IncidentHandlingPage() {
  const parseDescription = (description) => {
    if (!description) return { text: "", attachment: "" };
    const match = description.match(/\[Attachment:\s*([^\]]+)\]/);
    if (match) {
      const attachment = match[1];
      const text = description.replace(/\[Attachment:\s*[^\]]+\]/, "").trim();
      return { text, attachment };
    }
    return { text: description, attachment: "" };
  };

  // ==========================================
  // CORE STATE MANAGEMENT (ENUM DB BOUND)
  // ==========================================
  const [issueType, setIssueType] = useState("LOST_TICKET");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [apiError, setApiError] = useState("");

  // --- Form State: LOST_TICKET ---
  const [lostPlate, setLostPlate] = useState("");
  const [lostVehicleType, setLostVehicleType] = useState(1);
  const [estCheckIn, setEstCheckIn] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // --- Form State: WRONG_SLOT / MISMATCH ---
  const [sessionId, setSessionId] = useState("");
  const [correctedPlate, setCorrectedPlate] = useState("");
  const [originalPlate, setOriginalPlate] = useState("");
  const [mismatchReason, setMismatchReason] = useState("");

  // --- Form State: SYSTEM_ERROR & OTHER ---
  const [affectedDevice, setAffectedDevice] = useState("GATE_CAMERA_01");
  const [generalDescription, setGeneralDescription] = useState("");

  // --- Feed State ---
  const [recentIncidents, setRecentIncidents] = useState([]);

  // ==========================================
  // [AXIOS] FETCH LIVE ALERTS
  // ==========================================
  useEffect(() => {
    const fetchActiveExceptions = async () => {
      try {
        // [AXIOS INTEGRATION]
        // const token = localStorage.getItem("access_token");
        // const response = await axios.get(`${API_BASE_URL}/api/v1/reports/exceptions`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // if (response.data.success) setRecentIncidents(response.data.data);

        setRecentIncidents([
          {
            log_id: 1024,
            issue_type: "WRONG_SLOT",
            session_id: "sess_4812",
            description: "OCR read error: Misidentified character '5' as 'S'",
            report_time: "10:15 AM",
            status: "OPEN",
          },
          {
            log_id: 1023,
            issue_type: "LOST_TICKET",
            session_id: "sess_9861",
            description: "Unrecorded entry. Camera was rebooting at estimated time.",
            report_time: "09:30 AM",
            status: "RESOLVED",
          },
          {
            log_id: 1022,
            issue_type: "SYSTEM_ERROR",
            session_id: "N/A",
            description: "Boom Barrier B2 motor jammed. Manual override initiated.",
            report_time: "07:45 AM",
            status: "RESOLVED",
          },
        ]);
      } catch (err) {
        console.error("Failed to load shift log alerts:", err);
      }
    };
    fetchActiveExceptions();
  }, []);

  // ==========================================
  // [AXIOS] SUBMIT INCIDENT TRANSACTION
  // ==========================================
  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError("");

    let endpoint = `${API_BASE_URL}/api/v1/staff/incident/lost-ticket`;
    let payload = {};

    if (issueType === "LOST_TICKET") {
      payload = {
        license_plate: lostPlate,
        vehicle_type_id: Number(lostVehicleType),
        check_in_time_estimated: estCheckIn,
        lost_reason: lostReason,
        customer_phone: customerPhone,
      };
    } else if (issueType === "WRONG_SLOT") {
      endpoint = `${API_BASE_URL}/api/v1/staff/incident/correct-mismatch`;
      payload = {
        session_id: sessionId,
        issue_type: "WRONG_SLOT",
        corrected_license_plate: correctedPlate,
        original_license_plate: originalPlate,
        reason: mismatchReason,
      };
    } else {
      endpoint = `${API_BASE_URL}/api/v1/staff/incident/log-generic`;
      payload = {
        issue_type: issueType,
        device_code: affectedDevice,
        description: generalDescription,
      };
    }

    try {
      // [AXIOS INTEGRATION]
      // const token = localStorage.getItem("access_token");
      // const response = await axios.post(endpoint, payload, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // if (response.data.success) {
      //   setActionSuccess({ type: issueType, data: response.data.data });
      // }

      // --- MOCK API TIMEOUT ---
      await new Promise((resolve) => setTimeout(resolve, 800));
      let mockResult = {
        log_id: Math.floor(1000 + Math.random() * 9000),
        status: "RESOLVED",
        execution_time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };

      if (issueType === "LOST_TICKET") {
        mockResult = {
          ...mockResult,
          session_id: `sess_rec_${Math.floor(100 + Math.random() * 900)}`,
          calculated_fee: 200000,
          breakdown: { max_daily_rate: 150000, handling_fee: 50000 },
        };
      } else {
        mockResult = {
          ...mockResult,
          session_id: sessionId || "N/A",
          message: "Data securely synchronized across core endpoints.",
        };
      }

      setActionSuccess({ type: issueType, data: mockResult });

      // Update UI Feed
      setRecentIncidents((prev) => [
        {
          log_id: mockResult.log_id,
          issue_type: issueType,
          session_id: mockResult.session_id || "N/A",
          description: issueType === "LOST_TICKET" ? lostReason : issueType === "WRONG_SLOT" ? mismatchReason : generalDescription,
          report_time: mockResult.execution_time,
          status: issueType === "LOST_TICKET" ? "OPEN" : "RESOLVED",
        },
        ...prev,
      ]);
    } catch (err) {
      setApiError(err.response?.data?.message || "Business logic restriction: Transaction failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetIncidentForm = () => {
    setActionSuccess(null);
    setLostPlate("");
    setLostReason("");
    setCustomerPhone("");
    setEstCheckIn("");
    setSessionId("");
    setCorrectedPlate("");
    setOriginalPlate("");
    setMismatchReason("");
    setGeneralDescription("");
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 text-slate-800 dark:text-slate-200 font-sans animate-slide-in max-w-7xl mx-auto">
      {/* ── TOP CONTROL BAR ── */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={24} />
            Incident & Exception Handling
          </h2>
        </div>

        {/* Dynamic Toggles based on DB ENUM */}
        {/* Dynamic Toggles based on DB ENUM */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto w-full sm:w-auto max-w-full scrollbar-none snap-x select-none">
          {["LOST_TICKET", "WRONG_SLOT", "SYSTEM_ERROR", "OTHER"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setIssueType(type);
                setActionSuccess(null);
                setApiError("");
              }}
              // Thêm class snap-center để trải nghiệm vuốt trên mobile mượt hơn
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap snap-center ${
                issueType === type
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}>
              {type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── LEFT COLUMN: DYNAMIC EXCEPTION FORM ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
          {actionSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exception Processed</h3>
                <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest">LOG_ID: #{actionSuccess.data.log_id}</p>
              </div>

              {actionSuccess.type === "LOST_TICKET" ? (
                <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-5 text-left text-sm space-y-2.5">
                  <div className="flex justify-between items-center border-b pb-2 dark:border-slate-700">
                    <span className="text-slate-500">Recovery Session:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-white">{actionSuccess.data.session_id}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 dark:border-slate-700">
                    <span className="text-slate-500">Max Daily Rate:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{actionSuccess.data.breakdown.max_daily_rate.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 dark:border-slate-700">
                    <span className="text-slate-500">Penalty Penalty:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{actionSuccess.data.breakdown.handling_fee.toLocaleString()} VND</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Total Amount Due:</span>
                    <span className="text-lg font-black text-red-600 dark:text-red-400 font-mono">{actionSuccess.data.calculated_fee.toLocaleString()} VND</span>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-5 text-left text-sm space-y-2.5">
                  <div className="flex justify-between items-center border-b pb-2 dark:border-slate-700">
                    <span className="text-slate-500">Target Session:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-white">{actionSuccess.data.session_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Audit Status:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-xs">SYNCED & RESOLVED</span>
                  </div>
                </div>
              )}

              <button
                onClick={resetIncidentForm}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md mt-4 active:scale-95">
                Log Another Incident
              </button>
            </div>
          ) : (
            <form onSubmit={handleIncidentSubmit} className="flex-1 flex flex-col justify-between h-full">
              <div className="space-y-5">
                {/* Dynamic Title */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                    {issueType === "LOST_TICKET"
                      ? "Unrecorded / Lost Ticket Resolution"
                      : issueType === "WRONG_SLOT"
                        ? "Plate / Slot Data Correction"
                        : "Hardware & System Incident"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Submit this form to bypass standard gate operations. Activity is logged.</p>
                </div>

                {apiError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs font-semibold text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} /> {apiError}
                  </div>
                )}

                {/* --- LOST TICKET FIELDS --- */}
                {issueType === "LOST_TICKET" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Declared Plate</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={lostPlate}
                            onChange={(e) => setLostPlate(e.target.value.toUpperCase())}
                            className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl bg-slate-50 dark:bg-slate-800/40 font-mono font-black text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="51H-123.45"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="tel"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl bg-slate-50 dark:bg-slate-800/40 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="0901234567"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle Type</label>
                        <select
                          value={lostVehicleType}
                          onChange={(e) => setLostVehicleType(Number(e.target.value))}
                          className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none">
                          <option value={1}>Automobile (Car)</option>
                          <option value={2}>Motorcycle (Bike)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Est. Entry Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={estCheckIn}
                          onChange={(e) => setEstCheckIn(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl bg-slate-50 dark:bg-slate-800/40 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Incident Report / Reason</label>
                      <textarea
                        required
                        rows={3}
                        value={lostReason}
                        onChange={(e) => setLostReason(e.target.value)}
                        className="block w-full px-3 py-3 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl bg-slate-50 dark:bg-slate-800/40 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Detail the customer's explanation..."
                      />
                    </div>
                  </>
                )}

                {/* --- WRONG SLOT / MISMATCH FIELDS --- */}
                {issueType === "WRONG_SLOT" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">System Session ID</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="sess_12345"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Original (Misread) Plate</label>
                        <input
                          type="text"
                          required
                          value={originalPlate}
                          onChange={(e) => setOriginalPlate(e.target.value.toUpperCase())}
                          className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g. 5IH-123.45"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Verified Correct Plate</label>
                      <input
                        type="text"
                        required
                        value={correctedPlate}
                        onChange={(e) => setCorrectedPlate(e.target.value.toUpperCase())}
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-sm font-mono font-black uppercase tracking-wider focus:ring-2 focus:ring-blue-500 outline-none border-blue-200 dark:border-blue-900/50"
                        placeholder="ENTER ACTUAL VERIFIED PLATE"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Audit Reason</label>
                      <textarea
                        required
                        rows={2}
                        value={mismatchReason}
                        onChange={(e) => setMismatchReason(e.target.value)}
                        className="block w-full px-3 py-3 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="e.g. YOLO misidentified number 8 as letter B due to mud."
                      />
                    </div>
                  </>
                )}

                {/* --- SYSTEM ERROR & OTHER --- */}
                {(issueType === "SYSTEM_ERROR" || issueType === "OTHER") && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Affected Hardware / Node Code</label>
                      <input
                        type="text"
                        required
                        value={affectedDevice}
                        onChange={(e) => setAffectedDevice(e.target.value.toUpperCase())}
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Incident Technical Description</label>
                      <textarea
                        required
                        rows={5}
                        value={generalDescription}
                        onChange={(e) => setGeneralDescription(e.target.value)}
                        className="block w-full px-3 py-3 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Describe what happened and immediate actions taken..."
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-8 bg-slate-950 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                {isSubmitting ? "Committing to DB..." : "Log Exception & Override"}
              </button>
            </form>
          )}
        </div>

        {/* ── RIGHT COLUMN: ACTIVE INCIDENTS FEED ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px] h-[calc(100vh-200px)]">
          <h3 className="flex-shrink-0 text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pb-4 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            <History size={15} className="text-blue-500" /> Audit Log Feed
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-3 custom-scrollbar">
            {recentIncidents.length > 0 ? (
              recentIncidents.map((incident, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col space-y-3 shadow-xs hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                          incident.issue_type === "LOST_TICKET"
                            ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                            : incident.issue_type === "WRONG_SLOT"
                              ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                              : "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50"
                        }`}>
                        {incident.issue_type}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">ID: #{incident.log_id}</span>
                    </div>
                    <span className={`text-[10px] font-black tracking-widest uppercase ${incident.status === "OPEN" ? "text-red-500 animate-pulse" : "text-emerald-500"}`}>
                      {incident.status}
                    </span>
                  </div>

                  {(() => {
                    const { text: parsedDesc, attachment } = parseDescription(incident.description);
                    const backendRoot = getBackendRootUrl();

                    return (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-snug">{parsedDesc}</p>
                        {attachment && (
                          <div className="mt-1">
                            <a
                              href={`${backendRoot}${attachment}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                            >
                              <Paperclip size={10} />
                              View Attachment
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700/60 text-[11px] font-bold text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      <CarFront size={12} /> {incident.session_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {incident.report_time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 opacity-60">
                <CheckCircle2 size={40} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No exceptions recorded.</p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 mt-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 flex items-center gap-2.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            <HelpCircle size={16} className="shrink-0" />
            <span>All manual data corrections are securely logged into the INCIDENT_LOG database for manager auditing.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
