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

export default function ManagerLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigationItems = [
    { path: '/manager', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { path: '/manager/slots', label: 'Parking Slots', icon: <ClipboardList size={20} /> },
    { path: '/manager/building', label: 'Building Info', icon: <Building2 size={20} /> },
    { path: '/manager/pricing', label: 'Pricing', icon: <DollarSign size={20} /> },
    { path: '/manager/staff', label: 'Staff Management', icon: <Users size={20} /> },
    { path: '/manager/issues', label: 'Issues', icon: <AlertCircle size={20} />, badge: '3' },
  ]

  return (
    <div className="main-container flex h-screen bg-gray-100">
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
        <main className="page-content flex-1 flex flex-col min-h-0 bg-gray-50 p-6 overflow-hidden">
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
