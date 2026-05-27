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

  // 1. ĐÃ FIX LẠI HÀM CUỘN TRANG CỰC MƯỢT VÀ CHUẨN XÁC
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      // Trừ hao 80px (độ cao của thanh Nav) để nội dung không bị che khuất
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchData, setSearchData] = useState({
    location: "",
    vehicleType: "car",
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    // 2. ĐÃ FIX: Đổi overflow-hidden thành overflow-x-hidden để không bị lỗi tính toán chiều cao
    <div className="min-h-screen bg-[#090f1a] text-white relative overflow-x-hidden selection:bg-blue-500/30">
      {/* 3. ĐÃ FIX: Đổi absolute thành fixed để background không làm kéo giãn trang */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* 2. TOP NAVIGATION BAR */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-[#090f1a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => scrollToTop()}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Smartpark
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            {[
              { id: "home", label: "Home" },
              { id: "about", label: "About" },
              { id: "features", label: "Feature" },
              { id: "rates", label: "Parking Rates" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="hover:text-blue-400 transition-colors duration-200 relative group whitespace-nowrap"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate("/login")}
            className="bg-white/5 hover:bg-white/10 text-white font-semibold text-sm px-6 py-2.5 rounded-full border border-white/10 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <div
        id="home"
        className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-16 flex flex-col items-center justify-center text-center min-h-[85vh]"
      >
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-500/20 mb-8 uppercase tracking-widest backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Next-Gen Parking System
          </span>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-8">
            Experience Seamless <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Urban Mobility
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Eliminate the stress of finding a parking spot. Real-time
            availability, AI security, and automated payments—all in one unified
            platform.
          </p>
        </div>

        {/* FLOATING SEARCH BAR */}
        <div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-3 relative z-20 animate-slide-up">
          <div className="flex-1 flex items-center gap-3 px-4 py-2 md:border-r border-white/10 w-full">
            <MapPin className="text-blue-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Where are you going?"
              className="bg-transparent border-none outline-none text-white placeholder:text-slate-500 w-full text-sm"
              value={searchData.location}
              onChange={(e) =>
                setSearchData({ ...searchData, location: e.target.value })
              }
            />
          </div>
          <div className="flex-1 flex items-center gap-3 px-4 py-2 md:border-r border-white/10 w-full">
            <Car className="text-blue-400 w-5 h-5" />
            <select
              className="bg-transparent border-none outline-none text-white w-full text-sm appearance-none cursor-pointer"
              value={searchData.vehicleType}
              onChange={(e) =>
                setSearchData({ ...searchData, vehicleType: e.target.value })
              }
            >
              <option value="car" className="bg-slate-900">
                Car
              </option>
              <option value="motorbike" className="bg-slate-900">
                Motorbike
              </option>
            </select>
          </div>
          <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl md:rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Search className="w-4 h-4" /> Find Spot
          </button>
        </div>
      </div>

      {/* ================= SECTION: PARKING INFO ================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col md:flex-row hover:border-blue-500/30 transition-all duration-500">
          <div className="w-full md:w-2/5 relative min-h-[250px] md:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1200"
              alt="Smartpark Facility"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090f1a] md:bg-gradient-to-l md:from-[#090f1a] to-transparent opacity-90 md:opacity-100"></div>
          </div>

          <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center relative z-10 bg-[#090f1a] md:bg-transparent">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
              Premium Location
            </span>
            <h3 className="text-3xl font-bold text-white mb-4">
              Smartpark Innovation Hub
            </h3>

            <p className="text-slate-400 flex items-start gap-3 text-sm mb-8 leading-relaxed">
              <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Saigon Hi-Tech Park, Thu Duc City, HCMC.</strong>
                <br />
                Strategically located to provide a secure, easily accessible,
                and smart parking environment for all modern commuters.
              </span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Flexible Hours
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    06:00 - 23:00 Daily
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <Car size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    High Capacity
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">500+ Vehicles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION: FEATURES ================= */}
      <div
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5 mt-12"
      >
        <div className="text-center mb-16">
          <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
            System Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-2">
            Cutting-Edge Solutions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Zap,
              title: "Real-Time Tracking",
              desc: "Instantly monitor empty parking slots with integrated smart sensors.",
            },
            {
              icon: ShieldCheck,
              title: "AI Plate Recognition",
              desc: "Automated license plate scanning at gate control ensures maximum security.",
            },
            {
              icon: CreditCard,
              title: "Automated Billing",
              desc: "Secure payment integration supporting instant digital invoicing.",
            },
            {
              icon: LayoutDashboard,
              title: "Role Dashboards",
              desc: "Tailored UI designed specifically for Admins, Managers, and Staff.",
            },
          ].map((feat, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 hover:-translate-y-2 hover:border-blue-500/30 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                <feat.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feat.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SECTION: PARKING RATES ================= */}
      <div
        id="rates"
        className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5"
      >
        <div className="text-center mb-16">
          <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">
            Pricing Plans
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-2">
            Flexible Parking Rates
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Plan 1 */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-colors">
            <h3 className="text-2xl font-bold text-white mb-2">Motorbike</h3>
            <p className="text-slate-500 text-sm mb-6">
              Perfect for daily commuters
            </p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-white">$0.50</span>
              <span className="text-slate-500">/hr</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Dedicated zone
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Security
                monitoring
              </li>
            </ul>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors">
              Select Plan
            </button>
          </div>

          {/* Plan 2: VIP HIGHLIGHTED */}
          <div className="bg-gradient-to-b from-blue-900/40 to-[#090f1a] border-2 border-blue-500 p-10 rounded-3xl relative shadow-[0_0_30px_rgba(59,130,246,0.15)] transform md:-translate-y-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-blue-500/30">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Standard Car</h3>
            <p className="text-blue-200 text-sm mb-6">
              Ideal for sedans, SUVs, and vans
            </p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-white">$2.00</span>
              <span className="text-blue-200">/hr</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-white">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-400" /> Wide-space automated
                slots
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-400" /> Premium AI gate
                control
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-400" /> Mobile space
                tracking
              </li>
            </ul>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              Get Started
            </button>
          </div>

          {/* Plan 3 */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-colors">
            <h3 className="text-2xl font-bold text-white mb-2">Monthly Pass</h3>
            <p className="text-slate-500 text-sm mb-6">
              For VIP & regular drivers
            </p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-white">$45.00</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Fixed reserved
                slot
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> VIP lane access
              </li>
            </ul>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors">
              Select Plan
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER (ID: about) */}
      <footer
        id="about"
        className="relative z-10 bg-[#060a12] border-t border-white/5 pt-16 pb-8"
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="text-2xl font-bold text-white tracking-tight mb-4">
              Smartpark
            </div>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
              An intelligent parking management system designed to optimize
              urban space, enhance security, and deliver a seamless automated
              billing experience.
            </p>
            <div className="flex gap-4">
              {[
                "Lê Nguyễn Thiên Minh",
                "Vũ Minh Tiến",
                "Huỳnh Nguyễn Bảo Khang",
                "Đinh Nguyễn Thịnh",
                "Trần Đình Quốc Hưng",
              ].map((name, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400 cursor-help"
                  title={name}
                >
                  {name.split(" ").pop()[0]}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Project Info
            </h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>Academic Project • 2026</li>
              <li>FPT University (HCMC Campus)</li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  View on GitHub ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 mt-12 border-t border-white/5 flex justify-between text-xs text-slate-600">
          <p>© 2026 Smartpark Team. All rights reserved.</p>
          <p>Designed with ❤️ by SE Students</p>
        </div>
      </footer>

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-blue-600/80 backdrop-blur-md hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
