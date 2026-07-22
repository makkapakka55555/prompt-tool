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
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1024
    })
  })

  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content || '没有收到回复'
  return { reply }
})
