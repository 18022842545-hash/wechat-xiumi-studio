function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const target = /^https?:\/\//i.test(url)
      ? `/api/proxy-image?url=${encodeURIComponent(url)}`
      : url;
    const res = await fetch(target);
    if (!res.ok) return '';
    return await blobToDataUrl(await res.blob());
  } catch {
    return '';
  }
}

export async function exportArticleToPng2x(paperEl) {
  if (!paperEl) throw new Error('未找到画布容器');
  const rect = paperEl.getBoundingClientRect();
  const w = Math.max(320, Math.round(rect.width || paperEl.offsetWidth || 375));
  const h = Math.max(240, Math.round(paperEl.scrollHeight || rect.height || 640));

  const clone = paperEl.cloneNode(true);
  clone.querySelectorAll('.block-toolbar, .editor-chrome, script, style, link').forEach(el => el.remove());
  clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

  // Inline every <img> src as data: URL so foreignObject never taints the canvas
  const imgs = Array.from(clone.querySelectorAll('img'));
  await Promise.all(imgs.map(async img => {
    const src = img.getAttribute('src') || '';
    const dataUrl = await fetchAsDataUrl(src);
    if (dataUrl) {
      img.setAttribute('src', dataUrl);
    } else {
      img.removeAttribute('src');
    }
  }));

  // Inline background-image: url(...) as data: URL
  const allEls = [clone, ...clone.querySelectorAll('*')];
  await Promise.all(allEls.map(async el => {
    const bgImg = el.style?.backgroundImage;
    if (bgImg && bgImg !== 'none') {
      const m = /url\(\s*["']?([^"')]+)["']?\s*\)/i.exec(bgImg);
      if (m && m[1] && !m[1].startsWith('data:')) {
        const dataUrl = await fetchAsDataUrl(m[1]);
        el.style.backgroundImage = dataUrl ? `url("${dataUrl}")` : 'none';
      }
    }
  }));

  clone.style.margin = '0';
  clone.style.width = `${w}px`;
  clone.style.boxSizing = 'border-box';

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;margin:0;padding:0;font-family:'PingFang SC','Microsoft YaHei',sans-serif;">${serialized}</div></foreignObject></svg>`;
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('长图光栅化失败，请检查是否有无法代理的外链图片'));
    img.src = svgUrl;
  });

  const scale = 2;
  const maxCanvasH = 14000;
  const outW = w * scale;
  const outH = Math.min(maxCanvasH, h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);
  ctx.scale(scale, scale);
  ctx.drawImage(image, 0, 0);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: outW,
    height: outH
  };
}

export function getTeacherReviewMessages(title = '推文初稿') {
  const safeTitle = String(title || '推文初稿').trim();
  return [
    {
      label: '初稿请示版（礼貌简洁）',
      text: `老师您好！《${safeTitle}》的第一版排版长图我已经导出发您，您方便时麻烦帮忙过目一下内容表述和整体配图是否合适，需要调整的地方我这边马上改好。`
    },
    {
      label: '细节确认版（核对人名/时间/口径）',
      text: `老师您好，《${safeTitle}》已按商定思路排好，附上 @2x 高清长图方便您在手机上直接滑看预览。请重点帮我们把关时间地点表述、同学名字及图片选用，没问题的话我就准备同步排期。`
    },
    {
      label: '定稿报备版（修改完成）',
      text: `老师好，已按刚才您的建议完成了文字润色和细节调整，附上更新后的《${safeTitle}》长图请您最终确认一下。如无问题，后续就按这一版内容整理。`
    }
  ];
}
