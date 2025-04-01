import React, {useState, useEffect} from "react";
import Sidebar from "./Sidebar";
import Card from "./Card"; // Updated to use the refactored Card component
import Topbar from "./Topbar";
import CardLong from "./CardLong";
import "../css/HomePage.css";


function HomePage() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch("http://localhost:5000/api/data") // Your Flask server running on localhost:5000
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        return response.json();
      })
      .then((data) => {
        setData(data); // Update state with fetched data
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);
  return (
    <section className="home">
      <div className="content-wrapper">
        <Sidebar />
        <div className="cards-box">
          <Topbar title="Dashboard" className="topbar-home" />
          <div className="cards-container">
            
            <Card className="card-home" title="Card 1" content={data} />
            <Card className="card-home" title="Card 2" content="This is card 2." />
            <Card className="card-home" title="Card 3" content="This is card 3." />
          </div>
          <CardLong title="Long card" content="This is the long card" />
        </div>
      </div>
    </section>
  );
}

export default HomePage;
