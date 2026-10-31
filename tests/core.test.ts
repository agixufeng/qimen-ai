import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateQimen,
  DEFAULT_PROFILE,
  detectPatterns,
  exportChart,
  importChart,
  shiftTime,
  chartToSvg,
} from '../packages/core/src/index.js';
const noon = { year: 2026, month: 10, day: 28, hour: 12, minute: 0, second: 0 };
test('2026-10-28 fixed UTC+8 calendar and lower-yuan frost descent', () => {
  const c = generateQimen(noon);
  assert.deepEqual(c.pillars, { year: '丙午', month: '戊戌', day: '乙亥', hour: '壬午' });
  assert.equal(c.term.name, '霜降');
  assert.equal(c.yuan, '下元');
  assert.equal(c.fuTou, '甲戌');
  assert.equal(c.ju, 2);
  assert.equal(c.dun, '阴遁');
  assert.equal(c.xunShou, '甲戌');
  assert.equal(c.hiddenStem, '己');
});
test('23:00 changes day and hour stem without moving actual solar term', () => {
  const before = generateQimen({ ...noon, hour: 22, minute: 59, second: 59 });
  const after = generateQimen({ ...noon, hour: 23 });
  assert.equal(before.pillars.day, '乙亥');
  assert.equal(after.pillars.day, '丙子');
  assert.equal(after.pillars.hour, '戊子');
  assert.deepEqual(after.input, { ...noon, hour: 23 });
  assert.deepEqual(after.term, before.term);
});
test('2024 Lichun starts exactly at 16:27:07, independently preserved clock', () => {
  const i = { year: 2024, month: 2, day: 4, hour: 16, minute: 27, second: 6 };
  assert.equal(generateQimen(i).term.name, '大寒');
  assert.equal(generateQimen({ ...i, second: 7 }).term.name, '立春');
  assert.equal(generateQimen({ ...i, second: 8 }).term.name, '立春');
  assert.equal(generateQimen(i).pillars.year, '癸卯');
  assert.equal(generateQimen({ ...i, second: 7 }).pillars.year, '甲辰');
});
test('invalid values rejected rather than silently normalized', () => {
  for (const p of [
    { year: 1899 },
    { year: 2101 },
    { month: 13 },
    { month: 2, day: 30 },
    { year: 1900, month: 2, day: 29 },
    { hour: 24 },
    { minute: 60 },
    { second: 1.5 },
    { hour: NaN },
    { year: '2026' },
    { month: null },
  ])
    assert.throws(() => generateQimen({ ...noon, ...p } as any));
  assert.doesNotThrow(() => generateQimen({ ...noon, year: 2000, month: 2, day: 29 }));
  assert.throws(() => generateQimen(noon, { ...DEFAULT_PROFILE, centerHost: 8 } as any));
});
test('all nine earth stems and hosted center kept separate', () => {
  const c = generateQimen(noon);
  assert.equal(c.palaces.length, 9);
  assert.equal(new Set(c.palaces.map((p) => p.earthStem)).size, 9);
  assert.equal(c.palaces.flatMap((p) => p.heavenStems).length, 9);
  assert.equal(new Set(c.palaces.flatMap((p) => p.heavenStems)).size, 9);
  assert.equal(c.palaces.flatMap((p) => p.stars).length, 9);
  assert.equal(c.palaces.filter((p) => p.door).length, 8);
  assert.equal(c.palaces.filter((p) => p.deity).length, 8);
  assert.equal(c.palaces.find((p) => p.id === 5)?.heavenStems.length, 0);
  assert.deepEqual(c.palaces.find((p) => p.id === 2)?.hostedEarthStems, [
    c.palaces.find((p) => p.id === 5)?.earthStem,
  ]);
});
test('document replay compares results and rejects unknown profiles and schemas', () => {
  const c = generateQimen(noon),
    t = exportChart(c, '示例备注');
  const r = importChart(t);
  assert.deepEqual(r.chart, c);
  assert.equal(r.matches, true);
  assert.equal(r.note, '示例备注');
  let d = JSON.parse(t);
  d.chart.palaces[0].earthStem = '乙';
  assert.equal(importChart(JSON.stringify(d)).matches, false);
  d = JSON.parse(t);
  d.chart.profile.version = '2.0.0';
  assert.throws(() => importChart(JSON.stringify(d)));
  d = JSON.parse(t);
  d.version = 999;
  assert.throws(() => importChart(JSON.stringify(d)));
  d = JSON.parse(t);
  d.chart.engineVersion = '9.0.0';
  assert.throws(() => importChart(JSON.stringify(d)));
  assert.throws(() => importChart('{}'));
  assert.throws(() => importChart('bad'));
});
test('time navigation and SVG preserve exact calendar and exclude notes', () => {
  const i = { year: 2026, month: 12, day: 31, hour: 23, minute: 12, second: 34 };
  assert.deepEqual(shiftTime(i, 2), {
    year: 2027,
    month: 1,
    day: 1,
    hour: 1,
    minute: 12,
    second: 34,
  });
  const c = generateQimen(noon),
    svg = chartToSvg(c);
  assert.match(svg, /<svg/);
  assert.match(svg, /UTC\+8/);
  assert.match(svg, /天盘/);
  assert.doesNotMatch(svg, /示例备注/);
});
test('pattern hits expose a source and explicit palace evidence', () => {
  const c = generateQimen(noon);
  for (const h of detectPatterns(c)) {
    assert.ok(h.ruleId);
    assert.ok(h.sourceId);
    assert.ok(h.palaceIds.length);
    assert.ok(h.explanation);
  }
});
