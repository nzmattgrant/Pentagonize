<template>
  <section>
    <div class="btn-container">
      <button
        class="btn"
        @click="saveSolution"
        :disabled="!$state.started || $state.moves.length == 0"
      >Save solution</button>
    </div>
    <p
      v-if="solutions.length == 0"
      class="hint"
    >You can save different solutions here during the solve.</p>
  </section>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator"
import { Move } from '../game'
import { vue } from "../state"

interface Solution {
  moves: Move[]
  undos: number
}

@Component({})
export default class Solutions extends Vue {
  solutions: Solution[] = []

  get list() {
    return this.solutions.map((s, i) => [s, i]).reverse()
  }

  reset() {
    this.solutions = []
  }

  mounted() {
    vue.$on("reset", this.reset)
  }

  beforeDestroy() {
    vue.$off("reset", this.reset)
  }

  saveSolution() {
    this.solutions.push({
      moves: [...this.$state.moveHistory],
      undos: this.$state.undos
    })
  }

  deleteSolution(i: number) {
    this.solutions.splice(i, 1)
  }
}
</script>

<style scoped>
.btn-container {
  text-align: center;
  margin-top: -8px;
  margin-bottom: 16px;
}

.solution {
  position: relative;
  display: flex;
  align-items: center;
  height: 36px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: background 0.2s;
}

.solution:active {
  background: var(--contrast-3);
}

.number {
  font-weight: bold;
  margin-right: 16px;
  flex-grow: 1;
}

.info {
  opacity: 0.8;
  margin-right: 8px;
}

.solution .btn {
  flex-shrink: 0;
  font-size: 20px;
  width: 36px;
  border-radius: 50%;
}

.hint {
  opacity: 0.8;
}
</style>
