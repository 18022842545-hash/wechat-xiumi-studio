export const defaultForbidden = ['夏日','蝉鸣与光影','春日迟迟','教师节','白露为霜','蒹葭苍苍','秋冬气始交','天水清相入','这是一个标题','二十四节气','119','消防','爆品','感恩节'];
export const forbiddenHashes = ['349d3cf0','5837e449','65a425bf','b7de8217','2c969519','5d9f4b5f','4311cdee','26fb9b4a','999f55e4'];
const count = (s, term) => s.split(term).length - 1;
export function lintArticleHtml(html, options = {}) {
  html = String(html ?? ''); const mode = options.mode || 'class-unofficial', target = options.target || 'xiumi';
  const issues = []; const add = (rule, term, n, severity = 'error') => { if (n) issues.push({rule, term, count:n, severity}); };
  const visible = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ');
  for (const term of defaultForbidden) add('template-residue', term, count(visible, term));
  for (const term of forbiddenHashes) add('forbidden-asset', term, count(html.toLowerCase(), term));
  for (const term of new Set((Array.isArray(options.customForbidden) ? options.customForbidden : []).filter(x => typeof x === 'string' && x))) add('custom-forbidden', term, count(visible, term));
  if (mode === 'class-unofficial') {
    for (const term of ['出版','出品','编辑','摄影','供图','排版','版权','图文整理','班级小编','【','】']) add('unofficial-redline', term, count(visible, term));
    for (const term of ['END','A LITTLE','CLASS DIARY','BRONZE AWARD','TITLE','SPRING','EDITION','VOL.','CHAPTER']) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); add('decorative-english', term, [...visible.matchAll(new RegExp('(?<![A-Za-z])'+escaped+'(?![A-Za-z])','gi'))].length);
    }
  }
  for (const tag of ['script','style', ...(target === 'xiumi' ? ['svg'] : [])]) add('forbidden-tag', tag, [...html.matchAll(new RegExp('<\\s*'+tag+'\\b','gi'))].length);
  for (const attr of ['class', ...(target === 'xiumi' ? ['id'] : [])]) add('forbidden-attribute', attr, [...html.matchAll(new RegExp('\\s'+attr+'\\s*=','gi'))].length);
  if (target === 'xiumi') {
    add('protocol-relative', '//statics', [...html.matchAll(/(?<!:)\/\/statics\b/gi)].length);
    const stripped = html.trim().replace(/<!--[\s\S]*?-->/g, '').trim();
    const tags = [...stripped.matchAll(/<\/?section\b[^>]*>/gi)]; let depth=0, end=-1, valid=/^<section\b/i.test(stripped);
    for (const t of tags) { if (/^<\//.test(t[0])) { depth--; if (depth===0) { end=t.index+t[0].length; break; } if(depth<0) valid=false; } else depth++; }
    if (!valid || depth !== 0 || end !== stripped.length) add('single-section-root','section',1);
  }
  const urls = [...html.matchAll(/(?:\bsrc\s*=\s*["']([^"']+)["']|url\(\s*["']?([^)'"\s]+))/gi)].map(m=>m[1]||m[2]);
  const stats={distinctAssets:new Set(urls).size,totalAssetUsages:urls.length,hasSvgTag:/<\s*svg\b/i.test(html),customChars:[...visible.replace(/\s/g,'')].length};
  return {passed:issues.length===0,summary:issues.length ? `发现 ${issues.length} 项问题` : '检查通过',stats,issues};
}
