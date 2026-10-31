import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('神奇之门默认、御定独立对照及两书格名搜索', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('公历日期').fill('2026-01-05');
  await page.getByLabel('时间', { exact: true }).fill('12:00:00');
  await page.getByRole('button', { name: '起局', exact: true }).click();
  await page.getByRole('button', { name: '选择兑七宫' }).click();
  const combo = page.locator('.palace-detail [data-combination="乙-丁"]');
  await expect(combo.locator('[data-reading-role="primary"]')).toContainText('《神奇之门》');
  await expect(combo.locator('[data-reading-role="primary"]')).toContainText('奇仪相佐');
  await expect(combo.locator('[data-reading-role="primary"]')).not.toContainText('朱雀入墓');
  await combo.locator('.reading-comparison > summary').click();
  await expect(combo.locator('[data-reading-role="comparison"]')).toContainText('朱雀入墓');
  await expect(combo.locator('[data-reading-role="primary"] a')).toHaveAttribute(
    'href',
    /did=1166/,
  );
  await expect(combo.locator('[data-reading-role="comparison"] a')).toHaveAttribute(
    'href',
    /book\.taiyi\.me/,
  );
  await expect(combo).toContainText('辅助参数中的落宫入墓分别判断');
  await page.screenshot({ path: '.local/screenshots/dual-readings-desktop.png', fullPage: true });
  const originalTime = await page.getByTestId('chart-time').textContent();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 JSON' }).click();
  const exported = JSON.parse(await readFile((await (await downloadEvent).path())!, 'utf8'));
  const legacy = {
    format: 'qimen-dunjia',
    version: 1,
    chart: { ...exported.chart, engineVersion: '0.1.0' },
  };
  await page.getByLabel('导入 JSON').setInputFiles({
    name: 'legacy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect(page.getByRole('status')).toContainText('基础盘一致');
  await expect(page.getByTestId('chart-time')).toHaveText(originalTime!);
  await page.getByRole('link', { name: '81 格' }).click();
  for (const name of ['奇仪相佐', '朱雀入墓']) {
    await page.getByLabel('搜索组合或格名').fill(name);
    const row = page.locator('.combination-list [data-combination="乙-丁"]');
    await expect(row).toBeVisible();
    await expect(row.locator(':scope > summary')).toContainText('奇仪相佐');
    await row.locator(':scope > summary').click();
    await expect(row.locator('[data-reading-role="primary"]')).toContainText('《神奇之门》');
    await row.locator(':scope > summary').click();
  }
  await expect(page.getByText(/筛选与列表状态以默认《神奇之门》条目为准/)).toBeVisible();
});

test('移动端双书展开与各自复核状态', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/combinations');
  await page.getByLabel('复核状态').selectOption('pending');
  await expect(page.locator('.combination-list > details')).toHaveCount(5);
  await page.getByLabel('搜索组合或格名').fill('辛辛');
  await expect(page.locator('.combination-list > details')).toHaveCount(0);
  await page.getByLabel('复核状态').selectOption('all');
  const row = page.locator('[data-combination="辛-辛"]');
  await row.locator(':scope > summary').click();
  await expect(row.locator('[data-reading-role="primary"] .status-tag')).toHaveText('转录已核');
  await row.locator('.reading-comparison > summary').click();
  await expect(row.locator('[data-reading-role="comparison"] .status-tag')).toHaveText('待核');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('搜索组合或格名').fill('乙丁');
  const yiDing = page.locator('[data-combination="乙-丁"]');
  await yiDing.locator(':scope > summary').click();
  await yiDing.locator('.reading-comparison > summary').click();
  await expect(yiDing.locator('[data-reading-role="primary"]')).toContainText('奇仪相佐');
  await expect(yiDing.locator('[data-reading-role="comparison"]')).toContainText('朱雀入墓');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.local/screenshots/dual-readings-mobile.png', fullPage: true });
});
