<template>
  <div class="page">
    <div class="categories">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="category-btn"
        :class="{ 'category-btn--active': category === cat.key }"
        :disabled="viewOnly"
        @click="category = cat.key"
      >
        {{ cat.icon }} {{ cat.label }}
      </button>
    </div>

    <h1 class="page-title">🤖 Prompt Tool</h1>
    <p class="page-desc">AI 帮你写提示词</p>

    <!-- 输入区 -->
    <AppCard class="section-card">
      <!-- 页面分类：还是用输入框 -->
      <template v-if="category === 'page'">
        <AppTextarea
          v-model="message"
          placeholder="试试问：根据XXX写一个提示词"
          :rows="4"
        />
      </template>

      <!-- 其他分类：动态表单 -->
      <template v-else>
        <div v-if="formFields.length" class="form-fields">
          <div v-for="field in formFields" :key="field.key" class="form-field">
            <label class="form-label">{{ field.label }}</label>
            <select
              v-if="field.type === 'select'"
              v-model="formValues[field.key]"
              class="form-input"
            >
              <option value="">请选择</option>
              <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input
              v-else
              v-model="formValues[field.key]"
              :placeholder="field.placeholder || ''"
              class="form-input"
            />
          </div>
        </div>
        <p v-else class="form-empty">请先生成提示词</p>
      </template>

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
        <AppButton variant="primary" :loading="loading" :disabled="viewOnly" @click="send">
          {{ viewOnly ? '📋 查看模式' : loading ? 'AI 思考中...' : '🚀 生成' }}
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
        <AppButton variant="primary" @click="testPrompt" :loading="testing">▶ 测试</AppButton>
        <AppButton variant="primary" @click="savePrompt">💾 保存</AppButton>
      </div>
      <div v-if="testResult" class="test-result">
        <div class="test-result-header">
          <span>🤖 AI 测试结果</span>
          <button class="test-close-btn" @click="testResult = ''">✕</button>
        </div>
        <pre class="test-result-content">{{ testResult }}</pre>
      </div>

      <!-- 批量测试区 -->
      <div v-if="formFields.length && category !== 'page'" class="batch-test">
        <h3 class="batch-title">📊 批量测试</h3>
        <p class="batch-hint">多组参数对比评分，每行一组输入</p>

        <table class="batch-table">
          <thead>
            <tr>
              <th class="batch-idx">#</th>
              <th v-for="f in formFields" :key="f.key">{{ f.label }}</th>
              <th v-if="batchResults.length" class="batch-score-col">评分</th>
              <th class="batch-action-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tc, i) in testCases" :key="i">
              <td class="batch-idx">{{ i + 1 }}</td>
              <td v-for="f in formFields" :key="f.key">
                <select
                  v-if="f.type === 'select'"
                  v-model="tc[f.key]"
                  class="batch-input"
                >
                  <option value="">—</option>
                  <option v-for="opt in f.options" :value="opt">{{ opt }}</option>
                </select>
                <input
                  v-else
                  v-model="tc[f.key]"
                  class="batch-input"
                  placeholder="留空则跳过"
                />
              </td>
              <td v-if="batchResults[i]" class="batch-score-col">
                <span class="score-badge" :class="{ 'score-high': batchResults[i].score >= 8, 'score-mid': batchResults[i].score >= 5 }">{{ batchResults[i].score }}</span>
              </td>
              <td class="batch-action-col">
                <button v-if="testCases.length > 1" class="batch-remove-btn" @click="removeCase(i)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="batch-actions">
          <AppButton @click="addCase">➕ 添加用例</AppButton>
          <AppButton variant="primary" :loading="batchTesting" @click="runBatchTest" :disabled="!currentTemplate">
            {{ batchTesting ? '评分中...' : '🚀 批量测试' }}
          </AppButton>
        </div>

        <div v-if="batchAvgScore" class="avg-score-bar">
          平均分：<span class="score-large" :class="{ 'score-high': batchAvgScore >= 8, 'score-mid': batchAvgScore >= 5 }">{{ batchAvgScore }}</span> / 10
        </div>

        <div v-if="batchResults.length" class="batch-details">
          <div v-for="(r, i) in batchResults" :key="i" class="batch-detail-item">
            <details>
              <summary>
                <span>用例 {{ i + 1 }}</span>
                <span class="score-badge" :class="{ 'score-high': r.score >= 8, 'score-mid': r.score >= 5 }">⭐ {{ r.score }}</span>
                <span class="detail-summary-reason">{{ r.reason.slice(0, 40) }}{{ r.reason.length > 40 ? '...' : '' }}</span>
              </summary>
              <div class="batch-detail-body">
                <div class="detail-field"><strong>AI 输出：</strong><pre>{{ r.output }}</pre></div>
                <div v-if="r.subScores" class="detail-field">
                  <strong>维度评分：</strong>
                  <span v-for="(v, k, i) in r.subScores" :key="k" class="sub-score">{{ judgeLabels[i] || k }}={{ v }}</span>
                </div>
                <div class="detail-field"><strong>评价：</strong>{{ r.reason }}</div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <div v-if="category === 'page' && pageTree" class="page-preview">
        <span>全屏预览</span>
        <div class="page-preview-btn" @click = "fullScreenPreview = true">⛶ 全屏</div>
        <DynamicRenderer :node="pageTree" />
      </div>
      <div class="io-actions">
        <AppButton @click="exportLibrary">📤 导出词库</AppButton>
        <AppButton @click="fileInput.click()">📥 导入词库</AppButton>
        <input ref="fileInput" type="file" accept=".json" hidden @change="importLibrary" />
      </div>
      <Teleport to="body">
        <div v-if="fullScreenPreview" class="fullscreen-overlay" @click.self="fullScreenPreview = false">
          <div class="fullscreen-header">
            <span>页面预览</span>
            <button class="page-preview-btn" @click="fullScreenPreview = false">✕ 退出</button>
          </div>
          <div class="fullscreen-body">
            <DynamicRenderer :node="pageTree" />
          </div>
        </div>
      </Teleport>
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
  { key: 'page', label: '页面', icon: '🌐' },
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
const { pendingRestore, consumeRestoreData, resetCounter } = useRestoreData()
const detailItem = ref(null)
const pageTree = ref(null)
const fullScreenPreview = ref(false)
const testing = ref(false)
const testResult = ref('')
const viewOnly = ref(false)
const judgeLabels = ref([])
const testCases = ref([])
const batchResults = ref([])
const batchAvgScore = ref(0)
const batchTesting = ref(false)
//解析模板中的字段为实际值
const assembledPrompt = computed(() => {
  const tpl = currentTemplate.value
  if (!tpl) return editPrompt.value
  let result = tpl.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, field, content) => {
    return formValues.value[field]?.toString().trim() ? content : ''
  })
  result = result.replace(/\{\{(\w+)\}\}/g, (_, k) => formValues.value[k] || '')
  return result
})
const formFields = ref([])
const formValues = ref({})
const currentTemplate = ref('')

// 刷新后尝试恢复页面预览（v-if 会自动控制显示隐藏）
const lastPageData = localStorage.getItem('last-page-data')
if (lastPageData) {
  try { pageTree.value = JSON.parse(lastPageData) } catch {}
}

watch(category, async (val) => {
  testResult.value = ''
  batchResults.value = []
  batchAvgScore.value = 0
  if (val !== 'page') {
    pageTree.value = null
    localStorage.removeItem('last-page-data')
    try {
      const res = await fetch(`/api/template-fields?category=${val}`)
      const data = await res.json()
      formFields.value = data.fields || []
      currentTemplate.value = data.template || ''
      initTestCases()
    } catch {
      formFields.value = []
      currentTemplate.value = ''
    }
  }else {
      formFields.value = []
      currentTemplate.value = ''
    }
})

watch(resetCounter, () => {
  message.value = ''
  result.value = ''
  editPrompt.value = ''
  error.value = ''
  pageTree.value = null
  viewOnly.value = false
  testResult.value = ''
})

watch(formValues, () => {
  if (category.value !== 'page' && currentTemplate.value) {
    editPrompt.value = assembledPrompt.value
  }
}, { deep: true })

watch(pendingRestore, (data) => {
  if (!data) return
  testResult.value = ''
  message.value = data.user
  result.value = data.assistant
  editPrompt.value = data.assistant
  editSource.value = 'ai'
  if (data.category) category.value = data.category
  viewOnly.value = true
  try {
    const parsed = JSON.parse(data.assistant)
    pageTree.value = parsed.type && parsed.children ? parsed : null
    if (pageTree.value) localStorage.setItem('last-page-data', data.assistant)
  } catch {
    pageTree.value = null
  }
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
  viewOnly.value = false
  loading.value = true
  abortController.value = new AbortController()
  error.value = ''
  result.value = ''
  editPrompt.value = ''
  testResult.value = ''
  batchResults.value = []
  batchAvgScore.value = 0
  pageTree.value = null

  // 页面分类：走流式 chat
  if (category.value === 'page') {
    if (!message.value.trim()) { loading.value = false; return }
    const currentCategory = category.value

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
              editPrompt.value += json.content
            } else if (json.type === 'done') {
              addHistory(message.value, json.extracted , currentCategory)
              try {
                pageTree.value = JSON.parse(json.extracted)
                localStorage.setItem('last-page-data', json.extracted)
              } catch { error.value = 'AI 输出格式不对，请重试' }
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
    return
  }

  // 其他分类：调 AI 生成
  if (!formFields.value.length) {
    error.value = '请先选择分类'
    loading.value = false
    return
  }
  const hasValue = Object.values(formValues.value).some(v => v?.toString().trim())
  if (!hasValue) {
    error.value = '请至少填写一个字段'
    loading.value = false
    return
  }

  try {
    const data = await $fetch('/api/generate', {
      method: 'POST',
      body: {
        fields: formValues.value,
        category: category.value,
        template: currentTemplate.value
      }
    })
    if (data.error) {
      error.value = data.error
    } else {
      editPrompt.value = data.result
      result.value = data.result
      addHistory('表单生成', data.result, category.value)
    }
  } catch (err) {
    error.value = err?.message || '请求失败'
  } finally {
    loading.value = false
  }
}

function initTestCases() {
  const row = {}
  formFields.value.forEach(f => { row[f.key] = '' })
  testCases.value = [row]
}

function addCase() {
  const row = {}
  formFields.value.forEach(f => { row[f.key] = '' })
  testCases.value.push(row)
}

function removeCase(index) {
  testCases.value.splice(index, 1)
}

async function runBatchTest() {
  const cases = testCases.value.filter(tc => Object.values(tc).some(v => v?.toString().trim()))
  if (!cases.length) {
    toast.error('请至少填写一行用例')
    return
  }
  if (!currentTemplate.value) {
    toast.error('缺少模板，请先选择分类')
    return
  }

  batchTesting.value = true
  batchResults.value = []
  batchAvgScore.value = 0

  try {
    const data = await $fetch('/api/test-prompt', {
      method: 'POST',
      body: {
        template: currentTemplate.value || editPrompt.value,
        category: category.value,
        cases
      }
    })
    if (data.error) {
      toast.error(data.error)
    } else {
      batchResults.value = data.results || []
      batchAvgScore.value = data.avgScore || 0
      judgeLabels.value = data.judgeLabels || []
    }
  } catch (err) {
    toast.error('批量测试失败：' + (err?.message || '请求错误'))
  } finally {
    batchTesting.value = false
  }
}

async function testPrompt() {
  if (!editPrompt.value.trim()) return
  testing.value = true
  testResult.value = ''
  try {
    const data = await $fetch('/api/test-prompt', {
      method: 'POST',
      body: {
        template: editPrompt.value,
        category: category.value,
        cases: [{}] // 传一个空用例，让 template 原样输出
      }
    })
    if (data.error) {
      testResult.value = data.error
    } else if (data.results?.length) {
      const r = data.results[0]
      const labels = data.judgeLabels || []
      const sub = r.subScores ? '\n' + Object.entries(r.subScores).map(([v, k], i) => `  ${labels[i] || v}：${k}`).join('\n') : ''
      testResult.value = `⭐ 总分：${r.score}/10${sub}\n📝 评价：${r.reason}\n\n🤖 AI 输出：\n${r.output}`
    } else {
      testResult.value = '测试返回为空'
    }
  } catch (err) {
    testResult.value = '测试失败：' + (err?.message || '请求错误')
  } finally {
    testing.value = false
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
.category-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.io-actions {
  margin-top: var(--space-lg);
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.page-preview {
  margin-top: var(--space-lg);
  padding: var(--space-lg);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.test-result {
  margin-top: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.test-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-bg);
  font-size: 13px;
  border-bottom: 1px solid var(--color-border);
}
.test-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-tertiary);
  font-size: 16px;
}
.test-close-btn:hover {
  color: var(--color-text);
}
.test-result-content {
  margin: 0;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
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
.page-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .page-preview-btn {
    padding: 4px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-white);
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: 13px;
  }

  .page-preview-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .fullscreen-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: var(--color-bg-white);
    padding: 20px 40px;
    overflow-y: auto;
  }

  .fullscreen-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border);
    font-size: 16px;
  }

  .fullscreen-body {
    max-width: 600px;
    margin: 0 auto;
  }
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
  .form-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .form-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  .form-input {
    padding: 8px 10px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-white);
    color: var(--color-text);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-input:focus {
    border-color: var(--color-primary);
  }
  .form-empty {
    color: var(--color-text-tertiary);
    font-size: 14px;
    margin-bottom: 16px;
  }
  .preview-box {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
  }
  .preview-label {
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin-bottom: 6px;
  }
  .preview-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);
    white-space: pre-wrap;
  }

  /* 批量测试 */
  .batch-test {
    margin-top: var(--space-lg);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-lg);
  }
  .batch-title {
    margin: 0 0 4px;
    font-size: var(--font-size-lg);
  }
  .batch-hint {
    margin: 0 0 var(--space-md);
    font-size: 13px;
    color: var(--color-text-tertiary);
  }
  .batch-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--space-sm);
    font-size: 13px;
  }
  .batch-table th {
    text-align: left;
    padding: 6px 8px;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 2px solid var(--color-border);
    white-space: nowrap;
  }
  .batch-table td {
    padding: 4px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .batch-idx {
    width: 32px;
    text-align: center;
    color: var(--color-text-tertiary);
    font-size: 12px;
  }
  .batch-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg-white);
    color: var(--color-text);
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
  }
  .batch-input:focus {
    border-color: var(--color-primary);
  }
  .batch-actions {
    display: flex;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
  }
  .batch-remove-btn {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-tertiary);
    cursor: pointer;
    padding: 2px 8px;
    font-size: 13px;
  }
  .batch-remove-btn:hover {
    color: var(--color-error);
    border-color: var(--color-error);
  }
  .score-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    background: var(--color-bg);
    color: var(--color-text-secondary);
  }
  .score-high {
    background: #dcfce7;
    color: #16a34a;
  }
  .score-mid {
    background: #fef9c3;
    color: #ca8a04;
  }
  .score-large {
    font-size: 24px;
    font-weight: 700;
  }
  .avg-score-bar {
    margin-bottom: var(--space-md);
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .batch-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .batch-detail-item details {
    background: var(--color-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    padding: 8px 12px;
  }
  .batch-detail-item summary {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .detail-summary-reason {
    color: var(--color-text-tertiary);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .batch-detail-body {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
  }
  .detail-field {
    margin-bottom: 8px;
    font-size: 13px;
  }
  .detail-field pre {
    margin: 4px 0 0;
    white-space: pre-wrap;
    font-size: 12px;
    background: var(--color-bg-white);
    padding: 8px;
    border-radius: 4px;
    max-height: 120px;
    overflow-y: auto;
  }
  .batch-score-col {
    width: 50px;
    text-align: center;
  }
  .batch-action-col {
    width: 40px;
  }
  .sub-score {
    display: inline-block;
    margin: 2px 6px 2px 0;
    padding: 1px 8px;
    background: var(--color-bg);
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }

</style>
