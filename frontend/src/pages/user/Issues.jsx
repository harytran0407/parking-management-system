import React, { useState, useEffect, useMemo } from "react";
import {
  Send,
  Star,
  HelpCircle,
  X,
  FileText,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
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
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  return baseUrl.replace("/api/v1", "");
};
import api from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";

export default function Issues() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const getTicketStatusLabel = (status) => {
    switch (status) {
      case "RESOLVED": return language === "en" ? "Resolved" : "Đã xử lý";
      case "CLOSED": return language === "en" ? "Closed" : "Đã đóng";
      case "IN_PROGRESS": return language === "en" ? "In Progress" : "Đang xử lý";
      default: return language === "en" ? "Open" : "Chờ xử lý";
    }
  };

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [formData, setFormData] = useState({
    rating: 0,
    subject: "",
    message: "",
    customerPhone: "",
    customerEmail: "",
  });

  const VN_PHONE_REGEX = /^(0)(3[2-9]|5[6-9]|7[0|6-9]|8[0-9]|9[0-9])[0-9]{7}$/;
  const [phoneError, setPhoneError] = useState("");

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
      const response = await api.get("/feedbacks/MyFeedback");
      if (response.data && response.data.success) {
        setTickets(response.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách phản hồi:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const ratingLabel = useMemo(() => {
    const currentRating = hoverRating || formData.rating;
    switch (currentRating) {
      case 1:
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "customerPhone") {
      if (e.target.value && !VN_PHONE_REGEX.test(e.target.value)) {
        setPhoneError(language === "en" ? "Invalid Vietnamese phone number (e.g. 0901234567)" : "Số điện thoại Việt Nam không hợp lệ (VD: 0901234567)");
      } else {
        setPhoneError("");
      }
    }
  };



  const handleDiscard = () => {
    setFormData({
      rating: 0,
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
      const response = await api.post("/feedbacks/upload", formDataUpload, {
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
      return;
    }

    if (!VN_PHONE_REGEX.test(formData.customerPhone.trim())) {
      alert(language === "en" ? "Please enter a valid Vietnamese phone number (e.g. 0901234567)." : "Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng số điện thoại Việt Nam (VD: 0901234567).");
      return;
    }

    setStatus("submitting");
    try {
      const payload = {
        full_name: user?.full_name || user?.username || "Guest",
        title: formData.subject,
        content: formData.message,
        star_rating: formData.rating,
        customer_phone: formData.customerPhone || null,
        customer_email: formData.customerEmail || null,
        attachment_url: attachmentUrl || null,
      };

      const response = await api.post("/feedbacks", payload);
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
      alert((language === "en" ? "Error submitting feedback: " : "Lỗi khi gửi phản hồi: ") + errorMsg);
    }
  };

  if (status === "success") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center pt-20">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          {language === "en" ? "Ticket Submitted Successfully!" : "Đã gửi yêu cầu hỗ trợ thành công!"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center text-sm">
          {language === "en"
            ? "Thank you for helping us improve. Our technical staff has logged your ticket and is reviewing the issue."
            : "Cảm ơn bạn đã đóng góp ý kiến để cải thiện hệ thống. Nhân viên kỹ thuật đã ghi nhận và đang tiến hành xử lý."}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => {
              handleDiscard();
              setStatus("idle");
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
          >
            {language === "en" ? "Return to Support Center" : "Quay lại Trung tâm hỗ trợ"}
          </button>
        </div>
      </div>
    );
  }

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
                  >
                    <X size={16} />
                  </button>
                </div>
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
                maxLength={10}
                className={`w-full bg-slate-50 dark:bg-slate-800/50 border ${phoneError ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"} rounded-2xl px-5 py-3 text-slate-800 dark:text-white focus:outline-none text-sm font-medium`}
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1.5 ml-1">{phoneError}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1">
                {language === "en" ? "Contact Email" : "Email liên hệ"} <span className="text-red-500">*</span>
              </h3>
              <input
                type="email"
                name="customerEmail"
                required
                readOnly
                value={formData.customerEmail}
                placeholder="user@example.com"
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-400 dark:text-slate-500 focus:outline-none text-sm font-medium cursor-not-allowed select-none"
              />
            </div>
          </div>

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
          {language === "en" ? "My Reported Issues" : "Lịch sử báo cáo sự cố"}
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
              const rating = ticket.star_rating;
              const subject = ticket.title;
              const message = ticket.content;
              const attachment = ticket.attachment_url;
              const feedback = ticket.response_note;
              const backendRoot = getBackendRootUrl();
              const isExpanded = expandedTicketId === ticket.feedback_id;

              return (
                <div
                  key={ticket.feedback_id}
                  className={`bg-white dark:bg-slate-900 border transition-all duration-200 rounded-3xl p-5 shadow-xs relative overflow-hidden ${isExpanded
                      ? "border-blue-500/50 dark:border-blue-500/30 ring-1 ring-blue-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                     }`}
                >
                  {/* Collapsed Header Click Box */}
                  <div
                    onClick={() => setExpandedTicketId(isExpanded ? null : ticket.feedback_id)}
                    className="flex justify-between items-center cursor-pointer select-none"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                        #TCK-{ticket.feedback_id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString(language === "en" ? "en-US" : "vi-VN") : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${ticket.status === "RESOLVED" || ticket.status === "CLOSED"
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
                          <span className={ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}>
                            {getTicketStatusLabel(ticket.status)}
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
                          <div className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold flex flex-wrap gap-x-2 items-center">
                            <span>✓</span>
                            {ticket.resolved_by && (
                              <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase">
                                {language === "en" ? "Resolved by:" : "Người duyệt:"} {ticket.resolved_by}
                              </span>
                            )}
                            <span>
                              {language === "en" ? "Resolved on" : "Đã xử lý lúc"} {new Date(ticket.resolved_at).toLocaleString(language === "en" ? "en-US" : "vi-VN")}
                            </span>
                          </div>
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
    </div>
  );
}