import { Routes, Route } from 'react-router-dom'
import { Home, Calendar, CreditCard, MessageSquare } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import UserDashboard from '../pages/user/Dashboard'

export default function UserLayout() {
  const navigationItems = [
    { path: '/user', label: 'My Parking', icon: <Home size={20} /> },
    { path: '/user/book', label: 'Book a Spot', icon: <Calendar size={20} /> },
    { path: '/user/payment', label: 'Payment', icon: <CreditCard size={20} /> },
    { path: '/user/feedback', label: 'Feedback', icon: <MessageSquare size={20} /> },
  ]

  return (
    <div className="main-container">
      <Sidebar navigationItems={navigationItems} />
      <div className="content-wrapper">
        <Header title="Driver" />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/*" element={<UserDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
