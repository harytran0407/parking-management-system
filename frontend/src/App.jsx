import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
<<<<<<< HEAD
import { LanguageProvider } from "./context/LanguageContext";
=======
>>>>>>> origin/main
import ProtectedRoute from "./components/ProtectedRoute";
import { toast, Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
<<<<<<< HEAD
import Forbidden from "./pages/Forbidden";
=======
>>>>>>> origin/main

import ManagerLayout from "./layouts/ManagerLayout";
import StaffLayout from "./layouts/StaffLayout";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import GlobalHttpListener from "./components/GlobalHttpListener";

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: "#1e293b",
            border: "1px solid rgba(148,163,184,0.2)",
            color: "#f1f5f9",
          },
        }}
      />
      <GlobalHttpListener />
<<<<<<< HEAD
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            {/* ============================================================
                PUBLIC ROUTES (Tuyến đường công khai)
               ============================================================ */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forbidden" element={<Forbidden />} />

            {/* ============================================================
                PROTECTED ROUTES 
               ============================================================ */}
            <Route
              path="/manager/*"
              element={
                <ProtectedRoute allowedRoles={["ParkingManager"]}>
                  <ManagerLayout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff/*"
              element={
                <ProtectedRoute allowedRoles={["ParkingStaff"]}>
                  <StaffLayout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/*"
              element={
                <ProtectedRoute allowedRoles={["ParkingUser"]}>
                  <UserLayout />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["SystemAdmin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
=======
      <AuthProvider>
        <Routes>
          {/* ============================================================
              PUBLIC ROUTES (Tuyến đường công khai)
             ============================================================ */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ============================================================
              PROTECTED ROUTES 
             ============================================================ */}
          <Route
            path="/manager/*"
            element={
              <ProtectedRoute allowedRoles={["ParkingManager"]}>
                <ManagerLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={["ParkingStaff"]}>
                <StaffLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/*"
            element={
              <ProtectedRoute allowedRoles={["ParkingUser"]}>
                <UserLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["SystemAdmin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
>>>>>>> origin/main
    </Router>
  );
}

export default App;
