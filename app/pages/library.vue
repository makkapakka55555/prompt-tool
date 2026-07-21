<template>
  <div>
    <h2 class="page-title">📚 {{ categoryFilter ? categoryLabels[categoryFilter] + ' - ' : '' }}提示词库</h2>
    <p class="page-desc">共 {{ filteredPrompts.length }} 条保存的提示词</p>

    <!-- 空状态 -->
    <div v-if="filteredPrompts.length === 0" class="empty">
      <p class="empty-icon">📭</p>
      <p>{{ categoryFilter ? '该分类下还没有提示词' : '还没有保存的提示词' }}</p>
    </div>

    <!-- 提示词列表 -->
    <AppCard v-for="item in filteredPrompts" :key="item.id" class="prompt-card"">
      <div class="card-header">
        <span class="tag">{{ item.category }}</span>
        <span class="card-date">{{ formatDate(item.createdAt) }}</span>
      </div>
      <h3 class="card-title">{{ item.title }}</h3>
      <p class="card-preview">{{ item.content.slice(0, 100) }}{{ item.content.length > 100 ? '...' : '' }}</p>
      <div class="card-actions">
        <AppButton @click="copyItem(item)">📋 复制</AppButton>
        <AppButton variant="danger" @click="deleteItem(item.id)">🗑 删除</AppButton>
        <AppButton variant="primary" @click="openEdit(item)">✏️ 编辑详情</AppButton>
      </div>
    </AppCard>

    <EditPromptModal
      v-if="editingItem"
      :item="editingItem"
      @close="editingItem = null"
      @save="handleEditSave"
    />
  </div>
</template>

<script setup >
import { ref, computed } from 'vue'
import { getStorageData } from '@/composables/useStorage'
import { toast } from 'vue-sonner'

const prompts = getStorageData('prompt-library', [])
const editingItem = ref(null)

const route = useRoute()
const categoryFilter = computed(() => route.query.category || '')
const categoryLabels = { copywriting: '文案', code: '代码', art: '绘画', general: '通用',page:'页面' }
const filteredPrompts = computed(() => {
  if (!categoryFilter.value) return prompts.value
  return prompts.value.filter(item => item.category === categoryFilter.value)
})

function deleteItem(id) {
  if (!confirm('确定删除这条提示词？')) return
  prompts.value = prompts.value.filter(p => p.id !== id)
}

function copyItem(item) {
  navigator.clipboard.writeText(item.content)
  toast.success('已复制到剪贴板')
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('zh-CN')
}

function openEdit(item) {
  editingItem.value = item
}

function handleEditSave({ id, content }) {
  const index = prompts.value.findIndex(p => p.id === id)
  if (index !== -1) {
    prompts.value[index].content = content
  }
  editingItem.value = null
  toast.success('已保存修改')
}
</script>

<style scoped>
.page-title {
  font-size: var(--font-size-xxl);
  margin: 0 0 var(--space-xs);
}

.page-desc {
  color: var(--color-text-tertiary);
  margin: 0 0 var(--space-xl);
  font-size: var(--font-size-base);
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--color-text-tertiary);
}

.empty-icon {
  font-size: 48px;
  margin: 0 0 var(--space-md);
}

/* 卡片 */
.prompt-card {
  margin-bottom: var(--space-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.tag {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.card-date {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.card-title {
  margin: 0 0 var(--space-xs);
  font-size: var(--font-size-lg);
}

.card-preview {
  margin: 0 0 var(--space-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.5;
}

.card-actions {
  display: flex;
  gap: var(--space-sm);
}
</style>
