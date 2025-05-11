import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import '../css/UserDashboard.css';

export default function RecordsPage() {
    const [records, setRecords] = useState([]);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('prsToken'); if (!token) return;
        const id = jwtDecode(token).prs_id;
        fetch('/api/getUserVaccRecord', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ prsId: id })
        })
            .then(r => r.json().then(data => { if (!r.ok) throw new Error(data.error); setRecords(data); }))
            .catch(err => setMessage(err.message));
    }, []);

    const upload = async () => {
        if (!file) return;
        const token = localStorage.getItem('prsToken');
        const form = new FormData();
        form.append('prsId', jwtDecode(token).prs_id);
        form.append('vaccFile', file);
        try {
            const res = await fetch('/api/uploadVaccRecord', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage('Upload successful');
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        }
    };

    return (
        <div>
            <div className="dashboard-card dashboard-fullwidth">
                <h3>Vaccination Records</h3>
                {records.length ? (
                    <ul>{records.map((rec, i) => (
                        <li key={i}>
                            {rec.prsId} — {new Date(rec.date).toLocaleDateString()} — {rec.vaccineName} — Dose {rec.dose} — {rec.verified ? <FaCheckCircle /> : <FaTimesCircle />}
                        </li>
                    ))}</ul>
                ) : <p>No records found.</p>}
            </div>
            <div className="dashboard-card">
                <h3>Upload Record</h3>
                <input type="file" onChange={e => setFile(e.target.files[0])} />
                <button className="btn-primary" onClick={upload}>Upload</button>
                {message && <p className="info-msg">{message}</p>}
            </div>
        </div>
    );
}
