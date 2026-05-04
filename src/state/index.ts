import Vue from "vue"
import { State } from "./state"

export const state = new State()
export const vue = new Vue({ data: state })

if (localStorage.pentagonize) {
  try {
    const settings = JSON.parse(localStorage.pentagonize)
    if (settings.darkMode != null) state.darkMode = settings.darkMode
    if (settings.forceMobile != null) state.forceMobile = settings.forceMobile
    if (settings.animations != null) state.animations = settings.animations
    if (settings.transitionTime != null) state.transitionTime = settings.transitionTime
  } catch {}
}

vue.$watch(() => ({
  darkMode: state.darkMode,
  forceMobile: state.forceMobile,
  animations: state.animations,
  transitionTime: state.transitionTime,
}), (settings: Record<string, unknown>) => {
  localStorage.pentagonize = JSON.stringify(settings)
}, { deep: true })

vue.$watch(() => [state.cols, state.rows], () => {
  state.cols = Math.floor(Math.min(Math.max(state.cols, 1), 50))
  state.rows = Math.floor(Math.min(Math.max(state.rows, 1), 50))
})

Vue.nextTick(() => {
  vue.$watch(() => state.darkMode, (dark: boolean) => {
    document.body.classList.toggle("dark", dark)
    const meta = document.head.querySelector<HTMLMetaElement>("meta[name=theme-color]")!
    meta.content = getComputedStyle(document.body).getPropertyValue(`--background${dark ? "-darker" : ""}`)
  }, { immediate: true })
})

export * from "./state"
