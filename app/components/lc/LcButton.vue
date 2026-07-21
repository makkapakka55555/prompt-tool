<template>
  <button
    :class="['lc-btn', `lc-btn--${type}`]"
    :disabled="disabled"
    :style="btnStyle"
    class="dynamic-node"
  >
    {{ text }}
  </button>
</template>

<script setup>
import { computed } from 'vue'
defineOptions({ name: 'LcButton' })

const props = defineProps({
  text: { type: String, default: '按钮' },
  type: { type: String, default: 'primary' },
  disabled: { type: Boolean, default: false },
  width: { type: String, default: '' },
})

const btnStyle = computed(() => ({
  width: props.width || '100%',
}))
</script>

<style scoped>
.lc-btn {
  display: block;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity 0.2s;
  box-sizing: border-box;
}
.lc-btn:hover { opacity: 0.85; }
.lc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.lc-btn--primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.lc-btn--danger {
  background: var(--color-error);
  color: #fff;
  border-color: var(--color-error);
}
.lc-btn--default {
  background: var(--color-bg-white);
  color: var(--color-text);
  border-color: var(--color-border);
}
</style>
