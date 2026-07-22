<template>
    <div class="lc-select-wrapper">
        <label v-if="label" class="lc-select-label">{{ label }}</label>
        <select class="lc-select" :style="selectStyle">
            <option v-for="opt in options" :key="getVal(opt)" :value="getVal(opt)">{{ getLabel(opt) }}</option>
        </select>
    </div>
</template>
<script setup>
import { computed } from 'vue'
defineOptions({ name: 'LcSelect' })

const props = defineProps({
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  width: { type: String, default: '100%' }
})

function getLabel(opt) {
  return typeof opt === 'object' ? (opt.label || opt.value || '') : opt
}
function getVal(opt) {
  return typeof opt === 'object' ? (opt.value || opt.label || '') : opt
}

const selectStyle = computed(() => ({
  width: props.width || '100%',
}))
</script>
<style scoped>
.lc-select-wrapper { margin: 4px 0; }
.lc-select-label {
    display: block; font-size: 13px;
    color: var(--color-text-secondary); margin-bottom: 4px;
}
.lc-select {
    display: block; width: 100%; padding: 8px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md);
    font-size: 14px; box-sizing: border-box;
    background: var(--color-bg-white); color: var(--color-text); cursor: pointer;
}
</style>