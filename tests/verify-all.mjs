import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOCK_TEMPLATES, THEME_PRESETS, buildStarterArticle, compileArticleHtml } from '../public/js/block-templates.js';
import { lintArticleHtml, forbiddenHashes } from '../server/linter.mjs';
import { getAiStatus, selectAssetsByQuota } from '../server/ai-bridge.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function collectFiles(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (['.git', 'node_modules', 'data'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await collectFiles(full, out);
    } else if (!e.name.startsWith('.local-secrets') && !e.name.startsWith('.studio-root')) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  // 1. Asset catalog & GIF89a binary verification
  const catalog = JSON.parse(await readFile(path.join(rootDir, 'public/catalog/assets-catalog.json'), 'utf8'));
  const assets = catalog.assets || [];
  assert(assets.length >= 150, `Expected >= 150 assets, got ${assets.length}`);

  const gifDir = path.join(rootDir, 'public/assets/open/gifs');
  const gifFiles = (await readdir(gifDir)).filter(f => f.endsWith('.gif'));
  assert(gifFiles.length === 8, `Expected 8 open GIF files, got ${gifFiles.length}`);
  for (const gf of gifFiles) {
    const buf = await readFile(path.join(gifDir, gf));
    assert(buf.subarray(0, 6).toString('ascii') === 'GIF89a', `${gf} missing GIF89a header`);
    assert(buf.length > 200, `${gf} suspiciously small (${buf.length} bytes)`);
  }

  for (const a of assets) {
    const low = String(a.url || '').toLowerCase();
    for (const badHash of forbiddenHashes) {
      assert(!low.includes(badHash), `Forbidden hash ${badHash} found in asset ${a.id}`);
    }
  }
  console.log(`Catalog OK: ${assets.length} vetted assets, 8 GIF89a animations verified`);

  // 2. Block templates & 6 starter articles lint verification
  assert(BLOCK_TEMPLATES.length >= 36, `Expected >= 36 templates, got ${BLOCK_TEMPLATES.length}`);
  const interactiveCount = BLOCK_TEMPLATES.filter(t => t.isInteractiveSvg).length;
  assert(interactiveCount >= 4, `Expected >= 4 interactive SVG templates, got ${interactiveCount}`);

  for (const styleId of Object.keys(THEME_PRESETS)) {
    const draft = buildStarterArticle(styleId);
    for (const target of ['wechat', 'xiumi']) {
      const html = compileArticleHtml(draft, { mode: target, editor: false });
      const lint = lintArticleHtml(html, { mode: 'class-unofficial', target });
      assert(lint.passed, `Starter article ${styleId} failed ${target} lint: ${JSON.stringify(lint.issues)}`);
    }
    const sel = selectAssetsByQuota(assets, styleId, { stickers: 2, artWords: 2, gifs: 1, frames: 2, backgrounds: 1 });
    assert(sel.assets.stickers.length === 2, `${styleId} stickers shortage: ${sel.assets.stickers.length}`);
    assert(sel.assets.gifs.length === 1, `${styleId} gifs shortage: ${sel.assets.gifs.length}`);
  }
  console.log(`Templates OK: ${BLOCK_TEMPLATES.length} blocks (${interactiveCount} interactive SVG), all 6 themes lint clean`);

  // 3. AI bridge status check
  const aiStatus = await getAiStatus();
  assert(typeof aiStatus?.codex === 'object' && typeof aiStatus?.deepseek === 'object', 'Invalid getAiStatus shape');
  if (process.env.REQUIRE_LOCAL_AI === '1') {
    assert(aiStatus.codex?.loggedIn === true, `Expected codex loggedIn true, got ${JSON.stringify(aiStatus.codex)}`);
    assert(aiStatus.deepseek?.configured === true, `Expected deepseek configured true, got ${JSON.stringify(aiStatus.deepseek)}`);
  }
  console.log(`AI Engines OK: Codex (${aiStatus.codex?.loggedIn ? aiStatus.codex.version : 'not logged in on CI'}) + DeepSeek (${aiStatus.deepseek?.configured ? aiStatus.deepseek.maskedKey : 'not set on CI'})`);

  // 4. Privacy & API key leak scan across tracked files
  const bannedPatterns = [
    new RegExp('\\u6768\\u5e06'),
    new RegExp('738' + '797' + '226'),
    new RegExp('\\u66a8\\u5357'),
    new RegExp('\\u6df1\\u5733\\u65c5\\u6e38'),
    new RegExp('\\u77f3\\u724c'),
    new RegExp('\\u756a\\u79ba'),
    /sk-[A-Za-z0-9]{16,}/
  ];

  const allFiles = await collectFiles(rootDir);
  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.woff2'].includes(ext)) continue;
    const text = await readFile(file, 'utf8');
    for (const pat of bannedPatterns) {
      assert(!pat.test(text), `Privacy/secret match (${pat}) in ${path.relative(rootDir, file)}`);
    }
  }
  console.log(`Privacy & Secret Scan OK across ${allFiles.length} repository files`);
}

main().catch(err => {
  console.error('VERIFY FAILED:', err);
  process.exit(1);
});
