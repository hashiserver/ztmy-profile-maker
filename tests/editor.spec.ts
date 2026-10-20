import { test, expect } from '@playwright/test';
test('select, edit, export source-size PNG, restore local draft', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('a.primary-button[href="/edit/midnight-note/"]').click();
  await expect(page.getByText('編集できます', { exact: true })).toBeVisible();
  await page
    .getByRole('textbox', { name: '名前', exact: true })
    .fill('れんれん');
  await expect(
    page.getByText('この端末に保存済み', { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNGを保存', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('ztmy-midnight-note.png');
  const path = await file.path();
  const fs = await import('node:fs/promises');
  const bytes = await fs.readFile(path!);
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(1600);
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: '名前', exact: true }),
  ).toHaveValue('れんれん');
  await expect(
    page.getByText('下書きを復元しました', { exact: true }),
  ).toBeVisible();
});
test('mobile field selection, icon upload and no horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/edit/midnight-note/');
  await expect(page.getByText('編集できます', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ひとことを編集' }).click();
  await page
    .getByRole('textbox', { name: 'ひとこと', exact: true })
    .fill('夜に聴きたい12曲。');
  await page.getByLabel('アイコン画像').setInputFiles({
    name: 'icon.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(
    page.getByText('アイコンを読み込みました', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: 'test-results/editor-mobile.png',
    fullPage: true,
  });
});
test('unknown draft version is retained and not overwritten', async ({
  page,
}) => {
  await page.goto('/edit/midnight-note/');
  await expect(page.getByText('編集できます', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('ztmy-profile-maker', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('drafts', 'readwrite');
      tx.objectStore('drafts').put({
        templateId: 'midnight-note',
        schemaVersion: 99,
        templateVersion: 1,
        values: { name: '残す' },
        revision: 100,
      });
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  await expect(page.getByText(/互換性を確認できない下書き/)).toBeVisible();
  await page
    .getByRole('textbox', { name: '名前', exact: true })
    .fill('新しい入力');
  await page.waitForTimeout(1000);
  expect(
    await page.evaluate(async () => {
      const r = indexedDB.open('ztmy-profile-maker', 1);
      const db = await new Promise<IDBDatabase>(
        (resolve) => (r.onsuccess = () => resolve(r.result)),
      );
      const q = db
        .transaction('drafts')
        .objectStore('drafts')
        .get('midnight-note');
      return await new Promise(
        (resolve) => (q.onsuccess = () => resolve(q.result.schemaVersion)),
      );
    }),
  ).toBe(99);
});
test('desktop screenshot and Japanese composition preserve input', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/edit/midnight-note/');
  await expect(page.getByText('編集できます', { exact: true })).toBeVisible();
  const input = page.getByRole('textbox', { name: '名前', exact: true });
  await input.dispatchEvent('compositionstart');
  await input.fill('ずっと');
  await input.dispatchEvent('compositionend', { data: 'ずっと' });
  await expect(input).toHaveValue('ずっと');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: 'test-results/editor-desktop.png',
    fullPage: true,
  });
});
test('export exactly matches settled preview pixels after font change', async ({
  page,
}) => {
  await page.goto('/edit/midnight-note/');
  await expect(page.getByText('編集できます', { exact: true })).toBeVisible();
  await page
    .getByRole('textbox', { name: '名前', exact: true })
    .fill('夜明けの記憶「2026」');
  await page
    .getByRole('combobox', { name: 'フォント', exact: true })
    .selectOption('serif');
  await expect(
    page.getByText('この端末に保存済み', { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNGを保存', exact: true }).click();
  const f = await download;
  const fs = await import('node:fs/promises');
  const bytes = await fs.readFile((await f.path())!);
  const equal = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + base64;
    await image.decode();
    const c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    c.getContext('2d')!.drawImage(image, 0, 0);
    const preview = document.querySelector('canvas')!;
    const actual = c
      .getContext('2d')!
      .getImageData(0, 0, c.width, c.height).data;
    const expected = preview
      .getContext('2d')!
      .getImageData(0, 0, preview.width, preview.height).data;
    let differences = 0;
    for (let i = 0; i < actual.length; i++)
      if (actual[i] !== expected[i]) differences++;
    return { differences, width: c.width, height: c.height };
  }, bytes.toString('base64'));
  expect(equal).toEqual({ differences: 0, width: 1200, height: 1600 });
  await page.screenshot({
    path: 'test-results/editor-font-check.png',
    fullPage: true,
  });
});
test('PNG export waits for selected icon normalization', async ({ page }) => {
  await page.goto('/edit/midnight-note/');
  await expect(page.getByText('編集できます', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      if (this.src.startsWith('blob:'))
        await new Promise((r) => setTimeout(r, 1500));
      return decode.call(this);
    };
  });
  await page.getByLabel('アイコン画像').setInputFiles({
    name: 'icon.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(
    page.getByRole('button', { name: 'PNGを保存', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText('アイコンを読み込みました', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'PNGを保存', exact: true }),
  ).toBeEnabled();
});
test('newer stored revision warns instead of claiming a stale edit is saved', async ({
  page,
}) => {
  await page.goto('/edit/midnight-note/');
  await expect(page.getByText('編集できます', { exact: true })).toBeVisible();
  const input = page.getByRole('textbox', { name: '名前', exact: true });
  await input.fill('保存済み');
  await expect(
    page.getByText('この端末に保存済み', { exact: true }),
  ).toBeVisible();
  await input.fill('まだ保存していない入力');
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('ztmy-profile-maker', 1);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const r = store.get('midnight-note');
      r.onsuccess = () => {
        const d = r.result;
        d.revision = Date.now() + 100000;
        d.values.name = '別のタブの新しい入力';
        store.put(d);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await expect(page.getByText('保存の競合', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'この入力は保存されていません',
  );
  await expect(input).toHaveValue('まだ保存していない入力');
  await expect(
    page.getByRole('button', { name: 'PNGを保存', exact: true }),
  ).toBeEnabled();
});
