// LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../css/LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>Pandemic Resilience System</h1>
        <p>Empowering communities with digital tools during global health crises</p>
      </header>

      <section className="landing-intro">
        <h2>What is PRS?</h2>
        <p>The Pandemic Resilience System (PRS) is a secure, web-based platform developed to help manage vital operations during future pandemics. It is designed to support government officials, businesses, and the public by offering real-time dashboards for supply chain management, vaccination tracking, health monitoring, and access to critical resources.</p>
      </section>

      <section className="landing-features">
        <h2>Core System Features</h2>
        <ul>
          <li><strong>Heterogeneous Data Support:</strong> Manage structured, semi-structured, and unstructured data.</li>
          <li><strong>Big Data Scalability:</strong> Built to handle large-scale datasets and future growth in users and transactions.</li>
          <li><strong>Data Privacy & Security:</strong> Encryption and strict access controls protect sensitive data like PRS-Ids and National Identifiers.</li>
          <li><strong>Custom APIs:</strong> Secure APIs support both discrete and batch data transactions for stock updates and health records.</li>
          <li><strong>RBAC and Auditing:</strong> Role-based access ensures only authorized users can interact with sensitive data, with all activity logged for compliance.</li>
          <li><strong>Data Integrity:</strong> Ensures accuracy of vaccination and supply chain records to maintain reliability and trust.</li>
        </ul>
      </section>

      <section className="landing-routes">
        <Link to="/government-dashboard" className="route-card gov">
          <h2>Government Dashboard</h2>
          <p>Monitor supply chains, track vaccinations, and ensure compliance</p>
        </Link>

        <Link to="/public-dashboard" className="route-card public">
          <h2>Public Dashboard</h2>
          <p>Manage your PRS-ID, find supplies, and access vaccination records</p>
        </Link>

        <Link to="/merchant-dashboard" className="route-card merchant">
          <h2>Merchant Dashboard</h2>
          <p>Track inventory, report sales, and follow purchasing rules</p>
        </Link>
      </section>

      <section className="landing-benefits">
        <h2>Why Choose PRS?</h2>
        <ul>
          <li>Real-time monitoring and reporting tools</li>
          <li>Secured, accessible public health records</li>
          <li>Transparent and accountable government systems</li>
          <li>Digital compliance enforcement for merchants</li>
        </ul>
      </section>
    </div>
  );
};

export default LandingPage;
