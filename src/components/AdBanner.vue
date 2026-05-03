<template>
  <div v-if="enabled" class="ad-banner">
    <ins
      class="adsbygoogle"
      style="display:block"
      :data-ad-client="pubId"
      :data-ad-slot="slotId"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator"

@Component({})
export default class AdBanner extends Vue {
  @Prop({ default: "" }) slotId!: string

  get pubId() {
    return process.env.VUE_APP_ADSENSE_PUB_ID || ""
  }

  get enabled() {
    return !!this.pubId && !!this.slotId
  }

  mounted() {
    if (this.enabled) {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    }
  }
}
</script>

<style scoped>
.ad-banner {
  max-width: 728px;
  margin: 0 auto;
  padding: 8px 16px;
}
</style>
