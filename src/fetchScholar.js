// fetchScholar.js — search Google Scholar via SerpAPI
const axios = require('axios');
const config = require('./config');

/**
 * Search Google Scholar via SerpAPI and return normalised results.
 * @returns {Promise<Array<Object>>}
 */
async function fetchScholar() {
  if (!config.serpapi.apiKey) {
    console.warn('[Scholar] No SERPAPI_KEY, skipping Google Scholar.');
    return [];
  }

  const results = [];

  for (const query of config.serpapi.queries) {
    console.log(`[Scholar] Searching: "${query}"`);
    try {
      const res = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_scholar',
          q: query,
          as_ylo: new Date().getFullYear(), // current year only
          num: config.serpapi.maxResults,
          api_key: config.serpapi.apiKey,
        },
      });

      const organic = res.data?.organic_results || [];
      for (const r of organic) {
        results.push({
          source: 'scholar',
          title: r.title || '',
          abstract: r.snippet || '(No abstract available)',
          journal: extractJournalFromSnippet(r.publication_info?.summary || ''),
          journalAbbr: '',
          issn: '',
          pubDate: extractYear(r.publication_info?.summary || ''),
          authors: extractAuthors(r.publication_info?.summary || ''),
          authorCount: 0,
          affiliations: [], // Scholar doesn't provide this
          doi: extractDoi(r.link || ''),
          pubTypes: [],
          link: r.link || '',
          pmid: '', // might not have one
        });
      }
    } catch (e) {
      console.warn(`[Scholar] Error searching "${query}":`, e.message);
    }
  }

  // Deduplicate by title similarity
  const seen = new Set();
  return results.filter(r => {
    const key = r.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractJournalFromSnippet(summary) {
  // Pattern: "Author1, Author2 - Journal Name, Year - Publisher"
  const parts = summary.split(' - ');
  if (parts.length >= 2) return parts[1].replace(/,\s*\d{4}.*$/, '').trim();
  return '';
}

function extractYear(summary) {
  const m = summary.match(/\b(20\d{2})\b/);
  return m ? m[1] : '';
}

function extractAuthors(summary) {
  const parts = summary.split(' - ');
  if (parts.length >= 1) {
    return parts[0].split(',').map(s => s.trim()).filter(Boolean).slice(0, 5);
  }
  return [];
}

function extractDoi(link) {
  const m = link.match(/doi\.org\/(.+)/);
  return m ? m[1] : '';
}

module.exports = { fetchScholar };
