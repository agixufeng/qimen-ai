import test from 'node:test';
import assert from 'node:assert/strict';
import lunar from 'lunar-javascript';
import { execFileSync } from 'node:child_process';
import { generateQimen, shiftTime } from '../packages/core/src/index.js';
import type { QimenInput } from '../packages/core/src/index.js';
const toInput = (s: any): QimenInput => ({
  year: s.getYear(),
  month: s.getMonth(),
  day: s.getDay(),
  hour: s.getHour(),
  minute: s.getMinute(),
  second: s.getSecond(),
});
test('24 term boundaries use second precision; exact timestamp belongs to the new term', () => {
  const terms = lunar.Solar.fromYmdHms(2026, 6, 1, 12, 0, 0).getLunar().getJieQiTable();
  let count = 0;
  for (const [name, s] of Object.entries(terms) as [string, any][]) {
    if (!/^[\u4e00-\u9fff]{2}$/.test(name)) continue;
    const i = toInput(s);
    const a = generateQimen(shiftTime(i, -1 / 3600)),
      b = generateQimen(i),
      c = generateQimen(shiftTime(i, 1 / 3600));
    assert.notEqual(a.term.name, name, name + ' before');
    assert.equal(b.term.name, name, name + ' exact');
    assert.equal(c.term.name, name, name + ' after');
    if (name === '夏至') {
      assert.equal(a.dun, '阳遁');
      assert.equal(b.dun, '阴遁');
    }
    if (name === '冬至') {
      assert.equal(a.dun, '阴遁');
      assert.equal(b.dun, '阳遁');
    }
    count++;
  }
  assert.equal(count, 24);
});
test('odd-hour boundaries and midnight are handled without losing original date', () => {
  const start = { year: 2026, month: 10, day: 28, hour: 0, minute: 0, second: 0 };
  for (let hour = 1; hour < 24; hour += 2) {
    const exact = { ...start, hour };
    const a = generateQimen(shiftTime(exact, -1 / 3600)),
      b = generateQimen(exact);
    assert.notEqual(a.pillars.hour, b.pillars.hour);
  }
  const a = generateQimen({ ...start, hour: 23, minute: 59, second: 59 }),
    b = generateQimen({ ...start, day: 29 });
  assert.equal(a.pillars.day, b.pillars.day);
  assert.equal(a.pillars.hour, b.pillars.hour);
  assert.notEqual(a.input.day, b.input.day);
  for (const i of [
    { ...start, year: 1900, month: 1, day: 1 },
    { ...start, year: 2100, month: 12, day: 31, hour: 23, minute: 59, second: 59 },
  ])
    assert.equal(generateQimen(i).palaces.length, 9);
});
test('compiled Node engine output is invariant under process timezone', () => {
  const script =
    "import {generateQimen} from './packages/core/dist/index.js';console.log(JSON.stringify(generateQimen({year:2026,month:10,day:28,hour:23,minute:0,second:0})));";
  const result = (tz: string) =>
    execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: process.cwd(),
      env: { ...process.env, TZ: tz },
      encoding: 'utf8',
    });
  assert.equal(result('UTC'), result('America/New_York'));
  assert.equal(result('UTC'), result('Asia/Tokyo'));
});
