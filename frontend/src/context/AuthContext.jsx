// import React, { createContext, useState, useCallback } from "react";
// import api from "../utils/api";
// export const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   // Lazy Initialization: Kiểm tra trạng thái đăng nhập ngay khi ứng dụng khởi chạy
//   const [user, setUser] = useState(() => {
//     const savedUser = localStorage.getItem("user");
//     if (savedUser) {
//       try {
//         return JSON.parse(savedUser);
//       } catch (e) {
//         console.error("Error parsing user from localStorage:", e);
//         localStorage.removeItem("user");
//         localStorage.removeItem("accessToken");
//         return null;
//       }
//     }
//     return null;
//   });

//   const [loading, setLoading] = useState(false);

//   /**
//    * Hàm Đăng nhập Hệ thống
//    * @param {string} email
//    * @param {string} password
//    * @param {string} role - Bắt buộc dùng: 'ParkingUser', 'ParkingStaff', 'ParkingManager', 'SystemAdmin'
//    */
//   const login = useCallback(async (email, password, role) => {
//     setLoading(true);
//     try {
//       // Giả lập thời gian phản hồi từ API (Mock API)
//       await new Promise((resolve) => setTimeout(resolve, 500));

//       const savedUserStr = localStorage.getItem(`profile_${email}`);
//       let existingUser = {};
//       if (savedUserStr) {
//         existingUser = JSON.parse(savedUserStr);

//       }

//       // ĐỒNG BỘ 100% VỚI BẢNG USERS TRONG Database_PMS.sql VÀ Update_API_Document.md
//       const userData = {
//         user_id: existingUser.user_id || `usr_${Math.floor(Math.random() * 1000)}`, // Khớp USERS.USER_ID
//         username: existingUser.username || email.split("@")[0], // Khớp USERS.USERNAME
//         full_name: existingUser.full_name || existingUser.name || "Nguyen Van A", // Khớp USERS.FULL_NAME
//         email: email, // Khớp USERS.EMAIL
//         phone: existingUser.phone || "", // Khớp USERS.PHONE
//         role: role, // Khớp ROLE.ROLE_NAME ('ParkingStaff', 'ParkingUser'...)
//         avatar: existingUser.avatar || "https://via.placeholder.com/150", // Dữ liệu bổ trợ Frontend
//       };

//       setUser(userData);

//       // Lưu trữ đồng bộ vào LocalStorage để đồng bộ trạng thái phiên làm việc
//       localStorage.setItem("user", JSON.stringify(userData));
//       localStorage.setItem("userRole", role);
//       localStorage.setItem(`profile_${email}`, JSON.stringify(userData));

//       return userData;
//     } catch (error) {
//       console.error("Login failed:", error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Hàm Đăng xuất Hệ thống
//   const logout = useCallback(() => {
//     setUser(null);
//     localStorage.removeItem("userData");
//     localStorage.removeItem("userRole");
//   }, []);

//   /**
//    * Cập nhật thông tin cá nhân (Phục vụ chức năng FR-AUTH-05)
//    * @param {Object} updateData - Các trường thông tin cần chỉnh sửa
//    */
//   const updateUser = useCallback((updateData) => {
//     setUser((prevUser) => {
//       if (!prevUser) return null;

//       // Tiến hành merge data cũ và data mới cập nhật
//       const newUser = { ...prevUser, ...updateData };

//       localStorage.setItem("user", JSON.stringify(newUser));
//       // Cập nhật lại Mock Database theo Email khóa chính
//       localStorage.setItem(`profile_${newUser.email}`, JSON.stringify(newUser));
//       return newUser;
//     });
//   }, []);

//   /**
//    * Đăng nhập bằng Google (Chuẩn hóa cấu trúc Role mặc định thành ParkingUser thay vì 'User')
//    */
//   const loginWithGoogle = useCallback(async (googleToken) => {
//     setLoading(true);
//     try {
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const userData = {
//         user_id: `G-${Math.floor(Math.random() * 10000)}`,
//         username: "google_user",
//         full_name: "Google User",
//         email: "google.user@gmail.com",
//         role: "ParkingUser",
//         phone: "",
//         avatar: "https://www.svgrepo.com/show/475656/google-color.svg",
//       };

//       setUser(userData);
//       localStorage.setItem("user", JSON.stringify(userData));
//       localStorage.setItem("userRole", userData.role);
//       localStorage.setItem(`profile_${userData.email}`, JSON.stringify(userData));
//       return userData;
//     } catch (error) {
//       console.error("Google login failed: ", error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const isAuthenticated = !!user;

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         login,
//         logout,
//         isAuthenticated,
//         updateUser,
//         loginWithGoogle,
//       }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

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
   * 🛑 HÀM ĐĂNG NHẬP THỰC TẾ (TÍCH HỢP AXIOS API)
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
        password: password
      });

      // Đối chiếu cấu trúc response.data.data thành công từ authController.cs
      if (response.data && response.data.success) {
        const { token, user: backendUser } = response.data.data;

        // Đồng bộ lưu trữ trọn vẹn vào hệ thống LocalStorage
        localStorage.setItem("accessToken", token);
        localStorage.setItem("userData", JSON.stringify(backendUser));

        // 🎯 KÍCH HOẠT ĐỒNG BỘ STATE: Giúp ProtectedRoute mở khóa ngay lập tức
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
        access_token: googleAccessToken
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 🎯 XUẤT BẢN CUSTOM HOOK USEAUTH ĐỂ DÙNG TẬP TRUNG TOÀN DỰ ÁN
 function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth bắt buộc phải được đặt bên trong linh kiện AuthProvider");
  }
  return context;
}
