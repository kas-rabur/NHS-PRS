import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import '../css/UserDashboard.css';

export default function SuppliersPage() {
    const suppliesList = ['Face Masks', 'Hand Sanitizer', 'Thermometers'];
    const [nearest, setNearest] = useState([]);
    const [error, setError] = useState('');
    const [allowedDay, setAllowedDay] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('prsToken');
        if (!token) return;

        let payload;
        try {
            payload = jwtDecode(token);
        } catch {
            return;
        }

        // fetch allowed day
        fetch('/api/get_allowed_day', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ prsId: payload.prs_id }),
        })
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => {
                        throw new Error(text || 'Failed to fetch allowed day');
                    });
                }
                return res.json();
            })
            .then(data => {
                setAllowedDay(data.allowedDay || data.Allowed_Day);
            })
            .catch(err => setError(err.message));

        // fetch nearest suppliers
        fetch('/api/findNearestSuppliers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ prsId: payload.prs_id }),
        })
            .then(r => r.json().then(data => {
                if (!r.ok) throw new Error(data.error || 'Failed to fetch suppliers');
                setNearest(data);
            }))
            .catch(err => setError(err.message));

    }, []);

    const openMaps = addr =>
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
            '_blank'
        );

    const nativeDay = new Date().getDay();
    const todayIndex = nativeDay === 0 ? 6 : nativeDay - 1;
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const fullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const allowedIndex = fullNames.indexOf(allowedDay);


    const getTooltip = (i) => {
        const isToday = i === todayIndex;
        const isAllowed = i === allowedIndex;
        if (isToday && isAllowed) return 'Today & Available Order Day';
        if (isToday) return 'Today';
        if (isAllowed) return 'Available Order Day';
        return '';
    };

    return (
        <div>
            {error && <p className="error-msg">{error}</p>}

            <div className="dashboard-card calendar-card">
                <h3>Weekly Calendar</h3>
                <div className="calendar-grid">
                    {weekDays.map((d, i) => {
                        const tooltip = getTooltip(i);
                        return (
                            <div key={d} className="calendar-cell">
                                <div
                                    className={`calendar-day${i === todayIndex ? ' today' : ''}${i === allowedIndex ? ' allowed' : ''}`}
                                    title={tooltip}
                                    aria-label={tooltip || undefined}
                                    tabIndex={tooltip ? 0 : -1}
                                >
                                    {d}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="dashboard-card">
                <h3>Locate Critical Supplies</h3>
                <ul>
                    {suppliesList.map((s, i) => (
                        <li key={i}>{s}</li>
                    ))}
                </ul>
                <button
                    className="btn-primary"
                    onClick={() => openMaps('Your+Location')}
                >
                    View on Map
                </button>
            </div>

            <div className="dashboard-card">
                <h3>Nearest Suppliers</h3>
                <ul>
                    {nearest.map((s, i) => (
                        <li key={i} className="supplier-item">
                            <FaMapMarkerAlt className="icon" /> {s.address} — {s.distance.toFixed(2)} km
                            <button
                                className="btn-secondary"
                                onClick={() => openMaps(s.address)}
                            >
                                Map
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
}