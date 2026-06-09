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
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const slotStyles = {
  available: {
    card: "bg-emerald-50/80 border-emerald-500 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-500 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer",
    badge: "bg-emerald-500 border-emerald-600 dark:border-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  occupied: {
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

  const [step, setStep] = useState(1);
  const [userVehicles, setUserVehicles] = useState([]);
  const [availableSlotsOverview, setAvailableSlotsOverview] = useState({ car: 0, motorbike: 0 });

  const [bookingData, setBookingData] = useState({
    vehicleType: null, // 'car' (type 2) hoặc 'motorbike' (type 1)
    vehicleId: "",
    floorId: 1,
    slotId: null,
    slotName: null,
  });

  const [isAddingNewVehicle, setIsAddingNewVehicle] = useState(false);
  const [newPlateNumber, setNewPlateNumber] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newColor, setNewColor] = useState("");

  const [selectedFloor, setSelectedFloor] = useState(1);
  const [slots, setSlots] = useState([]);
  const [floors, setFloors] = useState([]);

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState("form");
  const [qrCodeData, setQrCodeData] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);

  // TIME AND PRICING STATE
  const [timeData, setTimeData] = useState({ startTime: "", endTime: "" });
  const [totalPrice, setTotalPrice] = useState(0);
  const DEPOSIT_FEE = 10000;

  // Fetch floors dynamically based on selected vehicle type
  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const response = await api.get("/parking/floors");
        if (response.data && response.data.success) {
          const rawZones = response.data.data || [];
          const typeId = bookingData.vehicleType === "car" ? 2 : 1;
          
          // Filter zones that support the selected vehicle type
          const relevantZones = rawZones.filter(z => z.vehicle_type_id === typeId);
          
          // Extract unique floor numbers
          const uniqueFloorNums = [...new Set(relevantZones.map(z => z.floor_number))];
          
          // Map to floors array
          const mappedFloors = uniqueFloorNums.sort((a, b) => a - b).map(num => ({
            id: num,
            name: `Basement B${num}`
          }));
          
          setFloors(mappedFloors);
          if (mappedFloors.length > 0) {
            setSelectedFloor(mappedFloors[0].id);
            setBookingData(prev => ({
              ...prev,
              floorId: mappedFloors[0].id
            }));
          }
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách tầng:", err);
      }
    };
    if (bookingData.vehicleType) {
      fetchFloors();
    }
  }, [bookingData.vehicleType]);

  // Load stats and list overview
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const slotsRes = await api.get("/parking/slots?pageSize=500");
        if (slotsRes.data && slotsRes.data.success) {
          const list = slotsRes.data.data.slots || [];
          const carAvailable = list.filter(s => s.vehicle_type_id === 2 && s.status === "AVAILABLE").length;
          const bikeAvailable = list.filter(s => s.vehicle_type_id === 1 && s.status === "AVAILABLE").length;
          setAvailableSlotsOverview({ car: carAvailable, motorbike: bikeAvailable });
        }
      } catch (err) {
        console.error("Lỗi lấy thống kê slot:", err);
      }
    };
    fetchStats();
  }, []);

  // Fetch Vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get("/vehicles");
        if (response.data && response.data.success) {
          setUserVehicles(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách xe:", error);
      }
    };
    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const typeId = bookingData.vehicleType === "car" ? 2 : 1;
    return userVehicles.filter((v) => v.vehicle_type_id === typeId);
  }, [userVehicles, bookingData.vehicleType]);

  // Fetch Floor Grid Slots
  const fetchFloorGrid = async () => {
    if (!bookingData.vehicleType) return;
    try {
      const typeId = bookingData.vehicleType === "car" ? 2 : 1;
      const response = await api.get(`/parking/slots?floor=${selectedFloor}&vehicleTypeId=${typeId}&pageSize=100`);
      if (response.data && response.data.success) {
        const mapped = (response.data.data.slots || []).map(s => ({
          id: s.slot_id,
          name: s.slot_name,
          status: s.status.toLowerCase()
        }));
        setSlots(mapped);
      }
    } catch (error) {
      console.error("Lỗi lấy sơ đồ tầng:", error);
    }
  };

  useEffect(() => {
    fetchFloorGrid();
  }, [selectedFloor, bookingData.vehicleType]);

  // Stats for Legend
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
      }
    );
  }, [slots, bookingData.slotId, bookingData.floorId, selectedFloor]);

  const occupancyRatePercentage = useMemo(() => {
    if (!stats.total || stats.total === 0) return 0;
    return Math.round(((stats.total - stats.available) / stats.total) * 100);
  }, [stats.total, stats.available]);

  // Calculate pricing
  useEffect(() => {
    if (timeData.startTime && timeData.endTime) {
      const start = new Date(timeData.startTime).getTime();
      const end = new Date(timeData.endTime).getTime();
      if (end > start) {
        const hours = (end - start) / (1000 * 60 * 60);
        setTotalPrice(
          Math.ceil(hours) * (bookingData.vehicleType === "car" ? 20000 : 5000)
        );
      } else {
        setTotalPrice(0);
      }
    }
  }, [timeData.startTime, timeData.endTime, bookingData.vehicleType]);

  const handleSelectSlot = (slot) => {
    if (slot.status.toLowerCase() !== "available") return;

    if (
      bookingData.slotId === slot.id &&
      selectedFloor === bookingData.floorId
    ) {
      setBookingData({
        ...bookingData,
        slotId: null,
        slotName: null,
        floorId: null,
        vehicleId: "",
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
      setIsAddingNewVehicle(false);
      setNewPlateNumber("");
      setNewBrand("");
      setNewModel("");
      setNewColor("");
      setIsModalOpen(true);
    }
  };

  const selectedVehiclePlate = useMemo(() => {
    if (isAddingNewVehicle && newPlateNumber)
      return newPlateNumber.toUpperCase();
    return (
      userVehicles.find((v) => v.vehicle_id === Number(bookingData.vehicleId))
        ?.vehicle_plate_number || "N/A"
    );
  }, [userVehicles, bookingData.vehicleId, isAddingNewVehicle, newPlateNumber]);

  const isFormValid = useMemo(() => {
    const isTimeFilled =
      timeData.startTime && timeData.endTime && totalPrice > 0;
    return isAddingNewVehicle
      ? newPlateNumber.trim().length >= 5 && newBrand.trim() && newModel.trim() && isTimeFilled
      : bookingData.vehicleId !== "" && isTimeFilled;
  }, [
    isAddingNewVehicle,
    bookingData.vehicleId,
    newPlateNumber,
    newBrand,
    newModel,
    timeData,
    totalPrice,
  ]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBookingData({
      ...bookingData,
      slotId: null,
      slotName: null,
      floorId: null,
      vehicleId: "",
    });
    setIsAddingNewVehicle(false);
    setNewPlateNumber("");
  };

  const handleSelectVehicleType = (type) => {
    setBookingData({
      vehicleType: type,
      vehicleId: "",
      floorId: 1,
      slotId: null,
      slotName: null,
    });
    setStep(2);
  };

  // VNPay QR Code Flow
  const handleInitiatePayment = async () => {
    try {
      let finalVehicleId = bookingData.vehicleId;

      if (isAddingNewVehicle) {
        // Register new vehicle first
        const payload = {
          vehicle_plate_number: newPlateNumber.toUpperCase().trim(),
          vehicle_type_id: bookingData.vehicleType === "car" ? 2 : 1,
          brand: newBrand.trim(),
          model: newModel.trim(),
          color: newColor.trim() || "Black",
          vehicle_description: `${newBrand} ${newModel}`,
        };
        const vehicleRes = await api.post("/vehicles", payload);
        if (vehicleRes.data && vehicleRes.data.success) {
          finalVehicleId = vehicleRes.data.data.vehicle_id;
          // refresh vehicles list
          const refreshRes = await api.get("/vehicles");
          if (refreshRes.data && refreshRes.data.success) {
            setUserVehicles(refreshRes.data.data);
          }
        }
      }

      // Prepare request
      const bookingPayload = {
        slot_id: bookingData.slotId,
        vehicle_id: Number(finalVehicleId),
        expected_arrival: new Date(timeData.startTime).toISOString(),
        expired_at: new Date(timeData.endTime).toISOString(),
        notes: "Deposit reservation payment via VNPay",
      };

      // We call the API to create booking directly after initiating the simulated payment.
      setCreatedBooking(bookingPayload);
      
      const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Deposit_${DEPOSIT_FEE}_Slot_${bookingData.slotId}_Vehicle_${finalVehicleId}`;
      setQrCodeData(mockQrUrl);
      setModalPhase("payment");
    } catch (error) {
      console.error("Lỗi tạo hóa đơn/xe:", error);
      alert(error.response?.data?.message || "Failed to register vehicle or initiate payment.");
    }
  };

  const handlePaymentSuccess = async () => {
    if (!createdBooking) return;
    try {
      const response = await api.post("/bookings", createdBooking);
      if (response.data && response.data.success) {
        setModalPhase("success");
        fetchFloorGrid();
      }
    } catch (error) {
      console.error("Lỗi xác minh thanh toán:", error);
      alert(error.response?.data?.message || "Failed to complete booking. Please try again.");
    }
  };

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
            onClick={() => handleSelectVehicleType("motorbike")}
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
            onClick={() => handleSelectVehicleType("car")}
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
        {/* FLOOR GRID MAP */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm">
          <div className="flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto custom-scrollbar">
            {floors.map((floor) => (
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

        {/* SIDE LEGEND */}
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
                {
                  label: "Maintenance",
                  key: "maintenance",
                  count: stats.maintenance,
                },
              ].map((item) => {
                const currentStyle = slotStyles[item.key] || slotStyles.available;
                return (
                  <li
                    key={item.key}
                    className="flex items-center justify-between font-semibold text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3.5 h-3.5 rounded-md border ${currentStyle.badge}`}
                      ></span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                    </div>
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

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-sm">
            <p className="text-blue-200 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Occupancy Rate
            </p>
            <p className="text-4xl font-black text-white mb-1">
              {occupancyRatePercentage}%
            </p>
            <p className="text-sm text-blue-100 dark:text-slate-300">
              {stats.available} slots remaining
            </p>
            <MapPin className="absolute -right-4 -bottom-4 text-white/10 dark:text-white/5 w-32 h-32" />
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" /> Slot{" "}
                {bookingData.slotName} - Floor {bookingData.floorId}
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
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        {bookingData.vehicleType === "car" ? (
                          <Car size={16} />
                        ) : (
                          <Bike size={16} />
                        )}{" "}
                        Vehicle Information:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewVehicle(!isAddingNewVehicle);
                          setBookingData({ ...bookingData, vehicleId: "" });
                          setNewPlateNumber("");
                          setNewBrand("");
                          setNewModel("");
                          setNewColor("");
                        }}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {isAddingNewVehicle ? (
                          <>
                            <RotateCcw size={12} /> Saved Vehicle
                          </>
                        ) : (
                          <>
                            <PlusCircle size={12} /> + New Vehicle
                          </>
                        )}
                      </button>
                    </div>

                    {!isAddingNewVehicle ? (
                      <select
                        required
                        value={bookingData.vehicleId}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            vehicleId: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>
                          -- CHOOSE LICENSE PLATE --
                        </option>
                        {filteredVehicles.map((v) => (
                          <option key={v.vehicle_id} value={v.vehicle_id}>
                            {v.vehicle_plate_number}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          required
                          placeholder="ENTER PLATE (e.g., 29A-999.99)"
                          value={newPlateNumber}
                          onChange={(e) =>
                            setNewPlateNumber(e.target.value.toUpperCase())
                          }
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-blue-400 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-mono font-black placeholder:font-sans text-sm focus:outline-none"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Brand"
                            value={newBrand}
                            onChange={(e) => setNewBrand(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Model"
                            value={newModel}
                            onChange={(e) => setNewModel(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Color"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                    {!isAddingNewVehicle && filteredVehicles.length === 0 && (
                      <p className="text-[11px] text-amber-500 mt-1 font-medium">
                        💡 No saved vehicles found. Click "+ New Vehicle" above
                        to register!
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block flex items-center gap-2">
                      <Clock size={16} /> Entry Time:
                    </label>
                    <input
                      type="datetime-local"
                      value={timeData.startTime}
                      onChange={(e) =>
                        setTimeData({ ...timeData, startTime: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none"
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
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none"
                    />
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
                  </div>

                  <button
                    disabled={!isFormValid}
                    onClick={handleInitiatePayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold mt-2"
                  >
                    <CreditCard size={20} /> PAY DEPOSIT
                  </button>
                </div>
              )}

              {/* QR PAYMENT */}
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
                      src={qrCodeData}
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
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg"
                  >
                    I Have Transferred Successfully
                  </button>
                </div>
              )}

              {/* SUCCESS E-TICKET */}
              {modalPhase === "success" && (
                <div className="text-center animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-xl mb-2">
                    Booking Successful!
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Here is your e-ticket for vehicle{" "}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {selectedVehiclePlate}
                    </span>
                    .
                  </p>
                  <div className="bg-white p-4 rounded-2xl inline-block border-4 border-emerald-500 mb-4 shadow-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Ticket_Valid_Slot_${bookingData.slotId}_Plate_${selectedVehiclePlate}`}
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
                      Important Note: Security camera will scan your plate at
                      the gate. If failure occurs, present this QR ticket to the
                      staff.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleCloseModal();
                      navigate("/user/bookings");
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
                  >
                    OK, Go to My Bookings
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
