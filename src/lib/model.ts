export type FontId = 'sans' | 'serif';
export type TextField = {
  id: string;
  kind: 'text';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  minFontSize: number;
  direction: 'horizontal' | 'vertical';
  color: string;
  align: 'left' | 'center' | 'right';
  font: FontId;
  multiline: boolean;
};
export type ChoiceField = {
  id: string;
  kind: 'choice';
  label: string;
  multiple: boolean;
  mark?: 'check' | 'circle';
  radius?: number;
  options: { id: string; label: string; x: number; y: number }[];
};
export type Template = {
  id: string;
  version: number;
  title: string;
  description?: string;
  badge?: string;
  width: number;
  height: number;
  background: string;
  author: { id: string; name: string; avatar: string; url: string };
  fields: (TextField | ChoiceField)[];
  icon: { x: number; y: number; size: number };
  shareText: string;
};
export type TextStyle = {
  fontSize: number;
  color: string;
  font: FontId;
  align: TextField['align'];
  dx: number;
  dy: number;
  autoFit: boolean;
};
export type Draft = {
  schemaVersion: 1;
  templateVersion: number;
  templateId: string;
  revision: number;
  updatedAt: number;
  values: Record<string, string>;
  styles: Record<string, TextStyle>;
  choices: Record<string, string[]>;
  icon: Blob | null;
  crop: { x: number; y: number; zoom: number };
  shareText: string;
};
export function initialDraft(t: Template): Draft {
  return {
    schemaVersion: 1,
    templateVersion: t.version,
    templateId: t.id,
    revision: 0,
    updatedAt: 0,
    values: Object.fromEntries(
      t.fields.filter((f) => f.kind === 'text').map((f) => [f.id, '']),
    ),
    styles: {},
    choices: {},
    icon: null,
    crop: { x: 0, y: 0, zoom: 1 },
    shareText: t.shareText,
  };
}
export function validateTemplate(t: unknown): asserts t is Template {
  if (!t || typeof t !== 'object') throw Error('テンプレートが不正です');
  const v = t as Template;
  if (
    !v.id ||
    !Number.isInteger(v.version) ||
    v.version < 1 ||
    !Number.isFinite(v.width) ||
    !Number.isFinite(v.height) ||
    v.width <= 0 ||
    v.height <= 0 ||
    !Array.isArray(v.fields)
  )
    throw Error('テンプレートの寸法・バージョンが不正です');
  const ids = new Set<string>();
  for (const f of v.fields) {
    if (!f.id || ids.has(f.id)) throw Error('フィールドIDが重複しています');
    ids.add(f.id);
    if (f.kind === 'text') {
      if (
        ![f.x, f.y, f.width, f.height, f.fontSize, f.minFontSize].every(
          Number.isFinite,
        ) ||
        f.x < 0 ||
        f.y < 0 ||
        f.width <= 0 ||
        f.height <= 0 ||
        f.x + f.width > v.width ||
        f.y + f.height > v.height ||
        f.minFontSize <= 0 ||
        f.minFontSize > f.fontSize
      )
        throw Error('フィールド領域が不正です');
    } else if (f.kind === 'choice') {
      const options = new Set<string>();
      for (const o of f.options) {
        if (!o.id || options.has(o.id)) throw Error('選択肢IDが重複しています');
        options.add(o.id);
        if (
          !Number.isFinite(o.x) ||
          !Number.isFinite(o.y) ||
          o.x < 0 ||
          o.y < 0 ||
          o.x > v.width ||
          o.y > v.height
        )
          throw Error('選択肢領域が不正です');
      }
    } else throw Error('フィールドの種類が不正です');
  }
}
export function fieldStyle(f: TextField, s?: TextStyle): TextField {
  return {
    ...f,
    ...(s
      ? {
          fontSize: s.fontSize,
          color: s.color,
          font: s.font,
          align: s.align,
          x: f.x + s.dx,
          y: f.y + s.dy,
        }
      : {}),
  };
}
