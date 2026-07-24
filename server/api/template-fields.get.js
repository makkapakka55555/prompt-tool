const templates = {
  copywriting: {
    fields: [
      { key: 'product', label: '产品名称', type: 'text', placeholder: '例如：XX口红' },
      { key: 'audience', label: '目标人群', type: 'text', placeholder: '例如：20~30岁女性' },
      { key: 'tone', label: '语气风格', type: 'select', options: ['口语化', '正式', '幽默', '温暖'] },
      { key: 'selling', label: '核心卖点', type: 'text', placeholder: '例如：不沾杯、显白' },
    ],
    template: '你是文案专家。写{{product}}的推广文案。\n{{#if audience}}面向{{audience}}。{{/if}}\n{{#if tone}}语气{{tone}}。{{/if}}\n{{#if selling}}突出卖点：{{selling}}。{{/if}}'
  },
  code: {
    fields: [
      { key: 'tech', label: '技术栈', type: 'text', placeholder: '例如：Vue 3 + TypeScript' },
      { key: 'function', label: '功能描述', type: 'text', placeholder: '例如：用户登录功能' },
      { key: 'input', label: '输入格式', type: 'text', placeholder: '例如：用户名+密码' },
      { key: 'output', label: '输出格式', type: 'text', placeholder: '例如：返回 token' },
    ],
    template: '你是{{tech}}开发专家。实现{{function}}。\n{{#if input}}输入：{{input}}。{{/if}}\n{{#if output}}输出：{{output}}。{{/if}}'
  },
  art: {
    fields: [
      { key: 'subject', label: '主体描述', type: 'text', placeholder: '例如：一只猫' },
      { key: 'background', label: '环境背景', type: 'text', placeholder: '例如：月光下的花园' },
      { key: 'style', label: '画风流派', type: 'select', options: ['写实', '卡通', '水墨', '赛博朋克'] },
      { key: 'params', label: '参数', type: 'text', placeholder: '例如：4K, 8K, 细节丰富' },
    ],
    template: '你是{{style}}画师。\n主体：{{subject}}\n背景：{{background}}\n{{#if params}}参数：{{params}}{{/if}}'
  },
  general: {
    fields: [
      { key: 'role', label: '角色设定', type: 'text', placeholder: '例如：AI助手' },
      { key: 'task', label: '任务描述', type: 'text', placeholder: '例如：帮我写一封信' },
      { key: 'constraint', label: '约束条件', type: 'text', placeholder: '例如：不超过200字' },
    ],
    template: '你是{{role}}。\n{{task}}\n{{#if constraint}}约束：{{constraint}}{{/if}}'
  },
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const category = query.category || 'general'
  const tpl = templates[category]
  if (!tpl) return { fields: [], template: '' }
  return { fields: tpl.fields, template: tpl.template }
})
