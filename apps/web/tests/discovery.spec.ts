import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('GEO静态说明不依赖JavaScript，并能沿真实链接阅读规则', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4196/qimen-ai/');
  await expect(page.getByRole('region', { name: '项目说明', exact: true })).toContainText(
    'AI解读尚未实现',
  );
  await page.getByRole('link', { name: '功能、安装与常见问题' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '奇门研习（qimen-ai）：功能与本地部署',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://agixufeng.github.io/qimen-ai/about.html',
  );
  await page.getByRole('link', { name: '规则与边界', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('奇门研习的时间规则与验证边界');
  await expect(page.locator('main')).toContainText('23:00');
  await page.reload();
  await expect(page.locator('main')).toContainText('不代表所有流派');
  await context.close();
});

test('GEO静态说明在390px可读，能进入原排盘工作台', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['about.html', 'rules.html']) {
    await page.goto(`./${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole('link', { name: '排盘工作台', exact: true }).click();
  await expect(page.getByRole('heading', { name: '以时起局', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '起局', exact: true }).click();
  await expect(page.getByRole('region', { name: '项目说明', exact: true })).toContainText(
    '代码使用MIT',
  );
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 JSON', exact: true }).click();
  const file = await (await downloading).path();
  expect(file).toBeTruthy();
  const document = JSON.parse(await readFile(file!, 'utf8'));
  expect(document.format).toBe('qimen-dunjia');
  expect(document.chart.input).toEqual({
    year: 2026,
    month: 10,
    day: 28,
    hour: 12,
    minute: 0,
    second: 0,
  });
  await page.getByLabel('导入 JSON').setInputFiles(file!);
  await expect(page.getByRole('status')).toContainText('基础盘一致；辅助参数一致');
});
