import { test, expect } from '@playwright/test';
test('provided artwork supports text, printed choices and original-size PNG', async ({
  page,
}) => {
  await page.goto('/edit/ztmy-heijokyo-2026/');
  await expect(page.getByText('編集できます', { exact: true })).toBeVisible();
  await page
    .getByRole('textbox', { name: '名前', exact: true })
    .fill('れんれん');
  for (const [name, value] of [
    ['好きなずとまよの曲', '秒針を噛む\nお勉強しといてよ'],
    ['ライブ参戦歴', '2026.10.10・11 文禍伝雷'],
    ['ずとまよの思い出', '平城京で過ごした忘れられない夜。'],
    ['フリースペース', '好きな曲のお話ができたら嬉しいです。'],
  ] as const) {
    await page
      .getByRole('button', { name: `${name}を編集`, exact: true })
      .click();
    await page.getByRole('textbox', { name, exact: true }).fill(value);
  }
  await page.getByRole('radio', { name: '20歳以上', exact: true }).check();
  await page.getByRole('radio', { name: '男性', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Day1 10/10', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Day2 10/11', exact: true }).check();
  const icon = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#6540a4';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fffdf8';
    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R', 128, 138);
    return c.toDataURL().split(',')[1];
  });
  await page
    .getByLabel('アイコン画像')
    .setInputFiles({
      name: 'sample-icon.png',
      mimeType: 'image/png',
      buffer: Buffer.from(icon, 'base64'),
    });
  await expect(
    page.getByText('アイコンを読み込みました', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('この端末に保存済み', { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNGを保存', exact: true }).click();
  const f = await download;
  const fs = await import('node:fs/promises');
  const bytes = await fs.readFile((await f.path())!);
  expect(bytes.readUInt32BE(16)).toBe(1537);
  expect(bytes.readUInt32BE(20)).toBe(2048);
  await fs.writeFile('test-results/provided-template-filled.png', bytes);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: 'test-results/provided-template-mobile.png',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
