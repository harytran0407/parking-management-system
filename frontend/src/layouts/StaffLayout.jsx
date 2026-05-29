import { Routes, Route } from "react-router-dom";
import {useState} from 'react';
import {LayoutDashboard,LogIn,LogOut,AlertTriangle,Map,} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StaffDashboard from "../pages/staff/Dashboard";
import Profile from '../pages/user/Profile'; 
// Import corresponding pages 
import CheckInPage from "../pages/staff/CheckInPage";
import CheckOutPage from "../pages/staff/CheckOutPage";
import IncidentHandlingPage from '../pages/staff/IncidentHandling';
import SlotGateManagementPage from '../pages/staff/SlotGateManagement';

export default function StaffLayout() {
  // Navigation mapping based on ParkingStaff capabilities defined in USER_STORIES.md
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigationItems = [
    {
      path: "/staff",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
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
      path: "/staff/incidents",
      label: "Incident Handling",
      icon: <AlertTriangle size={20} />,
    },
    {
      path: "/staff/slots",
      label: "Slot & Gate Management",
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
        {/* Header title tailored for Parking Staff role */}
        <Header
          title="Parking Operations"
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        <main className="page-content flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<StaffDashboard />} />

            {/* Future route configurations mapped to API & User Stories */}
            <Route path="/checkin" element={<CheckInPage />} />
            <Route path="/checkout" element={<CheckOutPage />} />
            <Route path="/incidents" element={<IncidentHandlingPage />} />
            <Route path="/slots" element={<SlotGateManagementPage />} />
            <Route path="profile" element={<Profile />} />
            {/* Fallback route */}
            <Route path="/*" element={<StaffDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
