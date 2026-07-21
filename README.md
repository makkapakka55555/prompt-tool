# Prompt Tool 🤖

AI 提示词生成工具 + 低代码页面生成器。

## 功能

### AI 提示词生成
- **5 种分类场景**生成提示词（文案 / 代码 / 绘画 / 通用 / 页面）
- **流式输出** — AI 逐字生成，不用等
- **页面生成** — 低代码模式，AI 输出 JSON 组件树，动态渲染为页面预览
- **参数面板** — 调节 temperature / maxTokens / 角色设定
- **取消生成** — AbortController 实现，随时中断

### 词库管理
- **提示词词库** — 保存 / 编辑 / 删除 / 分类浏览
- **词库导入/导出** — JSON 格式
- **词库分类走 URL 参数** (`/library?category=code`)

### 页面预览
- **DynamicRenderer** — 递归渲染组件树 JSON
- **组件库** — LcButton（支持 primary/danger/default 类型）
- **全屏预览** — ⛶ 按钮展开全屏查看
- **JSON 强制模式** — `response_format` + `fixJSON` 保证 100% 合法输出

### 用户体验
- **对话历史** — 自动保存，刷新不丢，支持删除，点击恢复时自动切换分类
- **暗黑模式** — 侧边栏一键切换，自动记忆
- **Error Boundary** — `onErrorCaptured` 组件级错误隔离
- **请求中按钮禁用** — `:loading="loading"` 防止重复提交

## 技术栈

- Nuxt 4 + Vue 3 + TypeScript
- DeepSeek API（流式 SSE + JSON 模式）
- 低代码组件系统（LcButton / DynamicRenderer）
- CSS 变量设计系统 + 暗黑主题
- vue-sonner（Toast 通知）

## 本地运行

```bash
git clone https://github.com/makkapakka55555/prompt-tool
cd prompt-tool
npm install
```

在项目根目录创建 `.env` 文件：

```
DEEPSEEK_API_KEY=你的key
```

启动：

```bash
npm run dev
```

## 项目结构

```
app/
  app.vue            # 侧边栏 + 路由布局 + 暗黑模式
  pages/
    index.vue        # 首页：生成提示词 + 页面预览 + 词库导入导出
    library.vue      # 词库：分类浏览 / 编辑
  components/
    DynamicRenderer.vue  # 低代码组件树渲染器
    ErrorBoundary.vue    # 错误边界
    lc/
      LcButton.vue       # 低代码按钮组件
    ui/
      AppButton.vue
      AppCard.vue
      AppTextarea.vue
      EditPromptModal.vue
  composables/
    useStorage.ts     # localStorage 响应式封装
    useHistory.ts     # 历史记录 + 分类存储
    useRestoreData.ts # 组件间实时传数据
server/
  api/
    chat.post.js     # AI 对话 + 流式 SSE + 页面 JSON 生成
```
