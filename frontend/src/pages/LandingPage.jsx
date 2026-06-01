import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Car, Clock, ShieldCheck, Zap, CreditCard, LayoutDashboard, Check, ArrowUp, TrendingUp, Github, Mail } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
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
    <div className="min-h-screen bg-[#060a12] text-white relative overflow-x-hidden selection:bg-blue-500/30 font-sans">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* 1. TOP NAVIGATION BAR */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-[#060a12]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToTop()}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">S</div>
            <span className="text-xl font-bold tracking-tight text-white">Smartpark</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            {[
              { id: "home", label: "Home" },
              { id: "features", label: "Features" },
              { id: "rates", label: "Pricing" },
            ].map((item) => (
              <button key={item.id} onClick={() => scrollToSection(item.id)} className="hover:text-blue-400 transition-colors duration-200 relative group whitespace-nowrap">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            Sign in
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div id="home" className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-16 flex flex-col items-center justify-center text-center">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-semibold px-4 py-1.5 rounded-full border border-blue-500/20 mb-8 tracking-widest backdrop-blur-sm uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Next-Gen Parking System
          </span>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-8">
            Experience Seamless <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-orange-500">Urban Mobility</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
            Eliminate the stress of finding a parking spot. Real-time availability, AI security, and automated payments—all in one unified platform.
          </p>
        </div>

        {/* HERO METRICS (Thay thế cho thanh Search cũ) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto mt-4 animate-slide-up">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center backdrop-blur-sm">
            <TrendingUp className="text-blue-500 w-6 h-6 mb-3" />
            <span className="text-2xl font-bold text-white">500+</span>
            <span className="text-slate-400 text-sm mt-1">Parking Spots</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center backdrop-blur-sm">
            <ShieldCheck className="text-blue-500 w-6 h-6 mb-3" />
            <span className="text-2xl font-bold text-white">24/7</span>
            <span className="text-slate-400 text-sm mt-1">Monitoring</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center backdrop-blur-sm">
            <Zap className="text-blue-500 w-6 h-6 mb-3" />
            <span className="text-2xl font-bold text-white">99.9%</span>
            <span className="text-slate-400 text-sm mt-1">Uptime</span>
          </div>
        </div>
      </div>

      {/* 3. PARKING INFO FACILITY */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 mt-12">
        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md flex flex-col md:flex-row transition-all duration-500">
          <div className="w-full md:w-5/12 relative min-h-[300px] md:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1200"
              alt="Smartpark Facility"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-[#060a12] to-transparent opacity-90 md:opacity-100"></div>
          </div>

          <div className="w-full md:w-7/12 p-8 md:p-14 flex flex-col justify-center relative z-10">
            <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest rounded-full mb-6 w-max">
              Premium Location
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Smartpark Innovation Hub</h3>

            <p className="text-slate-400 flex items-start gap-3 text-sm mb-8 leading-relaxed">
              <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white text-base block mb-1">Saigon Hi-Tech Park, Thu Duc City, HCMC.</strong>
                Strategically located to provide a secure, easily accessible, and smart parking environment for all modern commuters.
              </span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#0a101d] border border-white/5">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Flexible Hours</h4>
                  <p className="text-xs text-slate-400 mt-1">06:00 - 23:00 Daily</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#0a101d] border border-white/5">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                  <Car size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">High Capacity</h4>
                  <p className="text-xs text-slate-400 mt-1">500+ Vehicles</p>
                </div>
              </div>
            </div>

            <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-all w-max shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              Explore Location
            </button>
          </div>
        </div>
      </div>

      {/* 4. FEATURES SECTION */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-6">
            System Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2 tracking-tight">
            Cutting-Edge <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">Solutions</span>
          </h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">Everything you need to manage parking efficiently with advanced technology and automation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Zap,
              title: "Real-Time Tracking",
              desc: "Instantly monitor empty parking slots with integrated smart sensors across the facility.",
            },
            {
              icon: ShieldCheck,
              title: "AI Plate Recognition",
              desc: "Automated license plate scanning at gate control ensures maximum security and speed.",
            },
            {
              icon: CreditCard,
              title: "Automated Billing",
              desc: "Secure payment integration supporting instant digital invoicing and multiple methods.",
            },
            {
              icon: LayoutDashboard,
              title: "Role-Based Dashboards",
              desc: "Tailored interfaces designed specifically for Admins, Managers, and Staff.",
            },
          ].map((feat, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 hover:-translate-y-2 hover:border-blue-500/30 transition-all duration-300 group">
              <div className="w-14 h-14 border border-blue-500/30 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-blue-500 transition-all">
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. PARKING RATES */}
      <div id="rates" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Flexible Parking <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">Rates</span>
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">Choose the perfect plan for your parking needs with transparent and competitive pricing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Plan 1 */}
          <div className="bg-[#0a101d] border border-white/5 p-8 rounded-[2rem] hover:border-white/10 transition-colors">
            <h3 className="text-2xl font-bold text-white mb-2">Motorbike</h3>
            <p className="text-slate-500 text-sm mb-6">Perfect for daily commuters</p>
            <div className="mb-8 flex items-end gap-1">
              <span className="text-5xl font-bold text-white">$0.50</span>
              <span className="text-slate-500 mb-1">/hr</span>
            </div>
            <ul className="space-y-4 mb-10 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Dedicated zone
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Security monitoring
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Real-time availability
              </li>
            </ul>
            <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors">Select Plan</button>
          </div>

          {/* Plan 2: MOST POPULAR */}
          <div className="bg-[#0c1527] border border-blue-500 p-10 rounded-[2rem] relative shadow-[0_0_40px_rgba(37,99,235,0.1)] md:-translate-y-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ea580c] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Standard Car</h3>
            <p className="text-blue-200/60 text-sm mb-6">Ideal for sedans, SUVs, and vans</p>
            <div className="mb-8 flex items-end gap-1">
              <span className="text-5xl font-bold text-white">$2.00</span>
              <span className="text-blue-200/60 mb-1">/hr</span>
            </div>
            <ul className="space-y-4 mb-10 text-sm text-white">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-400" /> Wide-space automated slots
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-400" /> Premium AI gate control
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-400" /> Mobile space tracking
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-blue-400" /> Automated billing
              </li>
            </ul>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25">Get Started</button>
          </div>

          {/* Plan 3 */}
          <div className="bg-[#0a101d] border border-white/5 p-8 rounded-[2rem] hover:border-white/10 transition-colors">
            <h3 className="text-2xl font-bold text-white mb-2">Monthly Pass</h3>
            <p className="text-slate-500 text-sm mb-6">For VIP & regular drivers</p>
            <div className="mb-8 flex items-end gap-1">
              <span className="text-5xl font-bold text-white">$45.00</span>
              <span className="text-slate-500 mb-1">/mo</span>
            </div>
            <ul className="space-y-4 mb-10 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Fixed reserved slot
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> VIP lane access
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Priority support
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400" /> Free premium features
              </li>
            </ul>
            <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors">Select Plan</button>
          </div>
        </div>
      </div>

      {/* 6. FOOTER (Tái tạo chính xác theo Screenshot) */}
      <footer className="relative z-10 bg-[#04070d] border-t border-white/5 pt-20 pb-8 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center font-bold text-white">S</div>
                <span className="text-2xl font-bold text-white tracking-tight">Smartpark</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-8">
                An intelligent parking management system designed to optimize urban space, enhance security, and deliver a seamless automated billing experience.
              </p>

              {/* Team Avatars */}
              <div className="flex gap-3">
                {["Lê Nguyễn Thiên Minh", "Vũ Minh Tiến", "Huỳnh Nguyễn Bảo Khang", "Đinh Nguyễn Thịnh", "Trần Đình Quốc Hưng"].map((name, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-sm font-medium text-slate-300 cursor-help hover:border-blue-500 hover:text-blue-400 transition-colors"
                    title={name}>
                    {name.split(" ").pop()[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">PRODUCT</h3>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>
                  <button onClick={() => scrollToSection("features")} className="hover:text-blue-400 transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("rates")} className="hover:text-blue-400 transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">COMPANY</h3>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* 3 Contact Info Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-[#0a101d] border border-white/5 p-6 rounded-2xl flex items-center gap-4">
              <Mail className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="text-sm font-semibold text-white">hello@smartpark.io</p>
              </div>
            </div>

            <div className="bg-[#0a101d] border border-white/5 p-6 rounded-2xl flex items-center gap-4">
              <MapPin className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Location</p>
                <p className="text-sm font-semibold text-white">Thu Duc City, HCMC</p>
              </div>
            </div>

            <div className="bg-[#0a101d] border border-white/5 p-6 rounded-2xl flex items-center gap-4">
              <Github className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">GitHub</p>
                <a href="#" className="text-sm font-semibold text-white hover:text-blue-400 transition-colors">
                  github.com/smartpark
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Line */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2026 Smartpark Team. All rights reserved.</p>
            <p>Designed with ❤️ by SE Students</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-blue-600/80 backdrop-blur-md hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
