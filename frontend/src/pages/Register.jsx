import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import googleIcon from "../assets/google.png";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";

// ─── Reusable Alert Banner Component ───────────────────────────────────────
// Dùng để hiển thị thông báo cấp form (success / error / info)
// Thay thế hoàn toàn cho Toast trong ngữ cảnh Auth page
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
    <div
      className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm font-medium ${wrapper}`}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
}

// ─── Main Register Component ────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: "ParkingUser",
  });

  const [fieldErrors, setFieldErrors] = useState({}); // Lỗi từng field (inline)
  const [banner, setBanner] = useState(null); // { type, message } — banner cấp form
  const [loading, setLoading] = useState(false);

  // ─── Real-time validation state ─────────────────────────────────────────
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const isPasswordTyped = formData.password.length > 0;
  const isPasswordValid = passwordRegex.test(formData.password);
  const isConfirmTyped = formData.confirm_password.length > 0;
  const isPasswordMatch = formData.password === formData.confirm_password;

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    // Xóa lỗi field khi user bắt đầu sửa + xóa banner server error
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setBanner(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    const currentErrors = {};
    let isValid = true;

    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    if (!nameRegex.test(formData.full_name)) {
      currentErrors.full_name =
        "Name must be 2–100 characters and contain only letters.";
      isValid = false;
    }

    const phoneRegex = /^(0|)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      currentErrors.phone_number =
        "Invalid phone number format (e.g., 0901234567).";
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

    // Validation thất bại → chỉ highlight field, không cần banner
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Thay bằng API call thực — authService.register(formData)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Đăng ký thành công → hiển thị banner success rồi redirect
      setBanner({
        type: "success",
        message: "Account created! Redirecting to login...",
      });
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      // Lỗi từ server → hiển thị message cụ thể từ API hoặc fallback
      const serverMessage =
        error?.message || "Registration failed. Please try again.";
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
          message: "Google sign-up successful! Redirecting...",
        });
        setTimeout(() => navigate(`/${user.role.toLowerCase()}`), 1500);
      } catch (err) {
        setBanner({
          type: "error",
          message: err.message || "Google sign-up failed.",
        });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setBanner({
        type: "error",
        message: "Google sign-up failed. Please try again.",
      });
    },
  });

  // ─── Input class helper ─────────────────────────────────────────────────
  const inputClass = (fieldName) =>
    `w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
      fieldErrors[fieldName]
        ? "border-red-500 focus:border-red-500"
        : "border-slate-700 focus:border-blue-500"
    }`;

  // ─── Render ─────────────────────────────────────────────────────────────
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
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200 z-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to home</span>
      </Link>

      <div className="w-full max-w-md bg-[#1e293b]/70 backdrop-blur-md rounded-xl shadow-lg border border-slate-700/50 p-8 relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Smartpark
          </h2>
          <p className="text-slate-400 mt-1">Create your account</p>
        </div>

        {/* ── Alert Banner (success / error từ server) ── */}
        <div className="mb-4">
          <AlertBanner type={banner?.type} message={banner?.message} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your name"
              className={inputClass("full_name")}
            />
            {fieldErrors.full_name && (
              <p className="text-red-400 text-xs mt-1.5 font-medium">
                ✕ {fieldErrors.full_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@smartpark.com"
              className={inputClass("email")}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none">
                +84
              </span>
              <input
                type="tel"
                name="phone_number"
                required
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="912 345 678"
                className={`w-full pl-12 pr-4 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
                  fieldErrors.phone_number
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-700 focus:border-blue-500"
                }`}
              />
            </div>
            {fieldErrors.phone_number && (
              <p className="text-red-400 text-xs mt-1.5 font-medium">
                ✕ {fieldErrors.phone_number}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
                !isPasswordTyped
                  ? "border-slate-700 focus:border-blue-500"
                  : isPasswordValid
                    ? "border-green-500 focus:border-green-500"
                    : "border-red-500 focus:border-red-500"
              }`}
            />
            {isPasswordTyped && (
              <p
                className={`text-xs mt-1.5 font-medium leading-relaxed transition-colors ${isPasswordValid ? "text-green-400" : "text-red-400"}`}
              >
                {isPasswordValid
                  ? "✓ Password is strong and secure."
                  : "✕ Must be 8+ characters with uppercase, lowercase, numbers, and special characters."}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirm_password"
              required
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
                !isConfirmTyped
                  ? "border-slate-700 focus:border-blue-500"
                  : isPasswordMatch
                    ? "border-green-500 focus:border-green-500"
                    : "border-red-500 focus:border-red-500"
              }`}
            />
            {isConfirmTyped && (
              <p
                className={`text-xs mt-1.5 font-medium transition-colors ${isPasswordMatch ? "text-green-400" : "text-red-400"}`}
              >
                {isPasswordMatch
                  ? "✓ Passwords match."
                  : "✕ Passwords do not match."}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none mt-2 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-700" />
          <span className="flex-shrink mx-4 text-slate-500 text-sm">or</span>
          <div className="flex-grow border-t border-slate-700" />
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition duration-200"
        >
          <img src={googleIcon} alt="Google" className="w-5 h-5" />
          {loading ? "Processing..." : "Sign up with Google"}
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-500 hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
