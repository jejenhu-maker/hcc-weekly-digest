// generateInsights.js — LLM: bullet points + clinical insight + future direction per article (HCC)
const OpenAI = require('openai');
const config = require('./config');

let client = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openai.apiKey });
  return client;
}

async function generateInsights(articles) {
  console.log(`[Insights] Generating structured insights for ${articles.length} articles…`);

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
          content: `你是肝癌（HCC）免疫治療與局部消融的資深研究學者。根據本週論文，用中英對照撰寫：
1. 綜合啟示（Overall Insights）：3-5 點
2. 未來研究方向（Future Research Directions）：3-5 點

每點都要有英文和繁體中文，精簡有深度，適合學術簡報。`
        },
        { role: 'user', content: overallPrompt },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });
    return { articles, overallInsights: res.choices[0]?.message?.content?.trim() || '' };
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
          content: `你是肝癌（HCC）免疫治療與局部消融的資深研究學者。請針對以下論文生成結構化摘要。

請嚴格按照以下 JSON 格式回覆，不要加任何其他文字：
{
  "bulletPointsEn": ["point 1", "point 2", "point 3"],
  "bulletPointsZh": ["重點一", "重點二", "重點三"],
  "insightClinical": "EN: ... \\nZH: ...",
  "insightFuture": "EN: ... \\nZH: ..."
}

規則（777 原則 — 每頁最多 7 點，每點最多 7 個字/詞）：
- bulletPointsEn：3-5 個重點，每點 5-20 個英文單字（簡潔但完整）
- bulletPointsZh：3-5 個重點，每點 5-20 個中文字（專有名詞保留英文）
- insightClinical：臨床啟示，一句英文（≤10 words）+ 一句中文（≤15字）
- insightFuture：未來方向，一句英文（≤10 words）+ 一句中文（≤15字）`
        },
        {
          role: 'user',
          content: `Title: ${article.title}\nJournal: ${article.journal}\nAbstract: ${article.abstract}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    });

    const raw = res.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(raw);

    article.bulletPointsEn = parsed.bulletPointsEn || [];
    article.bulletPointsZh = parsed.bulletPointsZh || [];
    article.insightClinical = parsed.insightClinical || '';
    article.insightFuture = parsed.insightFuture || '';
    article.insight = `${article.insightClinical}\n\n${article.insightFuture}`;

  } catch (e) {
    console.warn(`[Insights] Error for "${article.title.substring(0, 40)}…":`, e.message);
    article.bulletPointsEn = ['(Generation failed)'];
    article.bulletPointsZh = ['（生成失敗）'];
    article.insightClinical = '';
    article.insightFuture = '';
    article.insight = '';
  }
}

module.exports = { generateInsights };
