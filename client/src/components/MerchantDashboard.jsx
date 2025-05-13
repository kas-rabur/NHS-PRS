// src/components/MerchantDashboard.js

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {jwtDecode} from "jwt-decode";
import "../css/MerchantDashboard.css";

export default function MerchantDashboard() {
  const [dashboardData, setDashboardData] = useState({
    sales: 0,
    orders: 0,
    products: 0,
    stockLevels: [],
    purchaseRestrictions: [],
    vaccinationStats: { totalRecords: 0, verified: 0, pending: 0 },
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("prsToken");
    if (!token) return;

    let payload;
    try {
      payload = jwtDecode(token);
    } catch {
      return;
    }
    const prsId = payload.prs_id;

    fetch("http://localhost:5000/api/merchant/dashboard-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prsId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setDashboardData(data))
      .catch(() => setError("Unable to load dashboard data."));
  }, []);

  if (error) {
    return <div className="error-msg">{error}</div>;
  }

  const {
    sales,
    orders,
    products,
    stockLevels,
    purchaseRestrictions,
    vaccinationStats,
  } = dashboardData;

  const summaryCards = [
    { key: "sales", title: "Total Sales", content: sales },
    { key: "orders", title: "Total Orders", content: orders },
    { key: "products", title: "Active Products", content: products },
  ];

  return (
    <section className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar title="Merchant Dashboard" />

        <div className="dashboard-grid">
          {summaryCards.map(({ key, title, content }) => (
            <div key={key} className="dashboard-card">
              <h3>{title}</h3>
              <p>{content}</p>
            </div>
          ))}
        </div>

        {/* Purchase Restrictions Card */}
        <div className="dashboard-card dashboard-full">
          <h3>Purchase Restrictions</h3>
          {purchaseRestrictions.length ? (
            <ul className="restriction-list">
              {purchaseRestrictions.map((r) => (
                <li key={r.item}>
                  {r.item}: max {r.limit}
                  {r.window === "day" ? " per day" : " per week"} (
                  {r.schedule})
                </li>
              ))}
            </ul>
          ) : (
            <p>No purchase restrictions set.</p>
          )}
        </div>

        {/* Stock Levels Card */}
        <div className="dashboard-card dashboard-full">
          <h3>Current Stock Levels</h3>
          {stockLevels.length ? (
            <table className="supplies-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>In Stock</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {new Date(item.updated).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No inventory data available.</p>
          )}
        </div>

        {/* Vaccination Stats Card */}
        <div className="dashboard-card dashboard-full">
          <h3>Vaccination Summary</h3>
          <div className="vax-stats">
            <p>Uploaded Records: {vaccinationStats.totalRecords}</p>
            <p>Verified: {vaccinationStats.verified}</p>
            <p>Pending Verification: {vaccinationStats.pending}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
