import {
  generateQimen,
  analyzeChart,
  detectPatterns,
  importChart,
  DEFAULT_ANNOTATION_PROFILE,
} from '@qimen/core';
import type { QimenInput } from '@qimen/core';
import type { StudyCase, StudyIndexEntry, ReplayResult } from './types.js';
export * from './types.js';
export const DATASET_VERSION = 'study-v1';
export const GENERATOR_VERSION = 'study-generator-v1/1.0.0';
const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? '[' + v.map(canonical).join(',') + ']'
    : v && typeof v === 'object'
      ? '{' +
        Object.entries(v)
          .sort(([a], [b]) => a.localeCompare(b, 'en'))
          .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
          .join(',') +
        '}'
      : JSON.stringify(v);
export function assertStudyCase(value: unknown): asserts value is StudyCase {
  const r = value as StudyCase;
  if (
    !r ||
    r.schemaVersion !== '1.0.0' ||
    r.datasetVersion !== DATASET_VERSION ||
    typeof r.id !== 'string' ||
    !/^[a-z0-9-]+$/.test(r.id) ||
    typeof r.title !== 'string' ||
    r.title.length > 300 ||
    !['generated', 'classical', 'reported'].includes(r.kind) ||
    !['supported', 'unsupported'].includes(r.replayStatus)
  )
    throw new Error('不支持的盘例格式或版本。');
  if (
    !r.provenance ||
    ['sourceId', 'locator', 'method', 'rights'].some(
      (k) => typeof r.provenance[k as keyof typeof r.provenance] !== 'string',
    ) ||
    !Array.isArray(r.suppliedConditions) ||
    r.suppliedConditions.some((s) => typeof s !== 'string')
  )
    throw new Error('盘例缺少来源或输入依据。');
  if (
    r.kind === 'generated' &&
    (r.provenance.evidence !== 'generated' ||
      r.outcome !== null ||
      !r.input ||
      !r.chart ||
      !r.annotationProfile ||
      r.replayStatus !== 'supported')
  )
    throw new Error('程序盘例不得带真实反馈或缺少可重放输入。');
  if (
    r.kind === 'classical' &&
    (r.provenance.evidence !== 'hypothetical' ||
      r.outcome !== null ||
      r.input !== null ||
      r.chart !== null ||
      r.annotationProfile !== null ||
      r.replayStatus !== 'unsupported')
  )
    throw new Error('本版古籍教学例不可补造日期或反馈。');
  if (
    r.kind === 'reported' &&
    (r.provenance.evidence !== 'source-reported' ||
      !r.outcome ||
      typeof r.outcome.text !== 'string' ||
      !r.outcome.sourceId ||
      !r.outcome.locator)
  )
    throw new Error('来源自述占验须登记实际反馈出处。');
  if (
    r.replayStatus === 'supported' &&
    (!r.input ||
      !r.chart ||
      !r.annotationProfile ||
      canonical(r.input) !== canonical(r.chart.input))
  )
    throw new Error('盘例输入与盘面输入不一致。');
}
export function buildGeneratedCase(input: QimenInput, id: string): StudyCase {
  const chart = generateQimen(input);
  const record: StudyCase = {
    schemaVersion: '1.0.0',
    datasetVersion: DATASET_VERSION,
    id,
    title: `程序盘例 · ${chart.dun}${chart.ju}局`,
    kind: 'generated',
    input: { ...input },
    chart,
    annotationProfile: { ...DEFAULT_ANNOTATION_PROFILE },
    provenance: {
      sourceId: 'project-profile',
      locator: `${GENERATOR_VERSION} / ${id}`,
      method: '固定种子候选选择与当前引擎计算；是研习程序输出，不是独立算法标准或真实占验。',
      rights: '原创程序盘例 CC BY 4.0；计算代码 MIT。',
      evidence: 'generated',
      generatorVersion: GENERATOR_VERSION,
    },
    outcome: null,
    suppliedConditions: ['公历输入为公开合成示例；固定UTC+8，无个人问事或真实结果。'],
    replayStatus: 'supported',
  };
  assertStudyCase(record);
  return record;
}
export function indexStudyCase(record: StudyCase, chunk: string): StudyIndexEntry {
  assertStudyCase(record);
  if (!/^chunks\/\d{3}\.json$/.test(chunk)) throw new Error('盘例分块路径不受支持。');
  const basic = {
    id: record.id,
    title: record.title,
    kind: record.kind,
    timestamp: null as string | null,
    pairs: [] as string[],
    marks: [] as string[],
    chunk,
  };
  if (!record.chart || !record.input) return basic;
  const c = record.chart,
    a = analyzeChart(c, record.annotationProfile!);
  const pairs = new Set<string>(),
    marks = new Set<string>();
  for (const p of c.palaces)
    for (const h of p.heavenStems)
      for (const e of [p.earthStem, ...p.hostedEarthStems]) pairs.add(h + e);
  for (const p of a.palaces) {
    for (const b of p.voids.hour ?? []) {
      marks.add('时空');
      marks.add('时空·' + b);
    }
    if (p.horses.includes('hour')) {
      marks.add('时马');
      marks.add('时马·' + a.pillars.hour.horseBranch);
    }
    if (p.horses.includes('hour') && p.voids.hour?.length) marks.add('空马同宫');
    for (const s of p.stems.filter((s) => s.layer === 'heaven')) {
      if (s.punishment) marks.add('击刑');
      if (s.tombBranches.length) marks.add('入墓');
    }
  }
  for (const p of detectPatterns(c)) marks.add(p.name);
  if (c.chiefStar.origin === 5) marks.add('旬首入中');
  if (c.chiefDoor.rawPalace === 5) marks.add('值使入中');
  const i = record.input,
    pad = (n: number) => String(n).padStart(2, '0');
  return {
    ...basic,
    timestamp: `${i.year}-${pad(i.month)}-${pad(i.day)} ${pad(i.hour)}:${pad(i.minute)}:${pad(i.second)} UTC+8`,
    dun: c.dun,
    ju: c.ju,
    xunShou: c.xunShou,
    pairs: [...pairs].sort(),
    marks: [...marks].sort(),
  };
}
export function replayStudyCase(record: StudyCase, expectedIndex?: StudyIndexEntry): ReplayResult {
  try {
    assertStudyCase(record);
    if (
      expectedIndex &&
      canonical(indexStudyCase(record, expectedIndex.chunk)) !== canonical(expectedIndex)
    )
      throw new Error('索引与盘例内容不一致。');
    if (record.replayStatus === 'unsupported')
      return {
        supported: false,
        baseMatches: null,
        chart: null,
        annotations: null,
        reason: '本条缺少可核且兼容当前规则的公历输入；保留来源条件，不补日期重排。',
      };
    const fresh = importChart(
      JSON.stringify({ format: 'qimen-dunjia', version: 1, chart: record.chart }),
    );
    const annotations = analyzeChart(fresh.chart, record.annotationProfile!);
    return { supported: true, baseMatches: fresh.baseMatches, chart: fresh.chart, annotations };
  } catch (e) {
    return {
      supported: false,
      baseMatches: null,
      chart: null,
      annotations: null,
      reason: e instanceof Error ? e.message : '盘例无法重放。',
    };
  }
}
