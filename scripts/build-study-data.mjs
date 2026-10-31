import { assertStudyDirectory } from './study-data-files.mjs';
import { readFileSync, writeFileSync, mkdirSync, lstatSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { generateQimen } from '../packages/core/dist/index.js';
import { CLASSICAL_CASES } from '../packages/knowledge/dist/index.js';
import {
  buildGeneratedCase,
  indexStudyCase,
  GENERATOR_VERSION,
  DATASET_VERSION,
} from '../packages/cases/dist/index.js';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = join(root, 'apps/web/public/cases');
if (existsSync(out) && lstatSync(out).isSymbolicLink())
  throw new Error('Dataset output cannot be a symlink.');
assertStudyDirectory(out, false);
mkdirSync(join(out, 'chunks'), { recursive: true });
const key = (i) =>
  [i.year, i.month, i.day, i.hour, i.minute, i.second]
    .map((n, k) => String(n).padStart(k === 0 ? 4 : 2, '0'))
    .join('-');
const inputOf = (d) => ({
  year: d.getUTCFullYear(),
  month: d.getUTCMonth() + 1,
  day: d.getUTCDate(),
  hour: d.getUTCHours(),
  minute: d.getUTCMinutes(),
  second: d.getUTCSeconds(),
});
const around = (i, seconds) =>
  inputOf(
    new Date(Date.UTC(i.year, i.month - 1, i.day, i.hour, i.minute, i.second) + seconds * 1000),
  );
const parse = (t) => {
  const n = t.match(/\d+/g).map(Number);
  return { year: n[0], month: n[1], day: n[2], hour: n[3], minute: n[4], second: n[5] };
};
const selected = new Map(),
  boundaryInputs = [];
const add = (i) => selected.set(key(i), i);
const refs = JSON.parse(readFileSync(join(root, 'fixtures/reference-36.json'), 'utf8'));
for (const row of refs) add(row.input);
const terms = new Map();
for (let d = 1; d <= 365; d++) {
  const i = inputOf(new Date(Date.UTC(2026, 0, d, 12)));
  const c = generateQimen(i);
  terms.set(c.term.name, parse(c.term.startsAt));
}
for (const t of terms.values())
  for (const sec of [-1, 0, 1]) {
    const i = around(t, sec);
    add(i);
    boundaryInputs.push(i);
  }
for (const [day, hour, minute, second] of [
  [5, 22, 59, 59],
  [5, 23, 0, 0],
  [5, 23, 0, 1],
  [5, 23, 59, 59],
  [6, 0, 0, 0],
  [6, 0, 0, 1],
]) {
  const i = { year: 2026, month: 11, day, hour, minute, second };
  add(i);
  boundaryInputs.push(i);
}
const target = 10000 - CLASSICAL_CASES.length;
const candidates = [];
for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2027, 0, 1); t += 7200000)
  candidates.push(inputOf(new Date(t)));
for (let n = 0; n < target && selected.size < target; n++)
  add(candidates[Math.floor((n * candidates.length) / target)]);
for (const i of candidates) {
  if (selected.size >= target) break;
  add(i);
}
if (selected.size !== target) throw new Error('Synthetic selection count mismatch.');
const records = CLASSICAL_CASES.map((c) => ({
  schemaVersion: '1.0.0',
  datasetVersion: DATASET_VERSION,
  id: c.id,
  title: c.title,
  kind: 'classical',
  input: null,
  chart: null,
  annotationProfile: null,
  provenance: {
    sourceId: c.sourceId,
    locator: c.locator,
    method: c.summary,
    rights: c.rights,
    evidence: c.evidence,
  },
  outcome: null,
  suppliedConditions: c.suppliedConditions,
  replayStatus: 'unsupported',
}));
let n = 0;
for (const i of [...selected.values()].sort((a, b) => key(a).localeCompare(key(b), 'en')))
  records.push(buildGeneratedCase(i, `generated-${String(++n).padStart(5, '0')}`));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const index = {
  schemaVersion: '1.0.0',
  datasetVersion: DATASET_VERSION,
  counts: {
    total: records.length,
    generated: target,
    classical: CLASSICAL_CASES.length,
    reported: 0,
  },
  records: [],
  chunks: {},
};
const assets = [];
const coverage = { ju: new Set(), xun: new Set(), pairs: new Set(), marks: {} };
for (let start = 0; start < records.length; start += 100) {
  const chunk = `chunks/${String(start / 100).padStart(3, '0')}.json`;
  const group = records.slice(start, start + 100);
  const text = JSON.stringify(group) + '\n';
  writeFileSync(join(out, chunk), text);
  index.chunks[chunk] = { sha256: sha(text), records: group.length };
  assets.push({ path: chunk, bytes: Buffer.byteLength(text), sha256: sha(text) });
  for (const r of group) {
    const row = indexStudyCase(r, chunk);
    index.records.push(row);
    if (r.kind === 'generated') {
      coverage.ju.add(row.dun + row.ju);
      coverage.xun.add(row.xunShou);
      row.pairs.forEach((v) => coverage.pairs.add(v));
      row.marks.forEach((v) => (coverage.marks[v] = (coverage.marks[v] || 0) + 1));
    }
  }
}
const jsonl = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
const compressed = gzipSync(jsonl, { level: 9 });
writeFileSync(join(out, 'study-v1.jsonl.gz'), compressed);
assets.push({ path: 'study-v1.jsonl.gz', bytes: compressed.length, sha256: sha(compressed) });
const indexText = JSON.stringify(index) + '\n';
writeFileSync(join(out, 'index.json'), indexText);
assets.push({ path: 'index.json', bytes: Buffer.byteLength(indexText), sha256: sha(indexText) });
const manifest = {
  schemaVersion: '1.0.0',
  datasetVersion: DATASET_VERSION,
  generatorVersion: GENERATOR_VERSION,
  selection:
    '2024-2026 two-hour candidate grid, fixed reference inputs and exact boundaries, deterministic stratified fill; no wall clock',
  counts: index.counts,
  engineVersion: '0.1.0',
  calendarVersion: 'lunar-javascript@1.7.7',
  annotationProfile: 'shijia-common-annotations-v1/1.0.0',
  knowledgeVersion: 'shenqi-first-dual-v1',
  coverage: {
    derivedFromCurrentEngine: true,
    independentCorrectnessStandard: false,
    ju: [...coverage.ju].sort(),
    xun: [...coverage.xun].sort(),
    pairs: [...coverage.pairs].sort(),
    marks: coverage.marks,
  },
  boundaryInputs,
  license: 'Original records CC BY 4.0; third-party source rights separately registered',
  assets,
};
const manifestText = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync(join(out, 'manifest.json'), manifestText);
assets.push({ path: 'manifest.json', sha256: sha(manifestText) });
writeFileSync(
  join(out, 'SHA256SUMS'),
  assets.map((a) => `${a.sha256}  ${a.path}`).join('\n') + '\n',
);
assertStudyDirectory(out, true);
console.log(
  JSON.stringify(
    {
      counts: index.counts,
      coverage: { ju: coverage.ju.size, xun: coverage.xun.size, pairs: coverage.pairs.size },
      indexBytes: Buffer.byteLength(indexText),
      compressedBytes: compressed.length,
    },
    null,
    2,
  ),
);
