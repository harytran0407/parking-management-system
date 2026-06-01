import { toast } from "sonner";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
/**
 * GlobalHttpListener
 *
 * Vai trò: Cầu nối giữa tầng HTTP (api.js) và tầng UI (React)
 * Lắng nghe các CustomEvent do Axios interceptor dispatch,
 * sau đó hiển thị toast thông báo và điều hướng nếu cần.
 *
 * Đặt component này trong App.jsx, bên trong <BrowserRouter>
 * nhưng bên ngoài <Routes> để luôn active ở mọi trang.
 */
export default function GlobalHttpListener() {
  const navigate = useNavigate();
  useEffect(() => {
    //Case 1 :Mất mạng/server không phản hồi
    const handleNetworkError = (e) => {
      toast.error(e.detail?.message || "Cannot connect to server.", {
        duration: 4000,
        description: "Please check your internet connection and try again",
      });
    };

    // Case 2: 401 Unauthorized - Token hết hạn/không hợp lệ
    const handleUnauthorized = (e) => {
      toast.error(e.detail?.message || "Session expired.", {
        duration: 2000,
        description: "You will be redirected to the login page.",
      });
      //Delay == duration
      setTimeout(() => navigate("/login"), 2000);
    };

    //Case 3: 403 Forbidden -Sai role/ Vi phạm RBAC
    const handleForbidden = (e) => {
      toast.warning(e.detail?.message || "Access denied.", {
        duration: 2000,
        description: "You do not have permission to perform this action.",
      });
      setTimeout(() => navigate("/forbidden"), 2000);
    };
    //Case 4: 429 Too many requests - vượt rate limit
    const handleRateLimited = (e) => {
      toast.error(e.detail?.message || "Too many requests.", {
        duration: 5000,
        description: "Please slow down and try again in a moment",
      });
    };
    // Register listeners
    window.addEventListener("pbms-network-error", handleNetworkError);
    window.addEventListener("pbms-unauthorized", handleUnauthorized);
    window.addEventListener("pbms-forbidden", handleForbidden);
    window.addEventListener("pbms-rate-limited", handleRateLimited);

    return () => {
      window.removeEventListener("pbms-network-error", handleNetworkError);
      window.removeEventListener("pbms-unauthorized", handleUnauthorized);
      window.removeEventListener("pbms-forbidden", handleForbidden);
      window.removeEventListener("pbms-rate-limited", handleRateLimited);
    };
  }, [navigate]);

  return null;
}
