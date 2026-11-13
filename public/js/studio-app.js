import {
  THEME_PRESETS,
  BLOCK_CATEGORIES,
  BLOCK_TEMPLATES,
  renderBlockHtml,
  compileArticleHtml,
  normalizeAiBlock,
  buildStarterArticle,
  parseHtmlIntoDraft
} from './block-templates.js';
import {
  ARTWORD_FONTS,
  ARTWORD_PRESETS,
  renderArtWordPng
} from './artword-generator.js';
import {
  exportArticleToPng2x,
  getTeacherReviewMessages
} from './png-exporter.js';

const $ = (id) => document.getElementById(id);

const state = {
  catalog: [],
  stylePacks: [],
  drafts: [],
  activeDraft: null,
  selectedBlockUid: null,
  leftTab: 'styles',
  blockSubcat: 'all',
  filterStyle: '',
  filterTier: 'all',
  filterQuery: '',
  aiStatus: null,
  undoStack: [],
  redoStack: [],
  imageTarget: null,
  artword: {
    text: '把平凡的日子收好',
    subtitle: '二零二六 · 现场手记',
    fontKey: 'wenkai',
    presetKey: 'seal-stamp',
    dataUrl: ''
  },
  lintTimer: null,
  saveTimer: null
};

function showToast(msg, ms = 2600) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), ms);
}

async function api(url, method = 'GET', body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function sanitizeInlineRich(el) {
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName.toLowerCase();
    if (tag === 'br') return '<br/>';
    let inner = '';
    for (const c of node.childNodes) inner += walk(c);
    if (tag === 'b' || tag === 'strong') return `<strong>${inner}</strong>`;
    if (tag === 'i' || tag === 'em') return `<em>${inner}</em>`;
    if (tag === 'font') {
      const col = node.getAttribute('color');
      return col ? `<span style="color:${col.replace(/["'<>]/g, '')};">${inner}</span>` : inner;
    }
    if (tag === 'span') {
      const color = node.style?.color;
      const bg = node.style?.backgroundColor;
      const fw = node.style?.fontWeight;
      const styles = [];
      if (color) styles.push(`color:${color}`);
      if (bg) styles.push(`background-color:${bg}`);
      if (fw) styles.push(`font-weight:${fw}`);
      return styles.length ? `<span style="${styles.join(';')}">${inner}</span>` : inner;
    }
    if (tag === 'div' || tag === 'p') return inner ? `${inner}<br/>` : '';
    return inner;
  };
  let html = '';
  for (const child of el.childNodes) html += walk(child);
  return html.replace(/(?:<br\/>)+$/i, '');
}

function snapshotForUndo() {
  if (!state.activeDraft) return;
  state.undoStack.push(JSON.stringify(state.activeDraft));
  if (state.undoStack.length > 40) state.undoStack.shift();
  state.redoStack = [];
}

function scheduleSaveAndLint() {
  $('save-status-pill').textContent = '待保存...';
  $('save-status-pill').className = 'pill warn';
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(persistActiveDraft, 600);
  clearTimeout(state.lintTimer);
  state.lintTimer = setTimeout(runLiveLint, 220);
}

async function persistActiveDraft() {
  if (!state.activeDraft) return;
  try {
    const mode = $('export-target').value || 'wechat';
    const html = compileArticleHtml(state.activeDraft, { mode, editor: false, origin: window.location.origin });
    const payload = { ...state.activeDraft, html };
    const saved = await api('/api/drafts', 'POST', payload);
    state.activeDraft.id = saved.id;
    state.activeDraft.updatedAt = saved.updatedAt;
    const idx = state.drafts.findIndex(d => d.id === saved.id);
    if (idx >= 0) state.drafts[idx] = saved;
    else state.drafts.unshift(saved);
    renderDraftSelect();
    $('save-status-pill').textContent = '已自动保存';
    $('save-status-pill').className = 'pill ok';
  } catch (e) {
    $('save-status-pill').textContent = '保存失败';
    showToast(`自动保存失败：${e.message}`);
  }
}

function hydrateDraft(raw) {
  const styleId = THEME_PRESETS[raw?.styleId] ? raw.styleId : 'campus-paper';
  if (Array.isArray(raw?.blocks) && raw.blocks.length > 0) {
    return {
      ...raw,
      styleId,
      blocks: raw.blocks.map((b, i) => normalizeAiBlock(b, i))
    };
  }
  if (typeof raw?.html === 'string' && raw.html.trim()) {
    const parsed = parseHtmlIntoDraft(raw.html, styleId);
    return {
      ...parsed,
      ...raw,
      blocks: parsed.blocks
    };
  }
  const starter = buildStarterArticle(styleId);
  return { ...starter, ...raw, blocks: starter.blocks };
}

function renderDraftSelect() {
  const sel = $('draft-select');
  sel.replaceChildren();
  for (const d of state.drafts) {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.title || '未命名推文草稿';
    if (state.activeDraft?.id === d.id) opt.selected = true;
    sel.appendChild(opt);
  }
}

function buildBlockToolbar(uid) {
  const bar = document.createElement('div');
  bar.className = 'block-toolbar editor-chrome';
  const buttons = [
    ['↑', 'up', '上移一层'],
    ['↓', 'down', '下移一层'],
    ['⎘', 'dup', '复制区块'],
    ['去角标', 'clear-corner', '移除角标贴纸'],
    ['✕', 'del', '删除区块']
  ];
  for (const [label, action, title] of buttons) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.title = title;
    btn.onclick = (e) => {
      e.stopPropagation();
      handleBlockAction(uid, action);
    };
    bar.appendChild(btn);
  }
  return bar;
}

function handleBlockAction(uid, action) {
  const blocks = state.activeDraft?.blocks;
  if (!blocks) return;
  const idx = blocks.findIndex(b => b.uid === uid);
  if (idx < 0) return;

  snapshotForUndo();
  if (action === 'up' && idx > 0) {
    [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
  } else if (action === 'down' && idx < blocks.length - 1) {
    [blocks[idx + 1], blocks[idx]] = [blocks[idx], blocks[idx + 1]];
  } else if (action === 'dup') {
    const copy = JSON.parse(JSON.stringify(blocks[idx]));
    copy.uid = `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    blocks.splice(idx + 1, 0, copy);
    state.selectedBlockUid = copy.uid;
  } else if (action === 'clear-corner') {
    blocks[idx].cornerStickerUrl = '';
  } else if (action === 'del') {
    if (blocks.length === 1) {
      showToast('至少保留一个排版区块');
      state.undoStack.pop();
      return;
    }
    blocks.splice(idx, 1);
    state.selectedBlockUid = blocks[Math.max(0, idx - 1)]?.uid || null;
  }
  renderCanvas();
  scheduleSaveAndLint();
}

function renderCanvas() {
  const draft = state.activeDraft;
  if (!draft) return;
  $('draft-title-input').value = draft.title || '';
  $('draft-summary-input').value = draft.summary || '';
  $('ai-style').value = draft.styleId || 'campus-paper';

  const mode = $('export-target').value || 'wechat';
  const paper = $('reader-paper');
  paper.innerHTML = compileArticleHtml(draft, { mode, editor: true });

  paper.querySelectorAll('[data-block-uid]').forEach(el => {
    const uid = el.getAttribute('data-block-uid');
    if (uid === state.selectedBlockUid) el.classList.add('is-selected');
    el.appendChild(buildBlockToolbar(uid));
    el.addEventListener('click', () => {
      if (state.selectedBlockUid !== uid) {
        state.selectedBlockUid = uid;
        paper.querySelectorAll('[data-block-uid]').forEach(node => {
          node.classList.toggle('is-selected', node.getAttribute('data-block-uid') === uid);
        });
      }
    });
  });

  paper.querySelectorAll('[data-editable-prop]').forEach(edEl => {
    edEl.addEventListener('input', () => {
      const wrap = edEl.closest('[data-block-uid]');
      const uid = wrap?.getAttribute('data-block-uid');
      const prop = edEl.getAttribute('data-editable-prop');
      const block = state.activeDraft.blocks.find(b => b.uid === uid);
      if (!block || !prop) return;
      const plain = edEl.innerText.replace(/\r\n/g, '\n');
      const rich = sanitizeInlineRich(edEl);
      block.props = block.props || {};
      block.props[prop] = rich !== plain.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')
        ? { plain, rich }
        : plain;
      scheduleSaveAndLint();
    });
  });

  paper.querySelectorAll('[data-image-prop]').forEach(imgEl => {
    imgEl.title = '点击上传本地照片或更换图片素材';
    imgEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrap = imgEl.closest('[data-block-uid]');
      const uid = wrap?.getAttribute('data-block-uid');
      const prop = imgEl.getAttribute('data-image-prop');
      if (uid && prop) openImagePicker(uid, prop);
    });
  });
}

async function runLiveLint() {
  if (!state.activeDraft) return;
  try {
    const mode = $('lint-mode').value || 'class-unofficial';
    const target = $('export-target').value || 'wechat';
    const customForbidden = ($('custom-forbidden').value || '')
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(Boolean);
    const html = compileArticleHtml(state.activeDraft, { mode: target, editor: false });
    const res = await api('/api/lint', 'POST', { html, options: { mode, target, customForbidden } });

    $('lint-stats-pill').textContent = `${res.stats?.customChars || 0} 字 · ${res.stats?.distinctAssets || 0} 图`;
    const box = $('lint-status-box');
    const list = $('lint-issues');
    list.replaceChildren();

    if (res.passed) {
      box.className = 'lint-status pass';
      box.textContent = target === 'wechat'
        ? '检查通过 · 支持直接复制到微信公众号'
        : '检查通过 · 符合秀米纯内联单根规范';
    } else {
      box.className = 'lint-status fail';
      box.textContent = `发现 ${res.issues.length} 项红线或格式提醒`;
      for (const issue of res.issues) {
        const div = document.createElement('div');
        div.className = 'issue-item';
        div.textContent = `[${issue.rule}] 检出 “${issue.term}” (${issue.count} 处)`;
        list.appendChild(div);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function tierBadgeInfo(tier) {
  if (tier === 'open_free') return ['开源免费', 'tier-open'];
  if (tier === 'custom') return ['本地上传', 'tier-custom'];
  if (tier === 'vip') return ['秀米VIP', 'tier-vip'];
  return ['秀米免费', 'tier-free'];
}

function insertBlockAfterSelection(templateId, overrideProps = {}) {
  if (!state.activeDraft) return;
  snapshotForUndo();
  const tpl = BLOCK_TEMPLATES.find(t => t.id === templateId);
  const block = {
    uid: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    templateId,
    props: { ...(tpl?.defaultProps || {}), ...overrideProps }
  };
  const blocks = state.activeDraft.blocks;
  const idx = blocks.findIndex(b => b.uid === state.selectedBlockUid);
  if (idx >= 0) blocks.splice(idx + 1, 0, block);
  else blocks.push(block);
  state.selectedBlockUid = block.uid;
  renderCanvas();
  scheduleSaveAndLint();
  showToast(`已插入「${tpl?.name || '自定义组件'}」`);
}

function filterCatalogByTab(tab) {
  const q = state.filterQuery.trim().toLowerCase();
  const styleFilter = state.filterStyle;
  const tierFilter = state.filterTier;

  const aliases = {
    'campus-paper': ['campus-paper', '文艺纸感'],
    'stage-heat': ['stage-heat', '舞台热浪'],
    'fresh-teambuild': ['fresh-teambuild', '清新团建', '清新日常'],
    'retro-film': ['retro-film', '复古胶片'],
    'minimal-mag': ['minimal-mag', '极简杂志', '极简干货'],
    'warm-honor': ['warm-honor', '荣誉喜报']
  };

  return state.catalog.filter(a => {
    if (tab === 'uploads') {
      if (a.tier !== 'custom') return false;
    } else if (tab === 'stickers') {
      const ok = ['sticker', 'badge', 'divider'].includes(a.role) || /贴纸|形状|图标|角标|胶带/.test(a.category || '');
      if (!ok) return false;
    } else if (tab === 'frames') {
      const ok = a.role === 'frame' || /边框|相框/.test(a.category || '');
      if (!ok) return false;
    } else if (tab === 'gifs') {
      const ok = a.mediaType === 'gif' || a.role === 'gif' || /\.gif(\?|$)/i.test(a.url || '');
      if (!ok) return false;
    } else if (tab === 'textures') {
      const ok = ['background', 'photo'].includes(a.role) || /纸纹|背景|摄影/.test(a.category || '');
      if (!ok) return false;
    }

    if (tierFilter !== 'all' && a.tier !== tierFilter) return false;
    if (styleFilter) {
      const allowed = aliases[styleFilter] || [styleFilter];
      const st = a.styles || [];
      if (st.length && !st.some(s => allowed.includes(s))) return false;
    }
    if (q) {
      const hay = `${a.name || ''} ${a.label || ''} ${a.category || ''} ${a.subcategory || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function handleAssetClick(asset) {
  const tab = state.leftTab;
  if (tab === 'textures' && (asset.role === 'background' || /纸纹|背景/.test(asset.category || ''))) {
    snapshotForUndo();
    state.activeDraft.bgTextureUrl = asset.url;
    renderCanvas();
    scheduleSaveAndLint();
    showToast(`已应用背景纸纹：${asset.name}`);
    return;
  }

  if (tab === 'textures' && asset.role === 'photo') {
    insertBlockAfterSelection('photo-polaroid-single', { imageUrl: asset.url, caption: asset.name });
    return;
  }

  if (tab === 'frames') {
    insertBlockAfterSelection('photo-polaroid-single', {
      imageUrl: 'https://statics.xiumi.us/mat/i/fvId/f6ccb02a8ebb41e38ba667da73456c1d_sz-174613.jpg',
      tapeUrl: asset.url,
      caption: asset.name
    });
    return;
  }

  if (asset.mediaType === 'gif' || asset.role === 'gif') {
    if ($('sticker-insert-mode').value === 'corner' && state.selectedBlockUid) {
      const b = state.activeDraft.blocks.find(x => x.uid === state.selectedBlockUid);
      if (b) {
        snapshotForUndo();
        b.cornerStickerUrl = asset.url;
        renderCanvas();
        scheduleSaveAndLint();
        showToast('已将动图贴为当前块角标');
        return;
      }
    }
    insertBlockAfterSelection('gif-sparkle-header', { gifUrl: asset.url, text: asset.name || '微动装饰条' });
    return;
  }

  // Sticker / custom upload / badge
  if ($('sticker-insert-mode').value === 'corner' && state.selectedBlockUid) {
    const b = state.activeDraft.blocks.find(x => x.uid === state.selectedBlockUid);
    if (b) {
      snapshotForUndo();
      b.cornerStickerUrl = asset.url;
      renderCanvas();
      scheduleSaveAndLint();
      showToast(`已将「${asset.name}」贴到当前区块右上角`);
      return;
    }
  }
  snapshotForUndo();
  const block = {
    uid: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    templateId: 'sticker-badge-block',
    props: { url: asset.url, size: 108, caption: '' }
  };
  const blocks = state.activeDraft.blocks;
  const idx = blocks.findIndex(b => b.uid === state.selectedBlockUid);
  if (idx >= 0) blocks.splice(idx + 1, 0, block);
  else blocks.push(block);
  state.selectedBlockUid = block.uid;
  renderCanvas();
  scheduleSaveAndLint();
  showToast(`已插入贴纸「${asset.name}」`);
}

function renderAssetGrid(container, assets) {
  if (!assets.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:24px 12px;text-align:center;color:var(--muted);font-size:12px;';
    empty.textContent = '当前筛选条件下暂无素材，可放宽风格或级别筛选。';
    container.appendChild(empty);
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'asset-grid';
  for (const a of assets.slice(0, 120)) {
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.title = `${a.name}（点击使用）`;
    card.onclick = () => handleAssetClick(a);

    const thumb = document.createElement('div');
    thumb.className = 'asset-thumb';
    const img = document.createElement('img');
    img.src = a.url;
    img.loading = 'lazy';
    img.alt = a.name || '';
    const [badgeText, badgeCls] = tierBadgeInfo(a.tier);
    const badge = document.createElement('span');
    badge.className = `tier-badge ${badgeCls}`;
    badge.textContent = badgeText;
    thumb.append(img, badge);

    const label = document.createElement('div');
    label.className = 'asset-label';
    label.textContent = a.name || a.id;

    card.append(thumb, label);
    grid.appendChild(card);
  }
  container.appendChild(grid);
}

async function refreshArtwordPreview() {
  const t = THEME_PRESETS[state.activeDraft?.styleId] || THEME_PRESETS['campus-paper'];
  const url = await renderArtWordPng({
    text: state.artword.text,
    subtitle: state.artword.subtitle,
    fontKey: state.artword.fontKey,
    presetKey: state.artword.presetKey,
    primaryColor: t.palette.primary,
    accentColor: t.palette.accent,
    inkColor: state.artword.presetKey === 'neon-stage' ? '#FFFFFF' : t.palette.ink
  });
  state.artword.dataUrl = url;
  const img = $('artword-preview-img');
  if (img) img.src = url;
}

function renderArtwordTab(container) {
  const wrap = document.createElement('div');
  wrap.className = 'artword-box';

  const tip = document.createElement('div');
  tip.style.cssText = 'font-size:11px;color:var(--muted);line-height:1.5;';
  tip.textContent = '使用开源中文字体实时渲染 @2x 透明艺术字标题，一键插入推文或存入我的素材。';

  const inpText = document.createElement('input');
  inpText.type = 'text';
  inpText.placeholder = '输入主标题文字...';
  inpText.value = state.artword.text;
  inpText.style.cssText = 'padding:6px 8px;border:1px solid var(--border);border-radius:6px;';
  inpText.oninput = () => {
    state.artword.text = inpText.value;
    refreshArtwordPreview();
  };

  const inpSub = document.createElement('input');
  inpSub.type = 'text';
  inpSub.placeholder = '输入小副标题（可选）...';
  inpSub.value = state.artword.subtitle;
  inpSub.style.cssText = 'padding:6px 8px;border:1px solid var(--border);border-radius:6px;';
  inpSub.oninput = () => {
    state.artword.subtitle = inpSub.value;
    refreshArtwordPreview();
  };

  const fontLabel = document.createElement('div');
  fontLabel.style.cssText = 'font-size:11px;font-weight:600;margin-top:2px;';
  fontLabel.textContent = '选择字体风格';
  const fontRow = document.createElement('div');
  fontRow.className = 'chip-grid';
  for (const f of ARTWORD_FONTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `chip-btn ${state.artword.fontKey === f.key ? 'active' : ''}`;
    b.textContent = f.name;
    b.onclick = () => {
      state.artword.fontKey = f.key;
      renderLeftLibrary();
    };
    fontRow.appendChild(b);
  }

  const presetLabel = document.createElement('div');
  presetLabel.style.cssText = 'font-size:11px;font-weight:600;margin-top:2px;';
  presetLabel.textContent = '选择版式样式';
  const presetRow = document.createElement('div');
  presetRow.className = 'chip-grid';
  for (const p of ARTWORD_PRESETS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `chip-btn ${state.artword.presetKey === p.key ? 'active' : ''}`;
    b.textContent = p.name;
    b.onclick = () => {
      state.artword.presetKey = p.key;
      renderLeftLibrary();
    };
    presetRow.appendChild(b);
  }

  const prevBox = document.createElement('div');
  prevBox.className = 'artword-preview';
  const prevImg = document.createElement('img');
  prevImg.id = 'artword-preview-img';
  prevImg.alt = '艺术字实时预览';
  prevBox.appendChild(prevImg);

  const btnRow = document.createElement('div');
  btnRow.className = 'filter-row';
  const btnInsert = document.createElement('button');
  btnInsert.type = 'button';
  btnInsert.className = 'btn-primary';
  btnInsert.textContent = '插入为艺术字标题';
  btnInsert.onclick = async () => {
    await refreshArtwordPreview();
    const uploaded = await api('/api/catalog/custom', 'POST', {
      filename: `artword-${Date.now()}.png`,
      category: '标题艺术字',
      styles: [state.activeDraft?.styleId || 'campus-paper'],
      dataUrl: state.artword.dataUrl
    });
    state.catalog.unshift(uploaded);
    snapshotForUndo();
    const block = {
      uid: `b_${Date.now()}_aw`,
      templateId: 'sticker-badge-block',
      props: { url: uploaded.url, size: 320, caption: '' }
    };
    const blocks = state.activeDraft.blocks;
    const idx = blocks.findIndex(b => b.uid === state.selectedBlockUid);
    if (idx >= 0) blocks.splice(idx + 1, 0, block);
    else blocks.unshift(block);
    state.selectedBlockUid = block.uid;
    renderCanvas();
    scheduleSaveAndLint();
    showToast('艺术字已插入画布并保存到我的素材');
  };

  const btnSave = document.createElement('button');
  btnSave.type = 'button';
  btnSave.textContent = '仅存我的素材';
  btnSave.onclick = async () => {
    await refreshArtwordPreview();
    const uploaded = await api('/api/catalog/custom', 'POST', {
      filename: `artword-${Date.now()}.png`,
      category: '标题艺术字',
      styles: [state.activeDraft?.styleId || 'campus-paper'],
      dataUrl: state.artword.dataUrl
    });
    state.catalog.unshift(uploaded);
    showToast('艺术字已存入我的素材库');
  };

  btnRow.append(btnInsert, btnSave);
  wrap.append(tip, inpText, inpSub, fontLabel, fontRow, presetLabel, presetRow, prevBox, btnRow);
  container.appendChild(wrap);
  refreshArtwordPreview();
}

function renderLeftLibrary() {
  const container = $('library-content');
  container.replaceChildren();

  const tab = state.leftTab;
  $('library-filters').style.display = tab === 'artword' ? 'none' : 'flex';
  $('sticker-mode-bar').style.display = ['stickers', 'gifs', 'uploads'].includes(tab) ? 'flex' : 'none';

  if (tab === 'artword') {
    renderArtwordTab(container);
    return;
  }

  if (tab === 'styles') {
    for (const s of Object.values(THEME_PRESETS)) {
      const card = document.createElement('div');
      card.className = 'style-card';

      const head = document.createElement('div');
      head.className = 'style-card-head';
      const title = document.createElement('strong');
      title.textContent = s.name;
      const mood = document.createElement('span');
      mood.className = 'pill';
      mood.textContent = s.mood;
      head.append(title, mood);

      const swatches = document.createElement('div');
      swatches.className = 'swatch-row';
      for (const col of [s.palette.bg, s.palette.cardBg, s.palette.primary, s.palette.accent, s.palette.ink]) {
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = col;
        sw.title = col;
        swatches.appendChild(sw);
      }

      const actions = document.createElement('div');
      actions.className = 'filter-row';
      const btnPalette = document.createElement('button');
      btnPalette.type = 'button';
      btnPalette.textContent = '仅换整篇配色';
      btnPalette.onclick = () => {
        snapshotForUndo();
        state.activeDraft.styleId = s.id;
        renderCanvas();
        scheduleSaveAndLint();
        showToast(`已切换为「${s.name}」配色`);
      };

      const btnFull = document.createElement('button');
      btnFull.type = 'button';
      btnFull.className = 'btn-primary';
      btnFull.textContent = '载入整套样刊';
      btnFull.onclick = () => {
        snapshotForUndo();
        const starter = buildStarterArticle(s.id);
        state.activeDraft = { ...starter, id: state.activeDraft?.id };
        state.selectedBlockUid = state.activeDraft.blocks[0]?.uid || null;
        renderCanvas();
        scheduleSaveAndLint();
        showToast(`已载入「${s.name}」6段式样刊`);
      };

      actions.append(btnPalette, btnFull);
      card.append(head, swatches, actions);
      container.appendChild(card);
    }
    return;
  }

  if (tab === 'blocks') {
    const subRow = document.createElement('div');
    subRow.className = 'subcat-pills';
    const cats = [{ id: 'all', name: `全部(${BLOCK_TEMPLATES.length})` }, ...BLOCK_CATEGORIES];
    for (const c of cats) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `subcat-pill ${state.blockSubcat === c.id ? 'active' : ''}`;
      btn.textContent = c.name;
      btn.onclick = () => {
        state.blockSubcat = c.id;
        renderLeftLibrary();
      };
      subRow.appendChild(btn);
    }
    container.appendChild(subRow);

    const q = state.filterQuery.trim().toLowerCase();
    const list = BLOCK_TEMPLATES.filter(t => {
      if (state.blockSubcat !== 'all' && t.category !== state.blockSubcat) return false;
      if (state.filterStyle && !(t.styles || []).includes(state.filterStyle)) return false;
      if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
      return true;
    });

    for (const t of list) {
      const card = document.createElement('div');
      card.className = 'tpl-card';
      card.onclick = () => insertBlockAfterSelection(t.id);

      const meta = document.createElement('div');
      meta.className = 'tpl-meta';
      const name = document.createElement('span');
      name.className = 'tpl-name';
      name.textContent = t.name;
      const badge = document.createElement('span');
      badge.className = 'pill';
      badge.textContent = t.isInteractiveSvg ? '微信SVG互动' : '内联组件';
      meta.append(name, badge);

      const desc = document.createElement('div');
      desc.className = 'tpl-desc';
      desc.textContent = t.description;
      card.append(meta, desc);
      container.appendChild(card);
    }
    return;
  }

  if (tab === 'uploads') {
    const dz = document.createElement('div');
    dz.className = 'dropzone';
    const dzTitle = document.createElement('div');
    dzTitle.style.cssText = 'font-weight:600;margin-bottom:6px;';
    dzTitle.textContent = '拖拽贴纸 / GIF 动图 / 摄影照到这里（或点击选择）';
    const fileInp = document.createElement('input');
    fileInp.type = 'file';
    fileInp.multiple = true;
    fileInp.accept = 'image/png,image/jpeg,image/gif,image/webp';
    const handleFiles = async (files) => {
      for (const f of files) {
        try {
          const dataUrl = await fileToDataUrl(f);
          const asset = await api('/api/catalog/custom', 'POST', {
            filename: f.name,
            category: '本地上传',
            styles: [state.activeDraft?.styleId || 'campus-paper'],
            dataUrl
          });
          state.catalog.unshift(asset);
        } catch (err) {
          showToast(`上传 ${f.name} 失败：${err.message}`);
        }
      }
      renderLeftLibrary();
      showToast('已存入永久本地素材库');
    };
    fileInp.onchange = () => handleFiles(fileInp.files);
    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('dragover'); };
    dz.ondragleave = () => dz.classList.remove('dragover');
    dz.ondrop = (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    };
    dz.append(dzTitle, fileInp);
    container.appendChild(dz);
  }

  if (tab === 'gifs') {
    const interactWrap = document.createElement('div');
    interactWrap.style.marginBottom = '10px';
    const hd = document.createElement('div');
    hd.style.cssText = 'font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;';
    hd.textContent = '微信原生零JS交互组件（点击插入 · 秀米导出自动兼容降级）';
    interactWrap.appendChild(hd);
    for (const t of BLOCK_TEMPLATES.filter(x => x.isInteractiveSvg)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = 'width:100%;text-align:left;margin-bottom:5px;padding:7px 9px;';
      btn.textContent = `+ ${t.name}`;
      btn.onclick = () => insertBlockAfterSelection(t.id);
      interactWrap.appendChild(btn);
    }
    container.appendChild(interactWrap);
  }

  renderAssetGrid(container, filterCatalogByTab(tab));
}

function openImagePicker(uid, prop) {
  state.imageTarget = { uid, prop };
  const grid = $('slot-catalog-grid');
  grid.replaceChildren();
  const candidates = state.catalog.filter(a => a.role === 'photo' || a.role === 'sticker' || a.role === 'gif' || a.tier === 'custom').slice(0, 40);
  for (const a of candidates) {
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.onclick = () => applySlotImage(a.url);
    const thumb = document.createElement('div');
    thumb.className = 'asset-thumb';
    const img = document.createElement('img');
    img.src = a.url;
    img.loading = 'lazy';
    thumb.appendChild(img);
    const lbl = document.createElement('div');
    lbl.className = 'asset-label';
    lbl.textContent = a.name || a.id;
    card.append(thumb, lbl);
    grid.appendChild(card);
  }
  $('image-picker-modal').classList.add('open');
}

function applySlotImage(url) {
  if (!state.imageTarget || !state.activeDraft) return;
  const { uid, prop } = state.imageTarget;
  const block = state.activeDraft.blocks.find(b => b.uid === uid);
  if (!block) return;
  snapshotForUndo();
  block.props = block.props || {};
  block.props[prop] = url;
  $('image-picker-modal').classList.remove('open');
  renderCanvas();
  scheduleSaveAndLint();
  showToast('已替换图片');
}

async function copyRichHtmlToClipboard(html) {
  const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' })
        })
      ]);
      return true;
    } catch {}
  }
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0.01;';
  host.innerHTML = html;
  document.body.appendChild(host);
  const range = document.createRange();
  range.selectNodeContents(host);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  sel.removeAllRanges();
  host.remove();
  return ok;
}

async function refreshAiStatusUI() {
  try {
    const s = await api('/api/ai/status');
    state.aiStatus = s;
    const pill = $('ai-status-pill');
    if (s.codex?.loggedIn && s.deepseek?.configured) {
      pill.textContent = 'Codex + DeepSeek 双就绪';
      pill.className = 'pill ok';
    } else if (s.codex?.loggedIn) {
      pill.textContent = 'Codex CLI 已登录';
      pill.className = 'pill ok';
    } else if (s.deepseek?.configured) {
      pill.textContent = 'DeepSeek API 已就绪';
      pill.className = 'pill ok';
    } else {
      pill.textContent = '需配置 Codex 或 DeepSeek';
      pill.className = 'pill warn';
    }
    $('modal-codex-info').textContent = s.codex?.loggedIn
      ? `已登录（${s.codex.version || 'Codex CLI'}）`
      : s.codex?.available ? '已检测到 CLI，但尚未登录（可在终端运行 codex login）' : '未在本机检测到 Codex CLI';
    $('modal-ds-info').textContent = s.deepseek?.configured
      ? `当前已配置密钥：${s.deepseek.maskedKey} · 模型：${s.deepseek.model}`
      : '尚未配置 DeepSeek API Key，可直接在上方粘贴填写。';
  } catch {}
}

function getQuotasFromUI() {
  return {
    stickers: Number($('q-stickers').value || 0),
    artWords: Number($('q-artwords').value || 0),
    gifs: Number($('q-gifs').value || 0),
    frames: Number($('q-frames').value || 0),
    backgrounds: Number($('q-bg').value || 0)
  };
}

function bindEvents() {
  // Left tabs
  $('left-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    state.leftTab = btn.getAttribute('data-tab');
    $('left-tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderLeftLibrary();
  });

  $('filter-style').onchange = () => { state.filterStyle = $('filter-style').value; renderLeftLibrary(); };
  $('filter-tier').onchange = () => { state.filterTier = $('filter-tier').value; renderLeftLibrary(); };
  $('filter-search').oninput = () => { state.filterQuery = $('filter-search').value; renderLeftLibrary(); };

  // Draft selector & CRUD
  $('draft-select').onchange = () => {
    const found = state.drafts.find(d => d.id === $('draft-select').value);
    if (found) {
      state.activeDraft = hydrateDraft(found);
      state.selectedBlockUid = state.activeDraft.blocks[0]?.uid || null;
      state.undoStack = [];
      state.redoStack = [];
      renderCanvas();
      runLiveLint();
    }
  };

  $('btn-new-draft').onclick = async () => {
    const styleId = $('ai-style').value || 'campus-paper';
    const starter = buildStarterArticle(styleId);
    const saved = await api('/api/drafts', 'POST', {
      ...starter,
      html: compileArticleHtml(starter, { mode: 'wechat' })
    });
    state.drafts.unshift(saved);
    state.activeDraft = hydrateDraft(saved);
    state.selectedBlockUid = state.activeDraft.blocks[0]?.uid || null;
    renderDraftSelect();
    renderCanvas();
    runLiveLint();
    showToast('已新建样刊草稿');
  };

  $('btn-del-draft').onclick = async () => {
    if (!state.activeDraft?.id) return;
    await api(`/api/drafts/${encodeURIComponent(state.activeDraft.id)}`, 'DELETE');
    state.drafts = state.drafts.filter(d => d.id !== state.activeDraft.id);
    if (!state.drafts.length) {
      const s = buildStarterArticle('campus-paper');
      const created = await api('/api/drafts', 'POST', { ...s, html: compileArticleHtml(s, { mode: 'wechat' }) });
      state.drafts.push(created);
    }
    state.activeDraft = hydrateDraft(state.drafts[0]);
    state.selectedBlockUid = state.activeDraft.blocks[0]?.uid || null;
    renderDraftSelect();
    renderCanvas();
    runLiveLint();
    showToast('已删除草稿');
  };

  // Width toggle & Undo/Redo
  $('btn-w-375').onclick = () => {
    $('phone-shell').classList.remove('wide');
    $('btn-w-375').classList.add('btn-primary');
    $('btn-w-480').classList.remove('btn-primary');
  };
  $('btn-w-480').onclick = () => {
    $('phone-shell').classList.add('wide');
    $('btn-w-480').classList.add('btn-primary');
    $('btn-w-375').classList.remove('btn-primary');
  };

  const doUndo = () => {
    if (!state.undoStack.length) return showToast('没有可撤销的步骤');
    state.redoStack.push(JSON.stringify(state.activeDraft));
    state.activeDraft = JSON.parse(state.undoStack.pop());
    renderCanvas();
    scheduleSaveAndLint();
  };
  const doRedo = () => {
    if (!state.redoStack.length) return showToast('没有可重做的步骤');
    state.undoStack.push(JSON.stringify(state.activeDraft));
    state.activeDraft = JSON.parse(state.redoStack.pop());
    renderCanvas();
    scheduleSaveAndLint();
  };
  $('btn-undo').onclick = doUndo;
  $('btn-redo').onclick = doRedo;

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      if (document.activeElement?.isContentEditable) return;
      e.preventDefault();
      doUndo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      if (document.activeElement?.isContentEditable) return;
      e.preventDefault();
      doRedo();
    }
  });

  // Inline formatting buttons
  document.querySelectorAll('[data-fmt]').forEach(btn => {
    btn.onmousedown = (e) => e.preventDefault();
    btn.onclick = () => {
      const cmd = btn.getAttribute('data-fmt');
      const t = THEME_PRESETS[state.activeDraft?.styleId] || THEME_PRESETS['campus-paper'];
      if (cmd === 'bold') document.execCommand('bold');
      else if (cmd === 'primary') document.execCommand('foreColor', false, t.palette.primary);
      else if (cmd === 'accent') document.execCommand('foreColor', false, t.palette.accent);
      else if (cmd === 'highlight') document.execCommand('hiliteColor', false, '#FFF3B0');
      else if (cmd === 'clear') document.execCommand('removeFormat');
      if (document.activeElement?.hasAttribute('data-editable-prop')) {
        document.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
  });

  $('btn-clear-bg').onclick = () => {
    if (!state.activeDraft) return;
    snapshotForUndo();
    state.activeDraft.bgTextureUrl = '';
    renderCanvas();
    scheduleSaveAndLint();
    showToast('已清除背景纸纹');
  };

  $('draft-title-input').oninput = () => {
    if (state.activeDraft) {
      state.activeDraft.title = $('draft-title-input').value;
      scheduleSaveAndLint();
    }
  };
  $('draft-summary-input').oninput = () => {
    if (state.activeDraft) {
      state.activeDraft.summary = $('draft-summary-input').value;
      scheduleSaveAndLint();
    }
  };

  $('lint-mode').onchange = runLiveLint;
  $('export-target').onchange = () => {
    renderCanvas();
    runLiveLint();
  };
  $('custom-forbidden').oninput = () => {
    clearTimeout(state.lintTimer);
    state.lintTimer = setTimeout(runLiveLint, 250);
  };

  // Image replacement file upload
  $('slot-file-input').onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const uploaded = await api('/api/catalog/custom', 'POST', {
        filename: file.name,
        category: '本地实拍',
        styles: [state.activeDraft?.styleId || 'campus-paper'],
        dataUrl
      });
      state.catalog.unshift(uploaded);
      applySlotImage(uploaded.url);
    } catch (err) {
      showToast(`上传替换失败：${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  // Copy to WeChat MP
  $('btn-copy-wechat').onclick = async () => {
    if (!state.activeDraft) return;
    const mode = $('export-target').value || 'wechat';
    const html = compileArticleHtml(state.activeDraft, {
      mode,
      editor: false,
      origin: window.location.origin
    });
    const ok = await copyRichHtmlToClipboard(html);
    showToast(ok
      ? `已复制「${mode === 'wechat' ? '微信原生排版' : '秀米兼容排版'}」，去公众号 Ctrl+V 粘贴即可`
      : '剪贴板权限受限，请点击「导入/导出HTML」手动全选复制');
  };

  // @2x PNG Teacher Review Export Modal
  $('btn-png-modal').onclick = async () => {
    const modal = $('png-export-modal');
    const pane = $('png-preview-pane');
    const dl = $('png-download-link');
    const list = $('review-messages-list');

    pane.textContent = '正在高清渲染 @2x 审稿长图（自动内联远端与本地图片）...';
    dl.removeAttribute('href');
    list.replaceChildren();
    for (const item of getTeacherReviewMessages(state.activeDraft?.title)) {
      const card = document.createElement('div');
      card.className = 'review-card';
      const top = document.createElement('div');
      top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;';
      const lbl = document.createElement('strong');
      lbl.textContent = item.label;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '复制话术';
      btn.onclick = async () => {
        await navigator.clipboard.writeText(item.text);
        showToast('已复制汇报话术');
      };
      top.append(lbl, btn);
      const p = document.createElement('p');
      p.textContent = item.text;
      card.append(top, p);
      list.appendChild(card);
    }
    modal.classList.add('open');

    try {
      const result = await exportArticleToPng2x($('reader-paper'));
      const img = document.createElement('img');
      img.src = result.dataUrl;
      img.alt = '@2x审稿长图预览';
      pane.replaceChildren(img);
      dl.href = result.dataUrl;
      dl.download = `${(state.activeDraft?.title || '推文审稿图').replace(/[\\/:*?"<>|]/g, '_')}-2x.png`;
    } catch (err) {
      pane.textContent = `长图生成失败：${err.message}`;
    }
  };

  // HTML Import/Export Modal
  $('btn-html-modal').onclick = () => {
    $('html-code-box').value = compileArticleHtml(state.activeDraft, {
      mode: $('export-target').value || 'wechat',
      editor: false,
      origin: window.location.origin
    });
    $('html-modal').classList.add('open');
  };
  $('btn-view-wechat-html').onclick = () => {
    $('html-code-box').value = compileArticleHtml(state.activeDraft, { mode: 'wechat', editor: false, origin: window.location.origin });
  };
  $('btn-view-xiumi-html').onclick = () => {
    $('html-code-box').value = compileArticleHtml(state.activeDraft, { mode: 'xiumi', editor: false, origin: window.location.origin });
  };
  $('btn-copy-raw-html').onclick = async () => {
    await navigator.clipboard.writeText($('html-code-box').value);
    showToast('HTML 代码已复制到剪贴板');
  };
  $('btn-import-raw-html').onclick = () => {
    try {
      snapshotForUndo();
      const imported = parseHtmlIntoDraft($('html-code-box').value, state.activeDraft?.styleId || 'campus-paper');
      state.activeDraft = { ...state.activeDraft, blocks: imported.blocks };
      state.selectedBlockUid = imported.blocks[0]?.uid || null;
      $('html-modal').classList.remove('open');
      renderCanvas();
      scheduleSaveAndLint();
      showToast(`已成功导入 ${imported.blocks.length} 个秀米/HTML 区块`);
    } catch (err) {
      showToast(`导入失败：${err.message}`);
    }
  };

  // AI Engine Config Modal & Compose
  $('btn-ai-config').onclick = async () => {
    await refreshAiStatusUI();
    $('ai-config-modal').classList.add('open');
  };
  $('btn-save-ai-cfg').onclick = async () => {
    try {
      const payload = {
        deepseekBaseUrl: $('cfg-ds-base').value.trim(),
        deepseekModel: $('cfg-ds-model').value.trim()
      };
      if ($('cfg-ds-key').value.trim()) payload.deepseekApiKey = $('cfg-ds-key').value.trim();
      await api('/api/ai/config', 'POST', payload);
      $('cfg-ds-key').value = '';
      await refreshAiStatusUI();
      showToast('DeepSeek 配置已保存到 .local-secrets.json');
    } catch (err) {
      showToast(`保存失败：${err.message}`);
    }
  };

  $('btn-preview-quota').onclick = () => {
    const quotas = getQuotasFromUI();
    const styleId = $('ai-style').value;
    const savedStyle = state.filterStyle;
    const savedTier = state.filterTier;
    const savedQuery = state.filterQuery;
    state.filterStyle = styleId;
    state.filterTier = 'all';
    state.filterQuery = '';
    const counts = {
      贴纸: filterCatalogByTab('stickers').length,
      相框: filterCatalogByTab('frames').length,
      动图: filterCatalogByTab('gifs').length,
      底纹: filterCatalogByTab('textures').length
    };
    state.filterStyle = savedStyle;
    state.filterTier = savedTier;
    state.filterQuery = savedQuery;
    $('quota-preview-badge').textContent = `贴纸${counts.贴纸}/需${quotas.stickers} · 动图${counts.gifs}/需${quotas.gifs}`;
    $('ai-log').textContent = `当前风格可用池：贴纸 ${counts.贴纸}、相框 ${counts.frames ?? counts.相框}、动图 ${counts.gifs}、底纹 ${counts.底纹}`;
  };

  $('btn-ai-compose').onclick = async () => {
    const rawStory = $('ai-story').value.trim();
    if (!rawStory) return showToast('请先在上方填写活动真实经过与素材文案');
    $('btn-ai-compose').disabled = true;
    $('ai-log').textContent = '正在调用 AI 定量选材与生成排版，请稍候...';
    try {
      const res = await api('/api/ai/compose', 'POST', {
        engine: $('ai-engine').value,
        styleId: $('ai-style').value,
        quotas: getQuotasFromUI(),
        redlineMode: $('lint-mode').value,
        customForbidden: ($('custom-forbidden').value || '').split(/[,，\n]/).map(s => s.trim()).filter(Boolean),
        promptText: $('ai-prompt').value.trim(),
        rawStory
      });
      if (!res.ok) {
        $('ai-log').textContent = `生成未完成：${res.error?.message || '未知错误'}`;
        showToast(res.error?.message || 'AI 引擎未就绪');
        return;
      }
      snapshotForUndo();
      const chosenStyle = $('ai-style').value || 'campus-paper';
      if (typeof res.output === 'string') {
        const parsed = parseHtmlIntoDraft(res.output, chosenStyle);
        state.activeDraft = { ...state.activeDraft, styleId: chosenStyle, blocks: parsed.blocks };
      } else if (Array.isArray(res.output)) {
        state.activeDraft = {
          ...state.activeDraft,
          styleId: chosenStyle,
          blocks: res.output.map((b, i) => normalizeAiBlock(b, i))
        };
      } else {
        const blocks = (res.output.blocks || []).map((b, i) => normalizeAiBlock(b, i));
        state.activeDraft = {
          ...state.activeDraft,
          title: res.output.title || state.activeDraft.title,
          summary: res.output.summary || state.activeDraft.summary,
          styleId: chosenStyle,
          blocks
        };
      }
      state.selectedBlockUid = state.activeDraft.blocks[0]?.uid || null;
      renderCanvas();
      scheduleSaveAndLint();
      $('ai-log').textContent = `已由 ${res.engine} 完成定量排版，红线检查已通过。`;
      showToast(`AI 定量排版完成（引擎：${res.engine}）`);
    } catch (err) {
      $('ai-log').textContent = `请求失败：${err.message}`;
    } finally {
      $('btn-ai-compose').disabled = false;
    }
  };

  // Close modals
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.onclick = () => $(btn.getAttribute('data-close-modal')).classList.remove('open');
  });
}

async function init() {
  bindEvents();
  try {
    const [catData, draftsData] = await Promise.all([
      api('/api/catalog'),
      api('/api/drafts')
    ]);
    state.catalog = catData.assets || [];
    state.stylePacks = catData.stylePacks || Object.values(THEME_PRESETS);

    $('asset-count-pill').textContent = `${state.catalog.length} 精选素材 · ${BLOCK_TEMPLATES.length} 款版式`;
    for (const s of Object.values(THEME_PRESETS)) {
      const opt1 = document.createElement('option');
      opt1.value = s.id;
      opt1.textContent = s.name;
      $('filter-style').appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = s.id;
      opt2.textContent = s.name;
      $('ai-style').appendChild(opt2);
    }

    state.drafts = Array.isArray(draftsData) ? draftsData : [];
    if (!state.drafts.length) {
      const starter = buildStarterArticle('campus-paper');
      const created = await api('/api/drafts', 'POST', {
        ...starter,
        html: compileArticleHtml(starter, { mode: 'wechat' })
      });
      state.drafts.push(created);
    }
    state.activeDraft = hydrateDraft(state.drafts[0]);
    state.selectedBlockUid = state.activeDraft.blocks[0]?.uid || null;

    renderDraftSelect();
    renderLeftLibrary();
    renderCanvas();
    runLiveLint();
  } catch (err) {
    showToast(`初始化失败：${err.message}`);
  }

  refreshAiStatusUI();

  // Live SSE reload when Codex MCP pushes a draft
  try {
    const es = new EventSource('/api/events');
    es.addEventListener('drafts', async () => {
      const latest = await api('/api/drafts');
      if (Array.isArray(latest) && latest.length) {
        state.drafts = latest;
        const newest = [...latest].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0];
        if (newest && (!state.activeDraft || newest.updatedAt !== state.activeDraft.updatedAt)) {
          state.activeDraft = hydrateDraft(newest);
          renderDraftSelect();
          renderCanvas();
          runLiveLint();
          showToast('收到工作台草稿同步更新');
        }
      }
    });
  } catch {}
}

init();
