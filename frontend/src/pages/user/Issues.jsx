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
} from "lucide-react";

const getBackendRootUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5077";
  return baseUrl.replace("/api/v1", "");
};
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

export default function Issues() {
  const navigate = useNavigate();

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

  // File Upload states
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileName, setFileName] = useState("");

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
    const ratingMatch = cleanedDesc.match(/\[Rating:\s*(\d)★\]/);
    if (ratingMatch) {
      rating = parseInt(ratingMatch[1], 10);
      cleanedDesc = cleanedDesc.replace(/\[Rating:\s*\d★\]/, "").trim();
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
      customerPhone: "",
      customerEmail: "",
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
            onClick={() => navigate("/user")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99]"
          >
            Return to Dashboard
          </button>
          <button
            onClick={() => {
              handleDiscard();
              setStatus("idle");
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-colors"
          >
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-in max-w-6xl w-full mx-auto pb-12">
      {/* HEADER PAGE */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
          Support Center
        </h2>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
          Submit support tickets and track resolution status in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT FORM */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
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

            {/* Category */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                Issue Category
              </h3>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-slate-800 dark:text-white focus:outline-none transition-all text-sm font-medium"
              >
                <option value="SYSTEM_ERROR">System & App Error</option>
                <option value="LOST_TICKET">Lost RFID Ticket Card</option>
                <option value="WRONG_SLOT">Wrong Slot occupancy conflict</option>
                <option value="OTHER">Other feedback / General inquiry</option>
              </select>
            </div>

            {/* Title */}
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

            {/* Description */}
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

            {/* File Attachment Upload */}
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
                        <p className="text-xs font-bold text-slate-850 dark:text-white truncate">{fileName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Ready to attach</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-955/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                      Click or drag file here to attach
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
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

            {/* Contact Details */}
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

            {/* Submit / Discard Buttons */}
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

        {/* RIGHT SIDEBAR (TICKETS LIST & FAQ) */}
        <div className="lg:col-span-4 space-y-6 w-full">
          {/* TICKETS TRACKER LIST */}
          <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
              <Clock size={18} className="text-blue-500" />
              My Support Tickets
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mb-4">
              Track live updates on your submitted bug reports.
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {tickets.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  No support tickets reported.
                </div>
              ) : (
                tickets.map((ticket) => {
                  const { rating, subject, message, attachment, feedback } = parseDescription(ticket.description);
                  const backendRoot = getBackendRootUrl();

                  return (
                    <div
                      key={ticket.log_id}
                      className="p-4 bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800/80 rounded-2xl space-y-3.5 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          #TCK-{ticket.log_id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${ticket.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : "bg-blue-50 text-blue-600 dark:bg-blue-950/20"}`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 text-xs font-sans">
                        <div className="flex justify-between items-center">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider font-sans">
                            {ticket.issue_type?.replace('_', ' ')}
                          </h4>
                          
                          {/* Star rating icons */}
                          {rating > 0 && (
                            <div className="flex gap-0.5 text-amber-400" title={`Rating: ${rating} Stars`}>
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  className={i < rating ? "fill-amber-400 text-amber-400 shrink-0" : "text-slate-300 dark:text-slate-700 shrink-0"}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Subject */}
                        {subject && (
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Subject Title</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{subject}</p>
                          </div>
                        )}

                        {/* Description / Message */}
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Detailed Description</span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">{message}</p>
                        </div>
                      </div>

                      {/* Display attachment if it exists */}
                      {attachment && (
                        <div className="pt-1">
                          <a
                            href={`${backendRoot}${attachment}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-750/80 rounded-xl text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm w-full justify-center"
                          >
                            <Paperclip size={10} />
                            View Attachment
                          </a>
                        </div>
                      )}

                      {ticket.resolved_at && (
                        <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                          <p className="text-[9px] text-emerald-500 dark:text-emerald-400 font-bold">
                            ✓ Resolved on {new Date(ticket.resolved_at).toLocaleDateString()}
                          </p>
                          {feedback && (
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg p-2 mt-1">
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Staff Feedback:</span>
                              <p className="text-[10px] text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                                {feedback}
                              </p>
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

          {/* QUICK FAQs */}
          <div className="bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-white rounded-3xl p-5 relative overflow-hidden shadow-sm transition-colors duration-300">
            <div className="relative z-10">
              <h3 className="font-bold text-base mb-1 flex items-center gap-2 text-slate-800 dark:text-white">
                <HelpCircle size={18} className="text-blue-600 dark:text-blue-400" />
                Quick FAQs
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 leading-relaxed">
                Check these instant solutions before opening a ticket thread.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-white border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 rounded-xl">
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <MessageSquare size={12} /> QR Ticket Not Generating?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Ensure your transaction deposit is processed. Clear browser storage or refresh app token.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 rounded-xl">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Camera Plate Scan Failed?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Provide your digital reservation ticket QR directly to the gate guard via mobile dashboard view.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
