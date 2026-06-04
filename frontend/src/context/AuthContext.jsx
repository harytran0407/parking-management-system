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
   * ==========================================
   *  HÀM ĐĂNG NHẬP THỰC TẾ (TÍCH HỢP AXIOS API)
   * ==========================================
   * @param {string} emailOrPhone - Email hoặc Số điện thoại người dùng
   * @param {string} password - Mật khẩu thô
   */
  const login = useCallback(async (emailOrPhone, password) => {
    setLoading(true);
    try {
      // Gọi chính xác API thực tế theo cấu hình snake_case của dự án bãi xe
      const response = await api.post("/auth/login", {
        email_or_phone: emailOrPhone.trim(),
        password: password,
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
