import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/NavBar";
import HomePage from "./components/HomePage";
import Page2 from "./components/Page2";
import Page3 from "./components/page3";
import "./css/App.css"; 

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/Page2" element={<Page2 />} />
        <Route path="/Page3" element={<Page3 />} />
      </Routes>
    </Router>
  );
}

export default App;
