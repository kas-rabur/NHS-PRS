import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import '../css/UserDashboard.css';

export default function SuppliersPage() {
    const suppliesList = ['Face Masks', 'Hand Sanitizer', 'Thermometers'];
    const [nearest, setNearest] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('prsToken'); if (!token) return;
        let id;
        try { id = jwtDecode(token).prs_id; } catch { return; }
        fetch('/api/findNearestSuppliers', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ prsId: id })
        })
            .then(r => r.json().then(data => {
                if (!r.ok) throw new Error(data.error);
                setNearest(data);
            }))
            .catch(err => setError(err.message));
    }, []);

    const openMaps = addr => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');

    return (
        <div>
            {error && <p className="error-msg">{error}</p>}
            <div className="dashboard-card">
                <h3>Locate Critical Supplies</h3>
                <ul>{suppliesList.map((s, i) => <li key={i}>{s}</li>)}</ul>
                <button className="btn-primary" onClick={() => openMaps('Your+Location')}>View on Map</button>
            </div>

            <div className="dashboard-card">
                <h3>Nearest Suppliers</h3><ul>{nearest.map((s, i) => (
                    <li key={i}>
                        {s.address} — {s.distance.toFixed(2)} km
                        <button className="btn-primary" onClick={() => openMaps(s.address)}>Map</button>
                    </li>
                ))}</ul>
            </div>
        </div>
    );
}