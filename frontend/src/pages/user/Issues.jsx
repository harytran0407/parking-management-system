import React, { useState } from 'react';
import { 
  Send, Star, UploadCloud, HelpCircle, HeartHandshake, 
  Clock, CheckCircle2, X, FileText 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; 

export default function Issues() {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // ==========================================
  // FORM STATE
  // ==========================================
  const [formData, setFormData] = useState({
    rating: 0,
    subject: '',   
    message: '',
    isAnonymous: false,
    attachment: null
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success'

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
      subject: '',   
      message: '',
      isAnonymous: false,
      attachment: null
    });
  };

  // ==========================================
  // [API INTEGRATION] - SUBMIT FEEDBACK
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    setStatus('submitting');
    try {
      // Giả lập API gọi lên server
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus('success');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setStatus('idle');
    }
  };

  // ==========================================
  // RENDER: TRẠNG THÁI THÀNH CÔNG
  // ==========================================
  if (status === 'success') {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center pt-20">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Feedback Received!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">
          Thank you for helping us improve SmartPark Pro. Your voice truly matters.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button 
            onClick={() => navigate('/user')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30"
          >
            Return to Dashboard
          </button>
          <button 
            onClick={() => { handleDiscard(); setStatus('idle'); }}
            className="w-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            Submit Another Feedback
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <div className="animate-slide-in max-w-6xl w-full mx-auto pb-12">
      
      {/* HEADER BÀI VIẾT (Nằm ngoài form) */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Your Voice Matters</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-3xl">
          Help us improve SmartPark Pro. Whether it's a compliment, a bug report, or a feature request, we listen to every piece of feedback from our drivers.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* ========================================== */}
        {/* CỘT TRÁI: FORM FEEDBACK */}
        {/* ========================================== */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Đánh giá sao */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Overall Experience</h3>
              <div className="flex gap-2">
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
                      size={32} 
                      className={`transition-colors duration-200 ${
                        star <= (hoverRating || formData.rating) 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'fill-slate-100 text-slate-200 dark:fill-slate-800 dark:text-slate-700'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tiêu đề (Chủ đề) */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">What's this feedback about?</h3>
              <input 
                type="text" 
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="E.g., Issue with QR Scanner, Great service today..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-0 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* 3. Chi tiết */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Detailed Comments</h3>
              <textarea 
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe your experience or suggestion in detail..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-0 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 resize-y"
              ></textarea>
            </div>

            {/* 4. Upload File */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Attachments (Optional)</h3>
              
              {!formData.attachment ? (
                <div className="relative group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud size={32} className="text-slate-400 group-hover:text-blue-500 mb-3 transition-colors" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Drop screenshots or click to upload</p>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">PNG, JPG or PDF up to 10MB</p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg text-blue-600 dark:text-blue-300 shrink-0">
                      <FileText size={20} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {formData.attachment.name}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={removeFile}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* 5. Footer Actions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Checkbox ẩn danh */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 group-hover:border-blue-500 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                    className="peer sr-only"
                  />
                  <CheckCircle2 size={14} className={`absolute text-blue-600 transition-opacity ${formData.isAnonymous ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 select-none group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                  Submit anonymously
                </span>
              </label>

              {/* Nút bấm */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  type="button" 
                  onClick={handleDiscard}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={status === 'submitting' || !formData.subject || !formData.message || formData.rating === 0}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                  {status === 'submitting' ? 'Submitting...' : 'Submit Feedback'}
                  {!status && <Send size={16} />}
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* ========================================== */}
        {/* CỘT PHẢI: SIDEBAR THÔNG TIN */}
        {/* ========================================== */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          
          {/* Card 1: Quick Help */}
          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Quick Help</h3>
              <p className="text-blue-100 text-sm mb-5">Common questions about our portal and facilities.</p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3 cursor-pointer group">
                  <div className="bg-blue-500/50 p-1 rounded-md mt-0.5 group-hover:bg-white group-hover:text-blue-600 transition-colors"><HelpCircle size={14} /></div>
                  <span className="text-sm font-medium group-hover:underline">How do I claim parking rewards?</span>
                </li>
                <li className="flex items-start gap-3 cursor-pointer group">
                  <div className="bg-blue-500/50 p-1 rounded-md mt-0.5 group-hover:bg-white group-hover:text-blue-600 transition-colors"><HelpCircle size={14} /></div>
                  <span className="text-sm font-medium group-hover:underline">Staff behavior report policy</span>
                </li>
                <li className="flex items-start gap-3 cursor-pointer group">
                  <div className="bg-blue-500/50 p-1 rounded-md mt-0.5 group-hover:bg-white group-hover:text-blue-600 transition-colors"><HelpCircle size={14} /></div>
                  <span className="text-sm font-medium group-hover:underline">Payment dispute process</span>
                </li>
              </ul>
            </div>
            {/* Watermark Icon */}
            <HelpCircle className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10" />
          </div>

          {/* Card 2: Driver-First Policy */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartHandshake size={24} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Driver-First Policy</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              We've implemented over 24 driver suggestions in the last 3 months. Your ideas directly shape the future of SmartPark Pro.
            </p>
          </div>

          {/* Card 3: Live Feedback Status */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Feedback Status</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Average Response Time</p>
                  <p className="font-bold text-slate-800 dark:text-white">1.5 Hours</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Resolution Rate</p>
                  <p className="font-bold text-slate-800 dark:text-white">94.2%</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}