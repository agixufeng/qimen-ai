import { useEffect, useMemo, useRef, useState } from 'react';
import type { QimenInput } from '@qimen/core';
import { getSource } from '@qimen/knowledge';
import {
  assertStudyCase,
  replayStudyCase,
  type StudyCase,
  type StudyIndex,
  type StudyIndexEntry,
} from '@qimen/cases';
import { downloadText } from '../helpers';

const PAGE_SIZE = 40;
type Kind = StudyCase['kind'];
type Replay = Awaited<ReturnType<typeof replayStudyCase>>;
const LABELS: Record<Kind, string> = {
  generated: '程序盘例',
  classical: '古籍教学例',
  reported: '来源自述',
};
const EVIDENCE = {
  generated: '程序生成，非真实占验，也不作为独立算法金标准。',
  hypothetical: '古籍中的假设教学例，无实际事件反馈。',
  'source-reported': '仅据来源记载，未据此声称已独立核验。',
};
const normalize = (text: string) => text.replace(/[\s＋+\-]/g, '').toLowerCase();
const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
const chunkPath = (value: unknown): value is string =>
  typeof value === 'string' && /^chunks\/\d{3}\.json$/.test(value);
function dataUrl(path: string) {
  return new URL(path, new URL(`${import.meta.env.BASE_URL}cases/`, window.location.href));
}
function readIndex(value: unknown): StudyIndex {
  if (
    !isObject(value) ||
    value.schemaVersion !== '1.0.0' ||
    value.datasetVersion !== 'study-v1' ||
    !isObject(value.counts) ||
    !Array.isArray(value.records) ||
    !isObject(value.chunks)
  )
    throw new Error('盘例目录版本或结构不受支持。');
  const counts = value.counts;
  if (
    ['total', 'generated', 'classical', 'reported'].some(
      (key) => !Number.isSafeInteger(counts[key]) || Number(counts[key]) < 0,
    ) ||
    counts.total !== value.records.length ||
    counts.total !== Number(counts.generated) + Number(counts.classical) + Number(counts.reported)
  )
    throw new Error('盘例计数与目录不一致。');
  const ids = new Set<string>();
  const actual = { generated: 0, classical: 0, reported: 0 };
  for (const entry of value.records) {
    if (
      !isObject(entry) ||
      typeof entry.id !== 'string' ||
      !entry.id ||
      ids.has(entry.id) ||
      typeof entry.title !== 'string' ||
      !Object.hasOwn(LABELS, String(entry.kind)) ||
      !(entry.timestamp === null || typeof entry.timestamp === 'string') ||
      !strings(entry.pairs) ||
      !strings(entry.marks) ||
      !chunkPath(entry.chunk)
    )
      throw new Error('盘例目录有无法识别的记录。');
    const meta = value.chunks[entry.chunk];
    if (
      !isObject(meta) ||
      typeof meta.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(meta.sha256) ||
      !Number.isSafeInteger(meta.records) ||
      Number(meta.records) <= 0
    )
      throw new Error('盘例分片清单不完整。');
    ids.add(entry.id);
    actual[entry.kind as Kind]++;
  }
  for (const kind of Object.keys(actual) as Kind[])
    if (actual[kind] !== counts[kind]) throw new Error('盘例类型计数不一致。');
  return value as unknown as StudyIndex;
}
function readChunk(value: unknown, count: number): StudyCase[] {
  if (!Array.isArray(value) || value.length !== count) throw new Error('盘例分片计数不一致。');
  const ids = new Set();
  for (const record of value) {
    const provenance = isObject(record) ? record.provenance : null;
    const outcome = isObject(record) ? record.outcome : undefined;
    if (
      !isObject(record) ||
      record.schemaVersion !== '1.0.0' ||
      record.datasetVersion !== 'study-v1' ||
      typeof record.id !== 'string' ||
      ids.has(record.id) ||
      typeof record.title !== 'string' ||
      !Object.hasOwn(LABELS, String(record.kind)) ||
      !strings(record.suppliedConditions) ||
      !isObject(provenance) ||
      !['sourceId', 'locator', 'method', 'rights'].every(
        (key) => typeof provenance[key] === 'string',
      ) ||
      !Object.hasOwn(EVIDENCE, String(provenance.evidence)) ||
      !(
        outcome === null ||
        (isObject(outcome) &&
          ['text', 'sourceId', 'locator'].every((key) => typeof outcome[key] === 'string'))
      )
    )
      throw new Error('盘例详情版本或结构不受支持。');
    assertStudyCase(record);
    ids.add(record.id);
  }
  return value as StudyCase[];
}
async function fetchChunk(path: string, sha256: string, count: number, signal: AbortSignal) {
  if (!chunkPath(path)) throw new Error('盘例分片路径不受支持。');
  const response = await fetch(dataUrl(path), { signal });
  if (!response.ok) throw new Error(`盘例详情暂时不可用（${response.status}）。`);
  const bytes = await response.arrayBuffer();
  if (!globalThis.crypto?.subtle) throw new Error('当前环境无法校验盘例，请使用HTTPS或本机地址。');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const actual = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  if (actual !== sha256) throw new Error('盘例文件与目录校验不一致，请重新加载索引。');
  return readChunk(JSON.parse(new TextDecoder().decode(bytes)), count);
}

export function StudyCases({ onOpen }: { onOpen: (input: QimenInput) => void }) {
  const [index, setIndex] = useState<StudyIndex | null>(null);
  const [indexError, setIndexError] = useState('');
  const [indexAttempt, setIndexAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [dun, setDun] = useState('all');
  const [ju, setJu] = useState('all');
  const [mark, setMark] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudyIndexEntry | null>(null);
  const [detail, setDetail] = useState<StudyCase | null>(null);
  const [replay, setReplay] = useState<Replay | null>(null);
  const [detailError, setDetailError] = useState('');
  const [detailAttempt, setDetailAttempt] = useState(0);
  const cache = useRef(new Map<string, StudyCase[]>());
  const detailColumn = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setIndex(null);
    setIndexError('');
    setSelected(null);
    fetch(dataUrl('index.json'), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`请求失败（${response.status}）。`);
        return readIndex(await response.json());
      })
      .then((next) => {
        if (!cancelled) setIndex(next);
      })
      .catch((error) => {
        if (!cancelled) setIndexError(error instanceof Error ? error.message : '无法读取目录。');
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [indexAttempt]);
  useEffect(() => {
    setPage(1);
    setSelected(null);
  }, [query, kind, dun, ju, mark]);
  useEffect(() => {
    setDetail(null);
    setReplay(null);
    setDetailError('');
    if (!selected || !index) return;
    const controller = new AbortController();
    let cancelled = false;
    async function load() {
      try {
        const meta = index!.chunks[selected!.chunk];
        const key = `${selected!.chunk}:${meta.sha256}`;
        let records = cache.current.get(key);
        if (!records) {
          records = await fetchChunk(selected!.chunk, meta.sha256, meta.records, controller.signal);
          if (cancelled) return;
          cache.current.set(key, records);
          if (cache.current.size > 4) {
            const oldest = cache.current.keys().next().value;
            if (oldest) cache.current.delete(oldest);
          }
        } else {
          cache.current.delete(key);
          cache.current.set(key, records);
        }
        const record = records.find((item) => item.id === selected!.id);
        if (!record) throw new Error('目录条目未出现在对应盘例文件中。');
        const result = await replayStudyCase(record, selected!);
        if (!cancelled) {
          setDetail(record);
          setReplay(result);
        }
      } catch (error) {
        if (!cancelled) setDetailError(error instanceof Error ? error.message : '无法读取详情。');
      }
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selected, index, detailAttempt]);
  useEffect(() => {
    if (selected && window.matchMedia('(max-width: 760px)').matches)
      detailColumn.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selected]);
  const marks = useMemo(
    () => [...new Set(index?.records.flatMap((item) => item.marks) ?? [])].sort(),
    [index],
  );
  const filtered = useMemo(() => {
    const needle = normalize(query);
    return (index?.records ?? []).filter(
      (item) =>
        (kind === 'all' || item.kind === kind) &&
        (dun === 'all' || item.dun === dun) &&
        (ju === 'all' || item.ju === Number(ju)) &&
        (mark === 'all' || item.marks.includes(mark)) &&
        normalize(
          `${item.id} ${item.title} ${item.timestamp ?? ''} ${item.pairs.join(' ')} ${item.marks.join(' ')}`,
        ).includes(needle),
    );
  }, [index, query, kind, dun, ju, mark]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const source = detail && getSource(detail.provenance.sourceId);
  const canOpen = !!(detail?.input && replay?.supported && replay.baseMatches === true);
  const clear = () => {
    setQuery('');
    setKind('all');
    setDun('all');
    setJu('all');
    setMark('all');
  };
  return (
    <main className="reading-page study-page">
      <div className="eyebrow">盘例与证据 / STUDY CASES</div>
      <h2>混合研习盘例</h2>
      <p className="lead">
        按来源类型阅读与复算。程序盘例用于练习规则，古籍教学例保留原条件；记录数量不代表真实占验数量或算法已获独立验证。
      </p>
      {indexError ? (
        <div className="study-error" role="alert">
          <p>盘例索引加载失败：{indexError}</p>
          <button onClick={() => setIndexAttempt((attempt) => attempt + 1)}>重新加载索引</button>
        </div>
      ) : !index ? (
        <p role="status">正在加载盘例索引…</p>
      ) : (
        <>
          <div className="study-counts" data-testid="study-counts">
            <div>
              <span>研习记录</span>
              <strong>{index.counts.total.toLocaleString('en-US')}</strong>
            </div>
            <div>
              <span>程序盘例</span>
              <strong>{index.counts.generated.toLocaleString('en-US')}</strong>
            </div>
            <div>
              <span>古籍教学例 {index.counts.classical}</span>
              <small>保留原例条件</small>
            </div>
            <div>
              <span>来源自述 {index.counts.reported}</span>
              <small>与独立核验分别计数</small>
            </div>
          </div>
          <section
            className="study-downloads"
            data-testid="study-downloads"
            aria-label="完整盘例数据下载"
          >
            <div>
              <a href={dataUrl('study-v1.jsonl.gz').href} download="qimen-study-v1.jsonl.gz">
                下载全部记录（JSONL.gz）
              </a>
              <a href={dataUrl('manifest.json').href} target="_blank" rel="noreferrer">
                数据清单与覆盖统计
              </a>
              <a href={dataUrl('SHA256SUMS').href} target="_blank" rel="noreferrer">
                SHA-256校验清单
              </a>
            </div>
            <p>
              全包含 {index.counts.generated.toLocaleString('en-US')} 条程序盘例、
              {index.counts.classical} 条古籍教学例、{index.counts.reported}{' '}
              条来源自述。本版为混合研习库，非真实占验库，不含用户备注。
            </p>
          </section>
          <div className="study-filters">
            <label className="study-query">
              搜索盘例
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="编号、标题、乙丁、刑墓…"
              />
            </label>
            <label>
              盘例类型
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setDun('all');
                  setJu('all');
                  setMark('all');
                }}
              >
                <option value="all">全部类型</option>
                {Object.entries(LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              阴阳遁
              <select value={dun} onChange={(e) => setDun(e.target.value)}>
                <option value="all">全部阴阳遁</option>
                <option value="阳遁">阳遁</option>
                <option value="阴遁">阴遁</option>
              </select>
            </label>
            <label>
              局数
              <select value={ju} onChange={(e) => setJu(e.target.value)}>
                <option value="all">全部局数</option>
                {Array.from({ length: 9 }, (_, n) => (
                  <option key={n} value={n + 1}>
                    {n + 1}局
                  </option>
                ))}
              </select>
            </label>
            <label>
              参数或格局
              <select value={mark} onChange={(e) => setMark(e.target.value)}>
                <option value="all">全部标记</option>
                {marks.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="study-results-heading">
            <p className="small muted" aria-live="polite">
              匹配 {filtered.length.toLocaleString('en-US')} 条 · 每页最多 {PAGE_SIZE} 条 · 索引{' '}
              {index.datasetVersion}
            </p>
            <button onClick={clear}>清除筛选</button>
          </div>
          <div className="study-layout">
            <section className="study-results" aria-label="盘例列表">
              {visible.length === 0 ? (
                <p className="empty">没有匹配的盘例。</p>
              ) : (
                <ul className="study-list">
                  {visible.map((item) => (
                    <li
                      key={item.id}
                      data-study-id={item.id}
                      className={selected?.id === item.id ? 'selected' : ''}
                    >
                      <div className="study-row-meta">
                        <span>{LABELS[item.kind]}</span>
                        <code>{item.id}</code>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.timestamp ? item.timestamp : '原例未提供可复算的公历时间'}</p>
                      {item.dun && (
                        <p>
                          {item.dun}
                          {item.ju}局 · {item.xunShou ?? '旬首未记'}
                        </p>
                      )}
                      {item.marks.length > 0 && (
                        <div className="study-tags">
                          {item.marks.slice(0, 7).map((value) => (
                            <span key={value}>{value}</span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setSelected(item)}
                        aria-pressed={selected?.id === item.id}
                      >
                        查看详情
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="study-pagination">
                <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                  上一页
                </button>
                <span>
                  第 {currentPage} / {pages} 页
                </span>
                <button disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>
                  下一页
                </button>
              </div>
            </section>
            <aside ref={detailColumn} className="study-detail-column" aria-label="盘例详情">
              {!selected ? (
                <div className="study-detail-empty">
                  <div className="eyebrow">选一条盘例</div>
                  <h3>从事实与来源开始</h3>
                  <p>
                    点击“查看详情”后加载对应记录。只有能按当前版本重放、且基础盘一致的程序盘，才可打开到工作台。
                  </p>
                </div>
              ) : detailError ? (
                <div className="study-error" role="alert">
                  <p>盘例详情加载失败：{detailError}</p>
                  <button onClick={() => setDetailAttempt((attempt) => attempt + 1)}>
                    重试详情
                  </button>
                  <button onClick={() => setIndexAttempt((attempt) => attempt + 1)}>
                    重新加载索引
                  </button>
                </div>
              ) : !detail || !replay ? (
                <p role="status">正在校验与加载盘例详情…</p>
              ) : (
                <section className="study-detail" data-testid="study-detail" aria-live="polite">
                  <div className="eyebrow">
                    {LABELS[detail.kind]} / {detail.id}
                  </div>
                  <h3>{detail.title}</h3>
                  <p className="study-evidence">{EVIDENCE[detail.provenance.evidence]}</p>
                  <dl>
                    <div>
                      <dt>原例条件</dt>
                      <dd>
                        {detail.suppliedConditions.length ? (
                          <ul>
                            {detail.suppliedConditions.map((text, i) => (
                              <li key={i}>{text}</li>
                            ))}
                          </ul>
                        ) : (
                          '按公开合成输入生成。'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>生成或整理</dt>
                      <dd>{detail.provenance.method}</dd>
                    </div>
                    <div>
                      <dt>来源定位</dt>
                      <dd>{detail.provenance.locator}</dd>
                    </div>
                    <div>
                      <dt>实际反馈</dt>
                      <dd>
                        {detail.outcome ? (
                          <>
                            {detail.outcome.text}
                            <small>{detail.outcome.locator}</small>
                          </>
                        ) : (
                          '无实际反馈'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>使用范围</dt>
                      <dd>{detail.provenance.rights}</dd>
                    </div>
                  </dl>
                  {source && (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title} ↗
                    </a>
                  )}
                  {!source && <p className="small muted">来源标识：{detail.provenance.sourceId}</p>}
                  <div className={`study-replay ${canOpen ? 'matches' : ''}`}>
                    <b>
                      {replay.supported
                        ? replay.baseMatches
                          ? '基础盘一致'
                          : '基础盘存在差异'
                        : '不能按当前引擎重排'}
                    </b>
                    <p>
                      {replay.reason ||
                        (canOpen
                          ? '已按记录中的版本与输入复算，可在工作台查看完整九宫与辅助参数。'
                          : '保留原例条件，不补造日期，也不把该例当作当前规则的正确答案。')}
                    </p>
                    {replay.chart && (
                      <p className="study-pillars">
                        {replay.chart.pillars.year} · {replay.chart.pillars.month} ·{' '}
                        {replay.chart.pillars.day} · {replay.chart.pillars.hour}
                      </p>
                    )}
                  </div>
                  <div className="study-detail-actions">
                    <button
                      disabled={!canOpen}
                      onClick={() => {
                        if (canOpen && detail.input) onOpen(detail.input);
                      }}
                    >
                      在工作台打开
                    </button>
                    <button
                      onClick={() =>
                        downloadText(
                          JSON.stringify(detail, null, 2),
                          `qimen-study-${detail.id}.json`,
                          'application/json;charset=utf-8',
                        )
                      }
                    >
                      下载此条 JSON
                    </button>
                  </div>
                  <p className="small muted study-download-note">
                    下载为研习库记录，保留来源与原条件。可复算盘例请在工作台另存为排盘文档。
                  </p>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
