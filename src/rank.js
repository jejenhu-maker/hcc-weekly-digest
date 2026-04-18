// rank.js — score and sort articles, pick top N
const config = require('./config');

/**
 * Score & rank articles, return top N.
 * Scoring:
 *   - IF score: (impactFactor / 10) * 40 pts  (max ~60 for top journals)
 *   - Asia priority: +20 pts
 *   - RCT Phase 3: +30, Phase 2: +25, RCT: +20, Meta-Analysis: +15
 *   - IF >= threshold: +10 bonus
 */
function rankArticles(articles) {
  for (const a of articles) {
    let score = 0;

    // IF component (normalized, higher = better)
    score += Math.min((a.impactFactor || 0) / 10, 6) * 10;

    // IF threshold bonus
    if (a.impactFactor >= config.ifThreshold) score += 10;

    // Asia priority
    if (a.isAsiaPriority) score += 20;

    // Study type bonus
    const typeBonus = {
      'RCT Phase 3': 30,
      'RCT Phase 2': 25,
      'RCT': 20,
      'Meta-Analysis': 15,
      'Systematic Review': 10,
      'Prospective Study': 8,
      'Basic Research': 5,
    };
    score += typeBonus[a.studyType] || 0;

    a.score = Math.round(score * 10) / 10;
  }

  // Sort descending by score, then by IF as tiebreaker
  articles.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.impactFactor || 0) - (a.impactFactor || 0);
  });

  // Deduplicate by DOI or title
  const seen = new Set();
  const unique = [];
  for (const a of articles) {
    const key = a.doi
      ? a.doi.toLowerCase()
      : a.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(a);
  }

  return unique.slice(0, config.maxPapers);
}

module.exports = { rankArticles };
