import { assertStudyCase, indexStudyCase, replayStudyCase } from './index.js';
import type { StudyCase, StudyIndex } from './types.js';
export function validateStudyCollection(
  index: StudyIndex,
  records: StudyCase[],
  expectedTotal = 10000,
) {
  if (
    index.schemaVersion !== '1.0.0' ||
    index.datasetVersion !== 'study-v1' ||
    records.length !== expectedTotal ||
    index.counts.total !== expectedTotal ||
    index.records.length !== expectedTotal
  )
    throw new Error('Dataset version/count mismatch.');
  const counts = { total: records.length, generated: 0, classical: 0, reported: 0 };
  const ids = new Set<string>(),
    inputs = new Set<string>();
  const rows = new Map(index.records.map((r) => [r.id, r]));
  if (rows.size !== records.length) throw new Error('Duplicate index IDs.');
  const chunks = new Map<string, number>(),
    ju = new Set<string>(),
    xun = new Set<string>(),
    pairs = new Set<string>(),
    marks: Record<string, number> = {};
  for (const r of records) {
    assertStudyCase(r);
    if (ids.has(r.id)) throw new Error('Duplicate record IDs.');
    ids.add(r.id);
    counts[r.kind]++;
    const row = rows.get(r.id);
    if (!row) throw new Error('Index record missing.');
    const replay = replayStudyCase(r, row);
    if (r.replayStatus === 'supported' && (!replay.supported || replay.baseMatches !== true))
      throw new Error('Stored chart/input/index differs from replay.');
    if (r.replayStatus === 'unsupported' && (replay.supported || replay.baseMatches !== null))
      throw new Error('Unsupported record was incorrectly replayed.');
    const derived = indexStudyCase(r, row.chunk);
    if (JSON.stringify(derived) !== JSON.stringify(row)) throw new Error('Index data mismatch.');
    chunks.set(row.chunk, (chunks.get(row.chunk) || 0) + 1);
    if (r.kind === 'generated') {
      const i = r.input!,
        p = r.chart!.profile,
        a = r.annotationProfile!;
      const key = JSON.stringify([
        i.year,
        i.month,
        i.day,
        i.hour,
        i.minute,
        i.second,
        r.chart!.engineVersion,
        r.chart!.calendarVersion,
        p.id,
        p.version,
        p.offsetMinutes,
        p.dayBoundary,
        p.centerHost,
        a.id,
        a.version,
        a.growth,
        a.starStrength,
        a.monthBasis,
      ]);
      if (inputs.has(key)) throw new Error('Duplicate generated input/rules.');
      inputs.add(key);
      ju.add(row.dun + String(row.ju));
      xun.add(row.xunShou!);
      row.pairs.forEach((p) => pairs.add(p));
      row.marks.forEach((m) => (marks[m] = (marks[m] || 0) + 1));
    }
  }
  for (const kind of ['generated', 'classical', 'reported'] as const)
    if (counts[kind] !== index.counts[kind]) throw new Error('Evidence-type counts mismatch.');
  if (chunks.size !== Object.keys(index.chunks).length)
    throw new Error('Chunk inventory mismatch.');
  for (const [path, n] of chunks)
    if (index.chunks[path]?.records !== n || !/^[a-f0-9]{64}$/.test(index.chunks[path]?.sha256))
      throw new Error('Chunk metadata mismatch.');
  return { counts, ju: [...ju].sort(), xun: [...xun].sort(), pairs: [...pairs].sort(), marks };
}
