import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { jwtDecode } from "jwt-decode";
import "../css/MerchantDashboard.css";
import {
  FaUser,
  FaIdBadge,
  FaFingerprint,
  FaCertificate,
  FaRegCalendarCheck,
  FaChartLine,
  FaShoppingCart,
  FaBoxOpen,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

export default function MerchantDashboard() {
  const [dashboardData, setDashboardData] = useState({
    sales: 0,
    orders: 0,
    products: 0,
    stockLevels: [],
    purchaseRestrictions: [],
    vaccinationStats: { totalRecords: 0, verified: 0, pending: 0 },
    business_info: {
      merchantId: "",
      businessLicense: "",
      name: "",
      registrationInfo: "",
    },
  });
  const [allVaxRecords, setAllVaxRecords] = useState([]);
  const [prsId, setPrsId] = useState("");
  const [stockLevels, setStockLevels] = useState([]);
  const [showStock, setShowStock] = useState(false);
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
    setPrsId(payload.prs_id);

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

    fetch("http://localhost:5000/api/merchant/getAllVaccinationRecords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((payload) => {
        if (payload.success) {
          setAllVaxRecords(
            payload.data.records.map((r) => ({ ...r, updating: false }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleIncrement = (idx) =>
    setStockLevels((levels) =>
      levels.map((it, i) =>
        i === idx ? { ...it, editedQuantity: it.editedQuantity + 1 } : it
      )
    );

  const handleDecrement = (idx) =>
    setStockLevels((levels) =>
      levels.map((it, i) =>
        i === idx && it.editedQuantity > 0
          ? { ...it, editedQuantity: it.editedQuantity - 1 }
          : it
      )
    );

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
        itemId: item.item_id,
        newQuantity: item.editedQuantity,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
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
        alert("Stock updated successfully");
      })
      .catch(() => {
        setStockLevels((levels) =>
          levels.map((it, i) => (i === idx ? { ...it, saving: false } : it))
        );
        alert("Failed to save stock update.");
      });
  };

  const toggleVerify = (recordId, currentStatus) => {
    setAllVaxRecords((recs) =>
      recs.map((r) =>
        r.recordId === recordId ? { ...r, updating: true } : r
      )
    );
    const newStatus = currentStatus ? 0 : 1;
    console.log("Record ID:", recordId);
    console.log("New status:", newStatus);
    console.log("PRS ID:", prsId);
    fetch("http://localhost:5000/api/merchant/updateVerifyRecord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prsId,
        recordID: recordId,
        verified_status: newStatus.toString(),
      }),
    })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok || !body.success) {
          throw new Error(body.error || "Unknown error");
        }
        setAllVaxRecords((recs) =>
          recs.map((r) =>
            r.recordId === recordId
              ? { ...r, verified: !!newStatus, updating: false }
              : r
          )
        );
        alert(body.message);
      })
      .catch((err) => {
        setAllVaxRecords((recs) =>
          recs.map((r) =>
            r.recordId === recordId ? { ...r, updating: false } : r
          )
        );
        alert("Failed to update record: " + err.message);
      });
  };

  if (error) {
    alert(error);
  }

  const {
    sales,
    orders,
    products,
    purchaseRestrictions,
    vaccinationStats,
    business_info,
  } = dashboardData;

  const summaryCards = [
    { key: "sales", title: "Total Sales", content: sales, icon: <FaChartLine /> },
    { key: "orders", title: "Total Orders", content: orders, icon: <FaShoppingCart /> },
    { key: "products", title: "Active Products", content: products, icon: <FaBoxOpen /> },
  ];

  return (
    <section className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar title="Merchant Dashboard" />

        <div className="dashboard-card id-card">
          <FaUser size={48} />
          <h4>Merchant Information</h4>
          <div className="info-row">
            <p><FaUser /> <strong>Name:</strong> {business_info.name}</p>
            <p><FaIdBadge /> <strong>Merchant ID:</strong> {business_info.merchantId}</p>
          </div>
          <div className="info-row">
            <p><FaCertificate /> <strong>Business License:</strong> {business_info.businessLicense}</p>
            <p><FaRegCalendarCheck /> <strong>Registration Info:</strong> {business_info.registrationInfo}</p>
          </div>
          <div className="info-row single">
            <p><FaFingerprint /> <strong>PRS ID:</strong> {prsId}</p>
          </div>
        </div>

        <div className="summary-cards">
          {summaryCards.map(({ key, title, content, icon }) => (
            <div key={key} className="summary-card">
              <div className="icon">{icon}</div>
              <div className="details">
                <h5>{title}</h5>
                <p>{content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-card dashboard-full">
          <h3
            className="collapsible-header"
            onClick={() => setShowStock((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            {showStock ? "▼" : "▲"} Current Stock Levels
          </h3>
          {showStock && (
            <>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No inventory data available.</p>
              )}
            </>
          )}
        </div>

        <div className="dashboard-card dashboard-full">
          <h3>Purchase Restrictions</h3>
          {purchaseRestrictions.length ? (
            <ul className="restriction-list">
              {purchaseRestrictions.map((r) => (
                <li key={r.item}>
                  {r.item}: max {r.limit}
                  {r.window === "day" ? " per day" : " per week"} ({r.schedule})
                </li>
              ))}
            </ul>
          ) : (
            <p>No purchase restrictions set.</p>
          )}
        </div>

        <div className="dashboard-card dashboard-full">
          <h3>Vaccination Summary</h3>
          <div className="vax-stats">
            <p>Uploaded: {vaccinationStats.totalRecords}</p>
            <p>Verified: {vaccinationStats.verified}</p>
            <p>Pending: {vaccinationStats.pending}</p>
          </div>
        </div>

        <div className="dashboard-card dashboard-full">
          <h3>All Vaccination Records</h3>
          {allVaxRecords.length ? (
            <table className="supplies-table">
              <thead>
                <tr>
                  <th>PRS ID</th>
                  <th>Record ID</th>
                  <th>Vaccine</th>
                  <th>Dose</th>
                  <th>Date</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allVaxRecords.map((rec) => (
                  <tr key={rec.recordId}>
                    <td>{rec.id}</td>
                    <td>{rec.recordId}</td>
                    <td>{rec.vaccineName}</td>
                    <td>{rec.dose}</td>
                    <td>{new Date(rec.vaccinationDate).toLocaleDateString()}</td>
                    <td style={{ textAlign: "center" }}>
                      {rec.verified ? <FaCheckCircle color="green" /> : <FaTimesCircle color="red" />}
                    </td>
                    <td>
                      <button
                        className="btn-primary"
                        onClick={() => toggleVerify(rec.recordId, rec.verified)}
                        disabled={rec.updating}
                      >
                        {rec.updating ? "Updating..." : rec.verified ? "Un-Verify" : "Verify"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No vaccination records found.</p>
          )}
        </div>
      </div>
    </section>
  );
}
