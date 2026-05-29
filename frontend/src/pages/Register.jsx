import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import googleIcon from "../assets/google.png";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  // 🚀 ĐÃ SỬA: Đồng bộ 100% tên thuộc tính với Request Body mục 1.3 trong Update_API_Document.md
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: "ParkingUser", // Chuẩn hóa Role danh mục hệ thống
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setErrors({ ...errors, [e.target.name]: "" });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ----- REAL-TIME VALIDATION LOGIC -----
  // Chuẩn mật khẩu: tối thiểu 8 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const isPasswordTyped = formData.password.length > 0;
  const isPasswordValid = passwordRegex.test(formData.password);

  const isConfirmTyped = formData.confirm_password.length > 0;
  const isPasswordMatch = formData.password === formData.confirm_password;
  // --------------------------------------

  const validateForm = () => {
    let currentErrors = {};
    let isValid = true;

    // Validate Full Name: Khớp quy định API (Tối thiểu 2 ký tự, tối đa 100 ký tự)
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,100}$/;
    if (!nameRegex.test(formData.full_name)) {
      currentErrors.full_name =
        "Name must be 2-100 characters and contain only letters.";
      isValid = false;
    }

    // Validate Phone Number: Khớp cấu hình định dạng chuỗi số Việt Nam
    const phoneRegex = /^(0|)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      currentErrors.phone_number =
        "Invalid phone number format (e.g., 0901234567).";
      isValid = false;
    }

    // Chặn gửi dữ liệu lên server nếu kiểm tra mật khẩu realtime bị thất bại
    if (!isPasswordValid || !isPasswordMatch) {
      isValid = false;
    }

    setErrors(currentErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please check the requirements in the red text.");
      return;
    }

    setLoading(true);

    try {
      // Giả lập xử lý kết nối kiểm thử Endpoint hệ thống (/api/v1/auth/register)
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast.success(
        "Account registration successful! Please return to the Login page.",
      );
      console.log("User registered data payload:", formData);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      toast.error("An error occurred during the registration process.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const token = tokenResponse.access_token;
        const user = await loginWithGoogle(token);
        toast.success("Google sign-up successful");

        setTimeout(() => {
          const userRole = user.role.toLowerCase();
          navigate(`/${userRole}`);
        }, 1500);
      } catch (err) {
        toast.error(err.message || "Google sign-up failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast.error("Google sign-up failed. Please try again.");
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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-dark-900/80 to-dark-900 z-0" />

      {/* Back to Home Button */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FULL NAME INPUT */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="full_name" // 🚀 ĐÃ SỬA
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your name"
              className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${errors.full_name ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-blue-500"}`}
            />
            {errors.full_name && (
              <p className="text-red-400 text-xs mt-1.5 font-medium">
                ✕ {errors.full_name}
              </p>
            )}
          </div>

          {/* EMAIL INPUT */}
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
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* PHONE NUMBER INPUT */}
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
                name="phone_number" // 🚀 ĐÃ SỬA
                required
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="912 345 678"
                className={`w-full pl-12 pr-4 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition ${
                  errors.phone_number
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-700 focus:border-blue-500"
                }`}
              />
            </div>
            {errors.phone_number && (
              <p className="text-red-400 text-xs mt-1.5 font-medium">
                ✕ {errors.phone_number}
              </p>
            )}
          </div>

          {/* PASSWORD INPUT - REAL-TIME VALIDATION */}
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
                  : "✕ Password must be at least 8 characters, including uppercase, lowercase, numbers, and special characters."}
              </p>
            )}
          </div>

          {/* CONFIRM PASSWORD INPUT - REAL-TIME VALIDATION */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirm_password" // 🚀 ĐÃ SỬA
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

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none mt-2 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-sm">or</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* GOOGLE SIGN UP BUTTON */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition duration-200"
        >
          <img src={googleIcon} alt="Google" className="w-5 h-5" />
          {loading ? "Processing..." : "Sign up with Google"}
        </button>

        {/* LOGIN LINK */}
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

      {/* TOAST CONTAINER FOR GLOBAL MESSAGES */}
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}
