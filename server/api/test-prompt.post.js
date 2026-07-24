//批量测评提示词质量
function buildJudgePrompt(criteria, dimensionLabels) {
  return `你是一个评分专家。从以下 ${criteria.length} 个维度评分，每项 1-10 分。
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}
评分规则：
- 1-3 分：完全不合格
- 4-6 分：勉强及格，有明显改进空间
- 7-8 分：良好，基本达到预期
- 9-10 分：优秀，超出预期
最终 score = 各项平均分（四舍五入保留 1 位小数）。
返回 JSON：{"score": 数字, "维度1": 分数, "维度2": 分数, ..., "reason": "一句话总结"}`
}

const categoryConfig = {
    copywriting: {
      executor: '你是一个文案写手。根据用户的推广提示词，写一段推广文案。直接输出文案内容，不要分析。',
      judge: buildJudgePrompt([
        '开头是否有钩子，能吸引继续读下去（如疑问、反常识、场景带入）',
        '核心卖点是否在全文前 30% 出现',
        '是否有明确的行动号召（购买/关注/点击）',
        '语言风格是否一致，没有跳脱',
        '整体是否能 3 秒内让目标人群觉得"跟我有关"'
      ]),
      judgeLabels: ['开头钩子', '卖点位置', '行动号召', '语气一致', '人群匹配']
    },
    code: {
      executor: '你是一个程序员。根据用户的代码提示词，实现功能。直接输出代码，不要分析。',
      judge: buildJudgePrompt([
        '代码语法正确，能直接运行无报错',
        '是否覆盖了所有功能需求',
        '是否处理了边界情况和异常输入',
        '变量/函数命名是否清晰，代码可读性高',
        '代码是否简洁，没有多余或重复逻辑'
      ]),
      judgeLabels: ['语法正确', '功能完整', '边界处理', '命名清晰', '代码简洁']
    },
    art: {
      executor: '你是一个AI绘画模型。根据用户的绘画提示词，描述你生成的画面是什么样的。',
      judge: buildJudgePrompt([
        '主体描述是否清晰、具体、无歧义',
        '风格指定是否明确（写实/卡通/水墨等有区分度）',
        '是否有光影/色彩/构图等视觉细节',
        '提示词结构是否完整（主体 + 背景 + 风格 + 细节）'
      ]),
      judgeLabels: ['主体描述', '风格明确', '视觉细节', '结构完整']
    },
    general: {
      executor: '你是一个AI助手。执行用户的指令。',
      judge: buildJudgePrompt([
        '输出是否准确理解了任务要求',
        '输出是否完整，没有遗漏关键部分',
        '内容结构是否清晰，容易理解',
        '是否满足所有显式和隐式约束条件'
      ]),
      judgeLabels: ['理解准确', '内容完整', '结构清晰', '满足约束']
    }
  }

async function callAI(messages, useJson = false){
  const config = useRuntimeConfig()
  const body = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.5,
    max_tokens: 1024,
  }
  if (useJson) body.response_format = { type: 'json_object' }

  const res = await fetch('https://api.deepseek.com/v1/chat/completions',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.deepseekApiKey}`
    },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { template, category = 'general',cases } = body
  const config = categoryConfig[category] || categoryConfig.general

  if (!template || !cases.length) {
    return { error: '缺少模板或用例' }
  }

  //填充模板，并发执行AI
  const outputs = await Promise.all(cases.map(async(c,i)=>{
    // 先处理 {{#if}} 条件块
    let prompt = template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, field, content) => {
      return c[field]?.toString().trim() ? content : ''
    })
    // 再替换 {{变量}}
    prompt = prompt.replace(/\{\{(\w+)\}\}/g, (_, k) => c[k] || '')
    const output = await callAI([
      { role: 'system', content: config.executor },
      { role: 'user', content: prompt }
    ])
    return {index: i, params: c, output , prompt}
  }))

  //AI评分？
  const results = await Promise.all(outputs .map(async(o)=>{
    const judgeInput = `提示词：${o.prompt}\n 输出：${o.output}`
    const judgeReply = await callAI([
      { role: 'system', content: config.judge },
      { role: 'user', content: judgeInput }
    ], true) // useJson = true
    let score = 0,reason = '', subScores = {}
    try{
      const parsed = JSON.parse(judgeReply)
      score = parsed.score || 0
      reason = parsed.reason || ''
      // 提取子维度分数（除了 score 和 reason 之外的数字字段）
      for (const [k, v] of Object.entries(parsed)) {
        if (k !== 'score' && k !== 'reason' && typeof v === 'number') {
          subScores[k] = v
        }
      }
    }catch(e){
      reason = judgeReply.slice(0,100)
    }
    return { params: o.params, output: o.output, score, reason, subScores}
  }))

//计算平均分
 const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

  return { results, avgScore: Math.round(avgScore * 10) / 10, judgeLabels: config.judgeLabels || [] }
})
