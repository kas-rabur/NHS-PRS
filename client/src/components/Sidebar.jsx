import React from 'react';
import '../css/Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import LogoPRS from '../images/LogoNewPRS.png';
import DoorIcon from '../icons/DoorIcon.png';
import { FaHome, FaUser, FaTruck, FaFileMedical } from 'react-icons/fa';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('prsToken');
    navigate('/login', { replace: true });
    window.location.reload();
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={LogoPRS} alt="logo" />
      </div>
      <div className="logo-text"><h1>MENU</h1></div>
      <ul>
        <li>
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'active' : ''}>
            <FaHome /> Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/profile" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaUser /> Profile
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/suppliers" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaTruck /> Suppliers
          </NavLink>
        </li>
        <li>
          <NavLink to="/dashboard/records" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaFileMedical /> Records
          </NavLink>
        </li>
        <li className="logout-item">
          <button onClick={handleLogout} className="logout-button">
            <img src={DoorIcon} alt="Logout" /> Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
