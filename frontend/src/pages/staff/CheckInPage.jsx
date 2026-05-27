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
} from "lucide-react";

export default function CheckInPage() {
  // --- STATES NGHIỆP VỤ ---
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState(1); // 1: Car, 2: Motorbike
  const [bookingId, setBookingId] = useState("");
  const [suggestedSlot, setSuggestedSlot] = useState(null);

  // States tính năng nâng cao (Enterprise Features)
  const [isAutoScan, setIsAutoScan] = useState(true); // Mặc định bật quét tự động
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

  // --- 1. HOTKEYS (PHÍM TẮT) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Bỏ qua hotkey nếu đang gõ vào input
      if (document.activeElement.tagName === "INPUT") return;

      switch (e.key) {
        case "1":
          setVehicleTypeId(1);
          break; // Chọn Ô tô
        case "2":
          setVehicleTypeId(2);
          break; // Chọn Xe máy
        case " ": // Phím Space
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
    // TẠM THỜI MOCK DATA ĐỂ ĐỢI PYTHON KẾT NỐI
    // Tỉ lệ nhận diện thành công giả lập là 30% mỗi frame để tạo cảm giác AI đang "cố gắng đọc"
    const isDetected = Math.random() > 0.7;

    if (isDetected) {
      // Có âm thanh "Ting" nhẹ khi AI bắt được (Mock)
      const audio = new Audio(
        "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      );
      audio
        .play()
        .catch(() => {})
        .catch(() => {}); // Bỏ qua lỗi play() nếu browser chặn auto-play

      const detectedPlate = `51H-${Math.floor(10000 + Math.random() * 90000)}`;
      setPlateNumber(detectedPlate);
      setConfidenceScore(Math.floor(85 + Math.random() * 14)); // Mock score 85% - 99%

      // MOCK BUSINESS LOGIC (Kiểm tra Thẻ tháng & Trùng lặp)
      const isVip = Math.random() > 0.8; // 20% khả năng là VIP (MONTHLY_PASS)
      const isDuplicate = Math.random() > 0.95; // 5% khả năng xe đang ở trong bãi (ACTIVE_SESSION_EXISTS)

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
        setSuggestedSlot({ slot_name: "C045", floor: 3, zone: "C" }); // Cấp slot cho xe khách lẻ
      }
      return true; // Stop scanning
    }
    return false; // Keep scanning
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

    await processYoloFrame(base64); // Chụp thủ công thì ép gọi 1 lần
    setIsCapturing(false);
  };

  // Vòng lặp Auto-Scan (Chạy mỗi 1 giây nếu bật Auto-Scan và chưa có kết quả)
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
        const base64 = canvas.toDataURL("image/jpeg", 0.5); // Giảm quality xuống để gửi nhanh hơn

        setIsCapturing(true);
        const found = await processYoloFrame(base64);
        setIsCapturing(false);
        if (found) clearInterval(intervalId); // Tắt quét nếu tìm thấy
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isCameraOn, isAutoScan, plateNumber, isCapturing, checkInSuccess]);

  // --- 4. SUBMIT CHECK-IN ---
  const handleCheckIn = (e) => {
    e.preventDefault();
    if (!plateNumber || systemWarning) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setCheckInSuccess({
        session_id: `sess_${Math.floor(1000 + Math.random() * 9000)}`,
        license_plate_in: plateNumber,
        slot_name: vipStatus ? "VIP Zone" : suggestedSlot?.slot_name || "Any",
        check_in_time: new Date().toLocaleString("en-US"),
      });
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
                {/* Lưới quét (Radar UI Effect) */}
                <div
                  className={`absolute inset-0 border-blue-500/20 pointer-events-none transition-opacity duration-500 ${isAutoScan && !plateNumber ? "opacity-100" : "opacity-0"}`}
                >
                  <div className="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>

                {/* Bounding Box khi đã chốt biển số */}
                {plateNumber && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-emerald-400 bg-emerald-400/10 rounded-lg flex items-end justify-center pb-2 transition-all">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-md">
                      {plateNumber} ({confidenceScore}%)
                    </span>
                  </div>
                )}

                {/* Camera Controls Overlay */}
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

        {/* RIGHT COLUMN: FORM & ACTIONS */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
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
                  <span className="font-mono">{checkInSuccess.session_id}</span>
                </p>
              </div>

              <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Plate:</span>
                  <span className="font-bold">
                    {checkInSuccess.license_plate_in}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Slot:</span>
                  <span className="font-bold text-blue-600">
                    {checkInSuccess.slot_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Time In:</span>
                  <span className="font-medium text-sm">
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
      </div>
    </div>
  );
}
