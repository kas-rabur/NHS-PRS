import React from "react";
import "../css/Topbar.css";

function Topbar() {
    return (
        <div className="topbar-container">
            {/* Topbar */}
            <div className="topbar">
                {/* Left Section */}
                <h3 className="topbar-left">Dashboard</h3>

                {/* Right Section */}
                <div className="topbar-right">
                    <span className="icon">🔔</span> {/* Bell Icon */}
                    <span className="icon">❓</span> {/* Question Mark Icon */}
                </div>
            </div>
        </div>
    );
}

export default Topbar;
