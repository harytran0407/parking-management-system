import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound, CheckCircle2, RefreshCcw, Eye, EyeOff, ShieldAlert, Zap } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { toast } from "sonner";
import api from "../utils/api";

const t = {
  vi: {
    backToLogin: "Quay lại đăng nhập",
    title: "eParking",
    subtitle: "Khôi phục mật khẩu",
    emailOrPhone: "Email hoặc Số điện thoại",
    emailOrPhonePlaceholder: "Nhập email hoặc số điện thoại đã đăng ký",
    enterEmailOrPhoneToast: "Vui lòng nhập email hoặc số điện thoại.",
    sendRequestBtn: "Gửi mã OTP khôi phục",
    processing: "Đang xử lý...",
    dispatchSuccessToast: "Mã xác thực đã được gửi thành công!",
    verificationFailedToast: "Xác thực tài khoản thất bại. Vui lòng thử lại.",
    enterOtpCode: "Vui lòng nhập mã xác thực gửi đến",
    otpPlaceholder: "Nhập mã OTP",
    invalidOtpToast: "Vui lòng nhập mã OTP hợp lệ.",
    continueBtn: "Tiếp tục",
    changeContactLink: "Thay đổi Email / Số điện thoại",
    newPasswordLabel: "Mật khẩu mới",
    newPasswordPlaceholder: "Tối thiểu 8 ký tự bảo mật",
    confirmNewPasswordLabel: "Xác nhận mật khẩu mới",
    confirmNewPasswordPlaceholder: "Nhập lại mật khẩu mới",
    passwordWeakToast: "Mật khẩu phải từ 8 ký tự trở lên, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
    passwordMismatchToast: "Mật khẩu xác nhận không trùng khớp.",
    resetBtn: "Đặt lại mật khẩu",
    updating: "Đang cập nhật...",
    cancelRestartLink: "Hủy và bắt đầu lại",
    resetSuccessToast: "Đặt lại mật khẩu thành công!",
    resetFailedToast: "Đặt lại mật khẩu thất bại.",
    successMsg: "Mật khẩu của bạn đã được đặt lại thành công!",
    returnLoginBtn: "Quay lại trang Đăng nhập",
  },
  en: {
    backToLogin: "Back to login",
    title: "eParking",
    subtitle: "Forgot Password Recovery",
    emailOrPhone: "Email or Phone Number",
    emailOrPhonePlaceholder: "Enter registered email or phone",
    enterEmailOrPhoneToast: "Please enter your email or phone number.",
    sendRequestBtn: "Send OTP Code",
    processing: "Processing...",
    dispatchSuccessToast: "OTP code has been sent successfully!",
    verificationFailedToast: "Account verification failed. Please try again.",
    enterOtpCode: "Please enter the OTP code sent to",
    otpPlaceholder: "Enter OTP code",
    invalidOtpToast: "Please enter a valid OTP code.",
    continueBtn: "Continue",
    changeContactLink: "Change Email / Phone Number",
    newPasswordLabel: "New Password",
    newPasswordPlaceholder: "Minimum 8 secure characters",
    confirmNewPasswordLabel: "Confirm New Password",
    confirmNewPasswordPlaceholder: "Re-enter new password",
    passwordWeakToast: "Password must be at least 8 characters, including uppercase, lowercase, numbers, and special characters.",
    passwordMismatchToast: "Confirm password does not match.",
    resetBtn: "Reset My Password",
    updating: "Updating...",
    cancelRestartLink: "Cancel and restart",
    resetSuccessToast: "Password updated successfully!",
    resetFailedToast: "Failed to reset password.",
    successMsg: "Your password has been reset successfully!",
    returnLoginBtn: "Return to Login Page",
  }
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);

  // Flow control: 'request' -> 'otp' -> 'reset' -> 'success'
  const [step, setStep] = useState("request");

  // State lưu trữ thông tin (Xóa bỏ hoàn toàn state 'method')
  const [inputValue, setInputValue] = useState(""); // Dùng chung cho cả Email/SĐT
  const [otpCode, setOtpCode] = useState("");
  const [otpArray, setOtpArray] = useState(new Array(6).fill(""));
  const otpRefs = useRef([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================
  // BƯỚC 1: GỬI YÊU CẦU KHÔI PHỤC (EMAIL HOẶC SĐT CHUNG 1 Ô)
  // ============================================================
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error(t[language].enterEmailOrPhoneToast);
      return;
    }

    setLoading(true);
    try {
      // Gửi lên key duy nhất 'email_or_phone' khớp chuẩn DTO Backend
      const response = await api.post("/auth/forgot-password", {
        email_or_phone: inputValue.trim(),
      });

      if (response.data && response.data.success) {
        toast.success(t[language].dispatchSuccessToast);
        setStep("otp");
      }
    } catch (err) {
      console.error("[Recovery] Request initialization failed:", err);
      toast.error(err.response?.data?.message || t[language].verificationFailedToast);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // BƯỚC 2: TIẾP NHẬN MÃ OTP
  // ============================================================
  const handleOtpChange = (val, idx) => {
    const cleanVal = val.replace(/\D/g, "");
    const newOtpArray = [...otpArray];
    newOtpArray[idx] = cleanVal.slice(-1);
    setOtpArray(newOtpArray);
    setOtpCode(newOtpArray.join(""));

    // Auto focus next input
    if (cleanVal && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!otpArray[idx] && idx > 0) {
        const newOtpArray = [...otpArray];
        newOtpArray[idx - 1] = "";
        setOtpArray(newOtpArray);
        setOtpCode(newOtpArray.join(""));
        otpRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtpArray = new Array(6).fill("");
      for (let i = 0; i < pastedData.length; i++) {
        newOtpArray[i] = pastedData[i];
      }
      setOtpArray(newOtpArray);
      setOtpCode(newOtpArray.join(""));
      
      const targetIndex = Math.min(pastedData.length, 5);
      otpRefs.current[targetIndex]?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast.error(t[language].invalidOtpToast);
      return;
    }
    setStep("reset");
  };

  const handleRestartFlow = () => {
    setOtpCode("");
    setOtpArray(new Array(6).fill(""));
    setNewPassword("");
    setConfirmPassword("");
    setStep("request");
  };

  // ============================================================
  // BƯỚC 3: ĐỔI MẬT KHẨU MỚI (BẮN CẢ OTP + PASS MỚI LÊN SERVER)
  // ============================================================
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error(t[language].passwordWeakToast);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t[language].passwordMismatchToast);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/reset-password", {
        email_or_phone: inputValue.trim(),
        otp: otpCode.trim(),
        new_password: newPassword,
      });

      if (response.data && response.data.success) {
        toast.success(t[language].resetSuccessToast);
        setStep("success");
      }
    } catch (err) {
      console.error("[Recovery] Reset password submission failed:", err);
      toast.error(err.response?.data?.message || t[language].resetFailedToast);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=1400')`,
          filter: "brightness(0.35)",
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(120deg, rgba(29,78,216,0.6) 0%, rgba(15,23,42,0.25) 100%)",
        }}
      />

      {/* Back to Login Button */}
      <Link to="/login" className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200 z-10">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t[language].backToLogin}</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-md bg-white border border-white/20 shadow-2xl rounded-xl p-8 relative">

          {/* Language Selector */}
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-black text-slate-600 hover:text-slate-800 rounded-lg transition-all focus:outline-none flex items-center gap-1.5"
              title={language === "en" ? "Switch to Vietnamese" : "Chuyển sang Tiếng Anh"}
            >
              <span>🌐</span>
              <span>{language === "en" ? "EN" : "VI"}</span>
            </button>
          </div>

          <div className="text-center mb-6">
            <Link to="/" className="inline-block hover:opacity-85 transition-opacity">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t[language].title}</h1>
            </Link>
            <p className="text-slate-500 font-medium text-sm mt-1">{t[language].subtitle}</p>
          </div>

          {/* ============================================================
              BƯỚC 1: FORM NHẬP EMAIL HOẶC SĐT
             ============================================================ */}
          {step === "request" && (
            <form onSubmit={handleRequestSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">{t[language].emailOrPhone}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t[language].emailOrPhonePlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-450 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <RefreshCcw size={14} className="animate-spin" />}
                <span>{loading ? t[language].processing : t[language].sendRequestBtn}</span>
              </button>
            </form>
          )}

          {/* ============================================================
              BƯỚC 2: FORM NHẬP MÃ OTP XÁC THỰC
             ============================================================ */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-gray-600 text-sm mb-2 font-medium">
                {t[language].enterOtpCode} <br />
                <span className="text-blue-600 font-mono font-semibold">{inputValue}</span>
              </div>

              <div className="flex justify-between gap-2 my-5" onPaste={handleOtpPaste}>
                {otpArray.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-12 h-14 text-center text-2xl font-bold text-slate-900 bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
                  />
                ))}
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center">
                <span>{t[language].continueBtn}</span>
              </button>

              <div className="text-center mt-2">
                <button type="button" onClick={handleRestartFlow} className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold">
                  {t[language].changeContactLink}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================
              BƯỚC 3: FORM ĐỔI MẬT KHẨU MỚI
             ============================================================ */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">{t[language].newPasswordLabel}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t[language].newPasswordPlaceholder}
                    className="w-full px-4 pr-10 py-2.5 bg-slate-50/80 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-450 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 transition">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">{t[language].confirmNewPasswordLabel}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t[language].confirmNewPasswordPlaceholder}
                  className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-455 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <RefreshCcw size={14} className="animate-spin" />}
                <span>{loading ? t[language].updating : t[language].resetBtn}</span>
              </button>

              <div className="text-center mt-2">
                <button type="button" onClick={handleRestartFlow} className="text-xs text-blue-650 hover:underline font-semibold">
                  {t[language].cancelRestartLink}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================
              BƯỚC 4: MÀN HÌNH CHÚC MỪNG THÀNH CÔNG HOÀN TOÀN
             ============================================================ */}
          {step === "success" && (
            <div className="text-center space-y-5 py-2">
              <div className="flex justify-center text-green-500">
                <CheckCircle2 size={56} className="animate-bounce" />
              </div>
              <p className="text-slate-750 text-blue-600 font-semibold">{t[language].successMsg}</p>
              <button onClick={() => navigate("/login")} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200">
                {t[language].returnLoginBtn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
