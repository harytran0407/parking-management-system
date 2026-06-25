import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import api from "../utils/api";


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
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "16px 18px",
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "#64748b",
          marginBottom: 10,
        }}
      >
        <Icon size={13} color={accentColor} />
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
              fontWeight: 600,
            }}
          >
            Full
          </span>
        )}
      </div>
      {/* available / total — red when full */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: isFull ? "#dc2626" : "#0f172a",
            lineHeight: 1,
          }}
        >
          {available != null ? available : "—"}
        </span>
        <span style={{ fontSize: 12, color: isFull ? "#dc2626" : "#94a3b8" }}>
          / {total ?? "—"} spots
        </span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 99,
          background: "#e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${pct}%`,
            background: isFull ? "#ef4444" : accentColor,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>{pct}% occupied</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [capacity, setCapacity] = useState(null);
  const [capacityLoading, setCapacityLoading] = useState(true);

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
  const carData  = vehicleTypes.find((v) => v.vehicle_type_id === 2);

  const motoAvail = motoData?.available_slots ?? null;
  const motoTotal = motoData?.total_slots     ?? null;
  const carAvail  = carData?.available_slots  ?? null;
  const carTotal  = carData?.total_slots      ?? null;

  // Total slots from building root
  const totalSlots = capacity?.total_slots ?? null;

  // Status: "ACTIVE" → Open, anything else → Closed
  const isOpen   = capacity?.status === "ACTIVE";
  const statusLabel = capacity == null ? "Live" : isOpen ? "Open" : "Closed";
  const statusColor = capacity == null
    ? { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }
    : isOpen
    ? { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }
    : { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" };

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

        <div style={{ display: "flex", gap: 32 }}>
          {["Parking", "How It Works", "Support"].map((l) => (
            <a key={l} href="#" style={{ fontSize: 14, color: "#475569", textDecoration: "none" }}>{l}</a>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => navigate("/login")}
            style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#0f172a", padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/user/book")}
            style={{ background: "#1d4ed8", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Book a Spot
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: 580, display: "flex", alignItems: "center" }}>
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
        <div
          style={{
            position: "relative", zIndex: 2,
            maxWidth: 1100, margin: "0 auto", padding: "80px 40px 72px",
            width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 56, alignItems: "center",
          }}
        >
          {/* Left */}
          <div>
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

            <h1
              style={{
                fontSize: 44, fontWeight: 800, color: "#fff",
                lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 18,
              }}
            >
              Smart parking,{" "}
              <span style={{ color: "#60a5fa" }}>no more</span>
              <br />running late
            </h1>

            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, marginBottom: 32, maxWidth: 400 }}>
              Check live capacity, book up to 1 hour ahead, and check in automatically
              with license plate recognition — no access card required.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 36 }}>
              <button
                onClick={() => navigate("/user/book")}
                style={{
                  background: "#1d4ed8", color: "#fff", border: "none",
                  padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 20px rgba(29,78,216,0.5)",
                }}
              >
                <CalendarCheck size={17} /> Book a Spot
              </button>
              <button
                style={{
                  background: "rgba(255,255,255,0.1)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  padding: "13px 24px", borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: "pointer",
                }}
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
                  <CapacityPill icon={Car}  label="Cars"       available={carAvail}  total={carTotal}  accentColor="#1d4ed8" />
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
      <section style={{ background: "#fff", padding: "72px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 10 }}>Features</p>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", marginBottom: 40, letterSpacing: "-0.02em" }}>
          Everything you need to park with ease
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
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
      <section style={{ background: "#f0f7ff", borderTop: "1px solid #dbeafe", borderBottom: "1px solid #dbeafe", padding: "72px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 10 }}>How It Works</p>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", marginBottom: 40, letterSpacing: "-0.02em" }}>
            Book a spot in 4 simple steps
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, position: "relative" }}>
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} style={{ position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", top: 20, left: "calc(50% + 22px)", right: "-50%", height: 1, background: "#bfdbfe", zIndex: 0 }} />
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
      <section style={{ background: "#1d4ed8", padding: "72px 40px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 14 }}>
            Ready to book today?
          </h2>
          <p style={{ fontSize: 15, color: "#bfdbfe", marginBottom: 36, lineHeight: 1.75 }}>
            Dozens of spots are open right now — reserve ahead so you don't miss out.<br />
            Takes 2 minutes, no app required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => navigate("/login")}
              style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: "pointer" }}
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/user/book")}
              style={{ background: "#fff", color: "#1d4ed8", border: "none", padding: "13px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
            >
              Book a Spot →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0f172a", color: "#cbd5e1" }}>
        {/* Main footer grid */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 40px 40px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }}>
          {/* Brand column */}
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
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "24/7 Support", icon: "🕐" },
                { label: "SSL Secured", icon: "🔒" },
              ].map(({ label, icon }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569", background: "#1e293b", padding: "5px 10px", borderRadius: 6 }}>
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Col: Services */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Services</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Advance Booking", "Car Parking", "Motorbike Parking", "VNPAY Payment", "Remote Vehicle Lock"].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>

          {/* Col: Support */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Support</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["User Guide", "FAQ", "Parking Rules", "Cancellation Policy", "Contact Support"].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>

          {/* Col: Contact */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "📍", text: "Ho Chi Minh City, Vietnam" },
                { icon: "📞", text: "1900 xxxx" },
                { icon: "✉️", text: "support@eparking.vn" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#64748b" }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1e293b" }} />

        {/* Bottom bar */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, color: "#334155" }}>© 2026 eParking Management System. All rights reserved.</p>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy Policy", "Terms of Use", "Cancellation Policy"].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: "#334155", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ldpulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </div>
  );
}