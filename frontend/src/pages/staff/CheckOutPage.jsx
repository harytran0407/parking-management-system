import React, { useState, useRef, useEffect, useCallback } from "react";
import {Camera,CarFront,Hash,CheckCircle2,AlertCircle,RefreshCcw,Video,VideoOff,Zap,Clock,Banknote,QrCode,Receipt,CreditCard,ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default function CheckOutPage() {
  // --- STATES NGHIỆP VỤ ---
  const [plateNumber, setPlateNumber] = useState("");
  const [activeSession, setActiveSession] = useState(null); 
  const [billingInfo, setBillingInfo] = useState(null); 
  const [paymentMethod, setPaymentMethod] = useState("CASH"); 

  // --- STATES CAMERA & UI ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAutoScan, setIsAutoScan] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [systemWarning, setSystemWarning] = useState("");
  const [confidenceScore, setConfidenceScore] = useState(0);

  // --- 1. HOTKEYS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === "INPUT") return;
      switch (e.key) {
        case "1":
          setPaymentMethod("CASH");
          break;
        case "2":
          setPaymentMethod("VNPAY");
          break;
        case " ":
          e.preventDefault();
          if (isCameraOn && !isCapturing && !checkoutSuccess) manualCapture();
          break;
        case "Enter":
          if (plateNumber && ctiveSession && !isSubmitting && !checkoutSuccess) 
            {
            document.getElementById("btn-submit-checkout")?.click();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isCameraOn,
    isCapturing,
    checkoutSuccess,
    plateNumber,
    activeSession,
    isSubmitting,
  ]);

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

  // --- 3. LOGIC TÌM XE & TÍNH TIỀN (PRE-CHECKOUT) ---
  const fetchSessionAndCalculateFee = async (detectedPlate) => {
    // GIẢ LẬP GỌI API 5.4 Calculate Fee
    const isFound = Math.random() > 0.1; // 90% tìm thấy xe trong bãi

    if (!isFound) {
      setSystemWarning(
        "NO_ACTIVE_SESSION: This vehicle is not in the parking lot or plate is incorrect.",
      );
      setActiveSession(null);
      setBillingInfo(null);
      return;
    }

    setSystemWarning("");

    // Mock dữ liệu Session & Billing
    const timeIn = new Date(Date.now() - (Math.random() * 5 + 1) * 3600000); // Cách đây 1-6 tiếng
    const timeOut = new Date();
    const hours = Math.ceil((timeOut - timeIn) / 3600000);
    const isVip = Math.random() > 0.8; // 20% là vé tháng (VIP)

    setActiveSession({
      session_id: `sess_${Math.floor(1000 + Math.random() * 9000)}`,
      slot_name: "C045",
      time_in: timeIn.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date_in: timeIn.toLocaleDateString("en-US"),
      is_vip: isVip,
    });

    setBillingInfo({
      duration: `${hours} hour(s)`,
      base_fee: isVip ? 0 : hours * 15000,
      total_fee: isVip ? 0 : hours * 15000,
    });
  };

  // --- 4. AUTO-SCAN & YOLO ---
  const processYoloFrame = async (imageBase64) => {
    const isDetected = Math.random() > 0.7;

    if (isDetected) {
      const audio = new Audio("/beep.mp3");
      audio.play().catch(() => {});

      const detectedPlate = `51H-${Math.floor(10000 + Math.random() * 90000)}`;
      setPlateNumber(detectedPlate);
      setConfidenceScore(Math.floor(85 + Math.random() * 14));

      await fetchSessionAndCalculateFee(detectedPlate);
      return true;
    }
    return false;
  };

  const manualCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    setCheckoutSuccess(null);
    setActiveSession(null);
    setBillingInfo(null);
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
      !checkoutSuccess
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
  }, [isCameraOn, isAutoScan, plateNumber, isCapturing, checkoutSuccess]);

  // --- 5. XÁC NHẬN THANH TOÁN & MỞ CỔNG ---
  const handleCheckOut = (e) => {
    e.preventDefault();
    if (!plateNumber || !activeSession || systemWarning) return;
    setIsSubmitting(true);

    // MOCK API POST /api/v1/parking/check-out
    setTimeout(() => {
      setCheckoutSuccess({
        plate: plateNumber,
        amount: billingInfo.total_fee,
        method: paymentMethod,
        time_out: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setIsSubmitting(false);
    }, 800);
  };

  const resetForm = () => {
    setPlateNumber("");
    setActiveSession(null);
    setBillingInfo(null);
    setCheckoutSuccess(null);
    setSystemWarning("");
    setConfidenceScore(0);
  };

  return (
    <div className=" animate-slide-in max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Gate Exit & Payment
            <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-mono">
              Hotkeys Enabled
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div
            className={`flex items-center gap-1.5 ${isCameraOn ? "text-blue-600" : "text-slate-400"}`}
          >
            <Camera size={16} /> Camera: {isCameraOn ? "Active" : "Standby"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LÊN TRÁI: CAMERA & CẢNH BÁO */}
        <div className="lg:col-span-6 space-y-4">
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
                    disabled={isCapturing || checkoutSuccess}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    {isCapturing ? (
                      <RefreshCcw size={16} className="animate-spin" />
                    ) : (
                      <Zap size={16} />
                    )}{" "}
                    Capture (Space)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* HIỂN THỊ CẢNH BÁO LỖI LOGIC */}
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

          {/* THÔNG TIN XE KHI VÀO (MATCHED SESSION) */}
          {activeSession && !checkoutSuccess && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-4">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                <CarFront className="text-slate-500" size={24} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">
                    Session ID
                  </p>
                
                  <p className="font-mono font-medium text-slate-900 dark:text-white mt-0.5">
                    {activeSession.session_id}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">
                    Parking Slot
                  </p>
                  <p className="font-medium text-blue-600 mt-0.5">
                    {activeSession.slot_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">
                    Time In
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {activeSession.time_in}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">
                    Date In
                  </p>
                  
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {activeSession.date_in}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PAYMENT AND RECEIPT*/}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
          {checkoutSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Check-Out & Payment Completed
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Gate is opening...
                </p>
              </div>

              <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 text-left space-y-3 my-4 relative overflow-hidden">
              
                <div className="absolute top-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjQiPjxwb2x5Z29uIHBvaW50cz0iMCAwLCA0IDQsIDggMCIgZmlsbD0iI2Y4ZmFmYyIvPjwvc3ZnPg==')]"></div>

                <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200 dark:border-slate-600">
                  <span className="text-slate-500 text-sm">Plate Number:</span>
                  <span className="font-black text-slate-800 dark:text-white text-lg">
                    {checkoutSuccess.plate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Time Out:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {checkoutSuccess.time_out}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Amount Paid:</span>
                  <span className="font-bold text-emerald-600 text-xl">
                    {checkoutSuccess.amount.toLocaleString()} VND
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 text-sm">Method:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-sm flex items-center gap-1">
                    {checkoutSuccess.method === "CASH" ? (
                      <Banknote size={14} />
                    ) : (
                      <QrCode size={14} />
                    )}
                    {checkoutSuccess.method}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                  <Receipt size={16} /> Print Receipt
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  Next Vehicle (Space)
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleCheckOut}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Biển số nhận diện */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                    License Plate (Out){" "}
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

                {/* BILLING SECTION */}
                <div
                  className={`transition-opacity duration-300 ${activeSession ? "opacity-100" : "opacity-40 pointer-events-none"}`}
                >
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Receipt size={16} className="text-blue-500" /> Payment
                    Details
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock size={14} /> Duration
                      </span>
                      <span className="font-medium dark:text-white">
                        {billingInfo?.duration || "--"}
                      </span>
                    </div>

                    {activeSession?.is_vip ? (
                      <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-300 dark:border-slate-600">
                        <span className="font-bold text-amber-600 flex items-center gap-1.5">
                          Monthly Pass (VIP)
                        </span>
                        <span className="font-black text-amber-600 text-xl">
                          0 VND
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-300 dark:border-slate-600">
                        <span className="font-bold text-slate-800 dark:text-white text-base">
                          Total Fee
                        </span>
                        <span className="font-black text-blue-600 text-2xl">
                          {billingInfo?.total_fee?.toLocaleString() || "0"} VND
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PHƯƠNG THỨC THANH TOÁN */}
                <div
                  className={`transition-opacity duration-300 ${activeSession ? "opacity-100" : "opacity-40 pointer-events-none"}`}
                >
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                    Payment Method{" "}
                    <span className="text-xs font-normal text-slate-400">
                      (Hotkeys: 1, 2)
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`py-3.5 border rounded-xl font-medium text-sm transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === "CASH" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-sm" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                    >
                      <Banknote size={20} />
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("VNPAY")}
                      className={`py-3.5 border rounded-xl font-medium text-sm transition-all flex flex-col items-center justify-center gap-1 ${paymentMethod === "VNPAY" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                    >
                      <QrCode size={20} />
                      Scan QR / VNPay
                    </button>
                  </div>

                  {/* Hiệu ứng hiện mã QR giả lập khi chọn VNPay */}
                  {paymentMethod === "VNPAY" && !activeSession?.is_vip && (
                    <div className="mt-4 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-bold">Awaiting Payment...</p>
                        <p className="text-xs mt-0.5">
                          Ask customer to scan QR on terminal.
                        </p>
                      </div>
                      <CreditCard
                        className="text-blue-500 animate-pulse"
                        size={24}
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                id="btn-submit-checkout"
                type="submit"
                disabled={
                  !plateNumber ||
                  !activeSession ||
                  isSubmitting ||
                  !!systemWarning
                }
                className="mt-8 w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {isSubmitting ? (
                  <RefreshCcw size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}
                {isSubmitting
                  ? "Processing Payment..."
                  : "Confirm Checkout (Enter)"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
