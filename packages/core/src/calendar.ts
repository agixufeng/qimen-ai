import lunarLibrary from 'lunar-javascript';
import { BRANCHES, STEMS, TERM_JU, mod } from './constants.js';
import type { QimenInput } from './types.js';
export function validateInput(input: QimenInput): void {
  if (!input || typeof input !== 'object') throw new Error('请输入完整的公历日期和时间。');
  for (const k of ['year', 'month', 'day', 'hour', 'minute', 'second'] as const)
    if (!Number.isInteger(input[k])) throw new Error(`${k} 必须是整数。`);
  const { year: y, month: m, day: d, hour: h, minute: mi, second: s } = input;
  if (
    y < 1900 ||
    y > 2100 ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    h < 0 ||
    h > 23 ||
    mi < 0 ||
    mi > 59 ||
    s < 0 ||
    s > 59
  )
    throw new Error('日期时间超出范围：公历1900—2100年，时0—23，分秒0—59。');
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d)
    throw new Error('这个公历日期不存在，请检查月份、天数和闰年。');
}
export function cycleIndex(gz: string): number {
  for (let i = 0; i < 60; i++) if (STEMS[i % 10] + BRANCHES[i % 12] === gz) return i;
  throw new Error(`历法返回了无法识别的干支：${gz}`);
}
export function calendar(input: QimenInput) {
  validateInput(input);
  const { year, month, day, hour, minute, second } = input;
  const lunar = lunarLibrary.Solar.fromYmdHms(year, month, day, hour, minute, second).getLunar();
  const prev = lunar.getPrevJieQi(false),
    next = lunar.getNextJieQi(false);
  const term = {
    name: prev.getName() as string,
    startsAt: prev.getSolar().toYmdHms() + '+08:00',
    nextAt: next.getSolar().toYmdHms() + '+08:00',
  };
  const pillars = {
    year: lunar.getYearInGanZhiExact() as string,
    month: lunar.getMonthInGanZhiExact() as string,
    day: lunar.getDayInGanZhiExact() as string,
    hour: lunar.getTimeInGanZhi() as string,
  };
  const index = cycleIndex(pillars.day),
    head = mod(index - (index % 5), 60);
  const fuTou = STEMS[head % 10] + BRANCHES[head % 12];
  const yuanIndex = (head % 12) % 3 === 0 ? 0 : (head % 12) % 3 === 2 ? 1 : 2;
  const yuan = (['上元', '中元', '下元'] as const)[yuanIndex];
  const row = TERM_JU[term.name];
  if (!row) throw new Error('当前节气不在已支持的规则表中。');
  return {
    pillars,
    term,
    fuTou,
    yuan,
    dun: row.dun,
    ju: row.numbers[yuanIndex],
    hourIndex: cycleIndex(pillars.hour),
  };
}
/** UI adapter only; the deterministic engine never reads the clock. */
export function nowUtc8(): QimenInput {
  return fromWallTimestamp(Date.now() + 480 * 60000);
}
function fromWallTimestamp(ts: number): QimenInput {
  const d = new Date(ts);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}
export function shiftTime(input: QimenInput, hours: number): QimenInput {
  validateInput(input);
  if (!Number.isFinite(hours)) throw new Error('时间偏移必须是有限数。');
  const result = fromWallTimestamp(
    Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, input.second) +
      hours * 3600000,
  );
  validateInput(result);
  return result;
}
