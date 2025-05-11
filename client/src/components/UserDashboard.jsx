import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/UserDashboard.css';

export default function HomePage() {
  const nav = useNavigate();
  const cards = [
    { title: 'Profile', desc: 'View and manage your personal details', path: 'profile' },
    { title: 'Suppliers', desc: 'Locate critical supplies near you', path: 'suppliers' },
    { title: 'Records', desc: 'Review or upload vaccination records', path: 'records' },
  ];
  return (
    <div>
      <div className="dashboard-grid">
        {cards.map(c => (
          <div key={c.path} className="dashboard-card" onClick={()=>nav(`/dashboard/${c.path}`)} style={{cursor:'pointer'}}>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}