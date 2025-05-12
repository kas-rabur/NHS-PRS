import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import {jwtDecode} from 'jwt-decode';
import '../css/UserDashboard.css';

export default function SuppliersPage() {
    const [nearest, setNearest] = useState([]);
    const [error, setError] = useState('');
    const [allowedDay, setAllowedDay] = useState('');
    const [criticalItems, setCriticalItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const token = localStorage.getItem('prsToken');
        if (!token) return;

        let payload;
        try {
            payload = jwtDecode(token);
        } catch {
            return;
        }

        fetch('/api/get_allowed_day', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ prsId: payload.prs_id }),
        })
            .then(res => res.json())
            .then(data => setAllowedDay(data.allowedDay || data.Allowed_Day))
            .catch(err => setError(err.message));

        fetch('/api/findNearestSuppliers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ prsId: payload.prs_id }),
        })
            .then(res => res.json().then(data => {
                if (!res.ok) throw new Error(data.error || 'Failed');
                setNearest(data);
            }))
            .catch(err => setError(err.message));

        fetch('/api/get_allowed_critical_items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ prsId: payload.prs_id }),
        })
            .then(res => res.json().then(data => {
                if (!res.ok) throw new Error(data.error || 'Failed');
                return data.items;
            }))
            .then(weekData => {
                const todayEntry = weekData.find(d => d.allowed);
                if (todayEntry) setCriticalItems(todayEntry.items);
            })
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

    const getTooltip = i => {
        const isToday = i === todayIndex;
        const isAllowed = i === allowedIndex;
        if (isToday && isAllowed) return 'Today & Available Order Day';
        if (isToday) return 'Today';
        if (isAllowed) return 'Available Order Day';
        return '';
    };

    const filteredItems = criticalItems
        .filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(item => {
            const remaining = Math.max(item.daily_limit - item.total_bought, 0);
            if (statusFilter === 'available') return remaining > 0;
            if (statusFilter === 'exhausted') return remaining === 0;
            return true;
        });

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
                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All</option>
                        <option value="available">Available</option>
                        <option value="exhausted">Exhausted</option>
                    </select>
                </div>
                {filteredItems.length === 0 ? (
                    <p>No items match your criteria.</p>
                ) : (
                    <table className="supplies-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Daily Limit</th>
                                <th>Purchased This Week</th>
                                <th>Remaining</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                const remaining = Math.max(item.daily_limit - item.total_bought, 0);
                                return (
                                    <tr key={item.item_id}>
                                        <td>{item.item_name}</td>
                                        <td>{item.daily_limit}</td>
                                        <td>{item.total_bought}</td>
                                        <td>{remaining}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="dashboard-card">
                <h3>Nearest Suppliers</h3>
                <ul>
                    {nearest.map((s, i) => (
                        <li key={i} className="supplier-item">
                            <FaMapMarkerAlt className="icon" /> {s.address} — {s.distance.toFixed(2)} km
                            <button className="btn-secondary" onClick={() => openMaps(s.address)}>
                                Map
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}