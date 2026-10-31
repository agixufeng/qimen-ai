import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('起局、选宫、查依据、保存及重载', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '奇门研习' })).toBeVisible();
  await expect(page.locator('[data-testid="palace"]')).toHaveCount(9);
  await page.getByRole('button', { name: '选择坎一宫' }).click();
  await expect(page.getByRole('heading', { name: '坎一宫 · 北' })).toBeVisible();
  const before = await page.getByTestId('chart-time').textContent();
  await page.getByRole('button', { name: '后一个时辰' }).click();
  await expect(page.getByTestId('chart-time')).not.toHaveText(before!);
  await page.getByLabel('占事备注').fill('仅保存在本机');
  await page.getByRole('button', { name: '保存此盘' }).click();
  await expect(page.getByRole('status')).toContainText('已保存');
  await page.reload();
  await expect(page.locator('.saved-list')).toContainText('仅保存在本机');
  await page.locator('.saved-open').first().click();
  await expect(page.getByLabel('占事备注')).toHaveValue('仅保存在本机');
  await page.locator('.delete-saved').first().click();
  await expect(page.locator('.saved-list li')).toHaveCount(0);
  await page.getByRole('link', { name: '81 格' }).click();
  await page.getByLabel('搜索组合或格名').fill('乙辛');
  await expect(page.locator('.combination-list')).toContainText('乙');
  await page.getByRole('link', { name: '来源' }).click();
  await expect(page.getByRole('heading', { name: '依据与版本' })).toBeVisible();
});

test('导出JSON与SVG、重算导入、拒绝未知版本', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('占事备注').fill('SVG不能包含这个备注');
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 JSON' }).click();
  const download = await jsonDownload;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByLabel('导入 JSON').setInputFiles(path!);
  await expect(page.getByRole('status')).toContainText('一致');
  const document = JSON.parse(await readFile(path!, 'utf8'));
  document.chart.ju = document.chart.ju === 1 ? 2 : 1;
  await page.getByLabel('导入 JSON').setInputFiles({
    name: 'changed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(document)),
  });
  await expect(page.getByRole('status')).toContainText('存在差异');
  await page.getByLabel('导入 JSON').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"format":"qimen-dunjia","version":999}'),
  });
  await expect(page.getByRole('alert')).toBeVisible();
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 SVG' }).click();
  const svg = await svgDownload;
  expect(svg.suggestedFilename()).toMatch(/\.svg$/);
  expect(await readFile((await svg.path())!, 'utf8')).not.toContain('SVG不能包含这个备注');
});

test('无效输入保留旧盘，移动端无横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const original = await page.getByTestId('chart-time').textContent();
  await page.getByLabel('公历日期').fill('1899-12-01');
  await page.getByRole('button', { name: '起局', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('chart-time')).toHaveText(original!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: '选择离九宫' }).click();
  await expect(page.getByRole('heading', { name: '离九宫 · 南' })).toBeVisible();
  await page.getByRole('link', { name: '示例' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: '公开演示盘' })).toBeVisible();
});

test('寄地盘组合单列参考，保持主组合', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('公历日期').fill('2026-03-09');
  await page.getByLabel('时间', { exact: true }).fill('09:24:00');
  await page.getByRole('button', { name: '起局', exact: true }).click();
  await page.getByRole('button', { name: '选择坤二宫' }).click();
  await expect(page.locator('[data-combination="丁-己"]')).toHaveAttribute(
    'data-combination-role',
    'primary',
  );
  await expect(page.locator('[data-combination="丁-壬"]')).toHaveAttribute(
    'data-combination-role',
    'reference',
  );
  await expect(page.locator('[data-combination="丁-壬"]')).toContainText('寄地盘参考');
});

test('损坏存盘时保护原内容，重新读取恢复后可保存', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.setItem('qimen-dunjia.saved.v1', '{broken-json'));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('本机存盘读取失败');
  await expect(page.getByRole('button', { name: '保存此盘' })).toBeDisabled();
  await page.getByRole('button', { name: '后一个时辰' }).click();
  await expect(page.getByRole('button', { name: '导出 JSON' })).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('qimen-dunjia.saved.v1'))).toBe(
    '{broken-json',
  );
  await page.getByRole('button', { name: '重新读取存盘' }).click();
  await expect(page.getByRole('button', { name: '保存此盘' })).toBeDisabled();
  // Simulate repair outside the app. No destructive reset action is exposed in the UI.
  await page.evaluate(() => localStorage.setItem('qimen-dunjia.saved.v1', '[]'));
  await page.getByRole('button', { name: '重新读取存盘' }).click();
  await expect(page.getByRole('button', { name: '保存此盘' })).toBeEnabled();
});

test('浏览器拒绝存储权限时仍可起局，保存保持禁用', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('storage blocked', 'SecurityError');
      },
    }),
  );
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('本机存盘读取失败');
  await expect(page.getByRole('button', { name: '保存此盘' })).toBeDisabled();
  await expect(page.locator('[data-testid="palace"]')).toHaveCount(9);
  await page.getByRole('button', { name: '后一个时辰' }).click();
  await expect(page.getByTestId('chart-time')).toContainText('14:00:00');
});

test('静态子路径、控制台与资源请求，以及桌面和手机最终截图', async ({ page }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text());
  });
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:4196/'))
      external.push(r.url());
  });
  await page.setViewportSize({ width: 1440, height: 1040 });
  await page.goto('./');
  await expect(page.locator('[data-testid="palace"]')).toHaveCount(9);
  await expect(page).toHaveURL(/\/qimen-ai\//);
  await page.screenshot({ path: '.local/screenshots/desktop.png', fullPage: true });
  await page.getByRole('link', { name: '81 格' }).click();
  await page.reload();
  await expect(page.getByLabel('搜索组合或格名')).toBeVisible();
  await page.getByLabel('搜索组合或格名').fill('辛辛');
  await expect(page.locator('.combination-list')).toContainText('待');
  await page.getByRole('link', { name: '起局', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '选择坤二宫' }).click();
  await page.screenshot({ path: '.local/screenshots/mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
