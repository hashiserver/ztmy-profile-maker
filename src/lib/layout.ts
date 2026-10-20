import type { TextField } from './model.ts';
export type Glyph = {
  text: string;
  x: number;
  y: number;
  width: number;
  mode: 'normal' | 'rotate' | 'tcy' | 'punctuation';
};
export type LayoutResult = {
  glyphs: Glyph[];
  fontSize: number;
  overflow: boolean;
};
type Measure = (text: string, size: number) => number;
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
export function layoutText(
  text: string,
  field: TextField,
  measure: Measure,
  autoFit = true,
): LayoutResult {
  const build = (size: number): LayoutResult => {
    const glyphs: Glyph[] = [];
    const lineHeight = size * 1.2;
    if (field.direction === 'horizontal') {
      const lines: { text: string; width: number }[][] = [[]];
      let width = 0;
      for (const { segment: s } of segmenter.segment(
        text.replace(/\r\n?/g, '\n'),
      )) {
        if (s === '\n') {
          lines.push([]);
          width = 0;
          continue;
        }
        const w = measure(s, size);
        if (width + w > field.width && lines.at(-1)!.length) {
          lines.push([]);
          width = 0;
        }
        lines.at(-1)!.push({ text: s, width: w });
        width += w;
      }
      lines.forEach((line, index) => {
        const total = line.reduce((sum, g) => sum + g.width, 0);
        let x =
          field.x +
          (field.align === 'center'
            ? (field.width - total) / 2
            : field.align === 'right'
              ? field.width - total
              : 0);
        for (const g of line) {
          glyphs.push({
            ...g,
            x,
            y: field.y + index * lineHeight,
            mode: 'normal',
          });
          x += g.width;
        }
      });
      return {
        glyphs,
        fontSize: size,
        overflow:
          lines.length * lineHeight > field.height ||
          glyphs.some((g) => g.width > field.width),
      };
    }
    // Segment non-ASCII runs again to keep emoji/combining sequences together.
    const units = Array.from(
      segmenter.segment(text.replace(/\r\n?/g, '\n')),
      (s) => s.segment,
    );
    const grouped: string[] = [];
    for (let i = 0; i < units.length; i++) {
      let token = units[i];
      if (/^[A-Za-z]$/.test(token)) {
        while (i + 1 < units.length && /^[A-Za-z]$/.test(units[i + 1]))
          token += units[++i];
      } else if (/^\d$/.test(token)) {
        while (i + 1 < units.length && /^\d$/.test(units[i + 1]))
          token += units[++i];
      }
      grouped.push(token);
    }
    let column = 0,
      y = 0;
    let tooTall = false;
    for (const token of grouped) {
      if (token === '\n') {
        column++;
        y = 0;
        continue;
      }
      const mode: Glyph['mode'] = /^\d{2}$/.test(token)
        ? 'tcy'
        : /^[A-Za-z0-9]+$/.test(token)
          ? 'rotate'
          : /^[、。，．]$/.test(token)
            ? 'punctuation'
            : /^[ー―（）「」『』【】〈〉《》！？]$/.test(token)
              ? 'rotate'
              : 'normal';
      const advance =
        mode === 'rotate' && /^[A-Za-z0-9]+$/.test(token)
          ? measure(token, size)
          : size;
      if (y + advance > field.height && y > 0) {
        column++;
        y = 0;
      }
      glyphs.push({
        text: token,
        x: field.x + field.width - size - column * lineHeight,
        y: field.y + y,
        width: size,
        mode,
      });
      tooTall ||= advance > field.height;
      y += advance;
    }
    return {
      glyphs,
      fontSize: size,
      overflow: tooTall || column * lineHeight + size > field.width,
    };
  };
  let size = field.fontSize,
    result = build(size);
  while (autoFit && result.overflow && size > field.minFontSize) {
    size--;
    result = build(size);
  }
  return result;
}
