<template>
  <textarea
    class="app-textarea"
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="onInput"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  rows?: number
  placeholder?: string
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.app-textarea {
  width: 100%;
  padding: var(--space-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-white);
  color: var(--color-text);
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  line-height: 1.6;
}

.app-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.app-textarea:disabled {
  background: var(--color-border-light);
  cursor: not-allowed;
}

.app-textarea::placeholder {
  color: var(--color-text-tertiary);
}
</style>
