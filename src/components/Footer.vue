<template>
  <footer>
    <p>
      Created by
      <a target="_blank" rel="noopener" href="">Matt Grant</a>.
    </p>
  </footer>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator"

@Component({})
export default class Footer extends Vue {}
</script>

<style scoped>
footer {
  max-width: 480px;
  margin: 32px auto;
  padding: 0 16px;
  box-sizing: content-box;
}

p {
  text-align: center;
}
</style>
