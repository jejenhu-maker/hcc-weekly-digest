// enrich.js — add Impact Factor, country detection, study type tagging
const path = require('path');
const config = require('./config');

// Load IF lookup
const ifData = require(path.join(__dirname, '..', 'data', 'journal-if.json'));

/**
 * Enrich an article with IF, country, and study type.
 */
function enrichArticle(article) {
  // ── Impact Factor ──
  article.impactFactor = lookupIF(article);

  // ── Country detection (from affiliations) ──
  article.countries = detectCountries(article.affiliations);
  article.isAsiaPriority = article.countries.some(c =>
    config.asiaCountries.includes(c.toLowerCase())
  );

  // ── Study type classification ──
  article.studyType = classifyStudyType(article);

  return article;
}

function lookupIF(article) {
  // Try ISSN first
  if (article.issn && ifData.by_issn[article.issn]) {
    return ifData.by_issn[article.issn].if;
  }
  // Try journal abbreviation (lowercase match)
  if (article.journalAbbr) {
    const abbr = article.journalAbbr.toLowerCase().replace(/\./g, '').trim();
    if (ifData.by_abbr[abbr]) return ifData.by_abbr[abbr];
  }
  // Try journal full name → scan by_issn values
  if (article.journal) {
    const jLower = article.journal.toLowerCase();
    for (const entry of Object.values(ifData.by_issn)) {
      if (entry.name && entry.name.toLowerCase() === jLower) return entry.if;
    }
  }
  return 0; // unknown
}

function detectCountries(affiliations) {
  const countries = new Set();
  const countryPatterns = [
    [/japan/i, 'Japan'],
    [/taiwan|republic of china/i, 'Taiwan'],
    [/korea/i, 'South Korea'],
    [/china(?!.*taiwan)/i, 'China'],
    [/singapore/i, 'Singapore'],
    [/united states|usa|\bU\.?S\.?A?\b/i, 'USA'],
    [/united kingdom|\bU\.?K\.?\b|england|scotland|wales/i, 'UK'],
    [/germany|deutschland/i, 'Germany'],
    [/france/i, 'France'],
    [/italy|italia/i, 'Italy'],
    [/australia/i, 'Australia'],
    [/canada/i, 'Canada'],
    [/netherlands|holland/i, 'Netherlands'],
    [/sweden/i, 'Sweden'],
    [/switzerland/i, 'Switzerland'],
    [/spain|españa/i, 'Spain'],
    [/india/i, 'India'],
    [/brazil|brasil/i, 'Brazil'],
  ];

  for (const aff of affiliations) {
    for (const [pattern, country] of countryPatterns) {
      if (pattern.test(aff)) countries.add(country);
    }
  }
  return [...countries];
}

function classifyStudyType(article) {
  const text = [
    article.title,
    article.abstract,
    ...(article.pubTypes || []),
  ].join(' ').toLowerCase();

  // Check most specific first
  if (/phase\s*(3|iii)/i.test(text)) return 'RCT Phase 3';
  if (/phase\s*(2|ii)/i.test(text)) return 'RCT Phase 2';
  if (/randomized controlled trial|randomised controlled trial/i.test(text)) return 'RCT';
  if (/meta-analysis/i.test(text)) return 'Meta-Analysis';
  if (/systematic review/i.test(text)) return 'Systematic Review';
  if (/retrospective/i.test(text)) return 'Retrospective Study';
  if (/prospective/i.test(text)) return 'Prospective Study';
  if (/case report/i.test(text)) return 'Case Report';
  if (/in vitro|in vivo|cell line|mouse model|xenograft/i.test(text)) return 'Basic Research';
  if (/review/i.test(text)) return 'Review';
  return 'Other';
}

module.exports = { enrichArticle };
