import { PALACE_META } from './constants.js';
import type { PalaceId } from './types.js';
import type { Element, DoorRelation } from './annotation-types.js';
export const GENERATES: Record<Element, Element> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};
export const OVERCOMES: Record<Element, Element> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};
export const DOOR_ELEMENTS: Record<string, Element> = {
  休门: '水',
  生门: '土',
  伤门: '木',
  杜门: '木',
  景门: '火',
  死门: '土',
  惊门: '金',
  开门: '金',
};
export const STAR_ELEMENTS: Record<string, Element> = {
  天蓬: '水',
  天任: '土',
  天冲: '木',
  天辅: '木',
  天英: '火',
  天芮: '土',
  天禽: '土',
  天柱: '金',
  天心: '金',
};
export function doorPalaceRelation(door: string, palaceId: PalaceId): DoorRelation {
  const d = DOOR_ELEMENTS[door],
    p = PALACE_META[palaceId]?.[2] as Element;
  if (!d || !p) throw new Error('无法识别门或宫位。');
  const name =
    d === p
      ? '比和'
      : OVERCOMES[d] === p
        ? '迫'
        : OVERCOMES[p] === d
          ? '制'
          : GENERATES[p] === d
            ? '和'
            : '义';
  const relationship =
    name === '比和'
      ? '门宫同五行'
      : name === '迫'
        ? '门克宫'
        : name === '制'
          ? '宫克门'
          : name === '和'
            ? '宫生门'
            : '门生宫';
  return {
    name,
    doorElement: d,
    palaceElement: p,
    ruleId: name === '迫' ? 'PATTERN-MENPO' : `RELATION-${name}`,
    sourceId: 'shenqi-patterns',
    explanation: `${door}属${d}，${PALACE_META[palaceId][0]}${palaceId}宫属${p}；${relationship}为${name}。此关系独立于月令旺衰。`,
  };
}
