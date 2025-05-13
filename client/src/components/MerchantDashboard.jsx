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
  const [stockLevels, setStockLevels] = useState([]);
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
    fetch("http://localhost:5000/api/merchant/dashboard-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prsId: payload.prs_id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
        setStockLevels(
          data.stockLevels.map((it) => ({
            ...it,
            editedQuantity: it.quantity,
            saving: false,
            error: "",
          }))
        );
      })
      .catch(() => setError("Unable to load dashboard data."));
  }, []);

  const handleIncrement = (idx) => {
    setStockLevels((levels) =>
      levels.map((it, i) =>
        i === idx ? { ...it, editedQuantity: it.editedQuantity + 1 } : it
      )
    );
  };

  const handleDecrement = (idx) => {
    setStockLevels((levels) =>
      levels.map((it, i) =>
        i === idx && it.editedQuantity > 0
          ? { ...it, editedQuantity: it.editedQuantity - 1 }
          : it
      )
    );
  };

  const handleSave = (idx) => {
    const item = stockLevels[idx];
    setStockLevels((levels) =>
      levels.map((it, i) =>
        i === idx ? { ...it, saving: true, error: "" } : it
      )
    );
    const token = localStorage.getItem("prsToken");
    if (!token) return;
    let payload;
    try {
      payload = jwtDecode(token);
    } catch {
      return;
    }
    fetch("http://localhost:5000/api/merchant/update-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchantId: payload.merchantId,
      itemId:     item.item_id,
      newQuantity:item.editedQuantity,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        const now = new Date().toISOString();
        setStockLevels((levels) =>
          levels.map((it, i) =>
            i === idx
              ? {
                  ...it,
                  quantity: it.editedQuantity,
                  lastUpdated: now,
                  saving: false,
                }
              : it
          )
        );
      })
      .catch(() => {
        setStockLevels((levels) =>
          levels.map((it, i) =>
            i === idx
              ? { ...it, saving: false, error: "Save failed." }
              : it
          )
        );
      });
  };

  if (error) {
    alert(error);
  }

  const { sales, orders, products, purchaseRestrictions, vaccinationStats } =
    dashboardData;

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

        {/* Stock Management Panel */}
        <div className="dashboard-card dashboard-full">
          <h3>Current Stock Levels</h3>
          {stockLevels.length ? (
            <table className="supplies-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((item, idx) => (
                  <tr key={item.item_id}>
                    <td>{item.name}</td>
                    <td>
                      <div className="qty-controls">
                        <button
                          onClick={() => handleIncrement(idx)}
                          disabled={item.saving}
                          className="btn-qty"
                        >
                          +
                        </button>
                        <input
                          type="number"
                          value={item.editedQuantity}
                          readOnly
                          className="qty-input"
                        />
                        <button
                          onClick={() => handleDecrement(idx)}
                          disabled={item.saving || item.editedQuantity <= 0}
                          className="btn-qty"
                        >
                          –
                        </button>
                      </div>
                    </td>
                    <td>
                      {new Date(item.lastUpdated).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>
                      <button
                        onClick={() => handleSave(idx)}
                        className="btn-primary"
                        disabled={item.saving}
                      >
                        {item.saving ? "Saving..." : "Save"}
                      </button>
                      {item.error && (
                        <div className="error-msg">{item.error}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No inventory data available.</p>
          )}
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
