import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSICS, getClassic, getSource } from '../packages/knowledge/src/index.js';

// The expected inventory and locators come from the linked public pages, not generated charts.
test('three classics provide distinct, source-resolvable catalogue entries', () => {
  assert.deepEqual(
    CLASSICS.map((book) => book.title),
    ['御定奇门宝鉴', '遁甲演义', '奇门遁甲统宗'],
  );
  assert.equal(new Set(CLASSICS.map((book) => book.id)).size, 3);
  const ids = new Set<string>();
  for (const book of CLASSICS) {
    assert.equal(getClassic(book.id), book);
    assert.ok(book.sourceIds.length > 0);
    for (const sourceId of book.sourceIds) assert.ok(getSource(sourceId), sourceId);
    assert.ok(book.items.length >= 2);
    for (const item of book.items) {
      assert.ok(!ids.has(item.id), item.id);
      ids.add(item.id);
      assert.ok(item.title && item.locator && item.summary);
      assert.ok(getSource(item.sourceId), item.sourceId);
      assert.ok(book.sourceIds.includes(item.sourceId));
      assert.ok(Array.isArray(item.ruleIds));
    }
  }
  assert.equal(getClassic('missing'), undefined);
  assert.equal(getClassic('遁甲演义'), undefined);
});

test('partial source coverage is disclosed instead of claiming complete books', () => {
  const yanyi = CLASSICS.find((book) => book.title === '遁甲演义')!;
  assert.match(yanyi.coverage, /卷一.*卷二.*卷三/);
  assert.match(yanyi.coverage, /卷四.*未核|未核.*卷四/);
  const tongzong = CLASSICS.find((book) => book.title === '奇门遁甲统宗')!;
  assert.match(tongzong.coverage, /卷四.*九.*略/);
  assert.ok(yanyi.items.some((item) => /卷一.*时家奇门/.test(item.locator)));
  assert.ok(yanyi.items.some((item) => /卷二.*天遁/.test(item.locator)));
  assert.ok(tongzong.items.some((item) => /卷之一.*遁甲起例/.test(item.locator)));
  assert.ok(tongzong.items.some((item) => /卷之一.*论超接之法/.test(item.locator)));
});

test('rights and method boundaries remain visible in each indexed book', () => {
  for (const book of CLASSICS) {
    assert.match(book.rights, /原创导读/);
    assert.match(book.rights, /不.*复制|不.*镜像|不.*收录/);
    assert.match(book.coverage, /索引/);
    assert.match(book.coverage, /非完整|不是完整/);
  }
  const yanyi = CLASSICS.find((book) => book.title === '遁甲演义')!;
  const teaching = yanyi.items.find((item) => /天遁/.test(item.title))!;
  assert.match(teaching.summary, /假设|假如|教学/);
  assert.match(teaching.summary, /非真实|不是.*真实|不.*实际占验/);
  const tongzong = CLASSICS.find((book) => book.title === '奇门遁甲统宗')!;
  assert.match(tongzong.coverage, /置闰|接闰/);
  assert.match(tongzong.coverage, /不.*当前.*拆补|不.*拆补.*依据/);
});

test('rule references only use known calculation identifiers and do not embed transcripts', () => {
  const known = new Set([
    'EARTH-01',
    'CHIEF-01',
    'DOOR-01',
    'RING-01',
    'JU-01',
    'PUNISHMENT-01',
    'TOMB-01',
    'PATTERN-MENPO',
    'PATTERN-stars-FU',
    'PATTERN-stars-FAN',
    'PATTERN-door-FU',
    'PATTERN-door-FAN',
  ]);
  for (const book of CLASSICS)
    for (const item of book.items) {
      for (const id of item.ruleIds) assert.ok(known.has(id), id);
      assert.ok(item.summary.length < 280);
      assert.equal('text' in item || 'html' in item || 'body' in item, false);
    }
});
