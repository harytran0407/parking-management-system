import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCcw, Eye, EyeOff, Phone, User, Mail, Lock } from "lucide-react";
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
  }
};

// ─── Reusable Alert Banner Component ───────────────────────────────────────
function AlertBanner({ type, message }) {
  if (!message) return null;

  const styles = {
    success: {
      wrapper: "bg-green-500/10 border border-green-500/30 text-green-400",
      icon: <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    },
    error: {
      wrapper: "bg-red-500/10 border border-red-500/30 text-red-400",
      icon: <XCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    },
    warning: {
      wrapper: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400",
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
  const [banner, setBanner] = useState(null); // { type, message }
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── Real-time validation state ─────────────────────────────────────────
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const isPasswordTyped = formData.password.length > 0;
  const isPasswordValid = passwordRegex.test(formData.password);
  const isConfirmTyped = formData.confirm_password.length > 0;
  const isPasswordMatch = formData.password === formData.confirm_password;

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
    // PHONE REGEX VALIDATION
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
      const response = await api.post("auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });
      if (response.data) {
        toast.success(t[language].successToastTitle, {
          description: t[language].successToastDesc,
        });
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || error?.message || t[language].registerFailed;
      setBanner({ type: "error", message: serverMessage });
    } finally {
      setLoading(false);
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
    `w-full pl-10 pr-4 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
      fieldErrors[fieldName] ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-blue-500"
    }`;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-25"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1920')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-dark-900/80 to-dark-900 z-0" />

      {/* Back to Home */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200 z-10">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t[language].backToHome}</span>
      </Link>

      <div className="w-full max-w-md bg-[#1e293b]/70 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 p-8 relative z-10">
        
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 py-1 bg-slate-800/80 border border-slate-700 text-[10px] font-black text-slate-300 hover:text-white rounded-lg transition-all focus:outline-none flex items-center gap-1.5 hover:bg-slate-700"
            title={language === "en" ? "Switch to Vietnamese" : "Chuyển sang Tiếng Anh"}
          >
            <span>🌐</span>
            <span>{language === "en" ? "EN" : "VI"}</span>
          </button>
        </div>

        <div className="text-center mb-1">
          <h2 className="text-3xl font-bold text-white tracking-tight">{t[language].title}</h2>
          <p className="text-slate-400 mt-1">{t[language].subtitle}</p>
        </div>

        {/* ── Alert Banner ── */}
        <div className="mb-4">
          <AlertBanner type={banner?.type} message={banner?.message} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t[language].fullName}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} placeholder={t[language].fullNamePlaceholder} className={inputClass("full_name")} />
            </div>
            {fieldErrors.full_name && <p className="text-red-400 text-xs mt-1.5 font-medium">{fieldErrors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t[language].email}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder={t[language].emailPlaceholder} className={inputClass("email")} />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t[language].phoneNumber}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
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
            {fieldErrors.phone_number && <p className="text-red-400 text-xs mt-1.5 font-medium">{fieldErrors.phone_number}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t[language].password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder={t[language].confirmPasswordPlaceholder}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
                  !isPasswordTyped ? "border-slate-700 focus:border-blue-500" : isPasswordValid ? "border-green-500 focus:border-green-500" : "border-red-500 focus:border-red-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isPasswordTyped && (
              <p className={`text-xs mt-1.5 font-medium leading-relaxed transition-colors ${isPasswordValid ? "text-green-400" : "text-red-400"}`}>
                {isPasswordValid ? t[language].passwordStrong : t[language].passwordWeak}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t[language].confirmPassword}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                required
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder={t[language].confirmPasswordPlaceholder}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
                  !isConfirmTyped ? "border-slate-700 focus:border-blue-500" : isPasswordMatch ? "border-green-500 focus:border-green-500" : "border-red-500 focus:border-red-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isConfirmTyped && (
              <p className={`text-xs mt-1.5 font-medium transition-colors ${isPasswordMatch ? "text-green-400" : "text-red-400"}`}>
                {isPasswordMatch ? t[language].passwordsMatch : t[language].passwordsMismatch}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <RefreshCcw size={14} className="animate-spin" />}
            <span>{loading ? t[language].registering : t[language].registerBtn}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-700" />
          <span className="flex-shrink mx-4 text-slate-500 text-sm">{t[language].or}</span>
          <div className="flex-grow border-t border-slate-700" />
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition duration-200">
          <img src={googleIcon} alt="Google" className="w-5 h-5" />
          {loading ? t[language].processing : t[language].googleBtn}
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          {t[language].alreadyHaveAccount}{" "}
          <Link to="/login" className="text-blue-500 hover:underline font-medium">
            {t[language].loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
