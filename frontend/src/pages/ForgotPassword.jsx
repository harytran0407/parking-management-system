import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// import axios from 'axios'; //

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Quản lý các bước luồng đi: 'request' -> 'otp' -> 'reset' -> 'success'
  const [step, setStep] = useState("request");
  const [method, setMethod] = useState("email"); // 'email' hoặc 'phone'

  const [inputValue, setInputValue] = useState(""); // Lưu email hoặc số điện thoại người dùng nhập
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ============================================================
  // BƯỚC 1: GỬI YÊU CẦU KHÔI PHỤC (GỬI LINK EMAIL HOẶC MÃ OTP SĐT)
  // ============================================================
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error("Please enter your information.");
      return;
    }

    setLoading(true);
    try {
      /* // 🛠️ ===== AXIOS REAL API CALL (BƯỚC 1) =====
      // Cấu trúc Request Body truyền lên khớp với đặc tả hệ thống
      const requestPayload = {
        method_type: method, // 'email' hoặc 'phone'
        account_value: inputValue // Giá trị chuỗi email hoặc sđt người dùng nhập
      };

      const response = await axios.post('/api/v1/auth/forgot-password-request', requestPayload);

      if (response.data.success) {
        if (method === 'email') {
          toast.success("A password reset link has been sent to your email!");
          setStep('reset'); // Nhảy thẳng đến màn hình nhập mật khẩu mới nếu là Email
        } else {
          toast.success("An OTP verification code has been sent to your phone number!");
          setStep('otp'); // Chuyển sang màn hình bắt nhập mã OTP nếu là Số điện thoại
        }
      }
      // ===========================================
      */

      // --- MOCK TIMEOUT (Xóa đoạn giả lập dưới này đi khi mở khối lệnh Axios ở trên) ---
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (method === "email") {
        toast.success("A password reset link has been sent to your email!");
        setStep("reset");
      } else {
        toast.success(
          "An OTP verification code has been sent to your phone number!",
        );
        setStep("otp");
      }
      // ---------------------------------------------------------------------------------
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Account verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // BƯỚC 2: XÁC THỰC MÃ OTP ĐIỆN THOẠI (CHỈ CHẠY KHI CHỌN METHOD PHONE)
  // ============================================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      toast.error("Please enter a valid OTP code.");
      return;
    }

    setLoading(true);
    try {
      /* // 🛠️ ===== AXIOS REAL API CALL (BƯỚC 2) =====
      const requestPayload = {
        phone_number: inputValue, // Số điện thoại đã nhập ở Bước 1
        otp: otpCode // Mã OTP gồm 4 hoặc 6 số do người dùng nhập vào Form
      };

      const response = await axios.post('/api/v1/auth/verify-otp', requestPayload);

      if (response.data.success) {
        toast.success("OTP verified successfully!");
        setStep('reset'); // Mã xác thực khớp, chuyển tiếp sang màn đặt mật khẩu mới
      }
      // ===========================================
      */

      // --- MOCK TIMEOUT (Xóa đoạn giả lập dưới này đi khi mở khối lệnh Axios ở trên) ---
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("OTP verified successfully!");
      setStep("reset");
      // ---------------------------------------------------------------------------------
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid or expired OTP code.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // BƯỚC 3: TIẾN HÀNH THIẾT LẬP LẠI MẬT KHẨU MỚI
  // ============================================================
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Kiểm tra định dạng Regex bảo mật mật khẩu
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error(
        "Password must be at least 8 characters, including uppercase, lowercase, numbers, and special characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Confirm password does not match.");
      return;
    }

    setLoading(true);
    try {
      /* // 🛠️ ===== AXIOS REAL API CALL (BƯỚC 3) =====
      const requestPayload = {
        account_value: inputValue, // Truyền Email hoặc Phone lên để Backend định danh tài khoản cần đổi
        password: newPassword, // Mật khẩu mới vừa thiết lập
        confirm_password: confirmPassword // Xác nhận lại mật khẩu mới
      };

      const response = await axios.post('/api/v1/auth/reset-password-confirm', requestPayload);

      if (response.data.success) {
        toast.success("Password updated successfully!");
        setStep('success'); // Đổi mật khẩu thành công, hiển thị màn hình chúc mừng
      }
      // ===========================================
      */

      // --- MOCK TIMEOUT (Xóa đoạn giả lập dưới này đi khi mở khối lệnh Axios ở trên) ---
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Password updated successfully!");
      setStep("success");
      // ---------------------------------------------------------------------------------
    } catch (err) {
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
      <Link
        to="/login"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200 z-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to login</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-md bg-[#1e293b]/70 border border-slate-700/50 shadow-2xl rounded-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Smartpark
            </h1>
            <p className="text-slate-400 text-sm">Forgot Password Recovery</p>
          </div>

          {/* ============================================================
              BƯỚC 1: FORM KHỞI TẠO YÊU CẦU (EMAIL HOẶC SĐT)
             ============================================================ */}
          {step === "request" && (
            <form onSubmit={handleRequestSubmit} className="space-y-5">
              {/* Tab lựa chọn phương thức khôi phục */}
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("email");
                    setInputValue("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${method === "email" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Mail size={14} /> Email Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("phone");
                    setInputValue("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${method === "phone" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Phone size={14} /> Phone Number
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {method === "email"
                    ? "Registered Email"
                    : "Registered Phone Number"}
                </label>
                <div className="relative">
                  {method === "email" ? (
                    <>
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="email"
                        required
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="name@smartpark.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </>
                  ) : (
                    <>
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="tel"
                        required
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="0912345678"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Send Recovery Request"}
              </button>
            </form>
          )}

          {/* ============================================================
              BƯỚC 2: FORM NHẬP MÃ OTP XÁC THỰC SỐ ĐIỆN THOẠI
             ============================================================ */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-sm text-slate-300 mb-2">
                Please enter the 4-digit verification code sent to{" "}
                <span className="text-blue-400 font-mono">{inputValue}</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  } // Chặn không cho nhập chữ
                  placeholder="Enter 4-digit OTP"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-center font-bold tracking-[0.5em] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP Code"}
              </button>
            </form>
          )}

          {/* ============================================================
              BƯỚC 3: FORM ĐỔI MẬT KHẨU MỚI (CHẠY CHUNG CHO CẢ 2 METHOD)
             ============================================================ */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 secure characters"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Reset My Password"}
              </button>
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
              <p className="text-slate-200 font-medium">
                Your password has been reset successfully!
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200"
              >
                Return to Login Page
              </button>
            </div>
          )}
        </div>
      </div>
    
    </div>
  );
}
