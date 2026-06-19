import { Routes, Route } from "react-router-dom";
import React, { useState } from "react";
<<<<<<< HEAD
import { Car, Home, History, CreditCard, Calendar, MessageSquare, User, CarFront, Search } from "lucide-react";
=======
import {Car,Home,History,CreditCard,Calendar,MessageSquare,User,CarFront,} from "lucide-react";
>>>>>>> origin/main
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import UserDashboard from "../pages/user/Dashboard";
import BookSlot from "../pages/user/BookSlot";
import Profile from "../pages/user/Profile";
import MyBookings from "../pages/user/MyBookings";
<<<<<<< HEAD
import QuickPay from "../pages/user/QuickPay";
import Issues from "../pages/user/Issues";
import { useLanguage } from "../hooks/useLanguage";

export default function UserLayout() {
  const { language } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigationItems = [
    { path: "/user", label: language === "en" ? "Parking Info" : "Thông tin đỗ xe", icon: <Car size={20} /> },
    { path: "/user/book", label: language === "en" ? "Book a Slot" : "Đặt vị trí đỗ", icon: <Calendar size={20} /> },
    {
      path: "/user/bookings",
      label: language === "en" ? "My Bookings" : "Lịch sử đặt chỗ",
      icon: <History size={20} />,
    },
    {
      path: "/user/quick-pay",
      label: language === "en" ? "Quick Pay" : "Thanh toán nhanh",
      icon: <CreditCard size={20} />,
    },
    {
      path: "/user/issues",
      label: language === "en" ? "Issues" : "Báo cáo sự cố",
=======
import MyVehicles from "../pages/user/MyVehicles";
import Issues from "../pages/user/Issues";

export default function UserLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigationItems = [
    { path: "/user", label: "Parking Info", icon: <Car size={20} /> },
    { path: "/user/book", label: "Book a Slot", icon: <Calendar size={20} /> },
    {
      path: "/user/bookings",
      label: "My Bookings",
      icon: <History size={20} />,
    },
    {
      path: "/user/vehicle",
      label: "My Vehicles",
      icon: <CarFront size={20} />,
    },
    {
      path: "/user/issues",
      label: "Issues",
>>>>>>> origin/main
      icon: <MessageSquare size={20} />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar
        navigationItems={navigationItems}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="relative flex flex-col flex-1 overflow-hidden transition-all duration-300">
        <Header
<<<<<<< HEAD
=======
          title="Driver Dashboard"
>>>>>>> origin/main
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth transition-all duration-300 ease-in-out">
          <Routes>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/book" element={<BookSlot />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bookings" element={<MyBookings />} />
<<<<<<< HEAD
            <Route path="/quick-pay" element={<QuickPay />} />
            <Route path="/issues" element={<Issues />} />


=======
            <Route path="/vehicle" element={<MyVehicles />} />
            <Route path="/issues" element={<Issues />} />

>>>>>>> origin/main
            {/* Đưa route catch-all /* xuống dưới cùng để chuẩn logic React Router */}
            <Route path="/*" element={<UserDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
