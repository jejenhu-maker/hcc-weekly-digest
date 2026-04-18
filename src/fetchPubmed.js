// fetchPubmed.js — search PubMed via NCBI E-utilities and return parsed articles
const axios = require('axios');
const config = require('./config');
const dayjs = require('dayjs');

const BASE = config.pubmed.baseUrl;

/**
 * Search PubMed and return article details.
 * @returns {Promise<Array<Object>>} articles
 */
async function fetchPubmed() {
  const dateTo = dayjs().format('YYYY/MM/DD');
  const dateFrom = dayjs().subtract(config.pubmed.dayRange, 'day').format('YYYY/MM/DD');

  // Combine all queries with OR
  const combinedQuery = config.pubmed.queries
    .map(q => `(${q})`)
    .join(' OR ');

  const fullQuery = `${combinedQuery} AND ("${dateFrom}"[PDAT] : "${dateTo}"[PDAT])`;

  console.log('[PubMed] Searching:', fullQuery.substring(0, 120) + '…');

  // Step 1: esearch → get PMIDs
  const searchParams = {
    db: 'pubmed',
    term: fullQuery,
    retmax: config.pubmed.maxResults,
    sort: 'pub_date',
    retmode: 'json',
  };
  if (config.pubmed.apiKey) searchParams.api_key = config.pubmed.apiKey;

  const searchRes = await axios.get(`${BASE}/esearch.fcgi`, { params: searchParams });
  const idList = searchRes.data?.esearchresult?.idlist || [];
  console.log(`[PubMed] Found ${idList.length} PMIDs`);
  if (idList.length === 0) return [];

  // Step 2: efetch → get article details (XML → parse)
  const fetchParams = {
    db: 'pubmed',
    id: idList.join(','),
    retmode: 'xml',
    rettype: 'abstract',
  };
  if (config.pubmed.apiKey) fetchParams.api_key = config.pubmed.apiKey;

  const fetchRes = await axios.get(`${BASE}/efetch.fcgi`, { params: fetchParams });
  const xml = fetchRes.data;

  return parsePubmedXml(xml);
}

/**
 * Minimal XML parser for PubMed efetch results.
 * (We avoid heavy XML libs; PubMed structure is predictable.)
 */
function parsePubmedXml(xml) {
  const articles = [];
  const articleBlocks = xml.split('<PubmedArticle>').slice(1);

  for (const block of articleBlocks) {
    try {
      const pmid = extract(block, '<PMID[^>]*>', '</PMID>');
      const title = cleanXml(extract(block, '<ArticleTitle>', '</ArticleTitle>'));
      const abstractParts = [];
      const absBlocks = block.split('<AbstractText').slice(1);
      for (const ab of absBlocks) {
        const text = cleanXml(ab.substring(ab.indexOf('>') + 1, ab.indexOf('</AbstractText>')));
        if (text) abstractParts.push(text);
      }
      const abstract = abstractParts.join(' ') || '(No abstract available)';

      // Journal info
      const journal = cleanXml(extract(block, '<Title>', '</Title>'));
      const journalAbbr = cleanXml(extract(block, '<ISOAbbreviation>', '</ISOAbbreviation>'));
      const issn = extract(block, '<ISSN[^>]*>', '</ISSN>');

      // Date
      const year = extract(block, '<Year>', '</Year>');
      const month = extract(block, '<Month>', '</Month>');
      const day = extract(block, '<Day>', '</Day>');
      const pubDate = [year, month, day].filter(Boolean).join('-');

      // Authors
      const authors = [];
      const authorBlocks = block.split('<Author ').slice(1);
      for (const auth of authorBlocks) {
        const lastName = extract(auth, '<LastName>', '</LastName>');
        const foreName = extract(auth, '<ForeName>', '</ForeName>');
        if (lastName) authors.push(`${lastName} ${foreName || ''}`.trim());
      }

      // Affiliations (for country detection)
      const affiliations = [];
      const affBlocks = block.split('<Affiliation>').slice(1);
      for (const aff of affBlocks) {
        const text = cleanXml(aff.substring(0, aff.indexOf('</Affiliation>')));
        if (text) affiliations.push(text);
      }

      // DOI
      const doiMatch = block.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
      const doi = doiMatch ? doiMatch[1] : '';

      // Publication types
      const pubTypes = [];
      const ptBlocks = block.split('<PublicationType').slice(1);
      for (const pt of ptBlocks) {
        const text = cleanXml(pt.substring(pt.indexOf('>') + 1, pt.indexOf('</PublicationType>')));
        if (text) pubTypes.push(text);
      }

      articles.push({
        source: 'pubmed',
        pmid,
        title,
        abstract,
        journal,
        journalAbbr,
        issn,
        pubDate,
        authors: authors.slice(0, 10), // cap display
        authorCount: authors.length,
        affiliations,
        doi,
        pubTypes,
      });
    } catch (e) {
      console.warn('[PubMed] Parse error on one article, skipping:', e.message);
    }
  }

  return articles;
}

function extract(text, openTag, closeTag) {
  const re = new RegExp(openTag + '([\\s\\S]*?)' + closeTag);
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function cleanXml(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .trim();
}

module.exports = { fetchPubmed };
