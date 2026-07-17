<template>
  <div class="app-card" :class="`app-card--${variant}`">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'outlined'
}
//设置默认值为default
withDefaults(defineProps<Props>(), {
  variant: 'default',
})
</script>

<style scoped>
.app-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.app-card--default {
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.app-card--outlined {
  border: 1px solid var(--color-border);
}
</style>
