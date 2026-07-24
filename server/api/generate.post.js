export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { fields, category, template } = body

  if (!fields || !template) {
    return { error: '缺少字段或模板' }
  }

  // 把字段拼成描述，让 AI 生成更丰富的提示词
  const fieldDesc = Object.entries(fields)
    .map(([key, val]) => `${key}：${val}`)
    .join('，')

  const categoryPrompts = {
    copywriting: `你是一个文案提示词专家。根据用户提供的以下字段，生成一段完整的推广文案提示词，要自然流畅、有感染力，不要列字段，直接输出完整的提示词。\n字段：${fieldDesc}\n模板参考：${template}`,
    code: `你是一个代码提示词专家。根据用户提供的以下字段，生成一段完整的代码提示词，要清晰明确，直接输出完整的提示词。\n字段：${fieldDesc}\n模板参考：${template}`,
    art: `你是一个绘画提示词专家。根据用户提供的以下字段，生成一段完整的绘画提示词，要富有画面感、细节丰富，直接输出完整的提示词。\n字段：${fieldDesc}\n模板参考：${template}`,
    general: `你是一个提示词专家。根据用户提供的以下字段，生成一段完整的提示词，要准确清晰，直接输出完整的提示词。\n字段：${fieldDesc}\n模板参考：${template}`
  }

  const systemPrompt = categoryPrompts[category] || categoryPrompts.general

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.deepseekApiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请根据这些字段生成提示词：${fieldDesc}` }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  })

  if (!res.ok) {
    const err = await res.text()
    return { error: 'AI 请求失败: ' + err }
  }

  const data = await res.json()
  const reply = data.choices?.[0]?.message?.content || ''
  return { result: reply }
})
