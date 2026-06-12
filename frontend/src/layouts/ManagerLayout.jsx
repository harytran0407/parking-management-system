import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { ClipboardList, Building2, DollarSign, BarChart3, AlertCircle, Users } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ManagerDashboard from '../pages/manager/Dashboard'
import ManagerStaff from '../pages/manager/Staff'
import ManagerSlots from '../pages/manager/Slots'
import ManagerBuilding from '../pages/manager/Building'
import ManagerPricing from '../pages/manager/Pricing'
import ManagerIssues from '../pages/manager/Issues'
import Profile from '../pages/user/Profile'
import { useLanguage } from '../hooks/useLanguage'

export default function ManagerLayout() {
  const { language } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigationItems = [
    { path: '/manager', label: language === 'en' ? 'Dashboard' : 'Bảng điều khiển', icon: <BarChart3 size={20} /> },
    { path: '/manager/slots', label: language === 'en' ? 'Parking Slots' : 'Vị trí đỗ', icon: <ClipboardList size={20} /> },
    { path: '/manager/building', label: language === 'en' ? 'Building Info' : 'Thông tin Tòa nhà', icon: <Building2 size={20} /> },
    { path: '/manager/pricing', label: language === 'en' ? 'Pricing' : 'Cấu hình giá', icon: <DollarSign size={20} /> },
    { path: '/manager/staff', label: language === 'en' ? 'Staff Management' : 'Quản lý nhân viên', icon: <Users size={20} /> },
    { path: '/manager/issues', label: language === 'en' ? 'Issues' : 'Sự cố phản hồi', icon: <AlertCircle size={20} />, badge: '3' },
  ]

  return (
    <div className="main-container flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar 
        navigationItems={navigationItems} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <div className="content-wrapper flex-1 flex flex-col overflow-hidden">
        <Header 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
        <main className="page-content flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 p-4 md:p-6 overflow-y-auto transition-colors duration-300">
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/slots" element={<ManagerSlots />} />
            <Route path="/building" element={<ManagerBuilding />} />
            <Route path="/pricing" element={<ManagerPricing />} />
            <Route path="/staff" element={<ManagerStaff />} />
            <Route path="/issues" element={<ManagerIssues />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/*" element={<ManagerDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
