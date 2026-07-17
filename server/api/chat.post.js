export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { message, history, systemPrompt, temperature, maxTokens, category = 'general' } = body

  // 根据分类选择元提示词
  const categoryPrompts = {
    copywriting: '你是一个文案提示词专家。先分析用户需求，给出你的建议。然后按以下要素生成提示词：平台定位、目标人群、语气风格、核心卖点、行动号召。最后用 ---PROMPT_START--- 和 ---PROMPT_END--- 包裹生成的提示词。注意：只有被包裹的部分才是最终的提示词，前面的分析不要放在包裹内。',
    code: '你是一个代码提示词专家。先分析用户需求，给出你的建议。然后按以下要素生成提示词：技术栈、功能描述、输入输出格式、边界条件、测试用例。最后用 ---PROMPT_START--- 和 ---PROMPT_END--- 包裹生成的提示词。注意：只有被包裹的部分才是最终的提示词，前面的分析不要放在包裹内。',
    art: '你是一个绘画提示词专家。先分析用户需求，给出你的建议。然后按以下要素生成提示词：主体描述、环境背景、画风流派、色彩光线、构图角度、参数。最后用 ---PROMPT_START--- 和 ---PROMPT_END--- 包裹生成的提示词。注意：只有被包裹的部分才是最终的提示词。前面的分析不要放在包裹内。',
    general: systemPrompt || '你是一个提示词专家，根据用户需求生成结构化的提示词。先分析用户需求，给出建议，然后用 ---PROMPT_START--- 和 ---PROMPT_END--- 包裹生成的提示词。'
  }

  const finalPrompt = categoryPrompts[category] || categoryPrompts.general

  const messages = [
    { role: 'system', content: finalPrompt },
    ...(history || []),
    { role: 'user', content: message }
  ]

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.deepseekApiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages,
      temperature: temperature || 0.5,
      max_tokens: maxTokens || 1024
    })
  })

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content || '没有收到回复'

  const match = reply.match(/---PROMPT_START---\n?([\s\S]*)\n?---PROMPT_END---/)
  const extracted = match ? match[1].trim() : reply

  return { reply, extracted }
})
