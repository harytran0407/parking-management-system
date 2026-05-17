import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Car,
  Clock,
  Search,
  ShieldCheck,
  Zap,
  CreditCard,
  LayoutDashboard,
  Check,
  ArrowUp,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    // smooth scroll navigation bar
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  //set scroll if false then hidden
  const [showScrollTop, setShowScrollTop] = useState(false);
  // event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  //scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [searchData, setSearchData] = useState({
    location: "",
    vehicleType: "car",
    duration: "1",
  });

  return (
    <div
      id="home"
      className="min-h-screen bg-[#0f172a] text-white relative overflow-hidden"
    >
      {/* 1. BACKGROUND IMAGE OVERLAY  */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-40"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1920')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-[#0f172a] z-0" />

      {/* 2. TOP NAVIGATION BAR */}
      <nav className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Smartpark
        </div>

        {/* Navigation middle menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={() => scrollToSection("home")}
            className="text-white hover:text-blue-400 transition cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection("about")}
            className="hover:text-blue-400 transition cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="hover:text-blue-400 transition cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("rates")}
            className="hover:text-blue-400 transition cursor-pointer"
          >
            Parking Rates
          </button>
        </div>
        
        {/* Login button */}
        <button
          onClick={() => navigate("/login")}
          className="bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-6 py-2 rounded-full border border-white/20 backdrop-blur-sm transition duration-200"
        >
          Login
        </button>
        
      </nav>

      {/* 3. HERO SECTION */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-start justify-center min-h-[70vh]">
        <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30 mb-6 uppercase tracking-wider">
          The Ultimate Parking Experience
        </span>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight mb-6">
          Discover Your Perfect <br />
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Parking Destination
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mb-12">
          Real-time slot availability, secure multi-actor management, and
          automated invoicing. Start your hassle-free journey today.
        </p>

        {/* 4. SEARCH WIDGET  */}
        <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-700/50 backdrop-blur-md p-4 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-4">
          {/*Destination/ parking area*/}
          <div className="w-full md:w-1/3 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-700/50">
            <MapPin className="text-blue-400 w-5 h-5 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-xs text-slate-400 font-medium">
                Destination
              </label>
              <input
                type="text"
                placeholder="Zone A, Zone B..."
                className="bg-transparent text-sm w-full focus:outline-none text-white mt-0.5 placeholder-slate-500"
                value={searchData.location}
                onChange={(e) =>
                  setSearchData({ ...searchData, location: e.target.value })
                }
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="w-full md:w-1/4 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-slate-700/50">
            <Car className="text-blue-400 w-5 h-5 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-xs text-slate-400 font-medium">
                Vehicle Type
              </label>
              <select
                className="bg-transparent text-sm w-full focus:outline-none text-white mt-0.5 cursor-pointer"
                value={searchData.vehicleType}
                onChange={(e) =>
                  setSearchData({ ...searchData, vehicleType: e.target.value })
                }
              >
                <option value="car" className="bg-slate-800">
                  Car
                </option>
                <option value="motorbike" className="bg-slate-800">
                  Motorbike
                </option>
              </select>
            </div>
          </div>

          {/* Durations */}
          <div className="w-full md:w-1/4 flex items-center gap-3 px-4 py-2">
            <Clock className="text-blue-400 w-5 h-5 flex-shrink-0" />
            <div className="w-full">
              <label className="block text-xs text-slate-400 font-medium">
                Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                className="bg-transparent text-sm w-full focus:outline-none text-white mt-0.5 placeholder-slate-500"
                value={searchData.duration}
                onChange={(e) =>
                  setSearchData({ ...searchData, duration: e.target.value })
                }
              />
            </div>
          </div>

          {/* Search bar*/}
          <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl md:rounded-full flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-blue-600/20">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>
      {/* ================= SECTION: ABOUT SMARTPARK ================= */}
      <div
        id="about"
        className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-800/60 mt-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Vision & Statistics */}
          <div>
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
              About The Project
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 leading-tight">
              Revolutionizing Urban Mobility <br />
              <span className="text-slate-400">One Slot At A Time.</span>
            </h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Smartpark was developed to solve the pressing challenges of urban
              parking infrastructure in modern cities. By combining real-time
              navigation technology with automated management workflows, we
              deliver an optimized experience for both drivers and parking
              operators.
            </p>

            {/* Key Statistics */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-400">40%</div>
                <div className="text-xs text-slate-500 mt-1">Time Saved</div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-indigo-400">99.8%</div>
                <div className="text-xs text-slate-500 mt-1">Accuracy</div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-emerald-400">24/7</div>
                <div className="text-xs text-slate-500 mt-1">Monitoring</div>
              </div>
            </div>
          </div>

          {/* Right Column: Development Team */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 text-white border-b border-slate-800 pb-3">
              Development Team
            </h3>
            <div className="space-y-4">
              {/* Team Member 1 */}
              <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                  TM
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Lê Nguyễn Thiên Minh
                  </h4>
                  <p className="text-xs text-slate-500">Frontend Developer</p>
                </div>
              </div>

              {/* Team Member 2 */}
              <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                  MT
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Vũ Minh Tiến
                  </h4>
                  <p className="text-xs text-slate-500">Backend Developer</p>
                </div>
              </div>

              {/* Team Member 3 */}
              <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
                  BK
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Huỳnh Nguyễn Bảo Khang
                  </h4>
                  <p className="text-xs text-slate-500">
                    Database Administrator
                  </p>
                </div>
              </div>

              {/* Team Member 4 */}
              <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400">
                  NT
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Đinh Nguyễn Thịnh
                  </h4>
                  <p className="text-xs text-slate-500">Frontend Developer</p>
                </div>
              </div>

              {/* Team Member 5 */}
              <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-400">
                  QH
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Trần Đình Quốc Hưng
                  </h4>
                  <p className="text-xs text-slate-500">
                    Quality Assurance (QA) - Tester - Backend Developer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ============================================================= */}
      {/* ================= SECTION: FEATURES ================= */}
      <div
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-800/60 mt-12"
      >
        <div className="text-center mb-16">
          <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
            System Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-2">
            Cutting-Edge Parking Solutions
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm md:text-base">
            Our system integrates smart hardware and intuitive software to
            deliver seamless management workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Real-Time IoT Tracking
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Instantly monitor empty parking slots with integrated smart
              sensors and ESP32 microcontrollers.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              AI Plate Recognition
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automated license plate scanning at gate control ensures maximum
              security and cuts check-in times.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-5">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Automated Billing
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Secure payment integration supporting simulated digital banking
              and instant email invoice generation.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-5">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Role-Based Dashboards
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tailored, high-fidelity user interfaces designed specifically for
              Administrators, Managers, and Security Staff.
            </p>
          </div>
        </div>
      </div>

      {/* ================= SECTION: PARKING RATES ================= */}
      <div
        id="rates"
        className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-800/60"
      >
        <div className="text-center mb-16">
          <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
            Pricing Plans
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-2">
            Flexible Parking Rates
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm md:text-base">
            Choose a plan that fits your vehicle type and schedule. Safe,
            secure, and affordable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1: Motorbike */}
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Motorbike</h3>
              <p className="text-slate-500 text-sm mb-6">
                Perfect for daily commuters
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-white">
                  $0.50
                </span>
                <span className="text-slate-400 text-sm">/ hour</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Dedicated
                  two-wheeler zone
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Standard
                  security monitoring
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Digital receipt
                  generation
                </li>
              </ul>
            </div>
            <button className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition">
              {" "}
              Get Started{" "}
            </button>
          </div>

          {/* Plan 2: Car (Highlighted) */}
          <div className="bg-slate-900/80 border-2 border-blue-500 p-8 rounded-2xl flex flex-col justify-between relative shadow-xl shadow-blue-500/5 hover:scale-[1.02] transition duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {" "}
              Most Popular{" "}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Standard Car
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Ideal for sedans, SUVs, and vans
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-white">
                  $2.00
                </span>
                <span className="text-slate-400 text-sm">/ hour</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-200">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Wide-space
                  automated slots
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> 24/7 Premium AI
                  gate control
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> E-Invoice &
                  payment link
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Real-time
                  mobile space tracking
                </li>
              </ul>
            </div>
            <button className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20">
              {" "}
              Get Started{" "}
            </button>
          </div>

          {/* Plan 3: Monthly Membership */}
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Monthly Pass
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Best for regular & VIP drivers
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-white">
                  $45.00
                </span>
                <span className="text-slate-400 text-sm">/ month</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Fixed reserved
                  premium slot
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Unlimited
                  check-in/out
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Priority VIP
                  lane access
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" /> Monthly
                  automated statements
                </li>
              </ul>
            </div>
            <button className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition">
              {" "}
              Get Started{" "}
            </button>
          </div>
        </div>
      </div>
      {/* ================= SECTION: FOOTER ================= */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-900 text-slate-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="text-xl font-bold text-white tracking-tight mb-4">
              Smartpark
            </div>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              An intelligent parking management system designed to optimize
              urban space, enhance security, and deliver a seamless automated
              billing experience.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => scrollToSection("home")}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("rates")}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  Parking Rates
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("about")}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  About Team
                </button>
              </li>
            </ul>
          </div>

          {/*  Academic Context & Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Project Info
            </h3>
            <p className="text-sm text-slate-500 mb-2">
              Academic Project • 2026
            </p>
            <p className="text-sm text-slate-500 font-medium">
              FPT University (HCMC Campus)
            </p>
            <div className="mt-4 pt-4 border-t border-slate-900">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-white transition"
              >
                View on GitHub ↗
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 mt-12 border-t border-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>© 2026 Smartpark Team. All rights reserved.</p>
          <p>Designed with ❤️ by SE Students</p>
        </div>
      </footer>
      {/* ============================================================= */}
      {/* (Back to Top) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-1"
          title="Back to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
