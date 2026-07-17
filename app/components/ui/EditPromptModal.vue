<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <span class="tag">{{ item.category }}</span>
        <span class="modal-date">{{ formatDate(item.createdAt) }}</span>
      </div>
      <h3 class="modal-title">{{ item.title }}</h3>
      <textarea v-model="editContent" rows="12" class="modal-textarea" />
      <div class="modal-actions">
        <AppButton @click="emit('close')">取消</AppButton>
        <AppButton variant="primary" @click="handleSave">💾 保存修改</AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  item: { type: Object, required: true }
})

const emit = defineEmits(['close', 'save'])

const editContent = ref(props.item.content)

function handleSave() {
  emit('save', { id: props.item.id, content: editContent.value })
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-white);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.modal-date {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.modal-title {
  margin: 0 0 var(--space-md);
  font-size: var(--font-size-lg);
}

.modal-textarea {
  width: 100%;
  padding: var(--space-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-white);
  color: var(--color-text);
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.6;
  margin-bottom: var(--space-lg);
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.modal-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

.tag {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}
</style>
