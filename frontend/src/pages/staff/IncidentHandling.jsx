import React, { useState, useEffect } from "react";
import {CheckCircle2,Clock,Hash,ShieldAlert,History,RefreshCw,Search,Phone,HelpCircle,Laptop,AlertCircle,X,} from "lucide-react";
// import axios from "axios"; // 

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function IncidentHandlingPage() {
  // ==========================================
  // CORE STATE MANAGEMENT (ENUM RÀNG BUỘC DB)
  // ==========================================
  const [issueType, setIssueType] = useState("LOST_TICKET");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [apiError, setApiError] = useState("");

  // --- Form State: Mất vé lượt (Mục 7.1 API Document) ---
  const [lostPlate, setLostPlate] = useState("");
  const [lostVehicleType, setLostVehicleType] = useState(1);
  const [estCheckIn, setEstCheckIn] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // --- Form State: Sai lệch biển số (Mục 7.2 API Document) ---
  const [sessionId, setSessionId] = useState("");
  const [correctedPlate, setCorrectedPlate] = useState("");
  const [originalPlate, setOriginalPlate] = useState("");
  const [mismatchReason, setMismatchReason] = useState("");

  // --- Form State: Lỗi thiết bị hệ thống & Ngoại lệ khác ---
  const [affectedDevice, setAffectedDevice] = useState("GATE_CAMERA_01");
  const [generalDescription, setGeneralDescription] = useState("");

  // --- Feed danh sách sự cố ca trực ---
  const [recentIncidents, setRecentIncidents] = useState([]);

  // ==========================================
  // AXIOS API: TẢI LIVE ALERTS SỰ CỐ TRÊN DASHBOARD STAFF
  // ==========================================
  useEffect(() => {
    const fetchActiveExceptions = async () => {
      try {
        /*
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${API_BASE_URL}/api/v1/reports/exceptions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setRecentIncidents(response.data.data);
        }
        */
        // Mock dữ liệu khớp cấu trúc DB phục vụ render UI tĩnh
        setRecentIncidents([
          {
            log_id: 1024,
            issue_type: "WRONG_SLOT",
            session_id: "sess_4812",
            description: "OCR read error: Misidentified character '5' as '6'",
            report_time: "10:15 AM",
            status: "OPEN",
          },
          {
            log_id: 1023,
            issue_type: "LOST_TICKET",
            session_id: "sess_9861",
            description:
              "Customer misplaced physical parking ticket near Floor 2 elevator",
            report_time: "09:30 AM",
            status: "RESOLVED",
          },
          {
            log_id: 1022,
            issue_type: "SYSTEM_ERROR",
            session_id: "N/A",
            description: "Barie Smartgate B2 connection timeout timeout",
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
  // AXIOS API: XỬ LÝ SUBMIT TRANSACTION SỰ CỐ
  // ==========================================
  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError("");

    let endpoint = `${API_BASE_URL}/api/v1/staff/lost-ticket`; //
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
      endpoint = `${API_BASE_URL}/api/v1/staff/correct-mismatch`; //
      payload = {
        session_id: sessionId,
        issue_type: "WRONG_SLOT",
        corrected_license_plate: correctedPlate,
        original_license_plate: originalPlate,
        reason: mismatchReason,
        staff_id: "usr_001", // Lấy từ JWT Context
      };
    } else {
      endpoint = `${API_BASE_URL}/api/v1/staff/log-generic-incident`; // Giả định kỹ thuật cho cấu trúc mở rộng
      payload = {
        issue_type: issueType,
        device_code: affectedDevice,
        description: generalDescription,
      };
    }

    try {
      /*
      const token = localStorage.getItem("access_token");
      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setActionSuccess({ type: issueType, data: response.data.data });
      }
      */

      // --- MOCK TRANSITION TIMEOUT ---
      await new Promise((resolve) => setTimeout(resolve, 600));
      let mockResult = {
        log_id: Math.floor(1000 + Math.random() * 9000),
        status: "RESOLVED",
        execution_time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      if (issueType === "LOST_TICKET") {
        mockResult = {
          ...mockResult,
          session_id: `sess_lost_${Math.floor(100 + Math.random() * 900)}`,
          calculated_fee: 200000,
          breakdown: { max_daily_rate: 150000, handling_fee: 50000 },
        };
      } else {
        mockResult = {
          ...mockResult,
          session_id: sessionId || "N/A",
          message: "Data synchronized across endpoints.",
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
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          "Business process logic restriction failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
    setGeneralDescription("");
  };

  return (
    <div className="w-full h-[calc(100vh-130px)] max-h-[calc(100vh-130px)] flex flex-col space-y-4 text-slate-800 dark:text-slate-200 font-sans tracking-tight overflow-hidden -m-2">
      {/* SECTION 1: TOP CONTROL BAR */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={22} />
            Incident & Exception Handling
          </h2>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {["LOST_TICKET", "WRONG_SLOT", "SYSTEM_ERROR", "OTHER"].map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setIssueType(type);
                  setActionSuccess(null);
                  setApiError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${issueType === type ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                {type.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch min-h-0 overflow-hidden">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full overflow-y-auto custom-scrollbar">
          {actionSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Exception Request Processed
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  LOG_ID: #{actionSuccess.data.log_id}
                </p>
              </div>

              {actionSuccess.type === "LOST_TICKET" ? (
                <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between border-b pb-1.5 dark:border-slate-700">
                    <span className="text-slate-400">Lost Ticket Session:</span>
                    <span className="font-bold font-mono">
                      {actionSuccess.data.session_id}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 dark:border-slate-700">
                    <span className="text-slate-400">Max Daily Rate Fee:</span>
                    <span className="font-bold">
                      {actionSuccess.data.breakdown.max_daily_rate.toLocaleString()}{" "}
                      VND
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 dark:border-slate-700">
                    <span className="text-slate-400">
                      Lost Card Penalty Fee:
                    </span>
                    <span className="font-bold">
                      {actionSuccess.data.breakdown.handling_fee.toLocaleString()}{" "}
                      VND
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
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
                    <span className="text-slate-400">Session ID:</span>
                    <span className="font-bold font-mono">
                      {actionSuccess.data.session_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">System Status:</span>
                    <span className="font-bold text-emerald-500">
                      RESOLVED & SYNCHRONIZED
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
              className="flex-1 flex flex-col justify-between h-full"
            >
              <div className="space-y-4">
                {apiError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs font-semibold text-red-600 dark:text-red-400 rounded-xl">
                    ✕ {apiError}
                  </div>
                )}

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
                            className="block w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg bg-slate-50 dark:bg-slate-800/40 font-mono font-bold text-sm focus:bg-white focus:outline-none"
                            placeholder="29A-123.45"
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
                            className="block w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm focus:bg-white focus:outline-none"
                            placeholder="0901234567"
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
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
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
                          className="block w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm focus:outline-none"
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
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg bg-slate-50 dark:bg-slate-800/40 text-sm focus:outline-none focus:bg-white resize-none"
                        placeholder="Provide description of the issue..."
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
                            className="block w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono focus:outline-none"
                            placeholder="sess_12345"
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
                          className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono font-bold focus:outline-none"
                          placeholder="e.g., 29A-111.11"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Corrected License Plate
                      </label>
                      <input
                        type="text"
                        required
                        value={correctedPlate}
                        onChange={(e) =>
                          setCorrectedPlate(e.target.value.toUpperCase())
                        }
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono font-bold focus:outline-none"
                        placeholder="Enter physically verified plate"
                      />
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
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none resize-none"
                        placeholder="Explain reason..."
                      />
                    </div>
                  </>
                )}

                {(issueType === "SYSTEM_ERROR" || issueType === "OTHER") && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {issueType === "SYSTEM_ERROR"
                          ? "Affected Hardware Code"
                          : "Reference Audit Node"}
                      </label>
                      <input
                        type="text"
                        required
                        value={affectedDevice}
                        onChange={(e) =>
                          setAffectedDevice(e.target.value.toUpperCase())
                        }
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 text-sm font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Detailed Log Description
                      </label>
                      <textarea
                        type="text"
                        required
                        rows={4}
                        value={generalDescription}
                        onChange={(e) => setGeneralDescription(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none resize-none"
                        placeholder="Provide log info..."
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                {isSubmitting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                {isSubmitting
                  ? "Processing Request..."
                  : "Confirm Exception Resolution"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden min-h-0">
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="flex-shrink-0 text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-3 tracking-tight border-b border-slate-100 dark:border-slate-800">
              <History size={16} className="text-blue-500" />
              Active Shift Exceptions & Incident Logs
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3 custom-scrollbar min-h-0 h-0">
              {recentIncidents.length > 0 ? (
                recentIncidents.map((incident, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider font-mono border ${
                            incident.issue_type === "LOST_TICKET"
                              ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
                              : incident.issue_type === "WRONG_SLOT"
                                ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30"
                                : "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30"
                          }`}
                        >
                          {incident.issue_type}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          ID: #{incident.log_id}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold tracking-wide uppercase ${incident.status === "OPEN" ? "text-red-500 animate-pulse" : "text-emerald-500"}`}
                      >
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-300 leading-relaxed">
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

          <div className="flex-shrink-0 mt-4 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/30 rounded-xl p-3 flex items-center gap-2.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <HelpCircle size={15} className="shrink-0" />
            <span>
              All manual data corrections are strictly logged into system audit
              files for backend compliance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
