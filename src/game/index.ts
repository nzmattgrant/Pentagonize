export * from "./board"
export * from "./game"

export enum Axis {
  Row,
  Col
}

export interface Move {
  axis: Axis
  index: number
  n: number
}
