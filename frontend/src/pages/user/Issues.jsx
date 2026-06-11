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
  Sparkles,
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

export default function Issues() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const ratingLabel = useMemo(() => {
    const currentRating = hoverRating || formData.rating;
    switch (currentRating) {
      case 1:
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
  };

  const handleDiscard = () => {
    setFormData({
      rating: 0,
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
      setFileError("File size exceeds 5MB limit.");
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
      setFileError(err.response?.data?.message || "Failed to upload file.");
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
      alert("Please select a rating before submitting.");
      return;
    }

    if (!formData.customerPhone.trim() || !formData.customerEmail.trim()) {
      alert("Contact Phone and Contact Email are required.");
      return;
    }

    setStatus("submitting");
    try {
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
      alert("Error submitting issue: " + errorMsg);
    }
  };

  if (status === "success") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center pt-20">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Ticket Submitted Successfully!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center text-sm">
          Thank you for helping us improve. Our technical staff has logged your ticket and is reviewing the issue.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => {
              handleDiscard();
              setStatus("idle");
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
          >
            Return to Support Center
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
          Support Center
        </h2>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
          Submit support tickets and track resolution status in real-time.
        </p>
      </div>

      {/* SECTION 1: SUBMIT NEW TICKET */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <PlusCircle className="text-blue-500" size={20} />
          File a Support Request
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Overall */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Overall System Experience
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  formData.rating > 0
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

          {/* Category Cards Selector */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
              Issue Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { value: "SYSTEM_ERROR", label: "System & App Error", description: "Bugs, scanners, or transaction errors", icon: ShieldAlert },
                { value: "LOST_TICKET", label: "Lost Ticket ", description: "Lost cards, card replacements", icon: AlertTriangle },
                { value: "WRONG_SLOT", label: "Wrong Slot Occupancy", description: "Another vehicle parked in your assigned slot", icon: AlertCircle },
                { value: "OTHER", label: "Other Feedback / General Inquiry", description: "General inquiries, suggestions, or other issues", icon: HelpCircle }
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.issueType === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, issueType: cat.value })}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-3.5 relative overflow-hidden ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50/10 dark:bg-blue-950/20 dark:border-blue-400 shadow-sm" 
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isSelected 
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
              Subject Title
            </h3>
            <input
              type="text"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief summary (e.g. QR code won't scan on Basement 2)"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-3.5 text-slate-800 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
            />
          </div>

          {/* Detailed Message */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
              Detailed Message
            </h3>
            <textarea
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder="Please describe in detail what happened, any error codes displayed, or steps to reproduce..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 text-sm font-medium resize-y"
            ></textarea>
          </div>

          {/* Attachment upload */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
              <Paperclip size={16} className="text-blue-500" />
              Attach File/Screenshot (Optional)
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
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Uploading attachment...</span>
                </div>
              ) : attachmentUrl ? (
                <div className="w-full flex items-center justify-between bg-white dark:bg-slate-800/85 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 relative z-10">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <div className="text-left truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{fileName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Ready to attach</p>
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
                    Click or drag file here to attach
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Max file size: 5MB (PNG, JPG, JPEG, PDF, TXT, DOC)
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
                Contact Phone <span className="text-red-500">*</span>
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
                Contact Email <span className="text-red-500">*</span>
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-sm active:scale-95"
            >
              {status === "submitting" ? "Submitting..." : "Submit Ticket"}
              {status !== "submitting" && <Send size={14} />}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: MY TICKETS HISTORY */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <History className="text-blue-500" size={20} />
          My Support Tickets
        </h3>
        
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
              <ShieldAlert size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h4 className="text-base font-black text-slate-800 dark:text-white">No Tickets Submitted</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                You haven't submitted any support requests yet. Fill the form above to log your first ticket.
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
                  className={`bg-white dark:bg-slate-900 border transition-all duration-200 rounded-3xl p-5 shadow-xs relative overflow-hidden ${
                    isExpanded
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
                        {ticket.issue_type?.replace('_', ' ')}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {ticket.report_time ? new Date(ticket.report_time).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          ticket.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                        }`}
                      >
                        {ticket.status}
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
                          Status:
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                          <span className="text-blue-500">Reported</span>
                          <span className="text-slate-300 dark:text-slate-700">→</span>
                          <span className={ticket.status === "RESOLVED" ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}>
                            {ticket.status === "RESOLVED" ? "Resolved" : "In Review"}
                          </span>
                        </div>
                      </div>

                      {/* Subject */}
                      {subject && (
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Subject Title</span>
                          <p className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug">{subject}</p>
                        </div>
                      )}

                      {/* Detailed Description */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Detailed Description</span>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          {message}
                        </p>
                      </div>

                      {/* Star experience rating row */}
                      {rating > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Experience Rating</span>
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
                            View Attachment
                          </a>
                        </div>
                      )}

                      {/* Resolved & Feedback Section */}
                      {ticket.resolved_at && (
                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2">
                          <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold">
                            ✓ Resolved on {new Date(ticket.resolved_at).toLocaleString()}
                          </p>
                          {feedback ? (
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-4 mt-2">
                              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 block mb-1 uppercase tracking-wider">
                                Resolution Response & Feedback:
                              </span>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                {feedback}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-100/40 dark:border-emerald-900/20 text-xs font-bold">
                              <CheckCircle2 size={13} />
                              <span>This ticket is resolved. No additional comments left.</span>
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
          Quick FAQs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
              <MessageSquare size={14} className="text-blue-500" /> QR Ticket Not Generating?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-350 mt-2 leading-relaxed font-medium">
              Ensure your transaction deposit is processed. Clear browser storage or refresh app token.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <h4 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle size={14} className="text-amber-500" /> Camera Plate Scan Failed?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-350 mt-2 leading-relaxed font-medium">
              Provide your digital reservation ticket QR directly to the gate guard via mobile dashboard view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
