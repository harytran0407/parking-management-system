import React, { useState, useEffect } from "react";
import { Car, Trash2, Edit3, Plus, Search, FileText, RefreshCw, MapPin, Info, CalendarDays, X, HelpCircle } from "lucide-react";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";

export default function MyVehicles() {
  const { language } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [pricingPolicies, setPricingPolicies] = useState([]);

  const [newVehicle, setNewVehicle] = useState({
    vehicle_plate_number: "",
    vehicle_type_id: "",
    brand: "",
    model: "",
    color: "",
    vehicle_description: "",
  });

  const [editVehicle, setEditVehicle] = useState({
    id: "",
    vehicle_plate_number: "",
    vehicle_type_id: "",
    brand: "",
    model: "",
    color: "",
    vehicle_description: "",
  });

  // Fetch Vehicles
  const fetchVehicles = async (currentPolicies = pricingPolicies) => {
    setApiLoading(true);
    setApiError("");
    try {
      const response = await api.get("/vehicles");
      if (response.data && response.data.success) {
        const mapped = response.data.data.map((v) => {
          const policy = currentPolicies.find((p) => p.vehicle_type_id === v.vehicle_type_id);
          const priceText = policy
            ? `${parseFloat(policy.hourly_rate).toLocaleString()} VND/${language === "en" ? "hr" : "giờ"}`
            : (v.vehicle_type_id === 2 ? (language === "en" ? "20,000 VND/hr" : "20.000 VND/giờ") : (language === "en" ? "5,000 VND/hr" : "5.000 VND/giờ"));

          return {
            id: v.vehicle_id,
            name: v.vehicle_description || `${v.brand} ${v.model}`,
            brand: v.brand || (language === "en" ? "Generic" : "Hãng khác"),
            model: v.model || (language === "en" ? "Vehicle" : "Phương tiện"),
            plate_number: v.vehicle_plate_number,
            vehicle_type: v.vehicle_type_name || (v.vehicle_type_id === 2 ? (language === "en" ? "Car / Automobile" : "Ô tô") : (language === "en" ? "Motorbike" : "Xe máy")),
            vehicle_type_id: v.vehicle_type_id,
            colorName: v.color || (language === "en" ? "Black" : "Đen"),
            colorHex: getColorHex(v.color),
            tier: language === "en" ? "Pay-per-use" : "Lượt",
            price: priceText,
            isDocumentsValidated: true,
            expiryDate: language === "en" ? "Active Pass" : "Vé đang hoạt động",
            vehicle_description: v.vehicle_description || "",
            activities: [], // Empty for now or can join logs in future iterations
          };
        });
        setVehicles(mapped);
        if (mapped.length > 0) {
          setSelectedVehicleId((prev) => (prev && mapped.find((x) => x.id === prev) ? prev : mapped[0].id));
        } else {
          setSelectedVehicleId(null);
        }
      }
    } catch (err) {
      console.error(err);
      setApiError(err.message || (language === "en" ? "Failed to load vehicles." : "Không thể tải danh sách xe."));
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    const loadMetadataAndVehicles = async () => {
      let activePolicies = [];
      try {
        const [typesRes, pricingRes] = await Promise.all([
          api.get("/admin/vehicle-types"),
          api.get("/admin/pricing")
        ]);
        if (typesRes.data && typesRes.data.success) {
          setVehicleTypes(typesRes.data.data);
          if (typesRes.data.data.length > 0) {
            setNewVehicle(prev => ({
              ...prev,
              vehicle_type_id: prev.vehicle_type_id || typesRes.data.data[0].vehicle_type_id
            }));
          }
        }
        if (pricingRes.data && pricingRes.data.success) {
          activePolicies = pricingRes.data.data;
          setPricingPolicies(activePolicies);
        }
      } catch (err) {
        console.error("Error fetching vehicle metadata:", err);
      }
      await fetchVehicles(activePolicies);
    };
    loadMetadataAndVehicles();
  }, [language]);

  const getColorHex = (color) => {
    if (!color) return "#0F172A";
    const lower = color.toLowerCase();
    if (lower === "white") return "#FFFFFF";
    if (lower === "red") return "#DC2626";
    if (lower === "blue") return "#2563EB";
    if (lower === "green") return "#10B981";
    if (lower === "yellow") return "#FBBF24";
    if (lower === "silver" || lower === "gray") return "#94A3B8";
    return "#0F172A";
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  const openEditModal = () => {
    if (!selectedVehicle) return;
    setApiError("");
    setEditVehicle({
      id: selectedVehicle.id,
      vehicle_plate_number: selectedVehicle.plate_number,
      vehicle_type_id: selectedVehicle.vehicle_type_id,
      brand: selectedVehicle.brand,
      model: selectedVehicle.model,
      color: selectedVehicle.colorName,
      vehicle_description: selectedVehicle.vehicle_description,
    });
    setIsEditModalOpen(true);
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiLoading(true);
    try {
      const payload = {
        vehicle_plate_number: newVehicle.vehicle_plate_number.trim(),
        vehicle_type_id: Number(newVehicle.vehicle_type_id),
        brand: newVehicle.brand.trim(),
        model: newVehicle.model.trim(),
        color: newVehicle.color.trim(),
        vehicle_description: newVehicle.vehicle_description.trim(),
      };
      const response = await api.post("/vehicles", payload);
      if (response.data && response.data.success) {
        setIsAddModalOpen(false);
        setNewVehicle({
          vehicle_plate_number: "",
          vehicle_type_id: 1,
          brand: "",
          model: "",
          color: "",
          vehicle_description: "",
        });
        await fetchVehicles();
      }
    } catch (err) {
      console.error(err);
      setApiError(err.message || (language === "en" ? "Registration failed. Please make sure plate number is unique." : "Đăng ký thất bại. Vui lòng kiểm tra lại xem biển số xe đã được dùng chưa."));
    } finally {
      setApiLoading(false);
    }
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiLoading(true);
    try {
      const payload = {
        vehicle_plate_number: editVehicle.vehicle_plate_number.trim(),
        vehicle_type_id: Number(editVehicle.vehicle_type_id),
        brand: editVehicle.brand.trim(),
        model: editVehicle.model.trim(),
        color: editVehicle.color.trim(),
        vehicle_description: editVehicle.vehicle_description.trim(),
      };
      const response = await api.put(`/vehicles/${editVehicle.id}`, payload);
      if (response.data && response.data.success) {
        setIsEditModalOpen(false);
        await fetchVehicles();
      }
    } catch (err) {
      console.error(err);
      setApiError(err.message || (language === "en" ? "Failed to update vehicle details." : "Cập nhật thông tin xe thất bại."));
    } finally {
      setApiLoading(false);
    }
  };

  const handleDeleteVehicle = async (id, name) => {
    if (window.confirm(language === "en" ? `Are you sure you want to delete "${name}"?` : `Bạn có chắc muốn xóa xe "${name}" không?`)) {
      setApiError("");
      try {
        const response = await api.delete(`/vehicles/${id}`);
        if (response.data && response.data.success) {
          await fetchVehicles();
        }
      } catch (err) {
        console.error(err);
        alert(err.message || (language === "en" ? "Failed to delete vehicle. It may be currently parked." : "Xóa xe thất bại. Xe có thể đang đỗ trong bãi."));
      }
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputThemeClasses =
    "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition";

  return (
    <div className="animate-slide-in flex flex-col lg:flex-row lg:h-[calc(100vh-80px)] lg:max-h-[calc(100vh-80px)] max-w-[calc(100%+48px)] lg:overflow-hidden bg-[#f8f9ff] dark:bg-slate-950 -m-6">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 h-auto lg:h-full">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{language === "en" ? "My Vehicles" : "Xe của tôi"}</h2>
            <p className="text-xs text-slate-550 dark:text-slate-400">{language === "en" ? `${vehicles.length} Units Connected` : `${vehicles.length} xe đã kết nối`}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder={language === "en" ? "Search plate or brand..." : "Tìm biển số hoặc hãng xe..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white border-none outline-none p-0 focus:ring-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 max-h-[320px] lg:max-h-none space-y-3 custom-scrollbar">
          {filteredVehicles.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicleId;
            return (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm" : "bg-transparent border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
                {isSelected && <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-md" />}
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                    <Car size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{vehicle.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{vehicle.brand} {vehicle.model}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700">
                        {vehicle.plate_number}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-2 transform active:scale-95 transition-all text-xs font-bold uppercase tracking-wider">
            <Plus size={18} />
            {language === "en" ? "Add New Vehicle" : "Thêm xe mới"}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 h-auto lg:h-full overflow-visible lg:overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {selectedVehicle ? (
          <>
            {/* WORKSPACE HEADER CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl hidden sm:block border border-blue-100/50">
                  <Car size={26} />
                </div>
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{selectedVehicle.name}</h1>
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-extrabold rounded-lg font-mono tracking-wide border border-blue-100 dark:border-blue-900/40">
                      {selectedVehicle.plate_number}
                    </span>
                  </div>
                  <p className="text-sm text-slate-550 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <span>{language === "en" ? "Asset Profile" : "Thông tin phương tiện"}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{selectedVehicle.vehicle_type}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                <button
                  onClick={() => handleDeleteVehicle(selectedVehicle.id, selectedVehicle.name)}
                  className="p-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/10 dark:text-red-400 rounded-xl transition-all border border-red-100/30">
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
                  <Edit3 size={16} /> {language === "en" ? "Edit Details" : "Sửa thông tin"}
                </button>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">{language === "en" ? "Verification" : "Xác minh"}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{selectedVehicle.isDocumentsValidated ? (language === "en" ? "Approved & Valid" : "Đã duyệt & Hợp lệ") : (language === "en" ? "Under Verification" : "Đang xác minh")}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">{language === "en" ? "Pass Subscription" : "Đăng ký vé"}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{selectedVehicle.expiryDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info size={16} /> {language === "en" ? "Technical Specifications" : "Thông số kỹ thuật"}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{language === "en" ? "License Plate" : "Biển số xe"}</p>
                  <p className="text-base font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 inline-block">
                    {selectedVehicle.plate_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{language === "en" ? "Vehicle Type" : "Loại xe"}</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white">{selectedVehicle.vehicle_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{language === "en" ? "Billing Type" : "Hình thức thu phí"}</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white">{selectedVehicle.tier}</p>
                  <p className="text-xs text-slate-550 dark:text-slate-400">{selectedVehicle.price}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{language === "en" ? "Color Finish" : "Màu sơn"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm ring-2 ring-slate-200 dark:ring-slate-700"
                      style={{ backgroundColor: selectedVehicle.colorHex }}
                    />
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedVehicle.colorName}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <Car size={64} className="text-slate-300 dark:text-slate-700 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{language === "en" ? "No Vehicles Registered" : "Chưa đăng ký xe nào"}</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400 max-w-sm mb-6">
              {language === "en"
                ? "Connect your vehicle profile to start booking slots, purchasing monthly passes, and receiving instant gate notifications."
                : "Liên kết phương tiện của bạn để bắt đầu đặt chỗ, mua vé tháng và nhận thông tin thông báo ra vào cổng tức thời."}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md">
              {language === "en" ? "Register First Vehicle" : "Đăng ký xe đầu tiên"}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: FORM REGISTER NEW VEHICLE
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transform animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600" size={24} /> {language === "en" ? "Connect New Vehicle" : "Liên kết xe mới"}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddFormSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              {apiError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-600">✕ {apiError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{language === "en" ? "Display Label" : "Tên xe / Ghi chú"}</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.vehicle_description}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_description: e.target.value })}
                    placeholder={language === "en" ? "e.g., My Camry" : "Ví dụ: Xe Camry của tôi"}
                    className={inputThemeClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{language === "en" ? "License Plate" : "Biển số xe"}</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.vehicle_plate_number}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        vehicle_plate_number: e.target.value,
                      })
                    }
                    placeholder="e.g., 29A-12345"
                    className={`${inputThemeClasses} font-mono font-bold`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{language === "en" ? "Brand" : "Hãng sản xuất"}</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                    placeholder="Toyota"
                    className={inputThemeClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{language === "en" ? "Model" : "Dòng xe"}</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    placeholder="Camry"
                    className={inputThemeClasses}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{language === "en" ? "Type" : "Loại phương tiện"}</label>
                  <select
                    value={newVehicle.vehicle_type_id}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        vehicle_type_id: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer">
                    {vehicleTypes.map((t) => (
                      <option key={t.vehicle_type_id} value={t.vehicle_type_id} className="bg-white dark:bg-slate-800">
                        {t.vehicle_type_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Color Finish</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                    placeholder="Black"
                    className={inputThemeClasses}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: FORM EDIT DETAILS VEHICLE PROFILE
         ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transform animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="text-blue-600" size={22} /> {language === "en" ? "Edit Vehicle Details" : "Sửa thông tin phương tiện"}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditFormSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              {apiError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-600">✕ {apiError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{language === "en" ? "Display Label" : "Tên xe hiển thị"}</label>
                  <input 
                    type="text" 
                    required 
                    value={editVehicle.vehicle_description} 
                    onChange={(e) => setEditVehicle({ ...editVehicle, vehicle_description: e.target.value })} 
                    className={inputThemeClasses} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{language === "en" ? "License Plate" : "Biển kiểm soát"}</label>
                  <input
                    type="text"
                    required
                    value={editVehicle.vehicle_plate_number}
                    onChange={(e) =>
                      setEditVehicle({
                        ...editVehicle,
                        vehicle_plate_number: e.target.value,
                      })
                    }
                    className={`${inputThemeClasses} font-mono font-bold`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{language === "en" ? "Brand Name" : "Hãng xe"}</label>
                  <input type="text" required value={editVehicle.brand} onChange={(e) => setEditVehicle({ ...editVehicle, brand: e.target.value })} className={inputThemeClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{language === "en" ? "Model Version" : "Dòng xe"}</label>
                  <input type="text" required value={editVehicle.model} onChange={(e) => setEditVehicle({ ...editVehicle, model: e.target.value })} className={inputThemeClasses} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{language === "en" ? "Classification" : "Phân loại xe"}</label>
                  <select
                    value={editVehicle.vehicle_type_id}
                    onChange={(e) =>
                      setEditVehicle({
                        ...editVehicle,
                        vehicle_type_id: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer">
                    {vehicleTypes.map((t) => (
                      <option key={t.vehicle_type_id} value={t.vehicle_type_id} className="bg-white dark:bg-slate-800">
                        {t.vehicle_type_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">{language === "en" ? "Color Finish" : "Màu sơn"}</label>
                  <input type="text" required value={editVehicle.color} onChange={(e) => setEditVehicle({ ...editVehicle, color: e.target.value })} className={inputThemeClasses} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  disabled={apiLoading}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition active:scale-95 disabled:opacity-50">
                  {language === "en" ? "Cancel" : "Hủy"}
                </button>
                <button
                  type="submit"
                  disabled={apiLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-md active:scale-95 disabled:opacity-50">
                  {language === "en" ? "Save Changes" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
