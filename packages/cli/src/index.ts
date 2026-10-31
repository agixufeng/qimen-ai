import { generateQimen, exportChart, chartToSvg, DEFAULT_DISPLAY_OPTIONS } from '@qimen/core';

export const CLI_VERSION = '0.4.0';
const HELP = `奇门研习 ${CLI_VERSION} — fixed UTC+8, offline calculation

Usage:
  qimen chart --datetime YYYY-MM-DDTHH:mm:ss [options]
  qimen --help
  qimen --version

Options:
  --format json|svg    Output format (default: json)
  --professional      Show professional annotations
  --day-void          Include day-pillar void markers
  --day-horse         Include day-pillar horse markers
  --earth-reference   Show earth-layer reference annotations

Time is a Gregorian wall-clock timestamp in UTC+8 (1900–2100).
Do not append Z or an offset. No network, current clock, or private notes are used.
`;

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}
export function runCli(args: string[]): CliResult {
  const ok = (stdout: string): CliResult => ({ exitCode: 0, stdout, stderr: '' });
  if (args.length === 1 && args[0] === '--help') return ok(HELP);
  if (args.length === 1 && args[0] === '--version') return ok(CLI_VERSION + '\n');
  try {
    if (args[0] !== 'chart') throw new Error('使用 chart 子命令；运行 qimen --help 查看用法。');
    const values = new Map<string, string | boolean>();
    const flags = ['--professional', '--day-void', '--day-horse', '--earth-reference'];
    for (let n = 1; n < args.length; n++) {
      const key = args[n];
      if (values.has(key)) throw new Error(`选项重复：${key}`);
      if (flags.includes(key)) values.set(key, true);
      else if (key === '--datetime' || key === '--format') {
        const value = args[++n];
        if (!value || value.startsWith('--')) throw new Error(`选项缺少值：${key}`);
        values.set(key, value);
      } else throw new Error(`未知选项：${key}`);
    }
    const datetime = values.get('--datetime');
    const match =
      typeof datetime === 'string' &&
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(datetime);
    if (!match)
      throw new Error('请提供 --datetime YYYY-MM-DDTHH:mm:ss，采用固定UTC+8，不附时区后缀。');
    const format = values.get('--format') ?? 'json';
    if (format !== 'json' && format !== 'svg') throw new Error('--format 仅支持 json 或 svg。');
    const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
    const chart = generateQimen({ year, month, day, hour, minute, second });
    const options = {
      ...DEFAULT_DISPLAY_OPTIONS,
      mode: values.has('--professional') ? ('professional' as const) : ('standard' as const),
      dayVoid: values.has('--day-void'),
      dayHorse: values.has('--day-horse'),
      earthReference: values.has('--earth-reference'),
    };
    return ok(
      (format === 'json' ? exportChart(chart, undefined, options) : chartToSvg(chart, options)) +
        '\n',
    );
  } catch (error) {
    return {
      exitCode: 2,
      stdout: '',
      stderr: `${error instanceof Error ? error.message : '无法生成盘面。'}\n`,
    };
  }
}
