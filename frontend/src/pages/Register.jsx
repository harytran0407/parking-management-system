import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCcw, Eye, EyeOff, Phone, User, Mail, Lock, X } from "lucide-react";
import googleIcon from "../assets/google.png";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { toast } from "sonner";
import api from "../utils/api";

const t = {
  vi: {
    backToHome: "Quay lại trang chủ",
    title: "eParking",
    subtitle: "Tạo tài khoản mới",
    fullName: "Họ và tên",
    fullNamePlaceholder: "Nhập họ và tên của bạn",
    fullNameErr: "Họ và tên phải từ 2–100 ký tự và chỉ chứa chữ cái.",
    email: "Email",
    emailPlaceholder: "name@eparking.com",
    phoneNumber: "Số điện thoại",
    phonePlaceholder: "Ví dụ: 0901234567",
    phoneErr: "Số điện thoại không hợp lệ (Phải bắt đầu bằng số 0 và có 10 chữ số, ví dụ: 0901234567).",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",
    confirmPasswordPlaceholder: "••••••••",
    passwordStrong: "✓ Mật khẩu mạnh và an toàn.",
    passwordWeak: "Mật khẩu phải từ 8 ký tự trở lên, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
    passwordMinLength: "Tối thiểu 8 ký tự",
    passwordUppercase: "Ít nhất 1 chữ cái in hoa (A-Z)",
    passwordLowercase: "Ít nhất 1 chữ cái in thường (a-z)",
    passwordNumber: "Ít nhất 1 chữ số (0-9)",
    passwordSpecial: "Ít nhất 1 ký tự đặc biệt (@$!%*?&)",
    passwordsMatch: "✓ Mật khẩu trùng khớp.",
    passwordsMismatch: "Mật khẩu nhập lại không trùng khớp.",
    registerBtn: "Đăng ký",
    registering: "Đang đăng ký...",
    or: "hoặc",
    googleBtn: "Đăng ký bằng Google",
    processing: "Đang xử lý...",
    alreadyHaveAccount: "Đã có tài khoản?",
    loginLink: "Đăng nhập ngay",
    successToastTitle: "Đăng ký tài khoản thành công!",
    successToastDesc: "Chào mừng bạn đến với hệ thống quản lý bãi xe eParking.",
    googleSuccess: "Đăng ký bằng Google thành công! Đang chuyển hướng...",
    googleFailed: "Đăng ký bằng Google thất bại.",
    googleFailedTryAgain: "Đăng ký bằng Google thất bại. Vui lòng thử lại.",
    registerFailed: "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.",

    // --- Modal Verify Translations ---
    verifyTitle: "Xác thực Email của bạn",
    verifyDesc: "Chúng tôi đã gửi một mã xác thực gồm 6 chữ số tới email",
    verifyOtpLengthErr: "Vui lòng nhập đủ 6 chữ số.",
    verifying: "Đang xác thực...",
    verifyBtn: "Xác thực ngay",
    noCodeReceived: "Không nhận được mã?",
    resendCountdown: "Gửi lại mã sau",
    resendBtn: "Gửi lại mã",
    verifyFailed: "Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
    verifySuccess: "Xác thực email thành công! Đang chuyển hướng...",
    resendSuccess: "Mã xác thực mới đã được gửi tới email của bạn.",
    resendFailed: "Không thể gửi lại mã. Vui lòng thử lại.",
  },
  en: {
    backToHome: "Back to home",
    title: "eParking",
    subtitle: "Create your account",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your name",
    fullNameErr: "Full name must be 2–100 characters and contain only letters.",
    email: "Email",
    emailPlaceholder: "name@eparking.com",
    phoneNumber: "Phone Number",
    phonePlaceholder: "e.g., 0901234567",
    phoneErr: "Invalid phone number (Must start with 0 and have 10 digits, e.g., 0901234567).",
    password: "Password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "••••••••",
    passwordStrong: "✓ Strong and secure password.",
    passwordWeak: "Password must be 8+ characters, with uppercase, lowercase, numbers, and special characters.",
    passwordMinLength: "Minimum 8 characters",
    passwordUppercase: "At least 1 uppercase letter (A-Z)",
    passwordLowercase: "At least 1 lowercase letter (a-z)",
    passwordNumber: "At least 1 number (0-9)",
    passwordSpecial: "At least 1 special character (@$!%*?&)",
    passwordsMatch: "✓ Passwords match.",
    passwordsMismatch: "Passwords do not match.",
    registerBtn: "Register",
    registering: "Registering...",
    or: "or",
    googleBtn: "Sign up with Google",
    processing: "Processing...",
    alreadyHaveAccount: "Already have an account?",
    loginLink: "Login",
    successToastTitle: "Registration successful!",
    successToastDesc: "Welcome to the eParking management system.",
    googleSuccess: "Google sign-up successful! Redirecting...",
    googleFailed: "Google sign-up failed.",
    googleFailedTryAgain: "Google sign-up failed. Please try again.",
    registerFailed: "Registration failed. Please check your information.",

    // --- Modal Verify Translations ---
    verifyTitle: "Verify Your Email",
    verifyDesc: "We've sent a 6-digit verification code to",
    verifyOtpLengthErr: "Please enter all 6 digits.",
    verifying: "Verifying...",
    verifyBtn: "Verify Now",
    noCodeReceived: "Didn't receive the code?",
    resendCountdown: "Resend code in",
    resendBtn: "Resend Code",
    verifyFailed: "Invalid or expired OTP. Please try again.",
    verifySuccess: "Email verified successfully! Redirecting...",
    resendSuccess: "A new verification code has been sent to your email.",
    resendFailed: "Failed to resend code. Please try again.",
  }
};

// ─── Reusable Alert Banner Component ───────────────────────────────────────
function AlertBanner({ type, message }) {
  if (!message) return null;

  const styles = {
    success: {
      wrapper: "bg-green-500/10 border border-green-500/30 text-green-600",
      icon: <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    },
    error: {
      wrapper: "bg-red-500/10 border border-red-500/30 text-red-600",
      icon: <XCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    },
    warning: {
      wrapper: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-600",
      icon: <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    },
  };

  const { wrapper, icon } = styles[type] || styles.error;

  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm font-medium ${wrapper}`}>
      {icon}
      <span>{message}</span>
    </div>
  );
}

// ─── Main Register Component ────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: "ParkingUser",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── Verify Modal States ────────────────────────────────────────────────
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const otpRefs = useRef([]);
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // ─── Real-time validation state ─────────────────────────────────────────
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const isPasswordTyped = formData.password.length > 0;
  const checks = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[@$!%*?&]/.test(formData.password),
  };
  const isPasswordValid = passwordRegex.test(formData.password);
  const isConfirmTyped = formData.confirm_password.length > 0;
  const isPasswordMatch = formData.password === formData.confirm_password;

  // ─── Countdown Timer Effect ─────────────────────────────────────────────
  useEffect(() => {
    if (!isVerifyModalOpen || countdown <= 0) return;

    const timerId = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [countdown, isVerifyModalOpen]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setBanner(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    const currentErrors = {};
    let isValid = true;

    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    if (!nameRegex.test(formData.full_name)) {
      currentErrors.full_name = t[language].fullNameErr;
      isValid = false;
    }
    const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      currentErrors.phone_number = t[language].phoneErr;
      isValid = false;
    }

    if (!isPasswordValid || !isPasswordMatch) {
      isValid = false;
    }

    setFieldErrors(currentErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner(null);

    if (!validateForm()) return;
    setLoading(true);
    try {
      // API đăng ký cũng đồng thời gửi mã OTP về email
      const response = await api.post("auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });

      if (response.data) {
        // Mở modal xác thực OTP thay vì chuyển hướng ngay
        setRegisteredEmail(formData.email);
        setIsVerifyModalOpen(true);
        setCountdown(60); // Đếm ngược 60 seconds
        setOtp(new Array(6).fill(""));
        setVerifyError("");

        // Reset form data
        setFormData({ full_name: "", email: "", phone_number: "", password: "", confirm_password: "", role: "ParkingUser" });
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || error?.message || t[language].registerFailed;
      setBanner({ type: "error", message: serverMessage });
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP Input Handlers ─────────────────────────────────────────────────
  const handleOtpChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setVerifyError("");

    // Tự động focus vào ô tiếp theo
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Nếu nhấn Backspace và ô hiện tại trống, focus về ô trước đó
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      setVerifyError("");
      if (pastedData.length > 0) {
        otpRefs.current[Math.min(pastedData.length, 5)].focus();
      }
    }
  };

  // ─── Verify & Resend API Handlers ───────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setVerifyError(t[language].verifyOtpLengthErr);
      return;
    }

    setVerifyLoading(true);
    setVerifyError("");
    try {
      const response = await api.post("auth/verify-otp", {
        email: registeredEmail,
        otp_code: otpString,
      });
      if (response.data.success || response.status === 200) {
        toast.success(t[language].verifySuccess);
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || t[language].verifyFailed;
      setVerifyError(serverMessage);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !registeredEmail) return;

    setResendLoading(true);
    try {
      //Use old data from the state to resend OTP
      const response = await api.post("auth/resend-otp", {
        email: registeredEmail,
      });
      if (response.data.success || response.status === 200) {
        toast.success(t[language].resendSuccess);
        setCountdown(60);// Countdown 60 seconds
        setOtp(new Array(6).fill(""));
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || t[language].resendFailed;
      setVerifyError(serverMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setBanner(null);
      try {
        const user = await loginWithGoogle(tokenResponse.access_token);
        setBanner({
          type: "success",
          message: t[language].googleSuccess,
        });
        const redirectPath = "/user";
        setTimeout(() => navigate(redirectPath, { replace: true }), 1500);
      } catch (err) {
        setBanner({
          type: "error",
          message: err.message || t[language].googleFailed,
        });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setBanner({
        type: "error",
        message: t[language].googleFailedTryAgain,
      });
    },
  });

  // ─── Input class helper ─────────────────────────────────────────────────
  const inputClass = (fieldName) =>
    `w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition ${fieldErrors[fieldName] ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
    }`;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
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

      {/* Back to Home */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200 z-10">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t[language].backToHome}</span>
      </Link>

      <div className="w-full max-w-md bg-white backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-8 relative z-10">

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
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t[language].title}</h2>
          </Link>
          <p className="text-slate-500 font-medium text-sm mt-1">{t[language].subtitle}</p>
        </div>

        {/* ── Alert Banner ── */}
        <div className="mb-4">
          <AlertBanner type={banner?.type} message={banner?.message} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">{t[language].fullName}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
              <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} placeholder={t[language].fullNamePlaceholder} className={inputClass("full_name")} />
            </div>
            {fieldErrors.full_name && <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">{t[language].email}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
              <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder={t[language].emailPlaceholder} className={inputClass("email")} />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">{t[language].phoneNumber}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
              <input
                type="tel"
                name="phone_number"
                required
                value={formData.phone_number}
                onChange={handleChange}
                placeholder={t[language].phonePlaceholder}
                className={inputClass("phone_number")}
              />
            </div>
            {fieldErrors.phone_number && <p className="text-red-600 text-xs mt-1.5 font-medium">{fieldErrors.phone_number}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">{t[language].password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder={t[language].confirmPasswordPlaceholder}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition ${!isPasswordTyped ? "border-slate-300 focus:border-blue-500" : isPasswordValid ? "border-green-500 focus:border-green-500" : "border-red-500 focus:border-red-500"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isPasswordTyped && (
              <div className="mt-2.5 space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-300">
                <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                  {language === "vi" ? "Yêu cầu mật khẩu:" : "Password requirements:"}
                </p>
                <ul className="space-y-1.5 text-xs text-slate-800">
                  <li className={`flex items-center gap-2 transition-colors duration-200 ${checks.minLength ? "text-green-600 font-medium" : "text-slate-450"}`}>
                    {checks.minLength ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{t[language].passwordMinLength}</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-colors duration-200 ${checks.hasUpper ? "text-green-600 font-medium" : "text-slate-450"}`}>
                    {checks.hasUpper ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{t[language].passwordUppercase}</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-colors duration-200 ${checks.hasLower ? "text-green-600 font-medium" : "text-slate-450"}`}>
                    {checks.hasLower ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{t[language].passwordLowercase}</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-colors duration-200 ${checks.hasNumber ? "text-green-600 font-medium" : "text-slate-450"}`}>
                    {checks.hasNumber ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{t[language].passwordNumber}</span>
                  </li>
                  <li className={`flex items-center gap-2 transition-colors duration-200 ${checks.hasSpecial ? "text-green-600 font-medium" : "text-slate-450"}`}>
                    {checks.hasSpecial ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{t[language].passwordSpecial}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">{t[language].confirmPassword}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                required
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder={t[language].confirmPasswordPlaceholder}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition ${!isConfirmTyped ? "border-slate-300 focus:border-blue-500" : isPasswordMatch ? "border-green-500 focus:border-green-500" : "border-red-500 focus:border-red-500"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-700 focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isConfirmTyped && (
              <p className={`text-xs mt-1.5 font-medium transition-colors ${isPasswordMatch ? "text-green-600" : "text-red-600"}`}>
                {isPasswordMatch ? t[language].passwordsMatch : t[language].passwordsMismatch}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <RefreshCcw size={14} className="animate-spin" />}
            <span>{loading ? t[language].registering : t[language].registerBtn}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-300" />
          <span className="flex-shrink mx-4 text-slate-500 text-sm font-semibold">{t[language].or}</span>
          <div className="flex-grow border-t border-slate-300" />
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition duration-200">
          <img src={googleIcon} alt="Google" className="w-5 h-5" />
          {loading ? t[language].processing : t[language].googleBtn}
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-600 mt-6">
          {t[language].alreadyHaveAccount}{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            {t[language].loginLink}
          </Link>
        </p>
      </div>

      {/* ─── Verify Email Modal ─────────────────────────────────────────────── */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsVerifyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t[language].verifyTitle}</h3>
              <p className="text-sm text-slate-500 mt-2 flex flex-col items-center gap-2">
                <span>
                  {t[language].verifyDesc}
                </span>
                <span className="font-semibold text-slate-800 break-all">{registeredEmail}</span>
              </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold text-slate-900 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${verifyError ? "border-red-400" : "border-slate-300"
                    }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {verifyError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center font-medium flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={verifyLoading || otp.join("").length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifyLoading && <RefreshCcw className="w-4 h-4 animate-spin" />}
              {verifyLoading ? t[language].verifying : t[language].verifyBtn}
            </button>

            {/* Resend Code Section */}
            <div className="text-center mt-5 text-sm text-slate-600">
              {t[language].noCodeReceived}{" "}
              {countdown > 0 ? (
                <span className="text-slate-400 font-medium">
                  {t[language].resendCountdown} <span className="text-blue-600 font-bold">{countdown}s</span>
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-blue-600 hover:underline font-semibold disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {resendLoading && <RefreshCcw className="w-3.5 h-3.5 animate-spin" />}
                  {resendLoading ? t[language].processing : t[language].resendBtn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}