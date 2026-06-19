<<<<<<< HEAD
import React, { useState, useEffect, useMemo } from "react";
import {
  Send,
  Star,
=======
import React, { useState, useMemo } from "react";
import {
  Send,
  Star,
  UploadCloud,
>>>>>>> origin/main
  HelpCircle,
  X,
  FileText,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
<<<<<<< HEAD
  Clock,
  CheckCircle,
  Upload,
  Paperclip,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  History
} from "lucide-react";

const getBackendRootUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5077";
  return baseUrl.replace("/api/v1", "");
};
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
=======
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
>>>>>>> origin/main

export default function Issues() {
  const navigate = useNavigate();
  const { user } = useAuth();
<<<<<<< HEAD
  const { language } = useLanguage();

  const getIssueTypeLabel = (type) => {
    switch (type) {
      case "SYSTEM_ERROR": return language === "en" ? "System & App Error" : "Lỗi ứng dụng & hệ thống";
      case "LOST_TICKET": return language === "en" ? "Lost Ticket" : "Mất thẻ xe";
      case "WRONG_SLOT": return language === "en" ? "Wrong Slot Occupancy" : "Chỗ đỗ xe bị chiếm";
      default: return language === "en" ? "Other Feedback / General Inquiry" : "Ý kiến khác / Giải đáp chung";
    }
  };

  const getTicketStatusLabel = (status) => {
    switch (status) {
      case "RESOLVED": return language === "en" ? "Resolved" : "Đã xử lý";
      case "PENDING": return language === "en" ? "Pending" : "Đang chờ";
      default: return language === "en" ? "In Review" : "Đang duyệt";
    }
  };

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [formData, setFormData] = useState({
    rating: 0,
    issueType: "SYSTEM_ERROR", // LOST_TICKET, WRONG_SLOT, SYSTEM_ERROR, OTHER
    subject: "",
    message: "",
    customerPhone: "",
    customerEmail: "",
  });

  const [tickets, setTickets] = useState([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting' | 'success'
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  // File Upload states
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileName, setFileName] = useState("");

  // Pre-fill user profile info if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerPhone: prev.customerPhone || user.phone || "",
        customerEmail: prev.customerEmail || user.email || "",
      }));
    }
  }, [user]);

  // Load past tickets
  const fetchTickets = async () => {
    try {
      const response = await api.get("/user/incidents");
      if (response.data && response.data.success) {
        setTickets(response.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách sự cố:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);
=======

  // ==========================================
  // FORM STATE
  // ==========================================
  const [formData, setFormData] = useState({
    rating: 0,
    subject: "",
    message: "",
    isAnonymous: false,
    attachment: null,
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [status, setStatus] = useState("idle"); // 'idle' | 'submitting' | 'success'
>>>>>>> origin/main

  const ratingLabel = useMemo(() => {
    const currentRating = hoverRating || formData.rating;
    switch (currentRating) {
      case 1:
<<<<<<< HEAD
        return language === "en" ? "Terrible 😞" : "Rất tệ 😞";
      case 2:
        return language === "en" ? "Bad 🙁" : "Tệ 🙁";
      case 3:
        return language === "en" ? "Average 😐" : "Bình thường 😐";
      case 4:
        return language === "en" ? "Good 🙂" : "Tốt 🙂";
      case 5:
        return language === "en" ? "Excellent! 😄" : "Tuyệt vời! 😄";
      default:
        return language === "en" ? "Select your rating" : "Chọn mức độ đánh giá";
    }
  }, [hoverRating, formData.rating, language]);
=======
        return "Terrible 😞";
      case 2:
        return "Bad 🙁";
      case 3:
        return "Average 😐";
      case 4:
        return "Good 🙂";
      case 5:
        return "Excellent! 😄";
      default:
        return "Select your rating";
    }
  }, [hoverRating, formData.rating]);
>>>>>>> origin/main

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

<<<<<<< HEAD
  const parseDescription = (description) => {
    if (!description) {
      return { rating: 0, subject: "", message: "", attachment: "", feedback: "" };
    }

    // Extract attachment
    let attachment = "";
    const attachmentMatch = description.match(/\[Attachment:\s*([^\]]+)\]/);
    if (attachmentMatch) {
      attachment = attachmentMatch[1];
    }

    // Clean description by removing the attachment part
    let cleanedDesc = description.replace(/\[Attachment:\s*[^\]]+\]/, "").trim();

    // Extract staff feedback
    let feedback = "";
    const feedbackMatch = cleanedDesc.match(/\[Feedback:\s*([^\]]+)\]/);
    if (feedbackMatch) {
      feedback = feedbackMatch[1];
      cleanedDesc = cleanedDesc.replace(/\[Feedback:\s*[^\]]+\]/, "").trim();
    }

    // Extract rating
    let rating = 0;
    const ratingMatch = cleanedDesc.match(/\[Rating:\s*(\d)★?\]/);
    if (ratingMatch) {
      rating = parseInt(ratingMatch[1], 10);
      cleanedDesc = cleanedDesc.replace(/\[Rating:\s*\d★?\]/, "").trim();
    }

    // Extract subject and message
    let subject = "";
    let message = cleanedDesc;

    // If there is a subject colon message structure: "Subject: Message"
    const colonIndex = cleanedDesc.indexOf(":");
    if (colonIndex > 0) {
      subject = cleanedDesc.substring(0, colonIndex).trim();
      message = cleanedDesc.substring(colonIndex + 1).trim();
    }

    return { rating, subject, message, attachment, feedback };
=======
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, attachment: e.target.files[0] });
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, attachment: null });
>>>>>>> origin/main
  };

  const handleDiscard = () => {
    setFormData({
      rating: 0,
<<<<<<< HEAD
      issueType: "SYSTEM_ERROR",
      subject: "",
      message: "",
      customerPhone: user?.phone || "",
      customerEmail: user?.email || "",
    });
    setAttachmentUrl("");
    setFileName("");
    setFileError("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError(language === "en" ? "File size exceeds 5MB limit." : "Kích thước tập tin vượt quá giới hạn 5MB.");
      return;
    }

    setFileError("");
    setUploadingFile(true);
    setFileName(file.name);

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const response = await api.post("/user/incidents/upload", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.success) {
        setAttachmentUrl(response.data.data.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setFileError(err.response?.data?.message || (language === "en" ? "Failed to upload file." : "Không thể tải tập tin lên."));
      setFileName("");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setAttachmentUrl("");
    setFileName("");
    setFileError("");
  };

  // Submit Ticket
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating === 0) {
      alert(language === "en" ? "Please select a rating before submitting." : "Vui lòng chọn mức độ đánh giá trước khi gửi.");
      return;
    }

    if (!formData.customerPhone.trim() || !formData.customerEmail.trim()) {
      alert(language === "en" ? "Contact Phone and Contact Email are required." : "Số điện thoại và email liên hệ không được để trống.");
=======
      subject: "",
      message: "",
      isAnonymous: false,
      attachment: null,
    });
  };

  // ==========================================
  // 🚀 VỊ TRÍ API: GỬI TIẾN TRÌNH ISSUE TICKET (FORM DATA)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating === 0) {
      alert("Please select a rating before submitting.");
>>>>>>> origin/main
      return;
    }

    setStatus("submitting");
    try {
<<<<<<< HEAD
      let finalDescription = `[Rating: ${formData.rating}★] ${formData.subject}: ${formData.message}`;
      if (attachmentUrl) {
        finalDescription += `\n[Attachment: ${attachmentUrl}]`;
      }

      const payload = {
        issue_type: formData.issueType,
        description: finalDescription,
        customer_phone: formData.customerPhone || null,
        customer_email: formData.customerEmail || null,
      };

      const response = await api.post("/user/incidents", payload);
      if (response.data && response.data.success) {
        setStatus("success");
        await fetchTickets();
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setStatus("idle");

      let errorMsg = error?.message || error?.response?.data?.message;
      if (!errorMsg && error?.errors) {
        // Parse ASP.NET ValidationProblemDetails structure
        const valErrors = Object.values(error.errors).flat().join("; ");
        if (valErrors) errorMsg = valErrors;
      }
      if (!errorMsg) {
        errorMsg = error?.toString() || "Unknown error";
      }
      alert((language === "en" ? "Error submitting issue: " : "Lỗi khi gửi yêu cầu hỗ trợ: ") + errorMsg);
    }
  };

=======
      /* 🚀 [AXIOS API INTEGRATION]: KẾT NỐI API BACKEND TẠI ĐÂY
      const token = localStorage.getItem('token');
      const apiData = new FormData();
      apiData.append('rating', formData.rating);
      apiData.append('subject', formData.subject);
      apiData.append('message', formData.message);
      apiData.append('is_anonymous', formData.isAnonymous);
      if (formData.attachment) {
        apiData.append('file', formData.attachment); 
      }

      await axios.post('http://localhost:8080/api/v1/feedbacks', apiData, {
        headers: { 
          'Content-Type': 'multipart/form-data', 
          Authorization: `Bearer ${token}` 
        }
      });
      setStatus('success');
      return;
      */

      // MOCK TIMEOUT: Giả lập chờ tải dữ liệu lên server
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus("success");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setStatus("idle");
      alert("Error submitting issue: " + error.message);
    }
  };

  // ==========================================
  // RENDER: TRẠNG THÁI GỬI THÀNH CÔNG
  // ==========================================
>>>>>>> origin/main
  if (status === "success") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center pt-20">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
<<<<<<< HEAD
          {language === "en" ? "Ticket Submitted Successfully!" : "Đã gửi yêu cầu hỗ trợ thành công!"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center text-sm">
          {language === "en"
            ? "Thank you for helping us improve. Our technical staff has logged your ticket and is reviewing the issue."
            : "Cảm ơn bạn đã đóng góp ý kiến để cải thiện hệ thống. Nhân viên kỹ thuật đã ghi nhận và đang tiến hành xử lý."}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
=======
          Feedback Received!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center text-sm">
          Thank you for helping us improve SmartPark Pro. Your issue ticket has
          been registered in the system.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate("/user")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99]"
          >
            Return to Dashboard
          </button>
          <button
>>>>>>> origin/main
            onClick={() => {
              handleDiscard();
              setStatus("idle");
            }}
<<<<<<< HEAD
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
          >
            {language === "en" ? "Return to Support Center" : "Quay lại Trung tâm hỗ trợ"}
=======
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-colors"
          >
            Submit Another Ticket
>>>>>>> origin/main
          </button>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="animate-slide-in max-w-6xl w-full mx-auto pb-12 space-y-8">
      {/* HEADER PAGE */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="text-blue-500" />
          {language === "en" ? "Support Center" : "Trung tâm hỗ trợ"}
        </h2>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
          {language === "en"
            ? "Submit support tickets and track resolution status in real-time."
            : "Gửi các yêu cầu hỗ trợ và theo dõi kết quả xử lý trực tiếp."}
        </p>
      </div>

      {/* SECTION 1: SUBMIT NEW TICKET */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <PlusCircle className="text-blue-500" size={20} />
          {language === "en" ? "File a Support Request" : "Báo cáo sự cố / Gửi hỗ trợ"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Overall */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {language === "en" ? "Overall System Experience" : "Trải nghiệm hệ thống chung"}
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${formData.rating > 0
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    : "text-slate-400"
                  }`}
              >
                {ratingLabel}
              </span>
            </div>
            <div className="flex gap-2 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl w-max border border-slate-100 dark:border-slate-800">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={`transition-colors duration-200 ${star <= (hoverRating || formData.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-slate-300 dark:text-slate-600"
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category Cards Selector */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
              {language === "en" ? "Issue Category" : "Phân loại sự cố"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { value: "SYSTEM_ERROR", label: language === "en" ? "System & App Error" : "Lỗi ứng dụng & hệ thống", description: language === "en" ? "Bugs, scanners, or transaction errors" : "Lỗi phần mềm, máy quét hoặc giao dịch", icon: ShieldAlert },
                { value: "LOST_TICKET", label: language === "en" ? "Lost Ticket" : "Mất thẻ xe", description: language === "en" ? "Lost cards, card replacements" : "Mất thẻ, cấp đổi thẻ mới", icon: AlertTriangle },
                { value: "WRONG_SLOT", label: language === "en" ? "Wrong Slot Occupancy" : "Chỗ đỗ xe bị chiếm", description: language === "en" ? "Another vehicle parked in your assigned slot" : "Xe khác đang đỗ ở vị trí của bạn", icon: AlertCircle },
                { value: "OTHER", label: language === "en" ? "Other Feedback / General Inquiry" : "Ý kiến khác / Giải đáp chung", description: language === "en" ? "General inquiries, suggestions, or other issues" : "Thắc mắc, góp ý hoặc các vấn đề khác", icon: HelpCircle }
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.issueType === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, issueType: cat.value })}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-3.5 relative overflow-hidden ${isSelected
                        ? "border-blue-500 bg-blue-50/10 dark:bg-blue-950/20 dark:border-blue-400 shadow-sm"
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                      }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      }`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white truncate">
                        {cat.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Title */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
              {language === "en" ? "Subject Title" : "Tiêu đề yêu cầu"}
            </h3>
            <input
              type="text"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              placeholder={language === "en" ? "Brief summary (e.g. QR code won't scan on Basement 2)" : "Tóm tắt ngắn gọn (ví dụ: Không quét được mã QR ở tầng hầm 2)"}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3.5 text-slate-800 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
            />
          </div>

          {/* Detailed Message */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
              {language === "en" ? "Detailed Message" : "Mô tả chi tiết sự cố"}
            </h3>
            <textarea
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder={language === "en" ? "Please describe in detail what happened, any error codes displayed, or steps to reproduce..." : "Vui lòng mô tả chi tiết chuyện gì đã xảy ra, mã lỗi hiển thị (nếu có), hoặc các bước dẫn tới lỗi..."}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 text-sm font-medium resize-y"
            ></textarea>
          </div>

          {/* Attachment upload */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
              <Paperclip size={16} className="text-blue-500" />
              {language === "en" ? "Attach File/Screenshot (Optional)" : "Đính kèm tệp/Ảnh chụp màn hình (Tùy chọn)"}
            </h3>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors flex flex-col items-center justify-center text-center relative">
              <input
                type="file"
                id="incident-file"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploadingFile}
              />

              {uploadingFile ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-550 dark:text-slate-450 font-medium">
                    {language === "en" ? "Uploading attachment..." : "Đang tải tệp lên..."}
                  </span>
                </div>
              ) : attachmentUrl ? (
                <div className="w-full flex items-center justify-between bg-white dark:bg-slate-800/85 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 relative z-10">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <div className="text-left truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{fileName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {language === "en" ? "Ready to attach" : "Sẵn sàng đính kèm"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                    title="Remove file"
=======
  // ==========================================
  // RENDER: GIAO DIỆN FORM & SIDEBAR CHUẨN GRID
  // ==========================================
  return (
    <div className="animate-slide-in max-w-6xl w-full mx-auto pb-12">
      {/* HEADER PAGE */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
          Support Center
        </h2>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
          Submit a ticket directly to our technical support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KHỐI TRÁI (CHIẾM 8 CỘT): FORM GỬI TICKET */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Đánh giá sao tương tác */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Overall System Experience
                </h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${formData.rating > 0 ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" : "text-slate-400"}`}
                >
                  {ratingLabel}
                </span>
              </div>
              <div className="flex gap-2 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl w-max border border-slate-100 dark:border-slate-800">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={`transition-colors duration-200 ${
                        star <= (hoverRating || formData.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-transparent text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tiêu đề */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                Subject Title
              </h3>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief summary (e.g., QR Code won't scan, Slot B2 color display error...)"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3.5 text-slate-800 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
              />
            </div>

            {/* 3. Nội dung lời nhắn */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                Detailed Description
              </h3>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe what happened, steps to reproduce the bug, or your detailed proposal..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 text-sm font-medium resize-y"
              ></textarea>
            </div>

            {/* 4. Đính kèm tệp tin */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                Attachments (Screenshots / Logs)
              </h3>
              {!formData.attachment ? (
                <div className="relative group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-blue-50/50 dark:hover:bg-blue-950/10 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud
                    size={28}
                    className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors"
                  />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click to upload or drag screenshot file
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                    PNG, JPG or PDF up to 10MB
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText size={18} />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate font-mono">
                      {formData.attachment.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
>>>>>>> origin/main
                  >
                    <X size={16} />
                  </button>
                </div>
<<<<<<< HEAD
              ) : (
                <div className="py-2">
                  <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === "en" ? "Click or drag file here to attach" : "Nhấp hoặc kéo tệp vào đây để đính kèm"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {language === "en" ? "Max file size: 5MB (PNG, JPG, JPEG, PDF, TXT, DOC)" : "Kích thước tối đa: 5MB (PNG, JPG, JPEG, PDF, TXT, DOC)"}
                  </p>
                </div>
              )}
            </div>

            {fileError && (
              <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} /> {fileError}
              </p>
            )}
          </div>

          {/* Contact details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1">
                {language === "en" ? "Contact Phone" : "Số điện thoại liên hệ"} <span className="text-red-500">*</span>
              </h3>
              <input
                type="text"
                name="customerPhone"
                required
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="09XXXXXXXX"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-2xl px-5 py-3 text-slate-800 dark:text-white focus:outline-none text-sm font-medium"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1">
                {language === "en" ? "Contact Email" : "Email liên hệ"} <span className="text-red-500">*</span>
              </h3>
              <input
                type="email"
                name="customerEmail"
                required
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="user@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-2xl px-5 py-3 text-slate-800 dark:text-white focus:outline-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Form actions */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {language === "en" ? "Discard" : "Xóa nháp"}
            </button>
            <button
              type="submit"
              disabled={
                status === "submitting" ||
                !formData.subject ||
                !formData.message ||
                formData.rating === 0
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-sm active:scale-95"
            >
              {status === "submitting" ? (language === "en" ? "Submitting..." : "Đang gửi...") : (language === "en" ? "Submit Ticket" : "Gửi yêu cầu")}
              {status !== "submitting" && <Send size={14} />}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: MY TICKETS HISTORY */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <History className="text-blue-500" size={20} />
          {language === "en" ? "My Support Tickets" : "Lịch sử yêu cầu hỗ trợ"}
        </h3>

        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
              <ShieldAlert size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h4 className="text-base font-black text-slate-800 dark:text-white">
                {language === "en" ? "No Tickets Submitted" : "Chưa gửi yêu cầu nào"}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                {language === "en"
                  ? "You haven't submitted any support requests yet. Fill the form above to log your first ticket."
                  : "Bạn chưa gửi bất kỳ yêu cầu hỗ trợ nào. Điền vào mẫu bên trên để gửi yêu cầu đầu tiên."}
              </p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const { rating, subject, message, attachment, feedback } = parseDescription(ticket.description);
              const backendRoot = getBackendRootUrl();
              const isExpanded = expandedTicketId === ticket.log_id;

              return (
                <div
                  key={ticket.log_id}
                  className={`bg-white dark:bg-slate-900 border transition-all duration-200 rounded-3xl p-5 shadow-xs relative overflow-hidden ${isExpanded
                      ? "border-blue-500/50 dark:border-blue-500/30 ring-1 ring-blue-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                    }`}
                >
                  {/* Collapsed Header Click Box */}
                  <div
                    onClick={() => setExpandedTicketId(isExpanded ? null : ticket.log_id)}
                    className="flex justify-between items-center cursor-pointer select-none"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                        #TCK-{ticket.log_id}
                      </span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white uppercase text-[10px] tracking-wider font-sans">
                        {getIssueTypeLabel(ticket.issue_type)}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {ticket.report_time ? new Date(ticket.report_time).toLocaleDateString(language === "en" ? "en-US" : "vi-VN") : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${ticket.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                          }`}
                      >
                        {getTicketStatusLabel(ticket.status)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-slide-in">
                      {/* Status Bar */}
                      <div className="flex items-center gap-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">
                          <Clock size={12} />
                          {language === "en" ? "Status:" : "Trạng thái:"}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                          <span className="text-blue-500">{language === "en" ? "Reported" : "Đã gửi"}</span>
                          <span className="text-slate-300 dark:text-slate-700">→</span>
                          <span className={ticket.status === "RESOLVED" ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}>
                            {ticket.status === "RESOLVED" ? (language === "en" ? "Resolved" : "Đã xử lý") : (language === "en" ? "In Review" : "Đang duyệt")}
                          </span>
                        </div>
                      </div>

                      {/* Subject */}
                      {subject && (
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide block">
                            {language === "en" ? "Subject Title" : "Tiêu đề yêu cầu"}
                          </span>
                          <p className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug">{subject}</p>
                        </div>
                      )}

                      {/* Detailed Description */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide block">
                          {language === "en" ? "Detailed Description" : "Mô tả chi tiết"}
                        </span>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          {message}
                        </p>
                      </div>

                      {/* Star experience rating row */}
                      {rating > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide block">
                            {language === "en" ? "Experience Rating" : "Đánh giá trải nghiệm"}
                          </span>
                          <div className="flex gap-0.5 text-amber-400" title={`Rating: ${rating} Stars`}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={15}
                                className={i < rating ? "fill-amber-400 text-amber-500" : "text-slate-200 dark:text-slate-800"}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attachment display */}
                      {attachment && (
                        <div className="pt-1">
                          <a
                             href={`${backendRoot}${attachment}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 hover:dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors shadow-xs"
                          >
                            <Paperclip size={12} className="text-blue-500" />
                            {language === "en" ? "View Attachment" : "Xem tệp đính kèm"}
                          </a>
                        </div>
                      )}

                      {/* Resolved & Feedback Section */}
                      {ticket.resolved_at && (
                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2">
                          <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold">
                            ✓ {language === "en" ? "Resolved on" : "Đã xử lý lúc"} {new Date(ticket.resolved_at).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
                          </p>
                          {feedback ? (
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-4 mt-2">
                              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 block mb-1 uppercase tracking-wider">
                                {language === "en" ? "Resolution Response & Feedback:" : "Phản hồi giải quyết & Nhận xét từ kỹ thuật:"}
                              </span>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                {feedback}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-100/40 dark:border-emerald-900/20 text-xs font-bold">
                              <CheckCircle2 size={13} />
                              <span>
                                {language === "en"
                                  ? "This ticket is resolved. No additional comments left."
                                  : "Yêu cầu đã được xử lý xong. Nhân viên kỹ thuật không để lại phản hồi bổ sung."}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 3: QUICK FAQS */}
      <div className="space-y-6 pt-2">
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <HelpCircle className="text-blue-500" size={20} />
          {language === "en" ? "Quick FAQs" : "Giải đáp nhanh (FAQs)"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
              <MessageSquare size={14} className="text-blue-500" />
              {language === "en" ? "QR Ticket Not Generating?" : "Không tạo được vé QR?"}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-350 mt-2 leading-relaxed font-medium">
              {language === "en"
                ? "Ensure your transaction deposit is processed. Clear browser storage or refresh app token."
                : "Hãy đảm bảo rằng giao dịch thanh toán đặt cọc của bạn đã hoàn tất. Thử làm mới cache trình duyệt hoặc đăng nhập lại."}
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <h4 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle size={14} className="text-amber-500" />
              {language === "en" ? "Camera Plate Scan Failed?" : "Quét biển số xe tại cổng thất bại?"}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-350 mt-2 leading-relaxed font-medium">
              {language === "en"
                ? "Provide your digital reservation ticket QR directly to the gate guard via mobile dashboard view."
                : "Hãy xuất trình trực tiếp mã QR vé đặt chỗ trên điện thoại của bạn cho bảo vệ ở cổng bãi đỗ xe."}
            </p>
=======
              )}
            </div>

            {/* 5. Actions Footer */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 group-hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isAnonymous: e.target.checked,
                      })
                    }
                    className="peer sr-only"
                  />
                  <CheckCircle2
                    size={14}
                    className={`absolute text-blue-600 transition-opacity ${formData.isAnonymous ? "opacity-100" : "opacity-0"}`}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  Submit anonymously (Hide my account profile)
                </span>
              </label>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={
                    status === "submitting" ||
                    !formData.subject ||
                    !formData.message ||
                    formData.rating === 0
                  }
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-sm active:scale-95"
                >
                  {status === "submitting" ? "Submitting..." : "Submit Ticket"}
                  {status !== "submitting" && <Send size={14} />}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ========================================== */}
        {/* CỘT PHẢI (CHIẾM 4 CỘT): SIDEBAR HỖ TRỢ ĐA THEME CHUYỂN ĐỔI LINH HOẠT */}
        {/* ========================================== */}
        <div className="lg:col-span-4 space-y-4 w-full">
          {/* Hộp FAQ - Đã fix: bg-slate-50 ở Light Mode và tự chuyển sang bg-slate-900 ở Dark Mode */}
          <div className="bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-white rounded-3xl p-5 relative overflow-hidden shadow-sm transition-colors duration-300">
            <div className="relative z-10">
              <h3 className="font-bold text-base mb-1 flex items-center gap-2 text-slate-800 dark:text-white">
                <HelpCircle
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />
                Quick Resolution
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 leading-relaxed">
                Check these instant solutions before opening a ticket thread.
              </p>

              <div className="space-y-3.5">
                {/* FAQ Item 1 */}
                <div className="p-3 bg-white border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <MessageSquare size={12} /> QR Ticket Not Generating?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Ensure your transaction deposit is processed. Clear browser
                    storage or refresh app token.
                  </p>
                </div>

                {/* FAQ Item 2 */}
                <div className="p-3 bg-white border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Camera Plate Scan Failed?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Provide your digital reservation ticket QR directly to the
                    gate guard via mobile dashboard view.
                  </p>
                </div>

                {/* FAQ Item 3 */}
                <div className="p-3 bg-white border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <ShieldAlert size={12} /> Payment Dispute?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    All transaction session codes are logged. Standard auditor
                    review takes less than 2 hours.
                  </p>
                </div>
              </div>
            </div>
>>>>>>> origin/main
          </div>
        </div>
      </div>
    </div>
  );
}
