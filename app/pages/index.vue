<template>
  <div class="page">
    <div class="categories">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="category-btn"
        :class="{ 'category-btn--active': category === cat.key }"
        @click="category = cat.key"
      >
        {{ cat.icon }} {{ cat.label }}
      </button>
    </div>

    <h1 class="page-title">🤖 Prompt Tool</h1>
    <p class="page-desc">AI 帮你写提示词</p>

    <!-- 输入区 -->
    <AppCard class="section-card">
      <AppTextarea
        v-model="message"
        placeholder="试试问：根据XXX写一个提示词"
        :rows="4"
      />
      <div class="input-actions">
        <AppButton variant="primary" :loading="loading" @click="send">
          {{ loading ? 'AI 思考中...' : '🚀 生成' }}
        </AppButton>
      </div>
    </AppCard>

    <!-- 词库详情 -->
    <AppCard v-if="detailItem" class="detail-card">
      <div class="detail-header">
        <span class="tag">{{ detailItem.category }}</span>
        <span class="detail-date">{{ formatDate(detailItem.createdAt) }}</span>
      </div>
      <h3 class="detail-title">{{ detailItem.title }}</h3>
      <p class="detail-content">{{ detailItem.content }}</p>
      <div class="detail-actions">
        <AppButton @click="copyDetail">📋 复制</AppButton>
        <AppButton variant="danger" @click="deleteDetail">🗑 删除</AppButton>
        <AppButton variant="primary" @click="fillFromDetail">✏️ 填入编辑</AppButton>
      </div>
    </AppCard>

    <!-- 结果区 -->
    <AppCard class="result-section" v-if="result">
      <h3 class="result-title">✅ 生成的提示词</h3>
      <AppTextarea v-model="editPrompt" :rows="8" />
      <div class="result-actions">
        <AppButton @click="copyToClipboard">📋 复制</AppButton>
        <AppButton variant="primary" @click="savePrompt">💾 保存</AppButton>
      </div>
      <details v-if="result" class="raw-reply">
        <summary>查看完整回复</summary>
        <pre>{{ result }}</pre>
      </details>
    </AppCard>

    <!-- 错误提示 -->
    <AppCard v-if="error" variant="outlined" class="error-card">
      <h3 class="error-title">❌ 出错了</h3>
      <p class="error-message">{{ error }}</p>
    </AppCard>
  </div>
</template>

<script setup >
import { ref, onMounted } from 'vue'
import { getStorageData } from '@/composables/useStorage'
import { useHistory } from '@/composables/useHistory'
import { toast } from 'vue-sonner'

const categories = [
  { key: 'copywriting', label: '文案', icon: '📝' },
  { key: 'code', label: '代码', icon: '💻' },
  { key: 'art', label: '绘画', icon: '🎨' },
  { key: 'general', label: '通用', icon: '📋' },
]

const message = ref('')
const loading = ref(false)
const result = ref('')
const error = ref('')
const systemPrompt = ref('')
const maxTokens = ref(1024)
const temperature = ref(0.5)
const category = ref('copywriting')
const editPrompt = ref('')
const editSource = ref('')
const prompts = getStorageData('prompt-library', [])
const library = prompts
const { history, addHistory } = useHistory()
const detailItem = ref(null)

// 从侧边栏历史记录恢复
onMounted(() => {
  const raw = localStorage.getItem('restore-data')
  if (raw) {
    const data = JSON.parse(raw)
    message.value = data.user
    result.value = data.assistant
    editPrompt.value = data.assistant
    editSource.value = 'ai'
    localStorage.removeItem('restore-data')
  }
})

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('zh-CN')
}

function pickFromLibrary(item) {
  result.value = item.rawresult
  editPrompt.value = item.content
  toast.success('已从提示词库填入')
}

function copyDetail() {
  navigator.clipboard.writeText(detailItem.value.content)
  toast.success('已复制到剪贴板')
}

function deleteDetail() {
  prompts.value = prompts.value.filter(p => p.id !== detailItem.value.id)
  detailItem.value = null
  toast.success('已删除')
}

function fillFromDetail() {
  editPrompt.value = detailItem.value.content
  result.value = detailItem.value.rawresult || ''
  detailItem.value = null
  toast.success('已填入编辑框')
}

async function send() {
  if (!message.value.trim()) return

  loading.value = true
  error.value = ''
  result.value = ''

  try {
    const data = await $fetch('/api/chat', {
      method: 'POST',
      body: {
        message: message.value,
        history: history.value,
        systemPrompt: systemPrompt.value,
        maxTokens: maxTokens.value,
        temperature: temperature.value,
        category: category.value
      }
    })
    result.value = data.reply
    editPrompt.value = data.extracted
    addHistory(message.value, result.value)
  } catch (err) {
    error.value = err?.message || '请求失败'
  } finally {
    loading.value = false
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(editPrompt.value)
  toast.success('已复制到剪贴板')
}

function savePrompt() {
  const newPrompt = {
    id: Date.now().toString(),
    title: editPrompt.value.slice(0, 40) + (editPrompt.value.length > 40 ? '...' : ''),
    content: editPrompt.value,
    category: category.value,
    createdAt: Date.now(),
    rawresult: result.value
  }
  prompts.value.push(newPrompt)
  toast.success('已保存到提示词库')
}
</script>

<style scoped>
.page {
  padding-top: var(--space-md);
}

.page-title {
  font-size: var(--font-size-xxl);
  margin: 0 0 var(--space-xs);
}

.page-desc {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-xl);
  font-size: var(--font-size-base);
}

/* 分类 */
.categories {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.category-btn {
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-white);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all 0.2s;
}

.category-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.category-btn--active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

/* 卡片 */
.section-card {
  margin-bottom: var(--space-lg);
}

.input-actions {
  margin-top: var(--space-lg);
}

.result-section {
  margin-bottom: var(--space-lg);
}

.result-title {
  margin: 0 0 var(--space-lg);
  font-size: var(--font-size-lg);
}

.result-actions {
  margin-top: var(--space-lg);
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.raw-reply {
  margin-top: var(--space-lg);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.raw-reply pre {
  white-space: pre-wrap;
  font-size: var(--font-size-sm);
  margin-top: var(--space-sm);
}

/* 词库详情 */
.detail-card {
  margin-bottom: var(--space-lg);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.detail-date {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.detail-title {
  margin: 0 0 var(--space-md);
  font-size: var(--font-size-lg);
}

.detail-content {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0 0 var(--space-lg);
}

.detail-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.tag {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

/* 错误 */
.error-card {
  background: var(--color-error-bg);
  border-color: var(--color-error);
}

.error-title {
  margin: 0 0 var(--space-sm);
  color: var(--color-error);
  font-size: var(--font-size-lg);
}

.error-message {
  margin: 0;
  color: var(--color-error);
  font-size: var(--font-size-base);
}
</style>
