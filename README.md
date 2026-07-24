# Prompt Tool 🤖

AI 提示词结构化编辑 + 生成 + 批量评测工具。

> 结构化表单代替手写提示词，AI 生成而非死板拼装，executor+judge 双模型打分。
> 低代码页面生成（JSON 组件树 + 动态渲染）。

---

## 核心功能

### 🎯 结构化提示词编辑器

**痛点：** 传统 prompt 工具用 textarea 手写，格式不规范且门槛高。

**方案：** 模板驱动的动态表单。选分类 → API 加载模板字段 → 自动渲染表单（input / select）→ 表单值实时拼装为完整提示词。

- 模板语法：`{{变量}}` 替换 + `{{#if 字段}}` 条件逻辑（空字段自动隐藏）
- 支持 4 个分类：文案 / 代码 / 绘画 / 通用，每个分类有独立的字段和模板
- AI 生成模式（`/api/generate`）：填表 → 字段发给 AI → AI 创作完整提示词，非死板拼接

```javascript
// 模板示例（文案）：
// "你是文案专家。写{{product}}的推广文案。
// {{#if audience}}面向{{audience}}。{{/if}}"
//
// product = "口红", audience = "20岁打工人" →
// "你是文案专家。写口红的推广文案。面向20岁打工人。"
```

### 🧪 批量提示词评测

**痛点：** 提示词质量难以量化，单次测试结果随机性大。

**方案：** executor + judge 双 AI 管道，并发评测 + 多维度评分。

- **executor**：执行 AI（根据提示词生成内容）
- **judge**：评分 AI（多维度打分 1-10，返回结构化 JSON）
- 用例表格：填 N 组参数 → `Promise.all` 并发跑 N 个 AI → 评分排序列出
- 评分细则：
  - 文案：开头钩子 / 卖点位置 / 行动号召 / 语气一致 / 人群匹配
  - 代码：语法正确 / 功能完整 / 边界处理 / 命名清晰 / 代码简洁
  - 绘画：主体描述 / 风格明确 / 视觉细节 / 结构完整
  - 通用：理解准确 / 内容完整 / 结构清晰 / 满足约束
- 平均分汇总，每项子维度独立分开展示

```javascript
// 返回数据结构
{
  results: [{ params, output, score, reason, subScores: { 开头钩子: 8, 卖点位置: 7, ... } }],
  avgScore: 7.4,
  judgeLabels: ['开头钩子', '卖点位置', ...]
}
```

### 🌐 低代码页面生成

- AI 输出 JSON 组件树（title / text / input / button / image / select / card / row / col 等 8+ 组件）
- `DynamicRenderer` 递归渲染，全屏预览
- `response_format: json_object` + `fixJSON` 修复器，保证 100% 合法输出

### 📦 词库管理

- 保存 / 编辑 / 删除 / 分类浏览
- JSON 导入导出
- URL 分类参数（`/library?category=code`）

---

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Nuxt 4 + Vue 3 |
| AI | DeepSeek API（流式 SSE + JSON 模式） |
| 评测 | executor + judge 双模型并发管道 |
| 低代码 | 递归组件树渲染（DynamicRenderer） |
| 样式 | CSS 变量设计系统 + 暗黑主题 |
| UI | vue-sonner（Toast）/ 自研 AppButton / AppCard |

---

## 本地运行

```bash
git clone https://github.com/makkapakka55555/prompt-tool
cd prompt-tool
npm install
```

在项目根目录创建 `.env`：

```env
DEEPSEEK_API_KEY=你的key
```

启动：

```bash
npm run dev
```

---

## 项目结构

```
app/
  app.vue                           # 侧边栏 + 路由 + 暗黑模式
  pages/
    index.vue                       # 首页：表单编辑 + AI 生成 + 批量评测
    library.vue                     # 词库浏览
  components/
    DynamicRenderer.vue             # 低代码组件树渲染器
    ErrorBoundary.vue               # 错误边界
    lc/LcButton.vue                 # 低代码按钮组件
    ui/                             # AppButton, AppCard, AppTextarea, ...
  composables/
    useStorage.ts                   # localStorage 响应式封装
    useHistory.ts                   # 历史记录
    useRestoreData.ts               # 跨组件数据传递
server/
  api/
    chat.post.js                    # AI 对话 + 流式 SSE + 页面 JSON 生成
    generate.post.js                # 结构化表单 → AI 创作提示词
    test-prompt.post.js             # 批量评测（executor + judge 并发管道）
    template-fields.get.js          # 各分类的模板字段定义
```

---

## 关键设计决策

- **结构化编辑器选型（方案 C）**：对比了 textarea 增强和混合模式，最终选择完整表单驱动，降低用户输入门槛
- **`json_object` 模式**：`response_format` 强制 JSON 输出 + `fixJSON` 修复非标准 JSON，双保险
- **`{{#if}}` 条件逻辑**：用正则预处理模板，空字段不渲染，避免提示词中出现"面向，语气，突出卖点"这种空洞文本
- **评分细则化**：将模糊的"吸引力"拆分为可观测的具体维度（开头钩子 / 卖点位置 / 行动号召等），提升评分稳定性
