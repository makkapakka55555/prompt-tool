 <!-- placeholder、type（text/password）、label 属性 -->
<template>
  <div class="lc-input-wrapper">
    <label v-if="label" class="lc-input-label">{{ label }}</label>
    <input class="lc-input" :style="inputStyle" :placeholder="placeholder" :type="type" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
defineOptions({ name: 'LcInput' })

const props = defineProps({
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  label: { type: String, default: '' },
  width: { type: String, default: '' },
})

const inputStyle = computed(() => ({
  width: props.width || '100%',
}))
</script>

<style scoped>
.lc-input-wrapper {
  margin: 4px 0;
}
.lc-input-label {
  display: block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}
.lc-input {
  display: block;
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  box-sizing: border-box;
  background: var(--color-bg-white);
  color: var(--color-text);
}
.lc-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}
</style>
