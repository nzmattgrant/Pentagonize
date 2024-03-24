export class Tile {
    slots = [false, false, false, false];

    public setSlot(slot: number, value: boolean) {
        this.slots[slot] = value;
    }

    public resetSlots() {   
        this.slots = [false, false, false, false];
    }
}
