import React, { useState, useRef, useEffect, useCallback } from "react";
import {Camera,CarFront,Hash,CheckCircle2,RefreshCcw,Video,VideoOff,Zap,Clock,Banknote,QrCode,Receipt,CreditCard,ShieldAlert,ArrowRight,Wifi,History,
} from "lucide-react";
// import api from "../utils/api";

// ── PERFORMANCE OPTIMIZATION: Static color array to prevent re-renders ──
const LOG_COLORS = [
  {
    bg: "bg-blue-50/20 dark:bg-blue-950/10",
    border: "border-blue-100/70 dark:border-blue-900/30 hover:border-blue-400",
    badge: "bg-blue-50/60 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900/40",
    icon: "bg-blue-50 dark:bg-blue-950/40 text-blue-500",
  },
  {
    bg: "bg-emerald-50/20 dark:bg-emerald-950/10",
    border: "border-emerald-100/70 dark:border-emerald-900/30 hover:border-emerald-400",
    badge: "bg-emerald-50/60 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/40",
    icon: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500",
  },
  {
    bg: "bg-amber-50/20 dark:bg-amber-950/10",
    border: "border-amber-100/70 dark:border-amber-900/30 hover:border-amber-400",
    badge: "bg-amber-50/60 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/40",
    icon: "bg-amber-50 dark:bg-amber-950/40 text-amber-500",
  },
  {
    bg: "bg-purple-50/20 dark:bg-purple-950/10",
    border: "border-purple-100/70 dark:border-purple-900/30 hover:border-purple-400",
    badge: "bg-purple-50/60 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-900/40",
    icon: "bg-purple-50 dark:bg-purple-950/40 text-purple-500",
  },
];

// ── PERFORMANCE OPTIMIZATION: Payment Icon Component ──
function PaymentIcon({ method, size = 14 }) {
  if (method === "CASH") return <Banknote size={size} />;
  if (method === "VNPAY") return <QrCode size={size} />;
  if (method === "SUBSCRIPTION") return <CreditCard size={size} />;
  return <CreditCard size={size} />;
}

export default function CheckOutPage() {
  // ── Business States ────────────────────────────────────────────────────
  const [plateNumber, setPlateNumber] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [billingInfo, setBillingInfo] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [recentCheckOuts, setRecentCheckOuts] = useState([]);

  // ── Camera & UI States ──────────────────────────────────────────────────
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

  // ── [AXIOS] Load recent checkouts on mount (GET /recent) ──
  useEffect(() => {
    const fetchRecentCheckOuts = async () => {
      try {
        /*
        // [API Integration] Replace with actual API call
        const response = await api.get("/staff/checkout/recent?limit=5");
        if (response.data?.success) {
           setRecentCheckOuts(response.data.data);
           return;
        }
        */

        // Mock initial data
        setRecentCheckOuts([
          {
            session_id: "sess_8831",
            license_plate_out: "51H-123.45",
            slot_name: "S12",
            total_fee: 45000,
            payment_method: "CASH",
            check_out_time: "10:36 AM",
          },
          {
            session_id: "sess_8830",
            license_plate_out: "29A-888.88",
            slot_name: "S05",
            total_fee: 0,
            payment_method: "SUBSCRIPTION",
            check_out_time: "10:28 AM",
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch recent check-outs:", error);
      }
    };
    fetchRecentCheckOuts();
  }, []);

  // ── Hotkeys ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === "INPUT") return;
      switch (e.key) {
        case "1":
          if (!activeSession?.is_vip) setPaymentMethod("CASH");
          break;
        case "2":
          if (!activeSession?.is_vip) setPaymentMethod("VNPAY");
          break;
        case " ":
          e.preventDefault();
          if (isCameraOn && !isCapturing && !checkoutSuccess) manualCapture();
          break;
        case "Enter":
          if (plateNumber && activeSession && !isSubmitting && !checkoutSuccess) {
            document.getElementById("btn-submit-checkout")?.click();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCameraOn, isCapturing, checkoutSuccess, plateNumber, activeSession, isSubmitting]);

  // ── Camera control ───────────────────────────────────────────────────────
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
    } catch {
      setCameraError("Cannot access camera. Please check browser permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── [AXIOS] Fetch Session and Calculate Fee (API §5.4) ────────────────────
  const fetchSessionAndCalculateFee = async (detectedPlate) => {
    try {
      /*
      // [API Integration]
      const response = await api.get(`/staff/checkout/calculate-fee?plate=${detectedPlate}`);
      if (!response.data?.success) {
         setSystemWarning("NO_ACTIVE_SESSION: Vehicle not found in the parking lot.");
         setActiveSession(null);
         setBillingInfo(null);
         return;
      }
      const { session, billing } = response.data.data;
      setSystemWarning("");
      setActiveSession(session);
      setBillingInfo(billing);
      */

      // Mock logic
      const isFound = Math.random() > 0.1;
      if (!isFound) {
        setSystemWarning("DATA MISMATCH: Vehicle not found in the parking lot or incorrect plate.");
        setActiveSession(null);
        setBillingInfo(null);
        return;
      }

      setSystemWarning("");
      const timeIn = new Date(Date.now() - (Math.random() * 5 + 1) * 3600000);
      const hours = Math.ceil((new Date() - timeIn) / 3600000);
      const isVip = Math.random() > 0.8;

      setActiveSession({
        session_id: `sess_${Math.floor(1000 + Math.random() * 9000)}`,
        slot_name: isVip ? "S40 (VIP)" : "S12",
        time_in: timeIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        date_in: timeIn.toLocaleDateString("en-US"),
        is_vip: isVip,
      });
      setBillingInfo({
        duration: `${hours} hour(s)`,
        total_fee: isVip ? 0 : hours * 15000,
      });
    } catch (error) {
      console.error("Fee calculation error:", error);
    }
  };

  // ── [AXIOS] YOLO plate recognition ──────────────────────────────────────
  const processYoloFrame = async (imageBase64) => {
    try {
      /*
      // [API Integration]
      const response = await api.post("/staff/checkout/recognize-plate", { image: imageBase64 });
      if (!response.data?.success) return false;
      const { plate_number, confidence } = response.data.data;
      setPlateNumber(plate_number);
      setConfidenceScore(confidence);
      await fetchSessionAndCalculateFee(plate_number);
      return true;
      */

      const isDetected = Math.random() > 0.7;
      if (!isDetected) return false;

      const detectedPlate = `51H-${Math.floor(10000 + Math.random() * 90000)}`;
      setPlateNumber(detectedPlate);
      setConfidenceScore(Math.floor(85 + Math.random() * 14));
      await fetchSessionAndCalculateFee(detectedPlate);
      return true;
    } catch (error) {
      console.error("AI recognition error:", error);
      return false;
    }
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
    await processYoloFrame(canvas.toDataURL("image/jpeg", 0.8));
    setIsCapturing(false);
  };

  useEffect(() => {
    let intervalId;
    if (isCameraOn && isAutoScan && !plateNumber && !isCapturing && !checkoutSuccess) {
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
  }, [isCameraOn, isAutoScan, plateNumber, isCapturing, checkoutSuccess]);

  // ── [AXIOS] Process checkout and payment (API §5.2) ──────────────────
  const handleCheckOut = async (e) => {
    e.preventDefault();
    if (!plateNumber || !activeSession || systemWarning) return;
    setIsSubmitting(true);

    try {
      /*
      // [API Integration]
      const response = await api.post("/staff/checkout", {
         session_id:     activeSession.session_id,
         license_plate:  plateNumber,
         payment_method: activeSession.is_vip ? "SUBSCRIPTION" : paymentMethod,
      });
      if (response.data?.success) {
         const newLog = response.data.data;
         setCheckoutSuccess(newLog);
         setRecentCheckOuts((prev) => [newLog, ...prev].slice(0, 5));
      }
      */

      // Mock transaction
      await new Promise((r) => setTimeout(r, 800));
      const newLog = {
        session_id: activeSession.session_id,
        license_plate_out: plateNumber,
        slot_name: activeSession.slot_name,
        total_fee: billingInfo.total_fee,
        payment_method: activeSession.is_vip ? "SUBSCRIPTION" : paymentMethod,
        check_out_time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
      setCheckoutSuccess(newLog);
      setRecentCheckOuts((prev) => [newLog, ...prev].slice(0, 5));
    } catch (error) {
      setSystemWarning(error?.message || "Payment transaction failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="animate-slide-in max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          Gate Exit & Payment Terminal
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-mono uppercase">Hotkeys Enabled</span>
        </h2>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Wifi size={16} /> Gate Control: Online
          </div>
          <div className={`flex items-center gap-1.5 ${isCameraOn ? "text-blue-600" : "text-slate-400"}`}>
            <Camera size={16} /> Camera: {isCameraOn ? "Active" : "Standby"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT: CAMERA & INFO ── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex flex-col items-center justify-center border-2 border-slate-800 shadow-xl">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraOn ? "hidden" : ""}`} />
            <canvas ref={canvasRef} className="hidden" />

            {!isCameraOn && !cameraError && (
              <div className="text-slate-500 flex flex-col items-center">
                <VideoOff size={48} className="mb-2 opacity-50" />
                <button
                  onClick={startCamera}
                  className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-sm">
                  <Video size={16} /> Open Lane Feed
                </button>
              </div>
            )}

            {cameraError && <p className="text-red-400 text-sm font-medium px-6 text-center">{cameraError}</p>}

            {isCameraOn && (
              <>
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isAutoScan && !plateNumber ? "opacity-100" : "opacity-0"}`}>
                  <div className="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]" />
                </div>

                {plateNumber && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-20 border-2 border-dashed border-emerald-400 bg-emerald-950/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wider font-mono uppercase shadow-md">
                      {plateNumber} ({confidenceScore}%)
                    </span>
                  </div>
                )}

                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <label className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-white text-[11px] font-bold cursor-pointer border border-slate-700 select-none uppercase tracking-wider">
                    <input type="checkbox" className="sr-only peer" checked={isAutoScan} onChange={(e) => setIsAutoScan(e.target.checked)} />
                    <div className="w-7 h-3.5 bg-slate-700 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border after:rounded-full after:h-2 after:w-2 after:transition-all" />
                    YOLO Polling
                  </label>
                  <button onClick={stopCamera} className="bg-slate-900/70 text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-700 transition-colors">
                    <VideoOff size={14} />
                  </button>
                </div>

                <div className="absolute bottom-4 right-4">
                  <button
                    type="button"
                    onClick={manualCapture}
                    disabled={isCapturing || !!checkoutSuccess}
                    className="bg-slate-950/80 hover:bg-slate-900 border border-slate-700 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider py-2 px-3.5 rounded-xl transition flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50">
                    {isCapturing ? <RefreshCcw size={14} className="animate-spin" /> : <Zap size={14} />} Capture (Space)
                  </button>
                </div>
              </>
            )}
          </div>

          {systemWarning && (
            <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 border dark:border-red-900/30 p-3.5 rounded-r-xl flex items-start gap-3">
              <ShieldAlert className="text-red-500 mt-0.5 shrink-0" size={16} />
              <div>
                <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">System Alert</h4>
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5 font-medium">{systemWarning}</p>
              </div>
            </div>
          )}

          {activeSession && !checkoutSuccess && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-4 animate-in fade-in-50 duration-200">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-500 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <CarFront size={18} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-medium">
                {[
                  { label: "Session Node ID", value: activeSession.session_id, mono: true },
                  { label: "Parking Slot", value: activeSession.slot_name, blue: true },
                  { label: "Check-In Time", value: activeSession.time_in, mono: true },
                  { label: "Check-In Date", value: activeSession.date_in, mono: true },
                ].map((item, i) => (
                  <div key={i}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                    <p
                      className={`mt-0.5 font-bold ${item.blue ? "text-blue-600 dark:text-blue-400" : item.mono ? "font-mono text-slate-800 dark:text-white" : "text-slate-800 dark:text-white"}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: PAYMENT FORM ──────────────────────────────────────── */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col min-h-[340px] justify-between">
          {checkoutSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Check-Out Completed</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Barie released successfully. Gate is open.</p>
              </div>

              <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-left text-xs space-y-2.5 font-medium">
                {[
                  { label: "Plate Number", value: checkoutSuccess.license_plate_out, cls: "font-mono font-black text-sm text-slate-900 dark:text-white", border: true },
                  // 🚀 Defensive Programming applied before .toLocaleString()
                  { label: "Paid Amount", value: `${(checkoutSuccess.total_fee || 0).toLocaleString()} VND`, cls: "font-bold text-emerald-500 font-mono text-sm", border: true },
                  { label: "Time Out", value: checkoutSuccess.check_out_time, cls: "font-medium font-mono text-slate-700 dark:text-slate-300", border: true },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center ${row.border ? "border-b pb-2 dark:border-slate-700" : ""}`}>
                    <span className="text-slate-400">{row.label}</span>
                    <span className={row.cls}>{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-400">Method applied:</span>
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 font-sans">
                    <PaymentIcon method={checkoutSuccess.payment_method} /> {checkoutSuccess.payment_method}
                  </span>
                </div>
              </div>

              <button
                onClick={resetForm}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md active:scale-95">
                Next Lane Event (Space)
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckOut} className="flex-1 flex flex-col justify-between h-full">
              <div className="space-y-4">
                {/* Outbound Plate */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">License Plate (Outbound)</label>
                    <span className="text-[10px] font-bold font-mono text-slate-400">YOLO Match: {confidenceScore}%</span>
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white font-mono font-black text-base uppercase tracking-wider focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                      placeholder="SCANNING OUTBOUND..."
                    />
                  </div>
                </div>

                {/* Billing Summary */}
                <div className={`transition-opacity duration-300 ${activeSession ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Receipt size={13} /> Fee Settlement Details
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> Total Duration
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{billingInfo?.duration || "--"}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed pt-2 dark:border-slate-700">
                      {activeSession?.is_vip ? (
                        <>
                          <span className="text-amber-500 font-bold uppercase tracking-wide text-[10px]">Monthly Subscription Pass</span>
                          <span className="font-black text-amber-500 font-mono text-sm">0 VND</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-700 dark:text-slate-300">Total Billing Amount</span>
                          <span className="font-black text-blue-600 dark:text-blue-400 font-mono text-lg">{(billingInfo?.total_fee || 0).toLocaleString()} VND</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hide Payment Method if VIP (Free) */}
                <div className={`transition-opacity duration-300 ${activeSession && !activeSession.is_vip ? "opacity-100" : "hidden pointer-events-none"}`}>
                  <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                    <span>Payment Node Classification</span>
                    <span className="font-mono lowercase text-[10px]">(hotkeys: 1, 2)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        method: "CASH",
                        label: "Cash",
                        icon: <Banknote size={14} />,
                        active: "border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
                      },
                      {
                        method: "VNPAY",
                        label: "VNPay QR",
                        icon: <QrCode size={14} />,
                        active: "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
                      },
                    ].map((p) => (
                      <button
                        key={p.method}
                        type="button"
                        onClick={() => setPaymentMethod(p.method)}
                        className={`py-2.5 border rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 outline-none ${
                          paymentMethod === p.method
                            ? `${p.active} shadow-sm`
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}>
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "VNPAY" && (
                    <div className="mt-3 p-3 border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/10 rounded-xl flex items-center justify-between text-xs">
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">
                        <p>Awaiting Gateway Callback...</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Please scan the integrated client-node QR code.</p>
                      </div>
                      <CreditCard className="text-blue-500 animate-pulse shrink-0" size={18} />
                    </div>
                  )}
                </div>
              </div>

              <button
                id="btn-submit-checkout"
                type="submit"
                disabled={!plateNumber || !activeSession || isSubmitting || !!systemWarning}
                className="w-full mt-6 bg-slate-950 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-300 dark:disabled:text-slate-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
                {isSubmitting ? <RefreshCcw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                {isSubmitting ? "Processing Node payment..." : "Confirm Checkout Operations"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── HISTORY PANEL — FULL WIDTH ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
          <History size={14} className="text-blue-500" /> Recent Lane Exit Logs
        </h3>

        <div className="flex flex-col gap-3">
          {recentCheckOuts.length > 0 ? (
            recentCheckOuts.map((session, idx) => {
              const color = LOG_COLORS[idx % LOG_COLORS.length];
              return (
                <div
                  key={session.session_id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 gap-4 ${color.bg} ${color.border}`}>
                  {/* Cluster 1: Plate & Session ID (Truncated and bolded) */}
                  <div className="flex items-center gap-3 sm:w-1/4 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color.icon}`}>
                      <CarFront size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono font-black text-base text-slate-800 dark:text-white tracking-wider leading-none mb-1 truncate">{session.license_plate_out}</p>
                      <p className="text-sm font-extrabold font-mono text-slate-600 dark:text-slate-300 tracking-wide flex items-center gap-1.5 leading-none">
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-1 py-0.5 rounded-sm uppercase tracking-widest shrink-0">
                          SESS
                        </span>
                        <span className="truncate">#{session.session_id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Cluster 2: Time Out */}
                  <div className="flex items-center gap-2 sm:justify-center sm:w-1/4">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Checkout Time:</span>
                    <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">{session.check_out_time}</span>
                  </div>

                  {/* Cluster 3: Method */}
                  <div className="flex items-center gap-2 sm:justify-center sm:w-1/4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method:</span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <PaymentIcon method={session.payment_method} />
                      {session.payment_method}
                    </span>
                  </div>

                  {/* Cluster 4: Revenue */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-1/4 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Revenue Collected:</span>
                    <div className={`px-4 py-1.5 text-xs font-black rounded-lg font-mono tracking-wide border min-w-[110px] text-center uppercase ${color.badge}`}>
                      {session.total_fee === 0 ? "FREE / VIP" : `${(session.total_fee || 0).toLocaleString()} VND`}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No exit shift logs recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
