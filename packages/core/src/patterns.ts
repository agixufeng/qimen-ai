import { RING, STARS, DOORS, PALACE_META } from './constants.js';
import type { QimenChart, PatternHit, PalaceId } from './types.js';
const OPPOSITE: Record<number, PalaceId> = { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4 };
import { doorPalaceRelation } from './elements.js';
export function detectPatterns(chart: QimenChart): PatternHit[] {
  const hits: PatternHit[] = [];
  const get = (id: PalaceId) => chart.palaces.find((p) => p.id === id)!;
  for (const [layer, label] of [
    ['stars', '星'],
    ['door', '门'],
  ] as const) {
    for (const opposite of [false, true]) {
      const matched = RING.every((id) => {
        const p = get(id),
          home = opposite ? OPPOSITE[id] : id;
        return layer === 'stars' ? p.stars.includes(STARS[home]) : p.door === DOORS[home];
      });
      if (matched)
        hits.push({
          id: `${layer}-${opposite ? 'reverse' : 'repeat'}`,
          ruleId: `PATTERN-${layer}-${opposite ? 'FAN' : 'FU'}`,
          name: `${label}${opposite ? '反吟' : '伏吟'}`,
          palaceIds: [...RING],
          explanation: `外围八宫的${label === '星' ? '八颗主星' : '八门'}全部${opposite ? '落在本位的对宫' : '回到本位'}。天禽作为寄星随天芮，不另作第九个对宫判据。`,
          sourceId: 'shenqi-patterns',
        });
    }
  }
  for (const p of chart.palaces) {
    if (p.door && doorPalaceRelation(p.door, p.id).name === '迫')
      hits.push({
        id: `door-pressure-${p.id}`,
        ruleId: 'PATTERN-MENPO',
        name: '门迫',
        palaceIds: [p.id],
        explanation: `${p.door}属${doorPalaceRelation(p.door!, p.id).doorElement}，克${p.name}${p.id}宫${p.element}；此处按“门克宫”为门迫。`,
        sourceId: 'shenqi-patterns',
      });
  }
  return hits;
}
