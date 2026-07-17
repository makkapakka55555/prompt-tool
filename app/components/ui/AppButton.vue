<template>
  <button
    class="app-btn"
    :class="[
      `app-btn--${variant}`,
      { 'app-btn--loading': loading }
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="app-btn__spinner"></span>
    <span class="app-btn__text"><slot /></span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'default' | 'danger'
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  loading: false,
  disabled: false,
})
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-xl);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--color-border);
  background: var(--color-bg-white);
  color: var(--color-text);
  line-height: 1.5;
}

.app-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.app-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Primary */
.app-btn--primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.app-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: var(--color-text-inverse);
}

/* Danger */
.app-btn--danger {
  color: var(--color-error);
  border-color: var(--color-error);
}

.app-btn--danger:hover:not(:disabled) {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

/* Loading */
.app-btn--loading {
  pointer-events: none;
}

.app-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
