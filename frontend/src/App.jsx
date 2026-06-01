import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ManagerLayout from './layouts/ManagerLayout'
import StaffLayout from './layouts/StaffLayout'
import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'
import ManagerDashboard from './pages/manager/Dashboard'
import StaffDashboard from './pages/staff/Dashboard'
import UserDashboard from './pages/user/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import ForgotPassword from './pages/ForgotPassword'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />}/>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          // login base on role
          <Route path="/manager/*" element={<ProtectedRoute role="manager"><ManagerLayout /></ProtectedRoute>} />
          <Route path="/staff/*" element={<ProtectedRoute role="staff"><StaffLayout /></ProtectedRoute>} />
          <Route path="/user/*" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>} />
          //default Landing page 
          <Route path="/" element={<LandingPage />} />

        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
