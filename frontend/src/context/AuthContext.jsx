// src/context/AuthContext.jsx
import React, { createContext, useState, useCallback, useContext, useEffect } from "react";
import api from "../utils/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Đọc userData từ localStorage ngay lập tức để tránh flash trắng
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
   * isInitializing = true trong khi đang verify token lúc app khởi động.
   * ProtectedRoute sẽ hiển thị spinner cho đến khi biến này = false,
   * tránh tình trạng cho vào route rồi bị đá ra sau khi 401 trả về.
   */
  const [isInitializing, setIsInitializing] = useState(
    () => !!localStorage.getItem("accessToken")
  );

  /** Hàm nội bộ: dọn sạch session phía client */
  const _clearSession = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userData");
    setUser(null);
  }, []);

  /**
   * Khi app khởi động, nếu có token thì gọi /auth/profile để kiểm tra
   * xem token còn hợp lệ không.
   *  - Hợp lệ  → cập nhật user data mới nhất từ server
   *  - Hết hạn → xóa session ngay, user thấy trang login thay vì flash rồi redirect
   */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsInitializing(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.get("/auth/profile");
        if (response.data?.success) {
          const profileData = response.data.data;
          setUser((prev) => {
            const updated = { ...prev, ...profileData };
            localStorage.setItem("userData", JSON.stringify(updated));
            return updated;
          });
        } else {
          _clearSession();
        }
      } catch {
        // 401 hoặc lỗi mạng → xóa session
        _clearSession();
      } finally {
        setIsInitializing(false);
      }
    };

    verifyToken();
  }, [_clearSession]);

  /**
   * ĐĂNG NHẬP
   */
  const login = useCallback(async (emailOrPhone, password, captchaToken) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email_or_phone: emailOrPhone.trim(),
        password: password,
        captcha_token: captchaToken,
      });

      if (response.data && response.data.success) {
        const { token, user: backendUser } = response.data.data;

        localStorage.setItem("accessToken", token);
        localStorage.setItem("userData", JSON.stringify(backendUser));
        setUser(backendUser);

        return backendUser;
      } else {
        throw new Error("Định dạng dữ liệu phản hồi từ máy chủ không hợp lệ.");
      }
    } catch (error) {
      console.error("Quá trình đăng nhập tại AuthContext gặp sự cố:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ĐĂNG NHẬP GOOGLE
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
   * ĐĂNG XUẤT
   */
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Server-side logout token revocation skipped or failed:", e);
    } finally {
      _clearSession();
    }
  }, [_clearSession]);

  /**
   * Cập nhật thông tin cá nhân cục bộ (không gọi API)
   */
  const updateUser = useCallback((updateData) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updateData };
      localStorage.setItem("userData", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  /**
   * Lấy thông tin profile mới nhất từ DB
   */
  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get("/auth/profile");
      if (response.data && response.data.success) {
        const profileData = response.data.data;

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
   * Cập nhật profile lên server dùng multipart FormData
   */
  const updateProfileApi = useCallback(async (profileData) => {
    const formData = new FormData();
    formData.append("FullName", profileData.full_name || "");
    formData.append("Phone", profileData.phone || "");

    if (profileData.avatarFile) {
      formData.append("Avatar", profileData.avatarFile);
    }

    try {
      const response = await api.put("/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      console.error("Error executing profile update multipart transmit:", error);
      throw error.response?.data || error;
    }
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isInitializing,
        login,
        logout,
        isAuthenticated,
        updateUser,
        loginWithGoogle,
        fetchProfile,
        updateProfileApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// CUSTOM HOOK
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth bắt buộc phải được đặt bên trong linh kiện AuthProvider");
  }
  return context;
}
