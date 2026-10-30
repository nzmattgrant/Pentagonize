export class Tile {
    public slots: number[][];//0 = empty, 1 = p1, 2 = p2...

    constructor(width: number, height: number) {
        this.slots = Array.from({ length: height }, () => Array(width).fill(0));
    }
}
