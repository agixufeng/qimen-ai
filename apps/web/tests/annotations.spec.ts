import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('四柱辅助表、默认时空时马与逐对象解释', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('pillar-annotations')).toContainText('旬首');
  await expect(page.getByTestId('board-legend')).toBeVisible();
  await expect(page.getByTestId('board-legend')).toContainText('六仪击刑');
  await expect(page.getByTestId('board-legend')).toContainText('该干在该支入墓');
  await expect(page.getByTestId('board-legend')).toContainText('地盘刑墓标记仅作参考');
  const kun = page.locator('[data-testid="palace"][data-palace="2"]');
  await expect(kun.getByRole('button', { name: '时空 申', exact: true })).toBeVisible();
  await expect(kun.getByRole('button', { name: '时马 申', exact: true })).toBeVisible();
  await expect(
    page.locator('[data-palace="7"]').getByRole('button', { name: '时空 酉', exact: true }),
  ).toBeVisible();
  await kun.getByRole('button', { name: '时空 申', exact: true }).click();
  await expect(page.getByTestId('parameter-detail')).toContainText('时柱');
  await expect(page.getByTestId('parameter-detail')).toContainText('申');
  await expect(page.getByTestId('parameter-detail').locator('a')).not.toHaveCount(0);
  await page.getByLabel('显示日马').check();
  await expect(
    page.locator('[data-palace="4"]').getByRole('button', { name: '日马 巳', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '专业层', exact: true }).click();
  await kun.getByRole('button', { name: /天盘主干 癸/ }).click();
  await expect(page.getByTestId('parameter-detail')).toContainText('未');
  await expect(page.getByTestId('parameter-detail')).toContainText('墓');
  await expect(page.getByTestId('parameter-detail')).toContainText('申');
  await expect(page.getByTestId('parameter-detail')).toContainText('死');
  await page.getByRole('button', { name: '选择坤二宫' }).click();
  await expect(page.getByTestId('parameter-detail')).toHaveCount(0);
  expect(await page.locator('button button').count()).toBe(0);
});

test('显示偏好与JSON v2恢复、v1补充说明、SVG当前选项', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '专业层', exact: true }).click();
  await page.getByLabel('显示日马').check();
  await page.getByLabel('地盘参考').check();
  const jsonEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 JSON' }).click();
  const file = await jsonEvent;
  const path = (await file.path())!;
  const doc = JSON.parse(await readFile(path, 'utf8'));
  expect(doc.version).toBe(2);
  expect(doc.displayOptions.mode).toBe('professional');
  expect(doc.displayOptions.dayHorse).toBe(true);
  await page.getByRole('button', { name: '标准盘', exact: true }).click();
  await page.getByLabel('导入 JSON').setInputFiles(path);
  await expect(page.getByRole('button', { name: '专业层', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('status')).toContainText('基础盘一致');
  await expect(page.getByRole('status')).toContainText('辅助参数一致');
  const svgEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 SVG' }).click();
  const svg = await readFile((await (await svgEvent).path())!, 'utf8');
  expect(svg).toContain('日马');
  expect(svg).toContain('时空');
  const legacy = {
    format: 'qimen-dunjia',
    version: 1,
    chart: { ...doc.chart, engineVersion: '0.1.0' },
    note: '旧记录',
  };
  await page.getByLabel('导入 JSON').setInputFiles({
    name: 'legacy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect(page.getByRole('status')).toContainText('基础盘已比对；辅助参数按v0.2新增');
  await page.reload();
  await expect(page.getByTestId('chart-time')).toBeVisible();
});

test('窄屏专业层及损坏显示偏好不阻止起局', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.evaluate(() => localStorage.setItem('qimen-dunjia.display.v1', '{broken'));
  await page.reload();
  await expect(page.getByTestId('preference-warning')).toBeVisible();
  await page.getByRole('button', { name: '专业层', exact: true }).click();
  await page.getByLabel('显示日空').check();
  await page.getByLabel('显示日马').check();
  await page.getByLabel('地盘参考').check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '后一个时辰' }).click();
  await expect(page.getByTestId('chart-time')).toContainText('14:00:00');
  expect(await page.evaluate(() => localStorage.getItem('qimen-dunjia.display.v1'))).toBe(
    '{broken',
  );
});

test('标准盘保留门迫，地盘无标记时仍可点查', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: '标准盘', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('[data-palace="4"] .door-relation')).toHaveText('门迫');
  await expect(page.locator('[data-palace="2"] .door-relation')).toHaveCount(0);
  const earth = page
    .locator('[data-palace="2"]')
    .getByRole('button', { name: '地盘主干 戊', exact: true });
  await expect(earth).toBeVisible();
  await expect(earth.locator('.stem-marks')).toHaveCount(0);
  await earth.click();
  await expect(page.getByTestId('parameter-detail')).toContainText('地盘主干');
  await page.getByRole('button', { name: '专业层', exact: true }).click();
  await expect(page.locator('[data-palace="2"] .door-relation')).toHaveText('制');
  await expect(page.locator('[data-palace="4"] .door-relation')).toHaveText('门迫');
});

test('专业SVG实际渲染、边界和备注排除', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1040 });
  await page.goto('./');
  await page.getByRole('button', { name: '专业层', exact: true }).click();
  for (const label of ['显示日空', '显示日马', '地盘参考']) await page.getByLabel(label).check();
  await page.screenshot({
    path: '.local/screenshots/v02-professional-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '选择坤二宫' }).click();
  await page.screenshot({ path: '.local/screenshots/v02-professional-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1040 });
  await page.getByLabel('占事备注').fill('专业导出也不包含备注');
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 SVG' }).click();
  const svg = await readFile((await (await event).path())!, 'utf8');
  expect(svg).not.toContain('专业导出也不包含备注');
  expect(svg).toContain('未:墓 / 申:死');
  expect(svg).toContain('shijia-common-annotations-v1');
  await page.setContent(svg);
  const overflow = await page.locator('svg').evaluate((root) => {
    const outer = root.getBoundingClientRect();
    return [...root.querySelectorAll('text')]
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.right > outer.right || rect.bottom > outer.bottom || rect.left < outer.left;
      })
      .map((node) => node.textContent);
  });
  expect(overflow).toEqual([]);
  await page.locator('svg').screenshot({ path: '.local/screenshots/v02-professional-svg.png' });
});
