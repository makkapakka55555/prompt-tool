# Prompt Tool 🤖

AI 提示词生成工具。输入需求，AI 帮你写出结构化提示词。

## 功能

- **4 种分类场景**生成提示词（文案 / 代码 / 绘画 / 通用）
- **流式输出** — AI 逐字生成，不用等
- **参数面板** — 调节 temperature / maxTokens / 角色设定
- **取消生成** — AbortController 实现，随时中断
- **自动重试** — 网络超时自动重试一次
- **提示词词库** — 保存 / 编辑 / 删除 / 分类浏览
- **词库导入/导出** — JSON 格式
- **对话历史** — 自动保存，刷新不丢，支持删除
- **暗黑模式** — 侧边栏一键切换，自动记忆
- **词库分类走 URL 参数** (`/library?category=code`)
- **编辑弹窗组件复用**

## 技术栈

- Nuxt 4 + Vue 3 + TypeScript
- DeepSeek API（流式 SSE）
- vue-sonner（Toast 通知）
- CSS 变量设计系统 + 暗黑主题

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
    index.vue        # 首页：生成提示词 + 词库导入导出
    library.vue      # 词库：分类浏览 / 编辑
  components/ui/     # 复用组件
    AppButton.vue
    AppCard.vue
    AppTextarea.vue
    EditPromptModal.vue
  composables/       # 组合式函数
    useStorage.ts    # localStorage 响应式封装
    useHistory.ts    # 历史记录共享
    useRestoreData.ts # 组件间实时传数据
server/
  api/
    chat.post.js     # AI 对话 + 流式 SSE + 提取精简版
```
