import React from "react";
import "../css/Cards.css"; 

function Cards() {
  return (
    <div className="card-container">
      {/* Card 1 */}
      <div className="card">
        <h3>Card 1</h3>
        <p>This is the content of Card 1.</p>
      </div>

      {/* Card 2 */}
      <div className="card">
        <h3>Card 2</h3>
        <p>This is the content of Card 2.</p>
      </div>

      {/* Card 3 */}
      <div className="card">
        <h3>Card 3</h3>
        <p>This is the content of Card 3.</p>
      </div>
    </div>
  );
}

export default Cards;
