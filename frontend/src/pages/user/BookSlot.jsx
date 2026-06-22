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
  LogIn,
  LogOut,
  AlertTriangle,
  Hash,
  Calendar,
  ShieldAlert,
  RefreshCw,
  ShieldCheck,
  History,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";

const fmtVND = (val) => (val != null ? val.toLocaleString("vi-VN") : "0");

export default function BookSlot() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Vehicle selection state: null, 'car', or 'motorbike'
  const [vehicleType, setVehicleType] = useState(null);

  // 4-Step Wizard Phase: 1 = Info Form, 2 = Regulations, 3 = Payment, 4 = Success Ticket
  const [currentStep, setCurrentStep] = useState(1);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccessDelay, setShowSuccessDelay] = useState(false);

  // Form State
  const [licensePlate, setLicensePlate] = useState("");
  const [expectedArrival, setExpectedArrival] = useState("");
  const [expectedDeparture, setExpectedDeparture] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedArrival, setSelectedArrival] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [selectedDepartureTime, setSelectedDepartureTime] = useState("");

  // Pricing/Estimation state
  const [estimateData, setEstimateData] = useState(null);
  const [calculatedFee, setCalculatedFee] = useState(15000);
  const [priceError, setPriceError] = useState("");
  const [capacityInfo, setCapacityInfo] = useState(null);

  // Step 2: Regulations State
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Booking restriction state (checked on mount)
  // null = no restriction
  // { type: 'spam_lock' } = bị khóa 24h
  // { type: 'concurrent_limit' } = đang có 2 booking active
  const [bookingRestriction, setBookingRestriction] = useState(null);
  const [restrictionLoading, setRestrictionLoading] = useState(true);


  // Numeric ID mapping based on selection: 2 = Car, 1 = Motorbike
  const vehicleTypeId = useMemo(() => {
    if (vehicleType === "car") return 2;
    if (vehicleType === "motorbike") return 1;
    return null;
  }, [vehicleType]);

  // Fetch Building/Capacity Info on mount
  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const response = await api.get("/parking/buildings/info");
        if (response.data && response.data.success) {
          setCapacityInfo(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin tòa nhà:", error);
      }
    };
    fetchCapacity();
  }, []);

  // Check booking restrictions on mount: spam lock or concurrent limit
  useEffect(() => {
    const checkRestrictions = async () => {
      setRestrictionLoading(true);
      try {
        // Check active bookings count via /bookings/active
        const res = await api.get("/bookings/active");
        if (res.data?.success) {
          const activeBookings = res.data.data ?? [];
          const confirmedOrPending = activeBookings.filter(
            (b) => b.status === "CONFIRMED" || b.status === "PENDING"
          );
          if (confirmedOrPending.length >= 2) {
            setBookingRestriction({ type: "concurrent_limit" });
            setRestrictionLoading(false);
            return;
          }
        }
        setBookingRestriction(null);
      } catch (err) {
        // Nếu server trả 422/400 với message spam lock → parse luôn
        const msg = err.response?.data?.message ?? "";
        if (msg.includes("khóa") || msg.includes("spam") || msg.toLowerCase().includes("lock")) {
          setBookingRestriction({ type: "spam_lock" });
        } else {
          setBookingRestriction(null);
        }
      } finally {
        setRestrictionLoading(false);
      }
    };
    checkRestrictions();
  }, []);

  // Generate selectable dates (only Today and Tomorrow)
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 2; i++) {
      const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      const parts = formatter.formatToParts(d);
      const y = parts.find(p => p.type === "year")?.value;
      const m = parts.find(p => p.type === "month")?.value;
      const dayVal = parts.find(p => p.type === "day")?.value;
      const isoString = `${y}-${m}-${dayVal}`;

      let label = "";
      if (i === 0) {
        label = language === "en" ? "Today" : "Hôm nay";
      } else if (i === 1) {
        label = language === "en" ? "Tomorrow" : "Ngày mai";
      } else {
        const dowFormatter = new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          weekday: "short"
        });
        label = dowFormatter.format(d);
      }
      dates.push({
        value: isoString,
        label: `${label} (${dayVal}/${m})`
      });
    }
    return dates;
  }, [language]);

  // Set default date, auto-select tomorrow if today has no slots left
  useEffect(() => {
    if (availableDates.length > 0) {
      const today = availableDates[0].value;
      const todaySlots = [];
      for (let h = 0; h < 24; h++) {
        for (const m of [0, 30]) {
          const timeVal = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const arrivalTime = new Date(`${today}T${timeVal}:00+07:00`);
          if (arrivalTime.getTime() >= Date.now() + 60 * 60 * 1000 && arrivalTime.getTime() <= Date.now() + 8 * 60 * 60 * 1000) {
            todaySlots.push(timeVal);
          }
        }
      }
      if (todaySlots.length > 0) {
        setSelectedDate(today);
      } else if (availableDates.length > 1) {
        setSelectedDate(availableDates[1].value);
      }
    }
  }, [availableDates]);

  // Compute available arrival times for selected date
  const arrivalTimes = useMemo(() => {
    if (!selectedDate) return [];
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const timeVal = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const arrivalTime = new Date(`${selectedDate}T${timeVal}:00+07:00`);
        if (arrivalTime.getTime() >= Date.now() + 60 * 60 * 1000 && arrivalTime.getTime() <= Date.now() + 8 * 60 * 60 * 1000) {
          slots.push({
            value: timeVal,
            label: timeVal
          });
        }
      }
    }
    return slots;
  }, [selectedDate]);

  // Auto-select first arrival time when list updates
  useEffect(() => {
    if (arrivalTimes.length > 0) {
      if (!arrivalTimes.find(t => t.value === selectedArrival)) {
        setSelectedArrival(arrivalTimes[0].value);
      }
    } else {
      setSelectedArrival("");
    }
  }, [arrivalTimes, selectedArrival]);

  // Compute available exit dates (next 30 days starting from selectedDate)
  const availableEndDates = useMemo(() => {
    if (!selectedDate) return [];
    const dates = [];
    const startD = new Date(`${selectedDate}T00:00:00`);
    for (let i = 0; i < 30; i++) {
      const d = new Date(startD.getTime() + i * 24 * 60 * 60 * 1000);
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      const parts = formatter.formatToParts(d);
      const y = parts.find(p => p.type === "year")?.value;
      const m = parts.find(p => p.type === "month")?.value;
      const dayVal = parts.find(p => p.type === "day")?.value;
      const isoString = `${y}-${m}-${dayVal}`;

      let label = "";
      if (i === 0) {
        label = language === "en" ? "Same day" : "Cùng ngày";
      } else if (i === 1) {
        label = language === "en" ? "Next day" : "Ngày hôm sau";
      } else {
        const dowFormatter = new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          weekday: "short"
        });
        label = dowFormatter.format(d);
      }
      dates.push({
        value: isoString,
        label: `${label} (${dayVal}/${m})`
      });
    }
    return dates;
  }, [selectedDate, language]);

  // Compute departure times (00:00 to 23:30)
  const departureTimes = useMemo(() => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const timeVal = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots.push({
          value: timeVal,
          label: timeVal
        });
      }
    }
    return slots;
  }, []);

  // Set default values for selectedEndDate and selectedDepartureTime
  useEffect(() => {
    if (selectedDate) {
      setSelectedEndDate(prev => prev || selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedArrival) {
      const [h, m] = selectedArrival.split(":").map(Number);
      const exitH = (h + 2) % 24;
      const nextDay = h + 2 >= 24;
      const depTimeStr = `${String(exitH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      setSelectedDepartureTime(prev => prev || depTimeStr);
      if (nextDay && selectedDate && availableEndDates.length > 1) {
        setSelectedEndDate(availableEndDates[1].value);
      }
    }
  }, [selectedArrival, selectedDate, availableEndDates]);

  // Sync back to expectedArrival and expectedDeparture strings
  useEffect(() => {
    if (selectedDate && selectedArrival) {
      setExpectedArrival(`${selectedDate}T${selectedArrival}`);
    } else {
      setExpectedArrival("");
    }
  }, [selectedDate, selectedArrival]);

  useEffect(() => {
    if (selectedEndDate && selectedDepartureTime) {
      setExpectedDeparture(`${selectedEndDate}T${selectedDepartureTime}`);
    } else {
      setExpectedDeparture("");
    }
  }, [selectedEndDate, selectedDepartureTime]);

  // 1. Inline Validation Helper (Ép hoàn toàn về GMT+7 khi so sánh ở Client)
  const dateValidationError = useMemo(() => {
    if (!expectedArrival || !expectedDeparture) return "";

    const now = new Date();
    const start = new Date(expectedArrival + ":00+07:00");
    const end = new Date(expectedDeparture + ":00+07:00");

    const minBookingTime = now.getTime() + 60 * 60 * 1000;
    const maxBookingTime = now.getTime() + 8 * 60 * 60 * 1000;

    if (start.getTime() < minBookingTime) {
      return language === "en"
        ? "Booking must be made at least 60 minutes in advance."
        : "Bạn phải đặt chỗ trước thời gian định đến ít nhất 60 phút.";
    }
    if (start.getTime() > maxBookingTime) {
      return language === "en"
        ? "Arrival time must be at most 8 hours from now."
        : "Chỉ được đặt chỗ cách thời điểm hiện tại tối đa 8 tiếng.";
    }
    if (end.getTime() <= start.getTime()) {
      return language === "en" ? "Expected departure must be after arrival." : "Thời gian ra phải sau thời gian vào.";
    }
    if (start.getMinutes() !== 0 && start.getMinutes() !== 30) {
      return language === "en" ? "Arrival minutes must be 00 or 30 (e.g., 5:00, 5:30)." : "Thời gian vào phải chọn giờ chẵn hoặc nửa giờ (ví dụ: 5:00 hoặc 5:30).";
    }
    if (end.getMinutes() !== 0 && end.getMinutes() !== 30) {
      return language === "en" ? "Departure minutes must be 00 or 30 (e.g., 5:00, 5:30)." : "Thời gian ra phải chọn giờ chẵn hoặc nửa giờ (ví dụ: 5:00 hoặc 5:30).";
    }
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (diffMinutes < 60) {
      return language === "en" ? "Booking duration must be at least 1 hour." : "Thời lượng đặt chỗ tối thiểu phải là 1 tiếng.";
    }
    return "";
  }, [expectedArrival, expectedDeparture, language]);

  // Dynamic duration text aggregator
  const aggregatedDurationText = useMemo(() => {
    if (!expectedArrival || !expectedDeparture || dateValidationError) return "";
    const start = new Date(expectedArrival + ":00+07:00");
    const end = new Date(expectedDeparture + ":00+07:00");
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "";

    const totalMinutes = Math.floor(diffMs / 60000);
    const totalHours = totalMinutes / 60;

    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingMinutes = totalMinutes % (24 * 60);
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;

    let textParts = [];
    if (days > 0) textParts.push(language === "en" ? `${days} day(s)` : `${days} ngày`);
    if (hours > 0) textParts.push(language === "en" ? `${hours} hour(s)` : `${hours} tiếng`);
    if (mins > 0) textParts.push(language === "en" ? `${mins} min(s)` : `${mins} phút`);

    const detailedText = textParts.join(" ");
    return language === "en"
      ? `Total duration: ${detailedText}`
      : `Tổng thời lượng: ${detailedText}`;
  }, [expectedArrival, expectedDeparture, dateValidationError, language]);

  // 2. Fetch Pricing Estimate in Realtime (Sửa lỗi nghẽn State Validation)
  useEffect(() => {
    if (vehicleTypeId && expectedArrival && expectedDeparture) {

      // Nếu client đang có lỗi nhập liệu (vào sau ra, quá khứ...), 
      // xóa sạch lỗi price cũ của API đi để không làm kẹt form
      if (dateValidationError) {
        setPriceError("");
        setEstimateData(null);
        return;
      }

      const fetchEstimate = async () => {
        try {
          setPriceError("");

          // Chuẩn hóa chuỗi thời gian kèm chuẩn múi giờ Việt Nam +07:00 trước khi gửi lên API
          const arrivalParam = expectedArrival.length === 16 ? expectedArrival + ":00+07:00" : expectedArrival;
          const departureParam = expectedDeparture.length === 16 ? expectedDeparture + ":00+07:00" : expectedDeparture;

          const res = await api.get("/bookings/price-estimate", {
            params: {
              vehicle_type_id: vehicleTypeId,
              expected_arrival: arrivalParam,
              expired_at: departureParam
            }
          });

          if (res.data?.success) {
            setEstimateData(res.data.data);
            setCalculatedFee(res.data.data.estimated_fee);
            setPriceError("");
          }
        } catch (err) {
          console.error("Error fetching price estimate:", err);
          setPriceError(err.response?.data?.message || "Lỗi tính giá ước lượng");
          setEstimateData(null);
        }
      };

      fetchEstimate();
    }
  }, [vehicleTypeId, expectedArrival, expectedDeparture, dateValidationError]);

  // Check form validation
  const isPlateValid = useMemo(() => {
    return licensePlate.trim().length >= 5;
  }, [licensePlate]);

  // Form bị vô hiệu hoá khi có restriction
  const isFormLocked = !!bookingRestriction;

  const isStep1Valid = useMemo(() => {
    return (
      !isFormLocked &&
      isPlateValid &&
      expectedArrival &&
      expectedDeparture &&
      !dateValidationError &&
      !priceError
    );
  }, [isFormLocked, isPlateValid, expectedArrival, expectedDeparture, dateValidationError, priceError]);

  const handleNextToStep2 = () => {
    if (isStep1Valid) {
      setCurrentStep(2);
    }
  };

  // 3. Handle Create Booking (Gửi kèm đuôi múi giờ +07:00 rõ ràng lên API tạo đơn)
  const handleNextToStep3 = async () => {
    if (!agreedToTerms) return;

    setLoadingPayment(true);
    try {
      const plate = licensePlate.trim().toUpperCase();

      const bookingPayload = {
        slot_id: null,
        license_plate: plate,
        vehicle_type_id: vehicleTypeId,
        expected_arrival: expectedArrival.length === 16 ? expectedArrival + ":00+07:00" : expectedArrival + "+07:00",
        expired_at: expectedDeparture.length === 16 ? expectedDeparture + ":00+07:00" : expectedDeparture + "+07:00",
        notes: `Mock payment reservation (${calculatedFee.toLocaleString()} VND)`,
      };

      const bookingRes = await api.post("/bookings", bookingPayload);
      if (bookingRes.data && bookingRes.data.success) {
        setCreatedBooking(bookingRes.data.data);
        setCurrentStep(3);
      }
    } catch (error) {
      console.error("Lỗi tạo booking:", error);
      const msg = error.response?.data?.message || error.message || (language === "en" ? "Failed to create booking." : "Tạo đặt chỗ thất bại.");
      // Nếu server trả về lỗi spam lock hoặc concurrent limit → cập nhật restriction state
      if (msg.includes("khóa") || msg.includes("spam") || msg.toLowerCase().includes("lock")) {
        setBookingRestriction({ type: "spam_lock" });
      } else if (msg.includes("2 đặt chỗ") || msg.includes("tối đa 2") || msg.includes("concurrent")) {
        setBookingRestriction({ type: "concurrent_limit" });
      }
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleConfirmMockPayment = async () => {
    if (!createdBooking) return;

    setProcessingPayment(true);
    try {
      const payload = {
        booking_id: createdBooking.booking_id,
        payment_method: "VNPAY"
      };

      const res = await api.post("/payments/confirm-mock", payload);
      if (res.data && res.data.success) {
        setShowSuccessDelay(true);
        setTimeout(async () => {
          try {
            const res2 = await api.get(`/bookings/${createdBooking.booking_id}`);
            if (res2.data && res2.data.success) {
              setCreatedBooking(res2.data.data);
            }
          } catch (err) {
            console.error("Lỗi tải lại đơn đặt chỗ:", err);
          } finally {
            setCurrentStep(4);
            setProcessingPayment(false);
            setShowSuccessDelay(false);
          }
        }, 1500);
      } else {
        alert(language === "en" ? "Mock payment failed." : "Thanh toán giả lập thất bại.");
        setProcessingPayment(false);
      }
    } catch (err) {
      console.error("Mock payment error:", err);
      alert(err.response?.data?.message || (language === "en" ? "Payment failed. Please try again." : "Thanh toán thất bại. Vui lòng thử lại."));
      setProcessingPayment(false);
    }
  };

  const handleReset = () => {
    setVehicleType(null);
    setCurrentStep(1);
    setLicensePlate("");
    setExpectedArrival("");
    setExpectedDeparture("");
    setSelectedDate("");
    setSelectedArrival("");
    setSelectedEndDate("");
    setSelectedDepartureTime("");
    setEstimateData(null);
    setCalculatedFee(15000);
    setPriceError("");
    setAgreedToTerms(false);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setVehicleType(null);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  // =========================================================
  // BẮT ĐẦU ĐOẠN RENDER VIEW JSX (Giữ nguyên phần giao diện bên dưới của bạn...)
  // =========================================================

  // =========================================================
  // VIEW: SELECT VEHICLE TYPE FIRST
  // =========================================================
  if (!vehicleType) {
    return (
      <div className="animate-slide-in h-[calc(100vh-8rem)] flex flex-col relative p-4 md:p-6">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/user")}
            className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
              {language === "en" ? "Choose Vehicle Type" : "Chọn loại phương tiện"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === "en"
                ? "Select a vehicle type to begin reserving your parking slot."
                : "Vui lòng chọn loại xe để bắt đầu đặt giữ chỗ đỗ xe."}
            </p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          <button
            onClick={() => setVehicleType("motorbike")}
            className="group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-1 hover:scale-[1.01] flex flex-col"
          >
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.pexels.com/photos/10556869/pexels-photo-10556869.jpeg"
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
                {language === "en" ? "Book Now" : "Đặt chỗ ngay"} &rarr;
              </p>
            </div>
          </button>

          <button
            onClick={() => setVehicleType("car")}
            className="group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-1 hover:scale-[1.01] flex flex-col"
          >
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.pexels.com/photos/31968456/pexels-photo-31968456.jpeg"
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
                {language === "en" ? "Book Now" : "Đặt chỗ ngay"} &rarr;
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW: 3-STEP WIZARD BOOKING FLOW
  // =========================================================
  return (
    <div className="animate-slide-in w-full max-w-3xl mx-auto p-4 md:p-6 transition-colors duration-300">

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {language === "en" ? "Booking Parking Slot" : "Đặt chỗ đỗ xe trực tuyến"} - {vehicleType === "car" ? (language === "en" ? "Car" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === "en"
              ? "Fast 3-step slot reservation with automatic validation ."
              : "Đặt chỗ đỗ nhanh chóng trong 3 bước, tự động phân phối vị trí."}
          </p>
        </div>
      </div>

      {/* Step Indicators */}
      {currentStep < 4 && (
        <div className="mb-6 grid grid-cols-3 gap-2">
          {[
            { step: 1, label: language === "en" ? "1. Vehicle Info" : "1. Thông tin" },
            { step: 2, label: language === "en" ? "2. Regulations" : "2. Quy định" },
            { step: 3, label: language === "en" ? "3. Payment" : "3. Thanh toán" }
          ].map((item) => (
            <div
              key={item.step}
              className={`h-2.5 rounded-full relative transition-all duration-300 ${currentStep >= item.step
                ? "bg-blue-600 shadow-sm"
                : "bg-slate-200 dark:bg-slate-800"
                }`}
            >
              <span className={`absolute -bottom-6 left-0 text-[10px] font-black uppercase tracking-wider ${currentStep === item.step
                ? "text-blue-600 dark:text-blue-400 font-extrabold"
                : "text-slate-400 dark:text-slate-500"
                }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Form Container */}
      <div className="mt-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl transition-all">

        {/* ========================================================= */}
        {/* STEP 1: INFO FORM */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">

            {/* ── Booking Restriction Banner ── */}
            {restrictionLoading && (
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                {language === "en" ? "Checking account status..." : "Đang kiểm tra trạng thái tài khoản..."}
              </div>
            )}

            {!restrictionLoading && bookingRestriction?.type === "spam_lock" && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-2xl px-4 py-4 flex items-start gap-3 text-sm">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-red-700 dark:text-red-400">
                    {language === "en" ? "Booking feature locked for 24 hours" : "Tính năng đặt chỗ bị khóa 24 giờ"}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-500 mt-1 font-medium">
                    {language === "en"
                      ? "Your account has been temporarily locked due to excessive booking cancellations. Please try again after 24 hours."
                      : "Tài khoản của bạn đã bị khóa tạm thời do hủy đặt chỗ quá nhiều lần trong ngày. Vui lòng thử lại sau 24 giờ."}
                  </p>
                </div>
              </div>
            )}

            {!restrictionLoading && bookingRestriction?.type === "concurrent_limit" && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl px-4 py-4 flex items-start gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-amber-700 dark:text-amber-400">
                    {language === "en" ? "Maximum concurrent bookings reached" : "Đã đạt giới hạn đặt chỗ đồng thời"}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 font-medium">
                    {language === "en"
                      ? "You already have 2 active bookings. Please complete an existing booking before creating a new one."
                      : "Bạn đang có 2 đặt chỗ đang hoạt động. Hãy hoàn thành hoặc hủy một đặt chỗ hiện có trước khi đặt thêm."}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/user/bookings")}
                    className="mt-2.5 text-xs font-black text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition"
                  >
                    {language === "en" ? "View my bookings →" : "Xem đặt chỗ của tôi →"}
                  </button>
                </div>
              </div>
            )}

            {/* Selected Vehicle Type Display */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/10 p-3 rounded-xl text-blue-600 dark:text-blue-450">
                  {vehicleType === "car" ? <Car size={24} /> : <Bike size={24} />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {language === "en" ? "Selected Category" : "Loại xe đã chọn"}
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {vehicleType === "car" ? (language === "en" ? "Car" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVehicleType(null)}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                {language === "en" ? "Change" : "Thay đổi"}
              </button>
            </div>

            {/* License Plate Input */}
            <div>
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
                {language === "en" ? "License Plate" : "Biển số xe"}
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => !isFormLocked && setLicensePlate(e.target.value.toUpperCase())}
                placeholder={language === "en" ? "e.g. 51F-12345" : "VD: 51F-12345"}
                readOnly={isFormLocked}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/40 border ${
                  isFormLocked
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-white"
                }`}
                maxLength={12}
                required
              />
              {licensePlate && !isPlateValid && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {language === "en" ? "License plate must be at least 5 characters." : "Biển số tối thiểu 5 ký tự."}
                </p>
              )}
            </div>

            {/* Custom Date and Time Dropdown Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {language === "en" ? "Start Date" : "Ngày vào"}
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => !isFormLocked && setSelectedDate(e.target.value)}
                  disabled={isFormLocked}
                  className={"w-full rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 border " + (isFormLocked ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-white cursor-pointer")}
                  required
                >
                  {availableDates.map((d) => (
                    <option key={d.value} value={d.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <LogIn size={14} />
                  {language === "en" ? "Entry Time" : "Giờ vào"}
                </label>
                <select
                  value={selectedArrival}
                  onChange={(e) => !isFormLocked && setSelectedArrival(e.target.value)}
                  disabled={isFormLocked || arrivalTimes.length === 0}
                  className={"w-full rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 border " + (isFormLocked ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-white cursor-pointer")}
                  required
                >
                  {arrivalTimes.length === 0 ? (
                    <option value="">{language === "en" ? "No times available" : "Hết giờ đặt hôm nay"}</option>
                  ) : (
                    arrivalTimes.map((t) => (
                      <option key={t.value} value={t.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        {t.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {language === "en" ? "End Date" : "Ngày ra"}
                </label>
                <select
                  value={selectedEndDate}
                  onChange={(e) => !isFormLocked && setSelectedEndDate(e.target.value)}
                  disabled={isFormLocked}
                  className={"w-full rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 border " + (isFormLocked ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-white cursor-pointer")}
                  required
                >
                  {availableEndDates.map((d) => (
                    <option key={d.value} value={d.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <LogOut size={14} />
                  {language === "en" ? "Exit Time" : "Giờ ra"}
                </label>
                <select
                  value={selectedDepartureTime}
                  onChange={(e) => !isFormLocked && setSelectedDepartureTime(e.target.value)}
                  disabled={isFormLocked}
                  className={"w-full rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 border " + (isFormLocked ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-white cursor-pointer")}
                  required
                >
                  {departureTimes.map((t) => (
                    <option key={t.value} value={t.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aggregated Duration Info Panel */}
            {aggregatedDurationText && !isFormLocked && (
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200/55 dark:border-slate-800 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
                <span>{aggregatedDurationText}</span>
              </div>
            )}

            {/* Date validation error alert */}
            {dateValidationError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 flex gap-2.5 items-start text-xs text-rose-700 dark:text-rose-400">
                <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <p className="font-semibold">{dateValidationError}</p>
              </div>
            )}

            {/* Pricing estimate display */}
            {expectedArrival && expectedDeparture && !dateValidationError && !isFormLocked && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/20">
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 dark:text-blue-300 font-bold text-xs uppercase tracking-wide">
                    {language === "en" ? "Estimated Reservation Deposit:" : "Tiền cọc giữ chỗ dự kiến:"}
                  </span>
                  <span className="font-black text-xl text-blue-600 dark:text-blue-400">
                    {fmtVND(calculatedFee)} VND
                  </span>
                </div>
                {estimateData && (
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    {estimateData.fee_note}
                  </p>
                )}
                {priceError && (
                  <p className="text-xs text-amber-600 mt-1 font-bold">
                    ⚠️ {priceError}
                  </p>
                )}
              </div>
            )}

            {/* Capacity Info Warn */}
            {capacityInfo && (capacityInfo.current_occupancy?.total_available ?? 0) <= 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex gap-2.5 items-start text-xs text-amber-700 dark:text-amber-400 font-semibold">
                <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <p>
                  {language === "en"
                    ? "Warning: Parking building is currently reported as full. Bookings may be rejected at entry check-in."
                    : "Cảnh báo: Bãi đỗ xe hiện tại đã hết chỗ trống. Yêu cầu đặt chỗ có thể bị từ chối ở cổng."}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleNextToStep2}
                disabled={!isStep1Valid}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {language === "en" ? "Continue" : "Tiếp tục"}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: REGULATIONS CHECKLIST */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Info size={16} className="text-blue-500" />
              {language === "en" ? "Parking Regulations" : "Quy định gửi xe tại bãi"}
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {/* Quy định 1: Tốc độ an toàn */}
              <div className="flex gap-2.5">
                <span className="text-blue-500 font-extrabold">1.</span>
                <p>
                  {language === "en"
                    ? "Drive under 5 km/h inside the parking lot and turn on your hazard lights."
                    : "Di chuyển với tốc độ tối đa dưới 5 km/h trong bãi đỗ và bật đèn cảnh báo."}
                </p>
              </div>

              {/* Quy định 2: Phân bổ ô đỗ tự động (Vé chờ) */}
              <div className="flex gap-2.5">
                <span className="text-blue-500 font-extrabold">2.</span>
                <p>
                  {language === "en"
                    ? "Park only in your designated zone. Specific slots are dynamically allocated at the entry barrier upon successful check-in."
                    : "Đỗ xe đúng khu vực quy định. Vị trí đỗ thực tế (Slot) sẽ được hệ thống tự động phân bổ ngẫu nhiên ngay khi bạn check-in tại cổng vào."}
                </p>
              </div>

              {/* Quy định 3: Hàng cấm */}
              <div className="flex gap-2.5">
                <span className="text-blue-500 font-extrabold">3.</span>
                <p>
                  {language === "en"
                    ? "Flammable, explosive, and illegal items are strictly prohibited inside vehicles."
                    : "Nghiêm cấm các chất dễ cháy nổ, vũ khí và hàng cấm lưu hành bên trong phương tiện."}
                </p>
              </div>

              {/* Quy định 4: Check-in Sớm/Muộn & Giữ chỗ (Sửa lỗi logic cũ) */}
              <div className="flex gap-2.5">
                <span className="text-blue-500 font-extrabold">4.</span>
                <p>
                  {language === "en"
                    ? "Free check-in is allowed up to 15 mins early. Reservations are held for a maximum of 30 mins from the scheduled time; past this window, the booking is automatically cancelled with NO REFUND."
                    : "Hệ thống hỗ trợ vào bãi sớm tối đa 15 phút miễn phí. Suất đặt chỗ chỉ được giữ tối đa 30 phút so với giờ hẹn, quá thời gian này lịch đặt sẽ tự động hủy và không hoàn tiền."}
                </p>
              </div>

              {/* Quy định 5: Quá giờ & Phạt chiếm dụng slot (Bổ sung từ mục 2.2) */}
              <div className="flex gap-2.5">
                <span className="text-blue-500 font-extrabold">5.</span>
                <p>
                  {language === "en"
                    ? "Overstaying your reserved window will incur an overtime penalty fee (2x the base hourly rate) calculated per 60-minute block, payable at the exit gate."
                    : "Trường hợp đỗ quá khung giờ đã đặt, hệ thống sẽ áp dụng phí phạt quá giờ (gấp 2 lần giá gốc) tính theo block 60 phút. Bạn cần thanh toán số tiền phát sinh này tại cổng ra để mở rào chắn."}
                </p>
              </div>

              {/* Quy định 6: Chính sách hủy lịch & Hoàn tiền (Bổ sung từ mục 2.5) */}
              <div className="flex gap-2.5">
                <span className="text-blue-500 font-extrabold">6.</span>
                <p>
                  {language === "en"
                    ? "Cancellations made at least 60 minutes prior to the scheduled arrival time will receive a 100% refund into your wallet and do not count as spam. Cancellations are strictly prohibited once the vehicle has checked in or within 1 hour of the scheduled arrival time."
                    : "Hủy lịch sớm trước giờ hẹn ít nhất 1 tiếng sẽ được hoàn 100% tiền cọc vào ví người dùng và không tính vào giới hạn spam. Không được phép hủy đặt chỗ khi xe đã check-in hoặc trong vòng 1 tiếng trước giờ hẹn."}
                </p>
              </div>

              {/* Quy định 7: Tính năng khóa xe bảo mật (Bổ sung từ mục 2.6) */}
              <div className="flex gap-2.5">
                <span className="text-blue-500 font-extrabold">7.</span>
                <p>
                  {language === "en"
                    ? "For absolute security, you can activate the 'Lock Vehicle' feature on the app after parking. The exit barrier will remain locked until you unlock it via the app."
                    : "Để đảm bảo an toàn tài sản, bạn có thể kích hoạt tính năng 'Khóa xe' trên ứng dụng sau khi đỗ. Rào chắn lối ra sẽ chặn hoàn toàn biển số xe này cho đến khi bạn chủ động 'Mở khóa' trên app."}
                </p>
              </div>

              {/* Quy định 8: Ràng buộc chống Spam (Bổ sung từ mục 2.5) */}
              <div className="flex gap-2.5">
                <span className="text-blue-500 font-extrabold">8.</span>
                <p>
                  {language === "en"
                    ? "If an account cancels bookings (unpaid) more than 3 times a day, the system will trigger a spam warning and lock the booking feature for the next 24 hours."
                    : "Nếu tài khoản chủ động hủy lịch quá 3 lần/ngày (đối với đơn chưa thanh toán), hệ thống sẽ kích hoạt cảnh báo spam và khóa tính năng đặt chỗ trước trong 24 giờ tiếp theo."}
                </p>
              </div>
            </div>

            {/* Checkbox agreement */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 mt-0.5"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === "en"
                  ? "I have read and agree to all the parking lot rules, overtime penalty fees, and cancellation policies."
                  : "Tôi đã đọc kỹ và đồng ý tuân thủ toàn bộ quy định đỗ xe, biểu phí phạt quá giờ cùng chính sách hủy lịch."}
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {language === "en" ? "Back" : "Quay lại"}
              </button>
              <button
                type="button"
                onClick={handleNextToStep3}
                disabled={!agreedToTerms || loadingPayment}
                className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {loadingPayment ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {language === "en" ? "Proceed to Payment" : "Xác nhận & Thanh toán"}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: PAYMENT SCREEN */}
        {/* ========================================================= */}
        {currentStep === 3 && createdBooking && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                {language === "en" ? "Billing Summary" : "Tóm tắt hóa đơn"}
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 text-xs font-medium space-y-3">

                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-850">
                  <span className="text-slate-400 dark:text-slate-500">{language === "en" ? "License Plate" : "Biển số xe"}</span>
                  <span className="font-bold text-slate-800 dark:text-white tracking-widest">{createdBooking.license_plate}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-850">
                  <span className="text-slate-400 dark:text-slate-500">{language === "en" ? "Vehicle Type" : "Loại xe"}</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {createdBooking.vehicle_type === "Car" ? (language === "en" ? "Car" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-850">
                  <span className="text-slate-400 dark:text-slate-550 flex items-center gap-1">
                    <Clock size={12} /> {language === "en" ? "Booking Duration" : "Thời gian đặt chỗ"}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white ">
                    {new Date(createdBooking.expected_arrival).toLocaleString(language === "en" ? "en-US" : "vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    {" - "}
                    {new Date(createdBooking.expired_at).toLocaleString(language === "en" ? "en-US" : "vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500 font-extrabold">{language === "en" ? "Amount Due" : "Số tiền cọc cần trả"}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{fmtVND(createdBooking.estimated_fee)} VND</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                {language === "en" ? "Payment Method" : "Phương thức thanh toán"}
              </h3>
              <div className="p-4 rounded-2xl border border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-lg shadow-blue-500/10 flex items-center gap-4">
                <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {language === "en" ? "VNPAY Online Payment (Mock)" : "Thanh toán trực tuyến VNPAY (Giả lập)"}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {language === "en" ? "Secure mock gateway" : "Cổng thanh toán giả lập an toàn"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {showSuccessDelay ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/35 p-4 rounded-2xl flex items-center justify-center gap-3 shadow-inner">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold">
                    {language === "en"
                      ? "Verifying mock payment, generating parking pass..."
                      : "Đang xác minh giao dịch, khởi tạo vé xe..."}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmMockPayment}
                  disabled={processingPayment}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-900/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  {language === "en"
                    ? "Confirm Payment"
                    : "Xác nhận thanh toán"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: SUCCESS TICKET / PASS */}
        {/* ========================================================= */}
        {currentStep === 4 && createdBooking && (
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 size={32} />
            </div>

            {/* Congratulatory message */}
            <div className="text-center">
              <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">
                {language === "en" ? "Booking Confirmed!" : "Đặt chỗ thành công!"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
                {language === "en"
                  ? "Thank you! Your parking slot has been successfully reserved and paid."
                  : "Cảm ơn bạn! Thẻ đỗ xe điện tử của bạn đã được thanh toán cọc giữ chỗ."}
              </p>
            </div>

            {/* Visual Pass Card */}
            <div className="w-full bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden relative">
              {/* Top pass ticket banner */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {createdBooking.vehicle_type === "Car" ? <Car size={18} /> : <Bike size={18} />}
                  <span className="font-black text-xs tracking-wider uppercase">
                    {createdBooking.vehicle_type === "Car"
                      ? (language === "en" ? "CAR BOOKING" : "VÉ Ô TÔ")
                      : (language === "en" ? "BIKE BOOKING" : "VÉ XE MÁY")}
                  </span>
                </div>

              </div>

              <div className="p-5 space-y-4">
                {/* License plate billboard */}
                <div className="text-center bg-white dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-850 shadow-inner">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {language === "en" ? "LICENSE PLATE" : "BIỂN SỐ XE"}
                  </p>
                  <p className="font-black text-2xl text-slate-800 dark:text-slate-100 tracking-wider">
                    {createdBooking.license_plate}
                  </p>
                </div>

                {/* Timings */}
                <div className="bg-white/40 dark:bg-slate-950/20 rounded-2xl p-4 border border-slate-150 dark:border-slate-800/60 space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Clock size={12} /> {language === "en" ? "Entry Time:" : "Giờ vào dự kiến:"}
                    </span>
                    <span className="text-slate-400 dark:text-slate-200">
                      {new Date(createdBooking.expected_arrival).toLocaleString(language === "en" ? "en-US" : "vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Clock size={12} /> {language === "en" ? "Exit Time:" : "Giờ ra dự kiến:"}
                    </span>
                    <span className="text-slate-400 dark:text-slate-200">
                      {new Date(createdBooking.expired_at).toLocaleString(language === "en" ? "en-US" : "vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-slate-200 dark:border-slate-800/60 my-2"></div>

                {/* Bill Info */}
                <div className="flex justify-between items-center text-xs px-1 font-bold">
                  <span className="text-slate-400 dark:text-slate-500">
                    {language === "en" ? "Reservation Deposit Paid:" : "Tiền đặt cọc đã trả:"}
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-450 text-sm">
                    {fmtVND(createdBooking.deposit_paid)} VND
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs px-1 font-bold">
                  <span className="text-slate-400 dark:text-slate-500 font-extrabold">
                    {language === "en" ? "Status:" : "Trạng thái:"}
                  </span>
                  <span className="font-black text-blue-500 uppercase text-[10px] tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200/40 dark:border-blue-900/30">
                    {createdBooking.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Entry instruction note */}
            <div className="w-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 text-left flex gap-3 items-start">
              <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
                {language === "en"
                  ? "Information: The camera scan at the gate check-in checks license plate automatically."
                  : "Thông tin: Hệ thống camera sẽ tự động quét biển số xe khi bạn qua cổng."}
              </p>
            </div>

            {/* Footer controls */}
            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
              >
                <CalendarDays size={14} />
                {language === "en" ? "New Slot Book" : "Đặt chỗ mới"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/user/bookings")}
                className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-black text-xs rounded-2xl transition shadow-lg shadow-slate-900/15 flex items-center justify-center gap-1.5"
              >
                <History size={14} />
                {language === "en" ? "Booking History" : "Lịch sử đặt chỗ"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
