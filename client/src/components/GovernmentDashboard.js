import React from "react";
import Sidebar from "./Sidebar";
import Card from "./Card"; // Updated to use the refactored Card component
import Topbar from "./Topbar";
import CardLong from "./CardLong";
import "../css/GovernmentDashboard.css";
import LoginForm from "./LoginForm";

function GovernmentDashboard() {
  return (
    <section className="home">
      <div className="content-wrapper">
        <Sidebar />
        <div className="cards-box">
          <Topbar title="Government Dashboard" className="topbar-home" />
          <div className="cards-container">
            
            <Card className="card-home" title="Card 1" content="This is card 1." />
            <Card className="card-home" title="Card 2" content="This is card 2." />
            <Card className="card-home" title="Card 3" content="This is card 3." />
          </div>
          <CardLong title="Long card" content="This is the long card" />
        </div>
        
      </div>
        <LoginForm/>
    </section>
  );
}

export default GovernmentDashboard;