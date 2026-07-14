import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Component Bảo vệ Tuyến đường (Route Guard)
 *
 * Luồng hoạt động:
 *  1. isInitializing = true  → Hiển thị spinner, đợi AuthContext verify token với server
 *  2. isInitializing = false + !isAuthenticated → Redirect về /login
 *  3. isInitializing = false + isAuthenticated + sai role → Redirect về /forbidden hoặc /
 *  4. Tất cả hợp lệ → Render children
 *
 * @param {Array} allowedRoles - Mảng các role được phép truy cập
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  // Đang verify token với server → hiện spinner, KHÔNG render route hay redirect vội
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className="mt-4 text-gray-300 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập (hoặc token đã bị xóa sau khi verify) → về login, lưu vị trí cũ
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đăng nhập đúng nhưng sai role → về trang phù hợp
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const fallback =
      user?.role === "ParkingStaff"
        ? "/staff/dashboard"
        : user?.role === "ParkingManager"
        ? "/manager/dashboard"
        : user?.role === "SystemAdmin"
        ? "/admin/dashboard"
        : "/";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
