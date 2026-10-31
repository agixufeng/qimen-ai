import type { QimenChart, Stem, VisibleStem, PalaceId } from './types.js';
import type {
  AnnotationProfile,
  ChartAnnotations,
  DisplayOptions,
  Branch,
  GrowthStage,
  Element,
  StrengthAnnotation,
  PillarKey,
  PillarAnnotation,
  StemAnnotation,
  PalaceAnnotations,
  Evidence,
} from './annotation-types.js';
import { BRANCHES, STEMS, PALACE_META } from './constants.js';
import { cycleIndex } from './calendar.js';
import {
  GENERATES,
  OVERCOMES,
  STAR_ELEMENTS,
  DOOR_ELEMENTS,
  doorPalaceRelation,
} from './elements.js';
export const DEFAULT_ANNOTATION_PROFILE: AnnotationProfile = Object.freeze({
  id: 'shijia-common-annotations-v1',
  version: '1.0.0',
  growth: 'yang-forward-yin-reverse-fire-earth',
  starStrength: 'traditional',
  monthBasis: 'solar-month-branch',
});
export const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = Object.freeze({
  mode: 'standard',
  dayVoid: false,
  dayHorse: false,
  earthReference: false,
});
export const PALACE_BRANCHES: Record<PalaceId, readonly Branch[]> = {
  1: ['子'],
  2: ['未', '申'],
  3: ['卯'],
  4: ['辰', '巳'],
  5: [],
  6: ['戌', '亥'],
  7: ['酉'],
  8: ['丑', '寅'],
  9: ['午'],
};
const BRANCH_ELEMENTS: Record<Branch, Element> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};
const HORSES: Record<Branch, Branch> = {
  子: '寅',
  丑: '亥',
  寅: '申',
  卯: '巳',
  辰: '寅',
  巳: '亥',
  午: '申',
  未: '巳',
  申: '寅',
  酉: '亥',
  戌: '申',
  亥: '巳',
};
const VOIDS: readonly (readonly Branch[])[] = [
  ['戌', '亥'],
  ['申', '酉'],
  ['午', '未'],
  ['辰', '巳'],
  ['寅', '卯'],
  ['子', '丑'],
];
const HEADS = ['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅'];
const START: Record<Stem, Branch> = {
  甲: '亥',
  乙: '午',
  丙: '寅',
  丁: '酉',
  戊: '寅',
  己: '酉',
  庚: '巳',
  辛: '子',
  壬: '申',
  癸: '卯',
};
const GROWTH: readonly GrowthStage[] = [
  '长生',
  '沐浴',
  '冠带',
  '临官',
  '帝旺',
  '衰',
  '病',
  '死',
  '墓',
  '绝',
  '胎',
  '养',
];
const PUNISHMENT: Partial<
  Record<VisibleStem, { palace: PalaceId; branch: Branch; hiddenJia: string; cause: string }>
> = {
  戊: { palace: 3, branch: '卯', hiddenJia: '甲子', cause: '子刑卯' },
  己: { palace: 2, branch: '未', hiddenJia: '甲戌', cause: '戌刑未' },
  庚: { palace: 8, branch: '寅', hiddenJia: '甲申', cause: '申刑寅' },
  辛: { palace: 9, branch: '午', hiddenJia: '甲午', cause: '午刑午' },
  壬: { palace: 4, branch: '辰', hiddenJia: '甲辰', cause: '辰刑辰' },
  癸: { palace: 4, branch: '巳', hiddenJia: '甲寅', cause: '寅刑巳' },
};
const PILLARS: readonly PillarKey[] = ['year', 'month', 'day', 'hour'];
const LABELS: Record<PillarKey, string> = { year: '年', month: '月', day: '日', hour: '时' };
const canonical = (p: object) =>
  JSON.stringify(Object.entries(p).sort(([a], [b]) => a.localeCompare(b, 'en')));
export function assertAnnotationProfile(profile: AnnotationProfile): void {
  if (
    !profile ||
    typeof profile !== 'object' ||
    canonical(profile) !== canonical(DEFAULT_ANNOTATION_PROFILE)
  )
    throw new Error('不支持这个辅助规则版本或设置。');
}
export function validateDisplayOptions(options: DisplayOptions): DisplayOptions {
  if (
    !options ||
    typeof options !== 'object' ||
    !['standard', 'professional'].includes(options.mode) ||
    ['dayVoid', 'dayHorse', 'earthReference'].some(
      (k) => typeof options[k as keyof DisplayOptions] !== 'boolean',
    ) ||
    Object.keys(options).sort().join(',') !== 'dayHorse,dayVoid,earthReference,mode'
  )
    throw new Error('显示选项格式或版本不受支持。');
  return { ...options };
}
export function getVoidBranches(ganzhi: string): Branch[] {
  return [...VOIDS[Math.floor(cycleIndex(ganzhi) / 10)]];
}
export function getHorseBranch(branch: Branch): Branch {
  const horse = HORSES[branch];
  if (!Object.hasOwn(HORSES, branch)) throw new Error('未知地支。');
  return horse;
}
export function getGrowthStage(stem: Stem, branch: Branch): GrowthStage {
  const start = START[stem];
  if (
    !Object.hasOwn(START, stem) ||
    typeof branch !== 'string' ||
    !BRANCHES.includes(branch) ||
    branch.length !== 1
  )
    throw new Error('未知天干或地支。');
  const sign = STEMS.indexOf(stem) % 2 === 0 ? 1 : -1;
  return GROWTH[((((BRANCHES.indexOf(branch) - BRANCHES.indexOf(start)) * sign) % 12) + 12) % 12];
}
export function getSeasonalStrength(
  element: Element,
  month: Element,
  kind: 'star' | 'regular',
): StrengthAnnotation {
  if (
    !Object.hasOwn(GENERATES, element) ||
    !Object.hasOwn(GENERATES, month) ||
    !['star', 'regular'].includes(kind)
  )
    throw new Error('未知五行或旺衰规则。');
  const relation =
    element === month
      ? '同五行'
      : GENERATES[element] === month
        ? '我生月令'
        : GENERATES[month] === element
          ? '月令生我'
          : OVERCOMES[element] === month
            ? '我克月令'
            : '月令克我';
  const states = kind === 'star' ? ['相', '旺', '废', '休', '囚'] : ['旺', '休', '相', '囚', '死'];
  const state = states[
    ['同五行', '我生月令', '月令生我', '我克月令', '月令克我'].indexOf(relation)
  ] as StrengthAnnotation['state'];
  return {
    element,
    monthElement: month,
    state,
    relation,
    ruleId: kind === 'star' ? 'STAR-MONTH-01' : 'REGULAR-MONTH-01',
    sourceId: kind === 'star' ? 'star-season' : 'annotation-profile',
    explanation: `对象属${element}，节月月令属${month}；${relation}，按${kind === 'star' ? '九星星气' : '正五行月令'}规则为${state}。`,
  };
}
function stemAnnotation(
  stem: VisibleStem,
  layer: 'heaven' | 'earth',
  hosted: boolean,
  palaceId: PalaceId,
  index: number,
): StemAnnotation {
  const branches = PALACE_BRANCHES[palaceId];
  const growth = branches.map((branch) => ({ branch, stage: getGrowthStage(stem, branch) }));
  const tombBranches = growth.filter((g) => g.stage === '墓').map((g) => g.branch);
  const rule = PUNISHMENT[stem],
    isHit = rule?.palace === palaceId;
  const location = `${layer === 'heaven' ? '天盘' : '地盘'}${hosted ? '寄干' : '主干'}${stem}在${palaceId}宫`;
  const evidence: Evidence[] = [
    {
      ruleId: 'GROWTH-01',
      sourceId: 'growth-table',
      explanation: branches.length
        ? `${location}；阴阳顺逆、土随火，分别查${growth.map((g) => g.branch + '：' + g.stage).join('／')}。`
        : `${location}；中五原位无地支，不计算长生与入墓。`,
    },
    {
      ruleId: 'TOMB-01',
      sourceId: 'annotation-profile',
      explanation: tombBranches.length
        ? `${location}在${tombBranches.join('、')}支处于墓态；仅标记这个干与这些地支，不扩大为整宫入墓。`
        : `${location}未命中本辅助规则表的墓态。`,
    },
  ];
  const punishment = isHit
    ? {
        hiddenJia: rule.hiddenJia,
        branch: rule.branch,
        ruleId: 'PUNISHMENT-01',
        sourceId: 'shenqi-patterns',
        explanation: `${location}，${stem}承${rule.hiddenJia}，宫支${rule.branch}，${rule.cause}。${layer === 'earth' ? '地盘仅作为注明盘层的参考。' : '按天盘六仪击刑表命中，不限当值旬首。'}`,
      }
    : null;
  if (punishment) evidence.push(punishment);
  return {
    id: `${layer}:${palaceId}:${hosted ? 'hosted' : 'main'}:${index}`,
    stem,
    layer,
    hosted,
    palaceId,
    growth,
    tombBranches,
    punishment,
    evidence,
  };
}
function palaceForBranch(branch: Branch): PalaceId {
  return Number(
    Object.entries(PALACE_BRANCHES).find(([, branches]) => branches.includes(branch))![0],
  ) as PalaceId;
}
export function analyzeChart(
  chart: QimenChart,
  profile: AnnotationProfile = DEFAULT_ANNOTATION_PROFILE,
): ChartAnnotations {
  assertAnnotationProfile(profile);
  const monthBranch = chart.pillars.month[1] as Branch,
    monthElement = BRANCH_ELEMENTS[monthBranch];
  if (!monthElement) throw new Error('基础盘月柱不可识别。');
  const pillars = {} as Record<PillarKey, PillarAnnotation>;
  for (const key of PILLARS) {
    const ganzhi = chart.pillars[key],
      xun = Math.floor(cycleIndex(ganzhi) / 10),
      voidBranches = getVoidBranches(ganzhi),
      horseBranch = getHorseBranch(ganzhi[1] as Branch);
    pillars[key] = {
      key,
      label: LABELS[key],
      ganzhi,
      xunShou: HEADS[xun],
      voidBranches,
      horseBranch,
      horsePalace: palaceForBranch(horseBranch),
      evidence: [
        {
          ruleId: 'VOID-01',
          sourceId: 'xunkong-yima',
          explanation: `${LABELS[key]}柱${ganzhi}属${HEADS[xun]}旬，旬空${voidBranches.join('')}；只标具体空支，不推断真空或假空。`,
        },
        {
          ruleId: 'HORSE-01',
          sourceId: 'xunkong-yima',
          explanation: `${LABELS[key]}支${ganzhi[1]}，按地支三合组取驿马${horseBranch}，落${palaceForBranch(horseBranch)}宫。`,
        },
      ],
    };
  }
  const palaces: PalaceAnnotations[] = chart.palaces.map((p) => {
    const branches = [...PALACE_BRANCHES[p.id]],
      voids: PalaceAnnotations['voids'] = {};
    for (const key of PILLARS) {
      const hit = branches.filter((b) => pillars[key].voidBranches.includes(b));
      if (hit.length) voids[key] = hit;
    }
    const yinInner = [9, 2, 7, 6].includes(p.id),
      isInner = chart.dun === '阴遁' ? yinInner : !yinInner;
    const stems = [
      ...p.heavenStems.map((s, i) => stemAnnotation(s, 'heaven', i > 0, p.id, i)),
      stemAnnotation(p.earthStem, 'earth', false, p.id, 0),
      ...p.hostedEarthStems.map((s, i) => stemAnnotation(s, 'earth', true, p.id, i)),
    ];
    return {
      palaceId: p.id,
      branches,
      region: p.id === 5 ? '中宫' : isInner ? '内盘' : '外盘',
      voids,
      horses: PILLARS.filter((k) => pillars[k].horsePalace === p.id),
      stems,
      stars: p.stars.map((name) => ({
        name,
        ...getSeasonalStrength(STAR_ELEMENTS[name], monthElement, 'star'),
      })),
      doorStrength: p.door
        ? getSeasonalStrength(DOOR_ELEMENTS[p.door], monthElement, 'regular')
        : null,
      palaceStrength: getSeasonalStrength(PALACE_META[p.id][2] as Element, monthElement, 'regular'),
      doorRelation: p.door ? doorPalaceRelation(p.door, p.id) : null,
    };
  });
  return {
    schemaVersion: '1.0.0',
    profile: { ...DEFAULT_ANNOTATION_PROFILE },
    monthBranch,
    monthElement,
    pillars,
    palaces,
  };
}
