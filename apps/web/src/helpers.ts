import type { QimenInput } from '@qimen/core';
export const INITIAL: QimenInput = {
  year: 2026,
  month: 10,
  day: 28,
  hour: 12,
  minute: 0,
  second: 0,
};
const pad = (n: number) => String(n).padStart(2, '0');
export const dateString = (d: QimenInput) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
export const timeString = (d: QimenInput) => `${pad(d.hour)}:${pad(d.minute)}:${pad(d.second)}`;
export const displayTime = (d: QimenInput) => `${dateString(d)} ${timeString(d)}`;
export function parseInput(date: string, time: string): QimenInput {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second = 0] = time.split(':').map(Number);
  return { year, month, day, hour, minute, second };
}
export function downloadText(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export interface SavedItem {
  id: string;
  document: string;
  time: string;
  note: string;
}
export const STORAGE_KEY = 'qimen-dunjia.saved.v1';
export interface SavedState {
  items: SavedItem[];
  loadError: string | null;
}
/** Read errors must survive until an explicit successful retry: never overwrite unreadable data. */
export function readSaved(
  getStorage: () => Pick<Storage, 'getItem'> = () => localStorage,
): SavedState {
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    if (raw === null) return { items: [], loadError: null };
    const data: unknown = JSON.parse(raw);
    const valid = (x: unknown): x is SavedItem =>
      !!x &&
      typeof x === 'object' &&
      ['id', 'document', 'time', 'note'].every(
        (k) => typeof (x as Record<string, unknown>)[k] === 'string',
      );
    if (!Array.isArray(data) || !data.every(valid)) throw new Error('存盘结构无法识别');
    return { items: data, loadError: null };
  } catch (e) {
    return {
      items: [],
      loadError: `本机存盘读取失败：${e instanceof Error ? e.message : '浏览器存储不可用'}。已暂停保存和删除，原始记录未改动。`,
    };
  }
}
