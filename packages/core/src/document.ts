import { generateQimen, assertProfile } from './engine.js';
import { ENGINE_VERSION, CALENDAR_VERSION } from './constants.js';
import type { QimenChart, ChartDocument, ImportResult } from './types.js';
import type { DisplayOptions, ChartDocumentV2 } from './annotation-types.js';
import {
  analyzeChart,
  assertAnnotationProfile,
  validateDisplayOptions,
  DEFAULT_DISPLAY_OPTIONS,
} from './annotations.js';
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
export function exportChart(
  chart: QimenChart,
  note?: string,
  displayOptions: DisplayOptions = DEFAULT_DISPLAY_OPTIONS,
): string {
  const doc: ChartDocumentV2 = {
    format: 'qimen-dunjia',
    version: 2,
    chart,
    annotations: analyzeChart(chart),
    displayOptions: validateDisplayOptions(displayOptions),
  };
  if (note) {
    if (note.length > 4000) throw new Error('备注最多4000字。');
    doc.note = note;
  }
  return JSON.stringify(doc, null, 2);
}
export function importChart(text: string): ImportResult {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 1_000_000)
    throw new Error('请选择小于1MB的奇门JSON文件。');
  let doc: ChartDocument;
  try {
    doc = JSON.parse(text);
  } catch {
    throw new Error('JSON格式无法读取，请使用本项目导出的文件。');
  }
  if (!doc || doc.format !== 'qimen-dunjia' || ![1, 2].includes(doc.version) || !doc.chart)
    throw new Error('不支持这个文件格式或版本。');
  const c = doc.chart;
  if (
    c.schemaVersion !== '1.0.0' ||
    c.engineVersion !== ENGINE_VERSION ||
    c.calendarVersion !== CALENDAR_VERSION
  )
    throw new Error('文件的基础引擎、历法或数据版本不受支持，请用原版本重放。');
  assertProfile(c.profile);
  if (doc.note !== undefined && (typeof doc.note !== 'string' || doc.note.length > 4000))
    throw new Error('文件备注格式不正确。');
  const fresh = generateQimen(c.input, c.profile),
    baseMatches = canonical(c) === canonical(fresh);
  const legacy = doc.version === 1;
  if (doc.version === 2) {
    if (!doc.annotations || doc.annotations.schemaVersion !== '1.0.0')
      throw new Error('不支持这个辅助数据版本。');
    assertAnnotationProfile(doc.annotations.profile);
  }
  const annotations = analyzeChart(fresh);
  const annotationsMatch =
    doc.version === 1 ? null : canonical(doc.annotations) === canonical(annotations);
  const displayOptions =
    doc.version === 1 ? { ...DEFAULT_DISPLAY_OPTIONS } : validateDisplayOptions(doc.displayOptions);
  return {
    chart: fresh,
    note: doc.note ?? '',
    annotations,
    displayOptions,
    baseMatches,
    annotationsMatch,
    legacy,
    matches: baseMatches && annotationsMatch !== false,
  };
}
export { chartToSvg } from './svg.js';
