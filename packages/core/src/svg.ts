import type { QimenChart } from './types.js';
import type { DisplayOptions, PalaceAnnotations, StemAnnotation } from './annotation-types.js';
import { analyzeChart, DEFAULT_DISPLAY_OPTIONS, validateDisplayOptions } from './annotations.js';
const escape = (s: unknown) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
const wrap = (line: string) =>
  Array.from({ length: Math.ceil([...line].length / 23) || 1 }, (_, i) =>
    [...line].slice(i * 23, i * 23 + 23).join(''),
  );
const stemLabel = (s: StemAnnotation) =>
  `${s.layer === 'heaven' ? '天盘' : '地盘'}${s.hosted ? '寄干' : '主干'} ${s.stem}`;
export function chartToSvg(
  chart: QimenChart,
  options: DisplayOptions = DEFAULT_DISPLAY_OPTIONS,
): string {
  const o = validateDisplayOptions(options),
    a = analyzeChart(chart),
    professional = o.mode === 'professional';
  const marks = (p: PalaceAnnotations) =>
    [
      p.voids.hour?.length ? `时空·${p.voids.hour.join('')}` : '',
      p.horses.includes('hour') ? `时马·${a.pillars.hour.horseBranch}` : '',
      o.dayVoid && p.voids.day?.length ? `日空·${p.voids.day.join('')}` : '',
      o.dayHorse && p.horses.includes('day') ? `日马·${a.pillars.day.horseBranch}` : '',
    ]
      .filter(Boolean)
      .join('  ');
  const order = [4, 9, 2, 3, 5, 7, 8, 1, 6],
    cols = 348,
    lineHeight = 23;
  const cells = order.map((id) => {
    const p = chart.palaces.find((p) => p.id === id)!,
      ann = a.palaces.find((p) => p.palaceId === id)!;
    const lines = [
      `${p.name}${id} · ${p.direction} · ${ann.branches.join('') || '无地支'}`,
      `${p.deity ?? '中五原位'}${professional ? ' · ' + ann.region : ''}`,
      marks(ann),
      p.stars.join('·') || '天禽随天芮',
      p.door ?? '无门',
    ];
    for (const s of ann.stems) {
      const eligible = s.layer === 'heaven' || o.earthReference;
      const flags = eligible
        ? [
            s.punishment ? `刑·${s.punishment.branch}` : '',
            s.tombBranches.length ? `墓·${s.tombBranches.join('')}` : '',
          ]
            .filter(Boolean)
            .join(' ')
        : '';
      lines.push(stemLabel(s) + (flags ? ' [' + flags + ']' : ''));
      if (professional && eligible && s.growth.length)
        lines.push(s.growth.map((g) => g.branch + ':' + g.stage).join(' / '));
    }
    if (ann.doorRelation?.name === '迫' || professional)
      if (ann.doorRelation) lines.push(`门宫：${ann.doorRelation.name}`);
    if (professional) {
      for (const s of ann.stars) lines.push(`星 ${s.name}：${s.state}（${s.relation}）`);
      if (ann.doorStrength)
        lines.push(`门：${ann.doorStrength.state}（${ann.doorStrength.relation}）`);
      lines.push(`宫：${ann.palaceStrength.state}（${ann.palaceStrength.relation}）`);
    }
    return { id, lines: lines.flatMap(wrap) };
  });
  const rowHeights = [0, 1, 2].map(
    (row) =>
      Math.max(...cells.slice(row * 3, row * 3 + 3).map((c) => c.lines.length)) * lineHeight + 34,
  );
  const height = 230 + rowHeights.reduce((a, b) => a + b, 0) + 110,
    width = cols * 3 + 48;
  const text = (x: number, y: number, s: string, size = 16) =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="#243b35">${escape(s)}</text>`;
  const i = chart.input,
    pad = (n: number) => String(n).padStart(2, '0'),
    stamp = `${i.year}-${pad(i.month)}-${pad(i.day)} ${pad(i.hour)}:${pad(i.minute)}:${pad(i.second)} UTC+8`;
  let body =
    text(24, 36, '奇门 · 研习  v0.2', 26) +
    text(24, 66, `${stamp} · ${chart.dun}${chart.ju}局 · ${chart.term.name} ${chart.yuan}`) +
    text(
      24,
      93,
      `月令 ${a.monthBranch}${a.monthElement} · ${professional ? '专业层' : '标准盘'} · 固定东八区标准时间`,
    );
  Object.values(a.pillars).forEach((p, k) => {
    body +=
      text(24 + k * cols * 0.75, 125, `${p.label}柱 ${p.ganzhi} · ${p.xunShou}旬`, 16) +
      text(24 + k * cols * 0.75, 150, `空 ${p.voidBranches.join('')} · 驿马 ${p.horseBranch}`, 16);
  });
  body += text(
    24,
    184,
    '图例：空·支=该柱旬空；马·支=驿马；刑/墓贴具体干；地盘仅在开启参考时显示标记',
    14,
  );
  cells.forEach((c, k) => {
    const row = Math.floor(k / 3),
      x = 24 + (k % 3) * cols,
      y = 210 + rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
    body += `<rect x="${x}" y="${y}" width="${cols}" height="${rowHeights[row]}" fill="${c.id === 5 ? '#f3f6f5' : '#fff'}" stroke="#cddad5"/>`;
    c.lines.forEach((line, j) => {
      body += text(x + 14, y + 27 + j * lineHeight, line, j === 0 ? 17 : 15);
    });
  });
  body +=
    text(
      24,
      height - 72,
      `基础规则 ${chart.profile.id} / ${chart.profile.version} · 基础引擎 ${chart.engineVersion}`,
      13,
    ) +
    text(
      24,
      height - 49,
      `注解 ${a.profile.id} / ${a.profile.version} · 阳顺阴逆、土随火；星气旺衰与正五行分开`,
      13,
    ) +
    text(24, height - 26, '本图不含占事备注；规则命中不等于现实事件结论。', 13);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${escape(stamp + ' 奇门研习盘')}</title><rect width="100%" height="100%" fill="white"/><g font-family="PingFang SC,Microsoft YaHei,sans-serif">${body}</g></svg>`;
}
