import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import Webcam from "react-webcam";
import api from "../../utils/api";
import {
    Camera, CarFront, Search, MapPin, CheckCircle2, RefreshCcw,
    VideoOff, Ban, ParkingSquare, Hash, Clock, Calendar,
    Video, X, Maximize2, DollarSign, Ticket
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PYTHON_STREAM_URL = import.meta.env.VITE_PYTHON_STREAM_URL;

export default function CheckOutPage() {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [plateNumber, setPlateNumber] = useState(""); 
    const [manualInput, setManualInput] = useState(""); 
    const [ticketCodeInput, setTicketCodeInput] = useState(""); 
    const [selectedVehicleType, setSelectedVehicleType] = useState(1);
    const [scanResult, setScanResult] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isStreamConnected, setIsStreamConnected] = useState(true);

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const [pendingCameraPlate, setPendingCameraPlate] = useState("");
    const [isPlateMatched, setIsPlateMatched] = useState(false);

    const [activeBookingId, setActiveBookingId] = useState(null);

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
        camOut: localStorage.getItem("camera_out_id") || "cam_out_02",
        gateOut: localStorage.getItem("gate_out_id") || "gate_out_02",
    });

    const fetchActiveSession = async (targetPlate) => {
        try {
            const formattedPlate = targetPlate.toUpperCase().trim();
            const response = await api.get(`/parking/sessions/active/${formattedPlate}`);
            if (response.status === 200 && response.data && response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    const fetchSessionByTicketCode = async (targetTicket) => {
        try {
            const formattedTicket = targetTicket.toUpperCase().trim();
            const response = await api.get(`/parking/tickets/${formattedTicket}/active`);
            if (response.status === 200 && response.data && response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    const populateScanResult = (activeSession, displayPlate, customType = "ExitPending") => {
        const sessionId = activeSession.session_id || activeSession.sessionId;
        const licensePlateIn = activeSession.license_plate_in || activeSession.licensePlateIn;
<<<<<<< HEAD
        const zoneName = activeSession.zone_name || activeSession.zoneName || activeSession.slot_name || activeSession.slotName;
=======
        const slotName = activeSession.slot_name || activeSession.slotName;
>>>>>>> origin/main
        const checkInTime = activeSession.check_in_time || activeSession.checkInTime;
        const durationMinutes = activeSession.duration_minutes || activeSession.durationMinutes;
        const currentFee = activeSession.current_fee !== undefined ? activeSession.current_fee : activeSession.currentFee;
        const vehicleTypeId = activeSession.vehicle_type_id || activeSession.vehicleTypeId;

        setScanResult({
            type: customType,
            sessionId: sessionId,
            plate: displayPlate || licensePlateIn || "N/A",
<<<<<<< HEAD
            slot: zoneName ? `Zone ${zoneName}` : "N/A",
            floor: activeSession.floor !== undefined ? `Floor ${activeSession.floor}` : "N/A",
            zone: zoneName || "Unassigned Zone",
=======
            slot: slotName || "N/A",
            floor: activeSession.floor !== undefined ? `Floor ${activeSession.floor}` : "N/A",
            zone: activeSession.zone || "Unassigned Zone",
>>>>>>> origin/main
            timeIn: checkInTime ? new Date(checkInTime).toLocaleString("vi-VN") : "N/A",
            duration: durationMinutes !== undefined ? `${durationMinutes} mins` : "0 mins",
            price: currentFee || 0,
            vehicleModel: vehicleTypes.find(v => v.id === (vehicleTypeId || selectedVehicleType))?.name || "Vehicle"
        });
    };

<<<<<<< HEAD

=======
>>>>>>> origin/main
    const handleManualSearchSubmit = async () => {
        if (!manualInput || isLoading) return;

        setIsLoading(true);
        toast.dismiss();
        setScanResult(null);
        setTicketCodeInput("");
        setPendingCameraPlate("");
        setIsPlateMatched(false);
        setActiveBookingId(null);

        const formattedPlate = manualInput.toUpperCase().trim();
        setPlateNumber(formattedPlate);

        const activeSession = await fetchActiveSession(formattedPlate);

        if (activeSession) {
            setPendingCameraPlate(formattedPlate);

            const bookingId = activeSession.booking_id || activeSession.bookingId;

            if (bookingId) {
                // LUỒNG XE ĐẶT TRƯỚC (BOOKING)
                setActiveBookingId(bookingId);
                setIsPlateMatched(true);
                populateScanResult(activeSession, formattedPlate, "ExitPending");
                toast.success(`Booking Recognized! Vehicle [${formattedPlate}] verified via Reservation ID: ${bookingId}.`);
            } else {
                // LUỒNG XE VÃNG LAI
                setScanResult({
                    type: "AwaitingVerification",
                    plate: formattedPlate,
                    slot: "Awaiting Ticket...",
                    floor: "N/A",
                    zone: "N/A",
                    timeIn: "Awaiting Ticket...",
                    duration: "0 mins",
                    price: 0,
                    vehicleModel: "Checking..."
                });
                toast.info(`Manual plate entered: [${formattedPlate}]. Please scan or enter Ticket Code to verify.`);
            }
        } else {
            toast.error(`Plate [${formattedPlate}] is not registered inside the parking lot.`);
        }
        setIsLoading(false);
    };

    const handleCaptureAndRecognize = useCallback(async () => {
        if (!webcamRef.current || isLoading) return;

        setIsLoading(true);
        toast.dismiss();
        setScanResult(null);
        setTicketCodeInput("");
        setPendingCameraPlate("");
        setIsPlateMatched(false);
        setActiveBookingId(null);

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            toast.error("Cannot capture image from Webcam. Please check device permissions.");
            setIsLoading(false);
            return;
        }
        setCapturedImage(imageSrc);

        try {
            const aiResponse = await api.post(`${PYTHON_STREAM_URL}/recognize_uploaded_image`, {
                image: imageSrc
            });

            if (!aiResponse.data || !aiResponse.data.success) {
                throw new Error(aiResponse.data?.message || "AI system failed to recognize license plate from snapshot.");
            }

            const aiPlate = aiResponse.data.plate.toUpperCase().trim();
            setPlateNumber(aiPlate);

            const activeSession = await fetchActiveSession(aiPlate);

            if (activeSession) {
                setPendingCameraPlate(aiPlate);

                const bookingId = activeSession.booking_id || activeSession.bookingId;

                if (bookingId) {
                    // LUỒNG XE ĐẶT TRƯỚC (BOOKING)
                    setActiveBookingId(bookingId);
                    setIsPlateMatched(true);
                    populateScanResult(activeSession, aiPlate, "ExitPending");
                    toast.success(`Booking Recognized! Vehicle [${aiPlate}] verified via Reservation ID: ${bookingId}.`);
                } else {
                    // LUỒNG XE VÃNG LAI
                    setScanResult({
                        type: "AwaitingVerification",
                        plate: aiPlate,
                        slot: "Awaiting Ticket...",
                        floor: "N/A",
                        zone: "N/A",
                        timeIn: "Awaiting Ticket...",
                        duration: "0 mins",
                        price: 0,
                        vehicleModel: "Checking..."
                    });
                    toast.info(`Camera detected: [${aiPlate}]. Please scan or enter Ticket Code to verify.`);
                }
            } else {
                toast.error(`Plate [${aiPlate}] detected by camera is not registered inside the parking lot.`);
            }

        } catch (error) {
            console.error("Pipeline Error:", error);
<<<<<<< HEAD
            const errorMsg = error.message || error.response?.data?.message || "License plate processing workflow failed.";
            toast.error(errorMsg);
=======
            toast.error(error.response?.data?.message || error.message || "License plate processing workflow failed.");
>>>>>>> origin/main
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const handleTicketSearchSubmit = async () => {
        if (!ticketCodeInput || isLoading) return;
        if (!pendingCameraPlate) {
            toast.warning("Please scan camera plate first before verifying the ticket!");
            return;
        }

        setIsLoading(true);
        toast.dismiss();

        const formattedTicket = ticketCodeInput.toUpperCase().trim();
        const activeSession = await fetchSessionByTicketCode(formattedTicket);

        if (activeSession) {
            const originalPlate = (activeSession.license_plate_in || activeSession.licensePlateIn || "").toUpperCase().trim();

            if (pendingCameraPlate === originalPlate) {
                setIsPlateMatched(true);
                populateScanResult(activeSession, pendingCameraPlate, "ExitPending"); 
                toast.success(`Verification Successful: License plate [${pendingCameraPlate}] matches the parking record.`);
            } else {
                setIsPlateMatched(false);
                setScanResult({
                    type: "MismatchBlock",
                    plate: originalPlate, 
                    slot: "BLOCKED",
                    floor: "Mismatched Data",
                    zone: "Security Triggered",
                    timeIn: "N/A",
                    duration: "N/A",
                    price: (activeSession.current_fee !== undefined ? activeSession.current_fee : activeSession.currentFee) || 0,
                    vehicleModel: "Mismatch"
                });
                toast.error(`License Plate Mismatch: Camera detected [${pendingCameraPlate}], but the parking record shows [${originalPlate}]. Please verify the vehicle before proceeding.`);
            }
        } else {
            toast.error(`Ticket Code [${formattedTicket}] is invalid or already checked out.`);
        }
        setIsLoading(false);
    };

    const handleConfirmCheckOut = async () => {
        if (!scanResult || isLoading) return;
        if (scanResult.type !== "ExitPending" && !activeBookingId) return;

        setIsLoading(true);
        toast.dismiss(); 
        const { camOut, gateOut } = getOpConfig();

        try {
            const finalTicketCode = activeBookingId
                ? null
                : (ticketCodeInput && ticketCodeInput.trim() ? ticketCodeInput.toUpperCase().trim() : null);

            const bodyData = {
                ticket_code: finalTicketCode,
                booking_id: activeBookingId || null,
                license_plate_out: (pendingCameraPlate || scanResult.plate || "").toUpperCase().trim(),
                camera_out: camOut,
                gate_out: gateOut,
                image_url_out: `/uploads/plates/checkout_captured_${Date.now()}.jpg`,
            };
            const response = await api.post(`/parking/check-out`, bodyData);
            if (
                response.status === 200 ||
                response.status === 201 ||
                response.data?.success === true ||
                response.data?.status === "COMPLETED" ||
                response.data?.payment_status === "PAID"
            ) {
                toast.success(`Vehicle [${bodyData.license_plate_out}] successfully checked out!`);
                resetTerminal(true); 
            } else {
                throw new Error("Unable to complete vehicle exit. Server returned uncompleted status.");
            }
        } catch (error) {
<<<<<<< HEAD
            const backendMessage = error.message || error.response?.data?.message || error.response?.data?.Message || error.response?.data || error;
            toast.error(typeof backendMessage === "string" ? backendMessage : "Backend validation rejected this checkout request.");
=======

            if (error.response && error.response.data) {
                const backendMessage = error.response.data?.message || error.response.data?.Message || error.response.data;
                toast.error(typeof backendMessage === "string" ? backendMessage : "Backend validation rejected this checkout request.");
            } else if (error.request) {
                toast.error("No response from parking server. Please check if your Backend .NET API is running.");
            } else {
                toast.error(`Request Setup Error: ${error.message}`);
            }
>>>>>>> origin/main
        } finally {
            setIsLoading(false);
        }
    };

    const resetTerminal = (keepSuccessToast = false) => {
        setManualInput("");
        setTicketCodeInput("");
        setScanResult(null);
        setPendingCameraPlate("");
        setIsPlateMatched(false);
        setPlateNumber("");
        setCapturedImage(null);
        setActiveBookingId(null);
        if (!keepSuccessToast) {
            toast.dismiss();
        }
    };

    useEffect(() => {
        const handleGlobalKeyDown = (event) => {
            if (event.key === "Escape" || event.key === "Esc") {
                event.preventDefault();
                resetTerminal();
                return;
            }

            if (event.key === "Enter") {
                if (document.activeElement.tagName === "INPUT") {
                    if (document.activeElement.placeholder.includes("plate") && manualInput) {
                        event.preventDefault();
                        handleManualSearchSubmit();
                        return;
                    }
                    if (document.activeElement.placeholder.includes("ticket") && ticketCodeInput) {
                        event.preventDefault();
                        handleTicketSearchSubmit();
                        return;
                    }
                    return;
                }

                event.preventDefault();
                if (!scanResult) {
                    handleCaptureAndRecognize();
                } else {
                    if (scanResult.type === "AwaitingVerification" && ticketCodeInput) {
                        handleTicketSearchSubmit();
                    } else if (scanResult.type === "ExitPending" && isPlateMatched) {
                        handleConfirmCheckOut();
                    } else if (scanResult.type === "MismatchBlock") {
                        resetTerminal();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [scanResult, handleCaptureAndRecognize, manualInput, ticketCodeInput, plateNumber, isPlateMatched, pendingCameraPlate, activeBookingId]);

    return (
        <div className="w-full flex-1 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 flex flex-col font-sans box-border select-none p-4 transition-colors duration-200">

            {/* MAIN CONTENT AREA — CSS GRID ĐỒNG BỘ CHIỀU CAO TUYỆT ĐỐI */}
            <div className="flex-1 w-full gap-4 xl:gap-5 flex flex-col lg:grid lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.62fr_1fr] items-stretch min-h-0">

                {/* LEFT COLUMN: CAMERA WORKSPACE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 xl:p-5 shadow-sm dark:shadow-xl flex flex-col min-h-0 transition-colors duration-200">

                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <Video size={16} className="text-slate-500 dark:text-slate-400" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Check-Out Camera</h3>
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
                    <div className="relative bg-slate-950 border border-slate-200 dark:border-slate-800 flex-1 min-h-[220px] sm:min-h-[300px] lg:min-h-0 flex items-center justify-center overflow-hidden  transition-colors duration-200">
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

                    {/* MANUAL PANEL: BIỂN SỐ & MÃ VÉ HAI BÊN SONG SONG */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0 transition-colors duration-200">

                        {/* NHẬP BIỂN SỐ THỦ CÔNG */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Manual Plate Entry</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter license plate..."
                                        value={manualInput}
                                        onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 tracking-wider focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal h-10"
                                    />
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                </div>
                            </div>
                            <button
                                onClick={handleManualSearchSubmit}
                                disabled={isLoading || !manualInput}
                                className="bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 hover:bg-slate-700 dark:text-slate-700 text-slate-200 px-4 h-10 rounded-lg text-xs font-bold transition-all border dark:border-slate-200 border-slate-700/50 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:border-slate-100 dark:disabled:border-slate-800 tracking-wide flex items-center justify-center gap-1 shrink-0 active:scale-98"
                            >
                                <RefreshCcw size={12} className={isLoading ? "animate-spin" : ""} /> Search
                            </button>
                        </div>

                        {/* NHẬP/QUÉT MÃ VÉ ĐỐI CHIẾU */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                                    Ticket Code {activeBookingId && <span className="text-emerald-500 text-[9px] lowercase font-normal">( Not required )</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter ticket code..."
                                        value={ticketCodeInput}
                                        onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
                                        disabled={!pendingCameraPlate || !!activeBookingId}
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 tracking-wider focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal h-10 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                </div>
                            </div>
                            <button
                                onClick={handleTicketSearchSubmit}
                                disabled={isLoading || !ticketCodeInput || !pendingCameraPlate || !!activeBookingId}
                                className="bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 hover:bg-slate-700 dark:text-slate-700 text-slate-200 px-4 h-10 rounded-lg text-xs font-bold transition-all border dark:border-slate-200 border-slate-700/50 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:border-slate-100 dark:disabled:border-slate-800 tracking-wide flex items-center justify-center gap-1 shrink-0 active:scale-98"
                            >
                                <Search size={12} /> Verify Ticket
                            </button>
                        </div>

                    </div>
                </div>

                {/* RIGHT COLUMN: RECONCILIATION RESULT CARD & INVOICE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 xl:p-5 flex flex-col justify-between shadow-sm dark:shadow-xl min-h-0 transition-colors duration-200">
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0 transition-colors duration-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Exit Session Info</h3>
                        </div>

                        {/* Vùng nội dung kết quả */}
                        <div className="flex-1 flex flex-col min-h-0 justify-start overflow-y-auto pr-1 space-y-4 class-scroll-em-di">
                            {scanResult ? (
                                <>
                                    {/* ẢNH SNAPSHOT OUTBOUND */}
                                    <div
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="bg-slate-100 dark:bg-slate-950 h-[130px] xl:h-[160px] 2xl:h-[200px] shrink-0 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-lg transition-colors duration-200"
                                        title="Click to zoom picture snapshot"
                                    >
                                        <img
                                            src={capturedImage || "https://placehold.co/600x400/0f172a/64748b?text=Snapshot+Outbound"}
                                            alt="Captured Gate Target Area"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 dark:from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                                        <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded-md p-1.5 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <Maximize2 size={12} />
                                        </div>
                                    </div>

                                    {/* THÔNG TIN SO SÁNH BIỂN SỐ */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-2 transition-colors duration-200">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-0.5">Camera Scan</span>
                                            <span className="text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">{pendingCameraPlate || "Awaiting..."}</span>
                                        </div>

                                        <div className={`border rounded-lg px-3 py-2 transition-colors duration-200 ${scanResult.type === "MismatchBlock"
                                                ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900"
                                                : activeBookingId
                                                    ? "bg-blue-100 border-blue-200 dark:bg-blue-950/100 dark:border-blue-900/60"
                                                    : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800"
                                            }`}>
                                            <span className={`text-[10px] font-bold uppercase block tracking-wider mb-0.5 ${scanResult.type === "MismatchBlock"
                                                    ? "text-rose-400 dark:text-rose-500"
                                                    : activeBookingId
                                                        ? "text-blue-500 dark:text-blue-400"
                                                        : "text-slate-400 dark:text-slate-500"
                                                }`}>
                                                {scanResult.type === "MismatchBlock" ? "Ticket Plate (Error)" : activeBookingId ? "Mode" : "Ticket Plate"}
                                            </span>
                                            <span className={`text-base xl:text-lg font-bold font-mono truncate block ${scanResult.type === "MismatchBlock"
                                                    ? "text-rose-600 dark:text-rose-400"
                                                    : activeBookingId
                                                        ? "text-blue-600 dark:text-blue-400 tracking-wide font-sans font-black" 
                                                        : "text-slate-800 dark:text-slate-200"
                                                }`}>
                                                {scanResult.type === "AwaitingVerification" ? "" : activeBookingId ? "BOOKING" : scanResult.plate}
                                            </span>
                                        </div>
                                    </div>

                                    {/* BANNER TÍNH TIỀN KHI ĐÃ KHỚP HOẶC HIỂN THỊ LỖI KHI BỊ CHẶN */}
                                    <div className={`relative overflow-hidden rounded-lg p-4 text-white shadow-md dark:shadow-inner border ${scanResult.type === "MismatchBlock" ? "bg-rose-700 border-rose-800" : "bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-800"}`}>
                                        <div className="space-y-1 text-center">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-400">
                                                {scanResult.type === "MismatchBlock" ? "Security Action" : activeBookingId ? "Booking Fee" : "Total Fee"}
                                            </div>
                                            <div className={`font-mono text-3xl xl:text-4xl font-black tracking-wider ${scanResult.type === "MismatchBlock" ? "text-white" : "text-yellow-400 drop-shadow-[0_2px_8px_rgba(234,179,8,0.2)]"}`}>
                                                {scanResult.type === "MismatchBlock" ? "BLOCKED" : `${scanResult.price.toLocaleString("vi-VN")} VND`}
                                            </div>
                                        </div>

                                        {/* LOGISTIC TIMELINE INFO PANEL */}
                                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-700/50 dark:border-slate-800 pt-3 text-xs">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-300 dark:text-slate-400">
                                                <Clock size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span className="truncate">{scanResult.timeIn}</span>
                                            </div>
                                            <div className="text-right font-semibold text-slate-300 dark:text-slate-400 flex items-center justify-end gap-1">
                                                Duration:
                                                <span className="bg-white/10 dark:bg-slate-800 border border-white/5 dark:border-slate-700 text-white dark:text-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ml-1">
                                                    {scanResult.duration}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* IDLE EMPTY PLACEHOLDER */
                                <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center text-center p-5 text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-950/40 my-auto transition-colors duration-200">
                                    <CarFront size={32} className="mb-2 opacity-40 text-slate-400" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Ready to Scan</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[200px] leading-normal">
                                        Press <kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded text-[10px] font-mono font-bold shadow-sm">[Enter]</kbd> or Scan Plate camera first, then pass the ticket code.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTION PANEL BOUNDARY TRIGGERS */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 transition-colors duration-200">
                        {scanResult ? (
                            <>
                                {scanResult.type === "ExitPending" && isPlateMatched && (
                                    <button
                                        onClick={handleConfirmCheckOut}
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-98 shadow-md shadow-blue-600/10 dark:shadow-lg dark:shadow-blue-950/30"
                                    >
                                        Confirm <span className="font-mono font-normal opacity-70 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                                {scanResult.type === "MismatchBlock" && (
                                    <button
                                        onClick={resetTerminal}
                                        className="w-full bg-rose-700 hover:bg-rose-600 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest text-center shadow-md active:scale-98 animate-pulse"
                                    >
                                        Reset <span className="font-mono font-normal opacity-70 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                                {scanResult.type === "AwaitingVerification" && (
                                    <button
                                        onClick={handleTicketSearchSubmit}
                                        disabled={isLoading || !ticketCodeInput}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-98 shadow-md"
                                    >
                                        Confirm <span className="font-mono font-normal opacity-70 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                                <button
                                    onClick={resetTerminal}
                                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all active:scale-98 shadow-sm"
                                >
                                    Cancel <span className="font-mono font-normal opacity-70 text-[10px] ml-1">[Esc]</span>
                                </button>
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
                    className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 dark:text-slate-400 dark:hover:text-white bg-white/10 dark:bg-slate-900/60 p-2 rounded-full border border-slate-300 dark:border-slate-800 transition-colors">
                        <X size={20} />
                    </div>
                    <div className="relative max-w-4xl max-h-[85vh] rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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