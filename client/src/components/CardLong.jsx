import React from "react";
import "../css/CardLong.css"; 

function CardLong({title, content}) {
    return (
        <div className="card-long-container">
            <div className="card-long">
                <h3>{title}</h3>
                <p>{content}</p>
            </div>
        </div>
    );
}

export default CardLong;