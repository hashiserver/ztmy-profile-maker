import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutText } from '../src/lib/layout.ts';
import { validateTemplate } from '../src/lib/model.ts';
const field = {
  id: 'name',
  kind: 'text',
  label: '名前',
  x: 10,
  y: 20,
  width: 40,
  height: 40,
  fontSize: 20,
  minFontSize: 10,
  direction: 'horizontal',
  color: '#111111',
  align: 'left',
  font: 'sans',
  multiline: true,
} as const;
const measure = (s: string, size: number) => Array.from(s).length * size;
test('manual line breaks including empty lines survive', () => {
  const r = layoutText('あ\n\nい', { ...field, height: 100 }, measure);
  assert.equal(r.glyphs.map((g) => g.text).join(''), 'あい');
  assert.equal(r.glyphs[1].y - r.glyphs[0].y, 48);
});
test('wraps text and shrinks to fit without truncating', () => {
  const r = layoutText('あいうえお', field, measure);
  assert.equal(r.fontSize, 13);
  assert.equal(r.overflow, false);
  assert.equal(r.glyphs.map((g) => g.text).join(''), 'あいうえお');
});
test('overflow preserves all content at minimum size', () => {
  const text = '長い文章'.repeat(20);
  const r = layoutText(text, field, measure);
  assert.equal(r.fontSize, 10);
  assert.equal(r.overflow, true);
  assert.equal(r.glyphs.map((g) => g.text).join(''), text);
});
test('grapheme clusters do not split emoji and combining marks', () => {
  const r = layoutText(
    '👨‍👩‍👧‍👦が',
    { ...field, width: 300, height: 100 },
    () => 20,
  );
  assert.deepEqual(
    r.glyphs.map((g) => g.text),
    ['👨‍👩‍👧‍👦', 'が'],
  );
});
test('vertical columns flow down then right to left', () => {
  const r = layoutText(
    'あいうえ',
    {
      ...field,
      direction: 'vertical',
      fontSize: 20,
      minFontSize: 20,
      height: 40,
      width: 60,
    },
    measure,
  );
  assert.equal(r.glyphs[1].x, r.glyphs[0].x);
  assert.ok(r.glyphs[1].y > r.glyphs[0].y);
  assert.ok(r.glyphs[2].x < r.glyphs[0].x);
});
test('vertical ASCII words rotate and two-digit numbers stay upright', () => {
  const r = layoutText(
    'あ12ABC。',
    { ...field, direction: 'vertical', width: 300, height: 300 },
    measure,
  );
  assert.equal(r.glyphs.find((g) => g.text === '12')?.mode, 'tcy');
  assert.equal(r.glyphs.find((g) => g.text === 'ABC')?.mode, 'rotate');
  assert.equal(r.glyphs.find((g) => g.text === '。')?.mode, 'punctuation');
});
test('template rejects duplicate IDs and out-of-bounds geometry', () => {
  const base = {
    id: 'demo',
    version: 1,
    title: 'demo',
    width: 400,
    height: 400,
    background: '/templates/demo.svg',
    author: {
      name: '運営',
      id: 'operator',
      avatar: '/templates/avatar.svg',
      url: 'https://github.com/hashiserver/ztmy-profile-maker',
    },
    fields: [field],
  };
  assert.doesNotThrow(() => validateTemplate(base));
  assert.throws(
    () => validateTemplate({ ...base, fields: [field, field] }),
    /ID/,
  );
  assert.throws(
    () => validateTemplate({ ...base, fields: [{ ...field, x: -1 }] }),
    /領域/,
  );
});
