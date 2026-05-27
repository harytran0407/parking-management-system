import React, { useState, useRef, useEffect, useCallback } from "react";
import {Camera,CarFront,Hash,MapPin,CheckCircle2,Search,AlertCircle,RefreshCcw,Ticket,Video,VideoOff,Zap,ShieldCheck,Wifi,ShieldAlert,History,Clock,
} from "lucide-react";

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

  // --- 0. INITIAL LOAD (Giả lập gọi API lấy lịch sử ban đầu) ---
  useEffect(() => {
    // Giả lập API trả về 2 giao dịch gần nhất khi vừa mở trang
    setRecentCheckIns([
      {
        session_id: "sess_0912",
        license_plate_in: "43A-567.89",
        slot_name: "A012",
        check_in_time: new Date(Date.now() - 300000).toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit" },
        ),
      },
      {
        session_id: "sess_0911",
        license_plate_in: "29C-123.45",
        slot_name: "B045",
        check_in_time: new Date(Date.now() - 800000).toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit" },
        ),
      },
    ]);
  }, []);

  // --- 1. HOTKEYS ---
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

  // --- 2. CAMERA CONTROL ---
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
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // --- 3. AUTO-SCAN & YOLO LOGIC ---
  const processYoloFrame = async (imageBase64) => {
    const isDetected = Math.random() > 0.7;

    if (isDetected) {
      const audio = new Audio(
        "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      );
      audio
        .play()
        .catch(() => {})
        .catch(() => {});

      const detectedPlate = `51H-${Math.floor(10000 + Math.random() * 90000)}`;
      setPlateNumber(detectedPlate);
      setConfidenceScore(Math.floor(85 + Math.random() * 14));

      const isVip = Math.random() > 0.8;
      const isDuplicate = Math.random() > 0.95;

      if (isDuplicate) {
        setSystemWarning(
          "ACTIVE_SESSION_EXISTS: Vehicle is already inside the parking lot.",
        );
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
    const base64 = canvas.toDataURL("image/jpeg", 0.8);

    await processYoloFrame(base64);
    setIsCapturing(false);
  };

  useEffect(() => {
    let intervalId;
    if (
      isCameraOn &&
      isAutoScan &&
      !plateNumber &&
      !isCapturing &&
      !checkInSuccess
    ) {
      intervalId = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg", 0.5);

        setIsCapturing(true);
        const found = await processYoloFrame(base64);
        setIsCapturing(false);
        if (found) clearInterval(intervalId);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isCameraOn, isAutoScan, plateNumber, isCapturing, checkInSuccess]);

  // --- 4. SUBMIT CHECK-IN (Tích hợp cập nhật Lịch sử) ---
  const handleCheckIn = (e) => {
    e.preventDefault();
    if (!plateNumber || systemWarning) return;
    setIsSubmitting(true);

    setTimeout(() => {
      // Dữ liệu Session mới được tạo
      const newSessionData = {
        session_id: `sess_${Math.floor(1000 + Math.random() * 9000)}`,
        license_plate_in: plateNumber,
        slot_name: vipStatus ? "VIP Zone" : suggestedSlot?.slot_name || "Any",
        check_in_time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setCheckInSuccess(newSessionData);

      // OPTIMISTIC UI UPDATE: Nạp dữ liệu mới lên đầu mảng lịch sử (giữ tối đa 5 phần tử)
      setRecentCheckIns((prev) => [newSessionData, ...prev].slice(0, 5));

      setIsSubmitting(false);
    }, 600);
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER TÍCH HỢP TRẠNG THÁI HARDWARE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Gate Entry Operation
            <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-mono">
              Hotkeys Enabled
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Wifi size={16} /> Gate Control: Online
          </div>
          <div
            className={`flex items-center gap-1.5 ${isCameraOn ? "text-blue-600" : "text-slate-400"}`}
          >
            <Camera size={16} /> Camera: {isCameraOn ? "Active" : "Standby"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CAMERA TÍCH HỢP AI SCAN */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex flex-col items-center justify-center border-2 border-slate-800 shadow-xl group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraOn ? "hidden" : ""}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isCameraOn && !cameraError && (
              <div className="text-slate-500 flex flex-col items-center">
                <VideoOff size={48} className="mb-2 opacity-50" />
                <button
                  onClick={startCamera}
                  className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Video size={18} /> Initialize Camera
                </button>
              </div>
            )}

            {isCameraOn && (
              <>
                <div
                  className={`absolute inset-0 border-blue-500/20 pointer-events-none transition-opacity duration-500 ${isAutoScan && !plateNumber ? "opacity-100" : "opacity-0"}`}
                >
                  <div className="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>

                {plateNumber && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-emerald-400 bg-emerald-400/10 rounded-lg flex items-end justify-center pb-2 transition-all">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-md">
                      {plateNumber} ({confidenceScore}%)
                    </span>
                  </div>
                )}

                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <label className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-semibold cursor-pointer border border-slate-700">
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isAutoScan}
                        onChange={(e) => setIsAutoScan(e.target.checked)}
                      />
                      <div className="w-8 h-4 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
                    </div>
                    Auto-Scan YOLO
                  </label>

                  <button
                    onClick={stopCamera}
                    className="bg-slate-900/70 text-slate-300 hover:text-white p-1.5 rounded-lg transition-colors"
                  >
                    <VideoOff size={16} />
                  </button>
                </div>

                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={manualCapture}
                    disabled={isCapturing || checkInSuccess}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    {isCapturing ? (
                      <RefreshCcw size={16} className="animate-spin" />
                    ) : (
                      <Zap size={16} />
                    )}
                    Capture (Space)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* HIỂN THỊ CẢNH BÁO HOẶC VIP */}
          {systemWarning && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
              <ShieldAlert className="text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-800 dark:text-red-400">
                  System Block
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                  {systemWarning}
                </p>
              </div>
            </div>
          )}

          {vipStatus && !systemWarning && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
              <ShieldCheck className="text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                  Monthly Pass Verified
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                  Plan: {vipStatus.plan_name} • Active for{" "}
                  {vipStatus.expires_in}. Open gate directly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FORM & HISTORY */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 1. FORM CHECK-IN CHÍNH */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col min-h-[400px]">
            {checkInSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    Check-In Successful
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Session:{" "}
                    <span className="font-mono">
                      {checkInSuccess.session_id}
                    </span>
                  </p>
                </div>

                <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Plate:</span>
                    {/* Đã thêm text-slate-800 cho nền sáng và dark:text-white cho nền tối */}
                    <span className="font-bold text-slate-800 dark:text-white text-lg">
                      {checkInSuccess.license_plate_in}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Slot:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                      {checkInSuccess.slot_name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Time In:</span>
                    {/* Đã thêm text-slate-700 cho nền sáng và dark:text-slate-300 cho nền tối */}
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                      {checkInSuccess.check_in_time}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full pt-4">
                  <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                    <Ticket size={16} /> Print
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
                  >
                    Next (Space)
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleCheckIn}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                      License Plate{" "}
                      <span className="text-xs font-normal text-slate-400">
                        Confidence: {confidenceScore}%
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={plateNumber}
                        onChange={(e) =>
                          setPlateNumber(e.target.value.toUpperCase())
                        }
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xl uppercase tracking-wider focus:ring-2 focus:ring-blue-500"
                        placeholder="SCANNING..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vehicle Type{" "}
                      <span className="text-xs font-normal text-slate-400">
                        (Hotkeys: 1, 2)
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVehicleTypeId(1)}
                        className={`py-2.5 border rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${vehicleTypeId === 1 ? "border-blue-600 bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <CarFront size={16} /> Car
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleTypeId(2)}
                        className={`py-2.5 border rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${vehicleTypeId === 2 ? "border-blue-600 bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        Motorbike
                      </button>
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  {suggestedSlot && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 rounded-lg p-3 flex gap-3 mt-4">
                      <MapPin className="text-blue-500 mt-0.5" size={18} />
                      <div>
                        <span className="text-xs font-bold text-blue-800 uppercase block">
                          AI Recommended Slot
                        </span>
                        <span className="text-sm font-medium text-blue-600">
                          {suggestedSlot.slot_name} (Zone {suggestedSlot.zone})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="btn-submit-checkin"
                  type="submit"
                  disabled={!plateNumber || isSubmitting || !!systemWarning}
                  className="mt-8 w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <RefreshCcw size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {isSubmitting ? "Processing..." : "Confirm Entry (Enter)"}
                </button>
              </form>
            )}
          </div>

          {/* 2. HISTORY LIST (Lịch sử Check-in gần đây) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <History size={16} className="text-blue-500" />
              Recent Check-Ins
            </h3>

            <div className="space-y-3">
              {recentCheckIns.length > 0 ? (
                recentCheckIns.map((session, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                        <CarFront size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {session.license_plate_in}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {session.session_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {session.slot_name}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                        <Clock size={10} /> {session.check_in_time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-slate-400">
                  No recent check-ins yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
