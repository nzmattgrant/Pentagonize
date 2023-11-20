import React, { useState } from 'react';
import './Game.css';

const Game = () => {
  const enum SlotState {
    Empty = 0,
    WhitePiece = 1,
    BlackPiece = 2
  }
  const mappingToColor = (slot: number) => {
    switch (slot) {
      case SlotState.WhitePiece:
        return 'white';
      case SlotState.BlackPiece:
        return 'black';
      default:
        return '';
    }
  }

  const [board, setBoard] = useState([
    [
      [0, 0, 0, 0], //cell 1
      [0, 0, 0, 0], //cell 2
      [0, 0, 0, 0] //cell 3
    ], // cell row 1
    [
      [0, 0, 0, 0], //cell 4
      [0, 0, 0, 0], //cell 5
      [0, 0, 0, 0] //cell 6
    ], // cell row 2
    [
      [0, 0, 0, 0], //cell 7
      [0, 0, 0, 0], //cell 8
      [0, 0, 0, 0] //cell 9
    ] // cell row 3
  ]);

  let playersTurn = 1;
  let waitingForBoardShift = false;

  const getPaddedBoard = (board: number[][][]) => {
    const paddedBoard = [];
    for (const row of board) {
      const newRow = [...row]
      newRow.push([...newRow[row.length - 1]]);
      newRow.push([...newRow[0]]);
      paddedBoard.push(newRow);
    }
    paddedBoard.unshift([...paddedBoard[paddedBoard.length - 1]]);
    paddedBoard.push([...paddedBoard[0]]);
    return paddedBoard;
  }

  const checkForWin = () => {
    return false;
  }

  const directionClicked = (direction: string) => {
    
  }

  const slotClicked = (rowIndex: number, cellIndex: number, slotIndex: number) => {
    if(waitingForBoardShift){
      return;
    }
    console.log('clicked', rowIndex, cellIndex, slotIndex);
    console.log(board.length, rowIndex);
    board[rowIndex][cellIndex][slotIndex] = playersTurn;
    setBoard([...board]);
    if (checkForWin()) {
      alert(`Player ${playersTurn} wins!`);
    }
    playersTurn = playersTurn === 1 ? 2 : 1;
    waitingForBoardShift = true;
  }

  const maskStyle = {
    position: 'relative' as 'relative',
    width: '305px',
    height: '305px',
    overflow: 'hidden'
  }

  const centerContentStyles = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    border: '1px solid #000', // Set the border styles as needed
    boxSizing: 'border-box' as 'border-box',
  };

  return (
    <div style={maskStyle}>
      <div style={centerContentStyles}>
        {board.map((row, rowIndex) => (
          <div className="row" key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <div className="square" key={`square-${rowIndex}-${cellIndex}`}>
                {cell.map((slot, slotIndex) => (
                  <div 
                  className={mappingToColor(slot) + " circle"} 
                  key={`circle-${rowIndex}-${cellIndex}-${slotIndex}`} 
                  onClick={() => slotClicked(rowIndex, cellIndex, slotIndex)}>
              </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
     // </div>

  );
};

export default Game;
