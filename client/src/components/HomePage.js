import React from "react";
import Sidebar from "./Sidebar";
import Cards from "./Cards";
import CardLong from "./CardLong";
import "../css/HomePage.css";

function HomePage() {
  return (
    <section className="home">
      <div className="content-wrapper">
        <Sidebar />
        <div className="cards-box">
          <Cards />
          <CardLong />
        </div>
      </div>
    </section>
  );
}

export default HomePage;
