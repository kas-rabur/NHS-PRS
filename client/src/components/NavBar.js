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
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            About
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/Page2"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Merchant
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/page3"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Gorvernment
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
