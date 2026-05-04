<template>
  <div class="app">
    <div class="main-container">
      <div class="main-wrapper" :class="{ desktopMode }">
        <h1>Pentagonize</h1>

        <main ref="main">
          <canvas ref="canvas" />

          <div class="bottom">
            <div style="flex-grow: 1;"></div>
            <button class="btn" @click="settingsDialog = true">Settings</button>
          </div>
        </main>

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

    const mobileWidth = this.$el.clientWidth - 32
    const mobileHeight = Math.max(150 + 150 / aspect, innerHeight - 32 * 3 - 96)

    const desktopWidth = this.$el.clientWidth - this.sidebarWidth - 32
    const desktopHeight = innerHeight - 32 * 3 - 48

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
  align-items: center;
  justify-content: flex-end;
  background: var(--background-darker);
  border-bottom: 1px solid var(--contrast-2);
}

.main-wrapper {
  position: relative;
  display: flex;
  margin: 32px 0;
  padding-bottom: 32px;
  padding-top: 96px;
}

.main-wrapper.desktopMode {
  padding-top: 48px;
}

h1 {
  position: absolute;
  top: 0;
  font-weight: 900;
  font-size: 30px;
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

.bottom {
  height: 0;
  transform: translateY(8px);
  display: flex;
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
