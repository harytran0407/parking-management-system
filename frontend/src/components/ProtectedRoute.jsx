import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Component Bảo vệ Tuyến đường (Route Guard) cải tiến
 * @param {Array} allowedRoles - Mảng các role được phép truy cập (Ví dụ: ['ParkingUser', 'ParkingStaff'])
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Giữ nguyên giao diện Loading mượt mà của bạn
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // TH 1: Nếu chưa đăng nhập -> Đá về /login và lưu lại vị trí cũ để sau khi login xong tự quay lại
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
   
    return (
      <Navigate
        to={user?.role === "ParkingStaff" ? "/staff/dashboard" : "/"}
        replace
      />
    );
  }

  
  return children;
}
