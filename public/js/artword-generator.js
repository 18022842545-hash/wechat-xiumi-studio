export const ARTWORD_FONTS = [
  { key: 'wenkai', name: '霞鹜文楷手写体', css: "'LXGW WenKai', 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" },
  { key: 'songti', name: '思源雅宋杂志体', css: "'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif" },
  { key: 'smiley', name: '得意圆润现代黑', css: "'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif" },
  { key: 'brush', name: '书法毛笔题字体', css: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', cursive" }
];

export const ARTWORD_PRESETS = [
  { key: 'seal-stamp', name: '朱砂印章旁注' },
  { key: 'washi-collage', name: '和纸胶带拼贴' },
  { key: 'watercolor-halo', name: '水彩晕染诗意' },
  { key: 'neon-stage', name: '舞台光影描边' },
  { key: 'minimal-issue', name: '极简杂志刊头' },
  { key: 'honor-ribbon', name: '鎏金喜报双线' }
];

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderArtWordPng({
  text = '把平凡的日子收好',
  subtitle = '二零二六 · 现场手记',
  fontKey = 'wenkai',
  presetKey = 'seal-stamp',
  primaryColor = '#5B7A6B',
  accentColor = '#C48A5A',
  inkColor = '#2E2A26'
} = {}) {
  const font = ARTWORD_FONTS.find(f => f.key === fontKey) || ARTWORD_FONTS[0];
  if (typeof document !== 'undefined' && document.fonts?.load) {
    try {
      await Promise.race([
        document.fonts.load(`700 44px ${font.css}`),
        new Promise(r => setTimeout(r, 700))
      ]);
    } catch {}
  }

  const W = 720;
  const H = 220;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  if (presetKey === 'watercolor-halo') {
    const g = ctx.createRadialGradient(W * 0.48, H * 0.48, 24, W * 0.48, H * 0.48, 260);
    g.addColorStop(0, `${primaryColor}38`);
    g.addColorStop(0.55, `${accentColor}26`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (presetKey === 'washi-collage') {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.025);
    ctx.fillStyle = `${primaryColor}24`;
    drawRoundRect(ctx, -260, -54, 520, 108, 12);
    ctx.fill();
    ctx.restore();
    // Side tapes
    ctx.fillStyle = `${accentColor}AA`;
    ctx.save();
    ctx.translate(92, 62);
    ctx.rotate(-0.45);
    ctx.fillRect(-34, -12, 68, 24);
    ctx.restore();
    ctx.save();
    ctx.translate(W - 92, H - 58);
    ctx.rotate(-0.45);
    ctx.fillRect(-34, -12, 68, 24);
    ctx.restore();
  } else if (presetKey === 'neon-stage') {
    drawRoundRect(ctx, 48, 28, W - 96, H - 56, 20);
    ctx.fillStyle = '#1C1630';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();
  } else if (presetKey === 'minimal-issue') {
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(86, 48);
    ctx.lineTo(W - 86, 48);
    ctx.moveTo(86, H - 48);
    ctx.lineTo(W - 86, H - 48);
    ctx.stroke();
  } else if (presetKey === 'honor-ribbon') {
    drawRoundRect(ctx, 40, 26, W - 80, H - 52, 16);
    ctx.fillStyle = '#FFF9F0';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();
    drawRoundRect(ctx, 52, 38, W - 104, H - 76, 10);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = accentColor;
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // seal-stamp default
    ctx.fillStyle = `${primaryColor}14`;
    drawRoundRect(ctx, 64, 34, W - 128, H - 68, 14);
    ctx.fill();
    ctx.fillStyle = '#C8282E';
    drawRoundRect(ctx, W - 134, 48, 44, 44, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 20px ${font.css}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('记', W - 112, 70);
  }

  // Subtle decorative dots/lines
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(100, H / 2 - 4, 4, 0, Math.PI * 2);
  ctx.arc(W - 100, H / 2 - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  const cleanText = String(text || '把平凡的日子收好').slice(0, 20);
  const cleanSub = String(subtitle || '').slice(0, 28);
  const titleY = cleanSub ? H * 0.44 : H * 0.5;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 44px ${font.css}`;

  if (presetKey === 'neon-stage') {
    ctx.lineWidth = 6;
    ctx.strokeStyle = primaryColor;
    ctx.strokeText(cleanText, W / 2, titleY);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(cleanText, W / 2, titleY);
  } else {
    ctx.fillStyle = presetKey === 'honor-ribbon' ? primaryColor : inkColor;
    ctx.fillText(cleanText, W / 2, titleY);
  }

  if (cleanSub) {
    ctx.font = `500 20px ${font.css}`;
    ctx.fillStyle = presetKey === 'neon-stage' ? '#FFD23F' : accentColor;
    ctx.fillText(cleanSub, W / 2, H * 0.7);
  }

  return canvas.toDataURL('image/png');
}
