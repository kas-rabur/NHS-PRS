import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import '../css/UserDashboard.css';

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  // Make sure this matches how you stored it
  const token = localStorage.getItem('prsToken');
  const prsId = token ? jwtDecode(token).prs_id : null;

  useEffect(() => {
    if (!token) return;

    fetch('/api/getUserVaccRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prsId }),
    })
      .then(async res => {
        const data = await res.json();
        console.log('getUserVaccRecord response:', data);

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load records');
        }

        const recs = Array.isArray(data) ? data : data.records;
        setRecords(recs || []);
      })
      .catch(err => {
        console.error('getUserVaccRecord error:', err);
        setMessage(err.message);
      });
  }, [token, prsId]);

  const upload = async () => {
    if (!file || !prsId) {
      return setMessage('No file selected or user not authenticated');
    }

    try {
      setMessage('Reading file…');
      const text = await file.text();
      const bundle = JSON.parse(text);         

      setMessage('Uploading…');
      const res = await fetch('http://localhost:5000/api/upload_vaccination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prsId, bundle }), 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setMessage('Upload successful, reloading records…');
      const recRes = await fetch('/api/getUserVaccRecord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prsId }),         
      });
      const recData = await recRes.json();
      console.log('getUserVaccRecord after upload:', recData);
      if (!recRes.ok) throw new Error(recData.error || 'Failed to reload');

      const newRecs = Array.isArray(recData) ? recData : recData.records;
      setRecords(newRecs || []);
      setMessage('Records updated');
    } catch (err) {
      console.error('upload error:', err);
      alert(`Error: ${err.message}`);
    }
  };


  return (
    <div>
      <div className="dashboard-card dashboard-fullwidth">
        <h3>Vaccination Records</h3>
        {records.length > 0 ? (
          <ul>
            {records.map((rec, i) => (
              <li key={i}>
                {rec.prsId} — {new Date(rec.date).toLocaleDateString()} —{' '}
                {rec.vaccineName} — Dose {rec.dose} —{' '}
                {rec.verified ? <FaCheckCircle /> : <FaTimesCircle />}
              </li>
            ))}
          </ul>
        ) : (
          <p>No records found.</p>
        )}
        {message && <p className="info-msg">{message}</p>}
      </div>

      <div className="dashboard-card upload-card">
        <h3>Upload Record</h3>
        <div className="upload-section">
          <input
            type="file"
            accept="application/json"
            onChange={e => {
              setMessage('');
              setFile(e.target.files[0] || null);
            }}
          />
          <button className="btn-primary" onClick={upload}>
            Upload
          </button>
          {message && <p className="info-msg">{message}</p>}
        </div>
      </div>
    </div>
  );
}
