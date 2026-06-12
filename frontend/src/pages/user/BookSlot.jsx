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
import { useLanguage } from "../../hooks/useLanguage";


export default function BookSlot() {
  const navigate = useNavigate();
  const { language } = useLanguage();

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
  const [priceError, setPriceError] = useState("");
  const [calculatedFee, setCalculatedFee] = useState(15000);

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

  // Validate times and calculate fee
  useEffect(() => {
    let error = "";
    if (timeData.startTime) {
      const selectedStart = new Date(timeData.startTime).getTime();
      const now = new Date().getTime();
      if (selectedStart < now - 10 * 60 * 1000) {
        error = "Entry time cannot be in the past.";
      }
    }
    
    if (timeData.startTime && timeData.endTime) {
      const start = new Date(timeData.startTime).getTime();
      const end = new Date(timeData.endTime).getTime();
      
      if (end <= start) {
        error = "Exit time must be after entry time.";
      } else if (end - start < 30 * 60 * 1000) {
        error = "Booking duration must be at least 30 minutes.";
      } else {
        // Calculate fee
        let fee = 15000;
        const durationMs = end - start;
        const billedHours = Math.ceil(durationMs / (1000 * 60 * 60));
        if (billedHours > 1) {
          fee += (billedHours - 1) * 2000;
        }
        setCalculatedFee(fee);
      }
    } else {
      setCalculatedFee(15000); // Default minimum fee
    }
    
    setPriceError(error);
  }, [timeData.startTime, timeData.endTime]);

  const selectedVehiclePlate = useMemo(() => {
    if (isAddingNewVehicle && newPlateNumber)
      return newPlateNumber.toUpperCase();
    return (
      userVehicles.find((v) => v.vehicle_id === Number(bookingData.vehicleId))
        ?.vehicle_plate_number || "N/A"
    );
  }, [userVehicles, bookingData.vehicleId, isAddingNewVehicle, newPlateNumber]);

  const isFormValid = useMemo(() => {
    const isTimeFilled = timeData.startTime && timeData.endTime && !priceError;
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
    timeData.endTime,
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
        expired_at: new Date(timeData.endTime).toISOString(),
        notes: `Pre-paid reservation via VNPay (MOCK) (${calculatedFee.toLocaleString()} VND)`,
      };

      // We call the API to create booking directly after initiating the simulated payment.
      setCreatedBooking(bookingPayload);
      
      const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PrePay_${calculatedFee}_Vehicle_${finalVehicleId}`;
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" /> {language === "en" ? "Book Parking Slot" : "Đặt chỗ đỗ xe"} - {bookingData.vehicleType === "car" ? (language === "en" ? "Car" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")}
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

            <div className="p-6 overflow-y-auto">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block flex items-center gap-2">
                        <Clock size={16} /> Est. Exit Time:
                      </label>
                      <input
                        type="datetime-local"
                        value={timeData.endTime}
                        onChange={(e) =>
                          setTimeData({ ...timeData, endTime: e.target.value })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                  {priceError && (
                    <p className="text-xs text-red-500 font-semibold mt-1">
                      ⚠️ {priceError}
                    </p>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 dark:text-blue-300 font-bold">
                        Estimated Total:
                      </span>
                      <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                        {calculatedFee.toLocaleString()} VND
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 border-t border-blue-200 dark:border-blue-500/20 pt-2 font-medium leading-relaxed">
                      💡 <strong>Rate:</strong> 15,000 VND for the 1st hour, then +2,000 VND for each next hour.
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
                        {calculatedFee.toLocaleString()} VND
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
                <div className="animate-fade-in flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-md shadow-emerald-500/10 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  
                  <h3 className="font-black text-slate-800 dark:text-white text-2xl mb-1 tracking-tight text-center">
                    {language === "en" ? "Booking Successful!" : "Đặt Chỗ Thành Công!"}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-5 font-medium text-center">
                    {language === "en" ? "Here is your digital parking pass." : "Dưới đây là thẻ đỗ xe điện tử của bạn."}
                  </p>

                  <div className="w-full bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden relative">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3.5 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {bookingData.vehicleType === "car" ? <Car size={18} /> : <Bike size={18} />}
                        <span className="font-black text-xs tracking-wider uppercase">
                          {bookingData.vehicleType === "car" ? (language === "en" ? "CAR PASS" : "VÉ Ô TÔ") : (language === "en" ? "BIKE PASS" : "VÉ XE MÁY")}
                        </span>
                      </div>
                      <span className="text-[10px] font-black font-mono bg-white/20 px-2 py-0.5 rounded">
                        #{confirmedBooking?.booking_id || "N/A"}
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="text-center bg-white dark:bg-slate-950 rounded-2xl p-3 border border-slate-200 dark:border-slate-850 shadow-inner">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          {language === "en" ? "LICENSE PLATE" : "BIỂN SỐ XE"}
                        </p>
                        <p className="font-mono font-black text-2xl text-slate-800 dark:text-slate-100 tracking-wider">
                          {selectedVehiclePlate}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/80 dark:bg-slate-950/50 rounded-2xl p-3 border border-slate-150 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {language === "en" ? "ASSIGNED SLOT" : "VỊ TRÍ ĐỖ"}
                          </p>
                          <p className="font-black text-sm text-slate-800 dark:text-white font-mono bg-blue-50/50 dark:bg-blue-900/30 px-2 py-1 rounded inline-block">
                            {confirmedBooking?.slot_name || "Assigned at Check-in"}
                          </p>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-950/50 rounded-2xl p-3 border border-slate-150 dark:border-slate-805">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            {language === "en" ? "FLOOR LEVEL" : "TẦNG HẦM"}
                          </p>
                          <p className="font-black text-sm text-slate-800 dark:text-white uppercase mt-1">
                            {confirmedBooking?.floor_name || "TBD"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/40 dark:bg-slate-950/20 rounded-2xl p-3 border border-slate-150 dark:border-slate-800/60 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                            <Clock size={12} /> {language === "en" ? "Arrival:" : "Vào:"}
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {timeData.startTime ? new Date(timeData.startTime).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/60 pt-2">
                          <span className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                            <Clock size={12} /> {language === "en" ? "Est. Departure:" : "Dự kiến ra:"}
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {timeData.endTime ? new Date(timeData.endTime).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs px-1.5 pt-1">
                        <span className="text-slate-400 dark:text-slate-500 font-bold">
                          {language === "en" ? "Deposit Paid:" : "Tiền cọc đã trả:"}
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {calculatedFee.toLocaleString()} VND
                        </span>
                      </div>
                    </div>

                    <div className="relative h-4 my-1 flex items-center justify-center">
                      <div className="absolute left-[-8px] w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-750 z-10"></div>
                      <div className="w-[calc(100%-1.5rem)] border-b-2 border-dashed border-slate-200 dark:border-slate-800"></div>
                      <div className="absolute right-[-8px] w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-750 z-10"></div>
                    </div>

                    <div className="p-5 flex flex-col items-center">
                      <div className="bg-white p-3.5 rounded-2xl inline-block border border-slate-200 dark:border-slate-800 shadow-md relative group">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Ticket_Valid_Slot_${confirmedBooking?.slot_id}_Plate_${selectedVehiclePlate}`}
                          alt="Ticket QR"
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                      
                      <span className="mt-3.5 inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-900/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        {language === "en" ? "ACTIVE / PAID" : "XÁC NHẬN / ĐÃ TRẢ CỌC"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-3.5 mt-5 text-left flex gap-3 items-start shadow-sm">
                    <Info className="text-amber-500 shrink-0 mt-0.5 animate-pulse" size={18} />
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
                      {language === "en" 
                        ? "Note: The gate camera will automatically scan your license plate at entry. Show this QR code to staff if verification fails."
                        : "Lưu ý: Camera tại cổng sẽ tự động quét biển số xe khi vào. Hãy xuất trình mã QR này cho nhân viên nếu không khớp tự động."}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      handleCloseModal();
                      navigate("/user/bookings");
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-slate-950/10 dark:shadow-blue-900/20 mt-6 flex items-center justify-center gap-2"
                  >
                    {language === "en" ? "Go to My Bookings" : "Xem lịch sử đặt chỗ"} &rarr;
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
