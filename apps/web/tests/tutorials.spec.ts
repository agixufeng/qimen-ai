import { mkdir, readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('无JavaScript也能读教程、加载示例图并下载空白复核表', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4196/qimen-ai/getting-started.html');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      '第一次拿到奇门盘，该先看哪里？',
    );
    await expect(page.getByRole('img')).toHaveCount(4);
    for (const image of await page.getByRole('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((element) =>
            element instanceof HTMLImageElement ? element.naturalWidth : 0,
          ),
        )
        .toBeGreaterThan(0);
    }
    await page.getByRole('link', { name: '排盘差异核对', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('按6项设置逐步核对');
    const downloading = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载空白差异复核表（CSV）', exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('chart-comparison-template.csv');
    const file = await download.path();
    const csv = await readFile(file!, 'utf8');
    expect(csv).toContain('盘A填写,盘B填写,实际差异或缺失项');
    expect(csv).toContain('原始公历年月日时分秒,,,,,未核对');
  } finally {
    await context.close();
  }
});

test('教程跟做可查空亡依据、下载并重放公开演示盘', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('./getting-started.html');
  await page.getByRole('link', { name: '打开工作台，照做一次 →', exact: true }).click();
  await page.getByRole('button', { name: '起局', exact: true }).click();
  await expect(page.getByTestId('chart-time')).toHaveText('2026-10-28 12:00:00');
  await expect(page.getByLabel('占事备注')).toHaveValue('');
  await expect(page.getByRole('heading', { name: '本机存盘 0' })).toBeVisible();

  const capture = process.env.QIMEN_CAPTURE_TUTORIALS === '1';
  const captureDir = '.local/tutorial-capture';
  if (capture) {
    await mkdir(captureDir, { recursive: true });
    await page.screenshot({
      path: captureDir + '/input.png',
      clip: { x: 18, y: 118, width: 1080, height: 585 },
    });
  }

  const kun = page.locator('[data-testid="palace"][data-palace="2"]');
  await page.getByRole('button', { name: '选择坤二宫', exact: true }).click();
  if (capture) await kun.screenshot({ path: captureDir + '/palace.png' });
  await kun.getByRole('button', { name: '时空 申', exact: true }).click();
  const detail = page.getByTestId('parameter-detail');
  await expect(detail).toContainText('壬午');
  await expect(detail).toContainText('VOID-01');
  await expect(detail.getByRole('link').first()).toBeVisible();
  if (capture) await detail.screenshot({ path: captureDir + '/void-source.png' });

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 JSON', exact: true }).click();
  const file = await (await downloading).path();
  await page.getByLabel('导入 JSON').setInputFiles(file!);
  const message = page.getByRole('status');
  await expect(message).toContainText('基础盘一致；辅助参数一致');
  if (capture) await message.screenshot({ path: captureDir + '/replay.png' });
  await page.getByRole('button', { name: '后一个时辰', exact: true }).click();
  await expect(page.getByTestId('chart-time')).toHaveText('2026-10-28 14:00:00');
});
