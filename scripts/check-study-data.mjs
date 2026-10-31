import { assertStudyDirectory } from './study-data-files.mjs';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { validateStudyCollection } from '../packages/cases/dist/validate.js';
export function checkStudyData(dir) {
  assertStudyDirectory(dir, true);
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.schemaVersion, '1.0.0');
  assert.equal(manifest.datasetVersion, 'study-v1');
  assert.equal(manifest.engineVersion, '0.1.0');
  assert.equal(manifest.generatorVersion, 'study-generator-v1/1.0.0');
  assert.equal(manifest.annotationProfile, 'shijia-common-annotations-v1/1.0.0');
  const sha = (p) =>
    createHash('sha256')
      .update(readFileSync(join(dir, p)))
      .digest('hex');
  const expected = new Set([
    'index.json',
    'study-v1.jsonl.gz',
    ...Array.from({ length: 100 }, (_, n) => `chunks/${String(n).padStart(3, '0')}.json`),
  ]);
  assert.equal(manifest.assets.length, expected.size);
  for (const a of manifest.assets) {
    assert.ok(expected.delete(a.path), 'Unknown/duplicate asset');
    assert.equal(sha(a.path), a.sha256);
    assert.equal(readFileSync(join(dir, a.path)).length, a.bytes);
  }
  assert.equal(expected.size, 0);
  const lines = readFileSync(join(dir, 'SHA256SUMS'), 'utf8').trim().split('\n');
  const declared = new Set();
  for (const line of lines) {
    const m = /^([a-f0-9]{64})  (.+)$/.exec(line);
    assert.ok(m);
    assert.ok(m[2] === 'manifest.json' || manifest.assets.some((a) => a.path === m[2]));
    assert.ok(!declared.has(m[2]));
    declared.add(m[2]);
    assert.equal(sha(m[2]), m[1]);
  }
  assert.equal(declared.size, manifest.assets.length + 1);
  const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')),
    records = [];
  for (const [path, meta] of Object.entries(index.chunks)) {
    assert.match(path, /^chunks\/\d{3}\.json$/);
    assert.equal(sha(path), meta.sha256);
    const chunk = JSON.parse(readFileSync(join(dir, path), 'utf8'));
    assert.equal(chunk.length, meta.records);
    records.push(...chunk);
  }
  const jsonl = gunzipSync(readFileSync(join(dir, 'study-v1.jsonl.gz')))
    .toString('utf8')
    .trimEnd()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(JSON.stringify(jsonl), JSON.stringify(records), 'JSONL and web chunks differ');
  const terms = new Map();
  for (const r of records.filter((r) => r.kind === 'generated')) {
    assert.equal(r.chart.calendarVersion, manifest.calendarVersion);
    assert.equal(r.provenance.generatorVersion, manifest.generatorVersion);
    if (r.chart.term.startsAt.startsWith('2026'))
      terms.set(r.chart.term.name, r.chart.term.startsAt);
  }
  assert.equal(terms.size, 24, 'Missing term coverage');
  const coverage = validateStudyCollection(index, records);
  assert.deepEqual(coverage.counts, { total: 10000, generated: 9998, classical: 2, reported: 0 });
  assert.deepEqual(coverage.counts, manifest.counts);
  assert.equal(coverage.ju.length, 18);
  assert.equal(coverage.xun.length, 6);
  assert.equal(coverage.pairs.length, 81);
  for (const key of ['ju', 'xun', 'pairs', 'marks'])
    assert.deepEqual(coverage[key], manifest.coverage[key]);
  assert.equal(manifest.coverage.derivedFromCurrentEngine, true);
  assert.equal(manifest.coverage.independentCorrectnessStandard, false);
  const inputSet = new Set(records.filter((r) => r.input).map((r) => JSON.stringify(r.input)));
  assert.ok(manifest.boundaryInputs.length >= 78);
  for (const input of manifest.boundaryInputs)
    assert.ok(inputSet.has(JSON.stringify(input)), 'Boundary case absent');
  const wallInput = (t) => {
    const n = t.match(/\d+/g).map(Number);
    return { year: n[0], month: n[1], day: n[2], hour: n[3], minute: n[4], second: n[5] };
  };
  for (const stamp of terms.values()) {
    const t = wallInput(stamp);
    for (const second of [-1, 0, 1]) {
      const d = new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second + second));
      const expected = {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
        second: d.getUTCSeconds(),
      };
      assert.ok(inputSet.has(JSON.stringify(expected)), 'Exact term boundary absent');
    }
  }
  for (const [day, hour, minute, second] of [
    [5, 22, 59, 59],
    [5, 23, 0, 0],
    [5, 23, 0, 1],
    [5, 23, 59, 59],
    [6, 0, 0, 0],
    [6, 0, 0, 1],
  ])
    assert.ok(
      inputSet.has(JSON.stringify({ year: 2026, month: 11, day, hour, minute, second })),
      '23/midnight boundary absent',
    );

  for (const m of [
    '击刑',
    '入墓',
    '空马同宫',
    '星伏吟',
    '门伏吟',
    '星反吟',
    '门反吟',
    '旬首入中',
    '值使入中',
  ])
    assert.ok(coverage.marks[m] > 0, m);
  return {
    records: records.length,
    counts: coverage.counts,
    ju: coverage.ju.length,
    xun: coverage.xun.length,
    pairs: coverage.pairs.length,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(
    JSON.stringify(
      checkStudyData(resolve(fileURLToPath(new URL('../apps/web/public/cases', import.meta.url)))),
      null,
      2,
    ),
  );
