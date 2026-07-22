export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { prompt } = body

  if (!prompt) {
    return { reply: '请输入要测试的提示词' }
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.deepseekApiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是AI助手，根据用户的输入给出回复。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1024
    })
  })

  if (!response.ok) {
    const err = await response.text()
    return { reply: 'API 请求失败: ' + err }
  }

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content || 'AI 没有返回内容'
  return { reply }
})
