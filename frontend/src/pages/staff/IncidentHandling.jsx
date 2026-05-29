import React, { useState, useEffect } from "react";
import {CheckCircle2,Clock,Hash,ShieldAlert,History,RefreshCw,Search,Phone,HelpCircle,} from "lucide-react";

export default function IncidentHandlingPage() {
  // ==========================================
  // CORE STATE MANAGEMENT (Maps to DB ENUMs)
  // ==========================================
  // DB ref: INCIDENT_LOG.ISSUE_TYPE ENUM('LOST_TICKET','WRONG_SLOT','SYSTEM_ERROR','OTHER')
  const [issueType, setIssueType] = useState("LOST_TICKET");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // --- Form State: Lost Ticket (LOST_TICKET) ---
  const [lostPlate, setLostPlate] = useState("");
  const [lostVehicleType, setLostVehicleType] = useState(1);
  const [estCheckIn, setEstCheckIn] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // --- Form State: Plate/Slot Mismatch (WRONG_SLOT) ---
  const [sessionId, setSessionId] = useState("");
  const [correctedPlate, setCorrectedPlate] = useState("");
  const [originalPlate, setOriginalPlate] = useState("");
  const [mismatchReason, setMismatchReason] = useState("");

  // --- Incident Tracking History (Sidebar Feed) ---
  const [recentIncidents, setRecentIncidents] = useState([]);

  // ==========================================
  // INITIAL DATA MOUNT: Fetch Open Incidents
  // ==========================================
  useEffect(() => {
    /**
     * BACKEND API INTEGRATION PLACEHOLDER:
     * Target Endpoint: GET /api/v1/reports/exceptions (or GET /api/v1/staff/dashboard for live shift alerts)
     * Documentation Ref: Section 9.3 (Exception / Incident Report) & Section 7.4 (Staff Dashboard)
     * Request Headers: { "Authorization": "Bearer JWT_ACCESS_TOKEN" }
     * * Axios Integration Example:
     * axios.get('http://localhost:5000/api/v1/reports/exceptions', { headers })
     * .then(res => setRecentIncidents(res.data.data.by_status_or_raw_logs))
     */
    setRecentIncidents([
      {
        log_id: 1024,
        issue_type: "WRONG_SLOT",
        session_id: "sess_4812",
        description:
          "OCR read error: Misidentified the ending character '5' as '6'",
        report_time: "10:15 AM",
        status: "OPEN",
      },
      {
        log_id: 1023,
        issue_type: "LOST_TICKET",
        session_id: "sess_9861",
        description:
          "Customer misplaced the physical parking ticket near Floor 2 elevator",
        report_time: "09:30 AM",
        status: "RESOLVED",
      },
    ]);
  }, []);

  // ==========================================
  // TRANSACTION SUBMISSION HANDLERS
  // ==========================================
  const handleIncidentSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    /**
     *  BACKEND API INTEGRATION BLUEPRINT
     * This handler branches into two distinct POST endpoints depending on 'issueType'.
     * Both endpoints require Bearer Token authentication derived from user login claims.
     */
    setTimeout(() => {
      let mockResult = {
        log_id: Math.floor(1000 + Math.random() * 9000),
        status: "RESOLVED",
        execution_time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      if (issueType === "LOST_TICKET") {
        /**
         *  CASE 1: LOST TICKET EXCEPTION
         * Target Endpoint: POST /api/v1/staff/lost-ticket
         * Documentation Ref: Section 7.1 (Handle Lost Ticket)
         * Content-Type: application/json
         * * Expected Request Body:
         * {
         * "license_plate": lostPlate,                    // Maps to INCIDENT_LOG.CUSTOMER_PLATE
         * "vehicle_type_id": lostVehicleType,            // Linked to VEHICLE_TYPE table
         * "check_in_time_estimated": estCheckIn,         // User estimated input
         * "lost_reason": lostReason,                      // Maps to INCIDENT_LOG.DESCRIPTION
         * "staff_id": "usr_001"                          // Extracted from JWT Claims (sub)
         * }
         * * Expected Response Data Mapping (200 OK):
         * res.data.data -> { session_id, calculated_fee, breakdown: { max_daily_rate, handling_fee } }
         */
        mockResult = {
          ...mockResult,
          session_id: `sess_lost_${Math.floor(100 + Math.random() * 900)}`,
          calculated_fee: 200000,
          breakdown: { max_daily_rate: 150000, handling_fee: 50000 },
        };
      } else {
        /**
         *  CASE 2: PLATE/SLOT MISMATCH CORRECTION
         * Target Endpoint: POST /api/v1/staff/correct-mismatch
         * Documentation Ref: Section 7.2 (Handle Plate/Slot Mismatch)
         * Content-Type: application/json
         * * Expected Request Body:
         * {
         * "session_id": sessionId,                       // Foreign Key pointing to PARKING_SESSION
         * "issue_type": "WRONG_SLOT",                    // INCIDENT_LOG.ISSUE_TYPE ENUM value
         * "corrected_license_plate": correctedPlate,     // Saved as new LICENSE_PLATE_IN value
         * "original_license_plate": originalPlate,       // Logged inside incident description
         * "reason": mismatchReason,                      // Maps to INCIDENT_LOG.DESCRIPTION
         * "staff_id": "usr_001"                          // Captured via current logged-in user context
         * }
         * * Expected Response Data Mapping (200 OK):
         * res.data.data -> { incident_log_id, session_id, status: "RESOLVED" }
         */
        mockResult = {
          ...mockResult,
          session_id: sessionId,
          message: "Mismatch corrected successfully.",
        };
      }

      setActionSuccess({ type: issueType, data: mockResult });

      setRecentIncidents((prev) => [
        {
          log_id: mockResult.log_id,
          issue_type: issueType,
          session_id: mockResult.session_id || "N/A",
          description:
            issueType === "LOST_TICKET" ? lostReason : mismatchReason,
          report_time: mockResult.execution_time,
          status: issueType === "LOST_TICKET" ? "OPEN" : "RESOLVED",
        },
        ...prev,
      ]);
      setIsSubmitting(false);
    }, 800);
  };

  const resetIncidentForm = () => {
    setActionSuccess(null);
    setLostPlate("");
    setLostReason("");
    setCustomerPhone("");
    setSessionId("");
    setCorrectedPlate("");
    setOriginalPlate("");
    setMismatchReason("");
  };

  return (
    <div className="animate-slide-in w-full h-auto pb-12 space-y-4 font-sans antialiased text-slate-800 dark:text-slate-200">
      {/* SECTION 1: TOP CONTROL BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={22} />
            Incident & Exception Handling
          </h2>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setIssueType("LOST_TICKET");
              setActionSuccess(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${issueType === "LOST_TICKET" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Lost Ticket
          </button>
          <button
            type="button"
            onClick={() => {
              setIssueType("WRONG_SLOT");
              setActionSuccess(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${issueType === "WRONG_SLOT" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Plate/Slot Mismatch
          </button>
        </div>
      </div>

      {/* SECTION 2: SYMMETRICAL TWO-COLUMN WORKSPACE GRID (50/50 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* LEFT PANEL: INTERACTIVE LOGGING FORM */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[460px]">
          {actionSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Incident Processed Successfully
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  LOG_ID: {actionSuccess.data.log_id}
                </p>
              </div>

              {actionSuccess.type === "LOST_TICKET" ? (
                <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between border-b border-slate-200/40 dark:border-slate-700/50 pb-1.5">
                    <span className="text-slate-400">Lost Ticket Session:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {actionSuccess.data.session_id}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/40 dark:border-slate-700/50 pb-1.5">
                    <span className="text-slate-400">Max Daily Rate Fee:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {actionSuccess.data.breakdown.max_daily_rate.toLocaleString()}{" "}
                      VND
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/40 dark:border-slate-700/50 pb-1.5">
                    <span className="text-slate-400">
                      Lost Card Penalty Fee:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {actionSuccess.data.breakdown.handling_fee.toLocaleString()}{" "}
                      VND
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Total Penalty Fee:
                    </span>
                    <span className="text-base font-black text-red-600 dark:text-red-400 font-mono">
                      {actionSuccess.data.calculated_fee.toLocaleString()} VND
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parking Session ID:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {actionSuccess.data.session_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">System Status:</span>
                    <span className="font-bold text-emerald-600">
                      RESOLVED (Data Synchronized)
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={resetIncidentForm}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Log Another Incident
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleIncidentSubmit}
              className="flex-1 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {issueType === "LOST_TICKET" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Declared License Plate
                        </label>
                        <div className="relative">
                          <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={lostPlate}
                            onChange={(e) =>
                              setLostPlate(e.target.value.toUpperCase())
                            }
                            className="block w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 font-extrabold text-sm uppercase tracking-wide text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                            placeholder="e.g., 29A-123.45"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Customer Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="tel"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="block w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                            placeholder="e.g., 0901234567"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Vehicle Classification
                        </label>
                        <select
                          value={lostVehicleType}
                          onChange={(e) =>
                            setLostVehicleType(Number(e.target.value))
                          }
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={1}>Automobile (Car)</option>
                          <option value={2}>Motorbike</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Estimated Check-In Time
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={estCheckIn}
                          onChange={(e) => setEstCheckIn(e.target.value)}
                          className="block w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Lost Reason & Operational Notes
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={lostReason}
                        onChange={(e) => setLostReason(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-none"
                        placeholder="Provide deep description of the issue or locations where the customer claims the token was dropped..."
                      />
                    </div>
                  </>
                )}

                {issueType === "WRONG_SLOT" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Current Session ID
                        </label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="block w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                            placeholder="e.g., sess_12345"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Original System-Read Plate
                        </label>
                        <input
                          type="text"
                          required
                          value={originalPlate}
                          onChange={(e) =>
                            setOriginalPlate(e.target.value.toUpperCase())
                          }
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm font-semibold uppercase text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Faulty license plate read"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Corrected License Plate
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={correctedPlate}
                          onChange={(e) =>
                            setCorrectedPlate(e.target.value.toUpperCase())
                          }
                          className="block w-full pl-8 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-base font-extrabold tracking-wider uppercase text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                          placeholder="Enter physical verified license plate number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Data Correction Reason
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={mismatchReason}
                        onChange={(e) => setMismatchReason(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-none"
                        placeholder="Explain reason (e.g., Camera lens glare caused OCR error, Driver parked in unassigned bay)..."
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                {isSubmitting
                  ? "Processing Request..."
                  : "Confirm Exception Resolution (Enter)"}
              </button>
            </form>
          )}
        </div>

        {/* RIGHT PANEL: LIVE SYSTEM INCIDENT FEED */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col transition-all h-full justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 pb-1.5 tracking-tight border-b border-slate-100 dark:border-slate-800">
              <History size={16} className="text-blue-500" />
              Active Shift Exceptions & Incident Logs
            </h3>

            <div className="space-y-3">
              {recentIncidents.length > 0 ? (
                recentIncidents.map((incident, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col space-y-2.5 shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-black tracking-wide font-mono ${incident.issue_type === "LOST_TICKET" ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                        >
                          {incident.issue_type}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          ID: #{incident.log_id}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-extrabold tracking-wide uppercase ${incident.status === "OPEN" ? "text-red-500 animate-pulse" : "text-emerald-500"}`}
                      >
                        {incident.status}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 dark:text-slate-300 leading-relaxed font-sans">
                      {incident.description}
                    </p>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/40 text-xs font-bold text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Hash size={13} /> Session: {incident.session_id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {incident.report_time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No system exceptions logged for this shift.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/30 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <HelpCircle size={15} className="shrink-0" />
            <span>
              All manual data corrections are strictly logged into system audit
              files for backend audit trail compliance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
