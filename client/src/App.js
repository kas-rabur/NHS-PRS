import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/NavBar";
import UserDashboard from "./components/UserDashboard";
import GovernmentDashboard from "./components/GovernmentDashboard";
import MerchantDashboard from "./components/MerchantDashboard";
import "./css/App.css"; 

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/UserDashboard" element={<UserDashboard />} />
        <Route path="/GovernmentDashboard" element={<GovernmentDashboard />} />
        <Route path="/MerchantDashboard" element={<MerchantDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
