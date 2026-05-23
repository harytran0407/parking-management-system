import { useState } from "react";
import { Link, useLocation } from "react-router-dom"; //  import useLocation
import { useAuth } from "../hooks/useAuth";
import { LogOut, Menu, X, PanelLeft } from "lucide-react";

export default function Sidebar({ navigationItems = [] }) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  
 const checkIsActive = (path) => {

   if (path === "/user") {
     return location.pathname === "/user" || location.pathname === "/user/";
   }

   
   return (
     location.pathname === path || location.pathname.startsWith(`${path}/`)
   );
 };

  return (
    <>
      {/* TOGGLE MENU  */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ASIDE SIDEBAR  */}
      <aside
        className={`sidebar-wrapper fixed lg:relative h-screen overflow-y-auto transition-all duration-300 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* LOGO BOX  */}
        <div className="pt-6 pb-6 pr-6 pl-16 lg:p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Smartpark
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Parking Management
          </p>
        </div>

        {/* NAVIGATION LINKS  */}
        <nav className="p-6 space-y-2">
          {navigationItems.map((item) => {
            // BỔ SUNG: Xác định trạng thái Active
            const isActive = checkIsActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
              
                className={`
                  relative flex items-center justify-between px-4 py-3 rounded-lg transition-colors overflow-hidden group
                  ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

                
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-3/4 bg-blue-600 dark:bg-blue-500 rounded-l-full shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE BOX  */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="mb-4 p-3 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm">
            <p className="text-sm text-slate-800 dark:text-slate-200">
              <span className="font-semibold">{user?.name || "Guest"}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
              {user?.role}
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

      {/* OVERLAY MENU */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-30"
        />
      )}
    </>
  );
}

