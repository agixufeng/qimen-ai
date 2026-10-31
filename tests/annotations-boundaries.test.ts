import test from 'node:test';
import assert from 'node:assert/strict';
import lunar from 'lunar-javascript';
import { generateQimen } from '../packages/core/src/engine.js';
import { shiftTime } from '../packages/core/src/calendar.js';
import { analyzeChart } from '../packages/core/src/annotations.js';
import type { QimenInput } from '../packages/core/src/types.js';

const toInput = (s: any): QimenInput => ({
  year: s.getYear(),
  month: s.getMonth(),
  day: s.getDay(),
  hour: s.getHour(),
  minute: s.getMinute(),
  second: s.getSecond(),
});
// Library is used solely to locate astronomical timestamps, never for annotation expected values.
const terms = lunar.Solar.fromYmdHms(2026, 6, 1, 12, 0, 0).getLunar().getJieQiTable();
const jie = [
  ['立春', '丑', '寅', '土', '木'],
  ['惊蛰', '寅', '卯', '木', '木'],
  ['清明', '卯', '辰', '木', '土'],
  ['立夏', '辰', '巳', '土', '火'],
  ['芒种', '巳', '午', '火', '火'],
  ['小暑', '午', '未', '火', '土'],
  ['立秋', '未', '申', '土', '金'],
  ['白露', '申', '酉', '金', '金'],
  ['寒露', '酉', '戌', '金', '土'],
  ['立冬', '戌', '亥', '土', '水'],
  ['大雪', '亥', '子', '水', '水'],
  ['小寒', '子', '丑', '水', '土'],
] as const;
for (const [name, prevBranch, nextBranch, prevElement, nextElement] of jie) {
  test(`${name}: solar month switches exactly at second, independently of element equality`, () => {
    assert.ok(terms[name], `missing timestamp ${name}`);
    const instant = toInput(terms[name]);
    const before = analyzeChart(generateQimen(shiftTime(instant, -1 / 3600)));
    const exact = analyzeChart(generateQimen(instant));
    const after = analyzeChart(generateQimen(shiftTime(instant, 1 / 3600)));
    assert.equal(before.monthBranch, prevBranch);
    assert.equal(before.monthElement, prevElement);
    assert.equal(exact.monthBranch, nextBranch);
    assert.equal(exact.monthElement, nextElement);
    assert.equal(after.monthBranch, nextBranch);
    assert.equal(after.monthElement, nextElement);
    for (const a of [before, exact, after]) {
      for (const p of a.palaces) {
        assert.equal(p.palaceStrength.monthElement, a.monthElement);
        for (const star of p.stars) assert.equal(star.monthElement, a.monthElement);
        if (p.doorStrength) assert.equal(p.doorStrength.monthElement, a.monthElement);
      }
    }
  });
}
const qi = [
  ['雨水', '寅'],
  ['春分', '卯'],
  ['谷雨', '辰'],
  ['小满', '巳'],
  ['夏至', '午'],
  ['大暑', '未'],
  ['处暑', '申'],
  ['秋分', '酉'],
  ['霜降', '戌'],
  ['小雪', '亥'],
  ['冬至', '子'],
  ['大寒', '丑'],
] as const;
for (const [name, branch] of qi) {
  test(`${name}: middle term does not change annotation month`, () => {
    assert.ok(terms[name]);
    const instant = toInput(terms[name]);
    for (const seconds of [-1, 0, 1]) {
      assert.equal(
        analyzeChart(generateQimen(shiftTime(instant, seconds / 3600))).monthBranch,
        branch,
      );
    }
  });
}
test('23:00 crossing a xun updates day void, while midnight does not repeat the change', () => {
  const i = { year: 2026, month: 11, day: 5, hour: 23, minute: 0, second: 0 };
  const before = analyzeChart(generateQimen(shiftTime(i, -1 / 3600)));
  const exact = analyzeChart(generateQimen(i));
  const midnight = analyzeChart(generateQimen({ ...i, day: 6, hour: 0 }));
  assert.equal(before.pillars.day.ganzhi, '癸未');
  assert.deepEqual(before.pillars.day.voidBranches, ['申', '酉']);
  assert.equal(exact.pillars.day.ganzhi, '甲申');
  assert.deepEqual(exact.pillars.day.voidBranches, ['午', '未']);
  assert.deepEqual(midnight.pillars.day, exact.pillars.day);
  assert.deepEqual(midnight.pillars.hour, exact.pillars.hour);
});
test('23:00 day change within the same xun must NOT invent a day-void change', () => {
  const i = { year: 2026, month: 10, day: 28, hour: 23, minute: 0, second: 0 };
  const before = analyzeChart(generateQimen(shiftTime(i, -1 / 3600)));
  const exact = analyzeChart(generateQimen(i));
  assert.equal(before.pillars.day.ganzhi, '乙亥');
  assert.equal(exact.pillars.day.ganzhi, '丙子');
  assert.deepEqual(before.pillars.day.voidBranches, ['申', '酉']);
  assert.deepEqual(exact.pillars.day.voidBranches, ['申', '酉']);
  assert.equal(before.pillars.day.horseBranch, '巳');
  assert.equal(exact.pillars.day.horseBranch, '寅');
});
test('day/hour void and horse remain separately labelled when they disagree', () => {
  const a = analyzeChart(
    generateQimen({ year: 2026, month: 10, day: 28, hour: 0, minute: 0, second: 0 }),
  );
  assert.equal(a.pillars.day.ganzhi, '乙亥');
  assert.equal(a.pillars.hour.ganzhi, '丙子');
  // They share a xun here, but have different horse branches; this is not a global 空马 slot.
  assert.deepEqual(a.pillars.day.voidBranches, ['申', '酉']);
  assert.equal(a.pillars.day.horseBranch, '巳');
  assert.equal(a.pillars.hour.horseBranch, '寅');
  const b = analyzeChart(
    generateQimen({ year: 2026, month: 10, day: 28, hour: 22, minute: 0, second: 0 }),
  );
  assert.equal(b.pillars.hour.ganzhi, '丁亥');
  assert.deepEqual(b.pillars.day.voidBranches, ['申', '酉']);
  assert.deepEqual(b.pillars.hour.voidBranches, ['午', '未']);
});
