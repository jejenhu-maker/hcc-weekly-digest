// generateInsights.js — LLM insights for HCC papers
const OpenAI = require('openai');
const config = require('./config');

let client = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openai.apiKey });
  return client;
}

async function generateInsights(articles) {
  console.log(`[Insights] Generating insights for ${articles.length} articles…`);

  for (let i = 0; i < articles.length; i += 3) {
    const batch = articles.slice(i, i + 3);
    await Promise.all(batch.map(generateArticleInsight));
  }

  const overallPrompt = articles
    .map((a, i) => `[${i + 1}] ${a.title}\nAbstract: ${a.abstract.substring(0, 300)}…`)
    .join('\n\n');

  try {
    const res = await getClient().chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: `你是肝癌（HCC）免疫治療與局部消融的資深研究學者。請根據以下本週發表的論文，用中英對照的方式撰寫：
1. 綜合啟示（Overall Insights）：這些論文整體帶給臨床與研究的啟發（3-5 點）
2. 未來研究方向（Future Research Directions）：基於這些論文，值得探索的研究方向（3-5 點）

格式要求：
- 每一點都要有英文和繁體中文
- 精簡但有深度
- 適合放在學術簡報中`
        },
        { role: 'user', content: overallPrompt },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });
    const overall = res.choices[0]?.message?.content?.trim() || '';
    return { articles, overallInsights: overall };
  } catch (e) {
    console.warn('[Insights] Overall synthesis error:', e.message);
    return { articles, overallInsights: '(Generation failed)' };
  }
}

async function generateArticleInsight(article) {
  try {
    const res = await getClient().chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: `你是肝癌（HCC）免疫治療與局部消融的資深研究學者。針對以下論文，請用中英對照撰寫：
1. 臨床啟示（Clinical Insight）：這篇研究對臨床實務的意義（2-3 句）
2. 未來方向（Future Direction）：基於此研究可延伸的方向（2-3 句）

格式：
**Clinical Insight / 臨床啟示**
EN: ...
ZH: ...

**Future Direction / 未來方向**
EN: ...
ZH: ...`
        },
        {
          role: 'user',
          content: `Title: ${article.title}\nJournal: ${article.journal}\nAbstract: ${article.abstract}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });
    article.insight = res.choices[0]?.message?.content?.trim() || '';
  } catch (e) {
    console.warn(`[Insights] Error for "${article.title.substring(0, 40)}…":`, e.message);
    article.insight = '';
  }
}

module.exports = { generateInsights };
