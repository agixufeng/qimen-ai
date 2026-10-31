import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('混合库分型计数、筛选分页与程序盘重放', async ({ page }) => {
  await page.goto('./#/cases');
  await expect(page.getByRole('heading', { name: '混合研习盘例' })).toBeVisible();
  const counts = page.getByTestId('study-counts');
  await expect(counts).toContainText('10,000');
  await expect(counts).toContainText('9,998');
  await expect(counts).toContainText('古籍教学例 2');
  await expect(counts).toContainText('来源自述 0');
  await expect(page.getByRole('link', { name: '下载全部记录（JSONL.gz）' })).toHaveAttribute(
    'href',
    /\/qimen-ai\/cases\/study-v1\.jsonl\.gz$/,
  );
  await expect(page.getByRole('link', { name: '下载全部记录（JSONL.gz）' })).toHaveAttribute(
    'download',
    'qimen-study-v1.jsonl.gz',
  );
  await expect(page.getByRole('link', { name: '数据清单与覆盖统计' })).toHaveAttribute(
    'href',
    /\/qimen-ai\/cases\/manifest\.json$/,
  );
  await expect(page.getByRole('link', { name: 'SHA-256校验清单' })).toHaveAttribute(
    'href',
    /\/qimen-ai\/cases\/SHA256SUMS$/,
  );
  await expect(page.getByTestId('study-downloads')).toContainText('非真实占验库');

  await expect(page.locator('[data-study-id]')).toHaveCount(40);
  await page.getByLabel('盘例类型').selectOption('generated');
  await page.getByLabel('阴阳遁').selectOption('阳遁');
  await page.getByLabel('局数').selectOption('1');
  await expect(page.locator('[data-study-id]').first()).toContainText('阳遁1局');
  await page.locator('[data-study-id]').first().getByRole('button', { name: '查看详情' }).click();
  const detail = page.getByTestId('study-detail');
  await expect(detail).toContainText('程序盘例');
  await expect(detail).toContainText('无实际反馈');
  await expect(detail).toContainText('基础盘一致');
  const downloadEvent = page.waitForEvent('download');
  await detail.getByRole('button', { name: '下载此条 JSON' }).click();
  const record = JSON.parse(await readFile((await (await downloadEvent).path())!, 'utf8'));
  expect(record.kind).toBe('generated');
  expect(record.outcome).toBeNull();
  expect(record.note).toBeUndefined();
  await detail.getByRole('button', { name: '在工作台打开' }).click();
  await expect(page.getByTestId('chart-time')).toBeVisible();
  await expect(page).toHaveURL(/#\/chart$/);
});

test('古籍教学例保留原条件、不补公历并支持手机刷新', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#/cases');
  await page.getByLabel('盘例类型').selectOption('classical');
  await expect(page.locator('[data-study-id]')).toHaveCount(2);
  await page.locator('[data-study-id]').first().getByRole('button', { name: '查看详情' }).click();
  const detail = page.getByTestId('study-detail');
  await expect(detail).toContainText('古籍教学例');
  await expect(detail).toContainText('无实际反馈');
  await expect(detail).toContainText('不能按当前引擎重排');
  await expect(detail.getByRole('button', { name: '在工作台打开' })).toBeDisabled();
  await expect(detail.locator('a[href^="https://"]')).not.toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.local/screenshots/v04-cases-mobile.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: '混合研习盘例' })).toBeVisible();
  await expect(page.getByTestId('study-counts')).toContainText('10,000');
});

test('盘例索引加载失败可重试，空筛选可清除', async ({ page }) => {
  let failed = true;
  await page.route('**/cases/index.json', async (route) => {
    if (failed) await route.fulfill({ status: 503, body: 'temporary failure' });
    else await route.continue();
  });
  await page.goto('./#/cases');
  await expect(page.getByRole('alert')).toContainText('盘例索引加载失败');
  failed = false;
  await page.getByRole('button', { name: '重新加载索引' }).click();
  await expect(page.getByTestId('study-counts')).toContainText('10,000');
  await page.getByLabel('搜索盘例').fill('no-such-study-record');
  await expect(page.locator('[data-study-id]')).toHaveCount(0);
  await expect(page.getByText('没有匹配的盘例。')).toBeVisible();
  await page.getByRole('button', { name: '清除筛选' }).click();
  await expect(page.locator('[data-study-id]')).toHaveCount(40);
});

test('盘例文件损坏、未知版本与伪造反馈在展示前拒绝', async ({ page }) => {
  let scenario: 'hash' | 'version' | 'semantics' = 'hash';
  const mutations = new Map<string, string>();
  await page.route('**/cases/index.json', async (route) => {
    const response = await route.fetch();
    const index = await response.json();
    if (scenario === 'version') index.datasetVersion = 'unknown-future-version';
    if (scenario === 'semantics') {
      const entry = index.records.find((item: { kind: string }) => item.kind === 'generated');
      const chunkUrl = new URL(entry.chunk, route.request().url()).href;
      const records = await (await page.request.get(chunkUrl)).json();
      records.find((record: { id: string }) => record.id === entry.id).outcome = {
        text: '伪造的真实反馈',
        sourceId: 'project-profile',
        locator: '没有实际来源',
      };
      const body = JSON.stringify(records);
      mutations.set(new URL(chunkUrl).pathname, body);
      index.chunks[entry.chunk].sha256 = createHash('sha256').update(body).digest('hex');
    }
    await route.fulfill({ json: index });
  });
  await page.route('**/cases/chunks/*.json', async (route) => {
    if (scenario === 'hash') {
      const response = await route.fetch();
      await route.fulfill({ contentType: 'application/json', body: (await response.text()) + ' ' });
    } else {
      const body = mutations.get(new URL(route.request().url()).pathname);
      if (body) await route.fulfill({ contentType: 'application/json', body });
      else await route.continue();
    }
  });
  await page.goto('./#/cases');
  await page.getByLabel('盘例类型').selectOption('generated');
  await page.locator('[data-study-id]').first().getByRole('button', { name: '查看详情' }).click();
  await expect(page.getByRole('alert')).toContainText('盘例文件与目录校验不一致');
  await expect(page.getByTestId('study-detail')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '在工作台打开' })).toHaveCount(0);
  scenario = 'version';
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('盘例目录版本或结构不受支持');
  await expect(page.locator('[data-study-id]')).toHaveCount(0);
  scenario = 'semantics';
  await page.reload();
  await page.getByLabel('盘例类型').selectOption('generated');
  await page.locator('[data-study-id]').first().getByRole('button', { name: '查看详情' }).click();
  await expect(page.getByRole('alert')).toContainText('程序盘例不得带真实反馈');
  await expect(page.getByTestId('study-detail')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '在工作台打开' })).toHaveCount(0);
});
