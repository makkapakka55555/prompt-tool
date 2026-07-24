import { setHeader } from 'h3'

// 修复 AI 输出的不合法 JSON
function fixJSON(str) {
  if (!str) return str
  // 去掉 ```json 和 ``` 包裹
  let s = str.replace(/```json\s*/gi, '').replace(/```\s*/g, '')
  // 给没加引号的 key 补引号：{ type: "card" } → { "type": "card" }
  s = s.replace(/([{,]\s*?)(\w+)(\s*?):/g, '$1"$2"$3:')
  // 去掉多余的逗号：{ "a":1, } → { "a":1 }
  s = s.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']')
  return s
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { message, history, systemPrompt, temperature, maxTokens, category = 'general' } = body

  // 根据分类选择元提示词
  const categoryPrompts = {
    copywriting: '你是一个文案提示词专家。根据用户需求生成文案提示词的各个字段，只输出JSON不要其他文字。字段：product(产品名称), audience(目标人群), tone(语气风格),selling(核心卖点)。示例：{"product":"XX口红","audience":"20-30岁女性","tone":"口语化","selling":"不沾杯"}',
    code: '你是一个代码提示词专家。根据用户需求生成代码提示词的各个字段，只输出JSON不要其他文字。字段：tech(技术栈), function(功能描述), input(输入格式), output(输出格式)。示例：{"tech":"Vue3","function":"用户登录","input":"用户名密码","output":"返回token"}',
    art: '你是一个绘画提示词专家。根据用户需求生成绘画提示词的各个字段，只输出JSON不要其他文字。字段：subject(主体描述), background(环境背景), style(画风流派),params(参数)。示例：{"subject":"一只猫","background":"月光下的花园","style":"水墨","params":"4K"}',
    general: '你是一个提示词专家。根据用户需求生成提示词的各个字段，只输出JSON不要其他文字。字段：role(角色设定), task(任务描述),constraint(约束条件)。示例：{"role":"AI助手","task":"写一封信","constraint":"不超过200字"}',
    page: '你是一个页面生成专家。根据用户需求生成组件树。只输出 JSON，不要输出其他任何文字。不要用代码块，不要包裹，直接输出 JSON 对象。可用组件：title(标题，text 属性)、text(文字，text 属性)、input(输入框，placeholder 属性，label 属性)、textarea(多行输入，placeholder 属性)、button(按钮，text 属性)、image(图片，src 属性)、select(下拉框，label 属性，options 数组)、link(链接，text 属性，href 属性)、checkbox(复选框，label 属性，checked 布尔值)、card(卡片容器)、row(水平容器)、col(垂直容器)。children 是子组件数组。示例：{"type":"card","props":{},"children":[{"type":"title","props":{"text":"标题"}},{"type":"input","props":{"placeholder":"占位"}},{"type":"button","props":{"text":"按钮"}}]}'
  }

  const finalPrompt = categoryPrompts[category] || categoryPrompts.general

  const messages = [
    { role: 'system', content: finalPrompt },
    ...(history || []),
    { role: 'user', content: message }
  ]

//设置SSE响应头
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  // ===== 页面分类：非流式 + JSON 模式（保证 100% 合法） =====
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages,
        temperature: temperature || 0.5,
        max_tokens: maxTokens || 2048,
        response_format: { type: 'json_object' }
      })
    })
    if (!res.ok) {
      const errText = await res.text()
      event.node.res.write(`data: ${JSON.stringify({ type: 'error', message: errText })}\n\n`)
      event.node.res.end()
      return
    }
    const data = await res.json()
    const fullReply = data.choices?.[0]?.message?.content || ''
    const extracted = fixJSON(fullReply)
    if(category === 'page'){
      event.node.res.write(`data: ${JSON.stringify({ type: 'done', extracted })}\n\n`)
      event.node.res.end()
    }else{
      let fields = {}
      try{
        fields = JSON.parse(fixJSON(fullReply))
      }catch(e){}
      event.node.res.write(`data: ${JSON.stringify({ type: 'done', extracted })}\n\n`)
      event.node.res.end()
    }
   
    return

  // ===== 其他分类：流式输出 =====
//   const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${config.deepseekApiKey}`
//     },
//     body: JSON.stringify({
//       model: 'deepseek-v4-flash',
//       messages,
//       temperature: temperature || 0.5,
//       max_tokens: maxTokens || 1024,
//       stream: true
//     })
//   })

//   if (!response.ok) {
//     const errText = await response.text()
//     event.node.res.write(`data: ${JSON.stringify({ type: 'error', message: errText })}\n\n`)
//     event.node.res.end()
//     return
//   }

//   const reader = response.body.getReader()
//   const decoder = new TextDecoder()
//   let fullReply = ''
//   while(true){
//     const {done,value} = await reader.read()
//     if(done) break
//     const chunk = decoder.decode(value,{stream:true})
//     const lines = chunk.split('\n')
//     for(const line of lines){
//       if(line.startsWith('data:')){
//         const data = line.slice(6).trim()
//         if(data === '[DONE]') continue
//         try {
//               const json = JSON.parse(data)
//               const content = json.choices?.[0]?.delta?.content || ''
//               if (content) {
//                 fullReply += content
//                 event.node.res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
//               }
//             }catch(e){}
//       }
//     }
//   }
//   event.node.res.write(`data: ${JSON.stringify({ type: 'done', extracted: fullReply })}\n\n`)
//   event.node.res.end()
})

