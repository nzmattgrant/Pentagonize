import React, { useState } from 'react';
import './Game.css';

const Game = () => {
  const [isRotating, setIsRotating] = useState(false);

  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
    }, 1000);
  };

  return (
    <div>
      <div className={`grid-container ${isRotating ? 'rotating' : ''}`}>
        {[0, 1, 2].map((row) => (
          <div className="row" key={`row-${row}`}>
            {[0, 1, 2].map((col) => (
              <div className="square" key={`square-${row}-${col}`}>
                {[0, 1, 2, 3].map((circle) => (
                  <div className="circle" key={`circle-${row}-${col}-${circle}`}></div>
                ))}
              </div>
            ))}
          </div>
        ))}
        <div className="triangle top left" onClick={handleRotate}></div>
        <div className="triangle top right" onClick={handleRotate}></div>
        <div className="triangle bottom left" onClick={handleRotate}></div>
        <div className="triangle bottom right" onClick={handleRotate}></div>
      </div>
    </div>
  );
};

export default Game;
