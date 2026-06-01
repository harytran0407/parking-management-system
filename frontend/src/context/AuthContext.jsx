import React, { createContext, useState, useCallback } from "react";
// Import instance axios của bạn vào đây khi chạy hệ thống thật
// import axiosClient from "../api/axiosClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  /**
   * =========================================================================
   * 1. HÀM ĐĂNG NHẬP (FR-AUTH-02) -> ENDPOINT: /api/v1/auth/login
   * =========================================================================
   */
  const login = useCallback(async (email, password, role) => {
    setLoading(true);
    try {
      // -----------------------------------------------------------------------
      //  PHẦN MOCK DATA CHẠY TẠM THỜI
      // -----------------------------------------------------------------------
      await new Promise((resolve) => setTimeout(resolve, 500));
      const savedUserStr = localStorage.getItem(`profile_${email}`);
      let existingUser = savedUserStr ? JSON.parse(savedUserStr) : {};

      const userData = {
        user_id: existingUser.user_id || `usr_${Math.floor(Math.random() * 1000)}`,
        username: existingUser.username || email.split("@")[0],
        full_name: existingUser.full_name || (role === "ParkingStaff" ? "Nguyễn Văn Nhân Viên" : "Nguyễn Văn Tài Xế"),
        email: email,
        phone: existingUser.phone || "0901234567",
        role: role,
        avatar: existingUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      };
      // -----------------------------------------------------------------------

      // =======================================================================
      //  TODO: AXIOS INTEGRATION (KHI RÁP BACKEND THẬT - MỞ COMMENT ĐOẠN NÀY)
      // =======================================================================
      /*
      // Theo API_Document §1.1: Body truyền lên gồm email và password
      const response = await axiosClient.post('/api/v1/auth/login', { email, password });
      
      // Cấu trúc data trả về từ Server: response.data = { success, message, data: { token, user: { user_id, full_name... } } }
      const { token, user: backendUser } = response.data; 
      
      // Lưu JWT Token vào localStorage để Axios Interceptor tự bốc đi làm đính kèm Header
      localStorage.setItem("token", token);
      
      const userData = {
        user_id: backendUser.user_id,
        username: backendUser.username || backendUser.email.split("@")[0],
        full_name: backendUser.full_name,
        email: backendUser.email,
        phone: backendUser.phone || "",
        role: backendUser.role, // Server trả về 'ParkingStaff' hoặc 'ParkingUser'
        avatar: backendUser.avatar || "https://via.placeholder.com/150"
      };
      */
      // =======================================================================

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userRole", role);
      localStorage.setItem(`profile_${email}`, JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error("Login integration point failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * =========================================================================
   * 2. HÀM ĐĂNG XUẤT (FR-AUTH-03) -> ENDPOINT: /api/v1/auth/logout
   * =========================================================================
   */
  const logout = useCallback(async () => {
    try {
      // =======================================================================
      //  TODO: AXIOS INTEGRATION (KHI RÁP BACKEND THẬT - MỞ COMMENT ĐOẠN NÀY)
      // =======================================================================
      /*
      // Theo API_Document §1.2: Gọi API logout để hủy token phía Server (nếu cần mã hóa blacklist)
      await axiosClient.post('/api/v1/auth/logout');
      */
      // =======================================================================
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Bất luận API có lỗi hay không, Client bắt buộc phải xóa trắng Session tại Local
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      localStorage.removeItem("token"); // Xóa luôn JWT Token
    }
  }, []);

  /**
   * =========================================================================
   * 3. CẬP NHẬT TRANG CÁ NHÂN (FR-AUTH-05) -> ENDPOINT GIẢ ĐỊNH: /api/v1/user/profile
   * =========================================================================
   */
  const updateUser = useCallback(async (updateData) => {
    // Nếu bạn muốn hiển thị loading khi bấm nút Save Profile, có thể bật setLoading(true) tại đây
    try {
      // =======================================================================
      //  TODO: AXIOS INTEGRATION (KHI RÁP BACKEND THẬT - MỞ COMMENT ĐOẠN NÀY)
      // =======================================================================
      /*
      // Gửi data chỉnh sửa (full_name, phone, avatar...) lên endpoint cập nhật profile
      const response = await axiosClient.put('/api/v1/user/profile', updateData);
      // Giả định backend trả về object user mới sau khi cập nhật thành công: response.data = { success, data: updatedUser }
      const backendUpdatedUser = response.data.data;
      */
      // =======================================================================

      setUser((prevUser) => {
        if (!prevUser) return null;

        // Xử lý làm sạch chống ngộ độc dữ liệu chuỗi trống từ Client UI
        const cleanUpdateData = {};
        Object.keys(updateData).forEach((key) => {
          if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== "") {
            cleanUpdateData[key] = updateData[key];
          }
        });

        // Hỗ trợ Map dữ liệu nếu form UI dùng camelCase lạc loài
        if (updateData.fullName && !updateData.full_name) {
          cleanUpdateData.full_name = updateData.fullName;
        }

        // Thay thế bằng 'backendUpdatedUser' nếu dùng API thật ở trên
        const newUser = { ...prevUser, ...cleanUpdateData };

        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem(`profile_${newUser.email}`, JSON.stringify(newUser));
        return newUser;
      });
    } catch (error) {
      console.error("Update User Profile Axios error:", error);
      throw error;
    }
  }, []);

  /**
   * =========================================================================
   * 4. ĐĂNG NHẬP GOOGLE -> ENDPOINT GIẢ ĐỊNH: /api/v1/auth/google
   * =========================================================================
   */
  const loginWithGoogle = useCallback(async (googleToken) => {
    setLoading(true);
    try {
      // -----------------------------------------------------------------------
      // PHẦN MOCK DATA CHẠY TẠM THỜI
      // -----------------------------------------------------------------------
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const userData = {
        user_id: `G-${Math.floor(Math.random() * 10000)}`,
        username: "google_user",
        full_name: "Google Driver User",
        email: "google.user@gmail.com",
        role: "ParkingUser",
        phone: "",
        avatar: "https://www.svgrepo.com/show/475656/google-color.svg",
      };
      // -----------------------------------------------------------------------

      // =======================================================================
      //  TODO: AXIOS INTEGRATION (KHI RÁP BACKEND THẬT - MỞ COMMENT ĐOẠN NÀY)
      // =======================================================================
      /*
      // Bắn chuỗi token xác thực của Google lên Server để Server phân tích và cấp JWT của hệ thống
      const response = await axiosClient.post('/api/v1/auth/google', { token: googleToken });
      const { token, user: backendUser } = response.data;
      
      localStorage.setItem("token", token);
      const userData = {
        user_id: backendUser.user_id,
        username: backendUser.username,
        full_name: backendUser.full_name,
        email: backendUser.email,
        role: backendUser.role, // Thường mặc định là ParkingUser
        avatar: backendUser.avatar
      };
      */
      // =======================================================================

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem(`profile_${userData.email}`, JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Google authentication route failed: ", error);
      throw error;
    } finally {
      setLoading(false);
    }
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
