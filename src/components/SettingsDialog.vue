<template>
  <Dialog title="Settings" :open="open" @update:open="$emit('update:open', $event)">
    <label class="checkbox">
      <input v-model="$state.darkMode" type="checkbox" />
      <span>Dark mode</span>
    </label>
    <label class="checkbox">
      <input v-model="$state.forceMobile" type="checkbox" />
      <span>Force mobile mode</span>
    </label>
    <label class="checkbox">
      <input v-model="$state.animations" type="checkbox" />
      <span>Enable animations</span>
    </label>

    <label class="label" v-if="$state.animations">Transition speed</label>
    <div class="slider-container" v-show="$state.animations">
      <Slider class="slider" :min="100" :max="200" :step="10" v-model="$state.transitionTime"/>
      <span>{{ $state.transitionTime }} ms</span>
    </div>
  </Dialog>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator"
import Dialog from "./Dialog.vue"
import Slider from "./Slider.vue"

@Component({
  components: {
    Slider,
    Dialog
  }
})
export default class SettingsDialog extends Vue {
  @Prop(Boolean) open!: boolean
}
</script>

<style scoped>
.label {
  margin-top: 16px;
}

.slider-container {
  display: flex;
  align-items: center;
}

.slider {
  flex-grow: 1;
}

.slider-container span {
  font-size: 14px;
  margin: 0 0 0 16px;
  opacity: 0.6;
}
</style>
