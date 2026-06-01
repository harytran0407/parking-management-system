import { Routes, Route } from 'react-router-dom'
import { Users, Lock, Settings, BarChart3 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import AdminDashboard from '../pages/admin/Dashboard'

export default function AdminLayout() {
  const navigationItems = [
    { path: '/admin', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { path: '/admin/users', label: 'Users', icon: <Users size={20} /> },
    { path: '/admin/permissions', label: 'Permissions', icon: <Lock size={20} /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
  ]

  return (
    <div className="main-container">
      <Sidebar navigationItems={navigationItems} />
      <div className="content-wrapper">
        <Header title="Administrator" />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
