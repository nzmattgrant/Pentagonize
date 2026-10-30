import { Game } from "../game"

export class State {
  cols = 3
  rows = 3

  darkMode = false
  forceMobile = false
  animations = true
  transitionTime = 100

  started = false
  turn = 0
  placing = true

  game!: Game
  reloadPage: Function | null = null

  start() {
    this.started = true
    this.turn = 0
    this.placing = true
  }

  reset() {
    this.started = false
    this.placing = true
    this.turn = 0
    this.game.setBoardSize(this.cols, this.rows)
  }
}
