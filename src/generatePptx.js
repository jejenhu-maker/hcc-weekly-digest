// generatePptx.js — NotebookLM-style, 2 files: EN + ZH (HCC version)
const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const C = {
  white: 'FFFFFF', offWhite: 'F5F5F5', black: '111111',
  dark: '1A1A1A', darkGray: '333333', midGray: '888888',
  lightGray: 'E2E8F0', accent: 'DC2626', accentLight: 'FCA5A5',
  accentDark: '7F1D1D',
};
const F = { main: 'Arial', cjk: 'Microsoft JhengHei' };
const LAYOUT = 'LAYOUT_WIDE';

function makeShadow() {
  return { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.10 };
}

function buildPptx(articles, overallInsights, weekRange, lang) {
  const isZh = lang === 'zh';
  const pptx = new PptxGenJS();
  pptx.layout = LAYOUT;
  pptx.author = 'HCC Weekly Digest';
  pptx.title = isZh ? '肝癌免疫治療與局部消融文獻週報' : 'HCC Weekly Digest';

  // ── COVER ──
  const cover = pptx.addSlide();
  cover.background = { color: C.dark };
  if (isZh) {
    cover.addText('WEEKLY DIGEST', { x: 0.8, y: 0.5, w: 6, fontSize: 9, color: C.midGray, charSpacing: 6, bold: true, margin: 0 });
    cover.addText([
      { text: 'HCC Weekly Digest', options: { fontSize: 44, color: C.white, bold: true, fontFace: F.main, breakLine: true } },
      { text: '肝膽腸胃內科 — 肝癌免疫治療與局部消融', options: { fontSize: 18, color: C.accentLight, fontFace: F.cjk, breakLine: true } },
      { text: '呂大教授 敬啟', options: { fontSize: 20, color: C.white, fontFace: F.cjk } },
    ], { x: 0.8, y: 1.5, w: 11, lineSpacingMultiple: 1.3 });
  } else {
    cover.addText('WEEKLY DIGEST', { x: 0.8, y: 0.5, w: 6, fontSize: 9, color: C.midGray, charSpacing: 6, bold: true, margin: 0 });
    cover.addText([
      { text: 'HCC\nWeekly Digest', options: { fontSize: 48, color: C.white, bold: true, fontFace: F.main, breakLine: true } },
      { text: 'For Prof. Lu', options: { fontSize: 18, color: C.accentLight, fontFace: F.main } },
    ], { x: 0.8, y: 1.5, w: 11, lineSpacingMultiple: 1.0 });
  }

  cover.addText(weekRange, { x: 0.8, y: 5.5, w: 6, fontSize: 14, color: C.midGray, margin: 0 });
  cover.addText(`${articles.length} ${isZh ? '篇精選論文' : 'Selected Papers'}`, { x: 0.8, y: 6.0, w: 6, fontSize: 12, color: C.accent, bold: true, charSpacing: 2, margin: 0 });

  // ── TOC ──
  const toc = pptx.addSlide();
  toc.background = { color: C.white };
  toc.addText(isZh ? '目錄' : 'CONTENTS', { x: 0.8, y: 0.4, w: 4, fontSize: 10, color: C.midGray, charSpacing: 4, bold: true, margin: 0 });
  const tocItems = articles.map((a, i) => {
    const num = String(i + 1).padStart(2, '0');
    return [
      { text: `${num}  `, options: { fontSize: 14, color: C.accent, bold: true, fontFace: F.main } },
      { text: a.title.substring(0, 80) + (a.title.length > 80 ? '…' : ''), options: { fontSize: 11, color: C.darkGray, fontFace: F.main, breakLine: true } },
    ];
  }).flat();
  toc.addText(tocItems, { x: 0.8, y: 1.1, w: 11, lineSpacingMultiple: 1.8 });

  // ── PAPER SLIDES ──
  articles.forEach((a, i) => {
    const num = String(i + 1).padStart(2, '0');
    const paperLink = a.doi ? `https://doi.org/${a.doi}` : a.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/` : a.link || '';
    const bullets = isZh ? (a.bulletPointsZh || []) : (a.bulletPointsEn || []);

    // Slide A: Key Findings (white)
    const sA = pptx.addSlide();
    sA.background = { color: C.white };
    sA.addText(`${num}  ${isZh ? '重點發現' : 'KEY FINDINGS'}`, { x: 0.8, y: 0.35, w: 6, fontSize: 9, color: C.midGray, charSpacing: 3, bold: true, margin: 0 });
    sA.addText(num, { x: 10, y: 0.1, w: 2.8, fontSize: 52, color: C.lightGray, bold: true, align: 'right', margin: 0 });

    const titleOpts = { x: 0.8, y: 0.8, w: 11, fontSize: 24, color: C.black, bold: true, fontFace: F.main, lineSpacingMultiple: 1.15, margin: 0 };
    if (paperLink) titleOpts.hyperlink = { url: paperLink };
    sA.addText(a.title, titleOpts);

    const meta = [a.journal, a.impactFactor ? `IF ${a.impactFactor.toFixed(1)}` : '', a.studyType !== 'Other' ? a.studyType : '', a.isAsiaPriority ? '🌏 Asia' : ''].filter(Boolean).join('  ·  ');
    sA.addText(meta, { x: 0.8, y: 2.0, w: 11, fontSize: 10, color: C.midGray, margin: 0 });


    const bulletItems = bullets.length > 0 ? bullets.map((b, idx) => ({
      text: b,
      options: { bullet: true, breakLine: idx < bullets.length - 1, fontSize: 18, color: C.darkGray, fontFace: isZh ? F.cjk : F.main, paraSpaceAfter: 8 }
    })) : [{ text: isZh ? '（無重點）' : '(No findings)', options: { fontSize: 18, color: C.midGray } }];
    sA.addText(bulletItems, { x: 0.8, y: 2.6, w: 11, valign: 'top' });

    if (paperLink) {
      sA.addText(`📎 ${isZh ? '查看論文' : 'View Paper'} →`, { x: 0.8, y: 6.8, w: 4, fontSize: 10, color: C.accent, bold: true, margin: 0, hyperlink: { url: paperLink } });
    }



  });

  // ── OVERALL ──
  const oSlide = pptx.addSlide();
  oSlide.background = { color: C.accentDark };
  oSlide.addText(isZh ? '綜合啟示' : 'SYNTHESIS', { x: 0.8, y: 0.4, w: 6, fontSize: 9, color: C.midGray, charSpacing: 6, margin: 0 });
  oSlide.addText('Overall Insights\n& Future Directions', { x: 0.8, y: 0.9, w: 11, fontSize: 30, color: C.white, bold: true, fontFace: F.main });
  if (isZh) oSlide.addText('綜合啟示與未來研究方向', { x: 0.8, y: 2.5, w: 11, fontSize: 14, color: C.midGray, fontFace: F.cjk, margin: 0 });
  oSlide.addText(overallInsights || '(No insights)', { x: 0.8, y: isZh ? 3.2 : 2.8, w: 11.5, fontSize: 12, color: C.white, lineSpacingMultiple: 1.6 });

  // ── BACK COVER ──
  const back = pptx.addSlide();
  back.background = { color: C.dark };
  back.addText('Thank You', { x: 0.8, y: 2.5, w: 11, fontSize: 48, color: C.white, bold: true, fontFace: F.main, margin: 0 });
  if (isZh) back.addText('謝謝', { x: 0.8, y: 4.1, w: 11, fontSize: 24, color: C.midGray, fontFace: F.cjk, margin: 0 });
  back.addText('HCC Weekly Digest · 呂大教授 敬啟', { x: 0.8, y: isZh ? 5.0 : 4.3, w: 11, fontSize: 11, color: C.midGray, margin: 0 });

  return pptx;
}

async function generatePptx(articles, overallInsights, weekRange) {
  const outDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const enPptx = buildPptx(articles, overallInsights, weekRange, 'en');
  const enPath = path.join(outDir, 'digest-en.pptx');
  await enPptx.writeFile({ fileName: enPath });
  console.log(`[PPTX] EN saved: ${enPath}`);

  const zhPptx = buildPptx(articles, overallInsights, weekRange, 'zh');
  const zhPath = path.join(outDir, 'digest-zh.pptx');
  await zhPptx.writeFile({ fileName: zhPath });
  console.log(`[PPTX] ZH saved: ${zhPath}`);

  return { enPath, zhPath };
}

module.exports = { generatePptx };
