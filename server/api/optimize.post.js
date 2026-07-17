export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { prompt, instruction } = body

  //
  const message = [
    {role:'system', content:'你是一个提示词优化专家。直接输出优化后的提示词，不要加额外解释。'},
    {role: 'user', content: `原始提示词：${prompt}\n\n优化要求：${instruction}`},
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
      temperature: 0.5,
      max_tokens: 2048
    })
    
  })
  const data = await response.json()
  const reply = data.choices?.[0]?.message?.content || '没有收到回复'
  return { reply }
})

//
