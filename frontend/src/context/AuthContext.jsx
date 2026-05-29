import React, { createContext, useState, useCallback } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Lazy Initialization: Kiểm tra trạng thái đăng nhập ngay khi ứng dụng khởi chạy
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  /**
   * Hàm Đăng nhập Hệ thống
   * @param {string} email
   * @param {string} password
   * @param {string} role - Bắt buộc dùng: 'ParkingUser', 'ParkingStaff', 'ParkingManager', 'SystemAdmin'
   */
  const login = useCallback(async (email, password, role) => {
    setLoading(true);
    try {
      // Giả lập thời gian phản hồi từ API (Mock API)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const savedUserStr = localStorage.getItem(`profile_${email}`);
      let existingUser = {};
      if (savedUserStr) {
        existingUser = JSON.parse(savedUserStr);
      }

      // ĐỒNG BỘ 100% VỚI BẢNG USERS TRONG Database_PMS.sql VÀ Update_API_Document.md
      const userData = {
        user_id:
          existingUser.user_id || `usr_${Math.floor(Math.random() * 1000)}`, // Khớp USERS.USER_ID
        username: existingUser.username || email.split("@")[0], // Khớp USERS.USERNAME
        full_name:
          existingUser.full_name || existingUser.name || "Nguyen Van A", // Khớp USERS.FULL_NAME
        email: email, // Khớp USERS.EMAIL
        phone: existingUser.phone || "", // Khớp USERS.PHONE
        role: role, // Khớp ROLE.ROLE_NAME ('ParkingStaff', 'ParkingUser'...)
        avatar: existingUser.avatar || "https://via.placeholder.com/150", // Dữ liệu bổ trợ Frontend
      };

      setUser(userData);

      // Lưu trữ đồng bộ vào LocalStorage để đồng bộ trạng thái phiên làm việc
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userRole", role);
      localStorage.setItem(`profile_${email}`, JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Hàm Đăng xuất Hệ thống
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
  }, []);

  /**
   * Cập nhật thông tin cá nhân (Phục vụ chức năng FR-AUTH-05)
   * @param {Object} updateData - Các trường thông tin cần chỉnh sửa
   */
  const updateUser = useCallback((updateData) => {
    setUser((prevUser) => {
      if (!prevUser) return null;

      // Tiến hành merge data cũ và data mới cập nhật
      const newUser = { ...prevUser, ...updateData };

      localStorage.setItem("user", JSON.stringify(newUser));
      // Cập nhật lại Mock Database theo Email khóa chính
      localStorage.setItem(`profile_${newUser.email}`, JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  /**
   * Đăng nhập bằng Google (Chuẩn hóa cấu trúc Role mặc định thành ParkingUser thay vì 'User')
   */
  const loginWithGoogle = useCallback(async (googleToken) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const userData = {
        user_id: `G-${Math.floor(Math.random() * 10000)}`,
        username: "google_user",
        full_name: "Google User",
        email: "google.user@gmail.com",
        role: "ParkingUser", 
        phone: "",
        avatar: "https://www.svgrepo.com/show/475656/google-color.svg",
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem(
        `profile_${userData.email}`,
        JSON.stringify(userData),
      );
      return userData;
    } catch (error) {
      console.error("Google login failed: ", error);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
