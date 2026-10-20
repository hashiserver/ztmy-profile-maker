import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { saveDraft, loadDraft, removeDraft } from '../src/lib/drafts.ts';
import { initialDraft } from '../src/lib/model.ts';
const template = { id: 'test', version: 1, fields: [], shareText: '' } as any;
test.beforeEach(async () => {
  await removeDraft(template.id);
});
test('stores Blob and prevents older revision overwriting newer draft', async () => {
  const d = {
    ...initialDraft(template),
    revision: 2,
    values: { name: 'new' },
    icon: new Blob(['image']),
  };
  assert.equal(await saveDraft(d), 'saved');
  assert.equal(
    await saveDraft({ ...d, revision: 1, values: { name: 'old' } }),
    'superseded',
  );
  const r = await loadDraft(template);
  assert.equal(r.kind, 'restored');
  if (r.kind === 'restored') {
    assert.equal(r.draft.values.name, 'new');
    assert.equal(await r.draft.icon?.text(), 'image');
  }
  await removeDraft(template.id);
  assert.equal((await loadDraft(template)).kind, 'empty');
});
test('invalid schema blocks overwrite and remains stored', async () => {
  const d = { ...initialDraft(template), schemaVersion: 99 } as any;
  await saveDraft(d);
  assert.equal((await loadDraft(template)).kind, 'incompatible');
  await assert.rejects(
    () => saveDraft({ ...initialDraft(template), revision: 99 }),
    /互換/,
  );
  assert.equal((await loadDraft(template)).kind, 'incompatible');
  await removeDraft(template.id);
});
