<template>
  <div v-if="erred" class="error-boundary">
    <div class="error-boundary-icon">⚠️</div>
    <h3 class="error-boundary-title">出错了</h3>
    <p class="error-boundary-desc">{{ error?.message || '组件加载失败' }}</p>
    <button class="error-boundary-btn" @click="reset">🔄 重试</button>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const erred = ref(false)
const error = ref(null)

onErrorCaptured((err) => {
  erred.value = true
  error.value = err
  console.error('ErrorBoundary 捕获:', err)
  return false // 阻止继续冒泡
})

function reset() {
  erred.value = false
  error.value = null
}
</script>

<style scoped>
.error-boundary {
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-secondary, #666);
}

.error-boundary-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.error-boundary-title {
  margin: 0 0 8px;
  font-size: 18px;
  color: var(--color-text, #333);
}

.error-boundary-desc {
  margin: 0 0 20px;
  font-size: 14px;
}

.error-boundary-btn {
  padding: 8px 20px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-white);
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
}

.error-boundary-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
