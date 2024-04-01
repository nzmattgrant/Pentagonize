import { Axis, Move } from '.';
import { Tile } from './tile';

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

  isGameWon(){
    //go through the tiles 
    //see if there are any straight lines up or down
    let board = [] as number[][];
    let currentTileRow = 0;
    for(let i = 0; i < this.gridTiles.length; i++){
      const rows = new Array(this.tileSize).fill([]);
      for(let j = 0; j < this.gridTiles[i].length; j++){
        for(let k = 0; k < this.tileSize; k++){//tile row
          for(let l = 0; l < this.tileSize; l++){//tile col
            rows[k + currentTileRow].push(this.gridTiles[i][j].slots[k][l]);
          }
        }
        currentTileRow+=this.tileSize;
      }
      board = [...board, ...rows];
    }
    const vertical = []
    const horizontal = []
    const leftToRightDiagonal = [];
    const rightToLeftDiagonal = [];
    for(let i = 0; i < board.length; i++){
      const row = [];
      for(let j = 0; j < board.length; j++){

      }
    }
  }

  private moveRow(index: number, n: number) {
    let row = this.grid[index];
    this.grid[index] = row.map((_, i) => row[(((i - n) % this.cols) + this.cols) % this.cols]);
    const tileRow = this.gridTiles[index];
    this.gridTiles[index] = tileRow.map((_, i) => tileRow[(((i - n) % this.cols) + this.cols) % this.cols]);
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
