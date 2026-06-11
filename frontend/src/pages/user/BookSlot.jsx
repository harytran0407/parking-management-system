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

  const [userVehicles, setUserVehicles] = useState([]);

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

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState("form");
  const [qrCodeData, setQrCodeData] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null); // ADDED BY ANTIGRAVITY

  // TIME AND PRICING STATE
  const [timeData, setTimeData] = useState({ startTime: "", endTime: "" });
  const [priceError, setPriceError] = useState(""); // ADDED BY ANTIGRAVITY FOR REALTIME VALIDATION
  const DEPOSIT_FEE = 15000; // MODIFIED BY ANTIGRAVITY TO 15,000 VND

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

  // Validate entry time client-side (ADDED BY ANTIGRAVITY)
  useEffect(() => {
    if (timeData.startTime) {
      const selectedTime = new Date(timeData.startTime).getTime();
      const now = new Date().getTime();
      if (selectedTime < now - 10 * 60 * 1000) { // 10 minutes buffer for client clock desync
        setPriceError("Entry time cannot be in the past.");
      } else {
        setPriceError("");
      }
    } else {
      setPriceError("");
    }
  }, [timeData.startTime]);

  const selectedVehiclePlate = useMemo(() => {
    if (isAddingNewVehicle && newPlateNumber)
      return newPlateNumber.toUpperCase();
    return (
      userVehicles.find((v) => v.vehicle_id === Number(bookingData.vehicleId))
        ?.vehicle_plate_number || "N/A"
    );
  }, [userVehicles, bookingData.vehicleId, isAddingNewVehicle, newPlateNumber]);

  const isFormValid = useMemo(() => {
    const isTimeFilled = timeData.startTime && !priceError;
    return isAddingNewVehicle
      ? newPlateNumber.trim().length >= 5 && newBrand.trim() && newModel.trim() && isTimeFilled
      : bookingData.vehicleId !== "" && isTimeFilled;
  }, [
    isAddingNewVehicle,
    bookingData.vehicleId,
    newPlateNumber,
    newBrand,
    newModel,
    timeData.startTime,
    priceError,
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
      floorId: null,
      slotId: null,
      slotName: null,
    });
    setModalPhase("form");
    setTimeData({ startTime: "", endTime: "" });
    setPriceError("");
    setConfirmedBooking(null);
    setIsAddingNewVehicle(false);
    setNewPlateNumber("");
    setNewBrand("");
    setNewModel("");
    setNewColor("");
    setIsModalOpen(true);
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

      // Prepare request (slot_id and expired_at are optional now, resolved by backend)
      const bookingPayload = {
        slot_id: null,
        vehicle_id: Number(finalVehicleId),
        expected_arrival: new Date(timeData.startTime).toISOString(),
        expired_at: null,
        notes: `Deposit reservation payment via VNPay (Flat ${DEPOSIT_FEE} VND)`,
      };

      // We call the API to create booking directly after initiating the simulated payment.
      setCreatedBooking(bookingPayload);
      
      const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Deposit_${DEPOSIT_FEE}_Vehicle_${finalVehicleId}`;
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
        setConfirmedBooking(response.data.data); // Save backend returned data
        setModalPhase("success");
      }
    } catch (error) {
      console.error("Lỗi xác minh thanh toán:", error);
      alert(error.response?.data?.message || "Failed to complete booking. Please try again.");
    }
  };

  return (
    <div className="animate-slide-in h-[calc(100vh-8rem)] flex flex-col relative">
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
          className="group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-1 hover:scale-[1.01] flex flex-col"
        >
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=1000"
              alt="Motorbike"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-end p-8 text-left">
            <div className="bg-blue-600/90 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-300">
              <Bike size={32} />
            </div>
            <h3 className="text-4xl font-black text-white tracking-tight">Motorbike</h3>
            <p className="text-blue-400 font-bold text-sm mt-1.5 opacity-90 group-hover:opacity-100 group-hover:text-blue-300 transition-colors flex items-center gap-1">
              Book Space &rarr;
            </p>
          </div>
        </button>

        <button
          onClick={() => handleSelectVehicleType("car")}
          className="group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-1 hover:scale-[1.01] flex flex-col"
        >
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1000"
              alt="Car"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-end p-8 text-left">
            <div className="bg-blue-600/90 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-300">
              <Car size={32} />
            </div>
            <h3 className="text-4xl font-black text-white tracking-tight">Car</h3>
            <p className="text-blue-400 font-bold text-sm mt-1.5 opacity-90 group-hover:opacity-100 group-hover:text-blue-300 transition-colors flex items-center gap-1">
              Book Space &rarr;
            </p>
          </div>
        </button>
      </div>

      {/* BOOKING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" /> Book Parking Slot - {bookingData.vehicleType === "car" ? "Car" : "Motorbike"}
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
                        Vehicle Info:
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
                          -- Choose License Plate --
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
                          placeholder="Enter Plate (e.g., 29A-999.99)"
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
                  {priceError && (
                    <p className="text-xs text-red-500 font-semibold mt-1">
                      ⚠️ {priceError}
                    </p>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 dark:text-blue-300 font-bold">
                        Deposit Fee:
                      </span>
                      <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                        {DEPOSIT_FEE.toLocaleString()} VND
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 border-t border-blue-200 dark:border-blue-500/20 pt-2 font-medium leading-relaxed">
                      💡 <strong>Rate:</strong> 15,000 VND for the 1st hour, then +2,000 VND for each next hour. Pay the rest when you leave.
                    </div>
                  </div>

                  <button
                    disabled={!isFormValid}
                    onClick={handleInitiatePayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold mt-2"
                  >
                    <CreditCard size={20} /> Pay Deposit
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
                    Please scan the QR code to transfer deposit.
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
                    I Have Transferred
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
                    Your e-ticket for vehicle{" "}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {selectedVehiclePlate}
                    </span>
                    .
                  </p>

                  {confirmedBooking && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-5 border border-slate-200 dark:border-slate-700 text-left">
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Assigned Slot:</span>
                        <span className="font-black text-slate-800 dark:text-white font-mono text-base bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">{confirmedBooking.slot_name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Floor:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{confirmedBooking.floor_name || "N/A"}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-2xl inline-block border-4 border-emerald-500 mb-4 shadow-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Ticket_Valid_Slot_${confirmedBooking?.slot_id}_Plate_${selectedVehiclePlate}`}
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
                      Note: The gate camera will scan your license plate. Show this QR code to staff if needed.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleCloseModal();
                      navigate("/user/bookings");
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
                  >
                    Go to My Bookings
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
