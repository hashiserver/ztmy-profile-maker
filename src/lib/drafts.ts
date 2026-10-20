import type { Draft, Template } from './model.ts';
const DB = 'ztmy-profile-maker';
async function open(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore('drafts', { keyPath: 'templateId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(Error('別のタブを閉じてから再試行してください'));
  });
}
export function isDraft(
  d: unknown,
  t: Pick<Template, 'id' | 'version'>,
): d is Draft {
  if (!d || typeof d !== 'object') return false;
  const v = d as Draft;
  return (
    v.schemaVersion === 1 &&
    v.templateId === t.id &&
    v.templateVersion === t.version &&
    Number.isSafeInteger(v.revision) &&
    v.revision >= 0 &&
    typeof v.updatedAt === 'number' &&
    !!v.values &&
    Object.values(v.values).every((x) => typeof x === 'string') &&
    !!v.styles &&
    Object.values(v.styles).every(
      (s) =>
        s &&
        Number.isFinite(s.fontSize) &&
        s.fontSize >= 8 &&
        s.fontSize <= 120 &&
        /^#[\da-f]{6}$/i.test(s.color) &&
        ['sans', 'serif'].includes(s.font) &&
        ['left', 'center', 'right'].includes(s.align) &&
        Number.isFinite(s.dx) &&
        Math.abs(s.dx) <= 32 &&
        Number.isFinite(s.dy) &&
        Math.abs(s.dy) <= 24 &&
        typeof s.autoFit === 'boolean',
    ) &&
    !!v.choices &&
    Object.values(v.choices).every(
      (a) => Array.isArray(a) && a.every((x) => typeof x === 'string'),
    ) &&
    (v.icon === null || v.icon instanceof Blob) &&
    !!v.crop &&
    Number.isFinite(v.crop.x) &&
    Math.abs(v.crop.x) <= 1 &&
    Number.isFinite(v.crop.y) &&
    Math.abs(v.crop.y) <= 1 &&
    v.crop.zoom >= 1 &&
    v.crop.zoom <= 4 &&
    typeof v.shareText === 'string'
  );
}
export async function loadDraft(
  t: Pick<Template, 'id' | 'version'>,
): Promise<
  | { kind: 'empty' }
  | { kind: 'incompatible' }
  | { kind: 'restored'; draft: Draft }
> {
  const db = await open();
  try {
    const d = await new Promise<unknown>((resolve, reject) => {
      const r = db.transaction('drafts').objectStore('drafts').get(t.id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return d === undefined
      ? { kind: 'empty' }
      : isDraft(d, t)
        ? { kind: 'restored', draft: d }
        : { kind: 'incompatible' };
  } finally {
    db.close();
  }
}
export async function saveDraft(d: Draft): Promise<'saved' | 'superseded'> {
  const db = await open();
  try {
    return await new Promise<'saved' | 'superseded'>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      let result: 'saved' | 'superseded' = 'superseded';
      const r = store.get(d.templateId);
      let conflict = false;
      r.onsuccess = () => {
        const old = r.result as Draft | undefined;
        if (
          old &&
          !isDraft(old, { id: d.templateId, version: d.templateVersion })
        ) {
          conflict = true;
          tx.abort();
          return;
        }
        if (!old || old.revision < d.revision) {
          store.put(d);
          result = 'saved';
        }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () =>
        reject(
          Error(
            conflict
              ? '互換性のない下書きは上書きできません'
              : '下書きの保存に失敗しました',
          ),
        );
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function removeDraft(id: string): Promise<void> {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
