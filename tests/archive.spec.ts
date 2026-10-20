import { test, expect } from '@playwright/test';

test('live archive opens template dialog, restores focus and navigates to editor', async ({
  page,
}) => {
  await page.goto('/');
  const opener = page.getByRole('button', {
    name: 'オリジナル・デモのテンプレートを見る',
  });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await opener.click();
  const dialog = page.getByRole('dialog', {
    name: 'オリジナル・デモ / テンプレート一覧',
  });
  await expect(dialog).toBeVisible();
  await page.screenshot({
    path: 'test-results/archive-desktop.png',
    fullPage: false,
  });
  await expect(
    dialog.getByRole('link', { name: 'ずとまよプロフィールメーカー 運営' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/hashiserver/ztmy-profile-maker',
  );
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole('link', { name: 'このテンプレートを使う' }).click();
  await expect(page).toHaveURL(/edit\/midnight-note/);
  await expect(
    page.getByRole('textbox', { name: '名前', exact: true }),
  ).toBeVisible();
});

test('archive window fits mobile and closes with visible back control', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'オリジナル・デモのテンプレートを見る' })
    .click();
  await expect(
    page.getByRole('link', { name: 'このテンプレートを使う' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/archive-mobile.png',
    fullPage: false,
  });
  await page.getByRole('button', { name: '一覧に戻る', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('unapproved artwork and editor are no longer publicly served', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: '文禍伝雷のテンプレートを見る' }),
  ).toHaveCount(0);
  for (const path of [
    '/templates/ztmy-heijokyo-2026.jpg',
    '/images/bunka-denrai-live.jpg',
    '/edit/ztmy-heijokyo-2026/',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});
