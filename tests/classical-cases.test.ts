import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSICAL_CASES, getSource } from '../packages/knowledge/src/index.js';

test('two classical teaching examples have stable distinct ids and resolvable source locators', () => {
  assert.deepEqual(
    CLASSICAL_CASES.map((entry) => entry.id),
    ['classical-tiandun-yang4', 'classical-tiandun-yin6'],
  );
  for (const entry of CLASSICAL_CASES) {
    assert.equal(entry.sourceId, 'dunjia-yanyi-wikisource');
    assert.ok(getSource(entry.sourceId));
    assert.match(entry.locator, /卷二.*天遁/);
    assert.ok(entry.suppliedConditions.length > 0);
    assert.ok(entry.summary.length > 0);
    assert.match(entry.rights, /原创/);
  }
});

test('classical givens preserve the day-stem groups, hour pillars and separate target palaces', () => {
  const [yang, yin] = CLASSICAL_CASES;
  const yangFacts = yang.suppliedConditions.join(' ');
  const yinFacts = yin.suppliedConditions.join(' ');
  assert.match(yangFacts, /阳遁四局/);
  assert.match(yangFacts, /乙、庚/);
  assert.match(yangFacts, /乙酉/);
  assert.match(yangFacts, /天心.*值符/);
  assert.match(yangFacts, /开门.*值使/);
  assert.match(yangFacts, /一宫/);
  assert.match(yinFacts, /阴遁六局/);
  assert.match(yinFacts, /戊、癸/);
  assert.match(yinFacts, /庚申/);
  assert.match(yinFacts, /天蓬.*值符/);
  assert.match(yinFacts, /休门.*值使/);
  assert.match(yinFacts, /九宫/);
  assert.notEqual(yangFacts, yinFacts);
});

test('teaching examples do not fabricate civil dates, event outcomes or replayable charts', () => {
  for (const entry of CLASSICAL_CASES) {
    assert.equal(entry.evidence, 'hypothetical');
    assert.equal(entry.input, null);
    assert.equal(entry.outcome, null);
    assert.equal(entry.replayStatus, 'unsupported');
    assert.match(entry.summary, /教学假设/);
    assert.match(entry.summary, /未.*完整|没有.*完整/);
    assert.match(entry.summary, /不.*公历|不.*反馈/);
    assert.equal('chart' in entry || 'person' in entry || 'event' in entry, false);
    assert.doesNotMatch(entry.suppliedConditions.join(' '), /\b\d{4}-\d{2}-\d{2}\b/);
  }
});
