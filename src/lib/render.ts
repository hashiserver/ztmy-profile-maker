import { layoutText } from './layout';
import { fieldStyle, type Template, type Draft } from './model';
import { fontFamily, loadFont } from './fonts';
import { loadImage, decodeImage, pngBlob } from './images';
export type Assets = {
  background: HTMLImageElement;
  icon: HTMLImageElement | null;
};
export async function prepareAssets(t: Template, d: Draft): Promise<Assets> {
  const fonts = new Set(
    t.fields
      .filter((f) => f.kind === 'text')
      .map(
        (f) => d.styles[f.id]?.font || (f.kind === 'text' ? f.font : 'sans'),
      ),
  );
  const [background, icon] = await Promise.all([
    loadImage(t.background),
    d.icon ? decodeImage(d.icon) : Promise.resolve(null),
    ...Array.from(fonts, (id) =>
      loadFont(id, Object.values(d.values).join('')),
    ),
  ]);
  return { background, icon };
}
export function renderCard(
  canvas: HTMLCanvasElement,
  t: Template,
  d: Draft,
  a: Assets,
): string[] {
  canvas.width = t.width;
  canvas.height = t.height;
  // Detached export canvases must use the same language as the visible preview.
  // Font shaping may select different localized glyphs when language is inherited.
  canvas.lang = 'ja';
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('このブラウザでは画像を描画できません');
  ctx.clearRect(0, 0, t.width, t.height);
  ctx.drawImage(a.background, 0, 0, t.width, t.height);
  if (a.icon) {
    const r = t.icon;
    const image = a.icon;
    const scale =
      Math.max(r.size / image.naturalWidth, r.size / image.naturalHeight) *
      d.crop.zoom;
    const w = image.naturalWidth * scale,
      h = image.naturalHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(r.x + r.size / 2, r.y + r.size / 2, r.size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      image,
      r.x + (r.size - w) / 2 + (d.crop.x * (w - r.size)) / 2,
      r.y + (r.size - h) / 2 + (d.crop.y * (h - r.size)) / 2,
      w,
      h,
    );
    ctx.restore();
  }
  const warnings: string[] = [];
  for (const f of t.fields) {
    if (f.kind === 'choice') {
      ctx.strokeStyle = '#604298';
      ctx.lineWidth = 7;
      for (const option of f.options)
        if (d.choices[f.id]?.includes(option.id)) {
          ctx.beginPath();
          ctx.moveTo(option.x - 14, option.y);
          ctx.lineTo(option.x - 3, option.y + 12);
          ctx.lineTo(option.x + 17, option.y - 15);
          ctx.stroke();
        }
      continue;
    }
    const field = fieldStyle(f, d.styles[f.id]);
    const measure = (text: string, size: number) => {
      ctx.font = `${size}px ${fontFamily(field.font)}`;
      return ctx.measureText(text).width;
    };
    const layout = layoutText(
      d.values[f.id] || '',
      field,
      measure,
      d.styles[f.id]?.autoFit ?? true,
    );
    if (layout.overflow)
      warnings.push(
        `${f.label}が枠からはみ出しています。文字を短くするかサイズを調整できます。`,
      );
    ctx.font = `${layout.fontSize}px ${fontFamily(field.font)}`;
    ctx.fillStyle = field.color;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    for (const glyph of layout.glyphs) {
      ctx.save();
      ctx.translate(glyph.x, glyph.y);
      if (glyph.mode === 'rotate') {
        ctx.translate(layout.fontSize, 0);
        ctx.rotate(Math.PI / 2);
      }
      if (glyph.mode === 'tcy') {
        ctx.translate(layout.fontSize / 2, 0);
        ctx.textAlign = 'center';
        ctx.fillText(glyph.text, 0, 0, layout.fontSize);
      } else if (glyph.mode === 'punctuation') {
        ctx.fillText(
          glyph.text,
          layout.fontSize * 0.5,
          -layout.fontSize * 0.45,
        );
      } else ctx.fillText(glyph.text, 0, 0);
      ctx.restore();
    }
  }
  return warnings;
}
export async function exportCard(t: Template, d: Draft): Promise<Blob> {
  const assets = await prepareAssets(t, d);
  const canvas = document.createElement('canvas');
  renderCard(canvas, t, d, assets);
  return pngBlob(canvas);
}
