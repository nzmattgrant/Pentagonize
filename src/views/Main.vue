<template>
  <div class="app">
    <div class="main-container">
      <div class="main-wrapper" :class="{ desktopMode }">
        <h1>Pentagonize</h1>

        <main ref="main">
          <div v-if="!desktopMode" class="top">
            <Solve class="solve" />
            <button class="btn" @click="handleMainButtonClick">{{ mainButtonText }}</button>
            <template v-if="$state.showUndoRedo">
              <div style="margin-left: 8px;" />
              <div class="fmc-top" :class="{ break: mainWidth < 380 }">
                <button class="btn" @click="$state.undo(true)" :disabled="!$state.undoable">
                  Undo
                  <br />to start
                </button>
                <button class="btn" @click="$state.redo(true)" :disabled="!$state.redoable">
                  Redo
                  <br />to end
                </button>
              </div>
              <RepeatButton class="btn" @click="$state.undo()" :disabled="!$state.undoable">Undo</RepeatButton>
              <RepeatButton class="btn" @click="$state.redo()" :disabled="!$state.redoable">Redo</RepeatButton>
            </template>
          </div>

          <canvas ref="canvas" :style="{cursor: $state.started && !$state.placing ? 'move' : 'pointer'}" />

          <div class="bottom">
            <button class="btn" @click="eventDialog = true">Event: {{ eventName }}</button>
            <div style="flex-grow: 1;"></div>
            <button class="btn" @click="settingsDialog = true">Settings</button>
          </div>
        </main>

        <aside v-if="desktopMode" :style="{ width: sidebarWidth + 'px' }">
          <button class="btn filled" @click="handleMainButtonClick">{{ mainButtonText }}</button>
          <div v-if="$state.showUndoRedo" class="fmc-button-wrapper">
            <RepeatButton class="btn" @click="$state.undo()" :disabled="!$state.undoable">Undo</RepeatButton>
            <RepeatButton class="btn" @click="$state.redo()" :disabled="!$state.redoable">Redo</RepeatButton>
            <button class="btn" @click="$state.undo(true)" :disabled="!$state.undoable">Undo to start</button>
            <button class="btn" @click="$state.redo(true)" :disabled="!$state.redoable">Redo to end</button>
          </div>

          <transition name="record">
            <p v-if="newRecord" class="new-record">{{ newRecord }}</p>
          </transition>

          <div v-if="$state.started" :style="{ backgroundColor: $state.turn === 0 ? 'red' : 'blue', color: 'white', padding: '10px', marginBottom: '10px' }">
            {{ "Player" + ($state.turn === 0 ? " 1 turn" : " 2 turn") }}
          </div>
          <div v-if="$state.started" style="padding: 10px;">
            {{ ($state.placing ? "Placing piece" : "Turning tile") }}
          </div>

          <SolveList :solves="$state.solves" :limit="sidebarLimit" :fmc="fmc" />
        </aside>
      </div>
    </div>

    <section v-if="$state.inspecting" class="inspect">
      <time>{{ formatDate($state.startTime) }}</time>
      <button class="btn" @click="$state.replay(!$state.replaying)" :disabled="!$state.redoable && !$state.replaying">
        <svg height="24" viewBox="0 0 24 24" width="24" style="margin-right: 8px;">
          <path v-if="!$state.replaying" d="M8 5v14l11-7z" fill="currentColor" />
          <path v-else d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
        </svg>
        {{ $state.replaying ? "Pause" : "Start" }} replay
      </button>
    </section>

    <Solutions v-if="fmc" />


    <EventDialog :open.sync="eventDialog" />
    <SettingsDialog :open.sync="settingsDialog" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator"
import { Game, Move, Board } from "../game"

import Dialog from "../components/Dialog.vue"
import SettingsDialog from "../components/SettingsDialog.vue"
import EventDialog from "../components/EventDialog.vue"
import RepeatButton from "../components/RepeatButton.vue"
import SolveView from "../components/Solve.vue"
import SolveList from "../components/SolveList.vue"
import Solutions from "../components/Solutions.vue"
import { state, EventType } from "../state"

@Component({
  components: {
    SolveList,
    RepeatButton,
    Statistics: async () => (await import("../components/Statistics.vue")).default,
    Solutions,
    Dialog,
    EventDialog,
    SettingsDialog,
    Solve: Vue.extend({
      render: h => h(SolveView, {
        props: {
          current: true,
          time: state.displayTime,
          moves: state.moves,
          fmc: state.event == EventType.Fmc,
          dnf: state.dnf
        }
      })
    })
  }
})
export default class App extends Vue {
  $refs!: {
    canvas: HTMLCanvasElement
    main: HTMLDivElement
  }

  game!: Game

  refresh: Function | null = null

  eventDialog = false
  settingsDialog = false

  desktopMode = false
  sidebarWidth = 240
  sidebarLimit = 12
  mainWidth = 0

  get fmc() {
    return state.event == EventType.Fmc
  }

  get eventName() {
    return `${state.cols}×${state.rows}`
      + ["", " FMC", " BLD"][state.event]
      + (state.noRegrips ? " NRG" : "")
  }

  get newRecord() {
    const record = state.newRecord
    if (!record) return
    return record.averageOf == 1
      ? `New personal best (-${record.fmc
        ? record.difference + "\xa0moves"
        : record.difference / 1000 + "s"})`
      : `New best average of ${record.averageOf} (-${record.fmc
        ? Math.round(record.difference * 10) / 10 + "\xa0moves"
        : Math.round(record.difference) / 1000 + "s"})`
  }

  get mainButtonText() {
    return state.inSolvingPhase || state.started
      ? "Done"
      : "Play game"
  }

  formatDate(time: number) {
    return new Date(time - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, -5).replace("T", " ")
  }

  handleMainButtonClick() {
    if(!state.started) {
      state.start();
      return;
    }
    state.reset();
  }

  updateSize() {
    const { columnCount, rowCount } = this.game
    const aspect = columnCount / rowCount

    const mobileWidth = this.$el.clientWidth - 32
    const mobileHeight = Math.max(150 + 150 / aspect, innerHeight - 32 * 3 - 96)

    const desktopWidth = this.$el.clientWidth - this.sidebarWidth - 32
    const desktopHeight = innerHeight - 32 * 3 - 48

    this.desktopMode = !state.forceMobile
      // choose desktop mode if the canvas size is bigger than in mobile mode
      && (Math.min(mobileWidth / aspect, mobileHeight) < Math.min(desktopWidth / aspect, desktopHeight))
      && rowCount > 1
      && desktopHeight > 320 // minimum height of sidebar

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

    this.sidebarLimit = this.desktopMode
      ? ~~((this.game.height / devicePixelRatio - (state.showUndoRedo ? 200 : 150)) / 36)
      : 0
  }

  mounted() {
    const game = new Game(this.$refs.canvas, state.cols, state.rows)
    state.game = this.game = game
    this.game.onMove = state.handleMove.bind(this.$state)

    this.$watch(() => [state.cols, state.rows, state.event, state.noRegrips], () => {
      state.game.setBoardSize(state.cols, state.rows)
      state.reset()
    }, { immediate: true })

    this.$watch(() => [state.darkText, state.boldText, state.letterSystem, state.transitionTime, state.animations], () => {
      state.game.setDarkText(state.darkText)
      state.game.setBoldText(state.boldText)
      state.game.setLetterSystem(state.letterSystem)
      state.game.transitionTime = state.animations ? state.transitionTime : 0
    }, { immediate: true })

    this.$refs.canvas.addEventListener("keydown", event => {
      switch (event.key) {
        case "u": state.showUndoRedo && state.undo(); break
        case "r": state.showUndoRedo && state.redo(); break
        case "Enter": this.handleMainButtonClick(); break
        default: return
      }
    })

    this.$refs.canvas.style.transition = "null"

    this.$watch(() => [
      state.cols, state.rows, state.showUndoRedo, state.forceMobile
    ], this.updateSize, { immediate: true })

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

.top {
  position: absolute;
  width: 100%;
  height: 0;
  display: flex;
  align-items: flex-end;
  transform: translateY(-8px);
}

.bottom {
  height: 0;
  transform: translateY(8px);
  display: flex;
}

.btn {
  flex-shrink: 0;
}

.btn.filled {
  width: 100%;
  height: 48px;
  margin-bottom: 16px;
}

.top .solve {
  flex-grow: 1;
  min-width: 0;
}

.fmc-top {
  position: absolute;
  right: 0;
  bottom: 50px;
}

.fmc-top:not(.break) br {
  display: none;
}

.fmc-top .btn {
  height: auto;
  min-height: 36px;
  padding: 4px 8px;
}

.fmc-button-wrapper {
  display: flex;
  flex-wrap: wrap;
  margin-top: -8px;
}

.fmc-button-wrapper .btn {
  width: 50%;
  padding: 0;
  margin-bottom: 8px;
}

.current-solve {
  margin-bottom: 12px;
}

.new-record {
  font-size: 18px;
  font-weight: 500;
  color: var(--green);
  margin: 0 0 8px;
  display: inline-block;
}

.record-enter-active {
  transition: all 0.6s;
}

.record-leave-active {
  transition: opacity 0.2s;
}

.record-enter {
  transform: translateY(-40px) scale(1.2);
  opacity: 0;
}

.record-leave-to {
  opacity: 0;
}

section {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: content-box;
}

section:not(.inspect)::before {
  content: "";
  display: block;
  margin-bottom: 32px;
}

section:not(.inspect):after {
  content: "";
  display: block;
  margin-top: 31px;
  border-bottom: 1px solid var(--contrast-2);
}

section.inspect {
  display: flex;
  align-items: center;
  margin-top: 16px;
  margin-bottom: -16px;
}

.inspect time {
  flex-grow: 1;
  font-size: 14px;
  opacity: 0.8;
}
</style>
