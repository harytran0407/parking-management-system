import React, { useState } from "react";
import { X, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";
import api from "../utils/api"; // Kế thừa công cụ gọi Axios instance tập trung của hệ thống

export default function ChangePasswordModal({ isOpen, onClose }) {
  // Form input elements state management
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility state controls (UX Toggles)
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Async request lifecycle states tracker (loading / error / success)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const isPasswordTyped = newPassword.length > 0;
  const isPasswordValid = passwordRegex.test(newPassword);
  const isConfirmTyped = confirmPassword.length > 0;
  const isPasswordMatch = newPassword === confirmPassword;

  if (!isOpen) return null;

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // 1. Client-side verification for password confirmation matching
    if (newPassword !== confirmPassword) {
      setError("Confirm password does not match the new password.");
      return;
    }

    // 2. Strict password complexity validation matching section 2.5 of API Document
    if (!passwordRegex.test(newPassword)) {
      setError("New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.");
      return;
    }

    try {
      setLoading(true);

      // 🚀 ĐÃ SỬA: Điều chỉnh chính xác endpoint từ /parking/auth/... thành /auth/... theo mục 2.5 API Document
      const response = await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (response.data && response.data.success) {
        setSuccessMessage("Password updated successfully!");

        // Clean up input boundaries upon successful transaction execution
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("[Change Password API Failure]:", err);

      // Extract specific business error codes or handle fallback network message
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || "Failed to update password. Please verify your current credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans antialiased">
      {/* Ambient background blur mask layer */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      {/* MODAL WRAPPER CONTAINER - NO BOX SHADOW ELEVATION AS PER FLAT UI SYSTEM SPECIFICATION */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 z-10 text-slate-700 dark:text-slate-300">
        {/* Absolute positioned close action icon element */}
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
          <X size={16} />
        </button>

        {/* Modal Header Partition */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Change Account Password</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Security Credentials</p>
          </div>
        </div>

        {/* Dynamic Alert Messages Banner Display Toggles */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl">
            ✕ {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl">
            ✓ {successMessage}
          </div>
        )}

        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 font-medium text-xs">
          {/* FIELD 1: CURRENT PASSWORD */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-bold">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your active password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* FIELD 2: NEW PASSWORD */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-bold">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 complex secure characters"
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition text-sm ${
                  !isPasswordTyped
                    ? "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    : isPasswordValid
                    ? "border-green-500 dark:border-green-500 focus:border-green-500"
                    : "border-red-500 dark:border-red-500 focus:border-red-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {isPasswordTyped && (
              <p className={`text-xs mt-1.5 font-bold leading-relaxed transition-colors ${isPasswordValid ? "text-green-500" : "text-red-500"}`}>
                {isPasswordValid ? "✓ Password is strong and secure." : "✕ Must be 8+ characters with uppercase, lowercase, numbers, and special characters."}
              </p>
            )}
          </div>

          {/* FIELD 3: CONFIRM NEW PASSWORD */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-bold">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password to verify"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition text-sm ${
                  !isConfirmTyped
                    ? "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    : isPasswordMatch
                    ? "border-green-500 dark:border-green-500 focus:border-green-500"
                    : "border-red-500 dark:border-red-500 focus:border-red-500"
                }`}
              />
            </div>
            {isConfirmTyped && (
              <p className={`text-xs mt-1.5 font-bold transition-colors ${isPasswordMatch ? "text-green-500" : "text-red-500"}`}>
                {isPasswordMatch ? "✓ Passwords match." : "✕ Passwords do not match."}
              </p>
            )}
          </div>

          {/* MAIN TRANSACTION CTA BUTTON SUBMIT TRIGGER */}
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || !isPasswordValid || !isPasswordMatch}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl transition duration-200 focus:outline-none mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:cursor-not-allowed">
            {loading && <RefreshCw size={14} className="animate-spin" />}
            {loading ? "Processing Update..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
