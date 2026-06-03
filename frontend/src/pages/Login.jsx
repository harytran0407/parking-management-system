import React, { useState, useRef } from "react"; // ĐÃ SỬA: Import thêm useRef
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Lock, Contact, ArrowLeft } from "lucide-react";
import googleIcon from "../assets/google.png";
import { useGoogleLogin } from "@react-oauth/google";
import ReCAPTCHA from "react-google-recaptcha"; // ĐÃ SỬA: Import thư viện reCAPTCHA

// MAP ĐIỀU HƯỚNG TỰ ĐỘNG DỰA VÀO DATA BACKEND TRẢ VỀ
const ROLE_ROUTES_MAP = {
  ParkingStaff: "/staff",
  ParkingUser: "/user",
  ParkingManager: "/manager",
  SystemAdmin: "/admin",
};

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // ĐÃ SỬA: Thay đổi destructuring từ {} sang [] cho đúng cú pháp React Hook
  const [captchaToken, setCaptchaToken] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const recaptchaRef = useRef(null);
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  const handleCaptchaSuccess = (token) => {
    setCaptchaToken(token);
    if (token) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!captchaToken) {
      setError("Complete the verification 'I am not a robot'.");
      return;
    }

    setLoading(true); // ĐÃ SỬA: Bổ sung trạng thái loading khi bắt đầu gửi request
    try {
      // ĐÃ SỬA: Truyền thêm tham số captchaToken vào hàm login để đẩy dữ liệu lên AuthContext
      const user = await login(email.trim(), password, captchaToken);

      // TỰ ĐỘNG ĐIỀU HƯỚNG: Lấy user.role từ Backend trả về để map với đường dẫn
      const redirectPath = ROLE_ROUTES_MAP[user.role] || "/home";
      navigate(redirectPath);
    } catch (err) {
      // ĐÃ SỬA: Reset lại token và giao diện ô tích khi đăng nhập thất bại
      setCaptchaToken(null);
      recaptchaRef.current?.reset();

      const errorCode = err?.error_code; // Đối chiếu bảng Business Error Codes
      switch (errorCode) {
        case "INVALID_CREDENTIALS":
          setError("Invalid email or password. Please try again.");
          break;
        case "ACCOUNT_LOCKED":
          setError("This account has been locked due to multiple failed logins.");
          break;
        case "ACCESS_DENIED":
          setError("Account is inactive or not verified.");
          break;
        case "TOO_MANY_ATTEMPTS":
          setError("Too many login attempts. Please try again later.");
          break;
        default:
          setError(err?.message || "Login failed. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        const token = tokenResponse.access_token;
        const user = await loginWithGoogle(token);

        const redirectPath = ROLE_ROUTES_MAP[user.role] || "/home";
        navigate(redirectPath);
      } catch (err) {
        setError(err.message || `Google login failed`);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Login with Google failed. Please try again");
    },
  });

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

      {/* Back to Home */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200 z-10">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to home</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-md bg-[#1e293b]/70 border border-slate-700/50 shadow-2xl rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Smartpark</h1>
            <p className="text-slate-400">Parking Management System</p>
          </div>

          {error && <div className="mb-4 p-4 bg-red-950/50 border border-red-500/50 rounded-lg text-red-200 text-sm font-medium">✕ {error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL FIELD */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email or Phone</label>
              <div className="relative">
                <Contact className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email or phone number"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-blue-500 hover:text-blue-400 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            {/* ĐÃ SỬA: KHỐI WIDGET RECAPTCHA VISUAL DISPLAY TRÊN UI */}
            <div className="flex justify-center py-2 bg-slate-800/40 ">
              {RECAPTCHA_SITE_KEY ? (
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaSuccess}
                  theme="dark" // Sử dụng theme tối để tiệp màu với nền slate-900 của app
                />
              ) : (
                <p className="text-xs text-red-400 font-mono p-2">[SYSTEM ERROR]: Missing VITE_RECAPTCHA_SITE_KEY in .env!</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-sm">or</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition duration-200">
            <img src={googleIcon} alt="Google" className="w-5 h-5" />
            {loading ? "Processing..." : "Continue with Google"}
          </button>

          {/* Redirect to Register */}
          <p className="text-center text-sm text-slate-400 mt-6 mb-2">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-500 hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
