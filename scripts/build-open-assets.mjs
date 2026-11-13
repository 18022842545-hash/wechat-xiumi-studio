import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const openDir = path.join(rootDir, 'public', 'assets', 'open');
const catalogDir = path.join(rootDir, 'public', 'catalog');

function lzwEncode(indices, minCodeSize = 4) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxTable = 4096;

  let dict = new Map();
  const resetDict = () => {
    dict = new Map();
    for (let i = 0; i < clearCode; i++) dict.set(String(i), i);
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  };
  resetDict();

  const bits = [];
  const emit = (code, size) => {
    for (let b = 0; b < size; b++) bits.push((code >> b) & 1);
  };

  emit(clearCode, codeSize);
  let prefix = String(indices[0] ?? 0);
  for (let i = 1; i < indices.length; i++) {
    const k = String(indices[i]);
    const combined = `${prefix},${k}`;
    if (dict.has(combined)) {
      prefix = combined;
    } else {
      emit(dict.get(prefix), codeSize);
      if (nextCode < maxTable) {
        dict.set(combined, nextCode++);
        if (nextCode - 1 === (1 << codeSize) && codeSize < 12) codeSize++;
      } else {
        emit(clearCode, codeSize);
        resetDict();
      }
      prefix = k;
    }
  }
  emit(dict.get(prefix), codeSize);
  emit(eoiCode, codeSize);

  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let b = 0; b < 8 && i + b < bits.length; b++) {
      if (bits[i + b]) val |= 1 << b;
    }
    bytes.push(val);
  }
  return Buffer.from(bytes);
}

function encodeGif89a(width, height, palette16, frames, delayCs = 12) {
  const chunks = [];
  chunks.push(Buffer.from('GIF89a', 'ascii'));

  const lsd = Buffer.alloc(7);
  lsd.writeUInt16LE(width, 0);
  lsd.writeUInt16LE(height, 2);
  lsd[4] = 0xf3; // GCT flag=1, colorRes=7, sort=0, size=3 (16 colors)
  lsd[5] = 0;
  lsd[6] = 0;
  chunks.push(lsd);

  const gct = Buffer.alloc(48, 0);
  for (let i = 0; i < 16 && i < palette16.length; i++) {
    gct[i * 3] = palette16[i][0];
    gct[i * 3 + 1] = palette16[i][1];
    gct[i * 3 + 2] = palette16[i][2];
  }
  chunks.push(gct);

  // NETSCAPE2.0 infinite loop
  chunks.push(Buffer.from([
    0x21, 0xff, 0x0b,
    0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
    0x03, 0x01, 0x00, 0x00, 0x00
  ]));

  for (const pixels of frames) {
    const gce = Buffer.alloc(8);
    gce[0] = 0x21;
    gce[1] = 0xf9;
    gce[2] = 0x04;
    gce[3] = 0x09; // disposal=2 (restore bg), transparent=1
    gce.writeUInt16LE(delayCs, 4);
    gce[6] = 0; // transparent index 0
    gce[7] = 0;
    chunks.push(gce);

    const imgDesc = Buffer.alloc(10);
    imgDesc[0] = 0x2c;
    imgDesc.writeUInt16LE(0, 1);
    imgDesc.writeUInt16LE(0, 3);
    imgDesc.writeUInt16LE(width, 5);
    imgDesc.writeUInt16LE(height, 7);
    imgDesc[9] = 0x00;
    chunks.push(imgDesc);

    const minCodeSize = 4;
    chunks.push(Buffer.from([minCodeSize]));
    const compressed = lzwEncode(pixels, minCodeSize);
    for (let off = 0; off < compressed.length; off += 255) {
      const slice = compressed.subarray(off, off + 255);
      chunks.push(Buffer.from([slice.length]));
      chunks.push(slice);
    }
    chunks.push(Buffer.from([0x00]));
  }

  chunks.push(Buffer.from([0x3b]));
  return Buffer.concat(chunks);
}

function makeCanvas(w, h) {
  const buf = new Uint8Array(w * h);
  const set = (x, y, c) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix >= 0 && ix < w && iy >= 0 && iy < h) buf[iy * w + ix] = c;
  };
  const disc = (cx, cy, r, c) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r + 0.3) set(cx + dx, cy + dy, c);
      }
    }
  };
  const rect = (x0, y0, rw, rh, c) => {
    for (let y = y0; y < y0 + rh; y++) {
      for (let x = x0; x < x0 + rw; x++) set(x, y, c);
    }
  };
  const star = (cx, cy, arm, cCore, cEdge) => {
    if (arm <= 0) return;
    disc(cx, cy, 1, cCore);
    for (let d = 1; d <= arm; d++) {
      const col = d <= Math.ceil(arm / 2) ? cCore : cEdge;
      set(cx + d, cy, col);
      set(cx - d, cy, col);
      set(cx, cy + d, col);
      set(cx, cy - d, col);
    }
  };
  const heart = (cx, cy, scale, cMain, cHi) => {
    for (let y = -10; y <= 12; y++) {
      for (let x = -12; x <= 12; x++) {
        const nx = x / 8.5;
        const ny = -y / 8.5;
        const v = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
        if (v <= 0) set(cx + x * scale, cy + y * scale, x < -2 && y < 0 ? cHi : cMain);
      }
    }
  };
  return { buf, set, disc, rect, star, heart };
}

const ALL_STYLES = ['campus-paper', 'stage-heat', 'fresh-teambuild', 'retro-film', 'minimal-mag', 'warm-honor'];

async function buildTapes() {
  const specs = [
    { file: 'tape-sakura-blush.svg', label: '樱花腮红和纸胶带', bg: '#F7D8DF', pat: 'dots', fg: '#D97B93', styles: ['campus-paper', 'fresh-teambuild'] },
    { file: 'tape-sage-leaf.svg', label: '鼠尾草绿手账胶带', bg: '#D6E6DC', pat: 'stripe', fg: '#5B7A6B', styles: ['campus-paper', 'fresh-teambuild', 'minimal-mag'] },
    { file: 'tape-butter-grid.svg', label: '奶油格纹胶带', bg: '#FBF0C9', pat: 'grid', fg: '#D7A84A', styles: ['campus-paper', 'warm-honor', 'fresh-teambuild'] },
    { file: 'tape-warm-kraft.svg', label: '牛皮纸拼贴胶带', bg: '#D9BFA0', pat: 'grain', fg: '#9A7853', styles: ['campus-paper', 'retro-film'] },
    { file: 'tape-sky-stripe.svg', label: '晴空斜纹胶带', bg: '#D6EBFA', pat: 'stripe', fg: '#4D90C9', styles: ['fresh-teambuild', 'minimal-mag'] },
    { file: 'tape-terracotta-dot.svg', label: '陶土波点和纸胶带', bg: '#F1C6B8', pat: 'dots', fg: '#B95B42', styles: ['retro-film', 'warm-honor'] },
    { file: 'tape-lavender-check.svg', label: '霓虹紫格纹胶带', bg: '#E3D5FA', pat: 'grid', fg: '#8B5CF6', styles: ['stage-heat', 'fresh-teambuild'] },
    { file: 'tape-ink-stamp.svg', label: '极简炭黑编号胶带', bg: '#2B2B2B', pat: 'dash', fg: '#F5F0E6', styles: ['minimal-mag', 'retro-film', 'stage-heat'] }
  ];
  const dir = path.join(openDir, 'tapes');
  await mkdir(dir, { recursive: true });
  const items = [];
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    let overlay = '';
    if (s.pat === 'dots') {
      overlay = `<pattern id="p${i}" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.2" fill="${s.fg}" fill-opacity="0.45"/><circle cx="14" cy="14" r="1.6" fill="${s.fg}" fill-opacity="0.35"/></pattern>`;
    } else if (s.pat === 'stripe') {
      overlay = `<pattern id="p${i}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="14" stroke="${s.fg}" stroke-width="4" stroke-opacity="0.28"/></pattern>`;
    } else if (s.pat === 'grid') {
      overlay = `<pattern id="p${i}" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M 16 0 L 0 0 0 16" fill="none" stroke="${s.fg}" stroke-width="1.2" stroke-opacity="0.35"/></pattern>`;
    } else if (s.pat === 'dash') {
      overlay = `<pattern id="p${i}" width="24" height="24" patternUnits="userSpaceOnUse"><rect x="4" y="21" width="14" height="2" fill="${s.fg}" fill-opacity="0.55"/></pattern>`;
    } else {
      overlay = `<pattern id="p${i}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="4" cy="7" r="1" fill="${s.fg}" fill-opacity="0.35"/><circle cx="14" cy="15" r="1.3" fill="${s.fg}" fill-opacity="0.25"/></pattern>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 52" width="240" height="52">
  <defs>${overlay}</defs>
  <path d="M8,6 L232,6 L228,13 L234,20 L229,28 L233,36 L228,46 L8,46 L12,38 L6,29 L11,20 L7,12 Z" fill="${s.bg}" fill-opacity="0.9"/>
  <path d="M8,6 L232,6 L228,13 L234,20 L229,28 L233,36 L228,46 L8,46 L12,38 L6,29 L11,20 L7,12 Z" fill="url(#p${i})"/>
</svg>\n`;
    await writeFile(path.join(dir, s.file), svg, 'utf8');
    items.push({
      id: `open_tape_${String(i + 1).padStart(2, '0')}`,
      name: s.label,
      label: s.label,
      category: '贴纸图案',
      subcategory: '和纸胶带',
      role: 'sticker',
      styles: s.styles,
      tags: ['和纸胶带', '开源', 'SVG', '角标'],
      mediaType: 'svg',
      tier: 'open_free',
      url: `/assets/open/tapes/${s.file}`,
      width: 240,
      height: 52,
      source: 'open_local',
      license: 'MIT'
    });
  }
  return items;
}

async function buildTextures() {
  const specs = [
    { file: 'tex-cream-linen.svg', label: '米白亚麻纸纹', bg: '#F7F3E9', stroke: '#DFD5C2', kind: 'linen', styles: ['campus-paper', 'warm-honor'] },
    { file: 'tex-kraft-grain.svg', label: '暖调牛皮纸底纹', bg: '#E6D2B5', stroke: '#BA9B72', kind: 'speckle', styles: ['retro-film', 'campus-paper'] },
    { file: 'tex-dot-grid.svg', label: '手账圆点阵底纹', bg: '#FFFDF8', stroke: '#B9C4BC', kind: 'dots', styles: ['fresh-teambuild', 'campus-paper', 'minimal-mag'] },
    { file: 'tex-graph-notebook.svg', label: '方格笔记本纸纹', bg: '#F8FBF9', stroke: '#CBE2D6', kind: 'grid', styles: ['fresh-teambuild', 'minimal-mag'] },
    { file: 'tex-rice-fiber.svg', label: '宣纸丝缕纹理', bg: '#F4EFE4', stroke: '#C8BDA8', kind: 'fiber', styles: ['campus-paper', 'warm-honor'] },
    { file: 'tex-sage-plaid.svg', label: '森系浅绿格子纹', bg: '#EEF6F1', stroke: '#B5D6C4', kind: 'plaid', styles: ['fresh-teambuild', 'campus-paper'] },
    { file: 'tex-blush-check.svg', label: '温柔浅粉格纹', bg: '#FDF3F5', stroke: '#F2C9D2', kind: 'plaid', styles: ['fresh-teambuild', 'warm-honor'] },
    { file: 'tex-charcoal-noise.svg', label: '暗夜剧场暗纹', bg: '#181426', stroke: '#3B2F5E', kind: 'dots', styles: ['stage-heat', 'retro-film'] },
    { file: 'tex-warm-stripe.svg', label: '暖杏竖条纹底纹', bg: '#FFF7ED', stroke: '#F0D4B2', kind: 'stripe', styles: ['warm-honor', 'campus-paper'] },
    { file: 'tex-vintage-post.svg', label: '信笺横线纸纹', bg: '#FAF5EB', stroke: '#D4C8B4', kind: 'ruled', styles: ['campus-paper', 'retro-film', 'minimal-mag'] }
  ];
  const dir = path.join(openDir, 'textures');
  await mkdir(dir, { recursive: true });
  const items = [];
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    let body = '';
    if (s.kind === 'linen') {
      body = `<path d="M0 10H60M0 30H60M0 50H60M10 0V60M30 0V60M50 0V60" stroke="${s.stroke}" stroke-width="0.8" stroke-opacity="0.45"/>`;
    } else if (s.kind === 'speckle') {
      body = `<circle cx="12" cy="14" r="1.3" fill="${s.stroke}" opacity="0.45"/><circle cx="38" cy="24" r="1" fill="${s.stroke}" opacity="0.35"/><circle cx="24" cy="48" r="1.5" fill="${s.stroke}" opacity="0.3"/><circle cx="50" cy="46" r="1.1" fill="${s.stroke}" opacity="0.4"/>`;
    } else if (s.kind === 'dots') {
      body = `<circle cx="15" cy="15" r="1.5" fill="${s.stroke}" opacity="0.55"/><circle cx="45" cy="45" r="1.5" fill="${s.stroke}" opacity="0.55"/>`;
    } else if (s.kind === 'grid') {
      body = `<path d="M 30 0 L 0 0 0 30 M 60 0 L 30 0 30 60" fill="none" stroke="${s.stroke}" stroke-width="0.9" opacity="0.7"/>`;
    } else if (s.kind === 'fiber') {
      body = `<path d="M6 14 Q20 10 34 18 M28 42 Q44 38 56 46 M10 50 Q18 44 26 52" fill="none" stroke="${s.stroke}" stroke-width="0.9" opacity="0.5"/>`;
    } else if (s.kind === 'plaid') {
      body = `<rect x="0" y="0" width="30" height="60" fill="${s.stroke}" fill-opacity="0.16"/><rect x="0" y="0" width="60" height="30" fill="${s.stroke}" fill-opacity="0.16"/>`;
    } else if (s.kind === 'stripe') {
      body = `<rect x="0" y="0" width="12" height="60" fill="${s.stroke}" fill-opacity="0.22"/><rect x="30" y="0" width="12" height="60" fill="${s.stroke}" fill-opacity="0.22"/>`;
    } else {
      body = `<line x1="0" y1="29" x2="60" y2="29" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="3 2" opacity="0.75"/><line x1="0" y1="59" x2="60" y2="59" stroke="${s.stroke}" stroke-width="1" stroke-dasharray="3 2" opacity="0.75"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="${s.bg}"/>${body}</svg>\n`;
    await writeFile(path.join(dir, s.file), svg, 'utf8');
    items.push({
      id: `open_tex_${String(i + 1).padStart(2, '0')}`,
      name: s.label,
      label: s.label,
      category: '纸纹背景',
      subcategory: '无缝纸纹',
      role: 'background',
      styles: s.styles,
      tags: ['纸纹', '底纹', '开源', '背景'],
      mediaType: 'svg',
      tier: 'open_free',
      url: `/assets/open/textures/${s.file}`,
      width: 60,
      height: 60,
      source: 'open_local',
      license: 'MIT'
    });
  }
  return items;
}

async function buildIcons() {
  const defs = [
    { file: 'ico-sparkle-star.svg', label: '双色闪耀四角星', role: 'sticker', styles: ALL_STYLES, draw: '<path d="M32 6 L37 25 L56 30 L37 35 L32 54 L27 35 L8 30 L27 25 Z" fill="#F5B841" stroke="#3A3530" stroke-width="2.5" stroke-linejoin="round"/><circle cx="49" cy="14" r="3" fill="#FF6B8B"/>' },
    { file: 'ico-double-heart.svg', label: '手绘双心贴纸', role: 'sticker', styles: ['campus-paper', 'fresh-teambuild', 'warm-honor'], draw: '<path d="M28 50 C14 40 8 30 8 21 A10 10 0 0 1 28 19 A10 10 0 0 1 48 21 C48 30 42 40 28 50Z" fill="#FF7A9A" fill-opacity="0.28" stroke="#D94B70" stroke-width="2.5"/><path d="M44 48 C36 42 32 36 32 30 A6 6 0 0 1 44 29 A6 6 0 0 1 56 30 C56 36 52 42 44 48Z" fill="#FFD23F" stroke="#3A3530" stroke-width="2"/>' },
    { file: 'ico-ribbon-bow.svg', label: '礼物蝴蝶结贴纸', role: 'sticker', styles: ['warm-honor', 'fresh-teambuild'], draw: '<path d="M32 32 C16 14 6 20 12 34 C16 42 28 36 32 32 Z M32 32 C48 14 58 20 52 34 C48 42 36 36 32 32 Z" fill="#F4978E" stroke="#3A3530" stroke-width="2.4"/><path d="M27 36 L20 56 M37 36 L44 56" stroke="#D94B70" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="5" fill="#FFE082" stroke="#3A3530" stroke-width="2.4"/>' },
    { file: 'ico-camera-snap.svg', label: '复古拍立得相机图标', role: 'sticker', styles: ['retro-film', 'fresh-teambuild', 'campus-paper'], draw: '<rect x="8" y="18" width="48" height="34" rx="7" fill="#FFFDF7" stroke="#3A3530" stroke-width="2.5"/><path d="M22 18 L26 11 H38 L42 18" fill="#E8B04A" stroke="#3A3530" stroke-width="2.5"/><circle cx="32" cy="35" r="10" fill="#5B7A6B" stroke="#3A3530" stroke-width="2.5"/><circle cx="32" cy="35" r="4" fill="#FFFDF7"/><circle cx="47" cy="25" r="2.5" fill="#E63B2E"/>' },
    { file: 'ico-laurel-leaf.svg', label: '森系橄榄枝叶贴纸', role: 'sticker', styles: ['campus-paper', 'fresh-teambuild', 'warm-honor'], draw: '<path d="M16 50 Q26 30 48 14" fill="none" stroke="#5B7A6B" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="22" cy="36" rx="7" ry="4" transform="rotate(-35 22 36)" fill="#95C4AB" stroke="#3A3530" stroke-width="1.8"/><ellipse cx="33" cy="27" rx="7" ry="4" transform="rotate(-35 33 27)" fill="#95C4AB" stroke="#3A3530" stroke-width="1.8"/><ellipse cx="41" cy="32" rx="7" ry="4" transform="rotate(20 41 32)" fill="#70A389" stroke="#3A3530" stroke-width="1.8"/><ellipse cx="29" cy="43" rx="7" ry="4" transform="rotate(20 29 43)" fill="#70A389" stroke="#3A3530" stroke-width="1.8"/>' },
    { file: 'ico-film-slate.svg', label: '场记板胶片图标', role: 'sticker', styles: ['retro-film', 'stage-heat'], draw: '<rect x="10" y="24" width="44" height="28" rx="4" fill="#3A332D" stroke="#EFE4D2" stroke-width="2.2"/><path d="M10 24 L52 14 L54 22 L12 30 Z" fill="#D9A05B" stroke="#EFE4D2" stroke-width="2"/><line x1="20" y1="36" x2="44" y2="36" stroke="#EFE4D2" stroke-width="2"/><line x1="20" y1="43" x2="38" y2="43" stroke="#D9A05B" stroke-width="2"/>' },
    { file: 'ico-trophy-honor.svg', label: '荣誉奖杯双色图标', role: 'sticker', styles: ['warm-honor', 'minimal-mag'], draw: '<path d="M20 14 H44 V26 C44 35 38 41 32 41 C26 41 20 35 20 26 Z" fill="#FFD23F" stroke="#4A1F14" stroke-width="2.4"/><path d="M20 18 H12 C12 27 16 30 20 30 M44 18 H52 C52 27 48 30 44 30" fill="none" stroke="#C8282E" stroke-width="2.4"/><path d="M32 41 V50 M22 52 H42" stroke="#4A1F14" stroke-width="2.8" stroke-linecap="round"/>' },
    { file: 'ico-megaphone.svg', label: '舞台声浪小喇叭', role: 'sticker', styles: ['stage-heat', 'fresh-teambuild'], draw: '<path d="M14 28 L44 14 V46 L14 34 Z" fill="#FF3D7F" stroke="#3A3530" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 35 L22 50 H28 L25 36" fill="#FFD23F" stroke="#3A3530" stroke-width="2.2"/><path d="M50 22 Q56 30 50 38" fill="none" stroke="#FFD23F" stroke-width="3" stroke-linecap="round"/>' },
    { file: 'badge-stamp-flower.svg', label: '小红花印章角标', role: 'badge', styles: ['campus-paper', 'warm-honor', 'fresh-teambuild'], draw: '<circle cx="32" cy="32" r="24" fill="none" stroke="#C8282E" stroke-width="2.4" stroke-dasharray="4 3"/><circle cx="32" cy="32" r="18" fill="#FFF3EE" stroke="#C8282E" stroke-width="1.8"/><path d="M32 20 L35 28 L43 28 L37 33 L39 41 L32 36 L25 41 L27 33 L21 28 L29 28 Z" fill="#C8282E"/>' },
    { file: 'badge-quote-mark.svg', label: '手绘双色大引号', role: 'badge', styles: ALL_STYLES, draw: '<path d="M14 36 C14 23 20 15 29 12 L31 18 C25 20 22 24 22 29 H29 V45 H14 Z M36 36 C36 23 42 15 51 12 L53 18 C47 20 44 24 44 29 H51 V45 H36 Z" fill="#5B7A6B" fill-opacity="0.85"/>' },
    { file: 'badge-bookmark-tag.svg', label: '折页书签标签', role: 'badge', styles: ['campus-paper', 'minimal-mag', 'retro-film'], draw: '<path d="M18 10 H46 V54 L32 44 L18 54 Z" fill="#C48A5A" stroke="#3A3530" stroke-width="2.4" stroke-linejoin="round"/><circle cx="32" cy="22" r="4" fill="#FFFDF7"/>' },
    { file: 'badge-music-note.svg', label: '音符节拍艺术标', role: 'badge', styles: ['stage-heat', 'fresh-teambuild'], draw: '<path d="M26 44 V18 L48 13 V39" fill="none" stroke="#FF3D7F" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="21" cy="45" r="6" fill="#FFD23F" stroke="#3A3530" stroke-width="2.2"/><circle cx="43" cy="40" r="6" fill="#FFD23F" stroke="#3A3530" stroke-width="2.2"/>' },
    { file: 'badge-compass-dir.svg', label: '方向指南针小标', role: 'badge', styles: ['fresh-teambuild', 'minimal-mag', 'retro-film'], draw: '<circle cx="32" cy="32" r="22" fill="#F2FAF6" stroke="#2E4A40" stroke-width="2.4"/><polygon points="32,16 38,32 32,48 26,32" fill="#3FBF8F" stroke="#2E4A40" stroke-width="2"/><polygon points="32,16 38,32 26,32" fill="#FFB547"/>' },
    { file: 'badge-envelope-seal.svg', label: '火漆信封小徽章', role: 'badge', styles: ['campus-paper', 'warm-honor', 'retro-film'], draw: '<rect x="10" y="18" width="44" height="28" rx="4" fill="#FFFDF7" stroke="#3A3530" stroke-width="2.4"/><path d="M10 19 L32 35 L54 19" fill="none" stroke="#3A3530" stroke-width="2.2"/><circle cx="32" cy="34" r="6" fill="#C8282E"/>' },
    { file: 'badge-moon-star.svg', label: '夜幕星月徽章', role: 'badge', styles: ['stage-heat', 'campus-paper', 'retro-film'], draw: '<path d="M38 14 A18 18 0 1 0 50 40 A14 14 0 1 1 38 14 Z" fill="#FFD23F" stroke="#3A3530" stroke-width="2.2"/><circle cx="46" cy="20" r="3" fill="#FF3D7F"/>' },
    { file: 'badge-section-num.svg', label: '圆环序号底托', role: 'badge', styles: ['minimal-mag', 'campus-paper', 'warm-honor'], draw: '<circle cx="32" cy="32" r="22" fill="#FFFDF7" stroke="#5B7A6B" stroke-width="2.5"/><circle cx="32" cy="32" r="16" fill="#5B7A6B" fill-opacity="0.16" stroke="#5B7A6B" stroke-width="1.5" stroke-dasharray="4 3"/>' }
  ];
  const dir = path.join(openDir, 'icons');
  await mkdir(dir, { recursive: true });
  const items = [];
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${d.draw}</svg>\n`;
    await writeFile(path.join(dir, d.file), svg, 'utf8');
    items.push({
      id: `open_ico_${String(i + 1).padStart(2, '0')}`,
      name: d.label,
      label: d.label,
      category: d.role === 'badge' ? '标题艺术字' : '贴纸图案',
      subcategory: d.role === 'badge' ? '手绘角标/艺术底托' : '双色手账图标',
      role: d.role,
      styles: d.styles,
      tags: ['开源', 'SVG', '双色', d.role === 'badge' ? '标题角标' : '图标'],
      mediaType: 'svg',
      tier: 'open_free',
      url: `/assets/open/icons/${d.file}`,
      width: 64,
      height: 64,
      source: 'open_local',
      license: 'MIT'
    });
  }
  return items;
}

async function buildFrames() {
  const defs = [
    { file: 'frame-polaroid-tape.svg', label: '胶带拍立得底框', styles: ['fresh-teambuild', 'campus-paper', 'retro-film'], inner: '<rect x="18" y="24" width="324" height="220" rx="6" fill="#FFFDF7" stroke="#DCD3C0" stroke-width="2"/><rect x="34" y="40" width="292" height="156" rx="2" fill="#F2ECE0" stroke="#D1C7B3" stroke-width="1.5" stroke-dasharray="6 4"/><rect x="134" y="8" width="92" height="24" rx="2" transform="rotate(-4 180 20)" fill="#E9D6B0" fill-opacity="0.88"/>' },
    { file: 'frame-torn-note.svg', label: '撕纸手记边框', styles: ['campus-paper', 'fresh-teambuild'], inner: '<path d="M16 18 H344 V244 L332 238 L318 245 L302 237 L286 245 L268 238 L250 246 L232 239 L214 246 L196 238 L176 246 L156 239 L136 246 L116 238 L96 245 L76 239 L56 246 L36 238 L16 245 Z" fill="#FFFDF7" stroke="#CFC4AF" stroke-width="2"/><line x1="36" y1="68" x2="324" y2="68" stroke="#E5DEC9" stroke-width="1.5" stroke-dasharray="4 4"/>' },
    { file: 'frame-filmstrip.svg', label: '复古电影胶片相框', styles: ['retro-film', 'stage-heat'], inner: '<rect x="14" y="16" width="332" height="228" rx="8" fill="#2B2622" stroke="#5E5248" stroke-width="2"/><rect x="30" y="46" width="300" height="168" rx="3" fill="#3D3630" stroke="#D9A05B" stroke-width="1.5"/>' + [30, 70, 110, 150, 190, 230, 270, 310].map(x => `<rect x="${x}" y="26" width="16" height="10" rx="2" fill="#EFE4D2" fill-opacity="0.82"/><rect x="${x}" y="224" width="16" height="10" rx="2" fill="#EFE4D2" fill-opacity="0.82"/>`).join('') },
    { file: 'frame-double-stamp.svg', label: '双线古典信笺框', styles: ['campus-paper', 'warm-honor'], inner: '<rect x="14" y="14" width="332" height="232" rx="4" fill="#FFFDF7" stroke="#5B7A6B" stroke-width="2.5"/><rect x="24" y="24" width="312" height="212" rx="2" fill="none" stroke="#C48A5A" stroke-width="1.2" stroke-dasharray="6 4"/>' },
    { file: 'frame-postcard-scallop.svg', label: '波浪明信片邮戳框', styles: ['campus-paper', 'fresh-teambuild', 'warm-honor'], inner: '<rect x="16" y="16" width="328" height="228" rx="12" fill="#FFFDF7" stroke="#D97B93" stroke-width="2.5" stroke-dasharray="8 6"/><rect x="290" y="30" width="38" height="44" rx="3" fill="#FFF3F5" stroke="#D97B93" stroke-width="1.5" stroke-dasharray="3 2"/>' },
    { file: 'frame-corner-brackets.svg', label: '杂志四角取景框', styles: ['minimal-mag', 'stage-heat', 'retro-film'], inner: '<path d="M22 60 V22 H60 M300 22 H338 V60 M22 200 V238 H60 M300 238 H338 V200" fill="none" stroke="#111111" stroke-width="3.5" stroke-linecap="square"/><rect x="34" y="34" width="292" height="192" fill="none" stroke="#E2E2E2" stroke-width="1"/>' },
    { file: 'frame-ticket-stub.svg', label: '纪念票根打孔框', styles: ['retro-film', 'stage-heat', 'warm-honor'], inner: '<path d="M20 26 H340 V106 A14 14 0 0 0 340 134 V234 H20 V134 A14 14 0 0 0 20 106 Z" fill="#FFFDF7" stroke="#C48A5A" stroke-width="2.4"/><line x1="256" y1="36" x2="256" y2="224" stroke="#C48A5A" stroke-width="1.8" stroke-dasharray="5 5"/>' },
    { file: 'frame-botanical-arch.svg', label: '拱门橱窗边框', styles: ['campus-paper', 'fresh-teambuild'], inner: '<path d="M36 242 V130 A144 106 0 0 1 324 130 V242 Z" fill="#FFFDF7" stroke="#5B7A6B" stroke-width="2.6"/><path d="M48 232 V132 A132 94 0 0 1 312 132 V232 Z" fill="none" stroke="#95C4AB" stroke-width="1.4"/>' },
    { file: 'frame-notebook-spiral.svg', label: '线圈活页本边框', styles: ['fresh-teambuild', 'campus-paper'], inner: '<rect x="36" y="20" width="308" height="222" rx="10" fill="#FFFFFF" stroke="#8FB8A4" stroke-width="2.4"/>' + [46, 78, 110, 142, 174, 206].map(y => `<rect x="20" y="${y}" width="26" height="8" rx="4" fill="#5B7A6B"/><circle cx="48" cy="${y + 4}" r="4" fill="#DFF3EA" stroke="#5B7A6B" stroke-width="1.4"/>`).join('') },
    { file: 'frame-vintage-envelope.svg', label: '信封展开边框', styles: ['campus-paper', 'warm-honor'], inner: '<rect x="20" y="26" width="320" height="208" rx="8" fill="#FFFDF7" stroke="#C8282E" stroke-width="2"/><path d="M22 30 L180 132 L338 30" fill="none" stroke="#E8B04A" stroke-width="2.2"/><circle cx="180" cy="132" r="14" fill="#C8282E"/>' },
    { file: 'frame-tape-photo.svg', label: '斜角贴纸双框', styles: ['fresh-teambuild', 'campus-paper'], inner: '<rect x="28" y="28" width="304" height="204" rx="6" fill="#FFFFFF" stroke="#B5D6C4" stroke-width="2"/><rect x="18" y="16" width="66" height="20" transform="rotate(-28 51 26)" fill="#F7D8DF" fill-opacity="0.9"/><rect x="276" y="220" width="66" height="20" transform="rotate(-28 309 230)" fill="#D6E6DC" fill-opacity="0.9"/>' },
    { file: 'frame-gallery-mat.svg', label: '美术馆卡纸画框', styles: ['minimal-mag', 'campus-paper'], inner: '<rect x="14" y="14" width="332" height="232" fill="#F4F1EA" stroke="#3A3530" stroke-width="3"/><rect x="38" y="34" width="284" height="170" fill="#FFFFFF" stroke="#CFC8BA" stroke-width="1.5"/>' }
  ];
  const dir = path.join(openDir, 'frames');
  await mkdir(dir, { recursive: true });
  const items = [];
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="360" height="260">${d.inner}</svg>\n`;
    await writeFile(path.join(dir, d.file), svg, 'utf8');
    items.push({
      id: `open_frame_${String(i + 1).padStart(2, '0')}`,
      name: d.label,
      label: d.label,
      category: '边框相框',
      subcategory: 'SVG 矢量相框',
      role: 'frame',
      styles: d.styles,
      tags: ['边框', '相框', '开源', 'SVG'],
      mediaType: 'svg',
      tier: 'open_free',
      url: `/assets/open/frames/${d.file}`,
      width: 360,
      height: 260,
      source: 'open_local',
      license: 'MIT'
    });
  }
  return items;
}

async function buildGifs() {
  const palette = [
    [0, 0, 0],       // 0 transparent
    [255, 255, 255], // 1 white
    [255, 210, 63],  // 2 warm gold
    [245, 166, 35],  // 3 amber
    [255, 107, 139], // 4 sakura pink
    [230, 59, 46],   // 5 coral red
    [91, 122, 107],  // 6 sage green
    [63, 191, 143],  // 7 mint green
    [139, 92, 246],  // 8 neon violet
    [77, 144, 201],  // 9 sky blue
    [58, 53, 48],    // 10 ink brown
    [217, 160, 91],  // 11 brass
    [255, 181, 71],  // 12 orange glow
    [247, 216, 223], // 13 soft blush
    [184, 174, 219], // 14 soft lavender
    [33, 26, 51]     // 15 deep plum
  ];

  const dir = path.join(openDir, 'gifs');
  await mkdir(dir, { recursive: true });
  const items = [];

  // 1. sparkle-twinkle.gif (64x64)
  {
    const frames = Array.from({ length: 8 }, (_, f) => {
      const c = makeCanvas(64, 64);
      const a1 = [2, 5, 8, 10, 8, 5, 2, 1][f];
      const a2 = [8, 10, 7, 4, 1, 4, 7, 9][f];
      const a3 = [4, 2, 1, 3, 6, 8, 6, 4][f];
      c.star(22, 24, a1, 2, 3);
      c.star(46, 38, a2, 2, 4);
      c.star(40, 14, a3, 1, 2);
      return c.buf;
    });
    await writeFile(path.join(dir, 'sparkle-twinkle.gif'), encodeGif89a(64, 64, palette, frames, 12));
    items.push({ id: 'open_gif_01', name: '暖金闪烁星芒动图', label: '暖金闪烁星芒动图', category: '动图交互', subcategory: '开源微动图', role: 'gif', styles: ALL_STYLES, tags: ['动图', 'GIF', '星星', '闪烁'], mediaType: 'gif', tier: 'open_free', url: '/assets/open/gifs/sparkle-twinkle.gif', width: 64, height: 64, source: 'open_local', license: 'MIT' });
  }

  // 2. arrow-bounce.gif (64x48)
  {
    const frames = Array.from({ length: 8 }, (_, f) => {
      const c = makeCanvas(64, 48);
      const ox = [0, 3, 6, 9, 6, 3, 0, -2][f];
      for (let i = 0; i < 6; i++) {
        c.disc(14 + i * 3 + ox, 14 + i * 2, 2, 5);
        c.disc(14 + i * 3 + ox, 34 - i * 2, 2, 5);
        c.disc(28 + i * 3 + ox, 14 + i * 2, 2, 12);
        c.disc(28 + i * 3 + ox, 34 - i * 2, 2, 12);
      }
      return c.buf;
    });
    await writeFile(path.join(dir, 'arrow-bounce.gif'), encodeGif89a(64, 48, palette, frames, 10));
    items.push({ id: 'open_gif_02', name: '珊瑚红弹跳引导箭头', label: '珊瑚红弹跳引导箭头', category: '动图交互', subcategory: '开源微动图', role: 'gif', styles: ['fresh-teambuild', 'warm-honor', 'stage-heat'], tags: ['动图', 'GIF', '箭头', '引导'], mediaType: 'gif', tier: 'open_free', url: '/assets/open/gifs/arrow-bounce.gif', width: 64, height: 48, source: 'open_local', license: 'MIT' });
  }

  // 3. heart-float.gif (64x64)
  {
    const frames = Array.from({ length: 8 }, (_, f) => {
      const c = makeCanvas(64, 64);
      const y1 = 44 - f * 4;
      const y2 = 52 - ((f + 4) % 8) * 4;
      c.heart(26 + (f % 2 === 0 ? 1 : -1), y1, 0.9, 4, 13);
      c.heart(44, y2, 0.55, 5, 4);
      return c.buf;
    });
    await writeFile(path.join(dir, 'heart-float.gif'), encodeGif89a(64, 64, palette, frames, 14));
    items.push({ id: 'open_gif_03', name: '漂浮双心手账动图', label: '漂浮双心手账动图', category: '动图交互', subcategory: '开源微动图', role: 'gif', styles: ['campus-paper', 'fresh-teambuild', 'warm-honor'], tags: ['动图', 'GIF', '爱心'], mediaType: 'gif', tier: 'open_free', url: '/assets/open/gifs/heart-float.gif', width: 64, height: 64, source: 'open_local', license: 'MIT' });
  }

  // 4. confetti-burst.gif (96x64)
  {
    const dots = [
      [18, 36, -2, -3, 2], [32, 34, -1, -4, 4], [48, 32, 0, -4, 7], [64, 34, 1, -4, 8], [78, 36, 2, -3, 5],
      [28, 42, -3, -2, 9], [44, 44, -1, -2, 2], [58, 42, 2, -2, 4], [70, 44, 3, -1, 7]
    ];
    const frames = Array.from({ length: 8 }, (_, f) => {
      const c = makeCanvas(96, 64);
      for (const [x0, y0, vx, vy, col] of dots) {
        const x = x0 + vx * f;
        const y = y0 + vy * f + 0.45 * f * f;
        c.disc(x, y, f < 6 ? 2 : 1, col);
      }
      c.star(48, 22, [1, 4, 6, 4, 2, 1, 3, 5][f], 2, 12);
      return c.buf;
    });
    await writeFile(path.join(dir, 'confetti-burst.gif'), encodeGif89a(96, 64, palette, frames, 11));
    items.push({ id: 'open_gif_04', name: '庆典彩屑礼花动图', label: '庆典彩屑礼花动图', category: '动图交互', subcategory: '开源微动图', role: 'gif', styles: ['stage-heat', 'warm-honor', 'fresh-teambuild'], tags: ['动图', 'GIF', '礼花', '喜报'], mediaType: 'gif', tier: 'open_free', url: '/assets/open/gifs/confetti-burst.gif', width: 96, height: 64, source: 'open_local', license: 'MIT' });
  }

  // 5. music-eq.gif (64x48)
  {
    const cols = [4, 12, 2, 7, 8];
    const heights = [
      [12, 26, 18, 30, 14],
      [22, 16, 30, 18, 26],
      [30, 22, 14, 26, 20],
      [18, 32, 24, 14, 28],
      [14, 20, 32, 24, 16],
      [26, 14, 20, 30, 22],
      [28, 24, 16, 18, 30],
      [16, 30, 22, 24, 12]
    ];
    const frames = heights.map(hs => {
      const c = makeCanvas(64, 48);
      for (let i = 0; i < 5; i++) {
        c.rect(8 + i * 10, 42 - hs[i], 6, hs[i], cols[i]);
      }
      return c.buf;
    });
    await writeFile(path.join(dir, 'music-eq.gif'), encodeGif89a(64, 48, palette, frames, 10));
    items.push({ id: 'open_gif_05', name: '舞台节拍音浪条', label: '舞台节拍音浪条', category: '动图交互', subcategory: '开源微动图', role: 'gif', styles: ['stage-heat', 'fresh-teambuild'], tags: ['动图', 'GIF', '音乐', '节拍'], mediaType: 'gif', tier: 'open_free', url: '/assets/open/gifs/music-eq.gif', width: 64, height: 48, source: 'open_local', license: 'MIT' });
  }

  // 6. film-reel-spin.gif (64x64)
  {
    const frames = Array.from({ length: 8 }, (_, f) => {
      const c = makeCanvas(64, 64);
      for (let a = 0; a < 360; a += 6) {
        const rad = (a * Math.PI) / 180;
        c.disc(32 + Math.cos(rad) * 20, 32 + Math.sin(rad) * 20, 2, 10);
      }
      c.disc(32, 32, 5, 11);
      for (let k = 0; k < 4; k++) {
        const ang = ((k * 90 + f * 22.5) * Math.PI) / 180;
        c.disc(32 + Math.cos(ang) * 12, 32 + Math.sin(ang) * 12, 3, 2);
      }
      return c.buf;
    });
    await writeFile(path.join(dir, 'film-reel-spin.gif'), encodeGif89a(64, 64, palette, frames, 11));
    items.push({ id: 'open_gif_06', name: '旋转胶片盘微动图', label: '旋转胶片盘微动图', category: '动图交互', subcategory: '开源微动图', role: 'gif', styles: ['retro-film', 'campus-paper'], tags: ['动图', 'GIF', '胶片'], mediaType: 'gif', tier: 'open_free', url: '/assets/open/gifs/film-reel-spin.gif', width: 64, height: 64, source: 'open_local', license: 'MIT' });
  }

  // 7. tape-wave.gif (80x36)
  {
    const frames = Array.from({ length: 8 }, (_, f) => {
      const c = makeCanvas(80, 36);
      for (let x = 6; x < 74; x++) {
        const y = Math.round(18 + Math.sin((x + f * 6) * 0.22) * 5);
        const col = Math.abs(x - f * 9) < 8 ? 2 : 6;
        c.disc(x, y, 2, col);
      }
      return c.buf;
    });
    await writeFile(path.join(dir, 'tape-wave.gif'), encodeGif89a(80, 36, palette, frames, 12));
    items.push({ id: 'open_gif_07', name: '流光波浪分割线动图', label: '流光波浪分割线动图', category: '动图交互', subcategory: '开源微动图', role: 'gif', styles: ['campus-paper', 'fresh-teambuild', 'minimal-mag'], tags: ['动图', 'GIF', '分割线'], mediaType: 'gif', tier: 'open_free', url: '/assets/open/gifs/tape-wave.gif', width: 80, height: 36, source: 'open_local', license: 'MIT' });
  }

  // 8. scroll-hint.gif (72x44)
  {
    const frames = Array.from({ length: 8 }, (_, f) => {
      const c = makeCanvas(72, 44);
      const sx = 12 + f * 6;
      c.rect(14, 20, 44, 4, 14);
      c.disc(sx, 22, 5, 4);
      c.disc(sx, 22, 2, 1);
      return c.buf;
    });
    await writeFile(path.join(dir, 'scroll-hint.gif'), encodeGif89a(72, 44, palette, frames, 11));
    items.push({ id: 'open_gif_08', name: '右滑查看引导动图', label: '右滑查看引导动图', category: '动图交互', subcategory: '开源微动图', role: 'gif', styles: ALL_STYLES, tags: ['动图', 'GIF', '滑动提示'], mediaType: 'gif', tier: 'open_free', url: '/assets/open/gifs/scroll-hint.gif', width: 72, height: 44, source: 'open_local', license: 'MIT' });
  }

  return items;
}

async function main() {
  const openAssets = [
    ...(await buildTapes()),
    ...(await buildTextures()),
    ...(await buildIcons()),
    ...(await buildFrames()),
    ...(await buildGifs())
  ];

  await mkdir(catalogDir, { recursive: true });
  await writeFile(
    path.join(catalogDir, 'open-assets.json'),
    JSON.stringify({ version: 1, count: openAssets.length, assets: openAssets }, null, 2) + '\n',
    'utf8'
  );

  let xiumiAssets = [];
  try {
    const rawXiumi = JSON.parse(await readFile(path.join(catalogDir, 'xiumi-catalog.json'), 'utf8'));
    xiumiAssets = (rawXiumi.assets || []).map(a => {
      const isGif = /\.gif(\?|$)/i.test(a.url || '') || a.mediaType === 'gif';
      return {
        ...a,
        label: a.label || a.name,
        mediaType: isGif ? 'gif' : (a.mediaType || 'image'),
        role: isGif ? 'gif' : (a.role || 'sticker')
      };
    });
  } catch {}

  const merged = [...openAssets, ...xiumiAssets];
  const mergedCatalog = {
    version: 1,
    total: merged.length,
    openCount: openAssets.length,
    xiumiCount: xiumiAssets.length,
    assets: merged
  };
  await writeFile(
    path.join(catalogDir, 'assets-catalog.json'),
    JSON.stringify(mergedCatalog, null, 2) + '\n',
    'utf8'
  );

  console.log(JSON.stringify({ openCount: openAssets.length, xiumiCount: xiumiAssets.length, total: merged.length }));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
