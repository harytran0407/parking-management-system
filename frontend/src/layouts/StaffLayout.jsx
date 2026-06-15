import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from 'react';
import { History, LogIn, LogOut, AlertTriangle, Map, User } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Profile from '../pages/user/Profile';
import CheckInPage from "../pages/staff/CheckInPage";
import CheckOutPage from "../pages/staff/CheckOutPage";
import HistoryPage from "../pages/staff/HistoryPage";
import IncidentHandlingPage from '../pages/staff/IncidentHandling';
import SlotGateManagementPage from '../pages/staff/SlotGateManagement';

export default function StaffLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 1. ĐÃ BỎ DASHBOARD KHỎI MENU ĐIỀU HƯỚNG
  const navigationItems = [
    {
      path: "/staff/checkin",
      label: "Check-In",
      icon: <LogIn size={20} />,
    },
    {
      path: "/staff/checkout",
      label: "Check-Out",
      icon: <LogOut size={20} />,
    },
    {
      path: "/staff/history",
      label: "Parking History",
      icon: <History size={20} />,
    },
    {
      path: "/staff/incidents",
      label: "Incident Handling",
      icon: <AlertTriangle size={20} />,
    },
    {
      path: "/staff/slots",
      label: "Slot Management",
      icon: <Map size={20} />,
    },
  ];

  return (
    <div className="main-container flex h-screen bg-gray-100">
      <Sidebar
        navigationItems={navigationItems}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="content-wrapper flex-1 flex flex-col overflow-hidden">
        <Header
          title="Parking Operations"
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        <main className="page-content flex-1 flex flex-col min-h-0 bg-gray-50 p-6 overflow-hidden">
          <Routes>
            {/* 2. ĐỔI ROUTE MẶC ĐỊNH: Tự động chuyển hướng sang trang Check-In khi vào /staff */}
            <Route path="/" element={<Navigate to="/staff/checkin" replace />} />

            <Route path="/checkin" element={<CheckInPage />} />
            <Route path="/checkout" element={<CheckOutPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/incidents" element={<IncidentHandlingPage />} />
            <Route path="/slots" element={<SlotGateManagementPage />} />
            <Route path="profile" element={<Profile />} />

            {/* NẾU ĐƯỜNG DẪN SAI: Tự động redirect về Check-In luôn thay vì Dashboard */}
            <Route path="/*" element={<Navigate to="/staff/checkin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}