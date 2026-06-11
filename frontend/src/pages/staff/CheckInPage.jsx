import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import Webcam from "react-webcam";
import api from "../../utils/api";
import axios from "axios";
import {
    Camera, CarFront, MapPin, CheckCircle2, RefreshCcw,
    VideoOff, Ban, ParkingSquare, Hash, ArrowDownCircle,
    Video, X, Maximize2, Search
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PYTHON_STREAM_URL = import.meta.env.VITE_PYTHON_STREAM_URL;

export default function CheckInPage() {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [plateNumber, setPlateNumber] = useState("");
    const [manualInput, setManualInput] = useState("");
    const [selectedVehicleType, setSelectedVehicleType] = useState(1);
    const [scanResult, setScanResult] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
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
        camIn: localStorage.getItem("camera_in_id") || "cam_in_01",
        gateIn: localStorage.getItem("gate_in_id") || "gate_in_01",
    });


    const checkIsPlateDuplicate = async (targetPlate) => {
        try {
            const formattedPlate = targetPlate.toUpperCase().trim();
            const response = await api.get(`/parking/sessions/active/${formattedPlate}`);
            if (response.data && response.data.success === true) {
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    };


    const handleCaptureAndRecognize = useCallback(async () => {
        if (!webcamRef.current || isLoading) return;

        setIsLoading(true);
        toast.dismiss(); 
        setScanResult(null);

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            toast.error("Cannot capture image from Webcam. Please check device permissions.");
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
                toast.error(`Xe hiện đang ở trong bãi, vui lòng kiểm tra lại biển số.`);
                setIsLoading(false);
                return;
            }

            const { camIn, gateIn } = getOpConfig();
            const bodyData = {
                license_plate_in: aiPlate,
                vehicle_type_id: parseInt(aiVehicleType, 10),
                camera_in: camIn,
                gate_in: gateIn,
                image_url_in: `/uploads/plates/client_captured_${new Date().getTime()}.jpg`,
                // staff_in_id LẤY TỪ JWT TOKEN — không cần gửi từ frontend
                slot_id: null,
                booking_id: null
            };

            const response = await api.post(`/parking/check-in`, bodyData);

            if (response.data && response.data.success) {
                const sessionData = response.data.data;
                toast.success(`Successfully checked in vehicle: ${aiPlate}`);

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
            toast.error(error.response?.data?.message || error.message || "License plate processing workflow failed.");
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
        toast.dismiss(); // Xóa tất cả toast cũ

        // KIỂM TRA TRÙNG BIỂN SỐ TRƯỚC KHI MANUAL CHECK-IN
        const isDuplicate = await checkIsPlateDuplicate(plateNumber);
        if (isDuplicate) {
            toast.error(`Xe hiện đang ở trong bãi, vui lòng kiểm tra lại biển số.`);
            setIsLoading(false);
            return;
        }

        const { camIn, gateIn } = getOpConfig();

        try {
            const bodyData = {
                license_plate_in: plateNumber,
                vehicle_type_id: parseInt(selectedVehicleType, 10),
                camera_in: camIn,
                gate_in: gateIn,
                image_url_in: "/uploads/plates/manual_entry.jpg",
                // staff_in_id LẤY TỪ JWT TOKEN — không cần gửi từ frontend
                slot_id: null,
                booking_id: null
            };

            const response = await api.post(`/parking/check-in`, bodyData);
            if (response.data && response.data.success) {
                const data = response.data.data;
                toast.success(`Manual Check-In recorded for: ${plateNumber}`);
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
            toast.error(error.response?.data?.message || "Manual check-in registration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleQueryManualInbound = async (targetPlate) => {
        if (!targetPlate || targetPlate.trim() === "" || isLoading) return;

        setIsLoading(true);
        toast.dismiss(); // Xóa tất cả toast cũ
        const formattedPlate = targetPlate.toUpperCase().trim();

        try {
            // Đầu tiên kiểm tra xem xe này có đang ở trong bãi không
            const isDuplicate = await checkIsPlateDuplicate(formattedPlate);
            if (isDuplicate) {
                setScanResult(null);
                toast.error(`Trùng biển số: Xe với biển số [${formattedPlate}] hiện đang ở trong bãi xe.`);
                setIsLoading(false);
                return;
            }

            setPlateNumber(formattedPlate);
            setScanResult({
                type: "ManualEntryPending",
                plate: formattedPlate,
                vehicleModel: vehicleTypes.find(v => v.id === selectedVehicleType)?.name || "Vehicle",
                vehicleTypeId: selectedVehicleType
            });

        } catch (error) {
            toast.error("An error occurred while preparing manual entry session.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetTerminal = () => {
        setManualInput("");
        setScanResult(null);
        setPlateNumber("");
        setCapturedImage(null);
        toast.dismiss(); // Xóa sạch các thông báo cũ trên màn hình
    };


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
        <div className="w-full flex-1 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 flex flex-col font-sans box-border select-none p-4 transition-colors duration-200">

            {/* MAIN CONTENT AREA — CSS GRID ĐỒNG BỘ CHIỀU CAO TUYỆT ĐỐI */}
            <div className="flex-1 w-full gap-4 xl:gap-5 flex flex-col lg:grid lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.62fr_1fr] items-stretch min-h-0">

                {/* LEFT COLUMN: CAMERA WORKSPACE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 xl:p-5 shadow-sm dark:shadow-xl flex flex-col min-h-0 transition-colors duration-200">

                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <Video size={16} className="text-slate-500 dark:text-slate-400" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Check-In Camera</h3>
                        </div>
                        <button
                            onClick={handleCaptureAndRecognize}
                            disabled={isLoading}
                            className="bg-slate-900 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-slate-600/10 dark:shadow-lg dark:shadow-slate-950/50 active:scale-98 flex items-center gap-2 uppercase tracking-wide"
                            title="Press Enter to trigger snapshot"
                        >
                            <Camera size={14} /> Scan Plate <kbd className="bg-slate-600 dark:bg-slate-900 text-slate-100 dark:text-slate-200 px-1 rounded text-[9px] ml-1 font-mono font-normal">Enter</kbd>
                        </button>
                    </div>

                    {/* LIVE CAMERA CONTAINER */}
                    <div className="relative bg-slate-950 border border-slate-200 dark:border-slate-800 flex-1 min-h-[220px] sm:min-h-[300px] lg:min-h-0 flex items-center justify-center overflow-hidden rounded-lg transition-colors duration-200">
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
                            <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600">
                                <VideoOff size={36} className="opacity-40" />
                                <p className="text-xs font-semibold">Webcam unavailable — check device permissions</p>
                            </div>
                        )}
                    </div>

                    {/* MANUAL SEARCH PANEL CONTROL */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0 transition-colors duration-200">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Manual Entry</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter license plate..."
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                                    className="flex-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 tracking-wider focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal h-10"
                                />
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>
                        <div className="w-full sm:w-[140px] xl:w-[160px]">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Vehicle Type</label>
                            <select
                                value={selectedVehicleType}
                                onChange={(e) => setSelectedVehicleType(Number(e.target.value))}
                                className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 h-10 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 transition-all cursor-pointer"
                            >
                                {vehicleTypes.map((t) => (
                                    <option key={t.id} value={t.id} className="dark:bg-slate-900">{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => handleQueryManualInbound(manualInput)}
                            disabled={isLoading || !manualInput}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-lg text-xs font-bold h-10 transition-all border border-slate-200 dark:border-slate-700/50 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:border-slate-100 dark:disabled:border-slate-800 tracking-wide flex items-center justify-center gap-1.5 shrink-0 active:scale-98"
                        >
                            <RefreshCcw size={13} className={isLoading ? "animate-spin" : ""} /> Query
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: RECONCILIATION RESULT CARD & INVOICE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 xl:p-5 flex flex-col justify-between shadow-sm dark:shadow-xl min-h-0 transition-colors duration-200">
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0 transition-colors duration-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Entry Session Info</h3>
                        </div>

                        {/* Vùng nội dung kết quả */}
                        <div className="flex-1 flex flex-col min-h-0 justify-start overflow-y-auto pr-1 space-y-4 class-scroll-em-di">
                            {scanResult ? (
                                <>
                                    {/* ẢNH SNAPSHOT INBOUND */}
                                    <div
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="bg-slate-100 dark:bg-slate-950 h-[130px] xl:h-[160px] 2xl:h-[200px] shrink-0 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-lg transition-colors duration-200"
                                        title="Click to zoom picture snapshot"
                                    >
                                        <img
                                            src={capturedImage || "https://placehold.co/600x400/0f172a/64748b?text=Snapshot+Inbound"}
                                            alt="Captured Gate Target Area"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 dark:from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                                        <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded-md p-1.5 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <Maximize2 size={12} />
                                        </div>
                                    </div>

                                    {/* THÔNG TIN XE HOẶC TRẠNG THÁI PENDING */}
                                    {scanResult.type === "ManualEntryPending" && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-2 transition-colors duration-200">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-0.5">License Plate</span>
                                                <span className="text-base xl:text-lg font-bold text-white-600 dark:text-white-400 font-mono">{scanResult.plate}</span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-2 transition-colors duration-200">
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-0.5">Type</span>
                                                <span className="text-base xl:text-lg font-bold text-white-600 dark:text-white-400 font-mono truncate block">{scanResult.vehicleModel}</span>
                                            </div>
                                        </div>
                                    )}

                                    {scanResult.type === "EntryConfirmed" && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-2 transition-colors duration-200">
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-0.5">License Plate</span>
                                                    <span className="text-base xl:text-lg font-bold text-white-600 dark:text-white-400 font-mono">{scanResult.plate}</span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-2 transition-colors duration-200">
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-0.5">Type</span>
                                                    <span className="text-base xl:text-lg font-bold text-white-600 dark:text-white-400 font-mono truncate block">{scanResult.vehicleModel}</span>
                                                </div>
                                            </div>

                                            {/* BANNER SLOT ĐƯỢC CHUYỂN ĐỔI THEO ĐÚNG KHỐI BANNER TÍNH TIỀN CỦA CHECK-OUT */}
                                            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-800 p-4 text-white shadow-md dark:shadow-inner">
                                                <div className="space-y-1 text-center">
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-500">Assigned Slot</div>
                                                    <div className="font-mono text-yellow-400 text-3xl xl:text-4xl font-black tracking-wider drop-shadow-[0_2px_8px_rgba(234,179,8,0.2)]">
                                                        {scanResult.slot}
                                                    </div>
                                                </div>

                                                {/* LOGISTIC INFO PANEL */}
                                                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-700/50 dark:border-slate-800 pt-3 text-xs">
                                                    <div className="flex items-center gap-1.5 font-medium text-white dark:text-white">
                                                        <MapPin size={13} className="text-slate-400 dark:text-white shrink-0" />
                                                        <span className="truncate">{scanResult.floor}</span>
                                                    </div>
                                                    <div className="text-right font-semibold text-slate-300 dark:text-slate-400 flex items-center justify-end gap-1">
                                                        <span className="text-white dark:text-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ml-1">
                                                            {scanResult.zone}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* IDLE EMPTY PLACEHOLDER */
                                <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center text-center p-5 text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-950/40 my-auto transition-colors duration-200">
                                    <CarFront size={32} className="mb-2 opacity-40 text-slate-400" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Ready to Scan</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[200px] leading-normal">
                                        Press <kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded text-[10px] font-mono font-bold shadow-sm">[Enter]</kbd> or click Scan Plate to start.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTION PANEL BOUNDARY TRIGGERS */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 transition-colors duration-200">
                        {scanResult ? (
                            <>
                                {scanResult.type === "ManualEntryPending" && (
                                    <>
                                        <button
                                            onClick={handleManualCheckInSubmit}
                                            className="w-full bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-98 shadow-md shadow-blue-600/10 dark:shadow-lg dark:shadow-blue-950/30"
                                        >
                                            Confirm <span className="font-mono font-normal opacity-70 text-[10px] ml-1">[Enter]</span>
                                        </button>
                                        <button
                                            onClick={resetTerminal}
                                            className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all active:scale-98 shadow-sm"
                                        >
                                            Cancel <span className="font-mono font-normal opacity-70 text-[10px] ml-1">[Esc]</span>
                                        </button>
                                    </>
                                )}

                                {scanResult.type === "EntryConfirmed" && (
                                    <button
                                        onClick={resetTerminal}
                                        className="w-full bg-slate-900 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all active:scale-98 shadow-md"
                                    >
                                        Next Scan <span className="font-mono font-normal opacity-80 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <button disabled className="w-full bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 cursor-not-allowed text-center transition-colors duration-200">
                                System Ready
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* LIGHTBOX MODAL OVERLAY */}
            {isLightboxOpen && capturedImage && (
                <div
                    className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 dark:text-slate-400 dark:hover:text-white bg-white/10 dark:bg-slate-900/60 p-2 rounded-full border border-slate-300 dark:border-slate-800 transition-colors">
                        <X size={20} />
                    </div>
                    <div className="relative max-w-4xl max-h-[85vh] rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl scaleUp" onClick={(e) => e.stopPropagation()}>
                        <img src={capturedImage} alt="High Resolution Audit" className="w-full h-auto max-h-[85vh] object-contain" />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 dark:bg-slate-950/80 p-3 text-center border-t border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                            <p className="font-mono font-bold tracking-widest text-sm text-yellow-500 dark:text-yellow-400">{plateNumber || "No Plate Detected"}</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}