<template>
  <div class="app-layout">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-brand">🤖 Prompt Tool</div>

      <nav class="sidebar-nav">
        <NuxtLink to="/" class="sidebar-nav-link" :class="{ 'sidebar-nav-link--active': $route.path === '/' }">
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
          @click="restoreMessage(msg, i)"
        >
          <span class="sidebar-item-label">{{ msg.role === 'user' ? '你' : 'AI' }}</span>
          <span class="sidebar-item-text">{{ msg.content.slice(0, 20) }}{{ msg.content.length > 20 ? '...' : '' }}</span>
        </div>
        <button class="sidebar-more-btn" @click="showAllHistory = !showAllHistory" v-if="history.length>10">
          {{ showAllHistory ? '收起' : '显示所有' }}
        </button>
      </div>
    </aside>

    <!-- 右侧主内容 -->
    <main class="main-content">
      <NuxtPage />
    </main>

    <Toaster position="bottom-right" richColors closeButton :duration="3000" />
  </div>
</template>

<script setup>
import { Toaster } from 'vue-sonner'
import { ref, computed } from 'vue'
import { useHistory } from '@/composables/useHistory'

const { history } = useHistory()

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

function restoreMessage(msg, index) {
  let userContent = ''
  let assistantContent = ''

  if (msg.role === 'user') {
    userContent = msg.content
    const next = history.value[index + 1]
    assistantContent = next?.content || ''
  } else if (msg.role === 'assistant') {
    assistantContent = msg.content
    const prev = history.value[index - 1]
    userContent = prev?.content || ''
  }

  localStorage.setItem('restore-data', JSON.stringify({ user: userContent, assistant: assistantContent }))
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

/* ─── 主内容 ─── */
.main-content {
  flex: 1;
  max-width: 700px;
  margin: 0 auto;
  padding: var(--space-xl);
}
</style>
