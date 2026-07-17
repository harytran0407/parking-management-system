import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import api from "../../utils/api";
import axios from "axios";
import {
    Camera, CarFront, Search, MapPin, CheckCircle2, RefreshCw,
    VideoOff, Ban, ParkingSquare, Hash, Clock, Calendar,
    Video, X, Maximize2, DollarSign, Ticket, Upload
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PYTHON_STREAM_URL = import.meta.env.VITE_PYTHON_STREAM_URL;

const getBackendRootUrl = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return baseUrl.replace("/api/v1", "");
};

const getFullImageUrl = (url) => {
    if (!url) return "";
    let cleanUrl = url.replace(/\\/g, "/");
    if (cleanUrl.startsWith("data:") || cleanUrl.startsWith("http:") || cleanUrl.startsWith("https:")) {
        return cleanUrl;
    }
    
    // Trích xuất đường dẫn tương đối nếu chứa thư mục uploads vật lý
    const uploadsIndex = cleanUrl.indexOf("uploads/");
    if (uploadsIndex !== -1) {
        cleanUrl = "/" + cleanUrl.substring(uploadsIndex);
    }

    const backendUrl = getBackendRootUrl();
    if (cleanUrl.startsWith("/")) {
        return `${backendUrl}${cleanUrl}`;
    }
    return `${backendUrl}/${cleanUrl}`;
};

const formatDuration = (totalMinutes, language = "vi") => {
    if (totalMinutes === undefined || totalMinutes === null) return "0 " + (language === "vi" ? "phút" : "mins");
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    
    let parts = [];
    if (language === "vi") {
        if (days > 0) parts.push(`${days} ngày`);
        if (hours > 0 || days > 0) parts.push(`${hours} giờ`);
        if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes} phút`);
        return parts.join(" ");
    } else {
        if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
        if (hours > 0 || days > 0) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
        if (minutes > 0 || (days === 0 && hours === 0)) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
        return parts.join(" ");
    }
};

const t = {
    vi: {
        cameraHeader: "Check-out Camera",
        btnScanPlate: "Xử lý ảnh",
        scanPlateTitle: "Nhấn Enter để xử lý ảnh đã chọn",
        webcamUnavailable: "Không khả dụng",
        manualPlateLabel: "Nhập biển số thủ công",
        placeholderPlate: "Nhập biển số xe...",
        btnSearch: "Tìm kiếm",
        ticketCodeLabel: "Mã vé",
        notRequiredLabel: "( Không bắt buộc )",
        placeholderTicket: "Nhập mã vé...",
        btnVerifyTicket: "Xác thực vé",
        exitSessionHeader: "Thông tin phiên ra",
        readyToScan: "Sẵn sàng quét",
        pressEnterToStart: "Kéo thả ảnh hoặc click để chọn ảnh xe.",
        cameraScanLabel: "Ảnh đã chọn",
        ticketPlateLabel: "Biển kiểm soát vé",
        ticketPlateErrorLabel: "Biển kiểm soát vé (Lỗi)",
        modeLabel: "Hình thức",
        modeBooking: "ĐẶT TRƯỚC",
        awaitingLabel: "Đang chờ...",
        securityAction: "Hành động an ninh",
        totalFee: "Tổng phí",
        bookingFee: "Phí đặt chỗ",
        durationLabel: "Thời lượng",
        btnConfirm: "Xác nhận",
        btnReset: "Đặt lại",
        btnCancel: "Hủy",
        systemReady: "Hệ thống sẵn sàng",
        noPlateDetected: "Không phát hiện biển số",
        motorbike: "Xe máy",
        car: "Ô tô",
        toastBookingRecognized: "Phát hiện lượt đặt trước! Biển số xe:",
        toastManualPlateEntered: "Đã nhập biển số thủ công: ",
        toastManualPlateEnteredSuffix: ". Vui lòng quét hoặc nhập Mã vé để xác thực.",
        toastPlateNotRegistered: "Không tìm thấy biển số xe.",
        toastWebcamError: "Không thể chụp ảnh từ Webcam. Vui lòng kiểm tra quyền thiết bị.",
        toastCameraAwaitingTicket: "Camera phát hiện: ",
        toastCameraAwaitingTicketSuffix: ". Vui lòng quét hoặc nhập Mã vé để xác thực.",
        toastCameraPlateNotRegistered: "Không tìm thấy biển số xe.",
        toastAiFailed: "Hệ thống AI không nhận diện được biển số từ ảnh chụp.",
        toastProcessingFailed: "Quy trình xử lý biển số thất bại.",
        toastScanFirst: "Vui lòng quét biển số xe trước khi xác thực vé!",
        toastVerificationSuccess: "Xác thực thành công: Biển kiểm soát khớp với thông tin gửi xe.",
        toastPlateMismatchPrefix: "Sai lệch biển kiểm soát: Camera phát hiện [",
        toastPlateMismatchMiddle: "], nhưng vé đăng ký [",
        toastPlateMismatchSuffix: "]. Vui lòng kiểm tra kỹ phương tiện trước khi cho ra.",
        toastTicketInvalid: "Mã vé không hợp lệ hoặc xe đã ra.",
        toastCheckoutSuccess: "Xe thành công ra khỏi bãi:",
        toastCheckoutFailed: "Không thể hoàn thành cho xe ra. Máy chủ trả về trạng thái chưa hoàn tất.",
        toastBackendRejected: "Yêu cầu cho xe ra bị từ chối bởi máy chủ.",
        floorLabel: "Tầng",
        vehicleLabel: "Phương tiện"
    },
    en: {
        cameraHeader: "Check-Out Camera",
        btnScanPlate: "Process Image",
        scanPlateTitle: "Press Enter to process selected image",
        webcamUnavailable: "Unavailable",
        manualPlateLabel: "Manual Entry",
        placeholderPlate: "Enter license plate...",
        btnSearch: "Search",
        ticketCodeLabel: "Ticket Code",
        placeholderTicket: "Enter ticket code...",
        btnVerifyTicket: "Verify Ticket",
        exitSessionHeader: "Exit Session Info",
        readyToScan: "Ready to Scan",
        pressEnterToStart: "Drag & drop or click to select vehicle image.",
        cameraScanLabel: "License Plate",
        ticketPlateLabel: "Ticket Plate",
        ticketPlateErrorLabel: "Ticket Plate (Error)",
        modeLabel: "Mode",
        modeBooking: "BOOKING",
        awaitingLabel: "Awaiting...",
        securityAction: "Security Action",
        totalFee: "Total Fee",
        bookingFee: "Booking Fee",
        durationLabel: "Duration",
        btnConfirm: "Confirm",
        btnReset: "Reset",
        btnCancel: "Cancel",
        systemReady: "System Ready",
        noPlateDetected: "No Plate Detected",
        motorbike: "Motorbike",
        car: "Car",
        toastBookingRecognized: "Booking Recognized! License Plate:",
        toastManualPlateEntered: "Manual plate entered: ",
        toastManualPlateEnteredSuffix: ". Please scan or enter Ticket Code to verify.",
        toastPlateNotRegistered: "License plate not found.",
        toastWebcamError: "Cannot capture image from Webcam. Please check device permissions.",
        toastCameraAwaitingTicket: "Camera detected: ",
        toastCameraAwaitingTicketSuffix: ". Please scan or enter Ticket Code to verify.",
        toastCameraPlateNotRegistered: "License plate not found.",
        toastAiFailed: "AI system failed to recognize license plate from snapshot.",
        toastProcessingFailed: "License plate processing workflow failed.",
        toastScanFirst: "Please scan camera plate first before verifying the ticket!",
        toastVerificationSuccess: "Verification Successful: License plate matches the parking record.",
        toastPlateMismatchPrefix: "License Plate Mismatch: Camera detected [",
        toastPlateMismatchMiddle: "], but the parking record shows [",
        toastPlateMismatchSuffix: "]. Please verify the vehicle before proceeding.",
        toastTicketInvalid: "Ticket Code is invalid or already checked out.",
        toastCheckoutSuccess: "Vehicle successfully checked out:",
        toastCheckoutFailed: "Unable to complete vehicle exit. Server returned uncompleted status.",
        toastBackendRejected: "Backend validation rejected this checkout request.",
        floorLabel: "Floor",
        vehicleLabel: "Vehicle"
    }
};

export default function CheckOutPage() {
    const { language } = useLanguage();
    const fileInputRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [plateNumber, setPlateNumber] = useState("");
    const [manualInput, setManualInput] = useState("");
    const [ticketCodeInput, setTicketCodeInput] = useState("");
    const [selectedVehicleType, setSelectedVehicleType] = useState(1);
    const [scanResult, setScanResult] = useState(null);
    const [session, setSession] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [scanStatus, setScanStatus] = useState("idle");
    const [showStatusOverlay, setShowStatusOverlay] = useState(false);

    const [lightboxImage, setLightboxImage] = useState(null);

    const [pendingCameraPlate, setPendingCameraPlate] = useState("");
    const [isPlateMatched, setIsPlateMatched] = useState(false);

    const [activeBookingId, setActiveBookingId] = useState(null);
    const isTicketMissing = pendingCameraPlate && !activeBookingId && !ticketCodeInput;

    const vehicleTypes = [
        { id: 1, name: t[language].motorbike },
        { id: 2, name: t[language].car }
    ];

    const getOpConfig = () => ({
        camOut: localStorage.getItem("camera_out_id") || "cam_out_02",
        gateOut: localStorage.getItem("gate_out_id") || "gate_out_02",
    });

    const fetchActiveSession = async (targetPlate) => {
        try {
            const formattedPlate = targetPlate.toUpperCase().trim();
            const response = await api.get(`/parking/sessions/active/${formattedPlate}?exact=true`);
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
        const zoneName = activeSession.zone_name || activeSession.zoneName || activeSession.slot_name || activeSession.slotName;
        const checkInTime = activeSession.check_in_time || activeSession.checkInTime;
        const durationMinutes = activeSession.duration_minutes || activeSession.durationMinutes;
        const currentFee = activeSession.current_fee !== undefined ? activeSession.current_fee : activeSession.currentFee;
        const vehicleTypeId = activeSession.vehicle_type_id || activeSession.vehicleTypeId;

        setScanResult({
            type: customType,
            sessionId: sessionId,
            plate: displayPlate || licensePlateIn || "N/A",
            slot: zoneName ? `Zone ${zoneName}` : "N/A",
            floor: activeSession.floor !== undefined ? `${t[language].floorLabel} ${activeSession.floor}` : "N/A",
            zone: zoneName || "Unassigned Zone",
            timeIn: checkInTime ? new Date(checkInTime).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "N/A",
            duration: formatDuration(durationMinutes, language),
            price: currentFee || 0,
            vehicleModel: vehicleTypes.find(v => v.id === (vehicleTypeId || selectedVehicleType))?.name || t[language].vehicleLabel,
            imageUrlIn: activeSession.image_url_in || activeSession.imageUrlIn
        });
        setSession(activeSession);
    };


    const handleManualSearchSubmit = async () => {
        if (!manualInput || isLoading) return;

        setIsLoading(true);
        setScanStatus("idle");
        setShowStatusOverlay(false);
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
            setSession(activeSession);

            const bookingId = activeSession.booking_id || activeSession.bookingId;

            if (bookingId) {
                // LUỒNG XE ĐẶT TRƯỚC (BOOKING)
                setActiveBookingId(bookingId);
                setIsPlateMatched(true);
                populateScanResult(activeSession, formattedPlate, "ExitPending");
                toast.success(`${t[language].toastBookingRecognized} ${formattedPlate}`);
            } else {
                // LUỒNG XE VÃNG LAI
                setScanResult({
                    type: "AwaitingVerification",
                    plate: formattedPlate,
                    slot: "Awaiting Ticket...",
                    floor: "N/A",
                    zone: "N/A",
                    timeIn: "Awaiting Ticket...",
                    duration: formatDuration(0, language),
                    price: 0,
                    vehicleModel: "Checking..."
                });
                toast.info(`${t[language].toastManualPlateEntered}${formattedPlate}${t[language].toastManualPlateEnteredSuffix}`);
            }
            setScanStatus("success");
            setShowStatusOverlay(true);
            setTimeout(() => setShowStatusOverlay(false), 2000);
        } else {
            toast.error(`${t[language].toastPlateNotRegistered} [${formattedPlate}]`);
            setScanStatus("error");
            setShowStatusOverlay(true);
            setTimeout(() => setShowStatusOverlay(false), 2500);
        }
        setIsLoading(false);
    };

    const handleCaptureAndRecognize = useCallback(async (base64Image = null) => {
        const imageSrc = base64Image || capturedImage;
        if (!imageSrc) {
            toast.error(language === "vi" ? "Vui lòng chọn hoặc kéo thả ảnh xe trước!" : "Please select or drag & drop a vehicle image first!");
            return;
        }

        setIsLoading(true);
        setScanStatus("idle");
        setShowStatusOverlay(false);
        toast.dismiss();
        setScanResult(null);
        setTicketCodeInput("");
        setPendingCameraPlate("");
        setIsPlateMatched(false);
        setActiveBookingId(null);
        setCapturedImage(imageSrc);

        try {
            const aiResponse = await api.post(`${PYTHON_STREAM_URL}/recognize_uploaded_image`, {
                image: imageSrc
            });

            if (!aiResponse.data || !aiResponse.data.success) {
                throw new Error(aiResponse.data?.message || t[language].toastAiFailed);
            }

            const aiPlate = aiResponse.data.plate.toUpperCase().trim();
            const croppedImg = aiResponse.data.cropped_image || imageSrc;

            setCapturedImage(imageSrc);
            setCroppedImage(croppedImg);
            setPlateNumber(aiPlate);

            const activeSession = await fetchActiveSession(aiPlate);

            if (activeSession) {
                setPendingCameraPlate(aiPlate);
                setSession(activeSession);

                const bookingId = activeSession.booking_id || activeSession.bookingId;

                if (bookingId) {
                    // LUỒNG XE ĐẶT TRƯỚC (BOOKING)
                    setActiveBookingId(bookingId);
                    setIsPlateMatched(true);
                    populateScanResult(activeSession, aiPlate, "ExitPending");
                    toast.success(`${t[language].toastBookingRecognized} ${aiPlate} / ${bookingId}`);
                } else {
                    // LUỒNG XE VÃNG LAI
                    setScanResult({
                        type: "AwaitingVerification",
                        plate: aiPlate,
                        slot: "Awaiting Ticket...",
                        floor: "N/A",
                        zone: "N/A",
                        timeIn: "Awaiting Ticket...",
                        duration: formatDuration(0, language),
                        price: 0,
                        vehicleModel: "Checking..."
                    });
                    toast.info(`${t[language].toastCameraAwaitingTicket}${aiPlate}${t[language].toastCameraAwaitingTicketSuffix}`);
                }
                setScanStatus("success");
                setShowStatusOverlay(true);
                setTimeout(() => setShowStatusOverlay(false), 2000);
            } else {
                toast.error(`${t[language].toastCameraPlateNotRegistered} [${aiPlate}]`);
                setScanStatus("error");
                setShowStatusOverlay(true);
                setTimeout(() => setShowStatusOverlay(false), 2500);
            }

        } catch (error) {
            console.error("Pipeline Error:", error);
            const errorMsg = error.message || error.response?.data?.message || t[language].toastProcessingFailed;
            toast.error(errorMsg);
            setScanStatus("error");
            setShowStatusOverlay(true);
            setTimeout(() => setShowStatusOverlay(false), 2500);
        } finally {
            setIsLoading(false);
        }
    }, [capturedImage, language]);

    const handleImageUpload = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error(language === "vi" ? "Vui lòng chọn tệp hình ảnh hợp lệ!" : "Please select a valid image file!");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            setCapturedImage(base64);
            handleCaptureAndRecognize(base64);
        };
        reader.readAsDataURL(file);
    };

    const triggerScanOrUpload = () => {
        if (capturedImage) {
            handleCaptureAndRecognize(capturedImage);
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleTicketSearchSubmit = async () => {
        if (!ticketCodeInput || isLoading) return;
        if (!pendingCameraPlate) {
            toast.warning(t[language].toastScanFirst);
            return;
        }

        setIsLoading(true);
        setScanStatus("idle");
        setShowStatusOverlay(false);
        toast.dismiss();

        const formattedTicket = ticketCodeInput.toUpperCase().trim();
        const activeSession = await fetchSessionByTicketCode(formattedTicket);

        if (activeSession) {
            setSession(activeSession);
            const originalPlate = (activeSession.license_plate_in || activeSession.licensePlateIn || "").toUpperCase().trim();

            if (pendingCameraPlate === originalPlate) {
                setIsPlateMatched(true);
                populateScanResult(activeSession, pendingCameraPlate, "ExitPending");
                toast.success(t[language].toastVerificationSuccess);
                setScanStatus("success");
                setShowStatusOverlay(true);
                setTimeout(() => setShowStatusOverlay(false), 2000);
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
                    vehicleModel: "Mismatch",
                    imageUrlIn: activeSession.image_url_in || activeSession.imageUrlIn
                });
                toast.error(`${t[language].toastPlateMismatchPrefix}${pendingCameraPlate}${t[language].toastPlateMismatchMiddle}${originalPlate}${t[language].toastPlateMismatchSuffix}`);
                setScanStatus("error");
                setShowStatusOverlay(true);
                setTimeout(() => setShowStatusOverlay(false), 2500);
            }
        } else {
            toast.error(`${t[language].toastTicketInvalid} [${formattedTicket}]`);
            setScanStatus("error");
            setShowStatusOverlay(true);
            setTimeout(() => setShowStatusOverlay(false), 2500);
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
                image_url_out: croppedImage || capturedImage,
            };
            const response = await api.post(`/parking/check-out`, bodyData);
            if (
                response.status === 200 ||
                response.status === 201 ||
                response.data?.success === true ||
                response.data?.status === "COMPLETED" ||
                response.data?.payment_status === "PAID"
            ) {
                toast.success(`${t[language].toastCheckoutSuccess} [${bodyData.license_plate_out}]`);
                resetTerminal(true);
            } else {
                throw new Error(t[language].toastCheckoutFailed);
            }
        } catch (error) {
            const backendMessage = error.message || error.response?.data?.message || error.response?.data?.Message || error.response?.data || error;
            toast.error(typeof backendMessage === "string" ? backendMessage : t[language].toastBackendRejected);
        } finally {
            setIsLoading(false);
        }
    };

    const resetTerminal = (keepSuccessToast = false) => {
        setManualInput("");
        setTicketCodeInput("");
        setScanResult(null);
        setSession(null);
        setPendingCameraPlate("");
        setIsPlateMatched(false);
        setPlateNumber("");
        setCapturedImage(null);
        setCroppedImage(null);
        setActiveBookingId(null);
        setScanStatus("idle");
        setShowStatusOverlay(false);
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
                    triggerScanOrUpload();
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
    }, [scanResult, triggerScanOrUpload, manualInput, ticketCodeInput, plateNumber, isPlateMatched, pendingCameraPlate, activeBookingId, language]);

    return (
        <div className="w-full flex-1 text-slate-800 dark:text-slate-100 flex flex-col font-sans box-border select-none transition-colors duration-200">

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
                            onClick={triggerScanOrUpload}
                            disabled={isLoading}
                            className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold text-xs px-4 py-2.5 rounded-md transition-all shadow-md shadow-slate-600/10 dark:shadow-lg dark:shadow-slate-950/50 active:scale-98 flex items-center gap-2 uppercase tracking-wide"
                            title={t[language].scanPlateTitle}
                        >
                            <Camera size={14} /> {t[language].btnScanPlate} <kbd className=" text-white  px-1 rounded text-[9px] ml-1 font-sans font-normal">[Enter]</kbd>
                        </button>
                    </div>

                    {/* DROPZONE IMAGE UPLOADER */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleImageUpload(e.dataTransfer.files[0]);
                            }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed flex-1 min-h-[220px] sm:min-h-[300px] lg:min-h-0 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 rounded-md ${
                            isDragOver
                                ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/20"
                                : isLoading
                                ? "border-blue-500 bg-blue-50/5 dark:bg-blue-950/5 shadow-md shadow-blue-500/10"
                                : scanStatus === "success"
                                ? "border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-md shadow-emerald-500/10"
                                : scanStatus === "error"
                                ? "border-rose-500 bg-rose-50/5 dark:bg-rose-950/5 shadow-md shadow-rose-500/10"
                                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900"
                        }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleImageUpload(e.target.files[0]);
                                }
                            }}
                            accept="image/*"
                            className="hidden"
                        />

                        {capturedImage ? (
                            <div className="relative w-full h-full group flex items-center justify-center bg-slate-950">
                                <img
                                    src={capturedImage}
                                    alt="Uploaded Vehicle"
                                    className="max-w-full max-h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="bg-white/90 hover:bg-white text-slate-800 font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1"
                                    >
                                        <Camera size={13} />
                                        {language === "vi" ? "Chọn ảnh khác" : "Change Image"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCapturedImage(null);
                                            setCroppedImage(null);
                                            setScanResult(null);
                                            setPendingCameraPlate("");
                                            setPlateNumber("");
                                            setScanStatus("idle");
                                            setShowStatusOverlay(false);
                                        }}
                                        className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1"
                                    >
                                        <X size={13} />
                                        {language === "vi" ? "Xóa" : "Clear"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Upload size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {language === "vi" ? "Kéo thả ảnh check-out vào đây" : "Drag & drop check-out image here"}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        {language === "vi" ? "hoặc click để chọn tệp tin" : "or click to browse file"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Status overlays */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                                <p className="text-sm font-bold tracking-wide">
                                    {language === "vi" ? "Đang xử lý hình ảnh..." : "Processing image..."}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {language === "vi" ? "Nhận diện biển số & loại xe..." : "Recognizing plate & vehicle type..."}
                                </p>
                            </div>
                        )}

                        {scanStatus === "success" && showStatusOverlay && (
                            <div className="absolute inset-0 bg-emerald-950/85 dark:bg-emerald-950/90 backdrop-blur-[1px] z-30 flex flex-col items-center justify-center text-emerald-400 transition-opacity duration-200">
                                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30 animate-bounce">
                                    <CheckCircle2 size={32} />
                                </div>
                                <p className="text-sm font-black uppercase tracking-wider text-emerald-400">
                                    {language === "vi" ? "Xử lý thành công!" : "Success!"}
                                </p>
                                {plateNumber && (
                                    <p className="text-xs text-emerald-200 mt-1 font-mono font-bold tracking-widest bg-emerald-900/50 px-2 py-0.5 rounded">
                                        {plateNumber}
                                    </p>
                                )}
                            </div>
                        )}

                        {scanStatus === "error" && showStatusOverlay && (
                            <div className="absolute inset-0 bg-rose-950/85 dark:bg-rose-950/90 backdrop-blur-[1px] z-30 flex flex-col items-center justify-center text-rose-400 transition-opacity duration-200">
                                <div className="w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center mb-3 shadow-lg shadow-rose-600/30 animate-pulse">
                                    <X size={32} />
                                </div>
                                <p className="text-sm font-black uppercase tracking-wider text-rose-400">
                                    {language === "vi" ? "Xử lý thất bại" : "Failed"}
                                </p>
                                <p className="text-xs text-rose-300 mt-1 text-center px-4 max-w-[250px]">
                                    {language === "vi" ? "Không thể xử lý xe. Vui lòng thử lại!" : "Unable to process. Please try again!"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* MANUAL PANEL: BIỂN SỐ & MÃ VÉ HAI BÊN SONG SONG */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4 shrink-0 transition-colors duration-200">

                        {/* NHẬP BIỂN SỐ THỦ CÔNG */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{t[language].manualPlateLabel}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t[language].placeholderPlate}
                                        value={manualInput}
                                        onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                                        className="flex-1 w-full border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 tracking-wider focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal h-10"
                                    />
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                </div>
                            </div>
                            <button
                                onClick={handleManualSearchSubmit}
                                disabled={isLoading || !manualInput}
                                className="bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 hover:bg-blue-500 text-white px-4 h-10 rounded-md text-xs font-bold transition-all disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 tracking-wide flex items-center justify-center gap-1 shrink-0 active:scale-98"
                            >
                                <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> {t[language].btnSearch}
                            </button>
                        </div>

                        {/* NHẬP/QUÉT MÃ VÉ ĐỐI CHIẾU */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 flex justify-between items-center ${isTicketMissing ? "text-rose-500" : "text-slate-500 dark:text-slate-400"}`}>
                                    <span>{t[language].ticketCodeLabel}</span>
                                    {activeBookingId && <span className="text-emerald-500 text-[9px] lowercase font-normal">{t[language].notRequiredLabel}</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t[language].placeholderTicket}
                                        value={ticketCodeInput}
                                        onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
                                        disabled={!pendingCameraPlate || !!activeBookingId}
                                        className={`w-full border rounded-md pl-9 pr-3 py-2 text-xs font-sans font-bold bg-slate-50 dark:bg-slate-950 tracking-wider focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal h-10 disabled:opacity-60 disabled:cursor-not-allowed ${isTicketMissing
                                            ? "border-rose-500 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:border-rose-600 dark:focus:border-rose-500"
                                            : "border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:border-slate-400 dark:focus:border-slate-700 focus:bg-white"
                                            }`}
                                    />
                                    <Ticket size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isTicketMissing ? "text-rose-500" : "text-slate-400 dark:text-slate-500"}`} />
                                </div>
                            </div>
                            <button
                                onClick={handleTicketSearchSubmit}
                                disabled={isLoading || !ticketCodeInput || !pendingCameraPlate || !!activeBookingId}
                                className="bg-blue-600 dark:bg-blue-600 dark:hover:bg-white hover:bg-blue-500 dark:text-white text-slate-200 px-4 h-10 rounded-md text-xs font-bold transition-all  disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:border-slate-100 dark:disabled:border-slate-800 tracking-wide flex items-center justify-center gap-1 shrink-0 active:scale-98"
                            >
                                <Search size={12} /> {t[language].btnVerifyTicket}
                            </button>
                        </div>

                    </div>
                </div>

                {/* RIGHT COLUMN: RECONCILIATION RESULT CARD & INVOICE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 xl:p-5 flex flex-col justify-between shadow-sm dark:shadow-xl min-h-0 transition-colors duration-200">
                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0 transition-colors duration-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t[language].exitSessionHeader}</h3>
                        </div>

                        {/* Vùng nội dung kết quả */}
                        <div className="flex-1 flex flex-col min-h-0 justify-start overflow-y-auto pr-1 space-y-4 class-scroll-em-di">
                            {scanResult ? (
                                <>
                                    {/* ẢNH SNAPSHOT COMPARISON */}
                                    <div className="flex flex-col gap-3 shrink-0">
                                        {/* Ảnh check-in */}
                                        <div
                                            onClick={() => {
                                                if (session && session.image_url_in) {
                                                    setLightboxImage(getFullImageUrl(session.image_url_in));
                                                }
                                            }}
                                            className="bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-md transition-colors duration-200 h-auto"
                                            title="Click to zoom check-in snapshot"
                                        >
                                            <img
                                                src={session.image_url_in ? getFullImageUrl(session.image_url_in) : "https://placehold.co/600x400/0f172a/64748b?text=No+Checkin+Image"}
                                                alt="Check-in snapshot"
                                                className="w-full h-auto max-h-[130px] object-contain transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                                                style={{ imageRendering: 'pixelated' }}
                                            />
                                            <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{language === "vi" ? "Ảnh check-in" : "Check-in Image"}</div>
                                            <div className="absolute bottom-1.5 right-1.5 bg-white/90 dark:bg-slate-900/90 rounded p-1 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                                <Maximize2 size={10} />
                                            </div>
                                        </div>

                                        {/* Ảnh check-out */}
                                        <div
                                            onClick={() => {
                                                const imgUrl = croppedImage || capturedImage;
                                                if (imgUrl) {
                                                    setLightboxImage(imgUrl);
                                                }
                                            }}
                                            className="bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-md transition-colors duration-200 h-auto"
                                            title="Click to zoom check-out snapshot"
                                        >
                                            <img
                                                src={croppedImage || capturedImage || "https://placehold.co/600x400/0f172a/64748b?text=Snapshot+Outbound"}
                                                alt="Captured Gate Target Area"
                                                className="w-full h-auto max-h-[130px] object-contain transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                                                style={{ imageRendering: 'pixelated' }}
                                            />
                                            <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{language === "vi" ? "Ảnh check-out" : "Check-out Image"}</div>
                                            <div className="absolute bottom-1.5 right-1.5 bg-white/90 dark:bg-slate-900/90 rounded p-1 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                                <Maximize2 size={10} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* THÔNG TIN SO SÁNH BIỂN SỐ */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-600 dark:border-slate-300 rounded-md px-3 py-2 transition-colors duration-200">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-0.5">{t[language].cameraScanLabel}</span>
                                            <span className="text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 ">{pendingCameraPlate || t[language].awaitingLabel}</span>
                                        </div>

                                        <div className={`border rounded-md px-3 py-2 transition-colors duration-200 ${scanResult.type === "MismatchBlock"
                                            ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900"
                                            : activeBookingId
                                                ? "bg-blue-100 border-blue-200 dark:bg-blue-950/100 dark:border-blue-900/60"
                                                : "bg-slate-50 dark:bg-slate-950 border-slate-600 dark:border-slate-300"
                                            }`}>
                                            <span className={`text-[10px] font-bold uppercase block tracking-wider mb-0.5 ${scanResult.type === "MismatchBlock"
                                                ? "text-rose-400 dark:text-rose-500"
                                                : activeBookingId
                                                    ? "text-blue-500 dark:text-blue-400"
                                                    : "text-slate-400 dark:text-slate-500"
                                                }`}>
                                                {scanResult.type === "MismatchBlock" ? t[language].ticketPlateErrorLabel : activeBookingId ? t[language].modeLabel : t[language].ticketPlateLabel}
                                            </span>
                                            <span className={`text-base xl:text-lg font-bold font-sans truncate block ${scanResult.type === "MismatchBlock"
                                                ? "text-rose-600 dark:text-rose-400"
                                                : activeBookingId
                                                    ? "text-blue-600 dark:text-blue-400"
                                                    : "text-slate-800 dark:text-slate-200"
                                                }`}>
                                                {scanResult.type === "AwaitingVerification" ? "" : activeBookingId ? t[language].modeBooking : scanResult.plate}
                                            </span>
                                        </div>
                                    </div>

                                    {/* BANNER TÍNH TIỀN KHI ĐÃ KHỚP HOẶC HIỂN THỊ LỖI KHI BỊ CHẶN */}
                                    <div className={`relative overflow-hidden rounded-md p-4 border transition-colors duration-200 ${scanResult.type === "MismatchBlock"
                                        ? "bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-100"
                                        : "bg-slate-50 dark:bg-slate-950 border-slate-600 dark:border-slate-300 text-slate-800 dark:text-slate-100"
                                        }`}>
                                        <div className="space-y-1 text-center">
                                            <div className={`text-[10px] font-bold uppercase tracking-wider ${scanResult.type === "MismatchBlock" ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                                                }`}>
                                                {scanResult.type === "MismatchBlock" ? t[language].securityAction : activeBookingId ? t[language].bookingFee : t[language].totalFee}
                                            </div>
                                            <div className={`font-sans text-2xl xl:text-3xl font-black tracking-wider ${scanResult.type === "MismatchBlock" ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100"
                                                }`}>
                                                {scanResult.type === "MismatchBlock" ? "BLOCKED" : `${scanResult.price.toLocaleString("vi-VN")} VND`}
                                            </div>
                                        </div>

                                        {/* LOGISTIC TIMELINE INFO PANEL */}
                                        <div className={`mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs ${scanResult.type === "MismatchBlock" ? "border-rose-200 dark:border-rose-800" : "border-slate-200 dark:border-slate-700"
                                            }`}>
                                            <div className={`flex items-center gap-1.5 font-medium ${scanResult.type === "MismatchBlock" ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100"
                                                }`}>
                                                <Clock size={13} className={`shrink-0 ${scanResult.type === "MismatchBlock" ? "text-rose-400 dark:text-rose-500" : "text-slate-500 dark:text-slate-400"
                                                    }`} />
                                                <span className="truncate">{scanResult.timeIn}</span>
                                            </div>
                                            <div className={`text-right font-semibold flex items-center justify-end gap-1 ${scanResult.type === "MismatchBlock" ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100"
                                                }`}>
                                                {t[language].durationLabel}:
                                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-sans font-bold ml-1 border ${scanResult.type === "MismatchBlock"
                                                    ? "bg-rose-100/50 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200"
                                                    : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                                                    }`}>
                                                    {scanResult.duration}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* IDLE EMPTY PLACEHOLDER */
                                <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-md flex flex-col items-center justify-center text-center p-5 text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-950/40 my-auto transition-colors duration-200">
                                    <CarFront size={32} className="mb-2 opacity-40 text-slate-400" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{t[language].readyToScan}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[200px] leading-normal">
                                        {t[language].pressEnterToStart}
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
                                        className="w-full bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500 text-white py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-all active:scale-98 shadow-md shadow-blue-600/10 dark:shadow-lg dark:shadow-blue-950/30"
                                    >
                                        {t[language].btnConfirm} <span className="font-sans font-normal opacity-70 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                                {scanResult.type === "MismatchBlock" && (
                                    <button
                                        onClick={resetTerminal}
                                        className="w-full bg-rose-700 hover:bg-rose-600 text-white py-2.5 rounded-md text-xs font-black uppercase tracking-widest text-center shadow-md active:scale-98 animate-pulse"
                                    >
                                        {t[language].btnReset} <span className="font-sans font-normal opacity-70 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                                {scanResult.type === "AwaitingVerification" && (
                                    <button
                                        onClick={handleTicketSearchSubmit}
                                        disabled={isLoading || !ticketCodeInput}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-all active:scale-98 shadow-md"
                                    >
                                        {t[language].btnConfirm} <span className="font-sans font-normal opacity-70 text-[10px] ml-1">[Enter]</span>
                                    </button>
                                )}
                                <button
                                    onClick={resetTerminal}
                                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all active:scale-98 shadow-sm"
                                >
                                    {t[language].btnCancel} <span className="font-sans font-normal opacity-70 text-[10px] ml-1">[Esc]</span>
                                </button>
                            </>
                        ) : (
                            <button disabled className="w-full bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 cursor-not-allowed text-center transition-colors duration-200">
                                {t[language].systemReady}
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* LIGHTBOX MODAL OVERLAY */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="absolute top-5 right-5 text-slate-500 hover:text-slate-200 dark:text-slate-400 dark:hover:text-white bg-white/10 dark:bg-slate-900/60 p-2 rounded-full border border-slate-300 dark:border-slate-800 transition-colors">
                        <X size={20} />
                    </div>
                    <div className="relative w-full max-w-[95vw] md:max-w-6xl max-h-[92vh] rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <img src={lightboxImage} alt="High Resolution Audit" className="w-full h-auto max-h-[85vh] md:max-h-[88vh] object-contain" />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 dark:bg-slate-950/80 p-3 text-center border-t border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                            <p className="font-sans font-bold tracking-widest text-sm text-yellow-500 dark:text-yellow-400">{plateNumber || t[language].noPlateDetected}</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
