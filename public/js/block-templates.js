const VERIFIED_PHOTOS = {
  nature0: 'https://statics.xiumi.us/mat/i/fvId/f6ccb02a8ebb41e38ba667da73456c1d_sz-174613.jpg',
  nature1: 'https://statics.xiumi.us/mat/i/fvId/c5a4174423e8804741949f051084e7ad_sz-215500.jpg',
  nature2: 'https://statics.xiumi.us/mat/i/fvId/c56b9089c5ec60b998a5ccedfcab3736_sz-214729.jpg',
  stage0: 'https://statics.xiumi.us/mat/i/fvId/3421347dbc5373ca0d598f0490a304bd_sz-703218.jpg',
  stage1: 'https://statics.xiumi.us/mat/i/fvId/b01ff25bb3738148dc01422f671fdae1_sz-480736.jpg',
  stage2: 'https://statics.xiumi.us/mat/i/fvId/c2dbc7886dda40abe7f95c003c71cb86_sz-458858.jpg',
  nebula: 'https://statics.xiumi.us/mat/i/fvId/499a6a159a5bfdeaa86f7ce1c90bbc47_sz-466129.jpg'
};

export const THEME_PRESETS = {
  'campus-paper': {
    id: 'campus-paper',
    name: '校园纸感文艺风',
    mood: '安静、书卷气、青春怀旧',
    fontFamily: "'Noto Serif SC','LXGW WenKai','Songti SC','SimSun',serif",
    palette: {
      bg: '#F5F0E6',
      cardBg: '#FFFDF7',
      surface: '#EDE6D6',
      ink: '#3A3530',
      mutedInk: '#8A8070',
      primary: '#5B7A6B',
      accent: '#C48A5A',
      border: '#DCD3C0'
    }
  },
  'stage-heat': {
    id: 'stage-heat',
    name: '舞台热浪活力风',
    mood: '炸裂、热烈、高能',
    fontFamily: "'PingFang SC','Microsoft YaHei',sans-serif",
    palette: {
      bg: '#14101F',
      cardBg: '#211A33',
      surface: '#2D2445',
      ink: '#FFFFFF',
      mutedInk: '#B8AEDB',
      primary: '#FF3D7F',
      accent: '#FFD23F',
      border: '#4A3D6B'
    }
  },
  'fresh-teambuild': {
    id: 'fresh-teambuild',
    name: '清新团建手账风',
    mood: '轻松、可爱、元气',
    fontFamily: "'LXGW WenKai','PingFang SC','Microsoft YaHei',sans-serif",
    palette: {
      bg: '#F2FAF6',
      cardBg: '#FFFFFF',
      surface: '#DFF3EA',
      ink: '#2E4A40',
      mutedInk: '#7A9A8E',
      primary: '#3FBF8F',
      accent: '#FFB547',
      border: '#C6E8D9'
    }
  },
  'retro-film': {
    id: 'retro-film',
    name: '复古胶片纪实风',
    mood: '怀旧、真实、有温度',
    fontFamily: "'Noto Serif SC','STSong',serif",
    palette: {
      bg: '#2B2622',
      cardBg: '#3A332D',
      surface: '#4A4139',
      ink: '#EFE4D2',
      mutedInk: '#A8998A',
      primary: '#D9A05B',
      accent: '#B5523B',
      border: '#5E5248'
    }
  },
  'minimal-mag': {
    id: 'minimal-mag',
    name: '极简杂志干货风',
    mood: '克制、专业、信息密集',
    fontFamily: "'PingFang SC','Helvetica Neue',sans-serif",
    palette: {
      bg: '#FFFFFF',
      cardBg: '#FAFAFA',
      surface: '#F0F0F0',
      ink: '#111111',
      mutedInk: '#777777',
      primary: '#111111',
      accent: '#E63B2E',
      border: '#E2E2E2'
    }
  },
  'warm-honor': {
    id: 'warm-honor',
    name: '温暖荣誉喜报风',
    mood: '喜庆、庄重、自豪',
    fontFamily: "'Noto Serif SC','Microsoft YaHei',serif",
    palette: {
      bg: '#FFF6EC',
      cardBg: '#FFFFFF',
      surface: '#FCE8D2',
      ink: '#4A1F14',
      mutedInk: '#9A6B58',
      primary: '#C8282E',
      accent: '#E8B04A',
      border: '#F0CFA8'
    }
  }
};

export const BLOCK_CATEGORIES = [
  { id: 'titles', name: '标题/艺术字' },
  { id: 'cards', name: '信笺卡片' },
  { id: 'photos', name: '单多图框' },
  { id: 'dividers', name: '分割留白' },
  { id: 'interactive', name: '动图/互动' }
];

function esc(value) {
  const raw = value && typeof value === 'object' && typeof value.plain === 'string' ? value.plain : value;
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escText(value) {
  if (value && typeof value === 'object' && typeof value.rich === 'string') {
    return value.rich;
  }
  return esc(value).replace(/\r?\n/g, '<br/>');
}

function resolveUrl(url, origin = '') {
  const s = String(url ?? '').trim();
  if (!s) return '';
  if (/^data:image\/(png|jpeg|gif|webp);base64,/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/') && origin) return `${origin.replace(/\/$/, '')}${s}`;
  return s;
}

function themeOf(styleOrPalette) {
  if (!styleOrPalette) return THEME_PRESETS['campus-paper'];
  if (typeof styleOrPalette === 'string') return THEME_PRESETS[styleOrPalette] || THEME_PRESETS['campus-paper'];
  if (styleOrPalette.palette) return styleOrPalette;
  return { ...THEME_PRESETS['campus-paper'], palette: { ...THEME_PRESETS['campus-paper'].palette, ...styleOrPalette } };
}

function edAttr(editor, prop) {
  return editor ? ` data-editable-prop="${esc(prop)}" contenteditable="true"` : '';
}

function imgAttr(editor, prop) {
  return editor ? ` data-image-prop="${esc(prop)}"` : '';
}

function wrapCard(innerHtml, p, extraStyle = '') {
  return `<section style="background:${p.cardBg};border:1px solid ${p.border};border-radius:10px;padding:18px 16px;margin:0 0 14px;box-sizing:border-box;${extraStyle}">${innerHtml}</section>`;
}

export const BLOCK_TEMPLATES = [
  // ================= 1. 标题与艺术字 (8) =================
  {
    id: 'title-cover-letter',
    category: 'titles',
    name: '信笺封面大标题',
    description: '细衬线+左竖线刊头+温润副标题',
    styles: ['campus-paper', 'retro-film', 'warm-honor'],
    defaultProps: { kicker: '时光手记 · 壹', heading: '把平凡的日子收好', subtitle: '那些留在照片与笔尖上的细碎光亮' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:1px solid ${p.border};border-radius:10px;padding:24px 20px;margin:0 0 14px;box-sizing:border-box;">
        <p style="margin:0 0 8px;color:${p.mutedInk};font-size:12px;letter-spacing:3px;"${edAttr(ed, 'kicker')}>${escText(pr.kicker)}</p>
        <section style="border-left:4px solid ${p.primary};padding:2px 0 2px 14px;margin:6px 0 12px;">
          <p style="margin:0;color:${p.ink};font-size:22px;font-weight:bold;line-height:1.45;letter-spacing:1px;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
        </section>
        <p style="margin:0;color:${p.mutedInk};font-size:13px;line-height:1.7;"${edAttr(ed, 'subtitle')}>${escText(pr.subtitle)}</p>
      </section>`;
    }
  },
  {
    id: 'title-vertical-bar',
    category: 'titles',
    name: '章节竖标序言标题',
    description: '数字标号胶囊 + 章节标题',
    styles: ['campus-paper', 'minimal-mag', 'fresh-teambuild'],
    defaultProps: { badge: '第 01 幕', heading: '阳光刚好落在窗台', note: '一次值得记住的并肩前行' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="padding:10px 4px 12px;margin:0 0 12px;box-sizing:border-box;">
        <section style="display:inline-block;background:${p.primary};color:#FFFFFF;font-size:12px;padding:3px 12px;border-radius:20px;letter-spacing:1px;margin-bottom:8px;"${edAttr(ed, 'badge')}>${escText(pr.badge)}</section>
        <p style="margin:0 0 4px;color:${p.ink};font-size:19px;font-weight:bold;line-height:1.4;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
        <p style="margin:0;color:${p.mutedInk};font-size:13px;line-height:1.6;"${edAttr(ed, 'note')}>${escText(pr.note)}</p>
      </section>`;
    }
  },
  {
    id: 'title-washi-ribbon',
    category: 'titles',
    name: '和纸胶带手账标题',
    description: '上方斜贴胶带矢量图+居中字块',
    styles: ['fresh-teambuild', 'campus-paper'],
    defaultProps: { tapeUrl: '/assets/open/tapes/tape-sakura-blush.svg', heading: '一起走过的周末漫记', tag: '温暖同行 · 手账碎片' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="margin:14px 0 16px;text-align:center;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.tapeUrl, o))}" style="width:128px;height:auto;display:block;margin:0 auto -12px;position:relative;z-index:2;" alt="和纸胶带"${imgAttr(ed, 'tapeUrl')}/>
        <section style="background:${p.cardBg};border:1.5px dashed ${p.primary};border-radius:10px;padding:22px 16px 16px;box-sizing:border-box;">
          <p style="margin:0 0 6px;color:${p.ink};font-size:19px;font-weight:bold;line-height:1.4;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
          <p style="margin:0;color:${p.accent};font-size:12px;letter-spacing:2px;"${edAttr(ed, 'tag')}>${escText(pr.tag)}</p>
        </section>
      </section>`;
    }
  },
  {
    id: 'title-neon-stage',
    category: 'titles',
    name: '舞台聚光灯牌标题',
    description: '撞色高反差斜切标签+大字横幅',
    styles: ['stage-heat', 'warm-honor'],
    defaultProps: { kicker: '高燃现场实录', heading: '当灯光全部亮起的那一刻', sub: '掌声与欢呼穿过整座礼堂' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="background:${p.surface};border-left:5px solid ${p.primary};border-right:5px solid ${p.accent};border-radius:8px;padding:18px 16px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
        <p style="margin:0 0 8px;display:inline-block;background:${p.primary};color:#FFFFFF;font-size:11px;padding:2px 10px;border-radius:4px;letter-spacing:2px;"${edAttr(ed, 'kicker')}>${escText(pr.kicker)}</p>
        <p style="margin:4px 0 6px;color:${p.ink};font-size:21px;font-weight:bold;line-height:1.35;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
        <p style="margin:0;color:${p.accent};font-size:13px;"${edAttr(ed, 'sub')}>${escText(pr.sub)}</p>
      </section>`;
    }
  },
  {
    id: 'title-stamp-chapter',
    category: 'titles',
    name: '红花印章圆环标题',
    description: '左侧圆环徽章+双色横线延展',
    styles: ['campus-paper', 'warm-honor', 'fresh-teambuild'],
    defaultProps: { iconUrl: '/assets/open/icons/badge-stamp-flower.svg', num: '零贰', heading: '用心打磨的每一处细节' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="display:flex;align-items:center;gap:12px;background:${p.surface};border:1px solid ${p.border};border-radius:10px;padding:12px 14px;margin:0 0 14px;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.iconUrl, o))}" style="width:42px;height:42px;flex-shrink:0;" alt="印章"${imgAttr(ed, 'iconUrl')}/>
        <section style="flex:1;min-width:0;">
          <p style="margin:0 0 2px;color:${p.accent};font-size:12px;font-weight:bold;letter-spacing:2px;"${edAttr(ed, 'num')}>${escText(pr.num)}</p>
          <p style="margin:0;color:${p.ink};font-size:17px;font-weight:bold;line-height:1.4;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
        </section>
      </section>`;
    }
  },
  {
    id: 'title-film-slate',
    category: 'titles',
    name: '胶片场记日期标题',
    description: '暗调底条+日期编号+纪实主标',
    styles: ['retro-film', 'minimal-mag'],
    defaultProps: { date: '二零二六 · 秋日卷', code: '记录编号 08', heading: '把快门留给真实的笑脸' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:1px solid ${p.border};border-radius:6px;overflow:hidden;margin:0 0 14px;box-sizing:border-box;">
        <section style="background:${p.surface};padding:6px 14px;border-bottom:1px dashed ${p.border};display:flex;justify-content:space-between;align-items:center;font-size:12px;color:${p.mutedInk};">
          <span${edAttr(ed, 'date')}>${escText(pr.date)}</span>
          <span${edAttr(ed, 'code')}>${escText(pr.code)}</span>
        </section>
        <section style="padding:14px 16px;">
          <p style="margin:0;color:${p.ink};font-size:19px;font-weight:bold;letter-spacing:1px;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
        </section>
      </section>`;
    }
  },
  {
    id: 'title-minimal-num',
    category: 'titles',
    name: '极简大编号刊头栏',
    description: '超大衬线编号+右侧精细双行',
    styles: ['minimal-mag', 'campus-paper'],
    defaultProps: { number: '01', heading: '活动核心流程与亮点回顾', sub: '清晰脉络 · 真实记录' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="display:flex;align-items:baseline;gap:14px;border-bottom:2px solid ${p.primary};padding:10px 4px;margin:0 0 14px;box-sizing:border-box;">
        <span style="font-size:34px;font-weight:bold;color:${p.accent};line-height:1;"${edAttr(ed, 'number')}>${escText(pr.number)}</span>
        <section style="flex:1;min-width:0;">
          <p style="margin:0 0 2px;color:${p.ink};font-size:18px;font-weight:bold;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
          <p style="margin:0;color:${p.mutedInk};font-size:12px;"${edAttr(ed, 'sub')}>${escText(pr.sub)}</p>
        </section>
      </section>`;
    }
  },
  {
    id: 'title-honor-arch',
    category: 'titles',
    name: '喜报丝带荣耀主标',
    description: '拱形红金双线饰边+桂冠奖杯标',
    styles: ['warm-honor', 'campus-paper'],
    defaultProps: { iconUrl: '/assets/open/icons/ico-trophy-honor.svg', kicker: '热烈祝贺 · 硕果盈枝', heading: '一份沉甸甸的收获与见证' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:2px solid ${p.primary};border-radius:16px 16px 8px 8px;padding:20px 16px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.iconUrl, o))}" style="width:40px;height:40px;display:inline-block;margin-bottom:6px;" alt="奖杯"${imgAttr(ed, 'iconUrl')}/>
        <p style="margin:0 0 6px;color:${p.accent};font-size:13px;font-weight:bold;letter-spacing:2px;"${edAttr(ed, 'kicker')}>${escText(pr.kicker)}</p>
        <p style="margin:0;color:${p.primary};font-size:21px;font-weight:bold;line-height:1.4;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
      </section>`;
    }
  },

  // ================= 2. 信笺与语录卡片 (8) =================
  {
    id: 'card-warm-letter',
    category: 'cards',
    name: '奶油信笺长文正文卡',
    description: '柔和边框+舒朗行距叙事卡',
    styles: ['campus-paper', 'retro-film', 'warm-honor'],
    defaultProps: { body: '阳光轻轻落在桌面，风把树叶吹出细碎的响声。我们把这段时间里值得记住的片段仔细折好，放进一封慢慢写就的信里。\n\n每一次讨论、每一次排练、每一次彼此搭把手的瞬间，都让普通的日子变得具体而温暖。' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return wrapCard(
        `<p style="margin:0;color:${p.ink};font-size:15px;line-height:1.95;letter-spacing:0.4px;"${edAttr(ed, 'body')}>${escText(pr.body)}</p>`,
        p
      );
    }
  },
  {
    id: 'card-folded-note',
    category: 'cards',
    name: '折角备忘便签卡',
    description: '顶部高亮色条+简明事项卡片',
    styles: ['fresh-teambuild', 'minimal-mag', 'campus-paper'],
    defaultProps: { heading: '行前准备与小贴士', body: '集合时间：周六上午九点整\n携带物品：饮用水、轻便外套与好心情\n特别提醒：请提前十五分钟到场签到' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:1px solid ${p.border};border-top:5px solid ${p.primary};border-radius:8px;padding:16px 16px 18px;margin:0 0 14px;box-sizing:border-box;">
        <p style="margin:0 0 10px;color:${p.primary};font-size:16px;font-weight:bold;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>
        <p style="margin:0;color:${p.ink};font-size:14px;line-height:1.85;"${edAttr(ed, 'body')}>${escText(pr.body)}</p>
      </section>`;
    }
  },
  {
    id: 'card-quote-callout',
    category: 'cards',
    name: '大引号同窗感言卡',
    description: '双色引号标+高光引语+感言署名',
    styles: ['campus-paper', 'retro-film', 'warm-honor', 'fresh-teambuild'],
    defaultProps: { iconUrl: '/assets/open/icons/badge-quote-mark.svg', quote: '真正让人怀念的从来不是结果本身，而是那一群并肩完成同一件事的人。', author: '—— 参与同学心声记录' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.surface};border-radius:12px;padding:18px 18px 16px;margin:0 0 14px;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.iconUrl, o))}" style="width:30px;height:30px;display:block;margin-bottom:8px;" alt="引号"${imgAttr(ed, 'iconUrl')}/>
        <p style="margin:0 0 10px;color:${p.ink};font-size:15px;line-height:1.85;font-weight:bold;"${edAttr(ed, 'quote')}>${escText(pr.quote)}</p>
        <p style="margin:0;color:${p.mutedInk};font-size:13px;text-align:right;"${edAttr(ed, 'author')}>${escText(pr.author)}</p>
      </section>`;
    }
  },
  {
    id: 'card-timeline-step',
    category: 'cards',
    name: '时光竖轴历程卡片',
    description: '圆点时间轴+三段递进节点',
    styles: ['minimal-mag', 'campus-paper', 'retro-film'],
    defaultProps: {
      step1Title: '筹备阶段 · 反复打磨方案',
      step1Desc: '从第一份草图到最终确定动线，大家一起推敲了三轮细节。',
      step2Title: '进行现场 · 默契协作落位',
      step2Desc: '分工明确、补位及时，每个角落都能看见忙碌却踏实的身影。',
      step3Title: '温暖收官 · 合影与复盘沉淀',
      step3Desc: '收好道具与回忆，把经验留给下一场更好的相遇。'
    },
    render(pr, t, _m, ed) {
      const p = t.palette;
      const rows = [
        ['step1Title', 'step1Desc'],
        ['step2Title', 'step2Desc'],
        ['step3Title', 'step3Desc']
      ].map(([tk, dk], idx) => `<section style="border-left:2px solid ${p.primary};padding:0 0 ${idx === 2 ? '0' : '14px'} 16px;margin-left:6px;position:relative;">
        <p style="margin:0 0 4px;color:${p.primary};font-size:14px;font-weight:bold;"${edAttr(ed, tk)}>${escText(pr[tk])}</p>
        <p style="margin:0;color:${p.ink};font-size:14px;line-height:1.75;"${edAttr(ed, dk)}>${escText(pr[dk])}</p>
      </section>`).join('');
      return wrapCard(rows, p);
    }
  },
  {
    id: 'card-checklist-tips',
    category: 'cards',
    name: '手账三连要点卡',
    description: '带色点编号的三栏精华要点',
    styles: ['fresh-teambuild', 'minimal-mag'],
    defaultProps: { heading: '活动三大看点', item1: '真挚分享：邀请一线经验参与者面对面交流故事', item2: '互动体验：现场设置留影墙与心愿明信片书写台', item3: '暖心伴手：定制手账贴纸包与留念书签限量派发' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      const items = ['item1', 'item2', 'item3'].map((k, idx) => `<section style="display:flex;align-items:flex-start;gap:10px;margin:${idx === 2 ? '0' : '0 0 10px'};">
        <span style="display:inline-block;min-width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;background:${p.accent};color:#FFFFFF;font-size:12px;font-weight:bold;">${idx + 1}</span>
        <p style="margin:0;flex:1;color:${p.ink};font-size:14px;line-height:1.7;"${edAttr(ed, k)}>${escText(pr[k])}</p>
      </section>`).join('');
      return wrapCard(`<p style="margin:0 0 12px;color:${p.ink};font-size:16px;font-weight:bold;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>${items}`, p);
    }
  },
  {
    id: 'card-torn-notebook',
    category: 'cards',
    name: '手账圆环装订手记卡',
    description: '左侧装订色环+温暖手账正文',
    styles: ['fresh-teambuild', 'campus-paper'],
    defaultProps: { tag: '今日手账小记', body: '原本以为只是一场普通的相聚，直到结束清点器材时才发现，手机相册里已经悄悄多出了一百多张笑着的照片。' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:1.5px solid ${p.border};border-left:10px dotted ${p.primary};border-radius:8px;padding:18px 16px;margin:0 0 14px;box-sizing:border-box;">
        <p style="margin:0 0 8px;color:${p.accent};font-size:13px;font-weight:bold;"${edAttr(ed, 'tag')}>${escText(pr.tag)}</p>
        <p style="margin:0;color:${p.ink};font-size:15px;line-height:1.9;"${edAttr(ed, 'body')}>${escText(pr.body)}</p>
      </section>`;
    }
  },
  {
    id: 'card-stage-program',
    category: 'cards',
    name: '舞台灯牌节目单卡',
    description: '双色节目单列表+暗夜高亮质感',
    styles: ['stage-heat', 'retro-film'],
    defaultProps: { heading: '当晚精彩瞬间清单', line1: '第一篇章 · 开场灯光与合唱合奏', line2: '第二篇章 · 情景短剧与原创朗诵', line3: '第三篇章 · 全场星海齐唱与合影落幕' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      const lines = ['line1', 'line2', 'line3'].map(k => `<section style="background:${p.surface};border-left:3px solid ${p.accent};padding:9px 12px;border-radius:6px;margin-bottom:8px;">
        <p style="margin:0;color:${p.ink};font-size:14px;line-height:1.6;"${edAttr(ed, k)}>${escText(pr[k])}</p>
      </section>`).join('');
      return wrapCard(`<p style="margin:0 0 12px;color:${p.primary};font-size:16px;font-weight:bold;letter-spacing:1px;"${edAttr(ed, 'heading')}>${escText(pr.heading)}</p>${lines}`, p);
    }
  },
  {
    id: 'card-honor-cite',
    category: 'cards',
    name: '红金双线致敬正文卡',
    description: '双层庄重内边框+结尾祝福寄语',
    styles: ['warm-honor', 'campus-paper'],
    defaultProps: { body: '每一份成绩的背后，都是数不清的清晨与夜晚。愿这份诚意与热爱继续伴随大家，奔赴下一场山海，收获更多温柔而坚定的光芒。', closing: '山高水长，未来可期' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:2px solid ${p.primary};border-radius:10px;padding:6px;margin:0 0 14px;box-sizing:border-box;">
        <section style="border:1px dashed ${p.accent};border-radius:6px;padding:18px 16px;">
          <p style="margin:0 0 12px;color:${p.ink};font-size:15px;line-height:1.9;"${edAttr(ed, 'body')}>${escText(pr.body)}</p>
          <p style="margin:0;color:${p.primary};font-size:14px;font-weight:bold;text-align:center;letter-spacing:2px;"${edAttr(ed, 'closing')}>${escText(pr.closing)}</p>
        </section>
      </section>`;
    }
  },

  // ================= 3. 单图/双图/三图/拍立得相框 (6) =================
  {
    id: 'photo-polaroid-single',
    category: 'photos',
    name: '胶带拍立得单图框',
    description: '顶部和纸胶带+拍立得白边+点击换本地照',
    styles: ['campus-paper', 'fresh-teambuild', 'retro-film'],
    defaultProps: { tapeUrl: '/assets/open/tapes/tape-butter-grid.svg', imageUrl: VERIFIED_PHOTOS.nature0, caption: '镜头定格的温和日光（点击照片可上传本地实拍）' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="margin:12px 0 16px;text-align:center;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.tapeUrl, o))}" style="width:110px;height:auto;display:block;margin:0 auto -12px;position:relative;z-index:2;" alt="胶带"${imgAttr(ed, 'tapeUrl')}/>
        <section style="background:#FFFFFF;border:1px solid ${p.border};border-radius:6px;padding:12px 12px 18px;box-shadow:0 6px 18px rgba(0,0,0,0.06);">
          <img src="${esc(resolveUrl(pr.imageUrl, o))}" style="width:100%;height:auto;display:block;border-radius:3px;" alt="现场实拍"${imgAttr(ed, 'imageUrl')}/>
          <p style="margin:12px 0 0;color:#5A534A;font-size:13px;line-height:1.6;"${edAttr(ed, 'caption')}>${escText(pr.caption)}</p>
        </section>
      </section>`;
    }
  },
  {
    id: 'photo-film-strip',
    category: 'photos',
    name: '胶片齿孔双拼图框',
    description: '复古黑底+上下白色齿孔+左右双图对比',
    styles: ['retro-film', 'stage-heat', 'campus-paper'],
    defaultProps: { leftUrl: VERIFIED_PHOTOS.stage0, rightUrl: VERIFIED_PHOTOS.stage1, caption: '舞台明暗流转的两个瞬间 · 点击任意图替换' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      const dots = Array.from({ length: 12 }, () => '<span style="display:inline-block;width:12px;height:7px;border-radius:2px;background:#EFE4D2;opacity:0.85;"></span>').join('');
      return `<section style="background:#26211D;border-radius:8px;padding:8px 10px;margin:0 0 14px;box-sizing:border-box;">
        <section style="display:flex;justify-content:space-between;padding:2px 4px 8px;">${dots}</section>
        <section style="display:flex;gap:8px;">
          <section style="flex:1;min-width:0;"><img src="${esc(resolveUrl(pr.leftUrl, o))}" style="width:100%;height:150px;object-fit:cover;display:block;border-radius:3px;" alt="左图"${imgAttr(ed, 'leftUrl')}/></section>
          <section style="flex:1;min-width:0;"><img src="${esc(resolveUrl(pr.rightUrl, o))}" style="width:100%;height:150px;object-fit:cover;display:block;border-radius:3px;" alt="右图"${imgAttr(ed, 'rightUrl')}/></section>
        </section>
        <section style="display:flex;justify-content:space-between;padding:8px 4px 2px;">${dots}</section>
        <p style="margin:4px 0 2px;color:#EFE4D2;font-size:12px;text-align:center;"${edAttr(ed, 'caption')}>${escText(pr.caption)}</p>
      </section>`;
    }
  },
  {
    id: 'photo-triptych-grid',
    category: 'photos',
    name: '三图纪实拼图画框',
    description: '主图居中+下方双图并排+纪实注脚',
    styles: ['fresh-teambuild', 'minimal-mag', 'campus-paper'],
    defaultProps: { topUrl: VERIFIED_PHOTOS.nature1, leftUrl: VERIFIED_PHOTOS.nature2, rightUrl: VERIFIED_PHOTOS.nebula, caption: '从日出到星落，三格定格同一份同行心情' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return wrapCard(
        `<img src="${esc(resolveUrl(pr.topUrl, o))}" style="width:100%;height:auto;display:block;border-radius:6px;margin-bottom:8px;" alt="主图"${imgAttr(ed, 'topUrl')}/>
        <section style="display:flex;gap:8px;">
          <section style="flex:1;min-width:0;"><img src="${esc(resolveUrl(pr.leftUrl, o))}" style="width:100%;height:125px;object-fit:cover;display:block;border-radius:6px;" alt="左图"${imgAttr(ed, 'leftUrl')}/></section>
          <section style="flex:1;min-width:0;"><img src="${esc(resolveUrl(pr.rightUrl, o))}" style="width:100%;height:125px;object-fit:cover;display:block;border-radius:6px;" alt="右图"${imgAttr(ed, 'rightUrl')}/></section>
        </section>
        <p style="margin:10px 0 0;color:${p.mutedInk};font-size:12px;text-align:center;"${edAttr(ed, 'caption')}>${escText(pr.caption)}</p>`,
        p,
        'padding:12px;'
      );
    }
  },
  {
    id: 'photo-postcard-stamp',
    category: 'photos',
    name: '明信片双栏图文卡',
    description: '左侧插图照片+右侧寄语邮戳小标',
    styles: ['campus-paper', 'warm-honor', 'fresh-teambuild'],
    defaultProps: { imageUrl: VERIFIED_PHOTOS.nature0, stampUrl: '/assets/open/icons/badge-envelope-seal.svg', title: '寄往下一站的明信片', note: '谢谢那天忙前忙后的每一位伙伴，照片里的微笑是最好的证明。' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:1.5px dashed ${p.primary};border-radius:10px;padding:12px;margin:0 0 14px;display:flex;gap:12px;align-items:center;box-sizing:border-box;">
        <section style="width:46%;flex-shrink:0;"><img src="${esc(resolveUrl(pr.imageUrl, o))}" style="width:100%;height:130px;object-fit:cover;border-radius:6px;display:block;" alt="明信片配图"${imgAttr(ed, 'imageUrl')}/></section>
        <section style="flex:1;min-width:0;">
          <section style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="color:${p.primary};font-size:14px;font-weight:bold;"${edAttr(ed, 'title')}>${escText(pr.title)}</span>
            <img src="${esc(resolveUrl(pr.stampUrl, o))}" style="width:28px;height:28px;" alt="邮戳"${imgAttr(ed, 'stampUrl')}/>
          </section>
          <p style="margin:0;color:${p.ink};font-size:13px;line-height:1.7;"${edAttr(ed, 'note')}>${escText(pr.note)}</p>
        </section>
      </section>`;
    }
  },
  {
    id: 'photo-arch-window',
    category: 'photos',
    name: '拱门橱窗海报大图',
    description: '圆拱上缘裁剪主视觉+底部衬线落款',
    styles: ['campus-paper', 'warm-honor', 'stage-heat'],
    defaultProps: { imageUrl: VERIFIED_PHOTOS.stage2, title: '夜幕之下 · 光影交汇处', caption: '温柔的晚风吹过操场与阶梯' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:1.5px solid ${p.primary};border-radius:160px 160px 10px 10px;padding:12px 12px 16px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.imageUrl, o))}" style="width:100%;height:220px;object-fit:cover;border-radius:150px 150px 6px 6px;display:block;" alt="拱门封面图"${imgAttr(ed, 'imageUrl')}/>
        <p style="margin:12px 0 4px;color:${p.ink};font-size:16px;font-weight:bold;"${edAttr(ed, 'title')}>${escText(pr.title)}</p>
        <p style="margin:0;color:${p.mutedInk};font-size:12px;"${edAttr(ed, 'caption')}>${escText(pr.caption)}</p>
      </section>`;
    }
  },
  {
    id: 'photo-gallery-mat',
    category: 'photos',
    name: '美术馆卡纸留白画框',
    description: '宽松画廊卡纸内衬+极简右对齐注脚',
    styles: ['minimal-mag', 'campus-paper'],
    defaultProps: { imageUrl: VERIFIED_PHOTOS.nature2, caption: '图注 · 安静留白比浓墨重彩更耐看' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.surface};border:2px solid ${p.ink};padding:18px;margin:0 0 14px;box-sizing:border-box;">
        <section style="background:#FFFFFF;padding:10px;border:1px solid ${p.border};">
          <img src="${esc(resolveUrl(pr.imageUrl, o))}" style="width:100%;height:auto;display:block;" alt="画廊框图"${imgAttr(ed, 'imageUrl')}/>
        </section>
        <p style="margin:10px 0 0;color:${p.mutedInk};font-size:12px;text-align:right;"${edAttr(ed, 'caption')}>${escText(pr.caption)}</p>
      </section>`;
    }
  },

  // ================= 4. 分割线与留白 (6) =================
  {
    id: 'div-botanical-line',
    category: 'dividers',
    name: '橄榄枝叶手绘分割线',
    description: '两侧细线+居中森系双色叶片标',
    styles: ['campus-paper', 'fresh-teambuild', 'warm-honor'],
    defaultProps: { iconUrl: '/assets/open/icons/ico-laurel-leaf.svg' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="display:flex;align-items:center;gap:10px;padding:12px 16px;margin:0 0 10px;box-sizing:border-box;">
        <section style="flex:1;height:1px;border-top:1px dashed ${p.border};"></section>
        <img src="${esc(resolveUrl(pr.iconUrl, o))}" style="width:28px;height:28px;display:block;" alt="枝叶分隔"${imgAttr(ed, 'iconUrl')}/>
        <section style="flex:1;height:1px;border-top:1px dashed ${p.border};"></section>
      </section>`;
    }
  },
  {
    id: 'div-film-perforation',
    category: 'dividers',
    name: '胶片齿孔节奏分隔带',
    description: '水平虚线胶片帧隔断',
    styles: ['retro-film', 'stage-heat'],
    defaultProps: { label: '下一幕 · 精彩继续' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="text-align:center;padding:10px 8px;margin:0 0 12px;border-top:2px dashed ${p.border};border-bottom:2px dashed ${p.border};box-sizing:border-box;">
        <p style="margin:0;color:${p.mutedInk};font-size:12px;letter-spacing:3px;"${edAttr(ed, 'label')}>${escText(pr.label)}</p>
      </section>`;
    }
  },
  {
    id: 'div-star-trail',
    category: 'dividers',
    name: '星芒闪烁分隔条',
    description: '中心双色闪耀星芒+细实线',
    styles: ['campus-paper', 'stage-heat', 'warm-honor'],
    defaultProps: { iconUrl: '/assets/open/icons/ico-sparkle-star.svg' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="display:flex;align-items:center;gap:12px;padding:10px 24px;margin:0 0 10px;box-sizing:border-box;">
        <section style="flex:1;height:1px;background:${p.primary};opacity:0.35;"></section>
        <img src="${esc(resolveUrl(pr.iconUrl, o))}" style="width:24px;height:24px;display:block;" alt="星芒"${imgAttr(ed, 'iconUrl')}/>
        <section style="flex:1;height:1px;background:${p.primary};opacity:0.35;"></section>
      </section>`;
    }
  },
  {
    id: 'div-wave-dot',
    category: 'dividers',
    name: '三点呼吸节奏分隔',
    description: '三枚色彩圆点构成轻盈段落呼吸感',
    styles: ['fresh-teambuild', 'minimal-mag', 'campus-paper'],
    defaultProps: { note: '' },
    render(_pr, t) {
      const p = t.palette;
      return `<section style="text-align:center;padding:14px 0;margin:0 0 10px;box-sizing:border-box;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${p.primary};margin:0 6px;"></span>
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.accent};margin:0 6px;"></span>
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${p.primary};margin:0 6px;"></span>
      </section>`;
    }
  },
  {
    id: 'div-tape-tear',
    category: 'dividers',
    name: '波浪胶带过渡条',
    description: '手账和纸胶带装饰段落转场',
    styles: ['fresh-teambuild', 'campus-paper', 'warm-honor'],
    defaultProps: { tapeUrl: '/assets/open/tapes/tape-sage-leaf.svg' },
    render(pr, _t, _m, ed, o) {
      return `<section style="text-align:center;padding:8px 0 12px;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.tapeUrl, o))}" style="width:160px;height:auto;display:inline-block;" alt="胶带转场"${imgAttr(ed, 'tapeUrl')}/>
      </section>`;
    }
  },
  {
    id: 'div-minimal-air',
    category: 'dividers',
    name: '杂志极简留白横线',
    description: '宽松上下留白+中心短线',
    styles: ['minimal-mag', 'retro-film'],
    defaultProps: { tailText: '诚挚记录每一个当下' },
    render(pr, t, _m, ed) {
      const p = t.palette;
      return `<section style="padding:18px 0;text-align:center;box-sizing:border-box;">
        <section style="width:42px;height:2px;background:${p.primary};margin:0 auto 10px;"></section>
        <p style="margin:0;color:${p.mutedInk};font-size:12px;letter-spacing:2px;"${edAttr(ed, 'tailText')}>${escText(pr.tailText)}</p>
      </section>`;
    }
  },

  // ================= 5. 动态GIF与微信原生互动SVG (8) =================
  {
    id: 'gif-sparkle-header',
    category: 'interactive',
    name: '星芒微动导语条（GIF）',
    description: '两侧透明闪烁星芒动图+高亮金句条',
    styles: ['campus-paper', 'stage-heat', 'fresh-teambuild', 'warm-honor'],
    defaultProps: { gifUrl: '/assets/open/gifs/sparkle-twinkle.gif', text: '重点高亮时刻 · 值得再次回看' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.surface};border:1px solid ${p.border};border-radius:10px;padding:10px 14px;margin:0 0 14px;display:flex;align-items:center;justify-content:center;gap:10px;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.gifUrl, o))}" style="width:32px;height:32px;display:block;flex-shrink:0;" alt="星芒动图"${imgAttr(ed, 'gifUrl')}/>
        <p style="margin:0;color:${p.ink};font-size:14px;font-weight:bold;text-align:center;"${edAttr(ed, 'text')}>${escText(pr.text)}</p>
        <img src="${esc(resolveUrl(pr.gifUrl, o))}" style="width:32px;height:32px;display:block;flex-shrink:0;" alt="星芒动图"${imgAttr(ed, 'gifUrl')}/>
      </section>`;
    }
  },
  {
    id: 'gif-bounce-guide',
    category: 'interactive',
    name: '弹跳箭头导读条（GIF）',
    description: '透明珊瑚弹跳箭头动图提示继续阅读',
    styles: ['fresh-teambuild', 'warm-honor', 'stage-heat', 'minimal-mag'],
    defaultProps: { gifUrl: '/assets/open/gifs/arrow-bounce.gif', text: '精彩图文在下方，继续往下翻阅' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:1px dashed ${p.primary};border-radius:30px;padding:8px 16px;margin:0 0 14px;display:flex;align-items:center;justify-content:center;gap:10px;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.gifUrl, o))}" style="width:38px;height:28px;display:block;" alt="引导箭头"${imgAttr(ed, 'gifUrl')}/>
        <p style="margin:0;color:${p.primary};font-size:13px;font-weight:bold;"${edAttr(ed, 'text')}>${escText(pr.text)}</p>
      </section>`;
    }
  },
  {
    id: 'gif-confetti-banner',
    category: 'interactive',
    name: '庆典礼花喝彩条（GIF）',
    description: '喜报彩屑绽放动图横幅+高光致谢',
    styles: ['warm-honor', 'stage-heat', 'fresh-teambuild'],
    defaultProps: { gifUrl: '/assets/open/gifs/confetti-burst.gif', title: '热烈祝贺！圆满收官', note: '为每一位认真付出的伙伴鼓掌' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.surface};border:1.5px solid ${p.accent};border-radius:12px;padding:12px 16px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.gifUrl, o))}" style="width:76px;height:50px;display:inline-block;" alt="礼花动图"${imgAttr(ed, 'gifUrl')}/>
        <p style="margin:4px 0 2px;color:${p.primary};font-size:17px;font-weight:bold;"${edAttr(ed, 'title')}>${escText(pr.title)}</p>
        <p style="margin:0;color:${p.mutedInk};font-size:13px;"${edAttr(ed, 'note')}>${escText(pr.note)}</p>
      </section>`;
    }
  },
  {
    id: 'gif-eq-musicbar',
    category: 'interactive',
    name: '舞台音浪伴读卡（GIF）',
    description: '动态音浪均衡器+推荐伴读旋律标题',
    styles: ['stage-heat', 'retro-film', 'campus-paper'],
    defaultProps: { gifUrl: '/assets/open/gifs/music-eq.gif', song: '现场氛围感旋律 · 轻声单曲循环中', hint: '配合文字慢慢读完这一段故事' },
    render(pr, t, _m, ed, o) {
      const p = t.palette;
      return `<section style="background:${p.cardBg};border:1px solid ${p.border};border-radius:12px;padding:12px 14px;margin:0 0 14px;display:flex;align-items:center;gap:12px;box-sizing:border-box;">
        <img src="${esc(resolveUrl(pr.gifUrl, o))}" style="width:48px;height:36px;display:block;flex-shrink:0;" alt="音浪动图"${imgAttr(ed, 'gifUrl')}/>
        <section style="flex:1;min-width:0;">
          <p style="margin:0 0 3px;color:${p.ink};font-size:14px;font-weight:bold;"${edAttr(ed, 'song')}>${escText(pr.song)}</p>
          <p style="margin:0;color:${p.mutedInk};font-size:12px;"${edAttr(ed, 'hint')}>${escText(pr.hint)}</p>
        </section>
      </section>`;
    }
  },

  // ---- 4 个微信原生零JS <svg> 互动组件（xiumi 模式自动无损降级为静态/GIF卡片）----
  {
    id: 'svg-envelope-reveal',
    category: 'interactive',
    name: '【微信互动】点击拆开信封',
    description: '零JS纯SMIL SVG：在微信里点击信封自动抽出一封暖心信笺；导出秀米自动降级为信封徽章卡',
    styles: ['campus-paper', 'warm-honor', 'fresh-teambuild'],
    isInteractiveSvg: true,
    defaultProps: {
      prompt: '轻触点击下方信封 · 拆开一份特别留言',
      letterTitle: '见字如面 · 展信舒颜',
      letterBody: '感谢这段并肩同行的时间，愿每一份真诚都被好好珍藏。'
    },
    render(pr, t, mode, ed, o) {
      const p = t.palette;
      if (mode === 'xiumi') {
        return `<section style="background:${p.cardBg};border:1.5px dashed ${p.primary};border-radius:12px;padding:16px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
          <img src="${esc(resolveUrl('/assets/open/icons/badge-envelope-seal.svg', o))}" style="width:44px;height:44px;display:inline-block;margin-bottom:6px;" alt="信封徽章"/>
          <p style="margin:0 0 6px;color:${p.primary};font-size:15px;font-weight:bold;"${edAttr(ed, 'letterTitle')}>${escText(pr.letterTitle)}</p>
          <p style="margin:0;color:${p.ink};font-size:14px;line-height:1.8;"${edAttr(ed, 'letterBody')}>${escText(pr.letterBody)}</p>
        </section>`;
      }
      return `<section style="background:${p.cardBg};border:1px solid ${p.border};border-radius:12px;padding:14px 12px 16px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
        <p style="margin:0 0 8px;color:${p.mutedInk};font-size:12px;letter-spacing:1px;"${edAttr(ed, 'prompt')}>${escText(pr.prompt)}</p>
        <svg viewBox="0 0 340 215" width="100%" style="max-width:340px;display:block;margin:0 auto;cursor:pointer;" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="72" width="300" height="132" rx="10" fill="${p.surface}" stroke="${p.border}" stroke-width="1.5"/>
          <g transform="translate(0,0)">
            <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -54" dur="0.7s" begin="click" fill="freeze"/>
            <rect x="34" y="82" width="272" height="106" rx="8" fill="#FFFDF9" stroke="${p.primary}" stroke-width="1.5"/>
            <text x="170" y="108" text-anchor="middle" font-size="14" font-weight="bold" fill="${p.primary}">${esc(pr.letterTitle)}</text>
            <text x="170" y="132" text-anchor="middle" font-size="12" fill="#3A3530">${esc(String(pr.letterBody || '').slice(0, 18))}</text>
            <text x="170" y="152" text-anchor="middle" font-size="12" fill="#3A3530">${esc(String(pr.letterBody || '').slice(18, 36))}</text>
          </g>
          <polygon points="20,76 170,152 320,76 320,204 20,204" fill="${p.cardBg}" stroke="${p.border}" stroke-width="1.5"/>
          <polygon points="20,76 170,148 320,76" fill="none" stroke="${p.primary}" stroke-width="1.5"/>
          <circle cx="170" cy="146" r="18" fill="${p.primary}">
            <animate attributeName="opacity" from="1" to="0.25" dur="0.4s" begin="click" fill="freeze"/>
          </circle>
          <text x="170" y="150" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFFFFF">拆</text>
        </svg>
        <p style="margin:8px 0 0;color:${p.primary};font-size:13px;font-weight:bold;"${edAttr(ed, 'letterTitle')}>${escText(pr.letterTitle)}</p>
        <p style="margin:4px 0 0;color:${p.mutedInk};font-size:12px;"${edAttr(ed, 'letterBody')}>${escText(pr.letterBody)}</p>
      </section>`;
    }
  },
  {
    id: 'svg-swipe-gallery',
    category: 'interactive',
    name: '【微信互动】点击切换三幕剧照',
    description: '零JS纯SMIL SVG画廊：点击一次顺滑切入下一幕定格文案；导出秀米自动降级为精选图框',
    styles: ['retro-film', 'stage-heat', 'campus-paper'],
    isInteractiveSvg: true,
    defaultProps: {
      guideText: '点击画面切换定格瞬间 · 共三幕记忆',
      slide1: '第一幕 · 准备就绪的清晨',
      slide2: '第二幕 · 灯光亮起时的合唱',
      slide3: '第三幕 · 并肩散场时的晚风',
      fallbackUrl: VERIFIED_PHOTOS.stage0
    },
    render(pr, t, mode, ed, o) {
      const p = t.palette;
      if (mode === 'xiumi') {
        return wrapCard(
          `<img src="${esc(resolveUrl(pr.fallbackUrl || VERIFIED_PHOTOS.stage0, o))}" style="width:100%;height:auto;border-radius:6px;display:block;" alt="定格剧照"${imgAttr(ed, 'fallbackUrl')}/>
          <p style="margin:10px 0 0;color:${p.ink};font-size:13px;text-align:center;"${edAttr(ed, 'slide1')}>${escText(pr.slide1)} · ${escText(pr.slide2)}</p>`,
          p,
          'padding:12px;'
        );
      }
      return `<section style="background:${p.cardBg};border:1px solid ${p.border};border-radius:12px;padding:14px 12px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
        <section style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">
          <img src="${esc(resolveUrl('/assets/open/gifs/scroll-hint.gif', o))}" style="width:38px;height:24px;display:block;" alt="切换提示"/>
          <p style="margin:0;color:${p.mutedInk};font-size:12px;"${edAttr(ed, 'guideText')}>${escText(pr.guideText)}</p>
        </section>
        <svg viewBox="0 0 340 155" width="100%" style="max-width:340px;display:block;margin:0 auto;border-radius:8px;overflow:hidden;cursor:pointer;" xmlns="http://www.w3.org/2000/svg">
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;-340 0;-680 0;0 0" keyTimes="0;0.33;0.66;1" dur="1.8s" begin="click" fill="freeze"/>
            <rect x="0" y="0" width="340" height="155" rx="8" fill="${p.surface}"/>
            <rect x="14" y="14" width="312" height="127" rx="6" fill="${p.cardBg}" stroke="${p.primary}" stroke-width="1.5"/>
            <text x="170" y="70" text-anchor="middle" font-size="16" font-weight="bold" fill="${p.primary}">${esc(pr.slide1)}</text>
            <text x="170" y="102" text-anchor="middle" font-size="12" fill="${p.mutedInk}">点击画面切换下一幕</text>

            <rect x="340" y="0" width="340" height="155" rx="8" fill="${p.surface}"/>
            <rect x="354" y="14" width="312" height="127" rx="6" fill="${p.cardBg}" stroke="${p.accent}" stroke-width="1.5"/>
            <text x="510" y="70" text-anchor="middle" font-size="16" font-weight="bold" fill="${p.accent}">${esc(pr.slide2)}</text>
            <text x="510" y="102" text-anchor="middle" font-size="12" fill="${p.mutedInk}">连续点击可继续浏览</text>

            <rect x="680" y="0" width="340" height="155" rx="8" fill="${p.surface}"/>
            <rect x="694" y="14" width="312" height="127" rx="6" fill="${p.cardBg}" stroke="${p.primary}" stroke-width="1.5"/>
            <text x="850" y="70" text-anchor="middle" font-size="16" font-weight="bold" fill="${p.ink}">${esc(pr.slide3)}</text>
            <text x="850" y="102" text-anchor="middle" font-size="12" fill="${p.mutedInk}">美好瞬间未完待续</text>
          </g>
        </svg>
        <p style="margin:8px 0 0;color:${p.ink};font-size:13px;"${edAttr(ed, 'slide1')}>${escText(pr.slide1)}</p>
      </section>`;
    }
  },
  {
    id: 'svg-starlight-pulse',
    category: 'interactive',
    name: '【微信互动】呼吸星光幕布',
    description: '零JS循环SMIL星光闪烁幕布卡片；导出秀米自动降级为星芒动图卡片',
    styles: ['stage-heat', 'retro-film', 'campus-paper'],
    isInteractiveSvg: true,
    defaultProps: {
      headline: '星光落入眼底的那一刻',
      subline: '有些闪光，一抬头就能看见'
    },
    render(pr, t, mode, ed, o) {
      const p = t.palette;
      if (mode === 'xiumi') {
        return `<section style="background:#1A152B;border:1px solid ${p.accent};border-radius:12px;padding:18px 16px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
          <img src="${esc(resolveUrl('/assets/open/gifs/sparkle-twinkle.gif', o))}" style="width:44px;height:44px;display:inline-block;margin-bottom:6px;" alt="星光动图"/>
          <p style="margin:0 0 4px;color:#FFD23F;font-size:16px;font-weight:bold;"${edAttr(ed, 'headline')}>${escText(pr.headline)}</p>
          <p style="margin:0;color:#EAE3FA;font-size:13px;"${edAttr(ed, 'subline')}>${escText(pr.subline)}</p>
        </section>`;
      }
      return `<section style="background:#181326;border:1px solid ${p.border};border-radius:12px;padding:10px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
        <svg viewBox="0 0 340 150" width="100%" style="max-width:340px;display:block;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="340" height="150" rx="8" fill="#181326"/>
          <circle cx="44" cy="34" r="3" fill="#FFD23F"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite"/></circle>
          <circle cx="96" cy="24" r="2.2" fill="#FFFFFF"><animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.8s" repeatCount="indefinite"/></circle>
          <circle cx="248" cy="30" r="3.2" fill="#FF3D7F"><animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite"/></circle>
          <circle cx="296" cy="48" r="2.5" fill="#FFD23F"><animate attributeName="opacity" values="1;0.25;1" dur="2.0s" repeatCount="indefinite"/></circle>
          <circle cx="66" cy="118" r="2.4" fill="#B8AEDB"><animate attributeName="opacity" values="0.2;0.95;0.2" dur="2.6s" repeatCount="indefinite"/></circle>
          <circle cx="282" cy="116" r="2.8" fill="#FFFFFF"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.9s" repeatCount="indefinite"/></circle>
          <path d="M170 24 L173 34 L183 37 L173 40 L170 50 L167 40 L157 37 L167 34 Z" fill="#FFD23F">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite"/>
          </path>
          <text x="170" y="84" text-anchor="middle" font-size="16" font-weight="bold" fill="#FFD23F">${esc(pr.headline)}</text>
          <text x="170" y="112" text-anchor="middle" font-size="13" fill="#EAE3FA">${esc(pr.subline)}</text>
        </svg>
        <p style="margin:6px 0 0;color:#EAE3FA;font-size:12px;"${edAttr(ed, 'headline')}>${escText(pr.headline)}</p>
      </section>`;
    }
  },
  {
    id: 'svg-starlight-sea',
    category: 'interactive',
    name: '【微信互动】点击点亮星海',
    description: '零JS交互亮灯：轻触屏幕点亮整片金色灯海与隐藏祝福；导出秀米自动降级为静态星愿卡',
    styles: ['stage-heat', 'warm-honor', 'campus-paper'],
    isInteractiveSvg: true,
    defaultProps: {
      tapHint: '点击下方星空 · 点亮这一片星海',
      blessing: '愿每一步坚持都有回响，下一站继续发光'
    },
    render(pr, t, mode, ed, o) {
      const p = t.palette;
      if (mode === 'xiumi') {
        return `<section style="background:${p.surface};border:1.5px solid ${p.accent};border-radius:12px;padding:16px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
          <img src="${esc(resolveUrl('/assets/open/icons/badge-moon-star.svg', o))}" style="width:38px;height:38px;display:inline-block;margin-bottom:6px;" alt="星月徽章"/>
          <p style="margin:0;color:${p.ink};font-size:15px;font-weight:bold;"${edAttr(ed, 'blessing')}>${escText(pr.blessing)}</p>
        </section>`;
      }
      return `<section style="background:${p.cardBg};border:1px solid ${p.border};border-radius:12px;padding:12px;margin:0 0 14px;text-align:center;box-sizing:border-box;">
        <p style="margin:0 0 8px;color:${p.mutedInk};font-size:12px;"${edAttr(ed, 'tapHint')}>${escText(pr.tapHint)}</p>
        <svg viewBox="0 0 340 165" width="100%" style="max-width:340px;display:block;margin:0 auto;cursor:pointer;" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="340" height="165" rx="10" fill="#1C182B"/>
          <g opacity="0.22">
            <animate attributeName="opacity" from="0.22" to="1" dur="0.7s" begin="click" fill="freeze"/>
            <circle cx="38" cy="40" r="4" fill="#FFD23F"/>
            <circle cx="84" cy="64" r="5" fill="#FF9E64"/>
            <circle cx="130" cy="36" r="4.5" fill="#FFD23F"/>
            <circle cx="212" cy="38" r="5" fill="#FFD23F"/>
            <circle cx="260" cy="62" r="4.5" fill="#FF6B8B"/>
            <circle cx="302" cy="42" r="4" fill="#FFD23F"/>
            <circle cx="64" cy="126" r="4.5" fill="#FFD23F"/>
            <circle cx="116" cy="134" r="3.5" fill="#FFFFFF"/>
            <circle cx="228" cy="132" r="4" fill="#FFFFFF"/>
            <circle cx="278" cy="126" r="4.5" fill="#FFD23F"/>
            <text x="170" y="92" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFD23F">${esc(pr.blessing)}</text>
          </g>
          <text x="170" y="150" text-anchor="middle" font-size="11" fill="#B8AEDB">轻触点亮星海</text>
        </svg>
        <p style="margin:6px 0 0;color:${p.ink};font-size:13px;"${edAttr(ed, 'blessing')}>${escText(pr.blessing)}</p>
      </section>`;
    }
  }
];

export function renderBlockHtml(block, styleOrPalette, options = {}) {
  const mode = options.mode === 'xiumi' ? 'xiumi' : 'wechat';
  const editor = Boolean(options.editor);
  const origin = options.origin || '';
  const t = themeOf(styleOrPalette);
  const p = t.palette;

  let inner = '';
  if (block?.templateId === 'raw-xiumi-section' && block.props?.html) {
    inner = String(block.props.html);
    if (mode === 'xiumi') {
      inner = inner.replace(/<svg[\s\S]*?<\/svg>/gi, '<section style="padding:10px;text-align:center;color:#888888;font-size:12px;">已转为秀米静态兼容区块</section>');
    }
    if (!/^<section\b/i.test(inner.trim())) inner = `<section style="margin:0 0 12px;">${inner}</section>`;
  } else if (block?.templateId === 'sticker-badge-block') {
    const stickerUrl = resolveUrl(block.props?.url || '/assets/open/icons/ico-sparkle-star.svg', origin);
    const note = block.props?.caption || '';
    inner = `<section style="text-align:center;padding:8px 0 12px;box-sizing:border-box;">
      <img src="${esc(stickerUrl)}" style="width:${Number(block.props?.size || 96)}px;max-width:100%;height:auto;display:inline-block;" alt="装饰贴纸"${imgAttr(editor, 'url')}/>
      ${note ? `<p style="margin:6px 0 0;color:${p.mutedInk};font-size:12px;"${edAttr(editor, 'caption')}>${escText(note)}</p>` : ''}
    </section>`;
  } else {
    const tpl = BLOCK_TEMPLATES.find(x => x.id === block?.templateId) || BLOCK_TEMPLATES.find(x => x.id === 'card-warm-letter');
    const props = { ...tpl.defaultProps, ...(block?.props || {}) };
    inner = tpl.render(props, t, mode, editor, origin);
  }

  if (block?.cornerStickerUrl) {
    const cornerSrc = resolveUrl(block.cornerStickerUrl, origin);
    inner = `<section style="position:relative;margin:0 0 14px;box-sizing:border-box;">
      ${inner}
      <img src="${esc(cornerSrc)}" style="position:absolute;top:-8px;right:-4px;width:42px;height:auto;z-index:3;pointer-events:none;" alt="角标贴纸"/>
    </section>`;
  }

  if (editor && block?.uid) {
    return `<section data-block-uid="${esc(block.uid)}" style="position:relative;box-sizing:border-box;">${inner}</section>`;
  }
  return inner;
}

export function compileArticleHtml(draft = {}, options = {}) {
  const mode = options.mode === 'xiumi' ? 'xiumi' : 'wechat';
  const editor = Boolean(options.editor);
  const origin = options.origin || '';
  const t = themeOf(draft.styleId || draft.themePalette);
  const p = t.palette;
  const blocks = Array.isArray(draft.blocks) ? draft.blocks : [];
  const bgUrl = draft.bgTextureUrl ? resolveUrl(draft.bgTextureUrl, origin) : '';
  const bgCss = bgUrl ? `background-color:${p.bg};background-image:url('${esc(bgUrl)}');background-repeat:repeat;` : `background:${p.bg};`;
  const inner = blocks.map(b => renderBlockHtml(b, t, { mode, editor, origin })).join('\n');
  return `<section style="${bgCss}padding:20px 14px;color:${p.ink};font-family:${t.fontFamily};line-height:1.85;box-sizing:border-box;max-width:100%;overflow-wrap:break-word;">\n${inner}\n</section>`;
}

export function normalizeAiBlock(raw, index = 0) {
  if (!raw || typeof raw !== 'object') {
    return { uid: `b_${Date.now()}_${index}`, templateId: 'card-warm-letter', props: { body: String(raw || '') } };
  }
  if (raw.templateId && BLOCK_TEMPLATES.some(t => t.id === raw.templateId)) {
    return {
      uid: raw.uid || `b_${Date.now()}_${index}`,
      templateId: raw.templateId,
      props: { ...(raw.props || {}) },
      cornerStickerUrl: raw.cornerStickerUrl || ''
    };
  }
  const type = String(raw.type || raw.kind || '').toLowerCase();
  if (type === 'raw-xiumi-section' && raw.html) {
    return { uid: raw.uid || `b_${Date.now()}_${index}`, templateId: 'raw-xiumi-section', props: { html: raw.html } };
  }
  if (type.includes('head') || type.includes('title')) {
    return {
      uid: `b_${Date.now()}_${index}`,
      templateId: index === 0 ? 'title-cover-letter' : 'title-vertical-bar',
      props: {
        kicker: raw.kicker || '活动纪实手记',
        badge: raw.badge || `第 ${String(index + 1).padStart(2, '0')} 节`,
        heading: raw.heading || raw.title || '把这一程的美好收好',
        subtitle: raw.subtitle || raw.note || '',
        note: raw.subtitle || raw.note || ''
      },
      cornerStickerUrl: raw.cornerStickerUrl || raw.stickerUrl || ''
    };
  }
  if (type.includes('quote')) {
    return {
      uid: `b_${Date.now()}_${index}`,
      templateId: 'card-quote-callout',
      props: {
        quote: raw.quote || raw.body || raw.text || '',
        author: raw.author || '—— 现场记录'
      },
      cornerStickerUrl: raw.cornerStickerUrl || ''
    };
  }
  if (type.includes('image') || type.includes('photo') || raw.imageUrl) {
    return {
      uid: `b_${Date.now()}_${index}`,
      templateId: 'photo-polaroid-single',
      props: {
        imageUrl: raw.imageUrl || raw.url || VERIFIED_PHOTOS.nature0,
        caption: raw.caption || raw.text || '点击照片可更换为本地现场照片'
      },
      cornerStickerUrl: raw.cornerStickerUrl || ''
    };
  }
  if (type.includes('gif')) {
    return {
      uid: `b_${Date.now()}_${index}`,
      templateId: 'gif-sparkle-header',
      props: {
        gifUrl: raw.gifUrl || raw.url || '/assets/open/gifs/sparkle-twinkle.gif',
        text: raw.text || raw.heading || '暖心瞬间的微光时刻'
      }
    };
  }
  if (type.includes('div')) {
    return { uid: `b_${Date.now()}_${index}`, templateId: 'div-botanical-line', props: {} };
  }
  return {
    uid: `b_${Date.now()}_${index}`,
    templateId: 'card-warm-letter',
    props: { body: raw.body || raw.text || raw.content || raw.title || '' },
    cornerStickerUrl: raw.cornerStickerUrl || raw.stickerUrl || ''
  };
}

export function buildStarterArticle(styleId = 'campus-paper') {
  const id = THEME_PRESETS[styleId] ? styleId : 'campus-paper';
  const uid = (n) => `${id}_starter_${n}`;

  const copyByStyle = {
    'campus-paper': {
      title: '把平凡的日子收好：初冬午后茶话小记',
      summary: '书页翻动、茶烟轻升，用一纸温柔手记留住共同走过的微光时刻。',
      bgTextureUrl: '/assets/open/textures/tex-cream-linen.svg',
      cover: { kicker: '时光手记 · 壹', heading: '把平凡的日子收好', subtitle: '落叶与微光之间，每一次认真倾听都算作礼物' },
      letter: '下午三点半，阳光正好从南面走廊斜切进来。大家围坐在一张铺满草稿纸与暖茶的长桌旁，从近况聊到各自收藏许久的小愿望。\n\n不用刻意准备发言稿，也不用赶场拍照，只把最真实的笑声留在彼此心上。',
      photo: { imageUrl: VERIFIED_PHOTOS.nature0, caption: '阳光与树影正好，点击图片可替换为本地实拍照片' },
      quote: { quote: '真正让人怀念的从来不是结果本身，而是那一群并肩完成同一件事的人。', author: '—— 参与伙伴手写笔记' }
    },
    'stage-heat': {
      title: '当灯光全部亮起：舞台排练高光回顾',
      summary: '鼓点与掌声穿过夜色，记录每一刻全情投入的舞台热浪。',
      bgTextureUrl: '/assets/open/textures/tex-charcoal-noise.svg',
      cover: { kicker: '舞台焦点 · 现场直击', heading: '当灯光全部亮起的那一刻', subtitle: '后台倒数三秒，所有汗水化作整场共鸣' },
      letter: '最后一轮走台灯亮起时，音箱里传出的低频震动正好和心跳同拍。前面几个星期反复调校的站位、麦标与换场动线，在这一刻顺滑衔接在一起。',
      photo: { imageUrl: VERIFIED_PHOTOS.stage0, caption: '舞台霓虹与聚光交汇瞬间，点击可换为本地演出现场图' },
      quote: { quote: '哪怕只有两分钟站在灯束中心，也值得提前两个月全力以赴。', author: '—— 演职同学后台感言' }
    },
    'fresh-teambuild': {
      title: '草坪微风计划：一场元气满满的周日团建',
      summary: '野餐垫、手工贴纸与接力游戏，一起收集加倍快乐的周日午后。',
      bgTextureUrl: '/assets/open/textures/tex-sage-plaid.svg',
      cover: { kicker: '元气日常 · 欢聚篇', heading: '向着晴朗天气出发吧', subtitle: '暂时合上笔记本电脑，把时间交给微风与笑声' },
      letter: '上午十点刚过，草坪一角的长垫就已经铺开。水果切盘、拍立得相纸和手绘卡片摆满桌面，谁都没看手机时间，只顾着猜谜和比划接力。',
      photo: { imageUrl: VERIFIED_PHOTOS.nature1, caption: '晴空与草坪配色正合适，点击即可换入合影照片' },
      quote: { quote: '原来不需要多远的旅行，只要同框的人在身边，草坪也能变成游乐园。', author: '—— 户外游戏优胜小组记录' }
    },
    'retro-film': {
      title: '胶片三十六格：把秋风装进相框里',
      summary: '暖棕暗调与胶片颗粒，用慢快门回望那些真实有温度的瞬间。',
      bgTextureUrl: '/assets/open/textures/tex-kraft-grain.svg',
      cover: { kicker: '胶片卷轴 · 纪实集', heading: '底片里晒不褪色的下午', subtitle: '有些画面不靠修图，天然带着暖意与时间感' },
      letter: '翻看这卷刚刚冲洗出来的画面，边角带着淡淡的暖黄颗粒感。站在门口等待入场的人、低头调吉他的手指、走廊尽头一束晚霞，全被稳稳留了下来。',
      photo: { imageUrl: VERIFIED_PHOTOS.stage1, caption: '复古光影长廊视角，点击替换为你自己的胶片照片' },
      quote: { quote: '按下快门的瞬间总是安静的，往后每一次翻看都会重新响起当天的风声。', author: '—— 胶片记录随笔' }
    },
    'minimal-mag': {
      title: '高效协作指北：一场活动的顺畅落地方案',
      summary: '去除冗余信息，用清晰编号与留白梳理值得复用的实践干货。',
      bgTextureUrl: '',
      cover: { kicker: '实践复盘 · 清单', heading: '把复杂筹备拆成可落地清单', subtitle: '清晰节点、明确职责，让每一次合作都事半功倍' },
      letter: '大型活动之所以常常手忙脚乱，往往不是因为投入不足，而是核心节点缺少提前四十八小时的逐项核对。本篇整理了三个经过验证的提效细节，供后续参考。',
      photo: { imageUrl: VERIFIED_PHOTOS.nature2, caption: '克制干净的视觉呈现，点击图面上传本地高清照片' },
      quote: { quote: '把可预见的细节提前写进表格，现场就能省出一半精力去照顾体验。', author: '—— 筹备组复盘总结' }
    },
    'warm-honor': {
      title: '硕果盈枝传捷报：这一程付出终于迎来回响',
      summary: '红金双线致敬每一份耕耘与荣光，将喜悦分享给一路支持的人。',
      bgTextureUrl: '/assets/open/textures/tex-warm-stripe.svg',
      cover: { kicker: '荣誉捷报 · 温暖献礼', heading: '每一份热爱，终有美好回响', subtitle: '稳步前行，用实绩交出一份亮眼答卷' },
      letter: '喜讯传来时，群里瞬间刷起了满屏烟花与祝贺。从前期立项反复修改到现场答辩稳扎稳打，这背后凝聚了团队成员日复一日的专注与默契配合。',
      photo: { imageUrl: VERIFIED_PHOTOS.nebula, caption: '光彩汇聚的荣誉时刻，点击上传获奖证书或合影照片' },
      quote: { quote: '奖状写不下所有熬过的夜，但每一点成长都会留在往后的底气里。', author: '—— 团队代表感言' }
    }
  }[id];

  const blocks = [
    {
      uid: uid(1),
      templateId: id === 'stage-heat' ? 'title-neon-stage' : id === 'warm-honor' ? 'title-honor-arch' : id === 'minimal-mag' ? 'title-minimal-num' : 'title-cover-letter',
      props: {
        kicker: copyByStyle.cover.kicker,
        heading: copyByStyle.cover.heading,
        subtitle: copyByStyle.cover.subtitle,
        sub: copyByStyle.cover.subtitle,
        number: '01'
      }
    },
    {
      uid: uid(2),
      templateId: 'gif-sparkle-header',
      props: { gifUrl: '/assets/open/gifs/sparkle-twinkle.gif', text: '点击左侧画廊卡片，可继续叠加贴纸、动图与互动组件' }
    },
    {
      uid: uid(3),
      templateId: 'card-warm-letter',
      props: { body: copyByStyle.letter }
    },
    {
      uid: uid(4),
      templateId: id === 'retro-film' ? 'photo-film-strip' : 'photo-polaroid-single',
      props: id === 'retro-film'
        ? { leftUrl: VERIFIED_PHOTOS.stage0, rightUrl: VERIFIED_PHOTOS.stage1, caption: copyByStyle.photo.caption }
        : { tapeUrl: '/assets/open/tapes/tape-butter-grid.svg', imageUrl: copyByStyle.photo.imageUrl, caption: copyByStyle.photo.caption }
    },
    {
      uid: uid(5),
      templateId: 'card-quote-callout',
      props: { iconUrl: '/assets/open/icons/badge-quote-mark.svg', quote: copyByStyle.quote.quote, author: copyByStyle.quote.author }
    },
    {
      uid: uid(6),
      templateId: 'svg-envelope-reveal',
      props: {
        prompt: '轻触点击下方信封（微信推文可直接点开 · 导出秀米自动兼容转换）',
        letterTitle: '寄往下一站的祝愿',
        letterBody: '愿我们带着这份温暖继续向前'
      }
    },
    {
      uid: uid(7),
      templateId: 'div-minimal-air',
      props: { tailText: '诚挚记录每一个当下' }
    }
  ];

  return {
    title: copyByStyle.title,
    summary: copyByStyle.summary,
    styleId: id,
    bgTextureUrl: copyByStyle.bgTextureUrl,
    blocks
  };
}

export function parseHtmlIntoDraft(rawHtml, currentStyleId = 'campus-paper') {
  const clean = String(rawHtml || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .trim();
  if (!clean) throw new Error('HTML 内容为空');

  // If browser DOMParser is available, split child blocks cleanly; otherwise fallback cleanly in Node
  let sections = [];
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    const rootSec = doc.body.children.length === 1 && doc.body.firstElementChild.tagName === 'SECTION'
      ? doc.body.firstElementChild
      : doc.body;
    const childBlocks = Array.from(rootSec.children).filter(el => el.tagName === 'SECTION' || el.tagName === 'DIV' || el.tagName === 'P' || el.tagName === 'SVG');
    const targets = childBlocks.length ? childBlocks : [rootSec];
    sections = targets.map(el => {
      el.querySelectorAll('script,style').forEach(bad => bad.remove());
      el.querySelectorAll('*').forEach(node => {
        for (const attr of Array.from(node.attributes)) {
          if (/^on/i.test(attr.name) || attr.name === 'class' || attr.name === 'id') {
            node.removeAttribute(attr.name);
          }
        }
      });
      return el.outerHTML;
    });
  } else {
    sections = [clean];
  }

  return {
    title: '导入的秀米排版草稿',
    summary: `已从外部 HTML 拆解导入 ${sections.length} 个可视区块`,
    styleId: currentStyleId,
    bgTextureUrl: '',
    blocks: sections.map((html, idx) => ({
      uid: `imp_${Date.now()}_${idx}`,
      templateId: 'raw-xiumi-section',
      props: { html }
    }))
  };
}
