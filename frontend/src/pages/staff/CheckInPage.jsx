import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import Webcam from "react-webcam";
import api from "../../utils/api";
import axios from "axios";
import {
    Camera, CarFront, MapPin, CheckCircle2, RefreshCw,
    VideoOff, Ban, ParkingSquare, Hash, ArrowDownCircle,
    Video, X, Maximize2, Search, AlertTriangle, Clock
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PYTHON_STREAM_URL = import.meta.env.VITE_PYTHON_STREAM_URL;

const formatDateTime = (dateVal, language = "vi") => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString(language === "vi" ? "vi-VN" : "en-US");
};

const t = {
    vi: {
        cameraHeader: "Check-In Camera",
        btnScanPlate: "Quét biển số",
        scanPlateTitle: "Nhấn Enter để chụp ảnh",
        webcamUnavailable: "Không tìm thấy Webcam — kiểm tra quyền thiết bị",
        manualEntryLabel: "Nhập thủ công",
        placeholderPlate: "Nhập biển số xe...",
        vehicleTypeLabel: "Loại xe",
        btnQuery: "Tra cứu",
        entrySessionHeader: "Thông tin phiên vào",
        readyToScan: "Sẵn sàng quét",
        pressEnterToStart: "Nhấn [Enter] để bắt đầu.",
        licensePlate: "Biển kiểm soát",
        type: "Loại xe",
        assignedZone: "Phân khu chỉ định",
        checkInTimeLabel: "Giờ vào",
        bookedVehicle: "Xe đã đặt trước",
        bookingNotice: "Tìm thấy lượt đặt chỗ! Không cần mã vé.",
        ticketCodeLabel: "Mã vé:",
        btnConfirm: "Xác nhận",
        btnCancel: "Hủy",
        btnNextScan: "Quét tiếp",
        systemReady: "Hệ thống sẵn sàng",
        noPlateDetected: "Không phát hiện biển số",
        earlyCheckInTitle: "Cảnh báo đến sớm",
        btnAgree: "Đồng ý",
        motorbike: "Xe máy",
        car: "Ô tô",
        toastSuccessCheckIn: "Đăng ký xe vào thành công:",
        toastEarlyCheckInFailed: "Đăng ký đến sớm thất bại.",
        toastWebcamError: "Không thể chụp ảnh từ Webcam. Vui lòng kiểm tra quyền thiết bị.",
        toastDuplicatePlate: "Trùng biển số: Xe {plate} đang đỗ trong bãi xe.",
        toastBackendError: "Máy chủ từ chối yêu cầu Check-In.",
        toastDuplicatePlateManual: "Trùng biển số: Xe {plate} đang đỗ trong bãi xe.",
        toastManualCheckInSuccess: "Đăng ký Check-In thủ công thành công cho:",
        toastManualCheckInFailed: "Đăng ký Check-In thủ công thất bại.",
        toastPrepareManualError: "Đã xảy ra lỗi khi chuẩn bị phiên đăng ký thủ công.",
        toastProcessingWorkflowFailed: "Quy trình xử lý biển số thất bại.",
        floorLabel: "Tầng",
        remainingLabel: "còn trống",
        unassignedZone: "Khu vực chưa chỉ định",
        vehicleLabel: "Phương tiện"
    },
    en: {
        cameraHeader: "Check-In Camera",
        btnScanPlate: "Scan Plate",
        scanPlateTitle: "Press Enter to trigger snapshot",
        webcamUnavailable: "Webcam unavailable — check device permissions",
        manualEntryLabel: "Manual Entry",
        placeholderPlate: "Enter license plate...",
        vehicleTypeLabel: "Vehicle Type",
        btnQuery: "Query",
        entrySessionHeader: "Entry Session Info",
        readyToScan: "Ready to Scan",
        pressEnterToStart: "Press [Enter] to start.",
        licensePlate: "License Plate",
        type: "Type",
        assignedZone: "Assigned Zone",
        checkInTimeLabel: "Check-in Time",
        bookedVehicle: "Booked Vehicle",
        bookingNotice: "Booking found! No ticket code required.",
        ticketCodeLabel: "Ticket Code:",
        btnConfirm: "Confirm",
        btnCancel: "Cancel",
        btnNextScan: "Next Scan",
        systemReady: "System Ready",
        noPlateDetected: "No Plate Detected",
        earlyCheckInTitle: "Early Check-in Warning",
        btnAgree: "Agree",
        motorbike: "Motorbike",
        car: "Car",
        toastSuccessCheckIn: "Successfully checked in vehicle:",
        toastEarlyCheckInFailed: "Early check-in failed.",
        toastWebcamError: "Cannot capture image from Webcam. Please check device permissions.",
        toastDuplicatePlate: "Duplicate License Plate: Vehicle {plate} is already parked in the lot.",
        toastBackendError: "Backend server rejected the Check-In command request.",
        toastDuplicatePlateManual: "Duplicate License Plate: Vehicle {plate} is already parked in the lot.",
        toastManualCheckInSuccess: "Manual Check-In recorded for:",
        toastManualCheckInFailed: "Manual check-in registration failed.",
        toastPrepareManualError: "An error occurred while preparing manual entry session.",
        toastProcessingWorkflowFailed: "License plate processing workflow failed.",
        floorLabel: "Floor",
        remainingLabel: "remaining",
        unassignedZone: "Unassigned Zone",
        vehicleLabel: "Vehicle"
    }
};

export default function CheckInPage() {
    const { language } = useLanguage();
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [plateNumber, setPlateNumber] = useState("");
    const [manualInput, setManualInput] = useState("");
    const [selectedVehicleType, setSelectedVehicleType] = useState(1);
    const [scanResult, setScanResult] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isStreamConnected, setIsStreamConnected] = useState(true);

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [earlyCheckInWarning, setEarlyCheckInWarning] = useState(null);

    const vehicleTypes = [
        { id: 1, name: t[language].motorbike },
        { id: 2, name: t[language].car }
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

    const handleConfirmEarlyCheckIn = async (bodyData) => {
        setIsLoading(true);
        setEarlyCheckInWarning(null);
        toast.dismiss();
        try {
            const bodyWithConfirm = {
                ...bodyData,
                confirm_early_in: true
            };
            const response = await api.post(`/parking/check-in`, bodyWithConfirm);
            if (response.data && response.data.success) {
                const sessionData = response.data.data;
                toast.success(`${t[language].toastSuccessCheckIn} ${bodyWithConfirm.license_plate_in}`);
                const hasBooking = sessionData.booking_id !== null && sessionData.booking_id !== undefined && sessionData.booking_id !== "";
                setScanResult({
                    type: "EntryConfirmed",
                    isBooking: hasBooking,
                    plate: sessionData.license_plate_in || bodyWithConfirm.license_plate_in,
                    sessionId: sessionData.session_id,
                    ticketCode: hasBooking ? null : (sessionData.ticket_code || "N/A"),
                    slot: `Zone ${sessionData.zone_name || "?"} (${sessionData.available_capacity ?? "?"} ${t[language].remainingLabel})`,
                    floor: sessionData.floor !== undefined ? `${t[language].floorLabel} ${sessionData.floor}` : "N/A",
                    zone: sessionData.zone_name || t[language].unassignedZone,
                    vehicleModel: vehicleTypes.find(v => v.id === parseInt(bodyWithConfirm.vehicle_type_id))?.name || t[language].vehicleLabel,
                    checkInTime: formatDateTime(sessionData.check_in_time || new Date(), language)
                });
            }
        } catch (error) {
            const errorMsg = error.message || error.response?.data?.message || t[language].toastEarlyCheckInFailed;
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };


    const handleCaptureAndRecognize = useCallback(async () => {
        if (!webcamRef.current || isLoading) return;

        setIsLoading(true);
        toast.dismiss();
        setScanResult(null);

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            toast.error(t[language].toastWebcamError);
            setIsLoading(false);
            return;
        }
        setCapturedImage(imageSrc);

        try {
            const aiResponse = await axios.post(`${PYTHON_STREAM_URL}/recognize_uploaded_image`, {
                image: imageSrc
            });

            if (!aiResponse.data || !aiResponse.data.success) {
                throw new Error(aiResponse.data?.message || t[language].toastProcessingWorkflowFailed);
            }

            const aiPlate = aiResponse.data.plate.toUpperCase().trim();
            const aiVehicleType = aiResponse.data.vehicle_type_id || selectedVehicleType;

            setPlateNumber(aiPlate);

            const isDuplicate = await checkIsPlateDuplicate(aiPlate);
            if (isDuplicate) {
                setScanResult(null);
                toast.error(t[language].toastDuplicatePlate.replace("{plate}", aiPlate));
                setIsLoading(false);
                return;
            }

            const { camIn, gateIn } = getOpConfig();
            const bodyData = {
                license_plate_in: aiPlate,
                vehicle_type_id: parseInt(aiVehicleType, 10),
                camera_in: camIn,
                gate_in: gateIn,
                image_url_in: imageSrc,
            };

            try {
                const response = await api.post(`/parking/check-in`, bodyData);

                if (response.data && response.data.success) {
                    const sessionData = response.data.data;
                    toast.success(`${t[language].toastSuccessCheckIn} ${aiPlate}`);

                    const hasBooking = sessionData.booking_id !== null && sessionData.booking_id !== undefined && sessionData.booking_id !== "";

                    setScanResult({
                        type: "EntryConfirmed",
                        isBooking: hasBooking,
                        plate: sessionData.license_plate_in || aiPlate,
                        sessionId: sessionData.session_id,
                        ticketCode: hasBooking ? null : (sessionData.ticket_code || "N/A"),
                        slot: `Zone ${sessionData.zone_name || "?"} (${sessionData.available_capacity ?? "?"} ${t[language].remainingLabel})`,
                        floor: sessionData.floor !== undefined ? `${t[language].floorLabel} ${sessionData.floor}` : "N/A",
                        zone: sessionData.zone_name || t[language].unassignedZone,
                        vehicleModel: vehicleTypes.find(v => v.id === parseInt(aiVehicleType))?.name || t[language].vehicleLabel,
                        checkInTime: formatDateTime(sessionData.check_in_time || new Date(), language)
                    });
                } else {
                    throw new Error(t[language].toastBackendError);
                }
            } catch (error) {
                const errorCode = error.error_code || error.response?.data?.error_code;
                const errorMsg = error.message || error.response?.data?.message;
                if (errorCode === "EARLY_CHECKIN_WARNING") {
                    setEarlyCheckInWarning({
                        message: errorMsg,
                        bodyData: bodyData
                    });
                    return;
                }
                throw error;
            }

        } catch (error) {
            console.error("Pipeline Error:", error);
            const errorMsg = error.message || error.response?.data?.message || t[language].toastProcessingWorkflowFailed;
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [selectedVehicleType, isLoading, language]);


    const handleManualCheckInSubmit = async () => {
        if (!plateNumber || isLoading) return;

        setIsLoading(true);
        toast.dismiss();

        const isDuplicate = await checkIsPlateDuplicate(plateNumber);
        if (isDuplicate) {
            toast.error(t[language].toastDuplicatePlateManual.replace("{plate}", plateNumber));
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
                booking_id: null
            };

            console.log("[API Check-In] Gửi Body Data lên Backend:", bodyData);

            try {
                const response = await api.post(`/parking/check-in`, bodyData);
                console.log("[API Check-In] Kết quả phản hồi từ Backend:", response.data);

                if (response.data && response.data.success) {
                    const data = response.data.data;
                    toast.success(`${t[language].toastManualCheckInSuccess} ${plateNumber}`);

                    const hasBooking = data.booking_id !== null && data.booking_id !== undefined && data.booking_id !== "";

                    setScanResult({
                        type: "EntryConfirmed",
                        isBooking: hasBooking,
                        plate: data.license_plate_in,
                        ticketCode: hasBooking ? null : (data.ticket_code || "N/A"),
                        slot: `Zone ${data.zone_name || "?"} (${data.available_capacity ?? "?"} ${t[language].remainingLabel})`,
                        floor: data.floor !== undefined ? `${t[language].floorLabel} ${data.floor}` : "N/A",
                        zone: data.zone_name || t[language].unassignedZone,
                        sessionId: data.session_id,
                        vehicleModel: vehicleTypes.find(v => v.id === selectedVehicleType)?.name || t[language].vehicleLabel,
                        checkInTime: formatDateTime(data.check_in_time || new Date(), language)
                    });
                }
            } catch (error) {
                const errorCode = error.error_code || error.response?.data?.error_code;
                const errorMsg = error.message || error.response?.data?.message;
                if (errorCode === "EARLY_CHECKIN_WARNING") {
                    setEarlyCheckInWarning({
                        message: errorMsg,
                        bodyData: bodyData
                    });
                    return;
                }
                throw error;
            }
        } catch (error) {
            const errorMsg = error.message || error.response?.data?.message || t[language].toastManualCheckInFailed;
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQueryManualInbound = async (targetPlate) => {
        if (!targetPlate || targetPlate.trim() === "" || isLoading) return;

        setIsLoading(true);
        toast.dismiss();
        const formattedPlate = targetPlate.toUpperCase().trim();

        try {
            const isDuplicate = await checkIsPlateDuplicate(formattedPlate);
            if (isDuplicate) {
                setScanResult(null);
                toast.error(t[language].toastDuplicatePlateManual.replace("{plate}", formattedPlate));
                setIsLoading(false);
                return;
            }

            setPlateNumber(formattedPlate);
            setScanResult({
                type: "ManualEntryPending",
                plate: formattedPlate,
                vehicleModel: vehicleTypes.find(v => v.id === selectedVehicleType)?.name || t[language].vehicleLabel,
                vehicleTypeId: selectedVehicleType
            });

        } catch (error) {
            toast.error(t[language].toastPrepareManualError);
        } finally {
            setIsLoading(false);
        }
    };

    const resetTerminal = () => {
        setManualInput("");
        setScanResult(null);
        setPlateNumber("");
        setCapturedImage(null);
        toast.dismiss();
    };


    useEffect(() => {
        const handleGlobalKeyDown = (event) => {
            if (event.key === "Enter") {
                if (document.activeElement.tagName === "INPUT" && document.activeElement !== webcamRef.current) {
                    if (document.activeElement.placeholder === t[language].placeholderPlate && manualInput) {
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
    }, [scanResult, handleCaptureAndRecognize, manualInput, plateNumber, selectedVehicleType, language]);
    return (
        <div className="w-full flex-1 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 flex flex-col font-sans box-border select-none p-4 transition-colors duration-200">

            {/* MAIN CONTENT AREA — CSS GRID ĐỒNG BỘ CHIỀU CAO TUYỆT ĐỐI */}
            <div className="flex-1 w-full gap-4 xl:gap-5 flex flex-col lg:grid lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.62fr_1fr] items-stretch min-h-0">

                {/* LEFT COLUMN: CAMERA WORKSPACE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 xl:p-5 shadow-sm dark:shadow-xl flex flex-col min-h-0 transition-colors duration-200">

                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <Video size={16} className="text-slate-500 dark:text-slate-400" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t[language].cameraHeader}</h3>
                        </div>
                        <button
                            onClick={handleCaptureAndRecognize}
                            disabled={isLoading}
                            className="bg-slate-900 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-slate-600/10 dark:shadow-lg dark:shadow-slate-950/50 active:scale-98 flex items-center gap-2 uppercase tracking-wide"
                            title={t[language].scanPlateTitle}
                        >
                            <Camera size={14} /> {t[language].btnScanPlate} <kbd className="bg-slate-600 dark:bg-slate-900 text-slate-100 dark:text-slate-200 px-1 rounded text-[9px] ml-1 font-mono font-normal">Enter</kbd>
                        </button>
                    </div>

                    {/* LIVE CAMERA CONTAINER */}
                    <div className="relative bg-slate-950 border border-slate-200 dark:border-slate-800 flex-1 min-h-[220px] sm:min-h-[300px] lg:min-h-0 flex items-center justify-center overflow-hidden transition-colors duration-200">
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
                                <p className="text-xs font-semibold">{t[language].webcamUnavailable}</p>
                            </div>
                        )}
                    </div>

                    {/* MANUAL SEARCH PANEL CONTROL */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0 transition-colors duration-200">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{t[language].manualEntryLabel}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t[language].placeholderPlate}
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                                    className="flex-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 tracking-wider focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal h-10"
                                />
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>
                        <div className="w-full sm:w-[140px] xl:w-[160px]">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{t[language].vehicleTypeLabel}</label>
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
                            className=" bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 hover:bg-slate-700 dark:text-slate-700 text-slate-200 px-5 py-2 rounded-lg text-xs font-bold h-10 transition-all border dark:border-slate-200 border-slate-700/50 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:border-slate-100 dark:disabled:border-slate-800 tracking-wide flex items-center justify-center gap-1.5 shrink-0 active:scale-98"
                        >
                            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> {t[language].btnQuery}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: RECONCILIATION RESULT CARD & INVOICE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 xl:p-5 flex flex-col justify-between shadow-sm dark:shadow-xl min-h-0 transition-colors duration-200">
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0 transition-colors duration-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t[language].entrySessionHeader}</h3>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 justify-start overflow-y-auto pr-1 space-y-4 class-scroll-em-di">
                            {scanResult ? (
                                <>
                                    {/* ẢNH SNAPSHOT INBOUND */}
                                    <div
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="bg-slate-100 dark:bg-slate-950 h-[130px] xl:h-[160px] 2xl:h-[200px] shrink-0 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm relative group cursor-zoom-in rounded-lg"
                                    >
                                        <img
                                            src={capturedImage || "https://placehold.co/600x400/0f172a/64748b?text=Snapshot+Inbound"}
                                            alt="Captured Gate Target Area"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                                        <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Maximize2 size={12} />
                                        </div>
                                    </div>

                                    {/* LOGIC ĐỔI MÀU Ô THÔNG TIN BIỂN SỐ VÀ CÁC KHỐI PHÍA DƯỚI */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Ô LICENSE PLATE */}
                                            <div className={`border rounded-lg px-3 py-2 transition-all duration-300 ${scanResult.isBooking
                                                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60"
                                                : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800"
                                                }`}>
                                                <span className={`text-[10px] font-bold uppercase block tracking-wider mb-0.5 ${scanResult.isBooking ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                                                    }`}>{t[language].licensePlate}</span>
                                                <span className={`text-base xl:text-lg font-bold font-mono ${scanResult.isBooking ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-100"
                                                    }`}>{scanResult.plate}</span>
                                            </div>

                                            {/* Ô TYPE VEHICLE */}
                                            <div className={`border rounded-lg px-3 py-2 transition-all duration-300 ${scanResult.isBooking
                                                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60"
                                                : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800"
                                                }`}>
                                                <span className={`text-[10px] font-bold uppercase block tracking-wider mb-0.5 ${scanResult.isBooking ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                                                    }`}>{t[language].type}</span>
                                                <span className={`text-base xl:text-lg font-bold font-mono truncate block ${scanResult.isBooking ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-100"
                                                    }`}>{scanResult.vehicleModel}</span>
                                            </div>
                                        </div>

                                        {/* HIỂN THỊ THÔNG TIN SLOT ĐỖ NẾU ĐÃ CONFIRMED */}
                                        {scanResult.type === "EntryConfirmed" && (
                                            <>
                                                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-800 p-4 text-white shadow-md">
                                                    <div className="space-y-1 text-center">
                                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-500">{t[language].assignedZone}</div>
                                                        <div className="font-mono text-yellow-400 text-2xl xl:text-3xl font-black ">
                                                            {scanResult.zone}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-3 text-xs">
                                                        <div className="flex items-center gap-1.5 font-medium text-white">
                                                            <MapPin size={13} className="text-white shrink-0" />
                                                            <span className="truncate">{scanResult.floor}</span>
                                                        </div>
                                                        <div className="text-right font-semibold text-slate-300 flex items-center justify-end gap-1.5">
                                                            <Clock size={13} className="text-white shrink-0" />
                                                            <span className="text-white px-1.5 py-0.5 rounded text-[11px]  ">
                                                                {scanResult.checkInTime}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ĐIỀU KIỆN RẼ NHÁNH: BOOKING THÌ HIỂN THỊ BADGE BOOKING - XE THƯỜNG THÌ HIỂN THỊ Ô TICKET CODE */}
                                                {scanResult.isBooking ? (
                                                    <div className="relative overflow-hidden rounded-lg bg-blue-600 dark:bg-blue-700 border border-blue-700 dark:border-blue-800 p-4 text-white shadow-md text-center animate-fadeIn">
                                                        <div className="flex items-center justify-center gap-2 font-black text-xs xl:text-sm uppercase tracking-wider">
                                                            <CheckCircle2 size={17} className="text-blue-100 animate-pulse" /> {t[language].bookedVehicle}
                                                        </div>
                                                        <p className="text-[10px] text-blue-100 mt-1.5 leading-relaxed">
                                                            {t[language].bookingNotice}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-800 p-4 text-white shadow-md">
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-500">
                                                                {t[language].ticketCodeLabel}
                                                            </div>
                                                            <div className="font-mono text-yellow-400 text-md xl:text-md font-black tracking-wider">
                                                                {scanResult.ticketCode}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center text-center p-5 text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-950/40 my-auto">
                                    <CarFront size={32} className="mb-2 opacity-40" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{t[language].readyToScan}</p>
                                    <p className="text-xs text-slate-400 mt-1.5 max-w-[200px]">
                                        {t[language].pressEnterToStart.replace("[Enter]", "")} <kbd className="bg-white border text-slate-700 px-1 py-0.5 rounded text-[10px] font-mono font-bold shadow-sm">[Enter]</kbd>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTION PANEL BOUNDARY TRIGGERS */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                        {scanResult ? (
                            <>
                                {scanResult.type === "ManualEntryPending" && (
                                    <>
                                        <button
                                            onClick={handleManualCheckInSubmit}
                                            className="w-full bg-blue-600 hover:bg-blue-400 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            {t[language].btnConfirm} <span className="font-mono font-normal opacity-70 text-[10px] ml-1">[Enter]</span>
                                        </button>
                                        <button
                                            onClick={resetTerminal}
                                            className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all"
                                        >
                                            {t[language].btnCancel} <span className="font-mono font-normal opacity-70 text-[10px] ml-1">[Esc]</span>
                                        </button>
                                    </>
                                )}

                                {scanResult.type === "EntryConfirmed" && (
                                    <button
                                        onClick={resetTerminal}
                                        className="w-full bg-slate-900 dark:bg-slate-600 hover:bg-slate-600 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                                    >
                                        {t[language].btnNextScan} <span className="font-mono font-normal opacity-80 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <button disabled className="w-full bg-slate-50 dark:bg-slate-950 text-slate-400 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 cursor-not-allowed text-center">
                                {t[language].systemReady}
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
                            <p className="font-mono font-bold tracking-widest text-sm text-yellow-500 dark:text-yellow-400">{plateNumber || t[language].noPlateDetected}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* EARLY CHECK-IN WARNING MODAL */}
            {earlyCheckInWarning && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl scaleUp transform transition-all duration-300 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white dark:text-white rounded-full flex items-center justify-center mb-4 mx-auto">
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="text-md font-black text-center text-slate-800 dark:text-slate-100 mb-2">
                            {t[language].earlyCheckInTitle}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed mb-6">
                            {earlyCheckInWarning.message}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEarlyCheckInWarning(null)}
                                className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all active:scale-98"
                            >
                                {t[language].btnCancel}
                            </button>
                            <button
                                onClick={() => handleConfirmEarlyCheckIn(earlyCheckInWarning.bodyData)}
                                className="flex-1 bg-blue-600 hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-98 shadow-md shadow-blue-500/10"
                            >
                                {t[language].btnAgree}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
