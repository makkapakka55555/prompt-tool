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

      <details style="margin: 12px 0;">
        <summary style="cursor:pointer;color:var(--color-text-secondary);font-size:14px;">⚙️ 参数设置</summary>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label>temperature ({{ temperature }})</label>
            <input type="range" min="0" max="1" step="0.1" v-model.number="temperature" style="width:100%;" />
          </div>
          <div>
            <label>最大 Token</label>
            <input type="number" v-model.number="maxTokens" style="width:100%;padding:6px;border:1px solid var(--color-border);border-radius:4px;box-sizing:border-box;" />
          </div>
          <div>
            <label>角色设定词</label>
            <AppTextarea v-model="systemPrompt" :rows="3" placeholder="可选：自定义 AI 角色设定" />
          </div>
        </div>
      </details>

      <div class="input-actions">
        <AppButton variant="primary" :loading="loading" @click="send">
          {{ loading ? 'AI 思考中...' : '🚀 生成' }}
        </AppButton>
        <AppButton v-if="loading" variant="danger" @click="cancelSend">✋ 取消</AppButton>
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
    <AppCard class="result-section" >
      <h3 class="result-title">✅ 生成的提示词</h3>
      <AppTextarea v-model="editPrompt" :rows="8" />
      <div class="result-actions">
        <AppButton @click="copyToClipboard">📋 复制</AppButton>
        <AppButton variant="primary" @click="savePrompt">💾 保存</AppButton>
      </div>
      <details open class="raw-reply">
        <summary>查看完整回复</summary>
        <pre>{{ result }}</pre>
      </details>
      <div class="io-actions">
        <AppButton @click="exportLibrary">📤 导出词库</AppButton>
        <AppButton @click="fileInput.click()">📥 导入词库</AppButton>
        <input ref="fileInput" type="file" accept=".json" hidden @change="importLibrary" />
      </div>
    </AppCard>

    <!-- 错误提示 -->
    <AppCard v-if="error" variant="outlined" class="error-card">
      <h3 class="error-title">❌ 出错了</h3>
      <p class="error-message">{{ error }}</p>
    </AppCard>
  </div>
</template>

<script setup >
import { ref, watch } from 'vue'
import { getStorageData } from '@/composables/useStorage'
import { useHistory } from '@/composables/useHistory'
import { useRestoreData } from '@/composables/useRestoreData'
import { toast } from 'vue-sonner'

const categories = [
  { key: 'copywriting', label: '文案', icon: '📝' },
  { key: 'code', label: '代码', icon: '💻' },
  { key: 'art', label: '绘画', icon: '🎨' },
  { key: 'general', label: '通用', icon: '📋' },
]

const fileInput = ref(null)
const message = ref('')
const loading = ref(false)
const result = ref('')
const error = ref('')
const systemPrompt = ref('')
const maxTokens = ref(1024)
const temperature = ref(0.5)
 const abortController = ref(null)
const category = ref('copywriting')
const editPrompt = ref('')
const editSource = ref('')
const prompts = getStorageData('prompt-library', [])
const { history, addHistory } = useHistory()
const { pendingRestore, consumeRestoreData } = useRestoreData()
const detailItem = ref(null)

// 从侧边栏历史记录恢复（实时响应，不用等 onMounted）
watch(pendingRestore, (data) => {
  if (!data) return
  message.value = data.user
  result.value = data.assistant
  editPrompt.value = data.assistant
  editSource.value = 'ai'
  consumeRestoreData()
}, { immediate: true })

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('zh-CN')
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
  abortController.value = new AbortController()
  error.value = ''
  result.value = ''

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.value,
        history: history.value,
        systemPrompt: systemPrompt.value,
        maxTokens: maxTokens.value,
        temperature: temperature.value,
        category: category.value,
      }),
      signal: abortController.value.signal,
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      buffer += text
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim()
          if (!payload) continue
          const json = JSON.parse(payload)
          if (json.type === 'token') {
            result.value += json.content
          } else if (json.type === 'done') {
            editPrompt.value = json.extracted
            addHistory(message.value, result.value)
          } else if (json.type === 'error') {
            error.value = json.message
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return
    error.value = err?.message || '请求失败'
  } finally {
    loading.value = false
  }
}

function cancelSend() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  loading.value = false
  error.value = ''
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

function exportLibrary() {
  const json = JSON.stringify(prompts.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `prompt-library-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('词库已导出')
}

function importLibrary(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result)
      if (!Array.isArray(data)) throw new Error('格式错误')
      prompts.value = data
      toast.success(`已导入 ${data.length} 条提示词`)
    } catch {
      toast.error('文件格式不正确，请选择有效的 JSON 文件')
    }
  }
  reader.readAsText(file)
  // 清空 input，允许重复选同一个文件
  e.target.value = ''
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
  display: flex;
  gap: var(--space-sm);
  align-items: center;
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

.io-actions {
  margin-top: var(--space-lg);
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
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
