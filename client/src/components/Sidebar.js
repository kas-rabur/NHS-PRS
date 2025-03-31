import React from "react";
import "../css/Sidebar.css";
import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">
      {/* Logo Section */}
      <div className="logo-container">
        PRS
      </div>
      {/* Navigation Menu */}
      <ul>
        <li>
        <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Home
          </NavLink>
        </li>
        <li>
        <NavLink
            to="/Page2"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Login
          </NavLink>
        </li>
        <li>
        <NavLink
            to="/page3"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Register
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
