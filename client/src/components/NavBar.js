import React from "react";
import { NavLink } from "react-router-dom";
import "../css/NavBar.css"; 

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        <h1>Pandemic Resilience System</h1>
      </div>
      <ul className="nav">
        <li>
          <NavLink
            to="/UserDashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            User
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/GovernmentDashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Governent
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/MerchantDashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Merchant
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/Login"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Login
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/Register"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Register
          </NavLink>
        </li>
        
      </ul>
    </nav>
  );
}

export default Navbar;
