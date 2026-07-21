import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
    FileQuestion, ScanFace, Clock, ClipboardList,
    Search, CarFront, Sliders, Trash2, Info,
    Star, Paperclip, AlertCircle, CheckCircle, Phone, Mail, Ticket, CarFrontIcon, MessageSquare,
    X, Maximize2, Upload
} from 'lucide-react';
import { toast } from "sonner";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";

const t = {
    vi: {
        tabLostTicket: "Mất vé",
        tabLostTicketSub: "Tính phí phạt & kết thúc phiên đỗ",
        tabOcrMismatch: "Sai biển số",
        tabOcrMismatchSub: "Tìm theo biển số nhận diện sai & sửa lại",
        tabUserReported: "Phản hồi của tài xế",
        tabUserReportedSub: "Trả lời & giải quyết phản ánh",
        placeholderSearchReports: "Tìm kiếm báo cáo...",
        allStatuses: "Tất cả trạng thái",
        statusOpen: "Chờ xử lý",
        statusResolved: "Đã giải quyết",
        btnSearch: "Tìm kiếm",
        loadingReports: "Đang tải danh sách phản ánh...",
        noIncidents: "Không tìm thấy báo cáo sự cố nào",
        noIncidentsSub: "Không có sự cố nào khớp với bộ lọc hiện tại.",
        reportDetails: "Chi tiết sự cố",
        reporterLabel: "Người báo cáo",
        noPhone: "Không có số điện thoại",
        noEmail: "Không có email",
        issueTypeLabel: "Loại sự cố",
        expRatingLabel: "Đánh giá trải nghiệm",
        subjectLabel: "Chủ đề",
        descLabel: "Mô tả",
        noDesc: "Không có mô tả chi tiết.",
        viewAttachment: "Xem tệp đính kèm",
        feedbackLabel: "Phản hồi giải quyết",
        feedbackPlaceholder: "Nhập hướng xử lý hoặc phản hồi cho người dùng...",
        btnResolve: "Giải quyết & Gửi phản hồi",
        processing: "Đang xử lý...",
        resolvedNoFeedback: "Đã giải quyết không có phản hồi thêm.",
        noIncidentSelected: "Chưa chọn sự cố.",
        noIncidentSelectedSub: "Vui lòng chọn một sự cố từ danh sách bên trái để xem đầy đủ chi tiết, thông tin liên hệ và giải quyết.",
        searchTitleLost: "Tìm phiên hoạt động theo Biển kiểm soát",
        searchTitleOcr: "Tìm phiên hoạt động theo Biển số nhận diện sai",
        btnClearForm: "Xóa biểu mẫu",
        placeholderSlotInput: "Nhập tên ô đỗ (vd: A101, B205)...",
        placeholderPlateInput: "Nhập biển kiểm soát xe...",
        btnFindSession: "Tìm phiên đỗ",
        mustFindSessionAlert: "Bạn phải nhập thông tin và nhấn \"Tìm phiên đỗ\" ở trên trước khi xác nhận.",
        lostTicketReportTitle: "Báo cáo Mất vé xe",
        correctPlateTitle: "Sửa lại biển kiểm soát",
        lostPlateLabel: "Biển kiểm soát",
        staffNotesLabel: "Ghi chú của nhân viên",
        correctedPlateLabel: "Biển kiểm soát đúng",
        btnConfirmSystem: "Xác nhận & Cập nhật hệ thống",
        outputTitle: "Kết quả đầu ra",
        incidentLogTitle: "Nhật ký xử lý sự cố",
        typeLabel: "Loại:",
        timeLabel: "Thời gian:",
        parkingFeeLabel: "Phí đỗ xe:",
        penaltyFineLabel: "Phí phạt mất vé:",
        totalDue: "TỔNG THU:",
        wrongOcrLabel: "Nhận diện sai",
        correctedToLabel: "Sửa lại thành",
        updatedSlotLabel: "Ô đỗ cập nhật:",
        reasonLabel: "Lý do:",
        btnNextIssue: "Xử lý sự cố tiếp theo",
        awaitingAction: "Đang chờ hành động.",
        awaitingActionLostSub: "Biên lai chi tiết và bảng kê thanh toán sẽ xuất hiện ở đây.",
        awaitingActionOcrSub: "Thông tin nhật ký chi tiết và lịch sử cập nhật hệ thống sẽ xuất hiện ở đây.",
        currentSystemData: "Dữ liệu hệ thống hiện tại",
        parkingSlotLabel: "Ô đỗ xe:",
        zoneLabel: "Phân khu:",
        licensePlate: "Biển kiểm soát xe:",
        checkInTimeLabel: "Thời gian vào:",
        durationLabel: "Thời lượng:",
        currentFeeLabel: "Phí hiện tại:",
        entryImageLabel: "Ảnh check-in",
        toastEnterSearch: "Vui lòng nhập từ khóa tìm kiếm!",
        toastSessionFound: "Tìm thấy phiên đỗ xe đang hoạt động!",
        toastSlotEmpty: "Ô đỗ này hiện đang trống hoặc không có phiên đỗ hoạt động.",
        toastNoSessionPlate: "Không tìm thấy biển số xe.",
        toastSearchFailed: "Tìm kiếm thất bại. Vui lòng thử lại.",
        toastResolveSuccess: "Đã xử lý sự cố thành công!",
        toastResolveFailed: "Không thể giải quyết sự cố.",
        toastInputFeedback: "Vui lòng nhập phản hồi giải quyết sự cố!",
        toastIncidentUpdated: "Sự cố đã được giải quyết và cập nhật thành công!",
        toastActionDenied: "Hành động bị từ chối. Vui lòng kiểm tra lại tham số.",
        toastLoadIncidentsFailed: "Không thể tải danh sách phản ánh.",
        lostReasonDefault: "Khách báo mất vé xe",
        ocrReasonDefault: "Nhận diện OCR nhầm chữ cái",
        unknownLabel: "Không rõ",
        systemUser: "Người dùng hệ thống",
        unassigned: "Chưa phân",
        mins: "phút",
        hours: "giờ",
    },
    en: {
        tabLostTicket: " Lost Ticket",
        tabLostTicketSub: "Calculate penalty & close session",
        tabOcrMismatch: "Plate Mismatch",
        tabOcrMismatchSub: "Find by misread plate & correct it",
        tabUserReported: "User Issues",
        tabUserReportedSub: "Respond & resolve user reports",
        placeholderSearchReports: "Search reports...",
        allStatuses: "All Statuses",
        statusOpen: "Open",
        statusResolved: "Resolved",
        btnSearch: "Search",
        loadingReports: "Loading user reports...",
        noIncidents: "No incident reports found",
        noIncidentsSub: "There are no current reports matching this filter.",
        reportDetails: "Report Details",
        reporterLabel: "Reporter",
        noPhone: "No phone number",
        noEmail: "No email",
        issueTypeLabel: "Issue Type",
        expRatingLabel: "Experience Rating",
        subjectLabel: "Subject",
        descLabel: "Description",
        noDesc: "No description provided.",
        viewAttachment: "View Attachment File",
        feedbackLabel: "Resolution Feedback",
        feedbackPlaceholder: "Type resolution reply or instructions for the user...",
        btnResolve: "Resolve Ticket & Notify",
        processing: "Processing...",
        resolvedNoFeedback: "Resolved without additional feedback.",
        noIncidentSelected: "No Incident Selected.",
        noIncidentSelectedSub: "Select an incident from the list on the left to see full details, reporter contact information, and resolve the ticket.",
        searchTitleLost: "Search active session by Plate Number",
        searchTitleOcr: "Search active session by Misread Plate",
        btnClearForm: "Clear Form",
        placeholderSlotInput: "Enter slot name (e.g., A101, B205)...",
        placeholderPlateInput: "Enter vehicle license plate...",
        btnFindSession: "Find Session",
        mustFindSessionAlert: "You must enter details and click \"Find Session\" above before confirming.",
        lostTicketReportTitle: "Lost Ticket Report",
        correctPlateTitle: "Correct Plate Number",
        lostPlateLabel: "License Plate",
        staffNotesLabel: "Staff Notes",
        correctedPlateLabel: "Correct License Plate",
        btnConfirmSystem: "Confirm & Update System",
        outputTitle: "Output",
        incidentLogTitle: "Incident Outcome Log",
        typeLabel: "Type:",
        timeLabel: "Time:",
        parkingFeeLabel: "Parking Fee:",
        penaltyFineLabel: "Penalty Fine:",
        totalDue: "TOTAL DUE:",
        wrongOcrLabel: "Wrong OCR",
        correctedToLabel: "Corrected To",
        updatedSlotLabel: "Updated Slot:",
        reasonLabel: "Reason:",
        btnNextIssue: "Process Next Issue",
        awaitingAction: "Awaiting action.",
        awaitingActionLostSub: "Detailed receipt and payment breakdown will appear here.",
        awaitingActionOcrSub: "Detailed system logs and update history will be displayed here.",
        currentSystemData: "Current System Data",
        parkingSlotLabel: "Parking Slot:",
        zoneLabel: "Zone:",
        licensePlate: "License Plate:",
        checkInTimeLabel: "Check-in Time:",
        durationLabel: "Duration:",
        currentFeeLabel: "Current Fee:",
        entryImageLabel: "Check-in Image",
        toastEnterSearch: "Please enter a search keyword!",
        toastSessionFound: "Active parking session found!",
        toastSlotEmpty: "This slot is empty or has no active session.",
        toastNoSessionPlate: "License plate not found.",
        toastSearchFailed: "Search failed. Please try again.",
        toastResolveSuccess: "Incident resolved successfully!",
        toastResolveFailed: "Failed to resolve incident.",
        toastInputFeedback: "Please enter a resolution feedback message!",
        toastIncidentUpdated: "Incident resolved and updated successfully!",
        toastActionDenied: "Action denied. Please check parameters.",
        toastLoadIncidentsFailed: "Failed to load user incidents.",
        lostReasonDefault: "Customer reported lost parking ticket",
        ocrReasonDefault: "OCR character misread",
        unknownLabel: "Unknown",
        systemUser: "System User",
        unassigned: "Unassigned",
        mins: "mins",
        hours: "hours",
    }
};

export default function StaffIncidentHandling() {
    const { language } = useLanguage();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("LOST_TICKET");

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [foundSession, setFoundSession] = useState(null);
    const [associatedSlot, setAssociatedSlot] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [proofUrl, setProofUrl] = useState("");
    const [localPreviewUrl, setLocalPreviewUrl] = useState("");
    const [uploadingProof, setUploadingProof] = useState(false);
    const fileInputRef = useRef(null);

    const [formValues, setFormValues] = useState({
        lostPlate: "",
        lostReason: "",
        correctedPlate: "",
        mismatchReason: ""
    });

    const [userIncidents, setUserIncidents] = useState([]);
    const [userIncidentsLoading, setUserIncidentsLoading] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [userStatusFilter, setUserStatusFilter] = useState("OPEN");
    const [userSearchQuery, setUserSearchQuery] = useState("");

    const tabsConfig = [
        { id: "LOST_TICKET", label: t[language].tabLostTicket, sub: t[language].tabLostTicketSub, searchBySlot: false },
        { id: "OCR_MISMATCH", label: t[language].tabOcrMismatch, sub: t[language].tabOcrMismatchSub, searchBySlot: false },
        { id: "USER_REPORTED", label: t[language].tabUserReported, sub: t[language].tabUserReportedSub, searchBySlot: false },
    ];

    const currentTabConfig = tabsConfig.find(t => t.id === activeTab);

    const handleInputChange = (key, value) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const handleProofUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
            toast.error(language === "vi" ? "Định dạng file không hợp lệ. Chỉ hỗ trợ JPG, JPEG, PNG." : "Invalid file type. Only JPG, JPEG, PNG are supported.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(language === "vi" ? "Kích thước file không được vượt quá 5MB." : "File size cannot exceed 5MB.");
            return;
        }

        // Set local preview instantly
        const localUrl = URL.createObjectURL(file);
        setLocalPreviewUrl(localUrl);

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadingProof(true);
            const res = await api.post("/staff/upload-proof", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            if (res.data?.success && res.data?.data?.url) {
                setProofUrl(res.data.data.url);
                toast.success(language === "vi" ? "Tải ảnh lên thành công!" : "Image uploaded successfully!");
            } else {
                toast.error(res.data?.message || "Upload failed");
                setLocalPreviewUrl("");
            }
        } catch (err) {
            toast.error(err?.message || err?.response?.data?.message || "Upload failed");
            setLocalPreviewUrl("");
        } finally {
            setUploadingProof(false);
        }
    };

    const resetWorkspace = () => {
        setReportData(null);
        setFoundSession(null);
        setAssociatedSlot(null);
        setSearchQuery("");
        setProofUrl("");
        setLocalPreviewUrl("");
        setUploadingProof(false);
        setFormValues({
            lostPlate: "", lostReason: "",
            correctedPlate: "", mismatchReason: ""
        });
        setSelectedIncident(null);
        setFeedbackText("");
        setUserSearchQuery("");
    };

    const handleTabSwitch = (tabId) => {
        setActiveTab(tabId);
        resetWorkspace();
    };

    const parseDescription = (description) => {
        if (!description) return { rating: 0, subject: "", message: "", attachment: "", feedback: "" };

        let attachment = "";
        const attachmentMatch = description.match(/\[Attachment:\s*([^\]]+)\]/);
        if (attachmentMatch) {
            attachment = attachmentMatch[1];
        }

        let cleanedDesc = description.replace(/\[Attachment:\s*[^\]]+\]/, "").trim();

        let feedback = "";
        const feedbackMatch = cleanedDesc.match(/\[Feedback:\s*([^\]]+)\]/);
        if (feedbackMatch) {
            feedback = feedbackMatch[1];
            cleanedDesc = cleanedDesc.replace(/\[Feedback:\s*[^\]]+\]/, "").trim();
        }

        let rating = 0;
        const ratingMatch = cleanedDesc.match(/\[Rating:\s*(\d)★?\]/);
        if (ratingMatch) {
            rating = parseInt(ratingMatch[1], 10);
            cleanedDesc = cleanedDesc.replace(/\[Rating:\s*\d★?\]/, "").trim();
        }

        let subject = "";
        let message = cleanedDesc;
        const colonIndex = cleanedDesc.indexOf(":");
        if (colonIndex > 0) {
            subject = cleanedDesc.substring(0, colonIndex).trim();
            message = cleanedDesc.substring(colonIndex + 1).trim();
        }

        return { rating, subject, message, attachment, feedback };
    };

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

    const fetchUserIncidents = async (status = userStatusFilter, search = userSearchQuery) => {
        setUserIncidentsLoading(true);
        try {
            const res = await api.get("/feedbacks", {
                params: {
                    status: status || undefined,
                    search: search || undefined,
                    page: 1,
                    pageSize: 1000
                }
            });
            if (res.data?.success) {
                const items = res.data.data.items || [];
                setUserIncidents(items);
                if (selectedIncident) {
                    const updated = items.find(i => i.feedback_id === selectedIncident.feedback_id);
                    setSelectedIncident(updated || null);
                }
            }
        } catch (err) {
            toast.error(err?.message || err?.response?.data?.message || t[language].toastLoadIncidentsFailed);
        } finally {
            setUserIncidentsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "USER_REPORTED") {
            fetchUserIncidents(userStatusFilter, userSearchQuery);
        }
    }, [activeTab, userStatusFilter]);

    useEffect(() => {
        if (location.state && location.state.wrongPlate) {
            const wrongPlate = location.state.wrongPlate;
            setActiveTab("OCR_MISMATCH");
            setSearchQuery(wrongPlate);

            const autoSearch = async () => {
                setIsSearching(true);
                setReportData(null);
                setFoundSession(null);
                setAssociatedSlot(null);

                try {
                    const res = await api.get(`/parking/sessions/active/${wrongPlate}`);
                    if (res.data?.success && res.data?.data) {
                        const session = res.data.data.session || res.data.data;
                        const slotInfo = res.data.data.slot || session.slot || null;

                        setFoundSession(session);
                        setAssociatedSlot(slotInfo);
                        setFormValues(prev => ({
                            ...prev,
                            correctedPlate: session.license_plate_in || wrongPlate
                        }));
                        toast.success(t[language].toastSessionFound);
                    } else {
                        toast.error(t[language].toastNoSessionPlate);
                    }
                } catch (err) {
                    toast.error(err?.message || err?.response?.data?.message || t[language].toastSearchFailed);
                } finally {
                    setIsSearching(false);
                }
            };
            autoSearch();
        }
    }, [location.state, language]);

    const handleResolveUserIncident = async (e) => {
        e.preventDefault();
        if (!selectedIncident) return;
        if (!feedbackText.trim()) {
            return toast.error(t[language].toastInputFeedback);
        }

        setIsSubmitting(true);
        try {
            const res = await api.put(`/feedbacks/${selectedIncident.feedback_id}/process`, {
                status: "RESOLVED",
                response_note: feedbackText.trim()
            });

            if (res.data?.success) {
                toast.success(t[language].toastResolveSuccess);
                setFeedbackText("");
                await fetchUserIncidents();
            }
        } catch (err) {
            toast.error(err?.message || err?.response?.data?.message || t[language].toastResolveFailed);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSearchActiveSession = async (e) => {
        e.preventDefault();
        const query = searchQuery.trim().toUpperCase();
        if (!query) return toast.error(t[language].toastEnterSearch);

        setIsSearching(true);
        setReportData(null);
        setFoundSession(null);
        setAssociatedSlot(null);

        try {
            const url = currentTabConfig?.searchBySlot
                ? `/parking/slots/active-session/${query}`
                : `/parking/sessions/active/${query}`;

            const res = await api.get(url);

            if (res.data?.success && res.data?.data) {
                const session = res.data.data.session || res.data.data;
                const slotInfo = res.data.data.slot || session.slot || null;

                setFoundSession(session);
                setAssociatedSlot(slotInfo);

                if (activeTab === "LOST_TICKET") {
                    handleInputChange("lostPlate", session.license_plate_in || query);
                } else if (activeTab === "OCR_MISMATCH") {
                    handleInputChange("correctedPlate", session.license_plate_in || query);
                }
                toast.success(t[language].toastSessionFound);
            } else {
                toast.error(
                    currentTabConfig?.searchBySlot
                        ? t[language].toastSlotEmpty
                        : t[language].toastNoSessionPlate
                );
            }
        } catch (err) {
            toast.error(err?.message || err?.response?.data?.message || t[language].toastSearchFailed);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmitIncident = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const queryUpper = searchQuery.trim().toUpperCase();

        const INCIDENT_SUBMIT_MAP = {
            LOST_TICKET: {
                url: "/staff/lost-ticket",
                body: {
                    session_id: foundSession?.session_id || "sess_unknown",
                    license_plate: formValues.lostPlate.toUpperCase(),
                    lost_reason: formValues.lostReason || t[language].lostReasonDefault,
                    proof_image_url: proofUrl || undefined
                }
            },
            OCR_MISMATCH: {
                url: "/staff/correct-mismatch",
                body: {
                    slot_name: "",
                    original_license_plate: foundSession?.license_plate_in || "",
                    corrected_license_plate: formValues.correctedPlate.trim().toUpperCase(),
                    reason: formValues.mismatchReason || t[language].ocrReasonDefault,
                }
            }
        };

        const targetConfig = INCIDENT_SUBMIT_MAP[activeTab];

        try {
            const res = await api.post(targetConfig.url, targetConfig.body);

            toast.success(t[language].toastIncidentUpdated);

            setReportData({
                success: true,
                type: activeTab,
                timestamp: new Date().toLocaleString(language === "vi" ? "vi-VN" : "en-US"),
                payload: res.data?.data || {},
                changes: { ...targetConfig.body }
            });

            setFoundSession(null);
            setAssociatedSlot(null);
            setSearchQuery("");
        } catch (err) {
            toast.error(err?.message || err?.response?.data?.message || t[language].toastActionDenied);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSystemData = () => {
        if (!foundSession) return null;
        return (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12} /> {t[language].currentSystemData}</div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md text-xs font-semibold space-y-1.5 border border-slate-200 dark:border-slate-700">
                        {associatedSlot?.slot_name && (
                            <div className="flex justify-between"><span className="text-slate-400">{t[language].parkingSlotLabel}</span><span className="font-sans text-emerald-700 dark:text-emerald-400 font-black">{associatedSlot.slot_name}</span></div>
                        )}
                        {foundSession.zone_name && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">{t[language].zoneLabel}</span>
                                <span className="font-sans text-slate-900 dark:text-white rounded font-black uppercase">{foundSession.zone_name}</span></div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-slate-400">{t[language].licensePlate}</span>
                            <span className="font-sans text-slate-900 dark:text-white rounded font-black">{foundSession.license_plate_in}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">{t[language].checkInTimeLabel}</span>
                            <span className="font-sans text-slate-900 dark:text-white rounded font-black">
                                {foundSession.check_in_time
                                    ? new Date(foundSession.check_in_time).toLocaleString(language === "vi" ? "vi-VN" : "en-US")
                                    : "--:--:-- --/--/----"}
                            </span>
                        </div>
                        <div className="flex justify-between"><span className="text-slate-400">{t[language].durationLabel}</span><span className="font-sans text-slate-900 dark:text-white rounded font-black">{foundSession.duration_minutes} {t[language].mins}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">{t[language].currentFeeLabel}</span><span className="font-sans text-amber-600 dark:text-amber-500 rounded font-black">{(foundSession.current_fee || 0).toLocaleString()} VND</span></div>
                    </div>
                </div>
                <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">{t[language].entryImageLabel}</span>
                    <div
                        onClick={() => {
                            if (foundSession && foundSession.image_url_in) {
                                setLightboxImage(getFullImageUrl(foundSession.image_url_in));
                            }
                        }}
                        className="bg-slate-100 dark:bg-slate-950 h-[130px] xl:h-[160px] 2xl:h-[200px] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-md relative group cursor-zoom-in rounded-md transition-colors duration-200"
                        title="Click to zoom check-in snapshot"
                    >
                        <img
                            src={foundSession.image_url_in ? getFullImageUrl(foundSession.image_url_in) : "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=600"}
                            alt="Gate Entry"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=600"; }}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 dark:opacity-80"
                        />
                        <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 rounded p-1 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                            <Maximize2 size={10} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderResultPanel = () => {
        if (!reportData) return null;
        const { type, timestamp, payload, changes } = reportData;

        return (
            <div className="space-y-4 animate-fadeIn">
                <div className="border border-slate-200 dark:border-slate-800 rounded-md p-4 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs space-y-3">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-xs border-b pb-2 border-slate-200 dark:border-slate-700">
                        <ClipboardList size={14} /> {t[language].incidentLogTitle}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-slate-400">{t[language].typeLabel}</span><span className="font-bold text-slate-900 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] dark:text-white">{type}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">{t[language].timeLabel}</span><span className="font-sans text-slate-900 dark:text-white">{timestamp}</span></div>

                        {type === "LOST_TICKET" && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                                <div className="flex justify-between"><span>{t[language].licensePlate}:</span><span className="font-sans font-black text-slate-900 dark:text-white">{changes.license_plate}</span></div>
                                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400"><span>{t[language].parkingFeeLabel}</span><span>{(payload.breakdown?.actual_parking_fee || payload.parking_fee || 0).toLocaleString()} VND</span></div>
                                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400"><span>{t[language].penaltyFineLabel}</span><span>{(payload.breakdown?.handling_fee || payload.penalty_fee || 50000).toLocaleString()} VND</span></div>
                                <div className="border-t pt-1.5 border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                                    <span>{t[language].totalDue}</span>
                                    <span className="text-red-600 dark:text-red-400">{(payload.calculated_fee || payload.total_fee || 65000).toLocaleString()} VND</span>
                                </div>
                            </div>
                        )}

                        {type === "OCR_MISMATCH" && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                                <div className="flex justify-between text-[11px] mb-1"><span className="text-slate-400">{t[language].updatedSlotLabel}</span><span className="font-bold text-slate-900 dark:text-white uppercase">{changes.slot_name}</span></div>
                                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700 text-center">
                                    <div>
                                        <div className="text-[10px] text-slate-400">{t[language].wrongOcrLabel}</div>
                                        <div className="font-sans font-bold line-through text-red-500">{changes.original_license_plate || "N/A"}</div>
                                    </div>
                                    <div className="border-l border-slate-100 dark:border-slate-700">
                                        <div className="text-[10px] text-slate-400">{t[language].correctedToLabel}</div>
                                        <div className="font-sans font-black text-emerald-600 dark:text-emerald-400">{changes.corrected_license_plate}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400  pt-1 border-t border-slate-100 dark:border-slate-700"><strong>{t[language].reasonLabel}</strong> {changes.reason || changes.lost_reason}</div>
                    </div>
                </div>

                <button
                    onClick={() => resetWorkspace()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                    {t[language].btnNextIssue}
                </button>
            </div>
        );
    };

    return (
        <div className="w-full text-slate-700 dark:text-slate-200 h-full flex flex-col gap-4 overflow-hidden antialiased">

            {/* SELECTION TABS SWITCHER */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 md:gap-6 no-scrollbar pb-px w-full shrink-0">
                {tabsConfig.map(tab => {
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabSwitch(tab.id)}
                            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all focus:outline-none whitespace-nowrap flex items-center gap-2 ${active
                                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* MAIN WORKSPACE */}
            {activeTab === "USER_REPORTED" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start flex-1 min-h-0 overflow-y-auto pr-1 animate-fadeIn">
                    {/* LEFT COLUMN: LIST OF INCIDENTS */}
                    <div className="lg:col-span-2 space-y-4 h-full flex flex-col min-h-0">
                        {/* SEARCH & FILTER CONTROLS */}
                        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder={t[language].placeholderSearchReports}
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md pl-9 pr-3 py-1.5 text-sm  outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 transition-all"
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto items-center">
                                <select
                                    value={userStatusFilter}
                                    onChange={(e) => setUserStatusFilter(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md px-3 py-1.5 text-xs font-bold outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all"
                                >
                                    <option value="">{t[language].allStatuses}</option>
                                    <option value="OPEN">{t[language].statusOpen}</option>
                                    <option value="RESOLVED">{t[language].statusResolved}</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => fetchUserIncidents(userStatusFilter, userSearchQuery)}
                                    className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition-colors"
                                >
                                    {t[language].btnSearch}
                                </button>
                            </div>
                        </div>

                        {/* LIST CONTAINER */}
                        <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] pr-1">
                            {userIncidentsLoading ? (
                                <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm flex flex-col items-center justify-center gap-3">
                                    <Clock className="animate-spin text-blue-500" size={24} />
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{t[language].loadingReports}</p>
                                </div>
                            ) : userIncidents.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 p-12 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-center">
                                    <AlertCircle className="mx-auto text-slate-350 dark:text-slate-655 mb-2" size={36} />
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wide">{t[language].noIncidents}</p>
                                    <p className="text-slate-400 dark:text-slate-655 text-[10px] mt-1">
                                        {t[language].noIncidentsSub}
                                    </p>
                                </div>
                            ) : (
                                userIncidents.map((incident) => {
                                    const subject = incident.title;
                                    const message = incident.content;
                                    const isSelected = selectedIncident?.feedback_id === incident.feedback_id;
                                    return (
                                        <div
                                            key={incident.feedback_id}
                                            onClick={() => {
                                                setSelectedIncident(incident);
                                                setFeedbackText("");
                                            }}
                                            className={`bg-white dark:bg-slate-900 p-4 border rounded-md shadow-xs cursor-pointer transition-all hover:shadow-md ${isSelected
                                                ? "border-blue-600 dark:border-blue-400 ring-1 ring-blue-600 dark:ring-blue-400"
                                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${incident.status === "OPEN"
                                                        ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                                                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                                        }`}>
                                                        {incident.status === "OPEN" ? t[language].statusOpen : t[language].statusResolved}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 font-sans">#{incident.feedback_id}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-sans">
                                                    {incident.created_at ? new Date(incident.created_at).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : ""}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-150 text-blue-650 font-bold flex items-center justify-center text-[10px] uppercase border border-blue-200 dark:border-slate-750">
                                                    <span>{incident.full_name ? incident.full_name.charAt(0) : "U"}</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-850 dark:text-white truncate">
                                                    {incident.full_name || t[language].systemUser}
                                                </span>
                                            </div>

                                            {subject && (
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                    {subject}
                                                </div>
                                            )}
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {message || t[language].noDesc}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    {/* RIGHT COLUMN: DETAIL PANEL */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 relative overflow-hidden h-fit space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <ClipboardList size={15} className="text-slate-400" />
                            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                {t[language].outputTitle}
                            </h3>
                        </div>

                        {selectedIncident ? (
                            <div className="space-y-4">
                                {/* REPORTER CARD */}
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-200 dark:border-slate-700 shadow-inner">
                                        <span className="text-sm font-black uppercase">
                                            {selectedIncident.full_name ? selectedIncident.full_name.charAt(0) : "U"}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-0.5">
                                            {t[language].reporterLabel}
                                        </span>
                                        <p className="text-xs font-black text-slate-855 dark:text-white truncate font-extrabold">
                                            {selectedIncident.full_name || t[language].systemUser}
                                        </p>
                                    </div>
                                </div>

                                {/* REPORTER CONTACTS */}
                                <div className="space-y-2 text-xs font-bold text-slate-655 dark:text-slate-400">
                                    {selectedIncident.customer_phone ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/40 dark:bg-emerald-950/10 rounded border border-emerald-100/60 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-400">
                                            <Phone size={12} className="text-emerald-500" />
                                            <span className="font-sans text-xs">{selectedIncident.customer_phone}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-800 text-slate-400">
                                            <Phone size={12} />
                                            <span className="italic text-[10px]">{t[language].noPhone}</span>
                                        </div>
                                    )}

                                    {selectedIncident.customer_email ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/40 dark:bg-indigo-950/10 rounded border border-indigo-100/60 dark:border-indigo-900/20 text-indigo-800 dark:text-indigo-400 min-w-0">
                                            <Mail size={12} className="text-indigo-500 shrink-0" />
                                            <span className="truncate text-xs">{selectedIncident.customer_email}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-800 text-slate-400">
                                            <Mail size={12} />
                                            <span className="italic text-[10px]">{t[language].noEmail}</span>
                                        </div>
                                    )}
                                </div>

                                {/* TICKET CONTENT */}
                                {(() => {
                                    const rating = selectedIncident.star_rating;
                                    const subject = selectedIncident.title;
                                    const message = selectedIncident.content;
                                    const attachment = selectedIncident.attachment_url;
                                    const feedback = selectedIncident.response_note;
                                    return (
                                        <div className="space-y-3 text-xs">
                                            {rating > 0 && (
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block mb-1 font-bold">{t[language].expRatingLabel}</span>
                                                    <div className="flex gap-0.5 text-amber-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                className={i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-750"}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {subject && (
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block mb-0.5 font-bold">{t[language].subjectLabel}</span>
                                                    <p className="font-extrabold text-slate-855 dark:text-white leading-snug">{subject}</p>
                                                </div>
                                            )}

                                            <div>
                                                <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block mb-0.5 font-bold">{t[language].descLabel}</span>
                                                <p className="text-slate-605 dark:text-slate-350 bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-150 dark:border-slate-855 whitespace-pre-wrap font-medium leading-relaxed">
                                                    {message || t[language].noDesc}
                                                </p>
                                            </div>

                                            {attachment && (
                                                <div className="pt-1">
                                                    <a
                                                        href={`${getBackendRootUrl()}${attachment}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-250 dark:border-slate-700 rounded text-[11px] font-bold text-blue-600 dark:text-blue-400 transition-colors shadow-xs"
                                                    >
                                                        <Paperclip size={12} className="text-blue-500" />
                                                        {t[language].viewAttachment}
                                                    </a>
                                                </div>
                                            )}

                                            {/* RESOLUTION ACTION */}
                                            {selectedIncident.status === "OPEN" ? (
                                                <form onSubmit={handleResolveUserIncident} className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block font-bold">{t[language].feedbackLabel}</label>
                                                        <textarea
                                                            rows={3}
                                                            required
                                                            value={feedbackText}
                                                            onChange={e => setFeedbackText(e.target.value)}
                                                            placeholder={t[language].feedbackPlaceholder}
                                                            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 transition-all resize-none"
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle size={14} />
                                                        {isSubmitting ? t[language].processing : t[language].btnResolve}
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                                                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-md">
                                                        <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider mb-1 font-bold">
                                                            {t[language].feedbackLabel}
                                                        </span>
                                                        <p className="text-xs text-slate-855 dark:text-slate-300 font-semibold leading-relaxed mb-2">
                                                            {feedback || t[language].resolvedNoFeedback}
                                                        </p>
                                                        {selectedIncident.resolved_by && (
                                                            <div className="text-[9px] font-sans text-slate-400 dark:text-slate-505 border-t border-slate-150 dark:border-slate-800/80 pt-1.5 flex justify-between">
                                                                <span>By: {selectedIncident.resolved_by}</span>
                                                                <span>{selectedIncident.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleString(language === "vi" ? "vi-VN" : "en-US") : ""}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-24 text-slate-400 dark:text-slate-505 font-medium text-xs space-y-2 font-semibold">
                                <ClipboardList size={32} className="mx-auto text-slate-200 dark:text-slate-800 stroke-[1.5]" />
                                <div>{t[language].noIncidentSelected}</div>
                                <div className="text-[10px] text-slate-355 dark:text-slate-600 mt-1 max-w-[200px] mx-auto not-italic">
                                    {t[language].noIncidentSelectedSub}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start flex-1 min-h-0 overflow-y-auto pr-1">

                    {/* SEARCH AND FORM BLOCK */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* SEARCH ACTIVE SESSION FORM */}
                        <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                                    <Search size={14} className="text-blue-500" />
                                    {activeTab === "LOST_TICKET" ? t[language].searchTitleLost : t[language].searchTitleOcr}
                                </h3>
                                {(searchQuery || foundSession || reportData) && (
                                    <button
                                        type="button"
                                        onClick={() => resetWorkspace()}
                                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all">
                                        <Trash2 size={12} />
                                        <span>{t[language].btnClearForm}</span>
                                    </button>
                                )}
                            </div>

                            {/* FORM TÌM KIẾM: Nhấn Enter ở input này sẽ chạy handleSearchActiveSession */}
                            <form onSubmit={handleSearchActiveSession} className="flex gap-2">
                                <div className="relative flex-1">
                                    <CarFront className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder={currentTabConfig?.searchBySlot ? t[language].placeholderSlotInput : t[language].placeholderPlateInput}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value.toUpperCase())}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md pl-9 pr-3 py-2 text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 transition-all placeholder:font-normal"
                                    />
                                </div>
                                <button type="submit" disabled={isSearching} className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs px-4 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap">
                                    {t[language].btnFindSession}
                                </button>
                            </form>

                            {!foundSession && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-semibold rounded-md border border-amber-200 dark:border-amber-900/30 text-xs flex items-center gap-2">
                                    <Info size={14} />
                                    <span>{t[language].mustFindSessionAlert}</span>
                                </div>
                            )}

                            {renderSystemData()}
                        </div>

                        {/* INCIDENT DETAILS FORM */}
                        <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm">
                            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                {activeTab === "LOST_TICKET" ? t[language].lostTicketReportTitle : t[language].correctPlateTitle}
                            </h3>

                            {/* FORM XỬ LÝ SỰ CỐ: Nhấn Enter ở bất kỳ ô input/textarea nào trong này sẽ chạy handleSubmitIncident */}
                            <form onSubmit={handleSubmitIncident} className="space-y-4">

                                {/* FORM: LOST TICKET */}
                                {activeTab === "LOST_TICKET" && (
                                    <div className="grid grid-cols-1 gap-4 text-xs">
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">{t[language].lostPlateLabel}</label>
                                            <input
                                                type="text" required disabled={!foundSession}
                                                value={formValues.lostPlate} onChange={e => handleInputChange("lostPlate", e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-sans font-black text-sm uppercase rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">{t[language].staffNotesLabel}</label>
                                            <textarea
                                                rows={2} required disabled={!foundSession}
                                                value={formValues.lostReason} onChange={e => handleInputChange("lostReason", e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all resize-none disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">
                                                {language === "vi" ? "Ảnh minh chứng (Giấy tờ xe / Chủ xe)" : "Proof Image (Vehicle Documents / Owner)"}
                                            </label>

                                            {/* Hidden file input */}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/*"
                                                onChange={handleProofUpload}
                                                className="hidden"
                                                disabled={!foundSession || uploadingProof}
                                            />

                                            {/* Custom Dropzone / Upload Box */}
                                            {!localPreviewUrl ? (
                                                <div
                                                    onClick={() => {
                                                        if (foundSession && !uploadingProof) {
                                                            fileInputRef.current?.click();
                                                        }
                                                    }}
                                                    className={`border-2 border-dashed border-slate-350 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/20 active:scale-[0.98] ${!foundSession ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                                >
                                                    <Upload size={24} className="text-slate-400 dark:text-slate-550" />
                                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center">
                                                        {language === "vi" ? "Nhấn vào đây để chọn hoặc kéo thả ảnh minh chứng" : "Click to select or drag & drop proof image"}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                                        PNG, JPG, JPEG (Max 5MB)
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="relative w-full max-w-sm h-48 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center shadow-inner group">
                                                    <img src={localPreviewUrl} alt="Proof Upload Preview" className="w-full h-full object-contain" />

                                                    {/* Uploading Status Overlay */}
                                                    {uploadingProof && (
                                                        <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center gap-2">
                                                            <div className="w-6 h-6 border-2 border-t-blue-500 border-slate-600 rounded-full animate-spin"></div>
                                                            <span className="text-[10px] text-white font-bold animate-pulse">
                                                                {language === "vi" ? "Đang tải ảnh lên..." : "Uploading image..."}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Success Overlay on hover (if not uploading) */}
                                                    {!uploadingProof && (
                                                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-md transform hover:scale-105"
                                                                title={language === "vi" ? "Thay đổi ảnh" : "Change image"}
                                                            >
                                                                <Upload size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setProofUrl("");
                                                                    setLocalPreviewUrl("");
                                                                }}
                                                                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all shadow-md transform hover:scale-105"
                                                                title={language === "vi" ? "Xóa ảnh" : "Delete image"}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* FORM: OCR MISMATCH */}
                                {activeTab === "OCR_MISMATCH" && (
                                    <div className="grid grid-cols-1 gap-4 text-xs">
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">{t[language].correctedPlateLabel}</label>
                                            <input
                                                type="text" required disabled={!foundSession}
                                                value={formValues.correctedPlate} onChange={e => handleInputChange("correctedPlate", e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50 "
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-bold text-slate-400 uppercase tracking-wide">{t[language].staffNotesLabel}</label>
                                            <input
                                                type="text" required disabled={!foundSession}
                                                value={formValues.mismatchReason} onChange={e => handleInputChange("mismatchReason", e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-md px-3 py-2 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* EXECUTE ACTION BUTTON */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !foundSession}
                                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-md shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? t[language].processing : t[language].btnConfirmSystem}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: OUTPUT SIDE PANEL */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 relative overflow-hidden h-fit">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                            <ClipboardList size={15} className="text-slate-400" />
                            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                {t[language].outputTitle}
                            </h3>
                        </div>

                        {reportData ? renderResultPanel() : (
                            <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-medium text-xs  space-y-2">
                                <ClipboardList size={32} className="mx-auto text-slate-200 dark:text-slate-800 stroke-[1.5]" />
                                <div>{t[language].awaitingAction}</div>
                                <div className="text-[10px] text-slate-350 dark:text-slate-600 not-italic max-w-[200px] mx-auto mt-1">
                                    {activeTab === "LOST_TICKET"
                                        ? t[language].awaitingActionLostSub
                                        : t[language].awaitingActionOcrSub}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            )}
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
                            <p className="font-sans font-bold tracking-widest text-sm text-yellow-500 dark:text-yellow-400">
                                {foundSession?.license_plate_in || "No Plate Info"}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}