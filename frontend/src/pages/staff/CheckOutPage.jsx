import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
    Camera, CarFront, Search, MapPin, CheckCircle2, RefreshCcw,
    VideoOff, Ban, ParkingSquare, Hash, Clock, Calendar,
    Video, X, Maximize2, DollarSign
} from "lucide-react";

const API_BASE_URL = "http://localhost:5077/api/v1/parking";
const PYTHON_STREAM_URL = "http://localhost:5001/api/v1/stream";

export default function CheckOutPage() {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [plateNumber, setPlateNumber] = useState("");
    const [manualInput, setManualInput] = useState("");
    const [selectedVehicleType, setSelectedVehicleType] = useState(1);
    const [scanResult, setScanResult] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isStreamConnected, setIsStreamConnected] = useState(true);

    // Lightbox image modal state
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const vehicleTypes = [
        { id: 1, name: "Motorbike" },
        { id: 2, name: "Car" }
    ];

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "environment"
    };

    const getOpConfig = () => ({
        staffId: localStorage.getItem("staff_id") || "usr_001",
        camOut: localStorage.getItem("camera_out_id") || "cam_out_01",
        gateOut: localStorage.getItem("gate_out_id") || "gate_out_01",
    });

    /**
     * LOGIC TRA CỨU: Lấy thông tin phiên đỗ xe đang ACTIVE của biển số xe
     */
    const fetchActiveSession = async (targetPlate) => {
        try {
            const formattedPlate = targetPlate.toUpperCase().trim();
            const response = await axios.get(`${API_BASE_URL}/sessions/active/${formattedPlate}`);

            if (response.status === 200 && response.data && response.data.success) {
                return response.data.data; // Trả về thông tin session hoạt động
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    /**
     * MAIN FLOW: REACT CAPTURE -> PYTHON AI RECOGNITION -> ASP.NET CORE FETCH SESSION FOR CHECK-OUT
     */
    const handleCaptureAndRecognize = useCallback(async () => {
        if (!webcamRef.current || isLoading) return;

        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        setScanResult(null);

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setErrorMessage("Cannot capture image from Webcam. Please check device permissions.");
            setIsLoading(false);
            return;
        }
        setCapturedImage(imageSrc);

        try {
            // 1. Nhận diện biển số từ AI
            const aiResponse = await axios.post(`${PYTHON_STREAM_URL}/recognize_uploaded_image`, {
                image: imageSrc
            });

            if (!aiResponse.data || !aiResponse.data.success) {
                throw new Error(aiResponse.data?.message || "AI system failed to recognize license plate from snapshot.");
            }

            const aiPlate = aiResponse.data.plate.toUpperCase().trim();
            setPlateNumber(aiPlate);

            // 2. Tìm kiếm Session đang hoạt động của biển số vừa quét
            const activeSession = await fetchActiveSession(aiPlate);

            if (activeSession) {
                setScanResult({
                    type: "ExitPending",
                    sessionId: activeSession.session_id,
                    plate: aiPlate,
                    slot: activeSession.slot_name || "N/A",
                    floor: activeSession.floor !== undefined ? `Floor ${activeSession.floor}` : "N/A",
                    zone: activeSession.zone || "Unassigned Zone",
                    timeIn: activeSession.check_in_time ? new Date(activeSession.check_in_time).toLocaleString("vi-VN") : "N/A",
                    duration: activeSession.duration_minutes !== undefined ? `${activeSession.duration_minutes} mins` : "0 mins",
                    price: activeSession.current_fee || 0,
                    vehicleModel: vehicleTypes.find(v => v.id === (activeSession.vehicle_type_id || selectedVehicleType))?.name || "Vehicle"
                });
            } else {
                setScanResult(null);
                setErrorMessage(`Không tìm thấy phiên đỗ xe hoạt động cho biển số [${aiPlate}]. Xe chưa vào bãi hoặc đã ra bãi.`);
            }

        } catch (error) {
            console.error("Pipeline Error:", error);
            setErrorMessage(error.response?.data?.message || error.message || "License plate processing workflow failed.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedVehicleType, isLoading]);

    /**
     * WORKFLOW ACTION SUBMITTERS FOR MANUAL SEARCH LOGIC
     */
    const handleManualSearchSubmit = async () => {
        if (!manualInput || isLoading) return;

        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        setScanResult(null);

        const formattedPlate = manualInput.toUpperCase().trim();
        setPlateNumber(formattedPlate);

        const activeSession = await fetchActiveSession(formattedPlate);

        if (activeSession) {
            setScanResult({
                type: "ExitPending",
                sessionId: activeSession.session_id,
                plate: formattedPlate,
                slot: activeSession.slot_name || "N/A",
                floor: activeSession.floor !== undefined ? `Floor ${activeSession.floor}` : "N/A",
                zone: activeSession.zone || "Unassigned Zone",
                timeIn: activeSession.check_in_time ? new Date(activeSession.check_in_time).toLocaleString("vi-VN") : "N/A",
                duration: activeSession.duration_minutes !== undefined ? `${activeSession.duration_minutes} mins` : "0 mins",
                price: activeSession.current_fee || 0,
                vehicleModel: vehicleTypes.find(v => v.id === (activeSession.vehicle_type_id || selectedVehicleType))?.name || "Vehicle"
            });
        } else {
            setErrorMessage(`Biển số xe [${formattedPlate}] không tồn tại trong trạng thái đang đỗ ở bãi.`);
        }
        setIsLoading(false);
    };

    /**
     * ĐÓNG PHIÊN VÀ XÁC NHẬN CHO XE RA
     */
    const handleConfirmCheckOut = async () => {
        if (!scanResult || scanResult.type !== "ExitPending" || isLoading) return;

        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const { staffId, camOut, gateOut } = getOpConfig();

        try {
            const bodyData = {
                license_plate_out: scanResult.plate,
                camera_out: camOut,
                gate_out: gateOut,
                image_url_out: `/uploads/plates/checkout_captured_${Date.now()}.jpg`,
                staff_out_id: staffId
            };

            const response = await axios.post(`${API_BASE_URL}/check-out`, bodyData);

            if (response.data?.status === "COMPLETED" || response.data?.payment_status === "PAID" || response.data?.success) {
                setSuccessMessage(`Vehicle ${scanResult.plate} successfully checked out!`);
                setScanResult(null);
                setPlateNumber("");
                setManualInput("");
                setCapturedImage(null);
            } else {
                throw new Error("Backend server rejected the Check-Out response command.");
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Checkout validation request failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetTerminal = () => {
        setManualInput("");
        setScanResult(null);
        setPlateNumber("");
        setCapturedImage(null);
        setSuccessMessage("");
        setErrorMessage("");
    };

    /**
     * GLOBAL ENTER KEYLISTENER PATTERN FOR SMART TERMINAL OPERATORS
     */
    useEffect(() => {
        const handleGlobalKeyDown = (event) => {
            if (event.key === "Enter") {
                if (document.activeElement.tagName === "INPUT" && document.activeElement !== webcamRef.current) {
                    if (document.activeElement.placeholder === "Enter license plate..." && manualInput) {
                        event.preventDefault();
                        handleManualSearchSubmit();
                    }
                    return;
                }

                event.preventDefault();

                if (!scanResult) {
                    handleCaptureAndRecognize();
                } else {
                    if (scanResult.type === "ExitPending") {
                        handleConfirmCheckOut();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [scanResult, handleCaptureAndRecognize, manualInput, plateNumber]);

    return (
        <div className="w-full flex-1 text-[#0f172a] flex flex-col font-sans box-border select-none">
            {/* NOTIFICATION BANNERS */}
            {errorMessage && (
                <div className="w-full mb-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-3.5 rounded-r-xl flex items-center gap-2.5 text-xs font-bold shadow-sm">
                    <Ban size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {successMessage && (
                <div className="w-full mb-4 bg-emerald-50 border-l-4 border-[#10b981] text-emerald-800 p-3.5 rounded-r-xl flex items-center gap-2.5 text-xs font-bold shadow-sm">
                    <CheckCircle2 size={16} className="shrink-0 text-[#10b981]" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* MAIN CONTENT AREA — CHUYỂN SANG CSS GRID ĐỂ ĐỒNG BỘ CHIỀU CAO TUYỆT ĐỐI */}
            <div className="flex-1 w-full gap-5 flex flex-col lg:grid lg:grid-cols-[1.62fr_1fr] items-stretch min-h-0">

                {/* LEFT COLUMN: CAMERA WORKSPACE */}
                <div className="bg-white border border-[#e2e8f0] rounded-md p-4 shadow-sm flex flex-col min-h-0">

                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <Video size={16} className="text-[#64748b]" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#475569]">Check-out Camera</h3>
                        </div>
                        <button
                            onClick={handleCaptureAndRecognize}
                            disabled={isLoading}
                            className="bg-[#0f172a] hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-md transition-all shadow-sm shadow-slate-900/20 active:scale-98 flex items-center gap-2 uppercase tracking-wide"
                        >
                            <Camera size={14} /> Scan Plate <kbd className="bg-slate-700 text-white px-1 rounded text-[9px] ml-1 font-mono font-normal">Enter</kbd>
                        </button>
                    </div>

                    {/* LIVE CAMERA HOVER CONTAINER — Tự giãn nở lắp đầy vùng trống cột trái */}
                    <div className="bg-[#0b1329] flex-1 min-h-[340px] lg:min-h-0 w-full relative overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner group rounded-md">
                        {isStreamConnected ? (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="w-full h-full object-cover"
                                onUserMedia={() => setIsStreamConnected(true)}
                                onUserMediaError={() => setIsStreamConnected(false)}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                <VideoOff size={36} className="opacity-40" />
                                <p className="text-xs font-bold">Webcam device source missing or unavailable</p>
                            </div>
                        )}

                        {plateNumber && (
                            <div className="absolute top-4 right-4 border border-[#10b981] bg-slate-950/90 px-4 py-2 rounded-md text-center shadow-lg backdrop-blur-sm">
                                <div className="text-[#10b981] font-mono text-base font-black tracking-widest">{plateNumber}</div>
                            </div>
                        )}
                    </div>

                    {/* MANUAL SEARCH PANEL CONTROL */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end border-t border-slate-100 pt-3.5 shrink-0">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manual Entry</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter license plate..."
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                                    className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs font-mono font-bold bg-slate-50/50 tracking-wider focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all h-[40px]"
                                />
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <button
                            onClick={handleManualSearchSubmit}
                            disabled={isLoading || !manualInput}
                            className="bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-2 rounded-md text-xs font-bold h-[40px] transition-all disabled:bg-slate-100 disabled:text-slate-400 tracking-wide flex items-center justify-center gap-1.5 shrink-0 active:scale-98"
                        >
                            <RefreshCcw size={13} className={isLoading ? "animate-spin" : ""} /> Search
                        </button>
                    </div>

                </div>

                {/* RIGHT COLUMN: RECONCILIATION RESULT CARD & INVOICE */}
                <div className="bg-white border border-[#e2e8f0] rounded-md p-5 flex flex-col justify-between shadow-sm min-h-0">

                    {/* Vùng nội dung cuộn bên trong — Đảm bảo co giãn thông minh */}
                    <div className="space-y-4 flex-1 flex flex-col min-h-0 justify-center">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#475569]">Exit Session Information</h3>
                            {scanResult && (
                                <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 uppercase tracking-wider animate-pulse">
                                    {scanResult.type === "ExitPending" ? "Pending Validation" : "Unknown Status"  }
                                </span>
                            )}
                        </div>

                        {scanResult ? (
                            <div className="space-y-4 overflow-y-auto pr-1 flex-1 w-full">
                                <div
                                    onClick={() => setIsLightboxOpen(true)}
                                    className="bg-slate-950 h-[160px] overflow-hidden border border-slate-800 shadow-md relative group cursor-zoom-in rounded-md"
                                    title="Click to zoom picture snapshot"
                                >
                                    <img
                                        src={capturedImage || "https://placehold.co/600x400?text=Snapshot+Outbound"}
                                        alt="Captured Gate Target Area"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                                    <div className="absolute bottom-2 right-2 bg-slate-900/80 rounded-lg p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
                                        <Maximize2 size={12} />
                                    </div>
                                </div>

                                {/* TOTAL PRICE BANNER */}
                                <div className="bg-[#0052CC] rounded-md p-4 text-center space-y-0.5 shadow-md relative overflow-hidden">
                                    <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><DollarSign size={60} /></div>
                                    <div className="text-4xl font-mono font-black text-yellow-400 tracking-wider">
                                        {scanResult.price.toLocaleString("vi-VN")} <span className="text-2xl font-bold text-white">VND</span>
                                    </div>
                                </div>

                                {/* CASE: EXIT IS PENDING VALIDATION */}
                                {scanResult.type === "ExitPending" && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 border rounded-md px-3 py-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">License Plate</span>
                                                <span className="text-lg font-bold text-slate-700 truncate block mt-1">{scanResult.plate}</span>
                                            </div>
                                            <div className="bg-slate-50 border rounded-md px-3 py-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Slot</span>
                                                <span className="text-lg font-bold text-slate-700 truncate block mt-1">{scanResult.slot} ({scanResult.floor})</span>
                                            </div>
                                        </div>

                                        {/* LOGISTIC TIMELINE INFO PANEL */}
                                        <div className="bg-slate-50 border rounded-md p-3 space-y-2 text-[11px]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 font-medium flex items-center gap-1"><Calendar size={12} /> Check-in Time:</span>
                                                <span className="font-bold text-slate-700 font-mono">{scanResult.timeIn}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                                                <span className="text-slate-400 font-medium flex items-center gap-1"><Clock size={12} /> Durations:</span>
                                                <span className="font-black text-slate-800 font-mono bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">{scanResult.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* IDLE EMPTY PLACEHOLDER SCREEN STATE — Tự động co giãn phủ kín chiều cao nhờ flex-1 */
                                <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-[#94a3b8] bg-slate-50/50 my-auto">
                                    <CarFront size={32} className="mb-3 opacity-40 text-slate-500 animate-pulse" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-700">Ready to Scan</p>
                                    <p className="text-[11px] text-slate-500 mt-1.5 max-w-[200px] leading-normal">
                                        Press <kbd className="bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded shadow-sm font-bold font-mono text-[10px]">[Enter]</kbd> or click Scan Plate to start.
                                    </p>
                                </div>
                        )}
                    </div>

                    {/* ACTION PANEL BOUNDARY TRIGGERS */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 shrink-0">
                        {scanResult ? (
                            <>
                                {scanResult.type === "ExitPending" && (
                                    <>
                                        <button
                                            onClick={handleConfirmCheckOut}
                                            disabled={isLoading}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-98"
                                        >
                                            Confirm Payment & Exit <span className="font-mono font-normal opacity-80 text-[10px] ml-1">[Enter]</span>
                                        </button>
                                        <button
                                            onClick={resetTerminal}
                                            className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all active:scale-98"
                                        >
                                            Cancle <span className="font-mono font-normal opacity-80 text-[10px] ml-1">[Esc]</span>
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <button disabled className="w-full bg-[#f8fafc] text-slate-400 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest border border-slate-200 cursor-not-allowed text-center">
                                    System ready
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* INTERACTIVE MODAL LIGHTBOX OVERLAY COMPONENT */}
            {isLightboxOpen && capturedImage && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 animate-fadeIn cursor-zoom-out"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors bg-slate-900/60 p-2.5 rounded-full border border-white/10">
                        <X size={20} />
                    </div>

                    <div
                        className="relative max-w-4xl max-h-[85vh] rounded-md overflow-hidden border border-white/10 bg-slate-900 shadow-2xl scaleUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={capturedImage}
                            alt="High Resolution Audit View"
                            className="w-full h-auto max-h-[85vh] object-contain"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/70 p-3 text-center border-t border-white/5 backdrop-blur-sm">
                            <p className="font-mono font-bold tracking-widest text-sm text-yellow-400">
                                {plateNumber || "No Plate Detected"}
                            </p>
                            
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}