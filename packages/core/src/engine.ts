import { calendar } from './calendar.js';
import {
  DEFAULT_PROFILE,
  ENGINE_VERSION,
  CALENDAR_VERSION,
  INSTRUMENTS,
  BRANCHES,
  RING,
  STARS,
  DOORS,
  DEITIES,
  PALACE_META,
  host,
  mod,
} from './constants.js';
import type { QimenInput, RuleProfile, QimenChart, Palace, PalaceId } from './types.js';
export function assertProfile(profile: RuleProfile): void {
  if (
    !profile ||
    JSON.stringify(Object.entries(profile).sort()) !==
      JSON.stringify(Object.entries(DEFAULT_PROFILE).sort())
  )
    throw new Error('不支持这个规则版本或设置；首版仅支持 shijia-zhuanpan-chaibu-v1 / 1.0.0。');
}
export function generateQimen(
  input: QimenInput,
  profile: RuleProfile = DEFAULT_PROFILE,
): QimenChart {
  assertProfile(profile);
  const c = calendar(input),
    sign = c.dun === '阳遁' ? 1 : -1;
  const earth = {} as Record<PalaceId, (typeof INSTRUMENTS)[number]>;
  INSTRUMENTS.forEach((stem, i) => {
    earth[(mod(c.ju - 1 + sign * i, 9) + 1) as PalaceId] = stem;
  });
  const xunIndex = Math.floor(c.hourIndex / 10),
    hiddenStem = INSTRUMENTS[xunIndex];
  const xunShou = '甲' + BRANCHES[mod(-2 * xunIndex, 12)];
  const origin = Number(
    Object.keys(earth).find((k) => earth[Number(k) as PalaceId] === hiddenStem),
  ) as PalaceId;
  const timeStem = c.pillars.hour[0] === '甲' ? hiddenStem : c.pillars.hour[0];
  const timeStemRaw = Number(
    Object.keys(earth).find((k) => earth[Number(k) as PalaceId] === timeStem),
  ) as PalaceId;
  const starPalace = host(timeStemRaw),
    sourceAnchor = host(origin);
  const starRotation = mod(RING.indexOf(starPalace) - RING.indexOf(sourceAnchor), 8);
  const rawDoor = (mod(origin - 1 + sign * (c.hourIndex % 10), 9) + 1) as PalaceId;
  const doorPalace = host(rawDoor),
    doorRotation = mod(RING.indexOf(doorPalace) - RING.indexOf(sourceAnchor), 8);
  const palaces = Array.from({ length: 9 }, (_, i) => {
    const id = (i + 1) as PalaceId,
      [name, direction, element] = PALACE_META[id];
    return {
      id,
      name,
      direction,
      element,
      earthStem: earth[id],
      heavenStems: [],
      hostedEarthStems: id === 2 ? [earth[5]] : [],
      stars: [],
      door: null,
      deity: null,
    } as Palace;
  });
  RING.forEach((from, i) => {
    const dest = RING[(i + starRotation) % 8];
    palaces[dest - 1].heavenStems = from === 2 ? [earth[2], earth[5]] : [earth[from]];
    palaces[dest - 1].stars = from === 2 ? [STARS[2], STARS[5]] : [STARS[from]];
    palaces[RING[(i + doorRotation) % 8] - 1].door = DOORS[from];
  });
  const divineAnchor = RING.indexOf(starPalace);
  DEITIES.forEach((god, i) => {
    palaces[RING[mod(divineAnchor + sign * i, 8)] - 1].deity = god;
  });
  return {
    schemaVersion: '1.0.0',
    engineVersion: ENGINE_VERSION,
    calendarVersion: CALENDAR_VERSION,
    profile: { ...DEFAULT_PROFILE },
    input: {
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
      second: input.second,
    },
    pillars: c.pillars,
    term: c.term,
    dun: c.dun,
    ju: c.ju,
    yuan: c.yuan,
    fuTou: c.fuTou,
    xunShou,
    hiddenStem,
    chiefStar: { name: STARS[origin], origin, palace: starPalace },
    chiefDoor: { name: DOORS[sourceAnchor], origin, palace: doorPalace, rawPalace: rawDoor },
    palaces,
    trace: [
      {
        ruleId: 'TIME-01',
        title: '固定 UTC+8 与子初换日',
        detail: `公历输入保留；23点起按下一干支日计日柱及时干。此盘日柱${c.pillars.day}，时柱${c.pillars.hour}。`,
        sourceId: 'project-profile',
      },
      {
        ruleId: 'TERM-01',
        title: '节气按真实时刻判断',
        detail: `${c.term.name}从${c.term.startsAt}开始；不使用时辰中点替代交节时刻。`,
        sourceId: 'shenqi-setup',
      },
      {
        ruleId: 'JU-01',
        title: '甲己符头定三元',
        detail: `日柱${c.pillars.day}，向前取符头${c.fuTou}，属${c.yuan}；${c.term.name}用${c.dun}${c.ju}局。`,
        sourceId: 'shenqi-setup',
      },
      {
        ruleId: 'EARTH-01',
        title: '地盘布三奇六仪',
        detail: `戊从${c.ju}宫起，依戊己庚辛壬癸丁丙乙${sign === 1 ? '顺' : '逆'}数九宫；中五原干${earth[5]}另寄坤。`,
        sourceId: 'shenqi-setup',
      },
      {
        ruleId: 'CHIEF-01',
        title: '旬首与值符星',
        detail: `${c.pillars.hour}属${xunShou}旬，遁${hiddenStem}在${origin}宫；${STARS[origin]}为值符星，随地盘时干至${timeStemRaw}宫${timeStemRaw === 5 ? '，寄坤二宫' : ''}。`,
        sourceId: 'shenqi-setup',
      },
      {
        ruleId: 'DOOR-01',
        title: '值使随时支数宫',
        detail: `${DOORS[sourceAnchor]}为值使；自旬首原${origin}宫${sign === 1 ? '顺' : '逆'}数${c.hourIndex % 10}步到${rawDoor}宫${rawDoor === 5 ? '，寄坤二宫' : ''}。`,
        sourceId: 'project-profile',
      },
      {
        ruleId: 'RING-01',
        title: '星门转排与八神',
        detail: `八方环序1→8→3→4→9→2→7→6；星干转${starRotation}位，门转${doorRotation}位；天禽随天芮；八神值符起${starPalace}宫，${sign === 1 ? '顺' : '逆'}时针排。`,
        sourceId: 'project-profile',
      },
    ],
  };
}
