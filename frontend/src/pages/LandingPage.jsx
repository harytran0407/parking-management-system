import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Bike,
  CalendarCheck,
  Scan,
  Lock,
  Bell,
  BarChart2,
  History,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";


// ─── Static content ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Advance Booking",
    desc: "Reserve a spot 1 to 8 hours ahead. Your slot is held for up to 30 minutes past your arrival time — no stress about losing it.",
  },
  {
    icon: Scan,
    title: "Automatic Check-in",
    desc: "Cameras read your license plate at the gate. No app needed, no access card — just drive in.",
  },
  {
    icon: Lock,
    title: "Remote Vehicle Lock",
    desc: 'Activate "Lock Vehicle" in the app after parking. A barrier blocks the exit lane until you unlock it.',
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Get notified before your booking starts and warned when time is running low — extend your stay or leave on time.",
  },
  {
    icon: BarChart2,
    title: "Live Capacity",
    desc: "See exactly how many spots are available before you drive over. Data updates in real time.",
  },
  {
    icon: History,
    title: "Booking History",
    desc: "View your full history, invoices, and status for every booking — anytime, anywhere in the app.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Choose Vehicle Type",
    desc: "Select car or motorbike to see available capacity and matching slots.",
  },
  {
    n: "2",
    title: "Enter Details",
    desc: "Enter your plate number, pick arrival and departure times. The system calculates your fee instantly.",
  },
  {
    n: "3",
    title: "Pay Deposit",
    desc: "Pay the deposit via VNPAY. Your spot is reserved the moment payment is confirmed.",
  },
  {
    n: "4",
    title: "Drive In",
    desc: "Cameras read your plate and the barrier opens automatically. Park in your assigned zone.",
  },
];

const TRUST_ITEMS = [
  "Automatic check-in via license plate recognition camera",
  "Secure payment through VNPAY",
  "24/7 continuous support",
];

// ─── CapacityPill ─────────────────────────────────────────────────────────────
function CapacityPill({ icon: Icon, label, available, total, accentColor }) {
  const pct = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  const isFull = available === 0;

  return (
    <div
      style={{
        background: "#ffffff",
        border: `1.5px solid ${isFull ? "#dc2626" : "rgb(226, 232, 240)"}`,
        borderRadius: 16,
        padding: "18px 18px 14px",
        flex: 1,
        boxShadow: isFull
          ? "0 4px 18px rgba(220,38,38,0.1)"
          : "0 4px 18px rgba(15,23,42,0.08)",
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: isFull ? "#dc2626" : "#475569",
          marginBottom: 10,
        }}
      >
        <Icon size={13} color={isFull ? "#dc2626" : "#1d4ed8"} />
        {label}
        {isFull && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              background: "#fee2e2",
              color: "#dc2626",
              padding: "1px 7px",
              borderRadius: 99,
              fontWeight: 700,
            }}
          >
            Full
          </span>
        )}
      </div>

      {/* ── Hero number ── */}
      <div style={{ textAlign: "center", padding: "10px 0 12px" }}>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1,
            color: isFull ? "#dc2626" : "#1d4ed8",
            letterSpacing: "-0.03em",
            textShadow: isFull
              ? "0 2px 16px rgba(220,38,38,0.2)"
              : "0 2px 16px rgba(29,78,216,0.2)",
          }}
        >
          {available != null ? available : "—"}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isFull ? "#ef4444" : "#1d4ed8",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginTop: 4,
            opacity: 0.7,
          }}
        >
          available slots
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: isFull ? "#fee2e2" : "#dbeafe",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${pct}%`,
            background: isFull ? "#ef4444" : "#1d4ed8",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: isFull ? "#ef4444" : "#93c5fd", marginTop: 5, textAlign: "right" }}>
        {pct}% occupied
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [capacity, setCapacity] = useState(null);
  const [capacityLoading, setCapacityLoading] = useState(true);

  const [activeSection, setActiveSection] = useState("parking");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scrollspy logic
  useEffect(() => {
    const sections = ["parking", "features", "how-it-works"];

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -50% 0px", // Trigger when the section occupies the central area
      threshold: 0.05,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Update sliding indicator line
  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabRefs.current[activeSection];
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth,
        });
      }
    };

    const timer = setTimeout(updateIndicator, 50);

    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeSection]);

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const res = await api.get("/parking/buildings/info");
        if (res.data?.success) setCapacity(res.data.data);
      } catch {
        // silently fail — capacity pills show "—"
      } finally {
        setCapacityLoading(false);
      }
    };
    fetchCapacity();
  }, []);

  // Parse vehicle_type_availability array from API
  // vehicle_type_id: 1 = Motorbike, 2 = Car
  const vehicleTypes = capacity?.vehicle_type_availability ?? [];
  const motoData = vehicleTypes.find((v) => v.vehicle_type_id === 1);
  const carData = vehicleTypes.find((v) => v.vehicle_type_id === 2);

  const motoAvail = motoData?.available_slots ?? null;
  const motoTotal = motoData?.total_slots ?? null;
  const carAvail = carData?.available_slots ?? null;
  const carTotal = carData?.total_slots ?? null;

  // Total slots from building root
  const totalSlots = capacity?.total_slots ?? null;

  // Status: "ACTIVE" → Open, anything else → Closed
  const isOpen = capacity?.status === "ACTIVE";
  const statusLabel = capacity == null ? "Live" : isOpen ? "Open" : "Closed";
  const statusColor = capacity == null
    ? { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }
    : isOpen
      ? { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }
      : { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: "inherit", background: "#fff", minHeight: "100vh" }}>

      {/* ── Navbar ── */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 40px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/eParkingLogo.png" alt="eParking logo" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>e<span style={{ color: "#1d4ed8" }}>Parking</span></span>
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, letterSpacing: "0.04em" }}>Management System</span>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="lp-nav-links" style={{ gap: 32, position: "relative", height: "100%", alignItems: "center" }}>
          {[
            { label: "Parking", id: "parking" },
            { label: "Features", id: "features" },
            { label: "How It Works", id: "how-it-works" }
          ].map(({ label, id }) => (
            <a
              key={label}
              ref={(el) => (tabRefs.current[id] = el)}
              href={`#${id}`}
              className={`nav-link ${activeSection === id ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                padding: "0 4px",
              }}
            >
              {label}
            </a>
          ))}
          {/* Sliding indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              height: 3,
              background: "#1d4ed8",
              borderRadius: "99px 99px 0 0",
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              ...indicatorStyle
            }}
          />
        </div>

        {/* Desktop action buttons */}
        <div className="lp-nav-actions">
          <button
            onClick={() => navigate(isLoggedIn ? "/user" : "/login")}
            className="btn-nav-login"
          >
            {isLoggedIn ? "Dashboard" : "Log In"}
          </button>
          <button
            onClick={() => navigate(isLoggedIn ? "/user/book" : "/login")}
            className="btn-nav-book"
          >
            Book a Spot
          </button>
        </div>

        {/* Hamburger (mobile/tablet) */}
        <button
          className="lp-hamburger"
          aria-label="Open menu"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu drawer */}
      <div className={`lp-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        {[
          { label: "Parking", id: "parking" },
          { label: "Features", id: "features" },
          { label: "How It Works", id: "how-it-works" }
        ].map(({ label, id }) => (
          <a
            key={label}
            href={`#${id}`}
            className={`lp-mobile-nav-link ${activeSection === id ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(id);
              setMobileMenuOpen(false);
            }}
          >
            {label}
          </a>
        ))}
        <div className="lp-mobile-actions">
          <button
            onClick={() => { navigate(isLoggedIn ? "/user" : "/login"); setMobileMenuOpen(false); }}
            className="btn-nav-login"
          >
            {isLoggedIn ? "Dashboard" : "Log In"}
          </button>
          <button
            onClick={() => { navigate(isLoggedIn ? "/user/book" : "/login"); setMobileMenuOpen(false); }}
            className="btn-nav-book"
          >
            Book a Spot
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <section id="parking" style={{ position: "relative", overflow: "hidden", minHeight: 580, display: "flex", alignItems: "center" }}>
        {/* Bg image */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: "url(https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=1400)",
            backgroundSize: "cover", backgroundPosition: "center 60%",
            filter: "brightness(0.35)",
          }}
        />
        {/* Tint */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(120deg, rgba(29,78,216,0.6) 0%, rgba(15,23,42,0.25) 100%)",
          }}
        />

        {/* Content */}
        <div className="hero-content">
          {/* Left */}
          <div className="hero-left">
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 99, padding: "5px 14px", fontSize: 12,
                color: "#bfdbfe", fontWeight: 500, marginBottom: 22,
              }}
            >
              <div
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: isOpen ? "#4ade80" : "#f87171",
                }}
              />
              {isOpen ? "Live — updating in real time" : "Currently closed"}
            </div>

            <h1 className="hero-h1">
              Smart parking,{" "}
              <span style={{ color: "#60a5fa" }}>no more</span>
              <br />running late
            </h1>

            <p className="hero-p">
              Check live capacity, book up to 1 hour ahead, and check in automatically
              with license plate recognition — no access card required.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate(isLoggedIn ? "/user/book" : "/login")}
                className="btn-hero-book"
              >
                <CalendarCheck size={17} /> Book a Spot
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="btn-hero-how"
              >
                See How It Works
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {TRUST_ITEMS.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
                  <CheckCircle2 size={14} color="#4ade80" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — capacity card */}
          <div>
            <div
              style={{
                background: "rgba(255,255,255,0.97)", borderRadius: 20, padding: 24,
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 8px 48px rgba(0,0,0,0.2)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: isOpen ? "#22c55e" : "#ef4444",
                      boxShadow: isOpen ? "0 0 0 3px #dcfce7" : "0 0 0 3px #fee2e2",
                    }}
                  />
                  Parking Capacity
                </div>
                {/* Status badge from API */}
                <span
                  style={{
                    fontSize: 11,
                    color: statusColor.text,
                    background: statusColor.bg,
                    padding: "3px 10px",
                    borderRadius: 99,
                    fontWeight: 600,
                    border: `1px solid ${statusColor.border}`,
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Pills */}
              {capacityLoading ? (
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  {[1, 2].map((i) => (
                    <div key={i} style={{ flex: 1, height: 100, borderRadius: 14, background: "#f1f5f9", animation: "ldpulse 1.5s infinite" }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <CapacityPill icon={Bike} label="Motorbikes" available={motoAvail} total={motoTotal} accentColor="#0ea5e9" />
                  <CapacityPill icon={Car} label="Cars" available={carAvail} total={carTotal} accentColor="#1d4ed8" />
                </div>
              )}

              {/* Stats row */}
              <div
                style={{
                  display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                  background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden",
                }}
              >
                {[
                  [totalSlots != null ? String(totalSlots) : "—", "Parking Spots"],
                  ["98%", "On-time Check-in"],
                  ["24/7", "Open"],
                ].map(([val, lbl], i) => (
                  <div key={lbl} style={{ padding: "14px 0", textAlign: "center", borderRight: i < 2 ? "1px solid #e2e8f0" : "none" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8" }}>{val}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="features-section">
        <p style={{ fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 10 }}>Features</p>
        <h2 className="section-heading">
          Everything you need to park with ease
        </h2>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: "#f8fafc", borderRadius: 14, padding: "22px 20px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon size={20} color="#1d4ed8" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Steps ── */}
      <section id="how-it-works" className="how-section">
        <div className="how-inner">
          <p style={{ fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 10 }}>How It Works</p>
          <h2 className="section-heading">
            Book a spot in 4 simple steps
          </h2>
          <div className="steps-grid">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} style={{ position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div className="step-connector" />
                )}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1d4ed8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, marginBottom: 14, border: "3px solid #dbeafe" }}>
                    {n}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-heading">
            Ready to book today?
          </h2>
          <p className="cta-sub">
            Dozens of spots are open right now — reserve ahead so you don't miss out.<br />
            Takes 2 minutes, no app required.
          </p>
          <div className="cta-actions">
            <button
              onClick={() => navigate(isLoggedIn ? "/user" : "/login")}
              className="btn-cta-login"
            >
              {isLoggedIn ? "Dashboard" : "Log In"}
            </button>
            <button
              onClick={() => navigate(isLoggedIn ? "/user/book" : "/login")}
              className="btn-cta-book"
            >
              Book a Spot →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0f172a", color: "#cbd5e1" }}>
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <img src="/eParkingLogo.png" alt="eParking logo" style={{ width: 36, height: 36, borderRadius: 9, objectFit: "contain" }} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>e<span style={{ color: "#60a5fa" }}>Parking</span></div>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.04em" }}>Management System</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.75, maxWidth: 260, marginBottom: 24 }}>
              Smart parking management and booking system. Automatic check-in via license plate recognition camera.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "24/7 Support", icon: Clock },
                { label: "SSL Secured", icon: Lock },
              ].map(({ label, icon: Icon }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569", background: "#1e293b", padding: "5px 10px", borderRadius: 6 }}>
                  <Icon size={12} color="#475569" style={{ flexShrink: 0 }} /> {label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Services</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Advance Booking", "Car Parking", "Motorbike Parking", "VNPAY Payment", "Remote Vehicle Lock"].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Support</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["User Guide", "FAQ", "Parking Rules", "Cancellation Policy", "Contact Support"].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: MapPin, text: "Ho Chi Minh City, Vietnam" },
                { icon: Phone, text: "1900 xxxx" },
                { icon: Mail, text: "support@eparking.vn" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                  <Icon size={14} color="#64748b" style={{ flexShrink: 0 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1e293b" }} />

        <div className="footer-bottom">
          <p style={{ fontSize: 12, color: "#334155" }}>© 2026 eParking Management System. All rights reserved.</p>
          <div className="footer-bottom-links">
            {["Privacy Policy", "Terms of Use", "Cancellation Policy"].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: "#334155", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ldpulse { 0%,100%{opacity:1} 50%{opacity:.45} }

        /* ── Nav Links ── */
        .nav-link {
          font-size: 14px;
          color: #475569;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .nav-link:hover, .nav-link.active { color: #1d4ed8; }
        html { scroll-behavior: smooth; }

        /* ── Buttons ── */
        .btn-nav-login {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-nav-login:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
        .btn-nav-login:active { transform: translateY(1px); }

        .btn-nav-book {
          background: #1d4ed8;
          color: #fff;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(29,78,216,0.2);
        }
        .btn-nav-book:hover { background: #1e40af; box-shadow: 0 4px 12px rgba(29,78,216,0.35); transform: translateY(-1px); }
        .btn-nav-book:active { transform: translateY(1px); box-shadow: 0 1px 4px rgba(29,78,216,0.2); }

        .btn-hero-book {
          background: #1d4ed8; color: #fff; border: none;
          padding: 13px 28px; border-radius: 10px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(29,78,216,0.4);
        }
        .btn-hero-book:hover { background: #1e40af; box-shadow: 0 6px 24px rgba(29,78,216,0.6); transform: translateY(-2px); }
        .btn-hero-book:active { transform: translateY(1px); box-shadow: 0 2px 10px rgba(29,78,216,0.4); }

        .btn-hero-how {
          background: rgba(255,255,255,0.1); color: #fff;
          border: 1px solid rgba(255,255,255,0.25);
          padding: 13px 24px; border-radius: 10px;
          font-size: 15px; font-weight: 500; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-hero-how:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); transform: translateY(-2px); }
        .btn-hero-how:active { transform: translateY(1px); }

        .btn-cta-login {
          background: transparent; color: #fff;
          border: 1px solid rgba(255,255,255,0.35);
          padding: 13px 28px; border-radius: 10px;
          font-size: 15px; font-weight: 500; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-cta-login:hover { background: rgba(255,255,255,0.1); border-color: #fff; transform: translateY(-2px); }
        .btn-cta-login:active { transform: translateY(1px); }

        .btn-cta-book {
          background: #fff; color: #1d4ed8; border: none;
          padding: 13px 32px; border-radius: 10px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .btn-cta-book:hover { background: #f8fafc; box-shadow: 0 6px 20px rgba(0,0,0,0.25); transform: translateY(-2px); }
        .btn-cta-book:active { transform: translateY(1px); box-shadow: 0 2px 10px rgba(0,0,0,0.15); }

        /* ── Layout Classes (default: desktop 1100–1440px) ── */
        .lp-nav-links {
          display: flex;
          gap: 32px;
          position: relative;
          height: 100%;
          align-items: center;
        }
        .lp-nav-actions { display: flex; gap: 8px; align-items: center; }

        .lp-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: #0f172a;
          align-items: center;
          justify-content: center;
        }

        .lp-mobile-menu {
          display: none;
          position: fixed;
          top: 64px; left: 0; right: 0;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          z-index: 49;
          flex-direction: column;
          padding: 12px 0 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          animation: mobileMenuIn 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .lp-mobile-menu.open { display: flex; }
        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .lp-mobile-nav-link {
          padding: 14px 24px;
          font-size: 15px; font-weight: 500;
          color: #475569; text-decoration: none;
          border-bottom: 1px solid #f1f5f9;
          transition: color 0.2s, background 0.2s;
        }
        .lp-mobile-nav-link:hover { color: #1d4ed8; background: #f8fafc; }
        .lp-mobile-nav-link.active { color: #1d4ed8; font-weight: 600; }
        .lp-mobile-actions {
          display: flex; gap: 10px;
          padding: 16px 24px 4px;
        }
        .lp-mobile-actions .btn-nav-login,
        .lp-mobile-actions .btn-nav-book { flex: 1; text-align: center; }

        /* Hero */
        .hero-content {
          position: relative; z-index: 2;
          max-width: 1100px; margin: 0 auto;
          padding: 80px 40px 72px; width: 100%;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 56px; align-items: center;
        }
        .hero-left { display: flex; flex-direction: column; }
        .hero-h1 {
          font-size: 44px; font-weight: 800; color: #fff;
          line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 18px;
        }
        .hero-p {
          font-size: 15px; color: rgba(255,255,255,0.72);
          line-height: 1.75; margin-bottom: 32px; max-width: 400px;
        }

        /* Features */
        .features-section {
          background: #fff; padding: 72px 40px;
          max-width: 1100px; margin: 0 auto;
        }
        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .section-heading {
          font-size: 30px; font-weight: 800; color: #0f172a;
          margin-bottom: 40px; letter-spacing: -0.02em;
        }

        /* How it works */
        .how-section {
          background: #f0f7ff;
          border-top: 1px solid #dbeafe; border-bottom: 1px solid #dbeafe;
          padding: 72px 40px;
        }
        .how-inner { max-width: 1100px; margin: 0 auto; }
        .steps-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; position: relative; }
        .step-connector {
          position: absolute; top: 20px;
          left: calc(50% + 22px); right: -50%;
          height: 1px; background: #bfdbfe; z-index: 0;
        }

        /* CTA */
        .cta-section { background: #1d4ed8; padding: 72px 40px; }
        .cta-inner { max-width: 700px; margin: 0 auto; text-align: center; }
        .cta-heading { font-size: 34px; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 14px; }
        .cta-sub { font-size: 15px; color: #bfdbfe; margin-bottom: 36px; line-height: 1.75; }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* Footer */
        .footer-grid {
          max-width: 1100px; margin: 0 auto;
          padding: 56px 40px 40px;
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
        }
        .footer-bottom {
          max-width: 1100px; margin: 0 auto;
          padding: 20px 40px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-bottom-links { display: flex; gap: 24px; }

        /* ════════════════════════════════════════════
           RESPONSIVE BREAKPOINTS
           ════════════════════════════════════════════ */

        /* ── 27-inch / 2560px+ ── */
        @media (min-width: 2560px) {
          .hero-content { max-width: 2000px; padding: 140px 100px 120px; gap: 120px; }
          .hero-h1 { font-size: 72px; }
          .hero-p { font-size: 18px; max-width: 560px; }
          .features-section { max-width: 2000px; padding: 120px 100px; }
          .features-grid { gap: 36px; }
          .section-heading { font-size: 44px; }
          .how-section { padding: 120px 100px; }
          .how-inner { max-width: 2000px; }
          .steps-grid { gap: 40px; }
          .cta-section { padding: 120px 100px; }
          .cta-heading { font-size: 48px; }
          .footer-grid { max-width: 2000px; padding: 80px 100px 64px; }
          .footer-bottom { max-width: 2000px; padding: 32px 100px; }
        }

        /* ── 24-inch / 1920px ── */
        @media (min-width: 1920px) and (max-width: 2559px) {
          .hero-content { max-width: 1600px; padding: 120px 80px 100px; gap: 96px; }
          .hero-h1 { font-size: 60px; }
          .hero-p { font-size: 17px; max-width: 500px; }
          .features-section { max-width: 1600px; padding: 100px 80px; }
          .features-grid { gap: 28px; }
          .section-heading { font-size: 38px; }
          .how-section { padding: 100px 80px; }
          .how-inner { max-width: 1600px; }
          .steps-grid { gap: 32px; }
          .cta-section { padding: 100px 80px; }
          .cta-heading { font-size: 42px; }
          .footer-grid { max-width: 1600px; padding: 72px 80px 56px; }
          .footer-bottom { max-width: 1600px; padding: 28px 80px; }
        }

        /* ── Large desktop / 1440px ── */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .hero-content { max-width: 1280px; padding: 100px 60px 90px; gap: 72px; }
          .hero-h1 { font-size: 52px; }
          .features-section { max-width: 1280px; padding: 88px 60px; }
          .section-heading { font-size: 34px; }
          .how-section { padding: 88px 60px; }
          .how-inner { max-width: 1280px; }
          .cta-section { padding: 88px 60px; }
          .footer-grid { max-width: 1280px; padding: 64px 60px 48px; gap: 60px; }
          .footer-bottom { max-width: 1280px; padding: 24px 60px; }
        }

        /* ── Laptop / 1024px–1279px ── */
        @media (max-width: 1279px) and (min-width: 1024px) {
          .hero-content { max-width: 960px; padding: 72px 32px 64px; gap: 40px; }
          .hero-h1 { font-size: 40px; }
          .features-section { max-width: 960px; padding: 64px 32px; }
          .how-section { padding: 64px 32px; }
          .how-inner { max-width: 960px; }
          .cta-section { padding: 64px 32px; }
          .footer-grid { max-width: 960px; padding: 48px 32px 36px; gap: 36px; }
          .footer-bottom { max-width: 960px; padding: 18px 32px; }
        }

        /* ── Tablet / 768px–1023px ── */
        @media (max-width: 1023px) and (min-width: 768px) {
          nav { padding: 0 24px !important; }
          .lp-nav-links { display: none !important; }
          .lp-hamburger { display: flex !important; }

          .hero-content { grid-template-columns: 1fr; padding: 64px 24px 56px; gap: 36px; }
          .hero-left { align-items: center; text-align: center; }
          .hero-h1 { font-size: 38px; text-align: center; }
          .hero-p { max-width: 100%; text-align: center; }

          .features-section { padding: 56px 24px; max-width: 100%; }
          .features-grid { grid-template-columns: repeat(2,1fr); gap: 16px; }

          .how-section { padding: 56px 24px; }
          .how-inner { max-width: 100%; }
          .steps-grid { grid-template-columns: repeat(2,1fr); gap: 28px; }
          .step-connector { display: none; }

          .cta-section { padding: 56px 24px; }

          .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; padding: 48px 24px 36px; }
          .footer-bottom { padding: 18px 24px; flex-direction: column; gap: 12px; text-align: center; }
          .footer-bottom-links { justify-content: center; }
        }

        /* ── Mobile Large / 480px–767px ── */
        @media (max-width: 767px) and (min-width: 480px) {
          nav { padding: 0 16px !important; }
          .lp-nav-links { display: none !important; }
          .lp-nav-actions { display: none !important; }
          .lp-hamburger { display: flex !important; }

          .hero-content { grid-template-columns: 1fr; padding: 52px 16px 48px; gap: 28px; }
          .hero-left { align-items: center; text-align: center; }
          .hero-h1 { font-size: 32px; text-align: center; }
          .hero-p { max-width: 100%; text-align: center; font-size: 14px; }

          .features-section { padding: 48px 16px; max-width: 100%; }
          .features-grid { grid-template-columns: 1fr; gap: 14px; }
          .section-heading { font-size: 24px; }

          .how-section { padding: 48px 16px; }
          .how-inner { max-width: 100%; }
          .steps-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
          .step-connector { display: none; }

          .cta-section { padding: 48px 16px; }
          .cta-heading { font-size: 26px; }
          .cta-sub { font-size: 14px; }

          .footer-grid { grid-template-columns: 1fr 1fr; padding: 40px 16px 28px; gap: 28px; }
          .footer-bottom { padding: 16px; flex-direction: column; gap: 10px; text-align: center; }
          .footer-bottom-links { justify-content: center; gap: 16px; }
        }

        /* ── Mobile Small / <480px ── */
        @media (max-width: 479px) {
          nav { padding: 0 14px !important; height: 56px !important; }
          .lp-nav-links { display: none !important; }
          .lp-nav-actions { display: none !important; }
          .lp-hamburger { display: flex !important; }
          .lp-mobile-menu { top: 56px; }

          .hero-content { grid-template-columns: 1fr; padding: 44px 14px 40px; gap: 24px; }
          .hero-left { align-items: center; text-align: center; }
          .hero-h1 { font-size: 28px; line-height: 1.2; text-align: center; }
          .hero-p { font-size: 13px; max-width: 100%; text-align: center; }

          .btn-hero-book, .btn-hero-how {
            padding: 11px 20px !important; font-size: 14px !important;
            width: 100%; justify-content: center;
          }

          .features-section { padding: 40px 14px; max-width: 100%; }
          .features-grid { grid-template-columns: 1fr; gap: 12px; }
          .section-heading { font-size: 22px; }

          .how-section { padding: 40px 14px; }
          .how-inner { max-width: 100%; }
          .steps-grid { grid-template-columns: 1fr; gap: 20px; }
          .step-connector { display: none; }

          .cta-section { padding: 44px 14px; }
          .cta-heading { font-size: 24px; }
          .cta-sub { font-size: 13px; }
          .cta-actions { flex-direction: column; align-items: stretch; }
          .btn-cta-login, .btn-cta-book { width: 100%; text-align: center; }

          .footer-grid { grid-template-columns: 1fr; padding: 36px 14px 24px; gap: 28px; }
          .footer-bottom { padding: 14px; flex-direction: column; gap: 10px; text-align: center; }
          .footer-bottom-links { flex-direction: column; align-items: center; gap: 8px; }
        }
      `}</style>
    </div>
  );
}