<template>
    <img class="lc-image"
        :src="src" :alt="alt" :style="imgStyle"
    />
</template>

<script setup>
import { computed } from 'vue'
defineOptions({ name: 'LcImage' })

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  width: { type: String, default: '100%' },
})

const imgStyle = computed(() => ({
  width: props.width,
  maxWidth: '100%',
  borderRadius: '6px',
}))
</script>
<style scoped>
.lc-image {
  display: block;
  margin: 4px 0;
}
</style>
