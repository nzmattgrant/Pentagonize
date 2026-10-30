<template>
  <transition name="fade">
    <div
      v-if="open"
      class="dialog-container"
      :class="{ open }"
      @touchstart.self="clickOutside = true"
      @mousedown="clickOutside = $event.target == $el"
      @click="clickOutside && close($event)"
    >
      <div class="dialog" ref="dialog" tabindex="-1" @keydown.esc="close">
        <h3 class="title">{{ title }}</h3>
        <div class="content">
          <slot />
        </div>
        <div class="actions">
          <template v-if="$listeners.confirm">
            <button class="btn" @click="close">Cancel</button>
            <button class="btn primary" @click="$emit('confirm'), close()">Confirm</button>
          </template>
          <template v-else>
            <button class="btn outline" @click="close">Close</button>
          </template>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
  props: {
    open: Boolean,
    title: String
  },
  data() {
    return {
      clickOutside: true
    }
  },
  watch: {
    open() {
      if (this.open) setTimeout(() => {
        (this.$refs.dialog as HTMLDivElement).focus()
      })
    }
  },
  methods: {
    close(event?: Event) {
      if (event) event.stopPropagation()
      this.$emit("update:open", false)
    }
  }
})
</script>


<style scoped>
.dialog-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  pointer-events: none;
}

.fade-enter .dialog,
.fade-leave-to .dialog {
  transform: scale(0.75);
}

.dialog {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  min-width: 240px;
  max-width: 400px;
  width: 100%;
  max-height: 100%;
  border-radius: 20px;
  outline: 0;
  box-shadow: var(--shadow-raised);
  transition: transform 150ms ease-out;
}

.title,
.content,
.actions {
  padding: 0 24px;
}

.title {
  margin: 24px 0 12px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.content {
  flex-grow: 1;
  overflow: auto;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin: 16px 0 20px;
}</style>
