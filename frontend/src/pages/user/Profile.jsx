// src/pages/user/Profile.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Edit2, Save, X, ArrowLeft, User, Mail, Phone, Check, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth"; // Gọi trực tiếp bộ kết nối bảo mật Context toàn cục
import { useLanguage } from "../../hooks/useLanguage";


// Hàm tiện ích bóc tách lấy URL gốc của Server cho phần avatar, dọn sạch cụm /api/v1 vướng víu
const getBackendRootUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5077";
  return baseUrl.replace("/api/v1", ""); // Nếu có /api/v1 thì cắt bỏ, nếu không có thì giữ nguyên
};

export default function Profile() {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Trích xuất các cổng chức năng và dữ liệu người dùng từ useAuth
  const { user, updateUser, fetchProfile, updateProfileApi } = useAuth();
  const { language } = useLanguage();

  // 1. STATE LƯU THÔNG TIN PROFILE (Đã ẩn Username và Email đóng băng theo thiết kế mẫu)
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  });

  const [selectedFile, setSelectedFile] = useState(null); // Lưu trữ đối tượng File ảnh thô
  const [previewUrl, setPreviewUrl] = useState(""); // Đường dẫn ảo tạm thời phục vụ render preview ảnh

  // Quản lý đầy đủ 3 trạng thái của hệ thống: loading / error / success
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: null, message: "" }); // type: "success" | "error"

  // Quản lý trạng thái khóa/mở khóa quyền chỉnh sửa riêng biệt từng ô
  const [isEditing, setIsEditing] = useState({
    full_name: false,
    phone: false,
  });

  // 2. TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU CHUẨN TỪ DATABASE KHI COMPONENT MOUNT
  useEffect(() => {
    const syncProfileData = async () => {
      try {
        setLoading(true);
        setStatus({ type: null, message: "" });

        // Gọi hàm fetchProfile từ Context -> Tự động nạp đúng accessToken và route /api/v1/auth/profile
        const data = await fetchProfile();
        if (data) {
          setProfile({
            full_name: data.full_name || "", // Ánh xạ trường họ tên
            email: data.email || "", // Ánh xạ trường email định danh
            phone: data.phone || "",
            avatar_url: data.avatar_url || "",
          });

          if (data.avatar_url) {
            // 1. Lấy URL từ biến môi trường (Ví dụ: http://localhost:5077/api/v1)
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5077";
            // Nối đúng mã cấu hình host môi trường tĩnh để không bị lỗi vỡ hình ảnh
            const rootUrl = baseUrl.replace("/api/v1", "");
            // 3. Ghép chuỗi sạch để trình duyệt gọi đúng link: http://localhost:5077/uploads/avatars/...
            // setPreviewUrl(`${rootUrl}${data.avatar_url}`);
            // Kiểm tra nếu là ảnh Google thì giữ nguyên, ảnh local thì mới nối rootUrl
            if (data.avatar_url.startsWith("http://") || data.avatar_url.startsWith("https://")) {
              setPreviewUrl(data.avatar_url);
            } else {
              setPreviewUrl(`${rootUrl}${data.avatar_url}`);
            }
          }
        }
      } catch (error) {
        console.error("Profile synchronization crashed:", error);
        setStatus({
          type: "error",
          message: error.message || (language === "en" ? "Cannot connect to server to fetch account info." : "Không thể kết nối đến máy chủ để lấy thông tin tài khoản."),
        });
      } finally {
        setLoading(false);
      }
    };

    syncProfileData();
  }, []);

  
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

  const toggleEdit = (field) => {
    setIsEditing({ ...isEditing, [field]: !isEditing[field] });
  };

  // 3. XỬ LÝ CHỌN FILE ẢNH ĐẠI DIỆN MỚI TRÁNH NỔ LỖI CHUỖI BASE64 CHẬM MẠNG
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStatus({ type: "error", message: "Image upload limit constraint: Max 2MB!" });
        return;
      }
      setSelectedFile(file); // Giữ file nhị phân thô để nạp vào đối tượng FormData
      setPreviewUrl(URL.createObjectURL(file)); // Tạo ObjectURL ảo chạy siêu nhẹ trên RAM trình duyệt
    }
  };

  // 4. LUỒNG SUBMIT ĐẨY DỮ LIỆU LÊN BACKEND THÔNG QUA MULTIPART FORMDATA
  const handleSaveAll = async () => {
    if (!profile.full_name.trim()) {
      alert(language === "en" ? "Full name cannot be empty!" : "Họ và tên không được để trống!");
      return;
    }
    if (!profile.phone.trim()) {
      alert(language === "en" ? "Phone number cannot be empty!" : "Số điện thoại không được để trống!");
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ type: null, message: "" });

      // Gọi hàm API đóng gói PascalCase từ Context truyền tải lên Server .NET
      const response = await updateProfileApi({
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        avatarFile: selectedFile, // Truyền file ảnh thô
      });

      if (response.success) {
        // CẬP NHẬT TRẠNG THÁI TOÀN CỤC: Sử dụng toán tử spread giữ vẹn nguyên trường 'role' tránh crash app
        updateUser({
          ...user,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar: response.data?.avatar_url || profile.avatar_url,
          avatar_url: response.data?.avatar_url || profile.avatar_url,
        });

        setStatus({ type: "success", message: language === "en" ? "Profile saved to database successfully!" : "Thông tin cá nhân đã được lưu thành công!" });
        setTimeout(() => navigate(-1), 800); // Trì hoãn nhẹ 0.8s đóng modal để khách kịp nhìn thấy banner thông báo
      }
    } catch (error) {
      console.error("Save profile workflow failure:", error);
      setStatus({
        type: "error",
        message: error.message || (language === "en" ? "Business logic error or duplicate phone identifier." : "Lỗi xử lý hoặc số điện thoại đã tồn tại."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white space-y-3">
        <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
        <p className="text-sm text-stone-300 font-medium">{language === "en" ? "Loading account details..." : "Đang tải thông tin tài khoản..."}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div ref={modalRef} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{language === "en" ? "Account Info" : "Thông tin tài khoản"}</h2>
          <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* NOTIFICATION DYNAMIC LAYER (Vá lỗi biến chưa định nghĩa cũ) */}
        {status.message && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
              status.type === "success" ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40" : "bg-rose-950/40 text-rose-400 border-rose-800/40"
            }`}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>{status.message}</div>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* AVATAR WRAPPER */}
          <div className="flex flex-col items-center justify-center">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold shadow-lg overflow-hidden border-4 border-white dark:border-slate-800 transition-transform group-hover:scale-105">
                {previewUrl ? <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" /> : initial}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center group-hover:scale-105">
                <Camera className="text-white" size={28} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{language === "en" ? "Tap to change photo" : "Nhấn để đổi ảnh đại diện"}</p>
          </div>

          <div className="space-y-4">
            {/* FIELD: FULL NAME (EDITABLE) */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                <User size={14} /> {language === "en" ? "Full Name" : "Họ và tên"}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  disabled={!isEditing.full_name}
                  maxLength={100} // Chặn lỗi tràn cột VARCHAR(100) của DB
                  className={`flex-1 bg-transparent text-slate-800 dark:text-white font-medium py-1 border-b-2 transition-colors focus:outline-none ${
                    isEditing.full_name ? "border-blue-500" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit("full_name")}
                  className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors">
                  {isEditing.full_name ? <Check size={16} className="text-green-500" /> : <Edit2 size={16} />}
                </button>
              </div>
            </div>

            {/* FIELD: EMAIL (READ-ONLY KHÓA CỨNG AN TOÀN ĐỊNH DANH) */}
            <div className="group opacity-50">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Mail size={14} /> {language === "en" ? "Email Address (Read-only)" : "Địa chỉ Email (Chỉ đọc)"}
              </label>
              <div className="flex items-center gap-3 border-b-2 border-slate-200 dark:border-slate-700 py-1">
                <input type="email" value={profile.email} disabled className="flex-1 bg-transparent text-slate-400 font-medium focus:outline-none cursor-not-allowed" />
                <Mail size={16} className="text-slate-500 mx-2" />
              </div>
            </div>

            {/* FIELD: PHONE NUMBER (EDITABLE) */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Phone size={14} /> {language === "en" ? "Phone Number" : "Số điện thoại"}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing.phone}
                  maxLength={15} // Giới hạn kích thước độ dài chuỗi cột USERS.PHONE
                  className={`flex-1 bg-transparent text-slate-800 dark:text-white font-medium py-1 border-b-2 transition-colors focus:outline-none ${
                    isEditing.phone ? "border-blue-500" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggleEdit("phone")}
                  className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors">
                  {isEditing.phone ? <Check size={16} className="text-green-500" /> : <Edit2 size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION BUTTON */}
        <div className="p-6 pt-0 mt-auto">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-transform active:scale-95 disabled:cursor-not-allowed">
            {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save size={20} />}
            {submitting ? (language === "en" ? "SAVING PROGRESS..." : "ĐANG LƯU...") : (language === "en" ? "SAVE CHANGES" : "LƯU THAY ĐỔI")}
          </button>
        </div>
      </div>
    </div>
  );
}
