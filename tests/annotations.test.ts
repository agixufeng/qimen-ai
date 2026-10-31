import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQimen } from '../packages/core/src/engine.js';
import {
  analyzeChart,
  getVoidBranches,
  getHorseBranch,
  getGrowthStage,
  getSeasonalStrength,
  DEFAULT_ANNOTATION_PROFILE,
} from '../packages/core/src/annotations.js';
import type { Branch, Element, GrowthStage } from '../packages/core/src/annotation-types.js';
import type { QimenChart, Stem, PalaceId } from '../packages/core/src/types.js';

const noon = { year: 2026, month: 10, day: 28, hour: 12, minute: 0, second: 0 };
const branches = [...'子丑寅卯辰巳午未申酉戌亥'] as Branch[];
const palaceBranches: Record<PalaceId, string> = {
  1: '子',
  2: '未申',
  3: '卯',
  4: '辰巳',
  5: '',
  6: '戌亥',
  7: '酉',
  8: '丑寅',
  9: '午',
};
// Independent literal sexagenary groups; do not derive these from the implementation.
const voidGroups = [
  ['甲子 乙丑 丙寅 丁卯 戊辰 己巳 庚午 辛未 壬申 癸酉', '戌亥'],
  ['甲戌 乙亥 丙子 丁丑 戊寅 己卯 庚辰 辛巳 壬午 癸未', '申酉'],
  ['甲申 乙酉 丙戌 丁亥 戊子 己丑 庚寅 辛卯 壬辰 癸巳', '午未'],
  ['甲午 乙未 丙申 丁酉 戊戌 己亥 庚子 辛丑 壬寅 癸卯', '辰巳'],
  ['甲辰 乙巳 丙午 丁未 戊申 己酉 庚戌 辛亥 壬子 癸丑', '寅卯'],
  ['甲寅 乙卯 丙辰 丁巳 戊午 己未 庚申 辛酉 壬戌 癸亥', '子丑'],
] as const;
for (const [group, empty] of voidGroups) {
  test(`旬空 literal group ${group.split(' ')[0]}`, () => {
    for (const gz of group.split(' ')) assert.deepEqual(getVoidBranches(gz), [...empty], gz);
  });
}
test('all twelve branch horses from independent literal table', () => {
  const expected = [...'寅亥申巳寅亥申巳寅亥申巳'];
  branches.forEach((b, i) => assert.equal(getHorseBranch(b), expected[i], b));
});
const stages = '长生 沐浴 冠带 临官 帝旺 衰 病 死 墓 绝 胎 养'.split(' ') as GrowthStage[];
// Each row lists branches in stage order, written independently, including fire-earth convention.
const growthRows: Record<Stem, string> = {
  甲: '亥子丑寅卯辰巳午未申酉戌',
  乙: '午巳辰卯寅丑子亥戌酉申未',
  丙: '寅卯辰巳午未申酉戌亥子丑',
  丁: '酉申未午巳辰卯寅丑子亥戌',
  戊: '寅卯辰巳午未申酉戌亥子丑',
  己: '酉申未午巳辰卯寅丑子亥戌',
  庚: '巳午未申酉戌亥子丑寅卯辰',
  辛: '子亥戌酉申未午巳辰卯寅丑',
  壬: '申酉戌亥子丑寅卯辰巳午未',
  癸: '卯寅丑子亥戌酉申未午巳辰',
};
for (const [stem, row] of Object.entries(growthRows)) {
  test(`十二长生 independent full row ${stem}`, () => {
    [...row].forEach((branch, i) =>
      assert.equal(getGrowthStage(stem as Stem, branch as Branch), stages[i]),
    );
  });
}
const elements = [...'木火土金水'] as Element[];
const regular = ['旺休囚死相', '相旺休囚死', '死相旺休囚', '囚死相旺休', '休囚死相旺'];
const star = ['相旺休囚废', '废相旺休囚', '囚废相旺休', '休囚废相旺', '旺休囚废相'];
for (const kind of ['regular', 'star'] as const) {
  test(`${kind} strength covers all 25 element relations with evidence`, () => {
    elements.forEach((element, i) =>
      elements.forEach((month, j) => {
        const got = getSeasonalStrength(element, month, kind);
        assert.equal(
          got.state,
          [...(kind === 'star' ? star : regular)[i]][j],
          `${element}/${month}`,
        );
        assert.equal(got.element, element);
        assert.equal(got.monthElement, month);
        assert.ok(got.ruleId && got.sourceId && got.explanation && got.relation);
      }),
    );
  });
}
// The following modified charts are artificial annotation rule probes, NOT real-calendar chart fixtures.
function synthetic(): QimenChart {
  return structuredClone(generateQimen(noon));
}
test('default sample retains all four pillars, their voids and separate day/hour horses', () => {
  const a = analyzeChart(generateQimen(noon));
  assert.equal(a.schemaVersion, '1.0.0');
  assert.deepEqual(a.profile, DEFAULT_ANNOTATION_PROFILE);
  const expected = {
    year: {
      ganzhi: '丙午',
      xunShou: '甲辰',
      voidBranches: ['寅', '卯'],
      horseBranch: '申',
      horsePalace: 2,
    },
    month: {
      ganzhi: '戊戌',
      xunShou: '甲午',
      voidBranches: ['辰', '巳'],
      horseBranch: '申',
      horsePalace: 2,
    },
    day: {
      ganzhi: '乙亥',
      xunShou: '甲戌',
      voidBranches: ['申', '酉'],
      horseBranch: '巳',
      horsePalace: 4,
    },
    hour: {
      ganzhi: '壬午',
      xunShou: '甲戌',
      voidBranches: ['申', '酉'],
      horseBranch: '申',
      horsePalace: 2,
    },
  };
  for (const key of ['year', 'month', 'day', 'hour'] as const) {
    for (const [field, value] of Object.entries(expected[key])) {
      assert.deepEqual(
        a.pillars[key][field as keyof typeof a.pillars.hour],
        value,
        `${key}.${field}`,
      );
    }
    assert.ok(a.pillars[key].evidence.length);
  }
  assert.equal(a.monthBranch, '戌');
  assert.equal(a.monthElement, '土');
  assert.deepEqual(a.palaces.find((p) => p.palaceId === 2)!.voids.hour, ['申']);
  assert.deepEqual(a.palaces.find((p) => p.palaceId === 7)!.voids.hour, ['酉']);
  assert.ok(a.palaces.find((p) => p.palaceId === 2)!.horses.includes('hour'));
  assert.ok(!a.palaces.find((p) => p.palaceId === 2)!.horses.includes('day'));
  assert.ok(a.palaces.find((p) => p.palaceId === 4)!.horses.includes('day'));
});
test('palace branch mapping and yin/yang regions preserve a branchless center', () => {
  for (const dun of ['阳遁', '阴遁'] as const) {
    const c = synthetic();
    c.dun = dun;
    const a = analyzeChart(c);
    for (const p of a.palaces) {
      assert.deepEqual(p.branches, [...palaceBranches[p.palaceId]]);
      const yangInner = [1, 8, 3, 4].includes(p.palaceId);
      assert.equal(
        p.region,
        p.palaceId === 5 ? '中宫' : (dun === '阳遁' ? yangInner : !yangInner) ? '内盘' : '外盘',
      );
    }
    const center = a.palaces.find((p) => p.palaceId === 5)!;
    assert.deepEqual(center.horses, []);
    assert.ok(Object.values(center.voids).every((v) => v!.length === 0));
    for (const s of center.stems) {
      assert.deepEqual(s.growth, []);
      assert.deepEqual(s.tombBranches, []);
      assert.equal(s.punishment, null);
    }
  }
});
const punishments = [
  ['戊', 3, '甲子', '卯'],
  ['己', 2, '甲戌', '未'],
  ['庚', 8, '甲申', '寅'],
  ['辛', 9, '甲午', '午'],
  ['壬', 4, '甲辰', '辰'],
  ['癸', 4, '甲寅', '巳'],
] as const;
for (const [stem, destination, hiddenJia, branch] of punishments) {
  test(`人工规则盘: ${stem}刑 covers every palace, main/hosted and earth reference`, () => {
    const c = synthetic();
    for (const p of c.palaces) {
      p.heavenStems = p.id === 5 ? [] : ['乙', stem];
      p.earthStem = stem;
      p.hostedEarthStems = p.id === 5 ? [] : [stem];
    }
    const a = analyzeChart(c);
    for (const p of a.palaces) {
      const candidates = p.stems.filter((s) => s.stem === stem);
      assert.equal(candidates.length, p.palaceId === 5 ? 1 : 3);
      for (const s of candidates) {
        if (p.palaceId === destination) {
          assert.equal(s.punishment?.hiddenJia, hiddenJia);
          assert.equal(s.punishment?.branch, branch);
          assert.ok(s.punishment?.ruleId && s.punishment?.sourceId && s.punishment?.explanation);
        } else assert.equal(s.punishment, null);
      }
      if (p.palaceId !== 5) {
        assert.ok(candidates.some((s) => s.layer === 'heaven' && s.hosted));
        assert.ok(candidates.some((s) => s.layer === 'earth' && !s.hosted));
        assert.ok(candidates.some((s) => s.layer === 'earth' && s.hosted));
      }
    }
    const main = synthetic();
    main.palaces.find((p) => p.id === destination)!.heavenStems = [stem];
    const hit = analyzeChart(main)
      .palaces.find((p) => p.palaceId === destination)!
      .stems.find((s) => s.layer === 'heaven')!;
    assert.equal(hit.hosted, false);
    assert.equal(hit.punishment?.branch, branch);
  });
}
test('人工规则盘: three wonders have no six-instrument punishment', () => {
  const c = synthetic();
  for (const p of c.palaces) p.heavenStems = p.id === 5 ? [] : ['乙', '丙', '丁'];
  assert.ok(
    analyzeChart(c)
      .palaces.flatMap((p) => p.stems)
      .filter((s) => s.layer === 'heaven')
      .every((s) => s.punishment === null),
  );
});
test('人工规则盘: twin-branch tomb is attached to its stem and branch, not the whole palace', () => {
  const c = synthetic();
  c.palaces.find((p) => p.id === 6)!.heavenStems = ['丙', '辛'];
  c.palaces.find((p) => p.id === 8)!.heavenStems = ['丁'];
  const a = analyzeChart(c);
  const qian = a.palaces.find((p) => p.palaceId === 6)!.stems.filter((s) => s.layer === 'heaven');
  assert.deepEqual(qian[0].growth, [
    { branch: '戌', stage: '墓' },
    { branch: '亥', stage: '绝' },
  ]);
  assert.deepEqual(qian[0].tombBranches, ['戌']);
  assert.deepEqual(qian[1].tombBranches, []);
  assert.equal(qian[1].hosted, true);
  const gen = a.palaces.find((p) => p.palaceId === 8)!.stems.find((s) => s.layer === 'heaven')!;
  assert.deepEqual(gen.tombBranches, ['丑']);
  assert.deepEqual(gen.growth, [
    { branch: '丑', stage: '墓' },
    { branch: '寅', stage: '死' },
  ]);
});
test('人工规则盘: star/door/palace use their own elements and gate relation is independent', () => {
  const c = synthetic();
  c.pillars.month = '甲寅';
  const p = c.palaces.find((p) => p.id === 2)!;
  p.stars = ['天芮', '天禽'];
  p.door = '伤门';
  p.heavenStems = ['戊', '己'];
  const got = analyzeChart(c).palaces.find((p) => p.palaceId === 2)!;
  assert.equal(got.stars.length, 2);
  assert.ok(got.stars.every((s) => s.element === '土' && s.state === '囚'));
  assert.equal(got.doorStrength?.state, '旺');
  assert.equal(got.palaceStrength.state, '死');
  assert.equal(got.doorRelation?.name, '迫');
  // Fixed wood door: earth, metal, fire, water, wood palaces exercise all five relations.
  // Approved v0.2 convention: 宫生门 = 和; 门生宫 = 义.
  const gates: [PalaceId, string][] = [
    [2, '迫'],
    [7, '制'],
    [9, '义'],
    [1, '和'],
    [3, '比和'],
  ];
  for (const [id, name] of gates) {
    c.palaces.find((p) => p.id === id)!.door = '伤门';
    assert.equal(analyzeChart(c).palaces.find((p) => p.palaceId === id)!.doorRelation?.name, name);
  }
});
test('analysis is deterministic, does not mutate base chart or expose mutable default profile', () => {
  const c = generateQimen(noon),
    before = structuredClone(c);
  const a = analyzeChart(c),
    b = analyzeChart(c);
  assert.deepEqual(a, b);
  assert.deepEqual(c, before);
  assert.equal(Object.isFrozen(DEFAULT_ANNOTATION_PROFILE), true);
  assert.equal(
    new Set(a.palaces.flatMap((p) => p.stems.map((s) => s.id))).size,
    a.palaces.flatMap((p) => p.stems).length,
  );
  assert.throws(() => analyzeChart(c, { ...DEFAULT_ANNOTATION_PROFILE, version: '999' } as any));
});
