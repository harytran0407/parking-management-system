import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut, Menu, X, PanelLeftClose } from "lucide-react";

export default function Sidebar({
  navigationItems = [],
  isCollapsed,
  setIsCollapsed,
}) {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  // FIXED LOGIC: Chuẩn hóa kiểm tra trạng thái Active
  const checkIsActive = (path) => {
    // Loại bỏ dấu "/" ở cuối (nếu có) để so sánh đồng nhất
    const currentPath = location.pathname.replace(/\/$/, "");
    const targetPath = path.replace(/\/$/, "");

    // Với các route gốc của Role (ví dụ trang Dashboard: /staff, /user, /admin)
    // Bắt buộc phải trùng khớp chính xác 100%
    if (
      targetPath === "/staff" ||
      targetPath === "/user" ||
      targetPath === "/admin" ||
      targetPath === ""
    ) {
      return currentPath === targetPath;
    }

    // Với các sub-routes (ví dụ: /staff/checkin),
    // Trả về true nếu trùng khớp chính xác HOẶC đang ở trang con của route đó (VD: /staff/checkin/detail)
    return (
      currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
    );
  };

  return (
    <>
      {/* TOGGLE MENU (Mobile) */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ASIDE SIDEBAR */}
      <aside
        className={`fixed lg:relative h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0
          ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-0 lg:border-none" : "lg:w-64"}
        `}
      >
        {/* LOGO BOX */}
        <div className="pt-6 pb-6 pl-16 pr-4 lg:p-6 lg:pr-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white whitespace-nowrap">
              Smartpark
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
              Parking Management
            </p>
          </div>

          {/* Close button for desktop */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng Sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="p-4 space-y-2 flex-1 relative">
          {navigationItems.map((item) => {
            const isActive = checkIsActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 overflow-hidden group whitespace-nowrap
                  ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }
                `}
              >
                <div className="flex items-center gap-3 z-10">
                  <div
                    className={`${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>

                <div className="flex items-center gap-2 z-10">
                  {item.badge && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Vertical Blue Bar for Active State */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 bg-blue-600 dark:bg-blue-500 rounded-l-full shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE BOX */}
        <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="mb-4 p-3 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm">
            <p className="text-sm text-slate-800 dark:text-slate-200">
              <span className="font-semibold">{user?.name || "Guest"}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
              {/* Đảm bảo hiển thị đúng ROLE từ database (ParkingStaff) */}
              {user?.role?.replace(/([A-Z])/g, " $1").trim() || "User"}
            </p>
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-slate-200 hover:bg-red-50 text-slate-700 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/30 dark:text-slate-300 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* OVERLAY Cho Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm lg:hidden z-30"
        />
      )}
    </>
  );
}
