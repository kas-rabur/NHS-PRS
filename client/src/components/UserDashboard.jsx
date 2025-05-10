import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { FaUser } from "react-icons/fa";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../css/UserDashboard.css";

export default function UserDashboard() {
  const [prsId, setPrsId] = useState("");
  const [name, setName] = useState("");
  const [supplies, setSupplies] = useState([]);
  const [nearestSuppliers, setNearestSuppliers] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [vaccRecords, setVaccRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("prsToken");
    if (!token) return;

    let decoded;
    try {
      decoded = jwtDecode(token);
      setPrsId(decoded.prs_id);
      setName(decoded.name);
    } catch (err) {
      console.error("Invalid token", err);
      setError("Authentication error");
      return;
    }

    // Static supplies placeholder
    setSupplies(["Face Masks", "Hand Sanitizer", "Thermometers"]);

    // Fetch nearest suppliers from backend with prsId in POST body
    (async () => {
      try {
        const res = await fetch("/api/findNearestSuppliers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ prsId: decoded.prs_id })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load suppliers");
        }

        // data is array of { storeId, address, distance }
        setNearestSuppliers(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    })();

    // Static purchase history placeholder
    setPurchaseHistory([
      { item: "Face Masks", date: "2025-04-01", qty: 2 },
      { item: "Thermometers", date: "2025-03-20", qty: 1 }
    ]);

    // Static vaccination records placeholder
    setVaccRecords([
      { date: "2025-01-15", vaccine: "COVID-19", dose: "2nd" }
    ]);
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <Topbar title="Public Dashboard" />
        {error && <p className="error-msg">{error}</p>}

        <section className="dashboard-grid">

          {/* PRS Identity Card */}
          <div className="dashboard-card id-card">
            <div className="id-photo">
              <FaUser size={48} color="#777" />
            </div>
            <div className="id-details">
              <h4>PRS Identity Card</h4>
              <p><strong>Name:</strong> {name}</p>
              <p><strong>PRS ID:</strong> {prsId}</p>
            </div>
          </div>

          {/* Locate Critical Supplies */}
          <div className="dashboard-card">
            <h3>Locate Critical Supplies</h3>
            <input
              type="text"
              className="search-input"
              placeholder="Search for supplies..."
            />
            <ul>
              {supplies.map((supply, idx) => (
                <li key={idx}>{supply}</li>
              ))}
            </ul>
            <button className="btn-primary">View on Map</button>
          </div>

          {/* Find Nearest Suppliers */}
          <div className="dashboard-card">
            <h3>Find Nearest Suppliers</h3>
            <ul>
              {nearestSuppliers.map((sup, idx) => (
                <li key={sup.storeId || idx}>
                  {sup.storeId}: {sup.address} — {sup.distance.toFixed(2)} km
                </li>
              ))}
            </ul>
            <button className="btn-primary">Show Locations</button>
          </div>

          {/* Purchase History */}
          <div className="dashboard-card">
            <h3>Purchase History</h3>
            <ul>
              {purchaseHistory.map((rec, idx) => (
                <li key={idx}>{rec.date} — {rec.item} (x{rec.qty})</li>
              ))}
            </ul>
            <button className="btn-secondary">View All</button>
          </div>

          {/* Vaccination Records */}
          <div className="dashboard-card dashboard-fullwidth">
            <h3>Vaccination Records</h3>
            <ul>
              {vaccRecords.map((rec, idx) => (
                <li key={idx}>{rec.date} — {rec.vaccine} ({rec.dose})</li>
              ))}
            </ul>
            <div className="card-actions">
              <button className="btn-secondary">Upload Record</button>
              <button className="btn-primary">View All</button>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
