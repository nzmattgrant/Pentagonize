import { Axis, Board, Move } from '.';

interface Transition {
  value: number;
  start: number;
  startTime: number;
  time: number;
  duration: number;
}

interface Pointer {
  x: number;
  y: number;
  col: number;
  row: number;
  moveX: number;
  moveY: number;
}

export class Game {
  board!: Board;
  width!: number;
  height!: number;
  tileSize!: number;

  // Board is inset from canvas edges to leave room for arrows and marble holder
  private bm = 0;   // boardMargin (physical px) — uniform on all four sides
  private bx = 0;   // board origin X (physical)
  private by = 0;   // board origin Y (physical)
  private bw = 0;   // board width  (physical)
  private bh = 0;   // board height (physical)

  private ctx: CanvasRenderingContext2D;

  locked = false;

  transitionTime = 150;
  pointers: Map<number, Pointer> = new Map();
  transitions: Map<number, Transition> = new Map();

  private moveAxis: Axis = Axis.Row;
  private repaint = true;
  private isMoving = false;

  private cursorX: number | null = null;
  private cursorY: number | null = null;
  private isTouchHover = false;
  private lastPlacingState = true;
  private marbleCursorTurn = -1;
  private lastTransitionsSize = 0;
  private transitionsEndedAt = 0;

  onMove?: (move: Move, isPlayerMove: boolean) => void;
  onWin?: (winner: number) => void;

  private winnerNotified = false;

  constructor(public canvas: HTMLCanvasElement, public columnCount: number, public rowCount: number) {
    this.canvas.tabIndex = 0;
    this.ctx = canvas.getContext('2d')!;
    this.addEventListeners();
    this.setBoardSize(columnCount, rowCount);
    requestAnimationFrame(this.frame);
  }

  setBoardSize(cols: number, rows?: number) {
    if (!rows) rows = cols;
    this.board = new Board(cols, rows);
    (this.rowCount = rows), (this.columnCount = cols);
    this.winnerNotified = false;
    if (this.width != null) this.setWidth(this.width / devicePixelRatio);
  }

  private notifyWinner(winner: number) {
    if (winner === 0 || this.winnerNotified) return;
    this.winnerNotified = true;
    this.onWin?.(winner);
  }

  setWidth(width: number) {
    this.width = Math.round(width * devicePixelRatio);
    this.height = this.width / (this.columnCount / this.rowCount);
    this.updateCanvas();
  }

  setHeight(height: number) {
    this.height = Math.round(height * devicePixelRatio);
    this.width = this.height * (this.columnCount / this.rowCount);
    this.updateCanvas();
  }

  private updateCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${this.width / devicePixelRatio}px`;
    this.canvas.style.height = `${this.height / devicePixelRatio}px`;

    // Margin: large enough for arrows + marble holder, capped so board stays usable
    const rawTileW = this.width / this.columnCount;
    this.bm = Math.max(20 * devicePixelRatio, Math.min(rawTileW * 0.38, 40 * devicePixelRatio));

    this.bx = this.bm;
    this.by = this.bm;
    this.bw = this.width - 2 * this.bm;
    this.bh = this.height - 2 * this.bm;

    this.tileSize = Math.ceil(this.bw / this.columnCount + 0.1);

    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';

    this.repaint = true;
  }

  setBoard(board: Board) {
    this.board = board;
    this.repaint = true;
  }

  move(move: Move, isPlayerMove = false) {
    this.board.move(move);
    this.repaint = true;
    if (this.onMove) this.onMove(move, isPlayerMove);
    return true;
  }

  animatedMove(move: Move, isPlayerMove = false) {
    this.isMoving = true;
    if (!this.move(move, isPlayerMove) || this.transitionTime == 0) return;
    if (move.axis != this.moveAxis) {
      this.transitions.clear();
      this.moveAxis = move.axis;
    }
    this.transitions.set(move.index, {
      start: -move.n,
      value: -move.n,
      startTime: performance.now(),
      time: 0,
      duration: this.transitionTime,
    });
  }

  // All coordinates in CSS pixels; converts to physical internally.
  private tryPlacePiece(cssX: number, cssY: number): boolean {
    const physX = cssX * devicePixelRatio;
    const physY = cssY * devicePixelRatio;
    const boardX = physX - this.bx;
    const boardY = physY - this.by;

    const col = Math.floor((boardX / this.bw) * this.columnCount);
    const row = Math.floor((boardY / this.bh) * this.rowCount);

    if (row < 0 || row >= this.rowCount || col < 0 || col >= this.columnCount) return false;

    const tile = this.board.gridTiles[row][col];
    const slots = tile.slots;
    const tileX = Math.floor((col / this.columnCount) * this.bw);
    const tileY = Math.floor((row / this.rowCount) * this.bh);
    const slotSize = this.tileSize / slots.length;
    const slotX = Math.floor((boardX - tileX) / slotSize);
    const slotY = Math.floor((boardY - tileY) / slotSize);

    if (slotX < 0 || slotX >= slots[0].length || slotY < 0 || slotY >= slots.length) return false;
    if (slots[slotY][slotX] !== 0) return false;

    slots[slotY][slotX] = window.state.turn + 1;
    window.state.placing = false;
    this.cursorX = null;
    this.cursorY = null;
    this.repaint = true;

    this.notifyWinner(this.board.getGameWinner());
    return true;
  }

  // Generates a data-URL cursor shaped like the current player's marble.
  private generateMarbleCursor(): string {
    const size = 36;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;
    ctx.fillStyle = window.state.turn === 0 ? 'darkred' : 'darkblue';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.42, 0, 2 * Math.PI);
    ctx.fill();
    return `url('${c.toDataURL()}') ${cx} ${cy}, crosshair`;
  }

  // Arrow indicators in all four margins during the turn/rotation phase.
  private drawTurnArrows() {
    const ctx = this.ctx;
    const as = this.bm * 0.46;   // arrow size — larger for visibility
    const half = this.bm / 2;
    const rowH = this.bh / this.rowCount;
    const colW = this.bw / this.columnCount;

    ctx.save();
    ctx.fillStyle = 'rgba(15,15,15,0.88)';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = devicePixelRatio * 1.2;

    const tri = (tip: [number, number], b1: [number, number], b2: [number, number]) => {
      ctx.beginPath();
      ctx.moveTo(tip[0], tip[1]);
      ctx.lineTo(b1[0], b1[1]);
      ctx.lineTo(b2[0], b2[1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Left margin: ← per row  |  Right margin: → per row  (arrows point outward)
    for (let row = 0; row < this.rowCount; row++) {
      const my = this.by + (row + 0.5) * rowH;
      // ← tip points left (outward)
      tri([half - as, my], [half + as * 0.1, my - as * 0.55], [half + as * 0.1, my + as * 0.55]);
      // → tip points right (outward)
      const rx = this.width - half;
      tri([rx + as, my], [rx - as * 0.1, my - as * 0.55], [rx - as * 0.1, my + as * 0.55]);
    }

    // Top margin: ↑ per col  |  Bottom margin: ↓ per col  (arrows point outward)
    for (let col = 0; col < this.columnCount; col++) {
      const mx = this.bx + (col + 0.5) * colW;
      // ↑ tip points up (outward)
      tri([mx, half - as], [mx - as * 0.55, half + as * 0.1], [mx + as * 0.55, half + as * 0.1]);
      // ↓ tip points down (outward)
      const by2 = this.height - half;
      tri([mx, by2 + as], [mx - as * 0.55, by2 - as * 0.1], [mx + as * 0.55, by2 - as * 0.1]);
    }

    ctx.restore();
  }

  // Slot highlight on hover. For touch, also draws a marble at the finger position.
  private drawPlacingHover() {
    if (this.cursorX === null || this.cursorY === null) return;

    const ctx = this.ctx;
    const physX = this.cursorX * devicePixelRatio;
    const physY = this.cursorY * devicePixelRatio;
    const r = this.tileSize / 5;
    const playerColor = window.state.turn === 0 ? 'darkred' : 'darkblue';

    const boardX = physX - this.bx;
    const boardY = physY - this.by;
    const col = Math.floor((boardX / this.bw) * this.columnCount);
    const row = Math.floor((boardY / this.bh) * this.rowCount);

    if (col >= 0 && col < this.columnCount && row >= 0 && row < this.rowCount) {
      const tile = this.board.gridTiles[row][col];
      const slots = tile.slots;
      const tileX = Math.floor((col / this.columnCount) * this.bw);
      const tileY = Math.floor((row / this.rowCount) * this.bh);
      const slotSize = this.tileSize / slots.length;
      const slotX = Math.floor((boardX - tileX) / slotSize);
      const slotY = Math.floor((boardY - tileY) / slotSize);

      if (slotX >= 0 && slotX < slots[0].length && slotY >= 0 && slotY < slots.length && slots[slotY][slotX] === 0) {
        const tileDrawX = this.bx + Math.floor((col / this.columnCount) * this.bw);
        const tileDrawY = this.by + Math.floor((row / this.rowCount) * this.bh);
        const slotCX = tileDrawX + (this.tileSize / 4) * (1 + 2 * slotX);
        const slotCY = tileDrawY + (this.tileSize / 4) * (1 + 2 * slotY);

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(slotCX, slotCY, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = Math.max(1, devicePixelRatio * 1.5);
        ctx.stroke();
        ctx.restore();
      }
    }

    // On touch there is no cursor, so draw the marble at the finger position
    if (this.isTouchHover) {
      ctx.save();
      ctx.fillStyle = playerColor;
      ctx.beginPath();
      ctx.arc(physX, physY, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.arc(physX - r * 0.28, physY - r * 0.28, r * 0.42, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }

  private handleArrowClick(physX: number, physY: number): boolean {
    if (!window.state.started || window.state.placing) return false;

    const inRow = physY >= this.by && physY <= this.by + this.bh;
    const inCol = physX >= this.bx && physX <= this.bx + this.bw;

    let axis: Axis | null = null;
    let index = -1;
    let n = 0;

    if (physX < this.bx && inRow) {
      // Left margin ← : slide row left
      axis = Axis.Row;
      index = Math.floor(((physY - this.by) / this.bh) * this.rowCount);
      n = -1;
    } else if (physX > this.bx + this.bw && inRow) {
      // Right margin → : slide row right
      axis = Axis.Row;
      index = Math.floor(((physY - this.by) / this.bh) * this.rowCount);
      n = 1;
    } else if (physY < this.by && inCol) {
      // Top margin ↑ : slide col up
      axis = Axis.Col;
      index = Math.floor(((physX - this.bx) / this.bw) * this.columnCount);
      n = -1;
    } else if (physY > this.by + this.bh && inCol) {
      // Bottom margin ↓ : slide col down
      axis = Axis.Col;
      index = Math.floor(((physX - this.bx) / this.bw) * this.columnCount);
      n = 1;
    }

    if (axis === null || index < 0) return false;
    const limit = axis === Axis.Row ? this.rowCount : this.columnCount;
    if (index >= limit) return false;

    // Use a longer transition for button clicks so the slide is clearly visible
    const saved = this.transitionTime;
    this.transitionTime = Math.max(this.transitionTime, 300);
    this.animatedMove({ axis, index, n }, true);
    this.transitionTime = saved;
    window.state.placing = true;
    window.state.turn = window.state.turn === 0 ? 1 : 0;
    return true;
  }

  private render(_time: number) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Gap between tiles — drawn as dark board background showing through inset tile rects
    const gap = Math.max(3, Math.round(devicePixelRatio * 2));

    // Drop shadow: explicit dark rect offset behind the board, then board covers its top-left
    const so = Math.round(9 * devicePixelRatio);
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0,0,0,0.55)';
    this.ctx.shadowBlur = 14 * devicePixelRatio;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.fillStyle = 'rgba(0,0,0,0.65)';
    this.ctx.fillRect(this.bx + so, this.by + so, this.bw, this.bh);
    this.ctx.restore();

    // Dark background behind tiles — visible through the gaps
    this.ctx.fillStyle = '#6b0b0b';
    this.ctx.fillRect(this.bx, this.by, this.bw, this.bh);

    // Clip all tile drawing to the board perimeter so sliding tiles never bleed into the margin
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(this.bx, this.by, this.bw, this.bh);
    this.ctx.clip();

    for (let i = 0; i < (this.moveAxis == Axis.Col ? this.columnCount : this.rowCount); i++) {
      const transition = this.transitions.get(i);
      const moveAmount = transition ? transition.value : 0;

      const w = this.moveAxis == Axis.Col ? this.rowCount : this.columnCount;
      for (let j = Math.floor(-moveAmount); j < w - Math.floor(moveAmount); j++) {
        let row = i;
        let col = ((j % w) + w) % w;
        let x = j + moveAmount;
        let y = i;

        if (this.moveAxis == Axis.Col) {
          const tempRow = row;
          (row = col), (col = tempRow);
          const tempX = x;
          (x = y), (y = tempX);
        }

        // Offset tiles into the board area (inset from margins)
        x = this.bx + Math.floor((x / this.columnCount) * this.bw);
        y = this.by + Math.floor((y / this.rowCount) * this.bh);

        const xf = Math.floor(x);
        const yf = Math.floor(y);
        this.ctx.fillStyle = '#ff3632';
        this.ctx.fillRect(xf + gap, yf + gap, this.tileSize - gap * 2, this.tileSize - gap * 2);

        const radiusSize = this.tileSize / 5;
        const margin = this.tileSize / 4 - radiusSize;
        const tile = this.board.gridTiles[row][col];
        const slots = tile.slots;
        for (let slotRow = 0; slotRow < slots.length; slotRow++) {
          for (let slotCol = 0; slotCol < slots[slotRow].length; slotCol++) {
            const colOffset = slotRow * 2;
            const rowOffset = slotCol * 2;
            const slotVal = slots[slotRow][slotCol];
            const cx = xf + radiusSize + radiusSize * rowOffset + margin + margin * rowOffset;
            const cy = yf + radiusSize + radiusSize * colOffset + margin + margin * colOffset;

            // Base marble fill
            if (slotVal === 1) {
              this.ctx.fillStyle = 'darkred';
            } else if (slotVal === 2) {
              this.ctx.fillStyle = 'darkblue';
            } else {
              this.ctx.fillStyle = '#1a1a1a';
            }
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radiusSize, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.closePath();

            if (slotVal !== 0) {
              // Specular highlight — top-left glint for 3D sphere look
              this.ctx.fillStyle = 'rgba(255,255,255,0.30)';
              this.ctx.beginPath();
              this.ctx.arc(cx - radiusSize * 0.28, cy - radiusSize * 0.28, radiusSize * 0.42, 0, 2 * Math.PI);
              this.ctx.fill();
              this.ctx.closePath();
            } else {
              // Empty slot: concave hole.
              // As the reference image shows, a concave surface has its gradient
              // INVERTED relative to a convex ball:
              //   convex ball  → light top,  dark bottom  (top face catches the light)
              //   concave hole → dark top,   light bottom (near rim shadows the top
              //                               interior; far wall at bottom is lit)
              // Diagonal gradient matching the board's top-left light source:
              // dark at top-left (near-rim shadow), bright at bottom-right (far wall lit)
              const grad = this.ctx.createLinearGradient(
                cx - radiusSize, cy - radiusSize,
                cx + radiusSize, cy + radiusSize
              );
              grad.addColorStop(0, '#060606');
              grad.addColorStop(0.5, '#1a1a1a');
              grad.addColorStop(1, '#5a5a5a');
              this.ctx.fillStyle = grad;
              this.ctx.beginPath();
              this.ctx.arc(cx, cy, radiusSize, 0, 2 * Math.PI);
              this.ctx.fill();
              this.ctx.closePath();
            }
          }
        }
      }
    }

    this.ctx.restore(); // end board clip

    if (window.state.started) {
      if (window.state.placing) {
        this.drawPlacingHover();
      } else {
        this.drawTurnArrows();
      }
    }
  }

  private frame = () => {
    const time = performance.now();

    if (this.transitions.size != 0) this.repaint = true;

    if (window.state.started) {
      // Entering rotation mode: switch to move cursor immediately
      if (window.state.placing !== this.lastPlacingState) {
        this.lastPlacingState = window.state.placing;
        if (!window.state.placing) {
          this.canvas.style.cursor = 'move';
          this.cursorX = null;
          this.cursorY = null;
          this.isTouchHover = false;
        }
        this.repaint = true;
      }
      // Record when transitions finish and check for winner after rotations
      if (this.transitions.size === 0 && this.lastTransitionsSize > 0) {
        this.transitionsEndedAt = time;
        if (window.state.started) {
          this.notifyWinner(this.board.getGameWinner());
        }
      }
      this.lastTransitionsSize = this.transitions.size;

      // Show marble cursor only after transitions finish + 200 ms extra pause
      const settled = this.transitions.size === 0 && time - this.transitionsEndedAt >= 200;
      if (window.state.placing && settled && window.state.turn !== this.marbleCursorTurn) {
        this.canvas.style.cursor = this.generateMarbleCursor();
        this.marbleCursorTurn = window.state.turn;
        this.repaint = true;
      }
    }

    for (const [index, transition] of this.transitions.entries()) {
      transition.time = (time - transition.startTime) / transition.duration;
      transition.value = transition.start - transition.start * transition.time * (2 - transition.time);
      if (transition.time >= 1) this.transitions.delete(index);
    }

    if (this.repaint) {
      this.render(time);
      this.repaint = false;
    }

    requestAnimationFrame(this.frame);
  };

  private onTouchStart = (identifier: number, x: number, y: number) => {
    if (this.locked) return;
    const pointer: Pointer = {
      x,
      y,
      moveX: 0,
      moveY: 0,
      col: Math.floor(((x * devicePixelRatio - this.bx) / this.bw) * this.columnCount),
      row: Math.floor(((y * devicePixelRatio - this.by) / this.bh) * this.rowCount),
    };
    this.pointers.set(identifier, pointer);
  };

  private onTouchMove = (identifier: number, x: number, y: number) => {
    if (!window.state.started || window.state.placing) return;
    const pointer = this.pointers.get(identifier);
    if (!pointer) return;

    const col = Math.floor(((x * devicePixelRatio - this.bx) / this.bw) * this.columnCount);
    const row = Math.floor(((y * devicePixelRatio - this.by) / this.bh) * this.rowCount);

    pointer.moveX += col - pointer.col;
    pointer.moveY += row - pointer.row;

    const rowIndex = ((pointer.row % this.rowCount) + this.rowCount) % this.rowCount;
    const pointersX = [...this.pointers.values()].filter((p) => p.row == rowIndex);
    const moveX = Math.trunc(pointersX.reduce((a, b) => a + b.moveX, 0) / pointersX.length);

    if (moveX) {
      for (let i = Math.abs(moveX); i--;) {
        this.animatedMove({ axis: Axis.Row, index: rowIndex, n: Math.sign(moveX) }, true);
      }
      pointersX.forEach((p) => (p.moveX = 0));
      window.state.placing = true;
      window.state.turn = window.state.turn === 0 ? 1 : 0;
    }
    pointer.col = col;

    const colIndex = ((pointer.col % this.columnCount) + this.columnCount) % this.columnCount;
    const pointersY = [...this.pointers.values()].filter((p) => p.col == colIndex);
    const moveY = Math.trunc(pointersY.reduce((a, b) => a + b.moveY, 0) / pointersY.length);

    if (moveY) {
      for (let i = Math.abs(moveY); i--;) {
        this.animatedMove({ axis: Axis.Col, index: colIndex, n: Math.sign(moveY) }, true);
      }
      pointersY.forEach((p) => (p.moveY = 0));
      window.state.placing = true;
      window.state.turn = window.state.turn === 0 ? 1 : 0;
    }
    pointer.row = row;
    pointer.x = x;
    pointer.y = y;
    this.repaint = true;
  };

  private addEventListeners() {
    let rect: DOMRect;

    this.canvas.addEventListener('mousedown', (event) => {
      if (event.button != 0) return;
      event.preventDefault();
      rect = this.canvas.getBoundingClientRect();
      this.canvas.focus();
      const cssX = event.clientX - rect.left;
      const cssY = event.clientY - rect.top;
      if (this.handleArrowClick(cssX * devicePixelRatio, cssY * devicePixelRatio)) return;
      this.onTouchStart(-1, cssX, cssY);
    });

    addEventListener('mousemove', (event) => {
      if (window.state.started && window.state.placing) {
        // Track cursor for slot highlight — cursor itself is the marble image
        const cr = this.canvas.getBoundingClientRect();
        this.cursorX = event.clientX - cr.left;
        this.cursorY = event.clientY - cr.top;
        this.isTouchHover = false;
        this.repaint = true;
      } else if (window.state.started) {
        // Show pointer cursor over clickable arrows
        const cr = this.canvas.getBoundingClientRect();
        const px = (event.clientX - cr.left) * devicePixelRatio;
        const py = (event.clientY - cr.top) * devicePixelRatio;
        const inRow = py >= this.by && py <= this.by + this.bh;
        const inCol = px >= this.bx && px <= this.bx + this.bw;
        const overArrow = (px < this.bx && inRow) || (px > this.bx + this.bw && inRow) ||
                          (py < this.by && inCol) || (py > this.by + this.bh && inCol);
        this.canvas.style.cursor = overArrow ? 'pointer' : 'move';
      }
      if (this.pointers.has(-1)) {
        this.onTouchMove(-1, event.clientX - rect.left, event.clientY - rect.top);
      }
    });

    addEventListener('mouseup', (event) => {
      this.pointers.delete(-1);
      if (!window.state.started || this.isMoving) {
        this.isMoving = false;
        this.repaint = true;
        return;
      }
      this.isMoving = false;
      event.preventDefault();
      if (window.state.placing) {
        const cr = this.canvas.getBoundingClientRect();
        this.tryPlacePiece(event.clientX - cr.left, event.clientY - cr.top);
      }
      this.repaint = true;
      this.notifyWinner(this.board.getGameWinner());
    });

    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      rect = this.canvas.getBoundingClientRect();
      for (const touch of event.changedTouches) {
        this.onTouchStart(touch.identifier, touch.clientX - rect.left, touch.clientY - rect.top);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (event) => {
      const cr = this.canvas.getBoundingClientRect();
      for (const touch of event.changedTouches) {
        if (window.state.started && window.state.placing) {
          // Show marble at finger position for touch feedback
          this.cursorX = touch.clientX - cr.left;
          this.cursorY = touch.clientY - cr.top;
          this.isTouchHover = true;
          this.repaint = true;
        } else {
          this.onTouchMove(touch.identifier, touch.clientX - rect.left, touch.clientY - rect.top);
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (event) => {
      const cr = this.canvas.getBoundingClientRect();
      for (const touch of event.changedTouches) {
        this.pointers.delete(touch.identifier);
        const tx = (touch.clientX - cr.left) * devicePixelRatio;
        const ty = (touch.clientY - cr.top) * devicePixelRatio;
        if (!this.handleArrowClick(tx, ty) && window.state.started && window.state.placing && !this.isMoving) {
          this.tryPlacePiece(touch.clientX - cr.left, touch.clientY - cr.top);
        }
      }
      this.cursorX = null;
      this.cursorY = null;
      this.isTouchHover = false;
      this.isMoving = false;
      this.repaint = true;
    });
  }
}
