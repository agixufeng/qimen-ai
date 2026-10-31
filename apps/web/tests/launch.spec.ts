import { test, expect } from '@playwright/test';

test('古籍索引可搜索并保留章段定位与来源', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: '古籍', exact: true }).click();
  await expect(page.getByRole('heading', { name: '古籍与章段索引' })).toBeVisible();
  await expect(page.getByTestId('classics-boundary')).toContainText('尚非全文库');
  await expect(page.locator('[data-classic]')).toHaveCount(3);
  await page.getByLabel('搜索古籍与章段').fill('遁甲演义');
  await expect(page.locator('[data-classic]')).toHaveCount(1);
  const book = page.locator('[data-classic]');
  await expect(book).toContainText('定位');
  await expect(book.locator('a[href^="https://"]')).not.toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: '古籍与章段索引' })).toBeVisible();
});

test('开发者入口在390px可读并支持静态子路径刷新', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/developers');
  await expect(page.getByRole('heading', { name: '开发者入口' })).toBeVisible();
  await expect(page.getByTestId('developer-cli')).toContainText('--datetime 2026-10-28T12:00:00');
  await expect(page.getByTestId('developer-rules')).toContainText('UTC+8');
  await expect(page.getByTestId('developer-rules')).toContainText('0.1.0');
  await expect(page.getByTestId('developer-rules')).toContainText('23:00');
  await expect(page.getByTestId('developer-node')).toContainText('generateQimen');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: '开发者入口' })).toBeVisible();
  await page.getByRole('link', { name: '来源', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: '依据与版本' })).toBeVisible();
  await page.getByRole('link', { name: '古籍', exact: true }).click();
  await expect(page.locator('[data-classic]')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.local/screenshots/v03-classics-mobile.png', fullPage: true });
});
