import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { generateQimen } from '../packages/core/src/index.js';
import { PalaceDetails } from '../apps/web/src/components/Board.js';
import { readSaved } from '../apps/web/src/helpers.js';

test('宫位详情分别展示主地盘组合和寄地盘组合', () => {
  const chart = generateQimen({ year: 2026, month: 3, day: 9, hour: 9, minute: 24, second: 0 });
  const palace = chart.palaces.find((p) => p.id === 2)!;
  assert.equal(palace.earthStem, '己');
  assert.deepEqual(palace.hostedEarthStems, ['壬']);
  const html = renderToStaticMarkup(createElement(PalaceDetails, { palace }));
  assert.match(html, /data-combination="丁-己"/);
  assert.match(html, /data-combination="丁-壬"/);
  assert.match(html, /寄地盘参考/);
});
test('读取存盘损坏JSON时保留错误，不能伪装为空存盘', () => {
  const result = readSaved(() => ({ getItem: () => '{broken-json' }));
  assert.match(result.loadError ?? '', /读取/);
  assert.deepEqual(result.items, []);
});
test('读取存盘SecurityError时保留错误', () => {
  const result = readSaved(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  assert.match(result.loadError ?? '', /读取/);
  assert.deepEqual(result.items, []);
});
test('部分畸形存盘不静默筛除，避免下次保存覆盖不可读记录', () => {
  const result = readSaved(() => ({
    getItem: () => JSON.stringify([{ id: 'a', document: '{}', time: 'x', note: '' }, { id: 'b' }]),
  }));
  assert.match(result.loadError ?? '', /读取/);
});
test('正常空存盘和正常存盘可读取', () => {
  assert.deepEqual(
    readSaved(() => ({ getItem: () => null })),
    { items: [], loadError: null },
  );
  const items = [{ id: 'a', document: '{}', time: '2026-10-28', note: 'note' }];
  assert.deepEqual(
    readSaved(() => ({ getItem: () => JSON.stringify(items) })),
    { items, loadError: null },
  );
});
