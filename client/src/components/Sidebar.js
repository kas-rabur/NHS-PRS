import React from "react";
import "../css/Sidebar.css"; 

function Sidebar() {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <a href="/home">Home</a>
        </li>
        <li>
          <a href="/Page2">Log-in</a>
        </li>
        <li>
          <a href="/page3">Register</a>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
