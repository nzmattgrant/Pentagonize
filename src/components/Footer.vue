<template>
  <footer>
    <p v-if="showShortcuts" class="shortcuts-link">
      <a @click="shortcutsDialog = true">Show keyboard shortcuts</a>
    </p>
    <p>
      Created by
      <a
        target="_blank"
        rel="noopener"
        href=""
      >Matt Grant</a>.
    </p>
    <p>
      Remake of Janis Pritzkau's
      <a
        target="_blank"
        rel="noopener"
        href="https://github.com/janispritzkau"
      >Loopover</a>.
    </p>

    <ShortcutsDialog :open.sync="shortcutsDialog" />
  </footer>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator"
import ShortcutsDialog from "./ShortcutsDialog.vue"
import * as auth from "../auth"

@Component({
  components: {
    ShortcutsDialog
  }
})
export default class Footer extends Vue {
  shortcutsDialog = false

  get showShortcuts() {
    return !("ontouchstart" in window)
  }

  async signIn(provider: "google" | "discord") {
    switch (provider) {
      case "google": auth.signInWithGoogle(); break
      case "discord": auth.signInWithDiscord(); break
    }
  }

  async signOut() {
    auth.signOut()
  }
}
</script>

<style scoped>
footer {
  max-width: 480px;
  margin: 32px auto;
  padding: 0 16px;
  box-sizing: content-box;
}

p,
.auth {
  text-align: center;
}

.auth {
  margin: 28px auto 16px;
  font-size: 14px;
}

.auth a {
  margin: 0 6px;
}

.auth img {
  height: 32px;
  border-radius: 50%;
  vertical-align: middle;
  margin: -8px 8px -6px 0;
  user-select: none;
}
</style>
