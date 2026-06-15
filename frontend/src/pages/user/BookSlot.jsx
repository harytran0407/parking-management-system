import React, { useState, useEffect, useMemo } from "react";
import {
  Car,
  Bike,
  ArrowLeft,
  X,
  Clock,
  CreditCard,
  CheckCircle2,
  Info,
  PlusCircle,
  RotateCcw,
  MapPin,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";

export default function BookSlot() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [userVehicles, setUserVehicles] = useState([]);

  const [bookingData, setBookingData] = useState({
    vehicleType: null, // 'car' or 'motorbike'
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
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // PAYMENT GATEWAY STATES
  const [activePayTab, setActivePayTab] = useState("vietqr");
  const [copiedField, setCopiedField] = useState(null);
  const [paymentId, setPaymentId] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: ""
  });
  const [buildingInfo, setBuildingInfo] = useState(null);

  // TIME AND PRICING STATE
  const [timeData, setTimeData] = useState({ startTime: "" });
  const [priceError, setPriceError] = useState("");
  const [calculatedFee, setCalculatedFee] = useState(15000);

  // Fetch Vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get("/vehicles");
        if (response.data && response.data.success) {
          setUserVehicles(response.data.data || []);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách xe:", error);
      }
    };
    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const typeId = bookingData.vehicleType === "car" ? 2 : 1;
    return (userVehicles || []).filter((v) => v.vehicle_type_id === typeId);
  }, [userVehicles, bookingData.vehicleType]);

  // Fetch Building Info on mount
  useEffect(() => {
    const fetchBuildingInfo = async () => {
      try {
        const response = await api.get("/parking/buildings/info");
        if (response.data && response.data.success) {
          setBuildingInfo(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin tòa nhà:", error);
      }
    };
    fetchBuildingInfo();
  }, []);

  // Fetch active pricing policy for the selected vehicle type
  useEffect(() => {
    const fetchActivePricing = async () => {
      try {
        const response = await api.get("/parking/buildings/pricing/current");
        if (response.data && response.data.success) {
          const policies = response.data.data;
          const typeId = bookingData.vehicleType === "car" ? 2 : 1;
          const matched = policies.find(p => p.vehicle_type_id === typeId);
          if (matched) {
            setCalculatedFee(matched.base_price || matched.basePrice || 15000);
          } else {
            setCalculatedFee(bookingData.vehicleType === "car" ? 15000 : 5000);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy giá hiện tại:", error);
        setCalculatedFee(bookingData.vehicleType === "car" ? 15000 : 5000);
      }
    };
    if (bookingData.vehicleType) {
      fetchActivePricing();
    }
  }, [bookingData.vehicleType]);

  // Validate entry time
  useEffect(() => {
    let error = "";
    if (timeData.startTime) {
      const selectedStart = new Date(timeData.startTime).getTime();
      const now = new Date().getTime();
      if (selectedStart < now - 10 * 60 * 1000) {
        error = language === "en" ? "Entry time cannot be in the past." : "Thời gian vào không được ở quá khứ.";
      }
    }
    setPriceError(error);
  }, [timeData.startTime, language]);

  const selectedVehiclePlate = useMemo(() => {
    if (isAddingNewVehicle && newPlateNumber)
      return newPlateNumber.toUpperCase();
    const matched = (userVehicles || []).find(
      (v) => (v.id || v.vehicle_id) === Number(bookingData.vehicleId)
    );
    return matched?.plate_number || matched?.vehicle_plate_number || "N/A";
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

  const isCapacityFull = useMemo(() => {
    return (buildingInfo?.current_occupancy?.total_available ?? 0) <= 0;
  }, [buildingInfo]);

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
    setTimeData({ startTime: "" });
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
          finalVehicleId = vehicleRes.data.data.id || vehicleRes.data.data.vehicle_id;
          // refresh vehicles list
          const refreshRes = await api.get("/vehicles");
          if (refreshRes.data && refreshRes.data.success) {
            setUserVehicles(refreshRes.data.data || []);
          }
        }
      }

      // Create Booking first (starts in PENDING status)
      const bookingPayload = {
        slot_id: null,
        vehicle_id: Number(finalVehicleId),
        expected_arrival: new Date(timeData.startTime).toISOString(),
        expired_at: null,
        notes: `Pre-paid reservation via VNPay (${calculatedFee.toLocaleString()} VND)`,
      };

      const bookingRes = await api.post("/bookings", bookingPayload);
      if (bookingRes.data && bookingRes.data.success) {
        const createdBkg = bookingRes.data.data;
        setCreatedBooking(createdBkg);

        // Create Payment request using paymentController
        const paymentPayload = {
          booking_id: createdBkg.booking_id,
          payment_method: "VNPAY",
          return_url: window.location.origin + "/user/bookings",
          cancel_url: window.location.origin + "/user/bookings",
        };

        const paymentRes = await api.post("/payments/create", paymentPayload);
        if (paymentRes.data && paymentRes.data.success) {
          const payData = paymentRes.data.data;
          setPaymentId(payData.payment_id);
          setPaymentUrl(payData.payment_url);
          
          // Reset payment tab and card form
          setActivePayTab("vietqr");
          setCardData({
            cardNumber: "",
            cardHolder: "",
            expiryDate: "",
            cvv: ""
          });

          setModalPhase("payment");
        } else {
          alert(language === "en" ? "Failed to create payment transaction." : "Khởi tạo giao dịch thanh toán thất bại.");
        }
      }
    } catch (error) {
      console.error("Lỗi tạo hóa đơn/xe:", error);
      const msg = error.message || error.response?.data?.message || (language === "en" ? "Failed to register vehicle or initiate payment." : "Đăng ký xe hoặc tạo thanh toán thất bại.");
      alert(msg);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentId || !createdBooking) return;
    try {
      // Simulate calling VNPay webhook to process payment and confirm booking
      const webhookPayload = {
        vnp_amount: (calculatedFee * 100).toString(),
        vnp_response_code: "00",
        vnp_txn_ref: paymentId,
        vnp_secure_hash: "mock_hash"
      };

      const webhookRes = await api.post("/payments/webhook/vnpay", webhookPayload);
      const rspCode = webhookRes.data?.RspCode || webhookRes.data?.rspCode || webhookRes.data?.rsp_code;
      if (webhookRes.data && rspCode === "00") {
        // Fetch updated booking info containing floor details
        const activeRes = await api.get("/bookings/active");
        if (activeRes.data && activeRes.data.success) {
          const matched = activeRes.data.data.find(b => b.booking_id === createdBooking.booking_id);
          setConfirmedBooking(matched || createdBooking);
        } else {
          setConfirmedBooking(createdBooking);
        }
        setModalPhase("success");
      } else {
        alert(language === "en" ? "Failed to verify transaction." : "Xác minh thanh toán không thành công.");
      }
    } catch (error) {
      console.error("Lỗi xác minh thanh toán:", error);
      alert(error.response?.data?.message || (language === "en" ? "Failed to complete booking. Please try again." : "Hoàn tất đặt chỗ thất bại. Vui lòng thử lại."));
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
          {language === "en" ? "Choose Vehicle Type" : "Chọn loại phương tiện"}
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
            <h3 className="text-4xl font-black text-white tracking-tight">
              {language === "en" ? "Motorbike" : "Xe máy"}
            </h3>
            <p className="text-blue-400 font-bold text-sm mt-1.5 opacity-90 group-hover:opacity-100 group-hover:text-blue-300 transition-colors flex items-center gap-1">
              {language === "en" ? "Book Space" : "Đặt chỗ ngay"} &rarr;
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
            <h3 className="text-4xl font-black text-white tracking-tight">
              {language === "en" ? "Car" : "Ô tô"}
            </h3>
            <p className="text-blue-400 font-bold text-sm mt-1.5 opacity-90 group-hover:opacity-100 group-hover:text-blue-300 transition-colors flex items-center gap-1">
              {language === "en" ? "Book Space" : "Đặt chỗ ngay"} &rarr;
            </p>
          </div>
        </button>
      </div>

      {/* BOOKING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" />
                {language === "en" ? "Book Parking Slot" : "Đặt chỗ đỗ xe"} - {bookingData.vehicleType === "car" ? (language === "en" ? "Car" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")}
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
                        {language === "en" ? "Vehicle Info:" : "Thông tin xe:"}
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
                            <RotateCcw size={12} /> {language === "en" ? "Saved Vehicle" : "Xe đã lưu"}
                          </>
                        ) : (
                          <>
                            <PlusCircle size={12} /> {language === "en" ? "+ New Vehicle" : "+ Đăng ký xe mới"}
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
                          -- {language === "en" ? "Choose License Plate" : "Chọn biển số xe"} --
                        </option>
                        {(filteredVehicles || []).map((v) => (
                          <option key={v.id || v.vehicle_id} value={v.id || v.vehicle_id}>
                            {v.plate_number || v.vehicle_plate_number}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          required
                          placeholder={
                            bookingData.vehicleType === "car"
                              ? (language === "en" ? "Plate (e.g., 30A-123.45)" : "Biển số (Ví dụ: 30A-123.45)")
                              : (language === "en" ? "Plate (e.g., 29A-123.45)" : "Biển số (Ví dụ: 29A-123.45)")
                          }
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
                            placeholder={
                              bookingData.vehicleType === "car"
                                ? (language === "en" ? "Brand (e.g., Toyota)" : "Hãng xe (Ví dụ: Toyota)")
                                : (language === "en" ? "Brand (e.g., Honda)" : "Hãng xe (Ví dụ: Honda)")
                            }
                            value={newBrand}
                            onChange={(e) => setNewBrand(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            required
                            placeholder={
                              bookingData.vehicleType === "car"
                                ? (language === "en" ? "Model (e.g., Camry)" : "Dòng xe (Ví dụ: Camry)")
                                : (language === "en" ? "Model (e.g., SH)" : "Dòng xe (Ví dụ: SH)")
                            }
                            value={newModel}
                            onChange={(e) => setNewModel(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder={
                              bookingData.vehicleType === "car"
                                ? (language === "en" ? "Color (e.g., Black)" : "Màu sắc (Ví dụ: Đen)")
                                : (language === "en" ? "Color (e.g., Red)" : "Màu sắc (Ví dụ: Đỏ)")
                            }
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                          />
                        </div>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 bg-blue-50/70 dark:bg-blue-950/20 px-2.5 py-1.5 rounded-lg border border-blue-100/50 dark:border-blue-900/40">
                          ℹ️ {language === "en"
                            ? `Note: This vehicle will be saved as a ${bookingData.vehicleType === "car" ? "Car" : "Motorbike"}.`
                            : `Lưu ý: Xe này sẽ được đăng ký làm ${bookingData.vehicleType === "car" ? "Ô tô" : "Xe máy"}.`}
                        </p>
                      </div>
                    )}
                    {!isAddingNewVehicle && (filteredVehicles || []).length === 0 && (
                      <p className="text-[11px] text-amber-500 mt-1 font-medium">
                        💡 {language === "en" ? "No saved vehicles found. Click '+ New Vehicle' above to register!" : "Không tìm thấy xe đã lưu. Bấm '+ Đăng ký xe mới' ở trên để tạo xe!"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 block flex items-center gap-2">
                      <Clock size={16} /> {language === "en" ? "Expected Entry Time:" : "Giờ vào dự kiến:"}
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
                  {priceError && (
                    <p className="text-xs text-red-500 font-semibold mt-1">
                      ⚠️ {priceError}
                    </p>
                  )}

                  {isCapacityFull && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-3.5 text-left flex gap-2.5 items-start text-red-700 dark:text-red-400 text-xs font-semibold leading-relaxed">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5 animate-pulse" size={16} />
                      <p>
                        {language === "en"
                          ? "Warning: The parking building is currently full. Booking is temporarily disabled."
                          : "Cảnh báo: Bãi đỗ xe hiện tại đã hết vị trí khả dụng. Tính năng đặt chỗ tạm khóa."}
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800 dark:text-blue-300 font-bold">
                        {language === "en" ? "Reservation Deposit:" : "Tiền cọc giữ chỗ:"}
                      </span>
                      <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                        {calculatedFee.toLocaleString()} VND
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 border-t border-blue-200 dark:border-blue-500/20 pt-2 font-medium leading-relaxed space-y-1">
                      <p>
                        💡 {language === "en"
                          ? "This is a fixed reservation deposit equal to the base rate. Any extra duration fee will be calculated and settled upon exit."
                          : "Đây là tiền đặt cọc giữ chỗ cố định bằng với giá sàn cơ bản. Các chi phí phát sinh thêm sẽ được tính toán và thanh toán khi ra bãi."}
                      </p>
                      <p className="text-blue-600 dark:text-blue-400 font-bold">
                        ⏱️ {language === "en"
                          ? "Note: You have a 30-minute arrival grace window before and after your expected entry time."
                          : "Lưu ý: Bạn có thời gian linh động 30 phút trước và sau giờ vào dự kiến đã đăng ký."}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={!isFormValid || isCapacityFull}
                    onClick={() => setModalPhase("confirm")}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 dark:disabled:bg-slate-800 disabled:text-slate-450 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all font-bold mt-2 text-white"
                  >
                    {language === "en" ? "Continue" : "Tiếp tục"} 
                  </button>
                </div>
              )}

              {/* ─── CONFIRM PHASE ─── */}
              {modalPhase === "confirm" && (
                <div className="animate-fade-in space-y-4">
                  {/* Header */}
                  <div className="text-center mb-2">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      {language === "en" ? "Please review your booking details" : "Vui lòng kiểm tra thông tin đặt chỗ"}
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                      {bookingData.vehicleType === "car" ? <Car size={16} className="text-white" /> : <Bike size={16} className="text-white" />}
                      <span className="text-white text-xs font-black uppercase tracking-wider">
                        {bookingData.vehicleType === "car"
                          ? (language === "en" ? "Car Parking Reservation" : "Đặt Chỗ Ô Tô")
                          : (language === "en" ? "Motorbike Parking Reservation" : "Đặt Chỗ Xe Máy")}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3 text-sm">
                      {/* License Plate */}
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide">
                          {language === "en" ? "License Plate" : "Biển số xe"}
                        </span>
                        <span className="font-mono font-black text-slate-800 dark:text-white tracking-widest">
                          {selectedVehiclePlate}
                        </span>
                      </div>

                      {/* Vehicle Type */}
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide">
                          {language === "en" ? "Vehicle Type" : "Loại phương tiện"}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {bookingData.vehicleType === "car"
                            ? (language === "en" ? "Car" : "Ô tô")
                            : (language === "en" ? "Motorbike" : "Xe máy")}
                        </span>
                      </div>

                      {/* Expected Arrival */}
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide flex items-center gap-1">
                          <Clock size={12} /> {language === "en" ? "Expected Arrival" : "Giờ vào dự kiến"}
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
                          {timeData.startTime
                            ? new Date(timeData.startTime).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>

                      {/* Deposit */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide flex items-center gap-1">
                          <CreditCard size={12} /> {language === "en" ? "Reservation Deposit" : "Tiền cọc giữ chỗ"}
                        </span>
                        <span className="font-black text-blue-600 dark:text-blue-400 text-base">
                          {calculatedFee.toLocaleString()} VND
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Policy Note */}
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 flex gap-2.5 items-start">
                    <Info className="text-amber-500 shrink-0 mt-0.5" size={14} />
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
                      {language === "en"
                        ? "After confirming, you will be redirected to the payment gateway. The deposit will be charged immediately. Slot will be assigned automatically at check-in."
                        : "Sau khi xác nhận, bạn sẽ được chuyển sang cổng thanh toán. Tiền cọc sẽ được thu ngay lập tức. Vị trí đỗ sẽ được chỉ định tự động khi vào cổng."}
                    </p>
                  </div>

                  {/* Grace window reminder */}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center">
                    ⏱️ {language === "en"
                      ? "30-minute grace window before & after your scheduled entry time."
                      : "Linh động 30 phút trước và sau giờ vào dự kiến đã đăng ký."}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setModalPhase("form")}
                      className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-1.5"
                    >
                      ← {language === "en" ? "Back" : "Quay lại"}
                    </button>
                    <button
                      onClick={handleInitiatePayment}
                      className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <CreditCard size={16} />
                      {language === "en" ? "Confirm & Pay" : "Xác Nhận & Thanh Toán"}
                    </button>
                  </div>
                </div>
              )}

              {/* QR PAYMENT (TABBED GATEWAY) */}
              {modalPhase === "payment" && (
                <div className="animate-fade-in flex flex-col gap-4">
                  {/* Summary Header */}
                  <div className="bg-slate-500/5 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                        {language === "en" ? "Booking ID" : "Mã đặt chỗ"}
                      </p>
                      <p className="font-mono font-black text-slate-700 dark:text-slate-200">
                        {createdBooking?.booking_id || createdBooking?.bookingId || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                        {language === "en" ? "Deposit Amount" : "Số tiền cọc"}
                      </p>
                      <p className="font-black text-blue-600 dark:text-blue-400 text-sm">
                        {calculatedFee.toLocaleString()} VND
                      </p>
                    </div>
                  </div>

                  {paymentUrl && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-4 rounded-2xl text-center shadow-inner">
                      <p className="text-xs text-blue-800 dark:text-blue-300 font-bold mb-2.5">
                        {language === "en"
                          ? "💳 Pay using the official VNPay Sandbox Gateway:"
                          : "💳 Thanh toán qua Cổng VNPay Sandbox chính thức:"}
                      </p>
                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 duration-150"
                      >
                        <CreditCard size={14} />
                        {language === "en" ? "Go to VNPay Sandbox Portal" : "Đến Cổng VNPay Sandbox"} &rarr;
                      </a>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {language === "en"
                          ? "Select NCB Bank and use the test card details shown in Tabs below."
                          : "Chọn ngân hàng NCB và dùng thông tin thẻ Test ở các Tab bên dưới."}
                      </p>
                    </div>
                  )}

                  {/* Tabs Selector */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActivePayTab("vietqr")}
                      className={`py-2 text-[11px] font-black rounded-lg transition-all ${
                        activePayTab === "vietqr"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      VietQR
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePayTab("atm")}
                      className={`py-2 text-[11px] font-black rounded-lg transition-all ${
                        activePayTab === "atm"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {language === "en" ? "ATM Transfer" : "Chuyển khoản"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePayTab("card")}
                      className={`py-2 text-[11px] font-black rounded-lg transition-all ${
                        activePayTab === "card"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {language === "en" ? "Credit Card" : "Thẻ Quốc Tế"}
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="min-h-[260px] flex flex-col justify-center">
                    {activePayTab === "vietqr" && (
                      <div className="text-center animate-fade-in space-y-3">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
                          {language === "en"
                            ? "Scan this QR code using any Mobile Banking app to pay."
                            : "Sử dụng camera hoặc app Banking quét mã VietQR để thanh toán."}
                        </p>
                        <div className="bg-white p-3.5 rounded-2xl inline-block border-2 border-slate-100 shadow-sm">
                          <img
                            src={`https://img.vietqr.io/image/MBBank-123456789-compact2.png?amount=${calculatedFee}&addInfo=Pay_BKG_${createdBooking?.booking_id || createdBooking?.bookingId}&accountName=PARKING%20MANAGEMENT%20SYSTEM`}
                            alt="VietQR Billing"
                            className="w-44 h-44 object-contain mx-auto"
                          />
                        </div>
                        {/* Bank Partner Logos */}
                        <div className="flex justify-center items-center gap-4 opacity-50 grayscale hover:opacity-75 transition-opacity py-1">
                          <span className="text-[10px] font-bold font-mono">MBBank</span>
                          <span className="text-[10px] font-bold font-mono">VCB</span>
                          <span className="text-[10px] font-bold font-mono">TCB</span>
                          <span className="text-[10px] font-bold font-mono">BIDV</span>
                          <span className="text-[10px] font-bold font-mono">Vietin</span>
                        </div>
                      </div>
                    )}

                    {activePayTab === "atm" && (
                      <div className="animate-fade-in space-y-3">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold text-center mb-2">
                          {language === "en"
                            ? "Transfer manually using the details below:"
                            : "Thông tin chuyển khoản ngân hàng thủ công:"}
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs font-medium">
                          {[
                            { label: language === "en" ? "Bank" : "Ngân hàng", value: "MB Bank (Military Bank)" },
                            { label: language === "en" ? "Account No." : "Số tài khoản", value: "123456789", copyable: true },
                            { label: language === "en" ? "Account Name" : "Tên tài khoản", value: "PARKING MANAGEMENT SYSTEM" },
                            { label: language === "en" ? "Amount" : "Số tiền", value: `${calculatedFee.toLocaleString()} VND`, raw: calculatedFee.toString(), copyable: true },
                            { label: language === "en" ? "Description" : "Nội dung chuyển", value: `Pay BKG ${createdBooking?.booking_id || createdBooking?.bookingId}`, copyable: true }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-850 last:border-b-0">
                              <span className="text-slate-400 dark:text-slate-500">{item.label}</span>
                              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-white">
                                <span className={item.copyable ? "font-mono" : ""}>{item.value}</span>
                                {item.copyable && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.raw || item.value);
                                      setCopiedField(item.label);
                                      setTimeout(() => setCopiedField(null), 1500);
                                    }}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-blue-500 transition-colors"
                                  >
                                    {copiedField === item.label ? <Check size={12} /> : <Copy size={12} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activePayTab === "card" && (
                      <div className="animate-fade-in space-y-3.5 px-1">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold text-center mb-1">
                          {language === "en" ? "Enter your card credentials:" : "Nhập thông tin thẻ thanh toán:"}
                        </p>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="1234 5678 1234 5678"
                            maxLength="19"
                            value={cardData.cardNumber}
                            onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim() })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white font-mono font-bold focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="CARD HOLDER NAME"
                            value={cardData.cardHolder}
                            onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white font-mono font-bold focus:outline-none"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength="5"
                              value={cardData.expiryDate}
                              onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white font-mono font-bold focus:outline-none"
                            />
                            <input
                              type="password"
                              placeholder="CVV"
                              maxLength="3"
                              value={cardData.cvv}
                              onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white font-mono font-bold focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 text-[10px] text-blue-600 dark:text-blue-400 font-bold p-2.5 rounded-xl text-center border border-blue-100/50 dark:border-blue-900/40">
                          🔒 {language === "en" ? "Secured mock Sandbox transaction mode" : "Chế độ giao dịch mô phỏng Sandbox bảo mật"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Button */}
                  <button
                    onClick={handlePaymentSuccess}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 text-sm"
                  >
                    {activePayTab === "card"
                      ? (language === "en" ? "Authorize Payment" : "Xác nhận Thanh toán")
                      : (language === "en" ? "I Have Completed Transfer" : "Tôi đã chuyển khoản thành công")}
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
                          {confirmedBooking?.vehicle_plate_number || selectedVehiclePlate}
                        </p>
                      </div>

                      <div className="bg-white/40 dark:bg-slate-950/20 rounded-2xl p-3 border border-slate-150 dark:border-slate-800/60 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                            <Clock size={12} /> {language === "en" ? "Expected Arrival:" : "Giờ vào dự kiến:"}
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {timeData.startTime ? new Date(timeData.startTime).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"}
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
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Ticket_Booking_${confirmedBooking?.booking_id || createdBooking?.booking_id || "N/A"}_Plate_${confirmedBooking?.vehicle_plate_number || selectedVehiclePlate}`}
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
                    className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-slate-950/10 dark:shadow-blue-900/20 mt-6 flex items-center justify-center gap-2 text-sm"
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
