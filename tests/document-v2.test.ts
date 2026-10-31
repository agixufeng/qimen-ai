import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  generateQimen,
  analyzeChart,
  DEFAULT_DISPLAY_OPTIONS,
  exportChart,
  importChart,
  chartToSvg,
} from '../packages/core/src/index.js';
const input = { year: 2026, month: 10, day: 28, hour: 12, minute: 0, second: 0 };
test('v2 document stores complete annotations and presentation separately', () => {
  const c = generateQimen(input),
    a = analyzeChart(c);
  const o = {
    ...DEFAULT_DISPLAY_OPTIONS,
    mode: 'professional' as const,
    dayVoid: true,
    dayHorse: true,
    earthReference: true,
  };
  const doc = JSON.parse(exportChart(c, '公开演示', o));
  assert.equal(doc.version, 2);
  assert.deepEqual(doc.annotations, a);
  assert.deepEqual(doc.displayOptions, o);
  const r = importChart(JSON.stringify(doc));
  assert.equal(r.baseMatches, true);
  assert.equal(r.annotationsMatch, true);
  assert.equal(r.legacy, false);
  assert.equal(r.matches, true);
  assert.deepEqual(r.displayOptions, o);
});
test('v1 import compares only original chart and explicitly reports newly added annotations', () => {
  const text = readFileSync(new URL('../fixtures/legacy-v01.json', import.meta.url), 'utf8'),
    r = importChart(text);
  assert.equal(r.baseMatches, true);
  assert.equal(r.annotationsMatch, null);
  assert.equal(r.legacy, true);
  assert.equal(r.matches, true);
  assert.deepEqual(r.annotations, analyzeChart(r.chart));
  assert.equal(r.note, '公开兼容性演示');
});
test('tampering only annotations does not falsely fail base or silently accept auxiliary results', () => {
  const doc = JSON.parse(exportChart(generateQimen(input)));
  doc.annotations.pillars.hour.horseBranch = '巳';
  const r = importChart(JSON.stringify(doc));
  assert.equal(r.baseMatches, true);
  assert.equal(r.annotationsMatch, false);
  assert.equal(r.matches, false);
  assert.equal(r.annotations.pillars.hour.horseBranch, '申');
  doc.chart.ju = 9;
  const changed = importChart(JSON.stringify(doc));
  assert.equal(changed.baseMatches, false);
});
test('v2 rejects unknown annotation versions and invalid display options', () => {
  const doc = JSON.parse(exportChart(generateQimen(input)));
  doc.annotations.profile.version = '99';
  assert.throws(() => importChart(JSON.stringify(doc)));
  const other = JSON.parse(exportChart(generateQimen(input)));
  other.displayOptions.dayHorse = 'false';
  assert.throws(() => importChart(JSON.stringify(other)));
  const third = JSON.parse(exportChart(generateQimen(input)));
  third.annotations.schemaVersion = '99';
  assert.throws(() => importChart(JSON.stringify(third)));
  assert.throws(() => importChart('null'));
  assert.throws(() => importChart('[]'));
});
test('SVG includes only selected marks plus provenance, never notes or unselected daily flags', () => {
  const c = generateQimen(input),
    svg = chartToSvg(c);
  assert.match(svg, /时空/);
  assert.match(svg, /时马/);
  assert.doesNotMatch(svg, /日马/);
  assert.match(svg, /墓/);
  assert.match(svg, /注解/);
  const pro = chartToSvg(c, {
    ...DEFAULT_DISPLAY_OPTIONS,
    mode: 'professional',
    dayHorse: true,
    dayVoid: true,
    earthReference: true,
  });
  assert.match(pro, /日马/);
  assert.match(pro, /日空/);
  assert.match(pro, /未:墓/);
  assert.match(pro, /申:死/);
  assert.match(pro, /内盘|外盘/);
  assert.match(pro, /星.*相|星.*囚|星.*废/);
  assert.doesNotMatch(pro, /公开演示/);
});
