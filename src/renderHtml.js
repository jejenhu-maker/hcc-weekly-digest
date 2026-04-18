// renderHtml.js — render articles into a styled HTML string for email
const dayjs = require('dayjs');
const config = require('./config');

function renderHtml(articles) {
  const now = dayjs();
  const weekStart = now.subtract(7, 'day').format('YYYY-MM-DD');
  const weekEnd = now.format('YYYY-MM-DD');
  const pageUrl = config.pageUrl;

  const papersHtml = articles.map((a, i) => {
    const num = i + 1;
    const link = a.doi
      ? `https://doi.org/${a.doi}`
      : a.pmid
        ? `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`
        : a.link || '#';

    const badges = [];
    if (a.impactFactor) badges.push(`<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">IF ${a.impactFactor.toFixed(1)}</span>`);
    if (a.studyType && a.studyType !== 'Other') badges.push(`<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">${a.studyType}</span>`);
    if (a.isAsiaPriority) badges.push(`<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">🌏 Asia</span>`);
    if (a.countries && a.countries.length > 0) {
      a.countries.forEach(c => badges.push(`<span style="background:#f3e8ff;color:#6b21a8;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">${c}</span>`));
    }

    const authorList = formatAuthors(a);

    return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:18px 20px;margin-bottom:18px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td width="36" valign="top">
          <div style="background:#dc2626;color:white;font-weight:bold;font-size:14px;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;">${num}</div>
        </td>
        <td valign="top">
          <a href="${link}" style="font-size:15px;font-weight:bold;color:#7f1d1d;text-decoration:none;" target="_blank">${a.title}</a>
        </td>
      </tr></table>

      <div style="margin:8px 0;">${badges.join(' ')}</div>

      <div style="font-size:13px;color:#64748b;margin-bottom:8px;">
        📰 ${a.journal || a.journalAbbr || 'Unknown'} &nbsp; 📅 ${a.pubDate || 'N/A'} &nbsp; 👥 ${authorList}
      </div>

      <div style="font-size:12px;font-weight:bold;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin:10px 0 4px;">Abstract</div>
      <div style="font-size:13px;color:#334155;text-align:justify;line-height:1.6;">${a.abstract}</div>

      <div style="font-size:12px;font-weight:bold;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin:10px 0 4px;">中文摘要</div>
      <div style="font-size:13px;color:#475569;text-align:justify;line-height:1.6;background:#f8fafc;padding:8px 12px;border-radius:4px;border-left:3px solid #dc2626;">${a.abstractZh || '（無中文摘要）'}</div>

      ${a.doi ? `<div style="font-size:12px;margin-top:8px;"><a href="https://doi.org/${a.doi}" style="color:#dc2626;" target="_blank">DOI: ${a.doi}</a></div>` : ''}
      ${a.pmid ? `<div style="font-size:12px;margin-top:4px;"><a href="https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/" style="color:#dc2626;" target="_blank">PubMed: ${a.pmid}</a></div>` : ''}
    </div>`;
  }).join('\n');

  return `
<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#1a1a1a;">

  <div style="text-align:center;padding:40px 20px 30px;border-bottom:3px solid #dc2626;margin-bottom:30px;">
    <h1 style="font-size:24px;color:#7f1d1d;margin:0 0 8px;">🔬 HCC Weekly Digest</h1>
    <div style="font-size:16px;color:#64748b;">肝癌免疫治療與局部消融文獻週報</div>
    <div style="font-size:14px;color:#94a3b8;margin-top:12px;">${weekStart} — ${weekEnd}</div>
    <div style="margin-top:16px;">
      <a href="${pageUrl}" target="_blank" style="display:inline-block;background:#dc2626;color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;">📊 選文章 → 產生簡報 (.pptx)</a>
    </div>
  </div>

  ${papersHtml}

  <div style="text-align:center;font-size:12px;color:#94a3b8;margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;">
    Generated automatically · Sources: PubMed, Google Scholar · Translations: AI-assisted<br>
    © ${now.year()} HCC Weekly Digest
  </div>

</body>
</html>`;
}

function formatAuthors(article) {
  if (!article.authors || article.authors.length === 0) return 'Unknown';
  const display = article.authors.slice(0, 3).join(', ');
  if (article.authorCount > 3) return `${display} et al.`;
  return display;
}

module.exports = { renderHtml };
