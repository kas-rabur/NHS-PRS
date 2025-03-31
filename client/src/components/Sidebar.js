import React from "react";
import "../css/Sidebar.css";
import { NavLink } from "react-router-dom";
import LoginLogo from "../icons/LoginLogo.png";
import RegisterLogo from "../icons/LockLogo.png";
import LogoPRS from "../images/LogoNewPRS.png";



function Sidebar() {
  return (
    <div className="sidebar">
      {/* Logo Section */}
      <div className="logo-container">
      <img src={LogoPRS} alt="logo"></img>
      </div>
      <div className="logo-text"><h1>MENU</h1></div>
      {/* Navigation Menu */}
      <ul>

        <li>
        <NavLink
            to="/Page2"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <img src={RegisterLogo} alt="login"></img> Log-in
          </NavLink>
        </li>
        <li>
        <NavLink
            to="/page3"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <img src={LoginLogo} alt="reg"></img>Register
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
