import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Edit2,
  Save,
  X,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Check,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function Profile() {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user, updateUser } = useAuth();

  // 1. STATE LƯU THÔNG TIN USER (🚀 ĐÃ SỬA: Đồng bộ name -> full_name)
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });

  // update continuously user info (🚀 ĐÃ SỬA: Đồng bộ name -> full_name khi nạp dữ liệu từ Context)
  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user?.full_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        avatar: user?.avatar || "",
      });
    }
  }, [user]);

  // 2. ON/OF edit information (🚀 ĐÃ SỬA: Đổi key name -> full_name cho đồng bộ trạng thái bật/tắt sửa)
  const [isEditing, setIsEditing] = useState({
    full_name: false,
    email: false,
    phone: false,
  });

  // 3. Click to close the edit profile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        navigate(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navigate]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // ON/OF edit profile
  const toggleEdit = (field) => {
    setIsEditing({ ...isEditing, [field]: !isEditing[field] });
  };

  // Edit avatar by uploading file
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Using fileReader to read photo uploading from computer
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result }); // update avatar to state
      };
      reader.readAsDataURL(file);
    }
  };

  // Call API (🚀 ĐÃ TỐI ƯU: Chặn không cho lưu nếu cố tình xóa trống Họ và tên)
  const handleSaveAll = () => {
    if (!profile.full_name || profile.full_name.trim() === "") {
      alert("Họ và tên không được để trống!");
      return;
    }

    updateUser(profile);
    setIsEditing({ full_name: false, email: false, phone: false });
    alert("Profile updated successfully!");
    navigate(-1); // Đóng modal
  };

  // Pick first letter of name (🚀 ĐÃ SỬA: Cắt chữ cái đầu theo trường full_name)
  const initial = profile.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* Information board*/}
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col"
      >
        {/* HEADER: Back button*/}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Account Info
          </h2>
          {/* X to close the update modal profile*/}
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-8">
          {/* AVATAR Đ*/}
          <div className="flex flex-col items-center justify-center">
            {/* 3. INPUT FILE IMAGE */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Click AVATAR */}
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold shadow-lg overflow-hidden border-4 border-white dark:border-slate-800 transition-transform group-hover:scale-105">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center group-hover:scale-105">
                <Camera className="text-white" size={28} />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Tap to change photo
            </p>
          </div>

          <div className="space-y-5">
            {/* Field: Username (🚀 ĐÃ SỬA ĐỒNG BỘ: Sửa các biến name -> full_name) */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                <User size={14} /> Full Name
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  name="full_name" // Khớp với trường xử lý handleChange
                  value={profile.full_name}
                  onChange={handleChange}
                  disabled={!isEditing.full_name}
                  className={`flex-1 bg-transparent text-slate-800 dark:text-white font-medium py-2 border-b-2 transition-colors focus:outline-none ${
                    isEditing.full_name
                      ? "border-blue-500"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                <button
                  onClick={() => toggleEdit("full_name")}
                  className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  {isEditing.full_name ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Edit2 size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Field: Email */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Mail size={14} /> Email Address
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled={!isEditing.email}
                  className={`flex-1 bg-transparent text-slate-800 dark:text-white font-medium py-2 border-b-2 transition-colors focus:outline-none ${
                    isEditing.email
                      ? "border-blue-500"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                <button
                  onClick={() => toggleEdit("email")}
                  className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  {isEditing.email ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Edit2 size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Field: Phone */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Phone size={14} /> Phone Number
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing.phone}
                  className={`flex-1 bg-transparent text-slate-800 dark:text-white font-medium py-2 border-b-2 transition-colors focus:outline-none ${
                    isEditing.phone
                      ? "border-blue-500"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                <button
                  onClick={() => toggleEdit("phone")}
                  className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  {isEditing.phone ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Edit2 size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Save button */}
        <div className="p-6 md:p-8 pt-0 mt-auto">
          <button
            onClick={handleSaveAll}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
          >
            <Save size={20} />
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
}
