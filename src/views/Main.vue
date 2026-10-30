<template>
  <div class="app">
    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <div class="logo" aria-hidden="true">
            <span class="hole"><span class="marble player-1" /></span>
            <span class="hole" />
            <span class="hole" />
            <span class="hole"><span class="marble player-2" /></span>
          </div>
          <h1>Pentagonize</h1>
        </div>
        <button class="settings-btn btn" @click="settingsDialog = true" title="Settings">
          <SettingsIcon />
        </button>
      </div>
    </header>

    <div class="main-wrapper" :class="{ desktopMode }">
      <main ref="main">
        <canvas ref="canvas" />
      </main>

      <aside :style="{ width: (desktopMode ? sidebarWidth : mainWidth) + 'px' }">
        <section class="card status">
          <div class="players" :class="{ started: $state.started }">
            <div
              v-for="player in players"
              :key="player"
              class="player"
              :class="[`player-${player}`, { active: $state.started && $state.turn + 1 === player }]"
            >
              <span class="marble" />
              Player {{ player }}
            </div>
          </div>
          <div class="phase">
            <span class="phase-step">{{ phase.step }}</span>
            <span class="phase-text">{{ phase.text }}</span>
          </div>
        </section>

        <button class="btn main-btn" :class="$state.started ? 'outline' : 'primary'" @click="handleMainButtonClick">
          {{ mainButtonText }}
        </button>

        <section class="card how-to-play">
          <h3>How to play</h3>
          <ol>
            <li><strong>Place</strong> — click an empty slot on the board to place your marble.</li>
            <li><strong>Slide</strong> — click an arrow on the board edge (or drag a row/column) to shift tiles.</li>
            <li><strong>Win</strong> — be the first to get 5 marbles in a row, column, or diagonal.</li>
          </ol>
        </section>
      </aside>
    </div>

    <SettingsDialog :open.sync="settingsDialog" />

    <transition name="winner-fade">
      <div v-if="winner !== 0" class="winner-overlay">
        <div class="winner-dialog">
          <div class="marble winner-marble" :class="`player-${winner}`" />
          <h2 class="winner-title">Player {{ winner }} wins!</h2>
          <p class="winner-sub">Congratulations!</p>
          <div class="winner-actions">
            <button class="btn outline" @click="winner = 0">Close</button>
            <button class="btn primary" @click="restartGame">Play again</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator"
import { Game } from "../game"

import SettingsDialog from "../components/SettingsDialog.vue"
import SettingsIcon from "../components/SettingsIcon.vue"
import { state } from "../state"

// CSS pixels, for the longer side of the canvas
const MAX_CANVAS_SIZE = 560

@Component({
  components: {
    SettingsDialog,
    SettingsIcon,
  }
})
export default class App extends Vue {
  $refs!: {
    canvas: HTMLCanvasElement
    main: HTMLDivElement
  }

  game!: Game

  settingsDialog = false
  winner = 0
  players = [1, 2]

  desktopMode = false
  sidebarWidth = 300
  mainWidth = 0

  get mainButtonText() {
    return state.started ? "End game" : "Play game"
  }

  get phase() {
    if (!state.started) return { step: "Ready", text: "Press Play game to start" }
    return state.placing
      ? { step: "Step 1 of 2", text: "Place a marble" }
      : { step: "Step 2 of 2", text: "Slide a row or column" }
  }

  handleMainButtonClick() {
    if (!state.started) {
      state.start()
      return
    }
    this.winner = 0
    state.reset()
  }

  restartGame() {
    this.winner = 0
    state.reset()
    state.start()
  }

  updateSize() {
    const { columnCount, rowCount } = this.game
    const aspect = columnCount / rowCount

    const headerHeight = 56

    const mobileWidth = this.$el.clientWidth - 32
    const mobileHeight = Math.max(150 + 150 / aspect, innerHeight - headerHeight - 32 * 2 - 96)

    const desktopWidth = this.$el.clientWidth - this.sidebarWidth - 32
    const desktopHeight = innerHeight - headerHeight - 32 * 2 - 32

    this.desktopMode = !state.forceMobile
      && (Math.min(mobileWidth / aspect, mobileHeight) < Math.min(desktopWidth / aspect, desktopHeight))
      && desktopHeight > 320

    const width = this.desktopMode ? desktopWidth : mobileWidth
    const height = this.desktopMode ? desktopHeight : mobileHeight

    if (width / aspect < height) {
      this.game.setWidth(Math.min(width, MAX_CANVAS_SIZE * Math.min(aspect, 1)))
    } else {
      this.game.setHeight(Math.min(height, MAX_CANVAS_SIZE / Math.max(aspect, 1)))
    }

    this.mainWidth = Math.max(Math.min(mobileWidth, 320), this.game.width / devicePixelRatio)

    if (this.$refs.main) {
      this.$refs.main.style.width = `${this.mainWidth}px`
    }
  }

  mounted() {
    const game = new Game(this.$refs.canvas, state.cols, state.rows)
    state.game = this.game = game
    game.onWin = (w) => { this.winner = w }

    this.$watch(() => [state.transitionTime, state.animations], () => {
      state.game.transitionTime = state.animations ? state.transitionTime : 0
    }, { immediate: true })

    this.$refs.canvas.addEventListener("keydown", event => {
      switch (event.key) {
        case "Enter": this.handleMainButtonClick(); break
        default: return
      }
    })

    this.$refs.canvas.style.transition = "null"
    this.$watch(() => state.forceMobile, this.updateSize, { immediate: true })
    document.body.clientWidth
    this.$refs.canvas.style.transition = ""

    window.addEventListener("resize", this.updateSize)
  }

  destroyed() {
    state.reset()
    window.removeEventListener("resize", this.updateSize)
  }
}
</script>

<style scoped>
.app {
  overflow-x: hidden;
}

.app-header {
  height: 56px;
  border-bottom: 1px solid var(--contrast-2);
  background: var(--surface);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 960px;
  height: 100%;
  margin: 0 auto;
  padding: 0 8px 0 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  width: 30px;
  height: 30px;
  padding: 4px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--tile-light), var(--tile-dark));
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.25);
}

.logo .hole {
  display: flex;
  padding: 1px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--hole-dark), var(--hole-light));
}

.logo .marble {
  flex: 1;
}

h1 {
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.02em;
  line-height: 1;
  margin: 0;
}

.settings-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--contrast-0);
}

.settings-btn:hover {
  color: var(--contrast);
}

.main-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 16px 32px;
}

.main-wrapper.desktopMode {
  flex-wrap: nowrap;
  align-items: center;
}

main {
  transition: width 0.2s;
}

canvas {
  display: block;
  margin: 0 auto;
  outline: 0;
  transition: all 0.2s;
  touch-action: none;
}

aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.desktopMode aside {
  padding: 0 0 0 32px;
}

.status {
  padding: 8px;
}

.players {
  display: flex;
  gap: 8px;
}

.player {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  transition: opacity 200ms, background 200ms, border-color 200ms;
}

.player .marble {
  width: 18px;
  height: 18px;
}

.players.started .player:not(.active) {
  opacity: 0.45;
}

.player.active {
  background: var(--contrast-3);
  border-color: var(--base);
}

.phase {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 10px 6px;
}

.phase-step {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--contrast-0);
}

.phase-text {
  font-size: 16px;
  font-weight: 600;
}

.main-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.how-to-play {
  padding: 16px 18px 6px;
  font-size: 13.5px;
  line-height: 1.55;
}

.how-to-play h3 {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--contrast-0);
}

.how-to-play ol {
  list-style: none;
  counter-reset: step;
  margin: 0;
  padding: 0;
}

.how-to-play li {
  counter-increment: step;
  position: relative;
  padding-left: 32px;
  margin-bottom: 12px;
}

.how-to-play li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: var(--contrast-3);
  border: 1px solid var(--contrast-2);
  font-size: 11px;
  font-weight: 700;
}

.winner-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  padding: 16px;
}

.winner-dialog {
  background: var(--surface);
  border-radius: 20px;
  box-shadow: var(--shadow-raised);
  padding: 40px 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 260px;
  max-width: 360px;
  width: 100%;
  transition: transform 200ms ease-out;
}

.winner-marble {
  width: 72px;
  height: 72px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.winner-title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.winner-sub {
  margin: 0 0 28px;
  color: var(--contrast-0);
}

.winner-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.winner-actions .btn {
  flex: 1;
  height: 44px;
}

.winner-fade-enter-active,
.winner-fade-leave-active {
  transition: opacity 200ms;
}

.winner-fade-enter,
.winner-fade-leave-to {
  opacity: 0;
}

.winner-fade-enter .winner-dialog,
.winner-fade-leave-to .winner-dialog {
  transform: scale(0.85);
}
</style>
