// config.js — centralised settings for HCC weekly digest
require('dotenv').config();

module.exports = {
  // ── PubMed ──
  pubmed: {
    baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    apiKey: process.env.NCBI_API_KEY || '',
    queries: [
      // Core 1: HCC immunotherapy
      '(hepatocellular carcinoma[MeSH] OR liver cancer[tiab] OR HCC[tiab]) AND (immunotherapy[MeSH] OR immune checkpoint[tiab] OR anti-PD-1[tiab] OR anti-PD-L1[tiab] OR atezolizumab[tiab] OR nivolumab[tiab] OR pembrolizumab[tiab] OR durvalumab[tiab] OR tremelimumab[tiab] OR camrelizumab[tiab] OR tislelizumab[tiab] OR sintilimab[tiab])',
      // Core 2: HCC local ablation
      '(hepatocellular carcinoma[MeSH] OR liver cancer[tiab] OR HCC[tiab]) AND (radiofrequency ablation[tiab] OR microwave ablation[tiab] OR cryoablation[tiab] OR local ablation[tiab] OR percutaneous ablation[tiab] OR irreversible electroporation[tiab] OR ethanol injection[tiab])',
    ],
    maxResults: 60,
    dayRange: 7,
  },

  // ── Google Scholar (via SerpAPI) ──
  serpapi: {
    apiKey: process.env.SERPAPI_KEY || '',
    queries: [
      'hepatocellular carcinoma immunotherapy checkpoint inhibitor',
      'hepatocellular carcinoma local ablation radiofrequency microwave',
    ],
    maxResults: 20,
  },

  // ── Impact Factor ──
  ifThreshold: 10,

  // ── Asia priority countries ──
  asiaCountries: ['japan', 'taiwan', 'korea', 'south korea', 'republic of korea'],

  // ── Study type keywords ──
  rctKeywords: [
    'randomized controlled trial', 'randomised controlled trial',
    'phase 2', 'phase ii', 'phase 3', 'phase iii', 'rct',
  ],

  // ── Output ──
  maxPapers: 10,

  // ── OpenAI (translation) ──
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
  },

  // ── Email ──
  email: {
    from: process.env.EMAIL_FROM || 'jejen.hu@gmail.com',
    to: process.env.EMAIL_TO || 'luita@vghtc.gov.tw',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: process.env.EMAIL_FROM || 'jejen.hu@gmail.com',
    smtpPass: process.env.EMAIL_PASS || '',
  },

  // ── Page URL ──
  pageUrl: process.env.PAGE_URL || 'https://jejenhu-maker.github.io/hcc-weekly-digest/',
};
