<template>
  <div class="app">
    <div class="main-container">
      <header class="app-header">
        <h1>Pentagonize</h1>
        <button class="settings-btn btn" @click="settingsDialog = true" title="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
      </header>

      <div class="main-wrapper" :class="{ desktopMode }">
        <main ref="main">
          <canvas ref="canvas" />
        </main>

        <div v-if="!desktopMode" class="mobile-controls">
          <div class="mobile-actions">
            <button class="btn filled mobile-play-btn" @click="handleMainButtonClick">{{ mainButtonText }}</button>
          </div>

          <div v-if="$state.started" class="turn-indicator" :style="{ backgroundColor: $state.turn === 0 ? 'red' : 'blue' }">
            {{ "Player" + ($state.turn === 0 ? " 1 turn" : " 2 turn") }}
          </div>
          <div v-if="$state.started" class="phase-indicator">
            {{ ($state.placing ? "Placing piece" : "Turning tile") }}
          </div>

          <div class="how-to-play">
            <h3>How to Play</h3>
            <ol>
              <li><strong>Place</strong> — click an empty slot on the board to place your marble.</li>
              <li><strong>Slide</strong> — click an arrow on the board edge (or drag a row/column) to shift tiles.</li>
              <li><strong>Win</strong> — be the first to get 5 marbles in a row, column, or diagonal.</li>
            </ol>
          </div>
        </div>

        <aside v-if="desktopMode" :style="{ width: sidebarWidth + 'px' }">
          <button class="btn filled" @click="handleMainButtonClick">{{ mainButtonText }}</button>

          <div v-if="$state.started" :style="{ backgroundColor: $state.turn === 0 ? 'red' : 'blue', color: 'white', padding: '10px', marginBottom: '10px' }">
            {{ "Player" + ($state.turn === 0 ? " 1 turn" : " 2 turn") }}
          </div>
          <div v-if="$state.started" style="padding: 10px;">
            {{ ($state.placing ? "Placing piece" : "Turning tile") }}
          </div>

          <div class="how-to-play">
            <h3>How to Play</h3>
            <ol>
              <li><strong>Place</strong> — click an empty slot on the board to place your marble.</li>
              <li><strong>Slide</strong> — click an arrow on the board edge (or drag a row/column) to shift tiles.</li>
              <li><strong>Win</strong> — be the first to get 5 marbles in a row, column, or diagonal.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>

    <SettingsDialog :open.sync="settingsDialog" />

    <transition name="winner-fade">
      <div v-if="winner !== 0" class="winner-overlay">
        <div class="winner-dialog">
          <div class="winner-marble" :style="{ background: winner === 1 ? 'darkred' : 'darkblue' }">
            <div class="winner-marble-glint" />
          </div>
          <h2 class="winner-title">Player {{ winner }} wins!</h2>
          <p class="winner-sub">Congratulations!</p>
          <div class="winner-actions">
            <button class="btn" @click="winner = 0">Close</button>
            <button class="btn filled winner-play-again" @click="restartGame">Play Again</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator"
import { Game } from "../game"

import Dialog from "../components/Dialog.vue"
import SettingsDialog from "../components/SettingsDialog.vue"
import { state } from "../state"

@Component({
  components: {
    Dialog,
    SettingsDialog,
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

  desktopMode = false
  sidebarWidth = 240
  mainWidth = 0

  get mainButtonText() {
    return state.started ? "Done" : "Play game"
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
    state.reset().then(() => state.start())
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
      && rowCount > 1
      && desktopHeight > 320

    const width = this.desktopMode ? desktopWidth : mobileWidth
    const height = this.desktopMode ? desktopHeight : mobileHeight

    if (width / aspect < height) {
      this.game.setWidth(Math.min(width, columnCount * 50 + 250 * Math.max(aspect, 1)))
    } else {
      this.game.setHeight(Math.min(height, rowCount * 50 + 250 / Math.min(aspect, 1)))
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

    this.$watch(() => [state.cols, state.rows], () => {
      state.game.setBoardSize(state.cols, state.rows)
      state.reset()
    }, { immediate: true })

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
    this.$watch(() => [state.cols, state.rows, state.forceMobile], this.updateSize, { immediate: true })
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

.main-container {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  background: var(--background-darker);
  border-bottom: 1px solid var(--contrast-2);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--contrast-2);
}

.settings-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 6px;
  opacity: 0.6;
}

.settings-btn:hover {
  opacity: 1;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 24px 16px 32px;
}

.mobile-controls {
  width: 100%;
  padding-top: 8px;
}

.mobile-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
}

.mobile-play-btn {
  flex: 1;
  height: 44px;
  margin-bottom: 0;
}

.turn-indicator {
  color: white;
  padding: 10px;
  margin-bottom: 10px;
}

.phase-indicator {
  padding: 10px;
  margin-bottom: 10px;
}

h1 {
  font-weight: 900;
  font-size: 22px;
  line-height: 1;
  margin: 0;
}

main {
  transition: width 0.2s;
}

canvas {
  display: block;
  margin: 0 auto;
  border-radius: 4px;
  outline: 0;
  transition: all 0.2s;
  touch-action: none;
}

aside {
  padding: 0 0 0 16px;
}

.how-to-play {
  margin-top: 24px;
  padding: 14px 16px;
  background: var(--background);
  border: 1px solid var(--contrast-2);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.55;
}

.how-to-play h3 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
}

.how-to-play ol {
  margin: 0 0 10px;
  padding-left: 18px;
}

.how-to-play li {
  margin-bottom: 6px;
}

.btn.filled {
  width: 100%;
  height: 48px;
  margin-bottom: 16px;
}

.winner-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  z-index: 200;
  padding: 16px;
}

.winner-dialog {
  background: var(--background);
  border-radius: 6px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
  padding: 40px 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 260px;
  max-width: 360px;
  width: 100%;
}

.winner-marble {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  position: relative;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.winner-marble-glint {
  position: absolute;
  top: 18%;
  left: 20%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.32);
}

.winner-title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 900;
}

.winner-sub {
  margin: 0 0 28px;
  opacity: 0.6;
}

.winner-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: flex-end;
}

.winner-play-again {
  width: auto;
  height: auto;
  margin-bottom: 0;
  padding: 8px 20px;
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
