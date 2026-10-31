import { useState } from 'react';
import { CLASSICS, getSource } from '@qimen/knowledge';
import { DEFAULT_PROFILE } from '@qimen/core';

export function Classics() {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const books = CLASSICS.map((book) => {
    const bookMatches = `${book.title} ${book.coverage}`.toLowerCase().includes(needle);
    const items = bookMatches
      ? book.items
      : book.items.filter((item) =>
          `${item.title} ${item.locator} ${item.summary}`.toLowerCase().includes(needle),
        );
    return { ...book, items, matches: bookMatches || items.length > 0 };
  }).filter((book) => book.matches);
  return (
    <main className="reading-page classics-page">
      <div className="eyebrow">原典定位 / CLASSICS</div>
      <h2>古籍与章段索引</h2>
      <p className="lead" data-testid="classics-boundary">
        书目与章段索引，尚非全文库。这里提供已核入口、原文定位和本项目原创导读，便于回到来源阅读。
      </p>
      <label className="classic-search">
        搜索古籍与章段
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例如：遁甲演义、九星、值符"
        />
      </label>
      <p className="small muted" aria-live="polite">
        显示 {books.length} / {CLASSICS.length} 部书目 · 已核入口按各书实际收录范围列出
      </p>
      <div className="classic-books">
        {books.map((book) => (
          <article className="classic-book" data-classic={book.id} key={book.id}>
            <div className="classic-book-heading">
              <span className="eyebrow">书目与原创导读</span>
              <h3>{book.title}</h3>
            </div>
            <div className="classic-book-body">
              <dl className="classic-notes">
                <div>
                  <dt>收录范围</dt>
                  <dd>{book.coverage}</dd>
                </div>
                <div>
                  <dt>资料权利</dt>
                  <dd>{book.rights}</dd>
                </div>
              </dl>
              <div className="classic-book-sources">
                {book.sourceIds.map((id) => {
                  const source = getSource(id);
                  return source ? (
                    <a key={id} href={source.url} target="_blank" rel="noreferrer">
                      {source.title} ↗
                    </a>
                  ) : null;
                })}
              </div>
              <ul className="classic-entries">
                {book.items.map((item) => {
                  const source = getSource(item.sourceId);
                  return (
                    <li key={item.id}>
                      <h4>{item.title}</h4>
                      <p>{item.summary}</p>
                      <p className="classic-locator">定位：{item.locator}</p>
                      {item.ruleIds.length > 0 && (
                        <div className="classic-rule-ids">
                          <span>规则线索</span>
                          {item.ruleIds.map((id) => (
                            <code key={id}>{id}</code>
                          ))}
                        </div>
                      )}
                      {source && (
                        <a href={source.url} target="_blank" rel="noreferrer">
                          阅读对应来源 ↗
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        ))}
      </div>
      {books.length === 0 && (
        <div className="empty">
          <p>没有匹配的书目或章段。可以换一个术语，或清除搜索。</p>
          <button onClick={() => setQuery('')}>清除搜索</button>
        </div>
      )}
      <p className="classic-scope-note">
        古籍中存在不同定局、寄宫和术语取法。当前工作台按
        <a href="#/sources">本项目版本约定</a>计算；索引中的原文观点需结合该书上下文阅读。
      </p>
    </main>
  );
}

function CodeSample({ title, value, testId }: { title: string; value: string; testId: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setMessage('已复制。');
    } catch {
      setMessage('浏览器未允许复制，请选中代码手动复制。');
    }
  }
  return (
    <section className="developer-code-sample">
      <div className="developer-code-heading">
        <h3>{title}</h3>
        <button onClick={copy} aria-label={`复制${title}`}>
          复制
        </button>
      </div>
      <pre tabIndex={0} data-testid={testId}>
        <code>{value}</code>
      </pre>
      {message && (
        <p className="small muted" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

const NODE_EXAMPLE = `import { generateQimen, analyzeChart, exportChart } from './packages/core/dist/index.js';

const chart = generateQimen({
  year: 2026, month: 10, day: 28,
  hour: 12, minute: 0, second: 0,
});
console.log(chart.dun, chart.ju);
console.log(analyzeChart(chart).pillars.hour);
console.log(exportChart(chart));`;
const CLI_EXAMPLE = `node packages/cli/dist/bin.js chart --datetime 2026-10-28T12:00:00

node packages/cli/dist/bin.js chart --datetime 2026-10-28T12:00:00 --professional --format svg > qimen.svg`;

export function Developers({ engineVersion = '0.1.0' }: { engineVersion?: string }) {
  return (
    <main className="reading-page developers-page">
      <div className="eyebrow">计算接口 / DEVELOPERS</div>
      <h2>开发者入口</h2>
      <p className="lead">
        用确定性接口获得盘面与辅助参数，再按自己的需求展示。浏览器和 Node 本地计算，无需 API Key。
      </p>
      <div className="developer-start">
        <h3>从源码目录开始</h3>
        <p>准备 Node.js 22 LTS 和 npm，在项目根目录安装依赖并构建：</p>
        <pre tabIndex={0}>
          <code>{`npm ci\nnpm run build`}</code>
        </pre>
        <p className="small muted">
          当前是本地发布候选。公开仓库与演示站地址确认后补充；以下示例使用源码构建产物。
        </p>
      </div>
      <CodeSample title="Node 调用示例" value={NODE_EXAMPLE} testId="developer-node" />
      <CodeSample title="命令行示例" value={CLI_EXAMPLE} testId="developer-cli" />
      <p className="small muted">
        命令行首行输出 JSON；第二行将专业层 SVG 写入当前目录的 qimen.svg。SVG 默认不包含占事备注。
      </p>
      <section className="developer-contract" data-testid="developer-rules">
        <h3>接入前核对时间与规则</h3>
        <dl>
          <div>
            <dt>输入</dt>
            <dd>公历 1900—2100 年，固定 UTC+8 标准时间；命令行时间不添加 Z 或时区偏移。</dd>
          </div>
          <div>
            <dt>换日</dt>
            <dd>23:00 换干支日；原公历输入仍保留，节气按实际时刻判断。</dd>
          </div>
          <div>
            <dt>盘法</dt>
            <dd>时家转盘拆补，中五寄坤、天禽随天芮。</dd>
          </div>
          <div>
            <dt>版本</dt>
            <dd>
              基础引擎 {engineVersion} · {DEFAULT_PROFILE.id} / {DEFAULT_PROFILE.version}
            </dd>
          </div>
          <div>
            <dt>输出</dt>
            <dd>JSON 含输入、基础盘、完整辅助结果和规则版本；SVG 按所选显示层生成。</dd>
          </div>
        </dl>
        <a href="#/sources">核对依据与版本 →</a>
      </section>
      <p className="developer-return">
        先看一张公开演示盘，也可以直接在工作台尝试。
        <a href="#/examples">选择示例 →</a>
      </p>
    </main>
  );
}
