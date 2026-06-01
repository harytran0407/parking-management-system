import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  CarFront,
  Hash,
  MapPin,
  CheckCircle2,
  Search,
  AlertCircle,
  RefreshCcw,
  Ticket,
  Video,
  VideoOff,
  Zap,
  ShieldCheck,
  Wifi,
  ShieldAlert,
  History,
  Clock,
} from "lucide-react";
// import api from "../services/api";

export default function CheckInPage() {
  // --- STATES NGHIỆP VỤ ---
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState(1); // 1: Car, 2: Motorbike
  const [bookingId, setBookingId] = useState("");
  const [suggestedSlot, setSuggestedSlot] = useState(null);

  // --- STATES LỊCH SỬ (HISTORY) ---
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  // States tính năng nâng cao (Enterprise Features)
  const [isAutoScan, setIsAutoScan] = useState(true);
  const [vipStatus, setVipStatus] = useState(null);
  const [systemWarning, setSystemWarning] = useState("");
  const [confidenceScore, setConfidenceScore] = useState(0);

  // --- STATES CAMERA & UI ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(null);

  // ============================================================
  // KHỐI 0: INITIAL LOAD — TẢI LỊCH SỬ CÁC XE VỪA VÀO BỐT TRỰC
  // ============================================================
  useEffect(() => {
    const fetchRecentCheckIns = async () => {
      try {
        /* 🛠️ ===== AXIOS REAL API CALL (KHỐI LỊCH SỬ) =====
        const response = await api.get("/staff/checkin/recent?limit=5");
        if (response && response.data) {
          setRecentCheckIns(response.data);
          return;
        }
        */

        // --- MOCK DATA GIẢ LẬP BAN ĐẦU ---
        setRecentCheckIns([
          {
            session_id: "sess_0912",
            license_plate_in: "43A-567.89",
            slot_name: "A012",
            check_in_time: new Date(Date.now() - 300000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          },
          {
            session_id: "sess_0911",
            license_plate_in: "29C-123.45",
            slot_name: "B045",
            check_in_time: new Date(Date.now() - 800000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch recent check-ins:", error);
      }
    };

    fetchRecentCheckIns();
  }, []);

  // --- HOTKEYS HỆ THỐNG ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === "INPUT") return;
      switch (e.key) {
        case "1":
          setVehicleTypeId(1);
          break;
        case "2":
          setVehicleTypeId(2);
          break;
        case " ":
          e.preventDefault();
          if (isCameraOn && !isCapturing && !checkInSuccess) manualCapture();
          break;
        case "Enter":
          if (plateNumber && !isSubmitting && !checkInSuccess) {
            document.getElementById("btn-submit-checkin")?.click();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCameraOn, isCapturing, checkInSuccess, plateNumber, isSubmitting]);

  // --- CAMERA CONTROL ---
  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      setCameraError("Cannot access Camera. Please check browser permissions!");
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // ============================================================
  // KHỐI 3: QUÉT ẢNH CAMERA — NHẬN DIỆN BIỂN SỐ QUA AI / YOLO
  // ============================================================
  const processYoloFrame = async (imageBase64) => {
    try {
      /* 🛠️ ===== AXIOS REAL API CALL (XỬ LÝ ẢNH AI ĐỌC BIỂN SỐ) =====
      const response = await api.post("/staff/checkin/recognize-plate", { image: imageBase64, vehicle_type_id: vehicleTypeId });
      if (response && response.data) {
        const { plate_number, confidence, slot, vip_status, warning } = response.data;
        setPlateNumber(plate_number);
        setConfidenceScore(confidence);
        setSystemWarning(warning || "");
        setVipStatus(vip_status || null);
        setSuggestedSlot(slot || null);
        return true;
      }
      */

      const isDetected = Math.random() > 0.7;
      if (isDetected) {
        const detectedPlate = `51H-${Math.floor(10000 + Math.random() * 90000)}`;
        setPlateNumber(detectedPlate);
        setConfidenceScore(Math.floor(85 + Math.random() * 14));

        const isVip = Math.random() > 0.8;
        const isDuplicate = Math.random() > 0.95;

        if (isDuplicate) {
          setSystemWarning("ACTIVE_SESSION_EXISTS: Vehicle is already inside the parking lot.");
        } else if (isVip) {
          setVipStatus({ plan_name: "Premium Monthly", expires_in: "15 days" });
          setSystemWarning("");
        } else {
          setVipStatus(null);
          setSystemWarning("");
          setSuggestedSlot({ slot_name: "C045", floor: 3, zone: "C" });
        }
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const manualCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    setCheckInSuccess(null);
    setSuggestedSlot(null);
    setVipStatus(null);
    setSystemWarning("");

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    await processYoloFrame(canvas.toDataURL("image/jpeg", 0.8));
    setIsCapturing(false);
  };

  useEffect(() => {
    let intervalId;
    if (isCameraOn && isAutoScan && !plateNumber && !isCapturing && !checkInSuccess) {
      intervalId = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
        setIsCapturing(true);
        const found = await processYoloFrame(canvas.toDataURL("image/jpeg", 0.5));
        setIsCapturing(false);
        if (found) clearInterval(intervalId);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isCameraOn, isAutoScan, plateNumber, isCapturing, checkInSuccess]);

  // ============================================================
  // KHỐI 4: NHẤN NÚT CONFIRM — GỬI LỆNH LƯU XE VÀO BÃI LÊN DATABASE
  // ============================================================
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!plateNumber || systemWarning) return;
    setIsSubmitting(true);

    try {
      /* 🛠 ===== AXIOS REAL API CALL (XÁC NHẬN CHO XE VÀO BÃI) =====
      const response = await api.post("/staff/checkin", { license_plate: plateNumber, vehicle_type_id: vehicleTypeId });
      if (response && response.data) {
        setCheckInSuccess(response.data);
        setRecentCheckIns((prev) => [response.data, ...prev].slice(0, 5));
        setIsSubmitting(false);
        return;
      }
      */

      await new Promise((resolve) => setTimeout(resolve, 600));
      const newSessionData = {
        session_id: `sess_${Math.floor(1000 + Math.random() * 9000)}`,
        license_plate_in: plateNumber,
        slot_name: vipStatus ? "VIP Zone" : suggestedSlot?.slot_name || "Any Open Space",
        check_in_time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };

      setCheckInSuccess(newSessionData);
      setRecentCheckIns((prev) => [newSessionData, ...prev].slice(0, 5));
    } catch (error) {
      if (error?.error_code === "ACTIVE_SESSION_EXISTS") {
        setSystemWarning("ACTIVE_SESSION_EXISTS: Vehicle is already inside the parking lot.");
      } else {
        setSystemWarning(error?.message || "Check-in operation failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPlateNumber("");
    setBookingId("");
    setSuggestedSlot(null);
    setCheckInSuccess(null);
    setVipStatus(null);
    setSystemWarning("");
    setConfidenceScore(0);
  };

  return (
    <div className="animate-slide-in max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Gate Entry Operation
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-mono uppercase">Hotkeys Enabled</span>
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Wifi size={16} /> Gate Control: Online
          </div>
          <div className={`flex items-center gap-1.5 ${isCameraOn ? "text-blue-600" : "text-slate-400"}`}>
            <Camera size={16} /> Camera: {isCameraOn ? "Active" : "Standby"}
          </div>
        </div>
      </div>

      {/* KHU VỰC ĐIỀU KHIỂN CHÍNH (CAMERA + FORM) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CAMERA TÍCH HỢP AI SCAN */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex flex-col items-center justify-center border-2 border-slate-800 shadow-xl group">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraOn ? "hidden" : ""}`} />
            <canvas ref={canvasRef} className="hidden" />

            {!isCameraOn && !cameraError && (
              <div className="text-slate-500 flex flex-col items-center">
                <VideoOff size={48} className="mb-2 opacity-50" />
                <button
                  onClick={startCamera}
                  className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-sm">
                  <Video size={16} /> Open Lane Feed
                </button>
              </div>
            )}

            {isCameraOn && (
              <>
                <div
                  className={`absolute inset-0 border-blue-500/20 pointer-events-none transition-opacity duration-500 ${isAutoScan && !plateNumber ? "opacity-100" : "opacity-0"}`}>
                  <div className="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>

                {plateNumber && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-20 border-2 border-dashed border-emerald-400 bg-emerald-950/40 rounded-xl flex items-center justify-center backdrop-blur-xs">
                    <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wider font-mono uppercase shadow-md">
                      {plateNumber} ({confidenceScore}%)
                    </span>
                  </div>
                )}

                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <label className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-bold cursor-pointer border border-slate-700 select-none uppercase tracking-wider">
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isAutoScan} onChange={(e) => setIsAutoScan(e.target.checked)} />
                      <div className="w-7 h-3.5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2 after:w-2 after:transition-all peer-checked:bg-blue-500"></div>
                    </div>
                    YOLO POLLING
                  </label>
                  <button onClick={stopCamera} className="bg-slate-900/70 text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-700 transition-colors">
                    <VideoOff size={14} />
                  </button>
                </div>

                <div className="absolute bottom-4 right-4">
                  <button
                    id="btn-submit-checkin"
                    type="submit"
                    disabled={!plateNumber || isSubmitting || !!systemWarning}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95">
                    {isSubmitting ? <RefreshCcw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {isSubmitting ? "Processing..." : "Confirm Entry (Enter)"}
                  </button>
                </div>
              </>
            )}
          </div>

          {systemWarning && (
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-3.5 rounded-r-xl flex items-start gap-3 border dark:border-red-900/30">
              <ShieldAlert className="text-red-500 mt-0.5 shrink-0" size={16} />
              <div>
                <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Security Alert Conflict</h4>
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5 font-medium">{systemWarning}</p>
              </div>
            </div>
          )}

          {vipStatus && !systemWarning && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3.5 rounded-r-xl flex items-start gap-3 border dark:border-amber-900/30">
              <ShieldCheck className="text-amber-500 mt-0.5 shrink-0" size={16} />
              <div>
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Monthly Pass Verified</h4>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5 font-medium">
                  Plan: {vipStatus.plan_name} • Active for {vipStatus.expires_in}. Open gate directly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FORM CHECK-IN CHÍNH */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full min-h-[340px] justify-between">
            {checkInSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Gate Barie Released</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    SESSION: <span className="font-mono">#{checkInSuccess.session_id}</span>
                  </p>
                </div>

                <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-left text-xs space-y-2 font-medium">
                  <div className="flex justify-between items-center border-b pb-1.5 dark:border-slate-700">
                    <span className="text-slate-400">License Plate:</span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{checkInSuccess.license_plate_in}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-1.5 dark:border-slate-700">
                    <span className="text-slate-400">Assigned Slot:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{checkInSuccess.slot_name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-400">Time In:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{checkInSuccess.check_in_time}</span>
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md shadow-blue-500/10 active:scale-95">
                  Next Lane Event (Space)
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckIn} className="flex-1 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">License Plate Recognition</label>
                      <span className="text-[10px] font-bold font-mono text-slate-400">YOLO Match: {confidenceScore}%</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white font-mono font-black text-base uppercase tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="WAITING OCR CAMERA..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Vehicle Classification <span className="font-mono lowercase text-[10px] text-slate-400">(hotkeys: 1, 2)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setVehicleTypeId(1)}
                        className={`py-2 border rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 outline-none ${vehicleTypeId === 1 ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-400 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}>
                        <CarFront size={14} /> Car
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleTypeId(2)}
                        className={`py-2 border rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 outline-none ${vehicleTypeId === 2 ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-400 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}>
                        Motorbike
                      </button>
                    </div>
                  </div>

                  {suggestedSlot && (
                    <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/30 rounded-xl p-3 flex gap-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <MapPin className="shrink-0 mt-0.5" size={15} />
                      <div>
                        <span className="font-black block text-[10px] uppercase tracking-wider text-blue-800 dark:text-blue-300">AI Suggested Routing Node</span>
                        Route asset to: <span className="font-bold underline">{suggestedSlot.slot_name}</span> (Floor {suggestedSlot.floor} - Area {suggestedSlot.zone})
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="btn-submit-checkin"
                  type="submit"
                  disabled={!plateNumber || isSubmitting || !!systemWarning}
                  className="w-full bg-slate-950 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-300 dark:disabled:text-slate-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm shrink-0 mt-6 active:scale-[0.98]">
                  {isSubmitting ? <RefreshCcw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{isSubmitting ? "Issuing Ticket assets..." : "Confirm Entry Operations"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ===================RECENT ENTRY LOGS================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm w-full">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
          <History size={14} className="text-blue-500" /> Recent Lane Entry Logs
        </h3>

        {/* Khung danh sách hàng dọc phẳng trải dài 100% vạt ngang */}
        <div className="flex flex-col gap-2.5">
          {recentCheckIns.length > 0 ? (
            recentCheckIns.map((session, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-blue-50/40 dark:hover:bg-blue-950/10 hover:border-blue-200/60 dark:hover:border-blue-900/40 transition-all duration-200 shadow-xs gap-4">
                {/* Cụm 1 (Bên trái): Icon nhận diện phương tiện & Mã kiểm soát */}
                <div className="flex items-center gap-4 min-w-0 sm:w-1/3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-900/40 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                    <CarFront size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-black text-base text-slate-800 dark:text-white tracking-wider">{session.license_plate_in}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 tracking-tight flex items-center gap-1">
                      <span className="text-slate-300 dark:text-slate-600">ID:</span> #{session.session_id}
                    </p>
                  </div>
                </div>

                {/* Cụm 2 (Ở giữa): Mốc thời gian hệ thống ghi nhận ca trực */}
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 sm:justify-center sm:w-1/3">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-sans uppercase tracking-wider">Timestamp:</span>
                  <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">{session.check_in_time}</span>
                </div>

                {/* Cụm 3 (Bên phải): Vị trí bãi đỗ xe đã chỉ định (Badge phát sáng) */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-1/3 shrink-0">
                  <span className="text-[11px] font-bold font-sans uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:hidden">Slot Node:</span>
                  <div className="px-4 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-black rounded-lg font-mono tracking-wide border border-blue-100 dark:border-blue-900/40 shadow-xs min-w-[90px] text-center uppercase">
                    {session.slot_name}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No entry shift logs recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
