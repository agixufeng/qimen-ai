import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGeneratedCase,
  indexStudyCase,
  replayStudyCase,
  assertStudyCase,
} from '../packages/cases/src/index.js';
const input = { year: 2026, month: 10, day: 28, hour: 12, minute: 0, second: 0 };
test('synthetic cases preserve explicit evidence and replayable chart, never invent outcomes', () => {
  const c = buildGeneratedCase(input, 'generated-00001');
  assert.equal(c.kind, 'generated');
  assert.equal(c.outcome, null);
  assert.equal(c.provenance.evidence, 'generated');
  const row = indexStudyCase(c, 'chunks/000.json');
  assert.equal(row.timestamp, '2026-10-28 12:00:00 UTC+8');
  assert.ok(row.marks.includes('入墓'));
  assert.ok(row.pairs.length > 0);
  assert.equal(replayStudyCase(c, row).baseMatches, true);
});
test('replay binds record input and index to the actual chart', () => {
  const c = buildGeneratedCase(input, 'generated-00001');
  const row = indexStudyCase(c, 'chunks/000.json');
  c.input = { ...input, hour: 14 };
  assert.equal(replayStudyCase(c, row).supported, false);
  const d = buildGeneratedCase(input, 'generated-00001');
  assert.equal(replayStudyCase(d, { ...row, title: 'wrong' }).supported, false);
  d.chart!.ju = 9;
  assert.equal(replayStudyCase(d).baseMatches, false);
});
test('unknown versions, malformed evidence and source paths are not silently accepted', () => {
  const c = buildGeneratedCase(input, 'generated-00001');
  assert.throws(() => indexStudyCase(c, 'https://bad.test/chunk.json'));
  assert.throws(() => indexStudyCase(c, '../chunks/000.json'));
  c.provenance.evidence = 'hypothetical';
  assert.throws(() => assertStudyCase(c));
  const d = buildGeneratedCase(input, 'generated-00001');
  (d as any).datasetVersion = 'future';
  assert.equal(replayStudyCase(d).supported, false);
});

import { validateStudyCollection } from '../packages/cases/src/validate.js';
import type { StudyIndex } from '../packages/cases/src/types.js';
function collection() {
  const records = [
    buildGeneratedCase(input, 'generated-00001'),
    buildGeneratedCase({ ...input, hour: 14 }, 'generated-00002'),
  ];
  const index: StudyIndex = {
    schemaVersion: '1.0.0',
    datasetVersion: 'study-v1',
    counts: { total: 2, generated: 2, classical: 0, reported: 0 },
    records: records.map((r) => indexStudyCase(r, 'chunks/000.json')),
    chunks: { 'chunks/000.json': { sha256: 'a'.repeat(64), records: 2 } },
  };
  return { index, records };
}
test('collection validation rejects dropped, duplicated, relabelled or mismatched records', () => {
  const { index, records } = collection();
  assert.equal(validateStudyCollection(index, records, 2).counts.generated, 2);
  assert.throws(() => validateStudyCollection(index, records.slice(1), 2));
  assert.throws(() => validateStudyCollection(index, [records[0], records[0]], 2));
  const d = collection();
  d.records[0].kind = 'reported';
  assert.throws(() => validateStudyCollection(d.index, d.records, 2));
  const e = collection();
  e.index.records[0].timestamp = 'wrong';
  assert.throws(() => validateStudyCollection(e.index, e.records, 2));
  const f = collection();
  f.records[1] = buildGeneratedCase(input, 'generated-00002');
  f.index.records[1] = indexStudyCase(f.records[1], 'chunks/000.json');
  assert.throws(() => validateStudyCollection(f.index, f.records, 2));
});

test('semantic duplicate inputs cannot evade deduplication by changing JSON key order', () => {
  const { index, records } = collection();
  records[1] = buildGeneratedCase(
    { second: 0, minute: 0, hour: 12, day: 28, month: 10, year: 2026 },
    'generated-00002',
  );
  index.records[1] = indexStudyCase(records[1], 'chunks/000.json');
  assert.throws(() => validateStudyCollection(index, records, 2), /Duplicate generated/);
});
