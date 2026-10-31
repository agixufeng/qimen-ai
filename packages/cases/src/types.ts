import type { QimenInput, QimenChart, AnnotationProfile, ChartAnnotations } from '@qimen/core';
export type StudyKind = 'generated' | 'classical' | 'reported';
export interface StudyCase {
  schemaVersion: '1.0.0';
  datasetVersion: 'study-v1';
  id: string;
  title: string;
  kind: StudyKind;
  input: QimenInput | null;
  chart: QimenChart | null;
  annotationProfile: AnnotationProfile | null;
  provenance: {
    sourceId: string;
    locator: string;
    method: string;
    rights: string;
    evidence: 'generated' | 'hypothetical' | 'source-reported';
    generatorVersion?: string;
  };
  outcome: null | { text: string; sourceId: string; locator: string };
  suppliedConditions: string[];
  replayStatus: 'supported' | 'unsupported';
}
export interface StudyIndexEntry {
  id: string;
  title: string;
  kind: StudyKind;
  timestamp: string | null;
  dun?: '阳遁' | '阴遁';
  ju?: number;
  xunShou?: string;
  pairs: string[];
  marks: string[];
  chunk: string;
}
export interface StudyIndex {
  schemaVersion: '1.0.0';
  datasetVersion: 'study-v1';
  counts: { total: number; generated: number; classical: number; reported: number };
  records: StudyIndexEntry[];
  chunks: Record<string, { sha256: string; records: number }>;
}
export interface ReplayResult {
  supported: boolean;
  baseMatches: boolean | null;
  chart: QimenChart | null;
  annotations: ChartAnnotations | null;
  reason?: string;
}
