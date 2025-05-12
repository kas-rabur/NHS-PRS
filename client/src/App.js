import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/NavBar";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import RoleProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./components/AuthContext";
import "./css/App.css";

// Dashboard imports
import DashboardLayout from "./components/DashboardLayout";
import CustomerDashboard from "./components/UserDashboard";
import ProfilePage from "./components/ProfilePage";
import SuppliersPage from "./components/SuppliersPage";
import RecordsPage from "./components/RecordsPage";
import GovernmentDashboard from "./components/GovernmentDashboard";
import MerchantDashboard from "./components/MerchantDashboard";

function App() {
  const location = useLocation();
  const excludedRoutes = ["/login", "/register"];

  return (
    <div>
      {!excludedRoutes.includes(location.pathname.toLowerCase()) && <Navbar />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public user dashboard routes */}
        <Route element={<RoleProtectedRoute allowedRoles={["public_user"]} />}>
          <Route path="/userdashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<CustomerDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* Government Dashboard */}
        <Route element={<RoleProtectedRoute allowedRoles={["government_user"]} />}>
          <Route
            path="/governmentdashboard"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <GovernmentDashboard />
              </Suspense>
            }
          />
        </Route>

        {/* Merchant Dashboard */}
        <Route element={<RoleProtectedRoute allowedRoles={["merchant_user"]} />}>
          <Route
            path="/merchantdashboard"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <MerchantDashboard />
              </Suspense>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  );
}
