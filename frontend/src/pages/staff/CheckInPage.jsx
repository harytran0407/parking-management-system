import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
    Camera, CarFront, MapPin, CheckCircle2, RefreshCcw,
    VideoOff, Ban, ParkingSquare, Hash, ArrowDownCircle,
    Video, X, Maximize2
} from "lucide-react";

const API_BASE_URL = "http://localhost:5077/api/v1/parking";
const PYTHON_STREAM_URL = "http://localhost:5001/api/v1/stream";

export default function CheckInPage() {
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
        camIn: localStorage.getItem("camera_in_id") || "cam_in_01",
        gateIn: localStorage.getItem("gate_in_id") || "gate_in_01",
    });

    /**
     * Hàm kiểm tra trùng biển số xe dựa trên API lấy session active
     * Trả về true nếu xe đang ở trong bãi (bị trùng), ngược lại trả về false.
     */
    const checkIsPlateDuplicate = async (targetPlate) => {
        try {
            const formattedPlate = targetPlate.toUpperCase().trim();
            const response = await axios.get(`${API_BASE_URL}/sessions/active/${formattedPlate}`);
            // Nếu API trả về thành công và success: true nghĩa là xe đang có trong bãi
            if (response.data && response.data.success === true) {
                return true;
            }
            return false;
        } catch (error) {
            // Thông thường nếu không tìm thấy (404) API sẽ throw error, nghĩa là xe chưa vào bãi -> Không trùng
            return false;
        }
    };

    /**
     * MAIN FLOW: REACT CAPTURE -> PYTHON AI RECOGNITION -> ASP.NET CORE CHECK-IN
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
            const aiResponse = await axios.post(`${PYTHON_STREAM_URL}/recognize_uploaded_image`, {
                image: imageSrc
            });

            if (!aiResponse.data || !aiResponse.data.success) {
                throw new Error(aiResponse.data?.message || "AI system failed to recognize license plate from snapshot.");
            }

            const aiPlate = aiResponse.data.plate.toUpperCase().trim();
            const aiVehicleType = aiResponse.data.vehicle_type_id || selectedVehicleType;

            setPlateNumber(aiPlate);

            // KIỂM TRA TRÙNG BIỂN SỐ TRƯỚC KHI THỰC HIỆN CHECK-IN
            const isDuplicate = await checkIsPlateDuplicate(aiPlate);
            if (isDuplicate) {
                setScanResult(null);
                setErrorMessage(`Xe hiện đang ở trong bãi, vui lòng kiểm tra lại biển số.`);
                setIsLoading(false);
                return;
            }

            const { staffId, camIn, gateIn } = getOpConfig();
            const bodyData = {
                license_plate_in: aiPlate,
                vehicle_type_id: parseInt(aiVehicleType, 10),
                camera_in: camIn,
                gate_in: gateIn,
                image_url_in: `/uploads/plates/client_captured_${new Date().getTime()}.jpg`,
                staff_in_id: staffId,
                slot_id: null,
                booking_id: null
            };

            const response = await axios.post(`${API_BASE_URL}/check-in`, bodyData);

            if (response.data && response.data.success) {
                const sessionData = response.data.data;
                setSuccessMessage(`Successfully checked in vehicle: ${aiPlate}`);

                setScanResult({
                    type: "EntryConfirmed",
                    plate: sessionData.license_plate_in || aiPlate,
                    sessionId: sessionData.session_id,
                    slot: sessionData.slot_name || "N/A",
                    floor: sessionData.floor !== undefined ? `Floor ${sessionData.floor}` : "N/A",
                    zone: sessionData.zone || "Unassigned Zone",
                    vehicleModel: vehicleTypes.find(v => v.id === parseInt(aiVehicleType))?.name || "Vehicle"
                });
            } else {
                throw new Error("Backend server rejected the Check-In command request.");
            }

        } catch (error) {
            console.error("Pipeline Error:", error);
            setErrorMessage(error.response?.data?.message || error.message || "License plate processing workflow failed.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedVehicleType, isLoading]);

    /**
     * WORKFLOW ACTION SUBMITTERS FOR MANUAL LOGIC
     */
    const handleManualCheckInSubmit = async () => {
        if (!plateNumber || isLoading) return;

        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        // KIỂM TRA TRÙNG BIỂN SỐ TRƯỚC KHI MANUAL CHECK-IN
        const isDuplicate = await checkIsPlateDuplicate(plateNumber);
        if (isDuplicate) {
            setErrorMessage(`Trùng biển số: Xe với biển số [${plateNumber}] hiện đang ở trong bãi xe.`);
            setIsLoading(false);
            return;
        }

        const { staffId, camIn, gateIn } = getOpConfig();

        try {
            const bodyData = {
                license_plate_in: plateNumber,
                vehicle_type_id: parseInt(selectedVehicleType, 10),
                camera_in: camIn,
                gate_in: gateIn,
                image_url_in: "/uploads/plates/manual_entry.jpg",
                staff_in_id: staffId,
                slot_id: null,
                booking_id: null
            };

            const response = await axios.post(`${API_BASE_URL}/check-in`, bodyData);
            if (response.data && response.data.success) {
                const data = response.data.data;
                setSuccessMessage(`Manual Check-In recorded for: ${plateNumber}`);
                setScanResult({
                    type: "EntryConfirmed",
                    plate: data.license_plate_in,
                    slot: data.slot_name || "N/A",
                    floor: data.floor !== undefined ? `Floor ${data.floor}` : "N/A",
                    zone: data.zone || "Unassigned Zone",
                    sessionId: data.session_id,
                    vehicleModel: vehicleTypes.find(v => v.id === selectedVehicleType)?.name || "Vehicle"
                });
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Manual check-in registration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleQueryManualInbound = async (targetPlate) => {
        if (!targetPlate || targetPlate.trim() === "" || isLoading) return;

        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        const formattedPlate = targetPlate.toUpperCase().trim();

        try {
            // Đầu tiên kiểm tra xem xe này có đang ở trong bãi không
            const isDuplicate = await checkIsPlateDuplicate(formattedPlate);
            if (isDuplicate) {
                setScanResult(null);
                setErrorMessage(`Trùng biển số: Xe với biển số [${formattedPlate}] hiện đang ở trong bãi xe.`);
                setIsLoading(false);
                return;
            }

            // Nếu không trùng, chuẩn bị cho phép tiến hành Check-In thủ công
            setPlateNumber(formattedPlate);
            setScanResult({
                type: "ManualEntryPending",
                plate: formattedPlate,
                vehicleModel: vehicleTypes.find(v => v.id === selectedVehicleType)?.name || "Vehicle",
                vehicleTypeId: selectedVehicleType
            });

        } catch (error) {
            setErrorMessage("An error occurred while preparing manual entry session.");
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
                        handleQueryManualInbound(manualInput);
                    }
                    return;
                }

                event.preventDefault();

                if (!scanResult) {
                    handleCaptureAndRecognize();
                } else {
                    if (scanResult.type === "ManualEntryPending") {
                        handleManualCheckInSubmit();
                    } else if (scanResult.type === "EntryConfirmed") {
                        resetTerminal();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [scanResult, handleCaptureAndRecognize, manualInput, plateNumber, selectedVehicleType]);

    return (
        <div className="w-full flex-1 text-[#0f172a] flex flex-col font-sans box-border select-none">
            {/* NOTIFICATION BANNERS - shrink-0 ngăn banner đẩy khung dưới xuống */}
            {errorMessage && (
                <div className="w-full mb-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-xl flex items-center gap-2.5 text-xs font-bold shadow-sm shrink-0">
                    <Ban size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {successMessage && (
                <div className="w-full mb-3 bg-emerald-50 border-l-4 border-[#10b981] text-emerald-800 p-3 rounded-r-xl flex items-center gap-2.5 text-xs font-bold shadow-sm shrink-0">
                    <CheckCircle2 size={16} className="shrink-0 text-[#10b981]" />
                    <span> {successMessage}</span>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 w-full gap-5 flex flex-col lg:grid lg:grid-cols-[1.62fr_1fr] items-stretch min-h-0">

                {/* LEFT COLUMN: CAMERA WORKSPACE */}
                <div className="bg-white border border-[#e2e8f0] rounded-md p-4 shadow-sm flex flex-col min-h-0">

                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <Video size={16} className="text-[#64748b]" />
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#475569]">Check-In Camera</h3>
                            </div>
                            <button
                                onClick={handleCaptureAndRecognize}
                                disabled={isLoading}
                                className="bg-[#0f172a] hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-md transition-all shadow-sm shadow-slate-900/20 active:scale-98 flex items-center gap-2 uppercase tracking-wide"
                                title="Press Enter to trigger snapshot"
                            >
                                <Camera size={14} /> Scan Plate <kbd className="bg-slate-700 text-white px-1 rounded text-[9px] ml-1 font-mono font-normal">Enter</kbd>
                            </button>
                        </div>

                        {/* LIVE CAMERA HOVER CONTAINER */}
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

                        {/* MANUAL ENTRY PANEL CONTROL */}
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
                                </div>
                            </div>
                            <div className="w-full sm:w-[160px]">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle Type</label>
                                <select
                                    value={selectedVehicleType}
                                    onChange={(e) => setSelectedVehicleType(Number(e.target.value))}
                                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs font-bold bg-white text-slate-700 h-[40px] focus:outline-none focus:border-[#0f172a] transition-all cursor-pointer"
                                >
                                    {vehicleTypes.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => handleQueryManualOrExit(manualInput)}
                                disabled={isLoading || !manualInput}
                                className="bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-2 rounded-md text-xs font-bold h-[40px] transition-all disabled:bg-slate-100 disabled:text-slate-400 tracking-wide flex items-center justify-center gap-1.5 shrink-0 active:scale-98"
                            >
                                <RefreshCcw size={13} className={isLoading ? "animate-spin" : ""} /> Query Vehicle
                            </button>
                        </div>

                    
                </div>

                {/* RIGHT COLUMN: RECONCILIATION RESULT CARD & ACTION */}
                <div className="bg-white border border-[#e2e8f0] rounded-md p-5 flex flex-col justify-between shadow-sm min-h-0">
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#475569]">Entry Session Information</h3>
                            {scanResult && (
                                <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 uppercase tracking-wider animate-pulse">
                                    {scanResult.type === "ManualEntryPending" ? "Manual Check-In" : scanResult.type === "ExitPending" ? "Exit Processing" : "Entry Confirmation"}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 justify-center">
                            {scanResult ? (
                                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                                    {/* ENHANCED UX: INTERACTIVE IMAGING SCREENSHOT LIGHTBOX INITIATOR */}
                                    <div
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="bg-slate-950 h-[200px] overflow-hidden border border-slate-800 shadow-md relative group cursor-zoom-in rounded-md"
                                        title="Click to zoom picture snapshot"
                                    >
                                        <img
                                            src={capturedImage || "https://placehold.co/600x400?text=Snapshot+Acquired"}
                                            alt="Captured Gate Target Area"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                                        <div className="absolute bottom-2 right-2 bg-slate-900/80 rounded-lg p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
                                            <Maximize2 size={12} />
                                        </div>
                                    </div>

                                    {/* CASE 1: EXIT TERMINATION ACTION FLOW (ExitPending) */}
                                    {scanResult.type === "ExitPending" && (
                                        <div className="space-y-3">
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 shadow-sm relative overflow-hidden">
                                                <div className="absolute -right-2 -bottom-2 opacity-5 text-emerald-600"><CreditCard size={70} /></div>
                                                <div className="text-[10px] uppercase font-black tracking-wider text-emerald-800 flex items-center gap-1"><DollarSign size={12} /> Total Accumulated Parking Fee</div>
                                                <div className="text-2xl font-mono font-black text-emerald-700 mt-0.5">
                                                    {(scanResult.price || 0).toLocaleString()} VND
                                                </div>
                                                <div className="mt-3 pt-2.5 border-t border-emerald-200/50 text-[11px] text-emerald-700/90 space-y-1.5 font-medium">
                                                    <div className="flex justify-between"><span>Check-In Time:</span> <span className="font-mono font-bold">{scanResult.timeIn}</span></div>
                                                    <div className="flex justify-between"><span>Total Duration:</span> <span className="font-bold">{scanResult.duration}</span></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-slate-50 border p-2.5 rounded-md">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Audited Plate</span>
                                                    <span className="text-sm font-mono font-black text-slate-800 tracking-wide">{scanResult.plate}</span>
                                                </div>
                                                <div className="bg-slate-50 border p-2.5 rounded-md">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Class Type</span>
                                                    <span className="text-sm font-bold text-slate-800 tracking-wide">{scanResult.vehicleModel}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CASE 2: REGISTRATION NOT FOUND IN SYSTEM (ManualEntryPending) */}
                                    {scanResult.type === "ManualEntryPending" && (
                                        <div className="space-y-3">
                                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-md text-xs font-bold leading-relaxed flex items-start gap-2">
                                                <Ban size={15} className="shrink-0 mt-0.5 text-amber-600" />
                                                <span>No active parking session matches this plate record. Register an internal entry session flow for this vehicle?</span>
                                            </div>
                                            <div className="bg-slate-50 p-3.5 rounded-md border space-y-2">
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">License Plate</span>
                                                    <span className="text-lg font-bold text-slate-700 truncate block mt-">{scanResult.plate}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Class Registration</span>
                                                    <span className="text-lg font-bold text-slate-700 truncate block mt-">{scanResult.vehicleModel}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CASE 3: ENTRY VERIFIED & ALLOCATED (EntryConfirmed) */}
                                    {scanResult.type === "EntryConfirmed" && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-1.5 text-[#10b981] font-bold text-xs uppercase tracking-wide">
                                                <ArrowDownCircle size={15} /> Check-In Confirmed
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-slate-50 border rounded-md px-3 py-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">License Plate</span>
                                                    <span className="text-[20px] font-bold text-slate-700">{scanResult.plate}</span>
                                                </div>
                                                <div className="bg-slate-50 border rounded-md px-3 py-2">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Type</span>
                                                    <span className="text-[20px] font-bold text-slate-700">{scanResult.vehicleModel}</span>
                                                </div>
                                            </div>

                                            {/* EXPANDED FIELDS PANEL GRID */}
                                            <div className="bg-gradient-to-br from-[#0f172a] to-slate-800 rounded-md p-4 text-white shadow-sm relative overflow-hidden space-y-2">
                                                <div className="absolute -right-4 -bottom-4 opacity-5 text-white"><MapPin size={80} /></div>
                                                <div>
                                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Assigned Slot</div>
                                                    <div className="text-xl font-mono font-black tracking-widest text-yellow-400">{scanResult.slot}</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-700/60 text-[11px] text-slate-300">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={11} className="text-slate-400" /> {scanResult.floor}
                                                    </div>
                                                    <div className="text-right text-slate-400 font-medium">
                                                        <span className="text-white font-bold">{scanResult.zone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* IDLE EMPTY PLACEHOLDER SCREEN STATE */
                                <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-[#94a3b8] bg-slate-50/50 my-auto">
                                    <CarFront size={32} className="mb-3 opacity-40 text-slate-500 animate-pulse" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-700">Ready to Scan</p>
                                    <p className="text-[11px] text-slate-500 mt-1.5 max-w-[200px] leading-normal">
                                        Press <kbd className="bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded shadow-sm font-bold font-mono text-[10px]">[Enter]</kbd> or click Scan Plate to start.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTION PANEL BOUNDARY TRIGGERS */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 shrink-0">
                        {scanResult ? (
                            <>
                                {scanResult.type === "ManualEntryPending" && (
                                    <>
                                        <button
                                            onClick={handleManualCheckInSubmit}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-98"
                                        >
                                            Confirm Manual Inbound Gate <span className="font-mono font-normal opacity-80 text-[10px] ml-1">[Enter]</span>
                                        </button>
                                        <button
                                            onClick={resetTerminal}
                                            className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all active:scale-98"
                                        >
                                            Abort
                                        </button>
                                    </>
                                )}

                                {scanResult.type === "EntryConfirmed" && (
                                    <button
                                        onClick={resetTerminal}
                                        className="w-full bg-[#0f172a] hover:bg-slate-800 text-white py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all active:scale-98 shadow-md"
                                    >
                                        Next Scan <span className="font-mono font-normal opacity-80 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <button disabled className="w-full bg-[#f8fafc] text-slate-400 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest border border-slate-200 cursor-not-allowed text-center">
                                System Ready
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
                    className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl scaleUp"
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
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                            Enlarged Camera Snapshot View
                        </p>
                    </div>
                </div>
            </div>
        )}

    </div>
);
}