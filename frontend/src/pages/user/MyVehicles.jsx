import React, { useState, useEffect } from "react";
import { Car, Trash2, Edit3, Plus, Search, FileText, RefreshCw, MapPin, Info, CalendarDays, X } from "lucide-react";
// import axios from 'axios'; //

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const INITIAL_VEHICLES = [
  {
    id: "v1",
    name: "Daily Commuter",
    model: "Camry",
    brand: "Toyota",
    vehicle_type: "Sedan",
    size: "Standard Size",
    plate_number: "29A-123.45",
    colorName: "Midnight Black",
    colorHex: "#0F172A",
    tier: "Monthly Pass",
    price: "1.200.000 đ/mo",
    isDocumentsValidated: true,
    expiryDate: "Valid until: Dec 31, 2026",
    activities: [
      {
        id: "a1",
        type: "Check-in",
        location: "Lot B2, Level 3",
        time: "Today, 08:14 AM",
        method: "APR Auto-Detect",
        status: "Inside Parking",
        cost: "Included",
      },
      {
        id: "a2",
        type: "Check-out",
        location: "Lot A1, Ground",
        time: "Yesterday, 06:30 PM",
        method: "RFID Card Scan",
        status: "Completed",
        cost: "0 đ",
      },
    ],
  },
  {
    id: "v2",
    name: "Weekend Luxury",
    model: "Ford Mustang",
    vehicle_type: "Coupe",
    size: "Sports Car",
    plate_number: "30E-888.88",
    colorName: "Race Red",
    colorHex: "#DC2626",
    tier: "Pay-per-use",
    price: "Flexible Tariff",
    isDocumentsValidated: true,
    expiryDate: "No Active Pass",
    activities: [
      {
        id: "b1",
        type: "Check-out",
        location: "Central Block Gate",
        time: "Last Sunday, 10:45 PM",
        method: "E-Wallet Payment",
        status: "Completed",
        cost: "50.000 đ",
      },
    ],
  },
];

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState("v1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [newVehicle, setNewVehicle] = useState({
    vehicle_plate_number: "",
    vehicle_type_id: 1,
    brand: "",
    model: "",
    color: "",
    vehicle_description: "",
    name: "",
    colorHex: "#94A3B8",
  });

  const [editVehicle, setEditVehicle] = useState({
    id: "",
    name: "",
    vehicle_plate_number: "",
    vehicle_type_id: 1,
    brand: "",
    model: "",
    color: "",
    vehicle_description: "",
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const openEditModal = () => {
    setApiError("");
    setEditVehicle({
      id: selectedVehicle.id,
      name: selectedVehicle.name,
      vehicle_plate_number: selectedVehicle.plate_number,
      vehicle_type_id: selectedVehicle.vehicle_type === "SUV" ? 1 : 2,
      brand: selectedVehicle.brand || "",
      model: selectedVehicle.model || "",
      color: selectedVehicle.colorName || "",
      vehicle_description: selectedVehicle.vehicle_description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id === editVehicle.id) {
            return {
              ...v,
              name: editVehicle.name,
              plate_number: editVehicle.vehicle_plate_number,
              brand: editVehicle.brand,
              model: editVehicle.model,
              vehicle_type: editVehicle.vehicle_type_id == 1 ? "SUV" : "Motorbike",
              colorName: editVehicle.color,
            };
          }
          return v;
        }),
      );
      setIsEditModalOpen(false);
    } catch (err) {
      setApiError("Failed to update vehicle details.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const mockId = `v_${Date.now()}`;
      setVehicles((prev) => [
        ...prev,
        {
          id: mockId,
          name: newVehicle.name,
          brand: newVehicle.brand,
          model: newVehicle.model,
          vehicle_type: newVehicle.vehicle_type_id == 1 ? "SUV" : "Motorbike",
          size: "Standard Size",
          plate_number: newVehicle.vehicle_plate_number,
          colorName: newVehicle.color,
          colorHex: newVehicle.colorHex,
          tier: "Pay-per-use",
          price: "Flexible Tariff",
          isDocumentsValidated: false,
          expiryDate: "Waiting Approval",
          activities: [],
        },
      ]);
      setSelectedVehicleId(mockId);
      setIsAddModalOpen(false);
      setNewVehicle({
        vehicle_plate_number: "",
        vehicle_type_id: 1,
        brand: "",
        model: "",
        color: "",
        vehicle_description: "",
        name: "",
        colorHex: "#94A3B8",
      });
    } catch (err) {
      setApiError("Registration failed.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleDeleteVehicle = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const updated = vehicles.filter((v) => v.id !== id);
      setVehicles(updated);
      if (updated.length > 0) setSelectedVehicleId(updated[0].id);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const inputThemeClasses =
    "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition";

  return (
    <div className="animate-slide-in flex flex-col lg:flex-row lg:h-[calc(100vh-80px)] lg:max-h-[calc(100vh-80px)] max-w-[calc(100%+48px)] lg:overflow-hidden bg-[#f8f9ff] dark:bg-slate-950 -m-6">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 h-auto lg:h-full">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Vehicles</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{vehicles.length} Units Connected</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search plate or brand..."
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
                    <p className="text-xs text-slate-400 mt-0.5">{vehicle.model}</p>
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
            className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
            <Plus size={18} />
            Add New Vehicle
          </button>
        </div>
      </div>

      {/* RIGHT PANEL  */}
      <div className="flex-1 h-auto lg:h-full overflow-visible lg:overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <span>Asset Profile</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{selectedVehicle.vehicle_type}</span>
                <span className="text-slate-300 dark:text-slate-700">({selectedVehicle.size})</span>
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
              <Edit3 size={16} /> Edit Details
            </button>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Verification</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{selectedVehicle.isDocumentsValidated ? "Approved & Valid" : "Under Verification"}</p>
              </div>
            </div>
            {!selectedVehicle.isDocumentsValidated && <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse mr-2" />}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Pass Subscription</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{selectedVehicle.expiryDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info size={16} /> Technical Specifications
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">License Plate</p>
              <p className="text-base font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 inline-block">
                {selectedVehicle.plate_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Vehicle Type</p>
              <p className="text-base font-bold text-slate-800 dark:text-white">{selectedVehicle.vehicle_type}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedVehicle.size}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Billing Type</p>
              <p className="text-base font-bold text-slate-800 dark:text-white">{selectedVehicle.tier}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedVehicle.price}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Color Finish</p>
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

        {/* TIMELINE */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw size={18} className="text-slate-400" /> Recent Activity Timeline
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Live sync tracking</span>
          </div>
          {selectedVehicle.activities && selectedVehicle.activities.length > 0 ? (
            <div className="relative pl-6 border-l border-dashed border-slate-200 dark:border-slate-800 space-y-6 ml-3">
              {selectedVehicle.activities.map((act) => {
                const isCheckIn = act.type === "Check-in";
                const neonGlowClass = isCheckIn
                  ? "bg-blue-500 shadow-[0_0_14px_rgba(37,99,235,1)] animate-pulse"
                  : "bg-indigo-500 shadow-[0_0_14px_rgba(99,102,241,1)] animate-pulse";

                return (
                  <div key={act.id} className="relative group/item">
                    <div className="absolute -left-[32px] top-1.5 flex h-4 w-4 items-center justify-center">
                      <span className={`animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full opacity-75 ${isCheckIn ? "bg-blue-400" : "bg-indigo-400"}`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${neonGlowClass}`}></span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isCheckIn ? "text-blue-600 dark:text-blue-400" : "text-indigo-600 dark:text-indigo-400"}`}>{act.type}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" /> {act.location}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-slate-400 dark:text-slate-500">
                          <span>{act.time}</span>
                          <span>•</span>
                          <span className="font-medium italic">{act.method}</span>
                        </div>
                      </div>
                      <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <span className="text-sm font-mono font-black text-slate-900 dark:text-white">{act.cost}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isCheckIn ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"}`}>
                          {act.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Car size={36} className="text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No active parking history recorded.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL 1: FORM REGISTER NEW VEHICLE
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transform animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600" size={24} /> Connect New Vehicle
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddFormSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    placeholder="e.g., My Sedan"
                    className={inputThemeClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">License Plate</label>
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
                    placeholder="29A-123.45"
                    className={`${inputThemeClasses} font-mono font-bold`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Brand</label>
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
                  <label className="block text-xs font-bold text-slate-400 mb-1">Model</label>
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
                  <label className="block text-xs font-bold text-slate-400 mb-1">Type</label>
                  <select
                    value={newVehicle.vehicle_type_id}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        vehicle_type_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option value={1} className="bg-white dark:bg-slate-800">
                      Car / Automobile
                    </option>
                    <option value={2} className="bg-white dark:bg-slate-800">
                      Motorbike
                    </option>
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
                <Edit3 className="text-blue-600" size={22} /> Edit Vehicle Details
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
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Display Label</label>
                  <input type="text" required value={editVehicle.name} onChange={(e) => setEditVehicle({ ...editVehicle, name: e.target.value })} className={inputThemeClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">License Plate</label>
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
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Brand Name</label>
                  <input type="text" required value={editVehicle.brand} onChange={(e) => setEditVehicle({ ...editVehicle, brand: e.target.value })} className={inputThemeClasses} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Model Version</label>
                  <input type="text" required value={editVehicle.model} onChange={(e) => setEditVehicle({ ...editVehicle, model: e.target.value })} className={inputThemeClasses} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Classification</label>
                  <select
                    value={editVehicle.vehicle_type_id}
                    onChange={(e) =>
                      setEditVehicle({
                        ...editVehicle,
                        vehicle_type_id: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option value={1} className="bg-white dark:bg-slate-800">
                      Car / Automobile
                    </option>
                    <option value={2} className="bg-white dark:bg-slate-800">
                      Motorbike / Scooter
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Color Finish</label>
                  <input type="text" required value={editVehicle.color} onChange={(e) => setEditVehicle({ ...editVehicle, color: e.target.value })} className={inputThemeClasses} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  disabled={apiLoading}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition active:scale-95 disabled:opacity-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={apiLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-md active:scale-95 disabled:opacity-50">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
