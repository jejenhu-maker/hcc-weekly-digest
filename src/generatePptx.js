// generatePptx.js — server-side PPTX generation with professional design
// Theme: Tech Innovation (bold medical red/dark for HCC)
const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const THEME = {
  dark: '1e1e1e',
  red: 'dc2626',
  redLight: 'fca5a5',
  redMuted: 'b91c1c',
  white: 'FFFFFF',
  offWhite: 'fafafa',
  darkText: '1e1e1e',
  lightText: 'f5f5f5',
  accent: '0066ff',
  mutedText: '737373',
  cardBg: 'f5f5f5',
  divider: 'd4d4d4',
};

const FONT = {
  header: 'Arial',
  body: 'Arial',
  cjk: 'Microsoft JhengHei',
};

function generatePptx(articles, overallInsights, weekRange) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'HCC Weekly Digest';
  pptx.subject = 'Weekly Literature Review';

  // ═══ COVER ═══
  const cover = pptx.addSlide();
  cover.background = { color: THEME.dark };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: THEME.red } });
  cover.addShape(pptx.ShapeType.rect, { x: 4.5, y: 2.0, w: 4.33, h: 0.04, fill: { color: THEME.red } });
  cover.addText('🔬', { x: 0, y: 1.2, w: '100%', fontSize: 48, align: 'center' });
  cover.addText('HCC Weekly Digest', { x: 1.5, y: 2.3, w: 10.33, fontSize: 38, color: THEME.white, align: 'center', fontFace: FONT.header, bold: true });
  cover.addText('肝膽腸胃內科 — 肝癌免疫治療與局部消融文獻週報', { x: 1.5, y: 3.5, w: 10.33, fontSize: 18, color: THEME.redLight, align: 'center', fontFace: FONT.cjk });
  cover.addText('呂大教授 敬啟', { x: 1.5, y: 4.3, w: 10.33, fontSize: 20, color: THEME.white, align: 'center', fontFace: FONT.cjk });
  cover.addShape(pptx.ShapeType.rect, { x: 4.5, y: 4.9, w: 4.33, h: 0.04, fill: { color: THEME.red } });
  cover.addText(weekRange, { x: 1.5, y: 5.1, w: 10.33, fontSize: 16, color: THEME.mutedText, align: 'center' });
  cover.addText(`${articles.length} Selected Papers`, { x: 1.5, y: 5.7, w: 10.33, fontSize: 14, color: THEME.mutedText, align: 'center' });
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: 13.33, h: 0.08, fill: { color: THEME.red } });

  // ═══ TABLE OF CONTENTS ═══
  const toc = pptx.addSlide();
  toc.background = { color: THEME.offWhite };
  toc.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.25, h: 7.5, fill: { color: THEME.red } });
  toc.addText('CONTENTS', { x: 0.6, y: 0.3, w: 4, fontSize: 12, color: THEME.red, fontFace: FONT.header, bold: true, charSpacing: 4 });
  toc.addText('目錄', { x: 0.6, y: 0.6, w: 4, fontSize: 12, color: THEME.mutedText, fontFace: FONT.cjk });
  toc.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 5, h: 0.02, fill: { color: THEME.divider } });

  articles.forEach((a, i) => {
    const y = 1.3 + i * 0.55;
    const num = String(i + 1).padStart(2, '0');
    toc.addText(num, { x: 0.6, y, w: 0.5, fontSize: 14, color: THEME.red, fontFace: FONT.header, bold: true });
    toc.addText(a.title.substring(0, 85) + (a.title.length > 85 ? '…' : ''), { x: 1.2, y, w: 11.5, fontSize: 11, color: THEME.darkText, fontFace: FONT.body });
  });

  // ═══ PAPER SLIDES ═══
  articles.forEach((a, i) => {
    const num = String(i + 1).padStart(2, '0');

    // Slide A: Title + Key Findings
    const sA = pptx.addSlide();
    sA.background = { color: THEME.white };
    sA.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.25, h: 7.5, fill: { color: THEME.red } });
    sA.addShape(pptx.ShapeType.rect, { x: 12.0, y: 0, w: 1.33, h: 0.6, fill: { color: THEME.dark } });
    sA.addText(num, { x: 12.0, y: 0.05, w: 1.33, fontSize: 20, color: THEME.redLight, align: 'center', fontFace: FONT.header, bold: true });

    sA.addText(a.title, { x: 0.6, y: 0.3, w: 11, fontSize: 18, color: THEME.dark, fontFace: FONT.header, bold: true, lineSpacingMultiple: 1.2 });

    let meta = [];
    if (a.journal) meta.push(`📰 ${a.journal}`);
    if (a.impactFactor) meta.push(`IF ${a.impactFactor.toFixed(1)}`);
    if (a.studyType && a.studyType !== 'Other') meta.push(a.studyType);
    if (a.isAsiaPriority) meta.push('🌏 Asia');
    if (a.pubDate) meta.push(`📅 ${a.pubDate}`);
    sA.addText(meta.join('  ·  '), { x: 0.6, y: 1.3, w: 11, fontSize: 10, color: THEME.mutedText });
    sA.addText(`👥 ${formatAuthors(a)}`, { x: 0.6, y: 1.6, w: 11, fontSize: 10, color: THEME.mutedText });
    sA.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.95, w: 11.5, h: 0.02, fill: { color: THEME.divider } });

    sA.addText('KEY FINDINGS', { x: 0.6, y: 2.15, w: 5.5, fontSize: 10, color: THEME.red, fontFace: FONT.header, bold: true, charSpacing: 2 });
    const enBullets = (a.bulletPointsEn || ['(No key findings)']).map(b => ({ text: b, options: { fontSize: 10, color: THEME.darkText, fontFace: FONT.body, lineSpacingMultiple: 1.4, bullet: { code: '25CF', color: THEME.red }, indentLevel: 0 } }));
    sA.addText(enBullets, { x: 0.6, y: 2.5, w: 5.8, valign: 'top' });

    sA.addText('重點發現', { x: 6.8, y: 2.15, w: 5.5, fontSize: 10, color: THEME.red, fontFace: FONT.cjk, bold: true, charSpacing: 2 });
    const zhBullets = (a.bulletPointsZh || ['（無重點摘要）']).map(b => ({ text: b, options: { fontSize: 10, color: THEME.darkText, fontFace: FONT.cjk, lineSpacingMultiple: 1.4, bullet: { code: '25CF', color: THEME.red }, indentLevel: 0 } }));
    sA.addText(zhBullets, { x: 6.8, y: 2.5, w: 5.8, valign: 'top' });

    if (a.doi) {
      sA.addText(`DOI: ${a.doi}`, { x: 0.6, y: 6.9, w: 11, fontSize: 8, color: THEME.mutedText, hyperlink: { url: `https://doi.org/${a.doi}` } });
    }
    sA.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: 13.33, h: 0.08, fill: { color: THEME.red } });

    // Slide B: Insights
    const sB = pptx.addSlide();
    sB.background = { color: THEME.offWhite };
    sB.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.25, h: 7.5, fill: { color: THEME.red } });
    sB.addShape(pptx.ShapeType.rect, { x: 12.0, y: 0, w: 1.33, h: 0.6, fill: { color: THEME.dark } });
    sB.addText(num, { x: 12.0, y: 0.05, w: 1.33, fontSize: 20, color: THEME.redLight, align: 'center', fontFace: FONT.header, bold: true });

    sB.addText(a.title.substring(0, 100) + (a.title.length > 100 ? '…' : ''), { x: 0.6, y: 0.3, w: 11, fontSize: 14, color: THEME.dark, fontFace: FONT.header, bold: true });
    sB.addShape(pptx.ShapeType.rect, { x: 0.6, y: 0.9, w: 11.5, h: 0.02, fill: { color: THEME.divider } });

    // Clinical Insight card
    sB.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.1, w: 5.9, h: 2.8, fill: { color: THEME.white }, rectRadius: 0.08, shadow: { type: 'outer', blur: 3, offset: 1, color: '00000015' } });
    sB.addText('💡 CLINICAL INSIGHT', { x: 0.7, y: 1.2, w: 5.5, fontSize: 10, color: THEME.red, bold: true, charSpacing: 2 });
    sB.addText('臨床啟示', { x: 0.7, y: 1.45, w: 5.5, fontSize: 10, color: THEME.mutedText, fontFace: FONT.cjk });
    sB.addText(a.insightClinical || '(No insight)', { x: 0.7, y: 1.8, w: 5.5, fontSize: 10, color: THEME.darkText, lineSpacingMultiple: 1.4 });

    // Future Direction card
    sB.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.1, w: 5.9, h: 2.8, fill: { color: THEME.white }, rectRadius: 0.08, shadow: { type: 'outer', blur: 3, offset: 1, color: '00000015' } });
    sB.addText('🔮 FUTURE DIRECTION', { x: 7.0, y: 1.2, w: 5.5, fontSize: 10, color: THEME.red, bold: true, charSpacing: 2 });
    sB.addText('未來方向', { x: 7.0, y: 1.45, w: 5.5, fontSize: 10, color: THEME.mutedText, fontFace: FONT.cjk });
    sB.addText(a.insightFuture || '(No direction)', { x: 7.0, y: 1.8, w: 5.5, fontSize: 10, color: THEME.darkText, lineSpacingMultiple: 1.4 });

    sB.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: 13.33, h: 0.08, fill: { color: THEME.red } });
  });

  // ═══ OVERALL ═══
  const oSlide = pptx.addSlide();
  oSlide.background = { color: THEME.dark };
  oSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: THEME.red } });
  oSlide.addText('💡', { x: 0, y: 0.5, w: '100%', fontSize: 36, align: 'center' });
  oSlide.addText('OVERALL INSIGHTS & FUTURE DIRECTIONS', { x: 1, y: 1.2, w: 11.33, fontSize: 18, color: THEME.redLight, align: 'center', bold: true, charSpacing: 2 });
  oSlide.addText('綜合啟示與未來研究方向', { x: 1, y: 1.7, w: 11.33, fontSize: 14, color: THEME.mutedText, align: 'center', fontFace: FONT.cjk });
  oSlide.addShape(pptx.ShapeType.rect, { x: 4.5, y: 2.1, w: 4.33, h: 0.02, fill: { color: THEME.red } });
  oSlide.addText(overallInsights || '(No insights)', { x: 1, y: 2.4, w: 11.33, fontSize: 10, color: THEME.lightText, lineSpacingMultiple: 1.5 });
  oSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: 13.33, h: 0.08, fill: { color: THEME.red } });

  // ═══ BACK COVER ═══
  const back = pptx.addSlide();
  back.background = { color: THEME.dark };
  back.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: THEME.red } });
  back.addShape(pptx.ShapeType.rect, { x: 4.5, y: 2.5, w: 4.33, h: 0.04, fill: { color: THEME.red } });
  back.addText('Thank You', { x: 1, y: 2.8, w: 11.33, fontSize: 40, color: THEME.white, align: 'center', bold: true });
  back.addText('謝謝', { x: 1, y: 3.7, w: 11.33, fontSize: 28, color: THEME.redLight, align: 'center', fontFace: FONT.cjk });
  back.addShape(pptx.ShapeType.rect, { x: 4.5, y: 4.4, w: 4.33, h: 0.04, fill: { color: THEME.red } });
  back.addText('HCC Weekly Digest · 呂大教授 敬啟', { x: 1, y: 4.7, w: 11.33, fontSize: 14, color: THEME.mutedText, align: 'center' });
  back.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: 13.33, h: 0.08, fill: { color: THEME.red } });

  const outDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const pptxPath = path.join(outDir, 'latest-digest.pptx');
  return pptx.writeFile({ fileName: pptxPath }).then(() => {
    console.log(`[PPTX] Saved: ${pptxPath}`);
    return pptxPath;
  });
}

function formatAuthors(a) {
  if (!a.authors || a.authors.length === 0) return 'Unknown';
  const display = a.authors.slice(0, 3).join(', ');
  if (a.authorCount > 3) return `${display} et al.`;
  return display;
}

module.exports = { generatePptx };
