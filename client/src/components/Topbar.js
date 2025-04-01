import React from "react";
import "../css/Topbar.css";

function Topbar({title}) {
    return (
        <div className="topbar-container">
            <div className="topbar">
                <h3 className="topbar-left">{title}</h3>
                <div className="topbar-right">
                    <span className="icon">🔔</span> 
                    <span className="icon">❓</span> 
                </div>
            </div>
        </div>
    );
}

export default Topbar;
