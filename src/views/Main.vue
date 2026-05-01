<template>
  <div class="app">
    <div class="main-container">
      <div class="main-wrapper" :class="{ desktopMode }">
        <h1>Pentagonize</h1>

        <main ref="main">
          <canvas ref="canvas" :style="{cursor: $state.started && !$state.placing ? 'move' : 'pointer'}" />

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
        </aside>
      </div>
    </div>

    <SettingsDialog :open.sync="settingsDialog" />
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
    state.reset()
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
</style>
