import React, { useState, useEffect } from "react";
import {jwtDecode} from "jwt-decode";
import { FaUser, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../css/UserDashboard.css";

export default function UserDashboard() {
  const [prsId, setPrsId] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [supplies, setSupplies] = useState([]);
  const [nearestSuppliers, setNearestSuppliers] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyForm, setFamilyForm] = useState({ nationalId: "", name: "", dob: "", address: "", userType: "individual" });
  const [familyMessage, setFamilyMessage] = useState("");
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
      setDob(decoded.DOB);
    } catch (err) {
      console.error("Invalid token", err);
      setError("Authentication error");
      return;
    }

    setSupplies(["Face Masks", "Hand Sanitizer", "Thermometers"]);

    // Fetch nearest suppliers
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
        if (!res.ok) throw new Error(data.error || "Failed to load suppliers");
        setNearestSuppliers(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    })();

    // Fetch family members
    (async () => {
      try {
        const res = await fetch("/api/getFamilyMembers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ prsId: decoded.prs_id })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load family members");
        const members = data.members.filter(m => m.prsId !== decoded.prs_id);
        setFamilyMembers(members);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    })();

    // Fetch vaccination records
    (async () => {
      try {
        const res = await fetch("/api/getUserVaccRecord", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ prsId: decoded.prs_id })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load vaccination records");
        setVaccRecords(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    })();
  }, []);

  const openInMaps = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const handleFamilyChange = (e) => {
    const { name, value } = e.target;
    setFamilyForm(prev => ({ ...prev, [name]: value }));
  };

  const submitFamilyMember = async () => {
    setFamilyMessage("");
    const token = localStorage.getItem("prsToken");
    const payload = { prsId, ...familyForm };
    try {
      const res = await fetch("/api/addFamilyMember", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setFamilyMessage(`Family member added: ${data.prsId}`);
        setFamilyForm({ nationalId: "", name: "", dob: "", address: "", userType: "individual" });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      setFamilyMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <Topbar title="Public Dashboard" />
        {error && <p className="error-msg">{error}</p>}

        <section className="dashboard-grid">
          <div className="dashboard-card id-card">
            <div className="id-photo">
              <FaUser size={48} color="#777" />
            </div>
            <div className="id-details">
              <h4>PRS Identity Card</h4>
              <p><strong>Name:</strong> {name}</p>
              <p><strong>PRS ID:</strong> {prsId}</p>
              <p><strong>Date of Birth:</strong> {dob}</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Family</h3>
            {familyMembers.length === 0 ? (
              <p>No family members.</p>
            ) : (
              <ul>
                {familyMembers.map((member, idx) => (
                  <li key={idx}>
                    {member.name} — {member.prsId} — {formatDate(member.dob)}
                  </li>
                ))}
              </ul>
            )}
          </div>

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
            <button
              className="btn-primary"
              onClick={() => openInMaps("Your+Location")}
            >
              View on Map
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Find Nearest Suppliers</h3>
            <ul className="supplier-list">
              {nearestSuppliers.map((sup, idx) => (
                <li key={idx} className="supplier-item">
                  {sup.address} — <strong>{sup.distance.toFixed(2)} km</strong>
                  <button
                    className="btn-primary"
                    onClick={() => openInMaps(sup.address)}
                  >
                    View on Map
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="dashboard-card">
            <h3>Add Family Member</h3>
            <input
              name="nationalId"
              value={familyForm.nationalId}
              onChange={handleFamilyChange}
              placeholder="National ID"
            />
            <input
              name="name"
              value={familyForm.name}
              onChange={handleFamilyChange}
              placeholder="Name"
            />
            <input
              name="dob"
              type="date"
              value={familyForm.dob}
              onChange={handleFamilyChange}
            />
            <input
              name="address"
              value={familyForm.address}
              onChange={handleFamilyChange}
              placeholder="Address"
            />
            <select
              name="userType"
              value={familyForm.userType}
              onChange={handleFamilyChange}
            >
              <option value="individual">Individual</option>
              <option value="child">Child</option>
            </select>
            <button className="btn-primary" onClick={submitFamilyMember}>
              Add Member
            </button>
            {familyMessage && <p className="info-msg">{familyMessage}</p>}'
          </div>

          <div className="dashboard-card dashboard-fullwidth">
            <h3>Vaccination Records</h3>
            {vaccRecords.length === 0 ? (
              <p>No records found.</p>
            ) : (
              <ul className="vacc-records-inline">
                {vaccRecords.map((rec, idx) => (
                  <li key={idx} className="vacc-record-item">
                    <span className="record-prs">{rec.prsId}</span> —
                    <span className="record-date"> {formatDate(rec.date)}</span> —
                    <span className="record-vaccine"> {rec.vaccineName}</span> —
                    <span className="record-dose"> Dose {rec.dose}</span> —
                    <span className="record-verified">
                      {rec.verified ? <FaCheckCircle /> : <FaTimesCircle />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
