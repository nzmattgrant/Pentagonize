export class Tile {
    public height: number = 0;
    public width: number = 0;

    public slots: number[][] = [];//0 = empty, 1 = p1, 2 = p2...

    constructor(width: number, height: number) {
        this.height = height;
        this.width = width;
        this.resetSlots();
    }

    public setSlot(x: number, y: number, value: number) {
        this.slots[x][y] = value;
    }

    public resetSlots() {   
        this.slots = Array.from({ length: this.height }, () => Array(this.width).fill(0));
        this.slots[0][0] = 1;
        this.slots[this.height - 1][this.width - 1] = 2;
    }
}
