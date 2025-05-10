import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/NavBar";
import UserDashboard from "./components/UserDashboard";
import GovernmentDashboard from "./components/GovernmentDashboard";
import MerchantDashboard from "./components/MerchantDashboard";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import LandingPage from "./components/LandingPage";
import "./css/App.css"; 

function App() {
  const location = useLocation();
  const excludedRoutes = ["/Login"]; 

  return (
    <div>
      {!excludedRoutes.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/UserDashboard" element={<UserDashboard />} />
        <Route path="/GovernmentDashboard" element={<GovernmentDashboard />} />
        <Route path="/MerchantDashboard" element={<MerchantDashboard />} />
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/Register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
