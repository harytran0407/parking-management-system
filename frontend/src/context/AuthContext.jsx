// src/context/AuthContext.jsx
import React, { createContext, useState, useCallback, useContext } from "react";
import api from "../utils/api"; // Sử dụng instance Axios đã cấu hình gạch dưới snake_case của bạn

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 1. LAZY INITIALIZATION: Đồng bộ quét đúng bộ Key lưu trữ thực tế khi F5 trang web
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("userData");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Lỗi phân giải dữ liệu người dùng từ localStorage:", e);
        localStorage.removeItem("userData");
        localStorage.removeItem("accessToken");
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  /**
   * ====================================================
   *  HÀM ĐĂNG NHẬP THỰC TẾ (TÍCH HỢP AXIOS API-RECAPTCHA)
   * ====================================================
   * @param {string} emailOrPhone - Email hoặc Số điện thoại người dùng
   * @param {string} password - Mật khẩu thô
   */
  const login = useCallback(async (emailOrPhone, password, captchaToken) => {
    setLoading(true);
    try {
      // Gọi chính xác API thực tế theo cấu hình snake_case của dự án bãi xe
      const response = await api.post("/auth/login", {
        email_or_phone: emailOrPhone.trim(),
        password: password,
        captcha_token: captchaToken,
      });

      // Đối chiếu cấu trúc response.data.data thành công từ authController.cs
      if (response.data && response.data.success) {
        const { token, user: backendUser } = response.data.data;

        // Đồng bộ lưu trữ trọn vẹn vào hệ thống LocalStorage
        localStorage.setItem("accessToken", token);
        localStorage.setItem("userData", JSON.stringify(backendUser));

        setUser(backendUser);

        return backendUser;
      } else {
        throw new Error("Định dạng dữ liệu phản hồi từ máy chủ không hợp lệ.");
      }
    } catch (error) {
      console.error("Quá trình đăng nhập tại AuthContext gặp sự cố:", error);
      throw error; // Ném lỗi ra ngoài để màn hình Login.jsx bắt được hiển thị lên UI
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ==========================================
   * 🛑 HÀM ĐĂNG NHẬP GOOGLE THỰC TẾ (TÍCH HỢP AXIOS API)
   * ==========================================
   */
  const loginWithGoogle = useCallback(async (googleAccessToken) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/google-login", {
        access_token: googleAccessToken,
      });

      if (response.data && response.data.success) {
        const { token, user: backendUser } = response.data.data;

        localStorage.setItem("accessToken", token);
        localStorage.setItem("userData", JSON.stringify(backendUser));

        // Kích hoạt đồng bộ hóa trạng thái React toàn cục
        setUser(backendUser);
        return backendUser;
      } else {
        throw new Error("Xác thực Google Token thất bại.");
      }
    } catch (error) {
      console.error("Google Authentication Handshake Failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ==========================================
   * 🛑 HÀM ĐĂNG XUẤT HỆ THỐNG TRỰC TIẾP
   * ==========================================
   */
  const logout = useCallback(async () => {
    try {
      // Gọi API đăng xuất lên Server theo đặc tả FR-AUTH-03 nếu đã có token
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Server-side logout token revocation skipped or failed:", e);
    } finally {
      // Luôn luôn dọn sạch bộ nhớ bộ nhớ Client bất kể API thành công hay gặp lỗi
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userData");
    }
  }, []);

  /**
   * Cập nhật thông tin cá nhân cục bộ (Phục vụ chức năng FR-AUTH-05)
   */
  const updateUser = useCallback((updateData) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updateData };
      localStorage.setItem("userData", JSON.stringify(newUser));
      return newUser;
    });
  }, []);
  // lấy thông tin profile từ DB
  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get("/auth/profile");
      if (response.data && response.data.success) {
        const profileData = response.data.data;

        // Sử dụng functional updater form (prev => ...) để loại bỏ sự phụ thuộc vào biến 'user'
        setUser((prevUser) => {
          const updated = { ...prevUser, ...profileData };
          localStorage.setItem("userData", JSON.stringify(updated));
          return updated;
        });

        return profileData;
      }
    } catch (error) {
      console.error("Failed to fetch profile updates from database:", error);
      throw error;
    }
  }, []);

  /**
   *  CẬP NHẬT PROFILE LÊN SERVER DÙNG MULTIPART FORMDATA
   * SỬA LỖI ĐỒNG BỘ: Đổi key khớp chuẩn xác 100% với thuộc tính UpdateProfileRequestDto trong C#
   */
  const updateProfileApi = useCallback(async (profileData) => {
    const formData = new FormData();

    
    // formData.append("Username", profileData.username || "");
    formData.append("FullName", profileData.full_name || ""); 
    // formData.append("Email", profileData.email || "");
    formData.append("Phone", profileData.phone || "");

    // Gắn tệp tin nhị phân gốc vào trường Avatar nếu có phát hiện file mới chọn
    if (profileData.avatarFile) {
      formData.append("Avatar", profileData.avatarFile); 
    }

    try {
      const response = await api.put("/auth/profile", formData, {
        headers: {
          // Chỉ định cấu hình Multipart định dạng dữ liệu truyền tải
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error executing profile update multipart transmit:", error);
      throw error.response?.data || error;
    }
  }, []); // Thêm mảng dependency trống bảo vệ hiệu năng hàm
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        updateUser,
        loginWithGoogle,
        fetchProfile,
        updateProfileApi,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🎯 XUẤT BẢN CUSTOM HOOK USEAUTH ĐỂ DÙNG TẬP TRUNG TOÀN DỰ ÁN
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth bắt buộc phải được đặt bên trong linh kiện AuthProvider");
  }
  return context;
}
