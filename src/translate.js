// translate.js — translate English abstracts to Chinese using OpenAI
const OpenAI = require('openai');
const config = require('./config');

let client = null;
function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return client;
}

/**
 * Translate abstract to Traditional Chinese.
 * @param {string} text - English abstract
 * @returns {Promise<string>} Chinese translation
 */
async function translateAbstract(text) {
  if (!text || text === '(No abstract available)') {
    return '（無摘要）';
  }

  try {
    const res = await getClient().chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content:
            '你是醫學論文翻譯專家。請將以下英文醫學論文摘要翻譯成繁體中文。' +
            '保持醫學專有名詞的準確性，專有名詞可保留英文。翻譯要流暢自然。',
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    return res.choices[0]?.message?.content?.trim() || '（翻譯失敗）';
  } catch (e) {
    console.warn('[Translate] Error:', e.message);
    return '（翻譯失敗）';
  }
}

/**
 * Translate all articles (batched with concurrency limit).
 */
async function translateAll(articles) {
  console.log(`[Translate] Translating ${articles.length} abstracts…`);
  // Process 3 at a time to respect rate limits
  const concurrency = 3;
  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency);
    const translations = await Promise.all(
      batch.map(a => translateAbstract(a.abstract))
    );
    batch.forEach((a, idx) => {
      a.abstractZh = translations[idx];
    });
  }
  return articles;
}

module.exports = { translateAll, translateAbstract };
