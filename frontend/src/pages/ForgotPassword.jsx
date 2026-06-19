import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound, CheckCircle2, RefreshCcw, Eye, EyeOff,ShieldAlert,Zap } from "lucide-react";
import { toast } from "sonner";
import api from "../utils/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Flow control: 'request' -> 'otp' -> 'reset' -> 'success'
  const [step, setStep] = useState("request");

  // State lưu trữ thông tin (Xóa bỏ hoàn toàn state 'method')
  const [inputValue, setInputValue] = useState(""); // Dùng chung cho cả Email/SĐT
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================
  // BƯỚC 1: GỬI YÊU CẦU KHÔI PHỤC (EMAIL HOẶC SĐT CHUNG 1 Ô)
  // ============================================================
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error("Please enter your email or phone number.");
      return;
    }

    setLoading(true);
    try {
      // Gửi lên key duy nhất 'email_or_phone' khớp chuẩn DTO Backend
      const response = await api.post("/auth/forgot-password", {
        email_or_phone: inputValue.trim(),
      });

      if (response.data && response.data.success) {
        toast.success("Verification code has been dispatched successfully!");
        setStep("otp");
      }
    } catch (err) {
      console.error("[Recovery] Request initialization failed:", err);
      toast.error(err.response?.data?.message || "Account verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // BƯỚC 2: TIẾP NHẬN MÃ OTP
  // ============================================================
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      toast.error("Please enter a valid OTP code.");
      return;
    }
    setStep("reset");
  };

  const handleRestartFlow = () => {
    setOtpCode("");
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
      toast.error("Password must be at least 8 characters, including uppercase, lowercase, numbers, and special characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Confirm password does not match.");
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
        toast.success("Password updated successfully!");
        setStep("success");
      }
    } catch (err) {
      console.error("[Recovery] Reset password submission failed:", err);
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-25"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1920')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/80 to-slate-950 z-0" />

      {/* Back to Login Button */}
      <Link to="/login" className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200 z-10">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to login</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-md bg-[#1e293b]/70 border border-slate-700/50 shadow-2xl rounded-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">eParking</h1>
            <p className="text-slate-400 text-sm">Forgot Password Recovery</p>
          </div>

          {/* ============================================================
              BƯỚC 1: FORM NHẬP EMAIL HOẶC SĐT (ĐÃ GỘP THÀNH 1 INPUT)
             ============================================================ */}
          {step === "request" && (
            <form onSubmit={handleRequestSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email or Phone Number</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter registered email or phone"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <RefreshCcw size={14} className="animate-spin" />}
                <span>{loading ? "Processing..." : "Send Recovery Request"}</span>
              </button>
            </form>
          )}

          {/* ============================================================
              BƯỚC 2: FORM NHẬP MÃ OTP XÁC THỰC
             ============================================================ */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-sm text-slate-300 mb-2">
                Please enter the verification code sent to <br />
                <span className="text-blue-400 font-mono font-semibold">{inputValue}</span>
              </div>


              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter OTP code"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-center font-bold tracking-[0.3em] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center">
                <span>Continue</span>
              </button>

              <div className="text-center mt-2">
                <button type="button" onClick={() => setStep("request")} className="text-xs text-blue-500 hover:underline font-medium">
                  Change Email / Phone Number
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
                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 secure characters"
                    className="w-full px-4 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <RefreshCcw size={14} className="animate-spin" />}
                <span>{loading ? "Updating..." : "Reset My Password"}</span>
              </button>

              <div className="text-center mt-2">
                <button type="button" onClick={() => setStep("request")} className="text-xs text-blue-500 hover:underline font-medium">
                  Cancel and restart
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
              <p className="text-slate-200 font-medium">Your password has been reset successfully!</p>
              <button onClick={() => navigate("/login")} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200">
                Return to Login Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
