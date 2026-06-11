import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Forbidden() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    // If user has a role, redirect to their default home, otherwise to login
    if (user?.role === "SystemAdmin") {
      navigate("/admin");
    } else if (user?.role === "ParkingManager") {
      navigate("/manager");
    } else if (user?.role === "ParkingStaff") {
      navigate("/staff");
    } else if (user?.role === "ParkingUser" || user?.role === "User") {
      navigate("/user");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-15"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1920')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 z-0" />
      
      {/* Decorative Glow elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-lg relative z-10 animate-scale-in">
        <div className="backdrop-blur-md bg-slate-900/60 border border-red-500/20 shadow-2xl rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
          {/* Top border decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

          {/* Icon Section */}
          <div className="w-20 h-20 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-950/40 relative group">
            <ShieldAlert size={40} className="text-red-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="absolute inset-0 rounded-2xl bg-red-500/20 animate-ping opacity-25" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-2">
            403 Forbidden
          </h1>
          <h2 className="text-lg font-bold text-red-400 mb-4">
            Access Denied
          </h2>

          {/* Description */}
          <p className="text-slate-400 text-sm md:text-base mb-8 leading-relaxed font-medium">
            You do not have the required access privileges to view this workspace. 
            If you believe this is an error, please reach out to your administrator 
            or try signing in with a different account.
          </p>

          {/* User Meta Information if Logged In */}
          {user && (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 mb-8 text-left text-xs font-semibold text-slate-400 flex justify-between items-center">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Logged In As</span>
                <span className="text-slate-200 font-bold">{user.full_name || user.username}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Role</span>
                <span className="text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/20">{user.role}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoBack}
              className="flex-grow flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl transition duration-200 active:scale-[0.98]"
            >
              <Home size={16} />
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-grow flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition duration-200 active:scale-[0.98] shadow-lg shadow-red-600/20"
            >
              <LogOut size={16} />
              <span>Sign Out / Switch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
