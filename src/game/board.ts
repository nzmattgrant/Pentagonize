import { Axis, Move } from '.';
import { Tile } from './tile';

type Grid = number[][];

export class Board {
  grid: number[][];
  gridTiles: Tile[][] = [];
  public tileSize: number = 2;//nxn because square tiles

  static deserialize(grid: number[][]) {
    return new Board(grid[0].length, grid.length, grid);
  }

  constructor(public cols: number, public rows: number, grid?: number[][]) {
    if (grid) this.grid = grid;
    else this.grid = [...Array(rows)].map((_, r) => [...Array(cols)].map((_, c) => r * cols + c));
    this.gridTiles = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push(new Tile(this.tileSize, this.tileSize));
      }
      this.gridTiles.push(row);
    }
  }

  serialize() {
    return this.clone().grid;
  }

  clone() {
    return new Board(
      this.cols,
      this.rows,
      this.grid.map((row) => [...row])
    );
  }

  reset() {
    for (let i = this.cols * this.rows; i--; ) {
      this.grid[Math.floor(i / this.cols)][i % this.cols] = i;
    }
  }

  move(move: Move) {
    if (move.axis == Axis.Row) {
      this.moveRow(move.index, move.n);
    } else {
      this.moveColumn(move.index, move.n);
    }
  }

  isSolved() {
    for (let i = this.cols * this.rows; i--; ) {
      if (this.grid[Math.floor(i / this.cols)][i % this.cols] != i) return false;
    }
    return true;
  }

  pos(index: number) {
    for (let row = this.rows; row--; ) {
      for (let col = this.cols; col--; ) {
        if (this.grid[row][col] == index) return { row, col };
      }
    }
    throw new Error('Index not found in board');
  }


  getGameWinner(){
  
    let grid = [] as Grid;
    
    for(let i = 0; i < this.gridTiles.length; i++){//rows
      const row = new Array(this.tileSize).fill([]) as number[][];
      for(let j = 0; j < this.gridTiles[i].length; j++){//cols
        
        for(let k = 0; k < this.tileSize; k++){//tile row
          row[k] = [...row[k], ...this.gridTiles[i][j].slots[k]];
        }
      }
      grid = [...grid, ...row];
    }

    function checkLine(line: number[]): number {
      if (line.includes(0)) return 0;
      if (line.every(cell => cell === 1)) return 1;
      if (line.every(cell => cell === 2)) return 2;
      return 0;
    }
    
    const size = grid.length;
    const winLength = size - 1;
  
    const rotatedGrid = grid.map((_, i) => grid.map(row => row[i]));
    // Check horizontal and vertical
    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= size - winLength; j++) {
        // Horizontal check
        const horizontalWinner = checkLine(grid[i].slice(j, j + winLength));
        if (horizontalWinner) return horizontalWinner;
        
        // Vertical check
        const verticalWinner = checkLine(rotatedGrid[i].slice(j, j + winLength));
        if (verticalWinner) return verticalWinner;
      }
    }
  
    // Check diagonals
    for (let i = 0; i <= size - winLength; i++) {
      for (let j = 0; j <= size - winLength; j++) {
        // Diagonal from top-left to bottom-right
        const diagonalWinner1 = checkLine(Array.from({ length: winLength }, (_, k) => grid[i + k][j + k]));
        if (diagonalWinner1) return diagonalWinner1;
        
        // Diagonal from top-right to bottom-left
        const diagonalWinner2 = checkLine(Array.from({ length: winLength }, (_, k) => grid[i + k][j + winLength - 1 - k]));
        if (diagonalWinner2) return diagonalWinner2;
      }
    }
  
    return 0; // No winner
  }

  private moveRow(index: number, n: number) {
    console.log(1, [...this.gridTiles[index]]);
    let row = this.grid[index];
    this.grid[index] = row.map((_, i) => row[(((i - n) % this.cols) + this.cols) % this.cols]);
    const tileRow = this.gridTiles[index];
    this.gridTiles[index] = tileRow.map((_, i) => tileRow[(((i - n) % this.cols) + this.cols) % this.cols]);
    console.log(2, [...this.gridTiles[index]]);
  }

  private moveColumn(index: number, n: number) {
    const col = [...Array(this.rows)].map((_, i) => this.grid[i][index]);

    for (let i = 0; i < this.rows; i++) {
      this.grid[i][index] = col[(((i - n) % this.rows) + this.rows) % this.rows];
    }

    const tileCol = [...Array(this.rows)].map((_, i) => this.gridTiles[i][index]);

    for (let i = 0; i < this.rows; i++) {
      this.gridTiles[i][index] = tileCol[(((i - n) % this.rows) + this.rows) % this.rows];
    }
  }
}
