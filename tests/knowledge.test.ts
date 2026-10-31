import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMBINATIONS,
  SOURCES,
  getCombination,
  getSource,
  KNOWLEDGE_VERSION,
} from '../packages/knowledge/src/index.js';

test('knowledge covers exactly the 81 ordered pairs without duplicates', () => {
  const stems = [...'乙丙丁戊己庚辛壬癸'];
  assert.equal(COMBINATIONS.length, 81);
  assert.equal(new Set(COMBINATIONS.map((item) => item.id)).size, 81);
  for (const heaven of stems)
    for (const earth of stems) {
      const entry = getCombination(heaven, earth);
      assert.ok(entry, `${heaven}+${earth}`);
      assert.equal(entry.heaven, heaven);
      assert.equal(entry.earth, earth);
      assert.ok(entry.summary.length > 0);
      assert.ok(entry.conditions.length > 0);
      assert.ok(entry.sourceIds.length > 0);
      for (const id of entry.sourceIds) assert.ok(getSource(id), id);
    }
});

test('ordered pairs preserve direction, and unknown inputs are rejected', () => {
  assert.equal(getCombination('乙', '辛')?.name, '青龙逃走');
  assert.equal(getCombination('辛', '乙')?.name, '白虎猖狂');
  assert.notEqual(getCombination('乙', '辛')?.summary, getCombination('辛', '乙')?.summary);
  assert.equal(getCombination('甲', '乙'), undefined);
  assert.equal(getCombination('乙 ', '辛'), undefined);
  assert.equal(getSource('missing'), undefined);
});

test('sources retain rights, exact section and unresolved transcription status', () => {
  assert.equal(new Set(SOURCES.map((s) => s.id)).size, SOURCES.length);
  for (const source of SOURCES) {
    assert.ok(source.locator.length > 0);
    assert.ok(source.rights.length > 0);
  }
  for (const id of ['shenqi-setup', 'shenqi-patterns', 'yuding', 'project-profile'])
    assert.ok(getSource(id));
  assert.equal(getCombination('辛', '辛')?.readings[1]?.status, 'pending');
  assert.match(getCombination('乙', '丁')?.readings[1]?.note ?? '', /奇仪相佐/);
  assert.match(getCombination('丁', '乙')?.conditions.join(' ') ?? '', /人遁/);
});

// Independently transcribed short names, 第一节十干克应; “人” OCR variants are
// displayed as 入 with a pending source note, except 庚丙 self-corrected in the same paragraph.
const SHENQI_EXPECTED = {
  乙: '日奇伏吟|奇仪顺遂|奇仪相佐|阴害阳门|日奇入墓|日奇被刑|青龙逃走|日奇入地|华盖逢星',
  丙: '日月并行|月奇悖师|星奇朱雀|鸟跌穴|火悖入刑|荧入太白|谋事能成|火入天罗|华盖悖师',
  丁: '人遁吉格|星随月转|星奇入太阴|青龙转光|火入勾陈|文书阻隔|朱雀入狱|贵人恩诏|朱雀投江',
  戊: '青龙和会|青龙返首|青龙耀明|伏吟|贵人入狱|值符飞宫|青龙折足|青龙入天牢|青龙华盖',
  己: '墓神不明／地户逢星|火悖地户|朱雀入墓|犬遇青龙|地户逢鬼|刑格返名|游魂入墓|地网高张|地刑玄武',
  庚: '太白逢星|太白入荧|亭亭之格|天乙伏宫|官符刑格|太白同宫／战格|白虎干格|上格|大格',
  辛: '白虎猖狂|干合悖师|狱神得奇|困龙被伤|入狱自刑|白虎出力|伏吟天庭|凶蛇入狱|天牢华盖',
  壬: '小蛇得势|水蛇入火|干合蛇刑|小蛇化龙|反吟蛇刑|太白擒蛇|螣蛇相缠|蛇入地罗|幼女奸淫',
  癸: '华盖逢星|华盖悖师|螣蛇夭矫|天乙会合|华盖地户|太白入网|网盖天牢|复见螣蛇|天网四张',
};

test('81 defaults use a source-labelled Shenqi reading and retain the Yuding reading', () => {
  assert.equal(KNOWLEDGE_VERSION, 'shenqi-first-dual-v1');
  const stems = [...'乙丙丁戊己庚辛壬癸'];
  for (const [heaven, row] of Object.entries(SHENQI_EXPECTED)) {
    for (const [column, name] of row.split('|').entries()) {
      const entry = getCombination(heaven, stems[column]!);
      assert.ok(entry);
      assert.equal(entry.name, name, entry.id);
      assert.equal(entry.primarySourceId, 'shenqi-patterns');
      assert.deepEqual(
        entry.readings.map((r) => r.sourceId),
        ['shenqi-patterns', 'yuding-hunhe'],
      );
      assert.deepEqual(entry.sourceIds, ['shenqi-patterns', 'yuding-hunhe']);
      const primary = entry.readings[0]!;
      assert.equal(entry.summary, primary.summary);
      assert.deepEqual(entry.conditions, primary.conditions);
      assert.equal(entry.status, primary.status);
      assert.equal(entry.note, primary.note);
      for (const reading of entry.readings) {
        assert.ok(reading.locator.length > 0);
        assert.ok(reading.summary.length > 0);
        assert.ok(reading.conditions.length > 0);
        assert.ok(getSource(reading.sourceId));
      }
    }
  }
});

test('variant names keep separate interpretations rather than carrying an old summary forward', () => {
  const yiDing = getCombination('乙', '丁')!;
  assert.deepEqual(
    yiDing.readings.map((r) => r.name),
    ['奇仪相佐', '朱雀入墓'],
  );
  assert.notEqual(yiDing.readings[0]!.summary, yiDing.readings[1]!.summary);
  assert.match(yiDing.readings[0]!.summary, /配合|协作/);
  const dingGeng = getCombination('丁', '庚')!;
  assert.deepEqual(
    dingGeng.readings.map((r) => r.name),
    ['文书阻隔', '织女寻牛'],
  );
  assert.notEqual(dingGeng.readings[0]!.summary, dingGeng.readings[1]!.summary);
  assert.match(dingGeng.readings[0]!.summary, /材料|文书/);
  assert.equal(getCombination('辛', '辛')!.status, 'verified');
  assert.equal(getCombination('辛', '辛')!.readings[1]!.status, 'pending');
});

test('transcription uncertainty and editorial labels remain visible per reading', () => {
  for (const [heaven, earth] of [
    ['乙', '壬'],
    ['丁', '丁'],
    ['丁', '辛'],
    ['己', '丁'],
    ['壬', '壬'],
  ]) {
    const reading = getCombination(heaven!, earth!)!.readings[0]!;
    assert.equal(reading.status, 'pending');
    assert.match(reading.note ?? '', /人.*入/);
  }
  assert.equal(getCombination('庚', '丙')!.status, 'verified');
  assert.match(getCombination('庚', '丙')!.note ?? '', /同条/);
  assert.equal(getCombination('丙', '辛')!.readings[0]!.nameKind, 'editorial');
  assert.equal(getCombination('丁', '壬')!.readings[0]!.nameKind, 'editorial');
  assert.match(getCombination('丙', '辛')!.note ?? '', /摘要标签/);
  assert.match(getCombination('丁', '壬')!.note ?? '', /摘要标签/);
});
