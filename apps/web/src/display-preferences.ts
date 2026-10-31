import { DEFAULT_DISPLAY_OPTIONS, type DisplayOptions } from '@qimen/core';
export const DISPLAY_KEY = 'qimen-dunjia.display.v1';
export interface DisplayState {
  options: DisplayOptions;
  loadError: string | null;
}
export function readDisplayPreferences(
  getStorage: () => Pick<Storage, 'getItem'> = () => localStorage,
): DisplayState {
  try {
    const raw = getStorage().getItem(DISPLAY_KEY);
    if (raw === null) return { options: { ...DEFAULT_DISPLAY_OPTIONS }, loadError: null };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw new Error('显示偏好格式不正确');
    const v = value as Record<string, unknown>;
    if (
      !['standard', 'professional'].includes(v.mode as string) ||
      !['dayVoid', 'dayHorse', 'earthReference'].every((k) => typeof v[k] === 'boolean')
    )
      throw new Error('显示偏好版本或字段不正确');
    return {
      options: {
        mode: v.mode as DisplayOptions['mode'],
        dayVoid: v.dayVoid as boolean,
        dayHorse: v.dayHorse as boolean,
        earthReference: v.earthReference as boolean,
      },
      loadError: null,
    };
  } catch (e) {
    return {
      options: { ...DEFAULT_DISPLAY_OPTIONS },
      loadError: `显示偏好读取失败：${e instanceof Error ? e.message : '浏览器存储不可用'}。以默认显示开启，本次调整仅用于当前页面，原偏好未改动。`,
    };
  }
}
