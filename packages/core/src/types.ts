export type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type VisibleStem = Exclude<Stem, '甲'>;
export type PalaceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export interface QimenInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}
export interface RuleProfile {
  id: 'shijia-zhuanpan-chaibu-v1';
  version: '1.0.0';
  offsetMinutes: 480;
  dayBoundary: 23;
  centerHost: 2;
}
export interface TraceStep {
  ruleId: string;
  title: string;
  detail: string;
  sourceId: string;
}
export interface Palace {
  id: PalaceId;
  name: string;
  direction: string;
  element: string;
  earthStem: VisibleStem;
  heavenStems: VisibleStem[];
  hostedEarthStems: VisibleStem[];
  stars: string[];
  door: string | null;
  deity: string | null;
}
export interface PatternHit {
  id: string;
  ruleId: string;
  name: string;
  palaceIds: PalaceId[];
  explanation: string;
  sourceId: string;
}
export interface QimenChart {
  schemaVersion: '1.0.0';
  engineVersion: '0.1.0';
  calendarVersion: string;
  profile: RuleProfile;
  input: QimenInput;
  pillars: { year: string; month: string; day: string; hour: string };
  term: { name: string; startsAt: string; nextAt: string };
  dun: '阳遁' | '阴遁';
  ju: number;
  yuan: '上元' | '中元' | '下元';
  fuTou: string;
  xunShou: string;
  hiddenStem: VisibleStem;
  chiefStar: { name: string; origin: PalaceId; palace: PalaceId };
  chiefDoor: { name: string; origin: PalaceId; palace: PalaceId; rawPalace: PalaceId };
  palaces: Palace[];
  trace: TraceStep[];
}
export interface LegacyChartDocument {
  format: 'qimen-dunjia';
  version: 1;
  chart: QimenChart;
  note?: string;
}
export type ChartDocument = LegacyChartDocument | import('./annotation-types.js').ChartDocumentV2;
export interface ImportResult {
  annotations: import('./annotation-types.js').ChartAnnotations;
  displayOptions: import('./annotation-types.js').DisplayOptions;
  baseMatches: boolean;
  annotationsMatch: boolean | null;
  legacy: boolean;
  chart: QimenChart;
  note: string;
  matches: boolean;
}
