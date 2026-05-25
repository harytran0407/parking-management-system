import React, { useState } from "react";
import {
  Car,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  FileText,
  Trash2,
  Edit3,
  Plus,
  Search,
  MapPin,
  ArrowRightLeft,
  Sparkles,
  Info,
} from "lucide-react";

// ==========================================
// MOCK DATA CHUẨN KINETIC DESIGN SYSTEM
// ==========================================
const INITIAL_VEHICLES = [
  {
    id: "v1",
    name: "Primary Car",
    model: "Toyota Camry",
    type: "Sedan",
    size: "Standard Size",
    plateNumber: "29A-123.45",
    colorName: "Midnight Black",
    colorHex: "#0F172A",
    tier: "Premium Monthly",
    price: "$49.99/mo",
    isPrimary: true,
    isVerified: true,
    isInsured: true,
    isDocumentsValidated: true,
    isAutoPayActive: true,
    isAprEnabled: true,
    activities: [
      {
        id: "a1",
        type: "Check-in",
        location: "Lot B2, Level 3",
        time: "Today, 08:14 AM",
        method: "APR Auto-Detect",
        status: "Completed",
        cost: "Included",
      },
      {
        id: "a2",
        type: "Check-out",
        location: "Lot A1, Ground",
        time: "Yesterday, 06:30 PM",
        method: "Apple Pay Charge",
        status: "Completed",
        cost: "$12.00",
      },
      {
        id: "a3",
        type: "Check-in",
        location: "Lot A1, Ground",
        time: "Yesterday, 09:15 AM",
        method: "APR Auto-Detect",
        status: "Completed",
        cost: "Included",
      },
    ],
  },
  {
    id: "v2",
    name: "Weekend Ride",
    model: "Ford Mustang",
    type: "Coupe",
    size: "Sports Car",
    plateNumber: "30E-888.88",
    colorName: "Race Red",
    colorHex: "#DC2626",
    tier: "Pay-per-use",
    price: "Flexible",
    isPrimary: false,
    isVerified: true,
    isInsured: true,
    isDocumentsValidated: true,
    isAutoPayActive: false,
    isAprEnabled: true,
    activities: [
      {
        id: "b1",
        type: "Check-out",
        location: "Central Square Mall",
        time: "Last Sunday, 10:45 PM",
        method: "Manual Balance",
        status: "Completed",
        cost: "$25.00",
      },
      {
        id: "b2",
        type: "Check-in",
        location: "Central Square Mall",
        time: "Last Sunday, 02:00 PM",
        method: "APR Auto-Detect",
        status: "Completed",
        cost: "Included",
      },
    ],
  },
  {
    id: "v3",
    name: "Eco Commuter",
    model: "VinFast VF6",
    type: "SUV",
    size: "Compact SUV",
    plateNumber: "29C-999.66",
    colorName: "VinFast Blue",
    colorHex: "#2563EB",
    tier: "Eco Pass",
    price: "$29.99/mo",
    isPrimary: false,
    isVerified: true,
    isInsured: false,
    isDocumentsValidated: false,
    isAutoPayActive: true,
    isAprEnabled: false,
    activities: [
      {
        id: "c1",
        type: "Check-in",
        location: "Ecopark Zone 1",
        time: "3 days ago, 07:30 AM",
        method: "RFID Scan",
        status: "Completed",
        cost: "Included",
      },
    ],
  },
];

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState("v1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Lấy dữ liệu của xe đang được chọn hiển thị chi tiết
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // ==========================================
  // HANDLERS (LOGIC & HIỆU ỨNG TƯƠNG TÁC)
  // ==========================================

  // 1. Bật/Tắt Auto-pay kèm hiệu ứng
  const handleToggleAutoPay = (id) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          return { ...v, isAutoPayActive: !v.isAutoPayActive };
        }
        return v;
      }),
    );
  };

  // 2. Chuyển đổi vai trò xe chính (Set Primary)
  const handleSetPrimary = (id) => {
    setVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        isPrimary: v.id === id,
      })),
    );
  };

  // 3. Mô phỏng xóa xe (Xóa xong tự chọn xe đầu tiên còn lại)
  const handleDeleteVehicle = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const updated = vehicles.filter((v) => v.id !== id);
      setVehicles(updated);
      if (updated.length > 0) {
        setSelectedVehicleId(updated[0].id);
      }
    }
  };

  // 4. Mô phỏng thêm xe mới (Đúng mẫu nét đứt của thiết kế)
  const handleAddNewVehicle = () => {
    const name = prompt("Enter Vehicle Name (e.g., Family Van):");
    if (!name) return;
    const model = prompt(
      "Enter Vehicle Model (e.g., Honda CR-V):",
      "Honda CR-V",
    );
    const plate = prompt("Enter License Plate:", "30K-123.45");

    const newVehicle = {
      id: `v_${Date.now()}`,
      name: name,
      model: model || "Unknown Model",
      type: "SUV",
      size: "Standard",
      plateNumber: plate || "Pending",
      colorName: "Silver Metallic",
      colorHex: "#94A3B8",
      tier: "Pay-per-use",
      price: "Flexible",
      isPrimary: vehicles.length === 0,
      isVerified: false,
      isInsured: false,
      isDocumentsValidated: false,
      isAutoPayActive: false,
      isAprEnabled: true,
      activities: [],
    };

    setVehicles([...vehicles, newVehicle]);
    setSelectedVehicleId(newVehicle.id);
  };

  // Lọc tìm kiếm theo tên hoặc biển số xe
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-[#f8f9ff] dark:bg-slate-950 -m-6">
      {/* ========================================================
          LEFT PANEL: DANH SÁCH XE (Width cố định, hỗ trợ cuộn dọc)
          ======================================================== */}
      <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
        {/* Header Panel & Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                My Vehicles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicles.length} Units Registered
              </p>
            </div>
          </div>

          {/* Thanh tìm kiếm cục bộ */}
          <div
            className={`flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl transition-all ${isSearching ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200 dark:border-slate-700"}`}
          >
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search plate or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setIsSearching(false)}
              className="w-full bg-transparent text-sm text-slate-800 dark:text-white border-none outline-none focus:ring-0 p-0"
            />
          </div>
        </div>

        {/* List Items Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredVehicles.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicleId;
            return (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 transform active:scale-[0.98] ${
                  isSelected
                    ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm"
                    : "bg-transparent border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                {/* Thanh trạng thái Active dọc màu xanh cạnh trái */}
                {isSelected && (
                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-md" />
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                    }`}
                  >
                    <Car size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {vehicle.name}
                      </h3>
                      {vehicle.isPrimary && (
                        <span className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md tracking-wider uppercase scale-90">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {vehicle.model}
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700">
                        {vehicle.plateNumber}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${vehicle.isAutoPayActive ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-slate-500"}`}
                      >
                        {vehicle.isAutoPayActive
                          ? "Auto-pay ON"
                          : "Auto-pay OFF"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredVehicles.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No vehicles match search
              </p>
            </div>
          )}

          {/* Dotted Add Button (Chuẩn thiết kế Kinetic UI) */}
          <button
            onClick={handleAddNewVehicle}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-transparent text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all duration-200 flex items-center justify-center gap-2 group transform active:scale-95"
          >
            <Plus
              size={18}
              className="transition-transform group-hover:rotate-90"
            />
            <span className="text-sm font-medium">Add New Vehicle</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          RIGHT PANEL: MAIN WORKSPACE (Bảng thông tin chi tiết lớn)
          ======================================================== */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* PREMIUM HEADER CARD: Tên xe & Nút hành động */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedVehicle.name}
              </h1>
              {selectedVehicle.isPrimary && (
                <span className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> Primary Vehicle
                </span>
              )}
              {selectedVehicle.isVerified && (
                <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage details, automated toll gate settings, and activity
              tracking for this unit.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() =>
                handleDeleteVehicle(selectedVehicle.id, selectedVehicle.name)
              }
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl transition-colors transform active:scale-95"
              title="Delete Vehicle"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => alert("Feature under development!")}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-semibold rounded-xl transition-colors transform active:scale-95"
            >
              <Edit3 size={16} /> Edit Details
            </button>
          </div>
        </div>

        {/* TRIPLE STATUS CARDS ROW: Phân vùng cài đặt nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Documents State */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  Documents
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                  {selectedVehicle.isDocumentsValidated
                    ? "Validated & Approved"
                    : "Action Required"}
                </p>
              </div>
            </div>
            {!selectedVehicle.isDocumentsValidated && (
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2" />
            )}
          </div>

          {/* Card 2: Auto-pay Toggle Switch with Smooth Effect */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-2xl">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  Auto-pay
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                  {selectedVehicle.isAutoPayActive
                    ? "Active Balance"
                    : "Disabled"}
                </p>
              </div>
            </div>

            {/* Toggle Click Trigger */}
            <button
              onClick={() => handleToggleAutoPay(selectedVehicle.id)}
              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 outline-none"
            >
              {selectedVehicle.isAutoPayActive ? (
                <ToggleRight
                  size={38}
                  className="text-blue-600 dark:text-blue-500 transition-all duration-300"
                />
              ) : (
                <ToggleLeft
                  size={38}
                  className="text-slate-300 dark:text-slate-600 transition-all duration-300"
                />
              )}
            </button>
          </div>

          {/* Card 3: Vehicle Role Transfer Action */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Car size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  Vehicle Role
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                  {selectedVehicle.isPrimary
                    ? "Primary Unit"
                    : "Secondary Unit"}
                </p>
              </div>
            </div>

            {!selectedVehicle.isPrimary && (
              <button
                onClick={() => handleSetPrimary(selectedVehicle.id)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs font-bold"
                title="Make Primary"
              >
                <ArrowRightLeft size={14} /> Swap
              </button>
            )}
          </div>
        </div>

        {/* VEHICLE DETAILS GRID: Thông số kĩ thuật */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info size={16} /> Technical Specifications
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                License Plate
              </p>
              <p className="text-base font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 inline-block">
                {selectedVehicle.plateNumber}
              </p>
              {selectedVehicle.isAprEnabled && (
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  ✓ APR Enabled
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Vehicle Type
              </p>
              <p className="text-base font-bold text-slate-800 dark:text-white">
                {selectedVehicle.type}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedVehicle.size}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Service Plan
              </p>
              <p className="text-base font-bold text-slate-800 dark:text-white">
                {selectedVehicle.tier}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedVehicle.price}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Color Finish
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm ring-2 ring-slate-200 dark:ring-slate-700"
                  style={{ backgroundColor: selectedVehicle.colorHex }}
                />
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {selectedVehicle.colorName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED PROMO CARD: Banner APR quảng cáo */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2rem] p-6 shadow-md shadow-blue-600/10 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
          {/* Họa tiết trang trí chìm phía sau */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-white/20 rounded-lg">
                <Sparkles size={16} className="text-amber-300 animate-pulse" />
              </span>
              <h4 className="text-lg font-black tracking-tight">
                Automated Plate Recognition (APR)
              </h4>
            </div>
            <p className="text-xs text-blue-100 max-w-xl">
              Tired of scanning QR codes? Enable APR to allow our high-speed
              smart gate cameras to recognize your license plate and open
              barriers automatically. Fees will be deducted seamlessly via
              Auto-pay.
            </p>
          </div>

          <button
            onClick={() => alert("APR configurations option triggered.")}
            className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all shadow-md transform active:scale-95 whitespace-nowrap self-start md:self-center relative z-10"
          >
            Configure Settings
          </button>
        </div>

        {/* RECENT ACTIVITY TIMELINE: Dòng lịch sử thông minh */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw size={18} className="text-slate-400" /> Recent Activity
              Timeline
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Real-time update
            </span>
          </div>

          {selectedVehicle.activities &&
          selectedVehicle.activities.length > 0 ? (
            <div className="relative pl-6 border-l border-dashed border-slate-200 dark:border-slate-800 space-y-6 ml-3">
              {selectedVehicle.activities.map((act) => (
                <div key={act.id} className="relative group/item">
                  {/* Điểm nút Timeline với Icon định vị */}
                  <div
                    className={`absolute -left-[35px] top-0.5 p-1 rounded-full border-4 border-white dark:border-slate-900 transition-transform group-hover/item:scale-110 shadow-sm ${
                      act.type === "Check-in"
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                    }`}
                  >
                    <MapPin size={12} />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 p-4 rounded-2xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${act.type === "Check-in" ? "text-blue-600 dark:text-blue-400" : "text-indigo-600 dark:text-indigo-400"}`}
                        >
                          {act.type}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">
                          •
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {act.location}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-slate-400 dark:text-slate-500">
                        <span>{act.time}</span>
                        <span>•</span>
                        <span className="font-medium italic">{act.method}</span>
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
                        {act.cost}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                        {act.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Car
                size={36}
                className="text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-bounce"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No recent park activities recorded for this vehicle.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
