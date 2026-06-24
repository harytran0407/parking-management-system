import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import googleIcon from "../assets/google.png";
import { useGoogleLogin } from "@react-oauth/google";
import ReCAPTCHA from "react-google-recaptcha";

// MAP ĐIỀU HƯỚNG TỰ ĐỘNG DỰA VÀO DATA BACKEND TRẢ VỀ (GIỮ NGUYÊN VẸN)
const ROLE_ROUTES_MAP = {
  ParkingStaff: "/staff",
  ParkingUser: "/user",
  ParkingManager: "/manager",
  SystemAdmin: "/admin",
  User: "/user",
};

const t = {
  vi: {
    backToHome: "Quay lại trang chủ",
    title: "eParking",
    subtitle: "Hệ thống quản lý bãi xe",
    emailOrPhone: "Email",
    emailOrPhonePlaceholder: "Nhập địa chỉ email",
    password: "Mật khẩu",
    forgotPassword: "Quên mật khẩu?",
    passwordPlaceholder: "Nhập mật khẩu của bạn",
    recaptchaError: "Vui lòng hoàn thành xác minh 'Tôi không phải là robot'.",
    loginBtn: "Đăng nhập",
    loggingIn: "Đang đăng nhập...",
    or: "hoặc",
    googleBtn: "Tiếp tục với Google",
    processing: "Đang xử lý...",
    noAccount: "Chưa có tài khoản?",
    registerLink: "Đăng ký",
    invalidCredentials: "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.",
    accountLocked: "Tài khoản này đã bị khóa hoặc tạm ngưng. Vui lòng liên hệ quản trị viên.",
    accessDenied: "Tài khoản chưa được kích hoạt hoặc chưa xác thực.",
    tooManyAttempts: "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.",
    loginFailed: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
    googleFailed: "Đăng nhập bằng Google thất bại. Vui lòng thử lại.",
  },
  en: {
    backToHome: "Back to home",
    title: "eParking",
    subtitle: "Parking Management System",
    emailOrPhone: "Email",
    emailOrPhonePlaceholder: "Enter your email address",
    password: "Password",
    forgotPassword: "Forgot password?",
    passwordPlaceholder: "Enter your password",
    recaptchaError: "Please complete 'I am not a robot' verification.",
    loginBtn: "Login",
    loggingIn: "Logging in...",
    or: "or",
    googleBtn: "Continue with Google",
    processing: "Processing...",
    noAccount: "Don't have an account?",
    registerLink: "Register",
    invalidCredentials: "Incorrect email or password. Please try again.",
    accountLocked: "This account has been locked or suspended. Please contact the administrator.",
    accessDenied: "Account is not activated or verified.",
    tooManyAttempts: "Too many failed login attempts. Please try again later.",
    loginFailed: "Login failed. Please check your credentials.",
    googleFailed: "Login with Google failed. Please try again.",
  }
};

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const [captchaToken, setCaptchaToken] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const recaptchaRef = useRef(null);
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  const [submitLoading, setSubmitLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleCaptchaSuccess = (token) => {
    setCaptchaToken(token);
    if (token) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!captchaToken) {
      setError(t[language].recaptchaError);
      return;
    }

    setSubmitLoading(true);
    try {
      const user = await login(email.trim(), password, captchaToken);
      const redirectPath = ROLE_ROUTES_MAP[user.role] || "/login";
      navigate(redirectPath);
    } catch (err) {
      setCaptchaToken(null);
      recaptchaRef.current?.reset();

      const errorCode = err?.error_code;
      switch (errorCode) {
        case "INVALID_CREDENTIALS":
          setError(t[language].invalidCredentials);
          break;
        case "ACCOUNT_LOCKED":
          setError(t[language].accountLocked);
          break;
        case "ACCESS_DENIED":
          setError(t[language].accessDenied);
          break;
        case "TOO_MANY_ATTEMPTS":
          setError(t[language].tooManyAttempts);
          break;
        default:
          setError(err?.message || t[language].loginFailed);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setGoogleLoading(true);
      try {
        const token = tokenResponse.access_token;
        const user = await loginWithGoogle(token);

        const redirectPath = ROLE_ROUTES_MAP[user.role] || "/login";
        navigate(redirectPath);
      } catch (err) {
        setError(err.message || t[language].googleFailed);
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError(t[language].googleFailed);
    },
  });

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-25"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1920')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/80 to-slate-950 z-0" />

      <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200 z-10">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t[language].backToHome}</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-md bg-[#1e293b]/70 border border-slate-700/50 shadow-2xl rounded-xl p-8 relative">
          
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

          <div className="text-center mb-8">
            <Link to="/" className="inline-block hover:opacity-85 transition-opacity">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{t[language].title}</h1>
            </Link>
            <p className="text-slate-400">{t[language].subtitle}</p>
          </div>

          {error && <div className="mb-4 p-4 bg-red-950/50 border border-red-500/50 rounded-lg text-red-200 text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t[language].emailOrPhone}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t[language].emailOrPhonePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-300">{t[language].password}</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-blue-500 hover:text-blue-400 hover:underline transition-colors">
                  {t[language].forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t[language].passwordPlaceholder}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
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
            </div>

            <div className="flex justify-center py-2 bg-slate-800/40 ">
              {RECAPTCHA_SITE_KEY ? (
                <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={handleCaptchaSuccess} theme="dark" />
              ) : (
                <p className="text-xs text-red-400 font-mono p-2">[SYSTEM ERROR]: Missing VITE_RECAPTCHA_SITE_KEY in .env!</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitLoading || googleLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitLoading ? t[language].loggingIn : t[language].loginBtn}
            </button>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-sm">{t[language].or}</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={submitLoading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <img src={googleIcon} alt="Google" className="w-5 h-5" />
            {googleLoading ? t[language].processing : t[language].googleBtn}
          </button>

          <p className="text-center text-sm text-slate-400 mt-6 mb-2">
            {t[language].noAccount}{" "}
            <Link to="/register" className="text-blue-500 hover:underline font-medium">
              {t[language].registerLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
