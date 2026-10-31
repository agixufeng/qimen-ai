import { useEffect, useState, type FormEvent } from 'react';
import {
  generateQimen,
  detectPatterns,
  shiftTime,
  nowUtc8,
  exportChart,
  importChart,
  chartToSvg,
  analyzeChart,
  type ChartAnnotations,
  type DisplayOptions,
  type QimenChart,
  type QimenInput,
  type PalaceId,
} from '@qimen/core';
import { Board, PalaceDetails, Patterns, SourceLink } from './components/Board';
import { Knowledge, Sources, Examples } from './components/Knowledge';
import { Classics, Developers } from './components/LaunchPages';
import { StudyCases } from './components/StudyCases';
import { Controls } from './components/Controls';
import {
  DisplayControls,
  PillarTable,
  ParameterDetail,
  PalaceAnnotationDetails,
  type ParameterFocus,
} from './components/Annotations';
import { readDisplayPreferences, DISPLAY_KEY, type DisplayState } from './display-preferences';
import {
  INITIAL,
  dateString,
  timeString,
  displayTime,
  parseInput,
  downloadText,
  readSaved,
  STORAGE_KEY,
  type SavedItem,
  type SavedState,
} from './helpers';
const getRoute = () => location.hash.replace(/^#\/?/, '') || 'chart';
export function App() {
  const [route, setRoute] = useState(getRoute);
  const [date, setDate] = useState(dateString(INITIAL));
  const [time, setTime] = useState(timeString(INITIAL));
  const [chart, setChart] = useState<QimenChart | null>(null);
  const [annotations, setAnnotations] = useState<ChartAnnotations | null>(null);
  const [focus, setFocus] = useState<ParameterFocus | null>(null);
  const [displayState, setDisplayState] = useState<DisplayState>(() => readDisplayPreferences());
  const displayOptions = displayState.options;
  const [selected, setSelected] = useState<PalaceId>(1);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [storageState, setStorageState] = useState<SavedState>(() => readSaved());
  const saved = storageState.items;
  useEffect(() => {
    const listener = () => setRoute(getRoute());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    try {
      const initial = generateQimen(INITIAL);
      const auxiliary = analyzeChart(initial);
      setChart(initial);
      setAnnotations(auxiliary);
    } catch (e) {
      setError(errorText(e));
    }
  }, []);
  const setInput = (v: QimenInput) => {
    setDate(dateString(v));
    setTime(timeString(v));
  };
  function calculate(input: QimenInput) {
    try {
      const next = generateQimen(input);
      const auxiliary = analyzeChart(next);
      setChart(next);
      setAnnotations(auxiliary);
      setFocus(null);
      setInput(input);
      setError('');
      setNotice('已起局；盘面时间已更新。');
      return true;
    } catch (e) {
      setError(
        `${errorText(e)}。${chart ? '盘面仍为上一次成功起局，请核对盘面时间。' : '请修正输入后重新起局。'}`,
      );
      setNotice('');
      return false;
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    calculate(parseInput(date, time));
  }
  function step(hours: number) {
    if (chart) {
      try {
        calculate(shiftTime(chart.input, hours));
      } catch (e) {
        setError(errorText(e));
      }
    }
  }
  function persist(items: SavedItem[]) {
    if (storageState.loadError) throw new Error('本机存盘尚未恢复读取，保存和删除已暂停');
    const current = readSaved();
    if (current.loadError) {
      setStorageState((previous) => ({ ...previous, loadError: current.loadError }));
      throw new Error(current.loadError);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    setStorageState({ items, loadError: null });
  }
  function retryStorage() {
    const next = readSaved();
    setStorageState((previous) =>
      next.loadError ? { ...previous, loadError: next.loadError } : next,
    );
    if (!next.loadError) setNotice('本机存盘已重新读取，可继续保存。');
  }
  function save() {
    if (!chart) return;
    try {
      persist([
        {
          id: crypto.randomUUID(),
          document: exportChart(chart, note, displayOptions),
          time: displayTime(chart.input),
          note,
        },
        ...saved,
      ]);
      setNotice('已保存到本机浏览器。');
      setError('');
    } catch (e) {
      setError(`保存失败：${errorText(e)}`);
    }
  }
  function load(text: string) {
    try {
      const result = importChart(text);
      setChart(result.chart);
      setAnnotations(result.annotations);
      setFocus(null);
      updateDisplay(result.displayOptions);
      setInput(result.chart.input);
      setNote(result.note);
      setError('');
      setNotice(
        result.legacy
          ? `基础盘已比对；辅助参数按v0.2新增。${result.baseMatches ? '基础盘一致。' : '基础盘存在差异，当前展示重算盘。'}`
          : `导入成功：${result.baseMatches ? '基础盘一致' : '基础盘存在差异'}；${result.annotationsMatch ? '辅助参数一致' : '辅助参数存在差异'}。当前展示重算后的盘面。`,
      );
      location.hash = '/chart';
    } catch (e) {
      setError(`导入失败：${errorText(e)}。当前盘面未更新。`);
      setNotice('');
    }
  }
  function remove(id: string) {
    try {
      persist(saved.filter((s) => s.id !== id));
      setNotice('已删除这条本机存盘。');
    } catch (e) {
      setError(errorText(e));
    }
  }
  function download(kind: 'json' | 'svg') {
    if (!chart) return;
    try {
      downloadText(
        kind === 'json'
          ? exportChart(chart, note, displayOptions)
          : chartToSvg(chart, displayOptions),
        `qimen-${dateString(chart.input)}-${timeString(chart.input).replaceAll(':', '')}.${kind}`,
        kind === 'json' ? 'application/json;charset=utf-8' : 'image/svg+xml;charset=utf-8',
      );
      setNotice(kind === 'svg' ? 'SVG 已导出，不包含占事备注。' : 'JSON 已导出，包含当前备注。');
    } catch (e) {
      setError(errorText(e));
    }
  }
  function updateDisplay(options: DisplayOptions) {
    let loadError = displayState.loadError;
    if (!loadError) {
      const current = readDisplayPreferences();
      loadError = current.loadError;
      if (!loadError) {
        try {
          localStorage.setItem(DISPLAY_KEY, JSON.stringify(options));
        } catch (e) {
          loadError = `显示偏好保存失败：${errorText(e)}。本次调整仅用于当前页面。`;
        }
      }
    }
    setDisplayState({ options, loadError });
  }
  function inspect(next: ParameterFocus) {
    setFocus(next);
    if ('palaceId' in next) setSelected(next.palaceId);
  }
  function selectPalace(id: PalaceId) {
    setSelected(id);
    setFocus(null);
  }
  const dirty = chart && (date !== dateString(chart.input) || time !== timeString(chart.input));
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#/chart">
          <span className="seal" aria-hidden="true">
            奇<br />門
          </span>
          <span>
            <h1>奇门研习</h1>
            <small>QIMEN DUNJIA / OPEN WORKBENCH</small>
          </span>
        </a>
        <nav aria-label="主导航">
          {[
            ['chart', '起局'],
            ['combinations', '81 格'],
            ['classics', '古籍'],
            ['cases', '盘例'],
            ['developers', '开发者'],
            ['sources', '来源'],
            ['examples', '示例'],
          ].map(([key, label]) => (
            <a
              key={key}
              className={route === key ? 'active' : ''}
              href={`#/${key}`}
              aria-current={route === key ? 'page' : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <span className="edition">
          时家转盘 <b>v0.4</b>
        </span>
      </header>
      <div className="message-region">
        {error && (
          <div className="message error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="message success" role="status">
            {notice}
          </div>
        )}
      </div>
      {route === 'combinations' ? (
        <Knowledge />
      ) : route === 'classics' ? (
        <Classics />
      ) : route === 'cases' ? (
        <StudyCases
          onOpen={(input) => {
            if (calculate(input)) location.hash = '/chart';
          }}
        />
      ) : route === 'developers' ? (
        <Developers engineVersion={chart?.engineVersion} />
      ) : route === 'sources' ? (
        <Sources />
      ) : route === 'examples' ? (
        <Examples
          onOpen={(v) => {
            if (calculate(v)) {
              setNote('');
              location.hash = '/chart';
            }
          }}
        />
      ) : route !== 'chart' ? (
        <main className="reading-page">
          <h2>未找到页面</h2>
          <a href="#/chart">返回起局工作台</a>
        </main>
      ) : (
        <main className="workbench">
          <Controls
            {...{ date, time, note, setDate, setTime, setNote, saved }}
            storageError={storageState.loadError}
            onRetryStorage={retryStorage}
            onSubmit={submit}
            onNow={() => calculate(nowUtc8())}
            onSave={save}
            onLoad={(s) => load(s.document)}
            onDelete={remove}
          />
          <section className="chart-column">
            {chart && annotations ? (
              <>
                <div className="chart-title">
                  <div>
                    <div className="eyebrow">时家转盘 · 拆补</div>
                    <h2>
                      {chart.dun}
                      {chart.ju}局 <span>{chart.yuan}</span>
                    </h2>
                  </div>
                  <div className="chart-timestamp">
                    <b data-testid="chart-time">{displayTime(chart.input)}</b>
                    <span>UTC+8 · {chart.term.name}</span>
                  </div>
                </div>
                {dirty && <p className="draft-warning">输入已修改。点击「起局」后更新盘面。</p>}
                <PillarTable annotations={annotations} onFocus={inspect} />
                <DisplayControls
                  options={displayOptions}
                  onChange={updateDisplay}
                  warning={displayState.loadError}
                />
                <div className="chief-row">
                  <span>
                    旬首 <b>{chart.xunShou}</b>
                  </span>
                  <span>
                    值符 <b>{chart.chiefStar.name}</b>
                  </span>
                  <span>
                    值使 <b>{chart.chiefDoor.name}</b>
                  </span>
                </div>
                <Board
                  chart={chart}
                  selected={selected}
                  onSelect={selectPalace}
                  annotations={annotations}
                  options={displayOptions}
                  onFocus={inspect}
                />
                <div className="time-controls">
                  <button onClick={() => step(-2)} aria-label="前一个时辰">
                    ← 前一时辰
                  </button>
                  <span>以当前盘面时间切换</span>
                  <button onClick={() => step(2)} aria-label="后一个时辰">
                    后一时辰 →
                  </button>
                </div>
                <div className="export-controls">
                  <button onClick={() => download('json')}>导出 JSON</button>
                  <label className="file-button">
                    导入 JSON
                    <input
                      type="file"
                      accept=".json,application/json"
                      aria-label="导入 JSON"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          try {
                            if (f.size > 1_000_000) throw new Error('文件超过 1 MB');
                            load(await f.text());
                          } catch (err) {
                            setError(errorText(err));
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  <button onClick={() => download('svg')}>导出 SVG</button>
                </div>
                <details className="trace">
                  <summary>
                    查看起局过程与规则 <span>{chart.trace.length} 步</span>
                  </summary>
                  <ol>
                    {chart.trace.map((s, i) => (
                      <li key={`${s.ruleId}-${i}`}>
                        <b>{s.title}</b>
                        <p>{s.detail}</p>
                        <code>{s.ruleId}</code>
                        <div className="source-links">
                          <SourceLink id={s.sourceId} />
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="small muted">
                    辅助参数 {annotations.profile.id} / {annotations.profile.version}
                    <br />
                    历法 {chart.calendarVersion} · 引擎 {chart.engineVersion}
                    <br />
                    {chart.profile.id} / {chart.profile.version}
                    <br />
                    本节气起点 {chart.term.startsAt} · 下次交节 {chart.term.nextAt}
                  </p>
                </details>
              </>
            ) : (
              <div className="empty">盘面尚未生成。请检查输入或上方错误信息。</div>
            )}
          </section>
          <aside className="detail-column">
            {chart && annotations && (
              <>
                {focus && (
                  <ParameterDetail
                    focus={focus}
                    annotations={annotations}
                    chart={chart}
                    onClose={() => setFocus(null)}
                  />
                )}
                {!focus && (
                  <PalaceAnnotationDetails
                    palace={annotations.palaces.find((p) => p.palaceId === selected)!}
                    options={displayOptions}
                    annotations={annotations}
                    onFocus={inspect}
                  />
                )}
                <PalaceDetails palace={chart.palaces.find((p) => p.id === selected)!} />
                <Patterns hits={detectPatterns(chart)} />
              </>
            )}
          </aside>
        </main>
      )}
      <footer>
        <span>奇门研习 · 时家转盘拆补法</span>
        <span>传统术数研习资料 · 解释规则不等于事件结论</span>
        <div className="project-resources" role="navigation" aria-label="项目资源">
          <a href="#/sources">查看依据</a>
          <a href="https://github.com/agixufeng/qimen-ai" target="_blank" rel="noreferrer">
            GitHub源代码
          </a>
          <a
            href="https://github.com/agixufeng/qimen-ai/releases/tag/v0.4.0"
            target="_blank"
            rel="noreferrer"
          >
            下载包
          </a>
        </div>
      </footer>
    </>
  );
}
function errorText(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
