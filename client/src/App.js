import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/NavBar";
import UserDashboard from "./components/UserDashboard";
import GovernmentDashboard from "./components/GovernmentDashboard";
import MerchantDashboard from "./components/MerchantDashboard";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import LandingPage from "./components/LandingPage";
import RoleProtectedRoute from "./components/ProtectedRoute"; 
import { AuthProvider } from "./components/AuthContext";
import "./css/App.css";

function App() {
  const location = useLocation();
  const excludedRoutes = []; // only hide navbar on certain pages

  return (
    <div>
      {!excludedRoutes.includes(location.pathname.toLowerCase()) && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public User Dashboard */}
        <Route element={<RoleProtectedRoute allowedRoles={["public_user"]} />}>
          <Route path="/userdashboard" element={<UserDashboard />} />
        </Route>

        {/* Government Dashboard */}
        <Route element={<RoleProtectedRoute allowedRoles={["government_user"]} />}>
          <Route path="/governmentdashboard" element={<GovernmentDashboard />} />
        </Route>

        {/* Merchant Dashboard */}
        <Route element={<RoleProtectedRoute allowedRoles={["merchant_user"]} />}>
          <Route path="/merchantdashboard" element={<MerchantDashboard />} />
        </Route>

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
