import type { PalaceId, VisibleStem, RuleProfile } from './types.js';
export const ENGINE_VERSION = '0.1.0' as const;
export const CALENDAR_VERSION = 'lunar-javascript@1.7.7';
export const DEFAULT_PROFILE: RuleProfile = Object.freeze({
  id: 'shijia-zhuanpan-chaibu-v1',
  version: '1.0.0',
  offsetMinutes: 480,
  dayBoundary: 23,
  centerHost: 2,
});
export const STEMS = '甲乙丙丁戊己庚辛壬癸';
export const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
export const INSTRUMENTS: VisibleStem[] = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
export const RING: PalaceId[] = [1, 8, 3, 4, 9, 2, 7, 6];
export const STARS: Record<PalaceId, string> = {
  1: '天蓬',
  2: '天芮',
  3: '天冲',
  4: '天辅',
  5: '天禽',
  6: '天心',
  7: '天柱',
  8: '天任',
  9: '天英',
};
export const DOORS: Record<number, string> = {
  1: '休门',
  8: '生门',
  3: '伤门',
  4: '杜门',
  9: '景门',
  2: '死门',
  7: '惊门',
  6: '开门',
};
export const DEITIES = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
export const PALACE_META: Record<PalaceId, [string, string, string]> = {
  1: ['坎', '北', '水'],
  2: ['坤', '西南', '土'],
  3: ['震', '东', '木'],
  4: ['巽', '东南', '木'],
  5: ['中', '中央', '土'],
  6: ['乾', '西北', '金'],
  7: ['兑', '西', '金'],
  8: ['艮', '东北', '土'],
  9: ['离', '南', '火'],
};
// Term -> [upper, middle, lower], split-at-term chaibu convention.
export const TERM_JU: Record<string, { dun: '阳遁' | '阴遁'; numbers: [number, number, number] }> =
  Object.fromEntries(
    [
      ['冬至', '阳遁', [1, 7, 4]],
      ['小寒', '阳遁', [2, 8, 5]],
      ['大寒', '阳遁', [3, 9, 6]],
      ['立春', '阳遁', [8, 5, 2]],
      ['雨水', '阳遁', [9, 6, 3]],
      ['惊蛰', '阳遁', [1, 7, 4]],
      ['春分', '阳遁', [3, 9, 6]],
      ['清明', '阳遁', [4, 1, 7]],
      ['谷雨', '阳遁', [5, 2, 8]],
      ['立夏', '阳遁', [4, 1, 7]],
      ['小满', '阳遁', [5, 2, 8]],
      ['芒种', '阳遁', [6, 3, 9]],
      ['夏至', '阴遁', [9, 3, 6]],
      ['小暑', '阴遁', [8, 2, 5]],
      ['大暑', '阴遁', [7, 1, 4]],
      ['立秋', '阴遁', [2, 5, 8]],
      ['处暑', '阴遁', [1, 4, 7]],
      ['白露', '阴遁', [9, 3, 6]],
      ['秋分', '阴遁', [7, 1, 4]],
      ['寒露', '阴遁', [6, 9, 3]],
      ['霜降', '阴遁', [5, 8, 2]],
      ['立冬', '阴遁', [6, 9, 3]],
      ['小雪', '阴遁', [5, 8, 2]],
      ['大雪', '阴遁', [4, 7, 1]],
    ].map(([term, dun, numbers]) => [term, { dun, numbers }]),
  ) as Record<string, { dun: '阳遁' | '阴遁'; numbers: [number, number, number] }>;
export const mod = (n: number, b: number) => ((n % b) + b) % b;
export const host = (n: PalaceId): PalaceId => (n === 5 ? 2 : n);
