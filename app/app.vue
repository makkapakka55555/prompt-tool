<template>
  <div class="app-layout">
    <!-- 左侧边栏 -->
    <ErrorBoundary>
    <aside class="sidebar">
      <div class="sidebar-brand">🤖 Prompt Tool</div>

      <nav class="sidebar-nav">
        <NuxtLink to="/" class="sidebar-nav-link" :class="{ 'sidebar-nav-link--active': $route.path === '/' }" @click="triggerReset">
          💬 生成
        </NuxtLink>
        <NuxtLink to="/library" class="sidebar-nav-link" :class="{ 'sidebar-nav-link--active': $route.path === '/library' }">
          📚 提示词库
        </NuxtLink>
        <div class="sidebar-section" v-if="$route.path === '/library'">
        <div class="sidebar-section-title">📂 分类浏览</div>
          <div class="sidebar-item" :class="{ 'sidebar-item--active': $route.query.category === 'copywriting' }" @click="router.push('/library?category=copywriting')">📝 文案</div>
          <div class="sidebar-item" :class="{ 'sidebar-item--active': $route.query.category === 'code' }" @click="router.push('/library?category=code')">💻 代码</div>
          <div class="sidebar-item" :class="{ 'sidebar-item--active': $route.query.category === 'art' }" @click="router.push('/library?category=art')">🎨 绘画</div>
          <div class="sidebar-item" :class="{ 'sidebar-item--active': $route.query.category === 'general' }" @click="router.push('/library?category=general')">📋 通用</div>
          <div class="sidebar-item" :class="{ 'sidebar-item--active': $route.query.category === 'page' }" @click="router.push('/library?category=page')">🌐 页面</div>
      </div>
      </nav>
      

      <!-- 历史记录 -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">💬 历史记录</div>
        <div v-if="history.length === 0" class="sidebar-empty">暂无记录</div>
        <div
          v-for="(msg, i) in displayHistory"
          :key="i"
          class="sidebar-item"
          @click="restoreMessage(msg)"
        >
          <span class="sidebar-item-label">{{ msg.role === 'user' ? '你' : 'AI' }}</span>
          <span class="sidebar-item-text">{{ msg.content.slice(0, 20) }}{{ msg.content.length > 20 ? '...' : '' }}</span>
          <span v-if="msg.role === 'user'" class="sidebar-item-del" @click.stop="deleteHistoryItem(msg)">×</span>
        </div>
        <button class="sidebar-more-btn" @click="showAllHistory = !showAllHistory" v-if="history.length>10">
          {{ showAllHistory ? '收起' : '显示所有' }}
        </button>
      </div>
      <!-- 暗黑模式切换 -->
      <div class="sidebar-section sidebar-bottom">
        <div class="sidebar-item" @click="toggleDark">
          <span>{{ darkMode ? '☀️' : '🌙' }}</span>
          <span class="sidebar-item-text">{{ darkMode ? '亮色模式' : '暗黑模式' }}</span>
        </div>
      </div>
    </aside>
    </ErrorBoundary>

    <!-- 右侧主内容 -->
    <ErrorBoundary>
    <main class="main-content">
      <NuxtPage />
    </main>
    </ErrorBoundary>

    <Toaster position="bottom-right" richColors closeButton :duration="3000" />
  </div>
</template>

<script setup>
import { Toaster } from 'vue-sonner'
import { ref, computed, onMounted } from 'vue'
import { useHistory } from '@/composables/useHistory'
import { useRestoreData } from '@/composables/useRestoreData'

const { history } = useHistory()
const { setRestoreData, triggerReset } = useRestoreData()
const darkMode = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('dark-mode')
  if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    darkMode.value = true
    document.documentElement.classList.add('dark')
  }
})

function toggleDark() {
  darkMode.value = !darkMode.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('dark-mode', darkMode.value)
}

const router = useRouter()
//历史记录
const showAllHistory = ref(false)
const displayHistory = computed(()=>{
  if(showAllHistory.value){
    return history.value
  }else{
    return history.value.slice(-10)
  }
})

function deleteHistoryItem(msg) {
  const idx = history.value.indexOf(msg)
  if (idx === -1) return
  // 删除一整对（user + assistant）
  const pairStart = msg.role === 'assistant' ? idx - 1 : idx
  history.value.splice(pairStart, 2)
}

function restoreMessage(msg) {
  const idx = history.value.indexOf(msg)
  if (idx === -1) return

  let userContent = ''
  let assistantContent = ''

  if (msg.role === 'user') {
    userContent = msg.content
    const next = history.value[idx + 1]
    assistantContent = next?.content || ''
  } else if (msg.role === 'assistant') {
    assistantContent = msg.content
    const prev = history.value[idx - 1]
    userContent = prev?.content || ''
  }

  setRestoreData({ user: userContent, assistant: assistantContent, category: msg.category })
  router.push('/')
}
</script>

<style>
body {
  margin: 0;
  font-family: var(--font-family);
  background: var(--color-bg);
  color: var(--color-text);
}

.app-layout {
  display: flex;
  min-height: 100vh;
}
</style>

<style scoped>
/* ─── 侧边栏 ─── */
.sidebar {
  width: 220px;
  background: var(--color-bg-white);
  border-right: 1px solid var(--color-border);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-brand {
  font-size: var(--font-size-xl);
  font-weight: 700;
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border-light);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.sidebar-nav-link {
  text-decoration: none;
  color: var(--color-text-secondary);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: all 0.2s;
}

.sidebar-nav-link:hover {
  background: var(--color-border-light);
  color: var(--color-text);
}

.sidebar-nav-link--active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

/* 历史 */
.sidebar-section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-sm);
}

.sidebar-empty {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  padding: var(--space-sm) 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 6px 0;
  cursor: pointer;
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--color-border-light);
  transition: color 0.2s;
}

.sidebar-item:hover {
  color: var(--color-primary);
}

.sidebar-item--active {
  color: var(--color-primary);
  font-weight: 600;
}

.sidebar-item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
}

.sidebar-item-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.sidebar-item-del {
  display: none;
  font-size: 14px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
}

.sidebar-item:hover .sidebar-item-del {
  display: inline;
}

.sidebar-item-del:hover {
  color: var(--color-error, #e74c3c);
}

/* ─── 暗黑模式切换 ─── */
.sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--space-md);
}

/* ─── 主内容 ─── */
.main-content {
  flex: 1;
  max-width: 700px;
  margin: 0 auto;
  padding: var(--space-xl);
}
</style>
