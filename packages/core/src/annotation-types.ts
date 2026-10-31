import type { Stem, VisibleStem, PalaceId, QimenChart } from './types.js';
export type Branch =
  | '子'
  | '丑'
  | '寅'
  | '卯'
  | '辰'
  | '巳'
  | '午'
  | '未'
  | '申'
  | '酉'
  | '戌'
  | '亥';
export type Element = '木' | '火' | '土' | '金' | '水';
export type PillarKey = 'year' | 'month' | 'day' | 'hour';
export type GrowthStage =
  | '长生'
  | '沐浴'
  | '冠带'
  | '临官'
  | '帝旺'
  | '衰'
  | '病'
  | '死'
  | '墓'
  | '绝'
  | '胎'
  | '养';
export interface AnnotationProfile {
  id: 'shijia-common-annotations-v1';
  version: '1.0.0';
  growth: 'yang-forward-yin-reverse-fire-earth';
  starStrength: 'traditional';
  monthBasis: 'solar-month-branch';
}
export interface DisplayOptions {
  mode: 'standard' | 'professional';
  dayVoid: boolean;
  dayHorse: boolean;
  earthReference: boolean;
}
export interface Evidence {
  ruleId: string;
  sourceId: string;
  explanation: string;
}
export interface PillarAnnotation {
  key: PillarKey;
  label: string;
  ganzhi: string;
  xunShou: string;
  voidBranches: Branch[];
  horseBranch: Branch;
  horsePalace: PalaceId;
  evidence: Evidence[];
}
export interface StrengthAnnotation extends Evidence {
  element: Element;
  monthElement: Element;
  state: '旺' | '相' | '休' | '囚' | '死' | '废';
  relation: string;
}
export interface StemAnnotation {
  id: string;
  stem: VisibleStem;
  layer: 'heaven' | 'earth';
  hosted: boolean;
  palaceId: PalaceId;
  growth: { branch: Branch; stage: GrowthStage }[];
  tombBranches: Branch[];
  punishment: ({ hiddenJia: string; branch: Branch } & Evidence) | null;
  evidence: Evidence[];
}
export interface DoorRelation extends Evidence {
  name: '迫' | '制' | '和' | '义' | '比和';
  doorElement: Element;
  palaceElement: Element;
}
export interface PalaceAnnotations {
  palaceId: PalaceId;
  branches: Branch[];
  region: '内盘' | '外盘' | '中宫';
  voids: Partial<Record<PillarKey, Branch[]>>;
  horses: PillarKey[];
  stems: StemAnnotation[];
  stars: ({ name: string } & StrengthAnnotation)[];
  doorStrength: StrengthAnnotation | null;
  palaceStrength: StrengthAnnotation;
  doorRelation: DoorRelation | null;
}
export interface ChartAnnotations {
  schemaVersion: '1.0.0';
  profile: AnnotationProfile;
  monthBranch: Branch;
  monthElement: Element;
  pillars: Record<PillarKey, PillarAnnotation>;
  palaces: PalaceAnnotations[];
}
export interface ChartDocumentV2 {
  format: 'qimen-dunjia';
  version: 2;
  chart: QimenChart;
  annotations: ChartAnnotations;
  displayOptions: DisplayOptions;
  note?: string;
}
