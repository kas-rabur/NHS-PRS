import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../css/GovernmentDashboard.css";

export default function GovernmentDashboard() {
  const [purchaseLimits, setPurchaseLimits] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [stock, setStock] = useState([]);

  useEffect(() => {
    // Fetch all purchase limits (per-day only)
    fetch("/api/gov/purchase-limits")
      .then((res) => res.json())
      .then((data) => setPurchaseLimits(data.items || data))
      .catch(console.error);

    // Fetch schedules for all digit groups
    fetch("/api/gov/schedules")
      .then((res) => res.json())
      .then((data) => setSchedules(data.schedules || []))
      .catch(console.error);

    // Fetch merchant registry
    fetch("/api/gov/merchants")
      .then((res) => res.json())
      .then((data) => setMerchants(data.merchants || []))
      .catch(console.error);

    // Fetch compliance status
    fetch("/api/gov/compliance")
      .then((res) => res.json())
      .then((data) => setCompliance(data.statuses || []))
      .catch(console.error);

    // Fetch stock dashboard
    fetch("/api/gov/stock")
      .then((res) => res.json())
      .then((data) => setStock(data.stock || []))
      .catch(console.error);
  }, []);

  return (
    <section className="home">
  
      <div className="main-content">
        <Topbar title="Government Dashboard" className="topbar-home" />
        <div className="cards-grid">
          {/* Supply Chain Regulation */}
          <div className="custom-card">
            <h2 className="card-title">Supply Chain Regulation</h2>

            <h3 className="section-heading">Purchase Limits (Daily)</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Daily Limit</th>
                </tr>
              </thead>
              <tbody>
                {purchaseLimits.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.item}</td>
                    <td>{item.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="section-heading">Digit Group Schedules</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Digit Group (based on last digit of NationalID)</th>
                  <th>Allowed Day</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s, idx) => (
                  <tr key={idx}>
                    <td>{s.digitgroup}</td>
                    <td>{s.allowedDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Merchant Management */}
          <div className="custom-card">
            <h2 className="card-title">Merchant Management</h2>
            <h3 className="section-heading">Registry View</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>License #</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m, i) => (
                  <tr key={i}>
                    <td>{m.businessLicense}</td>
                    <td>{m.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="section-heading">Compliance Status</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {compliance.map((c, i) => (
                  <tr key={i}>
                    <td>{c.location}</td>
                    <td>{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="section-heading">Stock Dashboard</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Item</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s, i) => (
                  <tr key={i}>
                    <td>{s.storeId}</td>
                    <td>{s.item_name}</td>
                    <td>{s.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}