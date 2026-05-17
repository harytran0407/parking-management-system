import { Routes, Route } from 'react-router-dom'
import { LogIn, LogOut, AlertCircle, Clipboard } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import StaffDashboard from '../pages/staff/Dashboard'

export default function StaffLayout() {
  const navigationItems = [
    { path: '/staff', label: 'Dashboard', icon: <Clipboard size={20} /> },
    { path: '/staff/checkin', label: 'Check-In', icon: <LogIn size={20} /> },
    { path: '/staff/checkout', label: 'Check-Out', icon: <LogOut size={20} /> },
    { path: '/staff/operations', label: 'Operations', icon: <AlertCircle size={20} /> },
  ]

  return (
    <div className="main-container">
      <Sidebar navigationItems={navigationItems} />
      <div className="content-wrapper">
        <Header title="Parking Staff" />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<StaffDashboard />} />
            <Route path="/*" element={<StaffDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
