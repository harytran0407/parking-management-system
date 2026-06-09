import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { Users, Terminal, Settings, BarChart3 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminUsers from '../pages/admin/Users'
import AdminLogs from '../pages/admin/Logs'
import AdminSettings from '../pages/admin/Settings'
import Profile from '../pages/user/Profile'

export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigationItems = [
    { path: '/admin', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { path: '/admin/users', label: 'Users', icon: <Users size={20} /> },
    { path: '/admin/logs', label: 'System Logs', icon: <Terminal size={20} /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
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
          title="Administrator"
          isSidebarCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        <main className="page-content flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 p-6 overflow-auto transition-colors duration-300">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/logs" element={<AdminLogs />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
