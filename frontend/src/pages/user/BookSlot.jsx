import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Car,
  Bike,
  ArrowLeft,
  CheckCircle,
  MapPin,
  X,
  Clock,
  CreditCard,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ==========================================
// CENTRALIZED HIGH-CONTRAST COLOR MAPPING
// Đã fix toàn bộ màu sắc chuẩn 100% theo đặc tả FR-BK-02 và tối ưu đa giao diện
// ==========================================
const slotStyles = {
  available: {
    card: "bg-emerald-50/90 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-500 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer",
    badge: "bg-emerald-500 border-emerald-600 dark:border-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  occupied: {
    // Đang dùng (Màu Đỏ) - Tăng mạnh độ bão hòa màu viền và chữ để phân biệt tuyệt đối với các màu khác
    card: "bg-red-50/90 border-red-500 text-red-700 dark:bg-red-950/40 dark:border-red-500 dark:text-red-400 cursor-not-allowed font-black opacity-90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]",
    badge: "bg-red-500 border-red-600 dark:border-red-400",
    text: "text-red-600 dark:text-red-400",
  },
  reserved: {
    card: "bg-amber-50/90 border-amber-500 text-amber-800 dark:bg-amber-950/20 dark:border-amber-500 dark:text-amber-400 cursor-not-allowed",
    badge: "bg-amber-500 border-amber-600 dark:border-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  staff: {
    card: "bg-purple-50/90 border-purple-500 text-purple-800 dark:bg-purple-950/20 dark:border-purple-500 dark:text-purple-400 cursor-not-allowed",
    badge: "bg-purple-500 border-purple-600 dark:border-purple-400",
    text: "text-purple-600 dark:text-purple-400",
  },
  maintenance: {
    card: "bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 cursor-not-allowed stripes-bg",
    badge: "bg-slate-400 border-slate-500 dark:border-slate-600",
    text: "text-slate-500 dark:text-slate-400",
  },
};

export default function BookSlot() {
  const navigate = useNavigate();

  // ==========================================
  // BOOKING FLOW STATE
  // ==========================================
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    vehicleType: null,
    floorId: null,
    slotId: null,
    slotName: null,
  });

  const [selectedFloor, setSelectedFloor] = useState(1);
  const [slots, setSlots] = useState([]);

  // MODAL STATE FOR BOOKING PHASES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState("form");

  // TIME AND PRICING STATE
  const [timeData, setTimeData] = useState({
    startTime: "",
    endTime: "",
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const DEPOSIT_FEE = 10000;

  // ==========================================
  // MEMORY CACHE FOR MOCK DATA
  // ==========================================
  const gridCache = useRef({});

  const availableSlotsOverview = { car: 12, motorbike: 45 };
  const mockFloors = [
    { id: 1, name: "Basement B2" },
    { id: 2, name: "Basement B1" },
    { id: 3, name: "Floor 1 (VIP)" },
  ];

  // ==========================================
  // [API INTEGRATION] - FETCH & GENERATE MAP GRID
  // ==========================================
  useEffect(() => {
    const cacheKey = `${selectedFloor}_${bookingData.vehicleType}`;

    if (gridCache.current[cacheKey]) {
      setSlots(gridCache.current[cacheKey]);
      return;
    }

    const grid = [];
    for (let i = 1; i <= 60; i++) {
      const rand = Math.random();
      let status = "available";
      if (rand > 0.5 && rand <= 0.7) status = "occupied";
      else if (rand > 0.7 && rand <= 0.8) status = "reserved";
      else if (rand > 0.8 && rand <= 0.9) status = "maintenance";
      else if (rand > 0.9) status = "staff";

      grid.push({ id: `S${i}`, name: `${i}`, status: status });
    }

    gridCache.current[cacheKey] = grid;
    setSlots(grid);
  }, [selectedFloor, bookingData.vehicleType]);

  // ==========================================
  // DYNAMIC STATS & OCCUPANCY RATE CALCULATION
  // ==========================================
  const stats = useMemo(() => {
    return slots.reduce(
      (acc, slot) => {
        let effectiveStatus = slot.status;

        if (
          bookingData.slotId === slot.id &&
          selectedFloor === bookingData.floorId
        ) {
          effectiveStatus = "reserved";
        }

        acc[effectiveStatus] = (acc[effectiveStatus] || 0) + 1;
        acc.total++;
        return acc;
      },
      {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0,
        staff: 0,
      },
    );
  }, [slots, bookingData.slotId, bookingData.floorId, selectedFloor]);

  // ==========================================
  // DYNAMIC PRICING LOGIC
  // ==========================================
  useEffect(() => {
    if (timeData.startTime && timeData.endTime) {
      const start = new Date(timeData.startTime).getTime();
      const end = new Date(timeData.endTime).getTime();

      if (end > start) {
        const hours = (end - start) / (1000 * 60 * 60);
        const ratePerHour = bookingData.vehicleType === "car" ? 20000 : 5000;
        setTotalPrice(Math.ceil(hours) * ratePerHour);
      } else {
        setTotalPrice(0);
      }
    }
  }, [timeData.startTime, timeData.endTime, bookingData.vehicleType]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleSelectVehicle = (type) => {
    setBookingData({
      vehicleType: type,
      floorId: null,
      slotId: null,
      slotName: null,
    });
    setStep(2);
  };

  const handleSelectSlot = (slot) => {
    if (slot.status !== "available") return;

    if (
      bookingData.slotId === slot.id &&
      selectedFloor === bookingData.floorId
    ) {
      setBookingData({
        ...bookingData,
        slotId: null,
        slotName: null,
        floorId: null,
      });
    } else {
      setBookingData({
        ...bookingData,
        slotId: slot.id,
        slotName: slot.name,
        floorId: selectedFloor,
      });
      setModalPhase("form");
      setTimeData({ startTime: "", endTime: "" });
      setTotalPrice(0);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBookingData({
      ...bookingData,
      slotId: null,
      slotName: null,
      floorId: null,
    });
  };

  const handlePaymentSuccess = () => {
    setModalPhase("success");
  };

  // ==========================================
  // RENDER STEP 1: CHOOSE VEHICLE
  // ==========================================
  if (step === 1) {
    return (
      <div className="animate-slide-in h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/user")}
            className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Choose Vehicle Type
          </h2>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          <button
            onClick={() => handleSelectVehicle("motorbike")}
            className="group relative rounded-3xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-sm flex flex-col"
          >
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1000"
                alt="Motorbike"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-end p-8 text-left">
              <div className="bg-blue-600/90 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                <Bike size={32} />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">Motorbike</h3>
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 w-max mt-4">
                <span className="text-white font-medium">
                  {availableSlotsOverview.motorbike} slots available
                </span>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleSelectVehicle("car")}
            className="group relative rounded-3xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all shadow-sm flex flex-col"
          >
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=1000"
                alt="Car"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-end p-8 text-left">
              <div className="bg-blue-600/90 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg">
                <Car size={32} />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">Automobile</h3>
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 w-max mt-4">
                <span className="text-white font-medium">
                  {availableSlotsOverview.car} slots available
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 2: INTERACTIVE MAP
  // ==========================================
  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] flex flex-col relative">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => setStep(1)}
          className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          Select Location{" "}
          <span className="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-lg text-lg capitalize">
            ({bookingData.vehicleType})
          </span>
        </h2>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* LEFT COLUMN: MAP GRID */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm">
          <div className="flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto custom-scrollbar">
            {mockFloors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => setSelectedFloor(floor.id)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl font-semibold transition-all ${selectedFloor === floor.id ? "bg-slate-800 dark:bg-blue-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
              >
                {floor.name}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {slots.map((slot) => {
                const isSelected =
                  bookingData.slotId === slot.id &&
                  selectedFloor === bookingData.floorId;

                let colorClasses = isSelected
                  ? "bg-blue-600 text-white ring-4 ring-blue-500/30 scale-105 shadow-lg z-10 border-blue-600 dark:bg-blue-600 dark:border-blue-400 dark:text-white cursor-pointer"
                  : slotStyles[slot.status]?.card || slotStyles.available.card;

                return (
                  <button
                    key={slot.id}
                    onClick={() => handleSelectSlot(slot)}
                    className={`relative aspect-square rounded-2xl flex items-center justify-center font-black text-lg border-2 transition-all duration-200 ${colorClasses}`}
                  >
                    {slot.name}
                    {isSelected && (
                      <CheckCircle
                        size={14}
                        className="absolute -top-1 -right-1 text-white bg-blue-600 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LEGEND & STATS */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm rounded-3xl">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 uppercase text-sm tracking-wider">
              Legend
            </h3>

            <ul className="space-y-4">
              {[
                {
                  label: "Available",
                  key: "available",
                  count: stats.available,
                },
                { label: "Occupied", key: "occupied", count: stats.occupied },
                { label: "Reserved", key: "reserved", count: stats.reserved },
                { label: "Staff Only", key: "staff", count: stats.staff },
                {
                  label: "Maintenance",
                  key: "maintenance",
                  count: stats.maintenance,
                },
              ].map((item) => {
                const currentStyle = slotStyles[item.key];
                return (
                  <li
                    key={item.key}
                    className="flex items-center justify-between font-semibold text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {/* Badge màu vuông đồng bộ với thiết kế sơ đồ hình vuông */}
                      <span
                        className={`w-3.5 h-3.5 rounded-md border ${currentStyle.badge}`}
                      ></span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                    </div>
                    {/* Số lượng tiệp màu tracking theo trạng thái */}
                    <span
                      className={`font-bold font-mono text-base ${currentStyle.text}`}
                    >
                      {item.count || 0}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-sm transition-colors duration-300">
            <div className="relative z-10">
              <p className="text-blue-200 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                Occupancy Rate
              </p>
              <p className="text-4xl font-black text-white mb-1">
                {Math.round(
                  ((stats.total - (stats.available || 0)) / stats.total) * 100,
                )}
                %
              </p>
              <p className="text-sm text-blue-100 dark:text-slate-300">
                {stats.available || 0} slots remaining
              </p>
            </div>
            <MapPin className="absolute -right-4 -bottom-4 text-white/10 dark:text-white/5 w-32 h-32" />
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL: BOOKING & PAYMENT PHASES
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                Slot {bookingData.slotName} - Floor {bookingData.floorId}
              </h2>
              {modalPhase === "form" && (
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6">
              {modalPhase === "form" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block flex items-center gap-2">
                        <Clock size={16} /> Entry Time:
                      </label>
                      <input
                        type="datetime-local"
                        value={timeData.startTime}
                        onChange={(e) =>
                          setTimeData({
                            ...timeData,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block flex items-center gap-2">
                        <Clock size={16} /> Expected Exit Time:
                      </label>
                      <input
                        type="datetime-local"
                        value={timeData.endTime}
                        onChange={(e) =>
                          setTimeData({ ...timeData, endTime: e.target.value })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Estimated Fee:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {totalPrice.toLocaleString()} VND
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-500/20">
                      <span className="text-blue-800 dark:text-blue-300 font-bold">
                        Reservation Deposit:
                      </span>
                      <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                        {DEPOSIT_FEE.toLocaleString()} VND
                      </span>
                    </div>
                    <p className="text-xs text-blue-600/70 dark:text-blue-300/70 mt-2 italic text-right">
                      *Remaining balance is paid upon exit
                    </p>
                  </div>

                  <button
                    disabled={
                      !timeData.startTime ||
                      !timeData.endTime ||
                      totalPrice <= 0
                    }
                    onClick={() => setModalPhase("payment")}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 mt-4"
                  >
                    <CreditCard size={20} /> PAY DEPOSIT
                  </button>
                </div>
              )}

              {modalPhase === "payment" && (
                <div className="text-center animate-fade-in">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">
                    Scan to Pay Deposit
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Please transfer the exact amount below for automatic
                    confirmation.
                  </p>

                  <div className="bg-white p-4 rounded-2xl inline-block border-2 border-slate-200 mb-6 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Deposit_${DEPOSIT_FEE}_Slot_${bookingData.slotId}`}
                      alt="Banking QR"
                      className="w-48 h-48"
                    />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-6">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Amount:{" "}
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                        {DEPOSIT_FEE.toLocaleString()} VND
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={handlePaymentSuccess}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30"
                  >
                    I Have Transferred Successfully
                  </button>
                </div>
              )}

              {modalPhase === "success" && (
                <div className="text-center animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2">
                    Booking Successful!
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Here is your e-ticket. Please save it.
                  </p>

                  <div className="bg-white p-4 rounded-2xl inline-block border-4 border-emerald-500 mb-4 shadow-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Ticket_Valid_${bookingData.slotId}`}
                      alt="Ticket QR"
                      className="w-48 h-48"
                    />
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 mb-6 text-left flex gap-3 items-start">
                    <Info
                      className="text-amber-500 shrink-0 mt-0.5"
                      size={18}
                    />
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                      Important Note: Please show this QR code to the security
                      staff when entering and exiting the parking lot to
                      calculate your final fee.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      handleCloseModal();
                      navigate("/user");
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
                  >
                    OK, Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
