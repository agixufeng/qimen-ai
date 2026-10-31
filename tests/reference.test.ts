import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateQimen, detectPatterns } from '../packages/core/src/index.js';
import { STARS, DOORS, RING, INSTRUMENTS } from '../packages/core/src/constants.js';
import type { QimenInput, PalaceId } from '../packages/core/src/index.js';
const examples = JSON.parse(
  readFileSync(new URL('../fixtures/reference-36.json', import.meta.url), 'utf8'),
);
for (const f of examples)
  test(`independent worked reference ${f.id}`, () => {
    const c = generateQimen(f.input);
    for (const [key, value] of Object.entries(f.expected)) {
      if (key === 'palaces')
        assert.deepEqual(
          c.palaces.map(({ id, earthStem, heavenStems, hostedEarthStems, stars, door, deity }) => ({
            id,
            earthStem,
            heavenStems,
            hostedEarthStems,
            stars,
            door,
            deity,
          })),
          value,
        );
      else assert.deepEqual(c[key as keyof typeof c], value, `${f.id} ${key}`);
    }
  });
test('reference coverage: eighteen ju, all six heads, and middle-palace cases', () => {
  assert.equal(examples.length, 36);
  const keys = new Set(examples.map((f: any) => f.expected.dun + f.expected.ju));
  assert.equal(keys.size, 18);
  for (const k of keys)
    assert.equal(examples.filter((f: any) => f.expected.dun + f.expected.ju === k).length, 2);
  assert.equal(new Set(examples.map((f: any) => f.expected.xunShou)).size, 6);
  assert.ok(examples.some((f: any) => f.expected.chiefStar.origin === 5));
  assert.ok(examples.some((f: any) => f.expected.chiefDoor.rawPalace === 5));
});
test('pattern predicates handle hosted stars and distinguish complete vs partial layer', () => {
  const c = generateQimen(examples[0].input);
  for (const p of c.palaces) {
    p.stars = p.id === 5 ? [] : p.id === 2 ? [STARS[2], STARS[5]] : [STARS[p.id]];
    p.door = DOORS[p.id] ?? null;
  }
  let hits = detectPatterns(c);
  assert.ok(hits.some((h) => h.name === '星伏吟'));
  assert.ok(hits.some((h) => h.name === '门伏吟'));
  assert.ok(!hits.some((h) => h.name === '门迫'));
  c.palaces[0].stars = ['天英'];
  assert.ok(!detectPatterns(c).some((h) => h.name === '星伏吟'));
  const opposing: Record<number, PalaceId> = { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4 };
  for (const p of c.palaces) {
    if (p.id === 5) continue;
    const source = opposing[p.id];
    p.stars = source === 2 ? [STARS[2], STARS[5]] : [STARS[source]];
    p.door = DOORS[source];
  }
  hits = detectPatterns(c);
  assert.ok(hits.some((h) => h.name === '星反吟'));
  assert.ok(hits.some((h) => h.name === '门反吟'));
  c.palaces[0].door = '生门';
  const pressure = detectPatterns(c).find((h) => h.id === 'door-pressure-1');
  assert.ok(pressure);
  assert.deepEqual(pressure.palaceIds, [1]);
});
test('full year daily structural invariants and chief alignment', () => {
  for (let day = 0; day < 366; day++) {
    const d = new Date(Date.UTC(2024, 0, 1 + day));
    const i: QimenInput = {
      year: 2024,
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: day % 24,
      minute: 17,
      second: 43,
    };
    const c = generateQimen(i);
    assert.deepEqual([...c.palaces.map((p) => p.earthStem)].sort(), [...INSTRUMENTS].sort());
    assert.deepEqual([...c.palaces.flatMap((p) => p.heavenStems)].sort(), [...INSTRUMENTS].sort());
    assert.equal(c.palaces[c.chiefDoor.palace - 1].door, c.chiefDoor.name);
    assert.ok(c.palaces[c.chiefStar.palace - 1].stars.includes(c.chiefStar.name));
    assert.equal(c.palaces[c.chiefStar.palace - 1].deity, '值符');
    assert.equal(new Set(RING.map((id) => c.palaces[id - 1].door)).size, 8);
    assert.equal(new Set(RING.map((id) => c.palaces[id - 1].deity)).size, 8);
  }
});
