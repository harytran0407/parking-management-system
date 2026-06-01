import React, { useState, useMemo } from "react";
import { Send, Star, UploadCloud, HelpCircle, X, FileText, CheckCircle2, MessageSquare, AlertTriangle, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Issues() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, attachment: e.target.files[0] });
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, attachment: null });
  };

  const handleDiscard = () => {
    setFormData({
      rating: 0,
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
      return;
    }

    setStatus("submitting");
    try {
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
  if (status === "success") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center pt-20">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Feedback Received!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center text-sm">
          Thank you for helping us improve SmartPark Pro. Your issue ticket has been registered in the system.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate("/user")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99]">
            Return to Dashboard
          </button>
          <button
            onClick={() => {
              handleDiscard();
              setStatus("idle");
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-colors">
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: GIAO DIỆN FORM & SIDEBAR CHUẨN GRID
  // ==========================================
  return (
    <div className="animate-slide-in max-w-6xl w-full mx-auto pb-12">
      {/* HEADER PAGE */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Support Center</h2>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">Submit a ticket directly to our technical support team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KHỐI TRÁI (CHIẾM 8 CỘT): FORM GỬI TICKET */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Đánh giá sao tương tác */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Overall System Experience</h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${formData.rating > 0 ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" : "text-slate-400"}`}>
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
                    className="focus:outline-none transition-transform hover:scale-110">
                    <Star
                      size={28}
                      className={`transition-colors duration-200 ${
                        star <= (hoverRating || formData.rating) ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tiêu đề */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Subject Title</h3>
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
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Detailed Description</h3>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe what happened, steps to reproduce the bug, or your detailed proposal..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 text-sm font-medium resize-y"></textarea>
            </div>

            {/* 4. Đính kèm tệp tin */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Attachments (Screenshots / Logs)</h3>
              {!formData.attachment ? (
                <div className="relative group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-blue-50/50 dark:hover:bg-blue-950/10 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud size={28} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload or drag screenshot file</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">PNG, JPG or PDF up to 10MB</p>
                </div>
              ) : (
                <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText size={18} />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate font-mono">{formData.attachment.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0">
                    <X size={16} />
                  </button>
                </div>
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
                  <CheckCircle2 size={14} className={`absolute text-blue-600 transition-opacity ${formData.isAnonymous ? "opacity-100" : "opacity-0"}`} />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  Submit anonymously (Hide my account profile)
                </span>
              </label>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={status === "submitting" || !formData.subject || !formData.message || formData.rating === 0}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-sm active:scale-95">
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
                <HelpCircle size={18} className="text-blue-600 dark:text-blue-400" />
                Quick Resolution
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 leading-relaxed">Check these instant solutions before opening a ticket thread.</p>

              <div className="space-y-3.5">
                {/* FAQ Item 1 */}
                <div className="p-3 bg-white border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <MessageSquare size={12} /> QR Ticket Not Generating?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Ensure your transaction deposit is processed. Clear browser storage or refresh app token.
                  </p>
                </div>

                {/* FAQ Item 2 */}
                <div className="p-3 bg-white border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Camera Plate Scan Failed?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Provide your digital reservation ticket QR directly to the gate guard via mobile dashboard view.
                  </p>
                </div>

                {/* FAQ Item 3 */}
                <div className="p-3 bg-white border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <ShieldAlert size={12} /> Payment Dispute?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    All transaction session codes are logged. Standard auditor review takes less than 2 hours.
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
