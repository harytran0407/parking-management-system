import { Routes, Route } from "react-router-dom";
import {useState} from 'react';
import {LayoutDashboard,History,LogIn,LogOut,AlertTriangle,Map} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StaffDashboard from "../pages/staff/Dashboard";
import Profile from '../pages/user/Profile'; 
// Import corresponding pages 
import CheckInPage from "../pages/staff/CheckInPage";
import CheckOutPage from "../pages/staff/CheckOutPage";
import HistoryPage from "../pages/staff/HistoryPage";
import IncidentHandlingPage from '../pages/staff/IncidentHandling';
import SlotGateManagementPage from '../pages/staff/SlotGateManagement';
import { useLanguage } from "../hooks/useLanguage";

export default function StaffLayout() {
  // Navigation mapping based on ParkingStaff capabilities defined in USER_STORIES.md
  const { language } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigationItems = [
    {
      path: "/staff",
      label: language === "en" ? "Dashboard" : "Bảng điều khiển",
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: "/staff/checkin",
      label: language === "en" ? "Check-In" : "Cho xe vào",
      icon: <LogIn size={20} />,
    },
    {
      path: "/staff/checkout",
      label: language === "en" ? "Check-Out" : "Cho xe ra",
      icon: <LogOut size={20} />,
    },
    {
        path: "/staff/history", // Đường dẫn menu
        label: language === "en" ? "Parking History" : "Lịch sử đỗ xe",
        icon: <History size={20} />,
    },
    {
      path: "/staff/incidents",
      label: language === "en" ? "Incident Handling" : "Báo cáo sự cố",
      icon: <AlertTriangle size={20} />,
    },
    {
      path: "/staff/slots",
      label: language === "en" ? "Slot & Gate Management" : "Giám sát ô đỗ",
      icon: <Map size={20} />,
    },
  ];

  return (
    <div className="main-container flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar
        navigationItems={navigationItems}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="content-wrapper flex-1 flex flex-col overflow-hidden">
        {/* Header title tailored for Parking Staff role */}
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

          <main className="page-content flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 p-4 md:p-6 overflow-y-auto transition-colors duration-300">
              <Routes>
                  <Route path="/" element={<StaffDashboard />} />
                  <Route path="/checkin" element={<CheckInPage />} />
                  <Route path="/checkout" element={<CheckOutPage />} />

                  {/* 3. ĐỊNH NGHĨA ROUTE ĐỂ HIỂN THỊ COMPONENT KHI TRUY CẬP */}
                  <Route path="/history" element={<HistoryPage />} />

                  <Route path="/incidents" element={<IncidentHandlingPage />} />
                  <Route path="/slots" element={<SlotGateManagementPage />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="/*" element={<StaffDashboard />} />
              </Routes>
          </main>
      </div>
    </div>
  );
}
