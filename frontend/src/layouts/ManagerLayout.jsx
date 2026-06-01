import { Routes, Route } from 'react-router-dom'
import { ClipboardList, Building2, DollarSign, BarChart3, AlertCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ManagerDashboard from '../pages/manager/Dashboard'

export default function ManagerLayout() {
  const navigationItems = [
    { path: '/manager', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { path: '/manager/slots', label: 'Parking Slots', icon: <ClipboardList size={20} /> },
    { path: '/manager/building', label: 'Building Info', icon: <Building2 size={20} /> },
    { path: '/manager/pricing', label: 'Pricing', icon: <DollarSign size={20} /> },
    { path: '/manager/issues', label: 'Issues', icon: <AlertCircle size={20} />, badge: '3' },
  ]

  return (
    <div className="main-container">
      <Sidebar navigationItems={navigationItems} />
      <div className="content-wrapper">
        <Header title="Facility Manager" />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/*" element={<ManagerDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
