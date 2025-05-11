import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Outlet, useLocation } from 'react-router-dom';

export default function DashboardLayout() {
  const location = useLocation();
  const titleMap = {
    '/dashboard': 'Home',
    '/dashboard/profile': 'Profile',
    '/dashboard/suppliers': 'Suppliers',
    '/dashboard/records': 'Records',
  };
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <Topbar title={titleMap[location.pathname] || 'Dashboard'} />
        <Outlet />
      </main>
    </div>
  );
}