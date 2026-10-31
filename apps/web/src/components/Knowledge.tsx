import { useState } from 'react';
import { COMBINATIONS, SOURCES, KNOWLEDGE_VERSION } from '@qimen/knowledge';
import type { QimenInput } from '@qimen/core';
import { CombinationReadings } from './CombinationReadings';
export function Knowledge() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const needle = query.replace(/[\s＋+\-]/g, '').toLowerCase();
  const rows = COMBINATIONS.filter(
    (c) =>
      (status === 'all' || c.status === status) &&
      `${c.heaven}${c.earth}${c.readings.map((r) => `${r.name}${r.summary}`).join(' ')}`
        .toLowerCase()
        .includes(needle),
  );
  return (
    <main className="reading-page">
      <div className="eyebrow">知识索引 / 81 COMBINATIONS</div>
      <h2>天地盘 · 81 组合</h2>
      <p className="lead">
        默认采用《神奇之门》格名及本项目原创简释，逐条保留《御定奇门宝鉴·混合百神》独立对照。可以搜索任一本书的格名，列表始终显示默认名称。
      </p>
      <div className="search-bar">
        <label>
          搜索组合或格名
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例如：乙辛、青龙"
          />
        </label>
        <label>
          默认条目复核状态
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">全部</option>
            <option value="verified">转录已核</option>
            <option value="pending">待核</option>
          </select>
        </label>
      </div>
      <p className="muted small">
        显示 {rows.length} / 81 条 ·
        筛选与列表状态以默认《神奇之门》条目为准。转录已核表示资料核对，不代表预测效果验证。
      </p>
      <div className="combination-list">
        {rows.map((c) => (
          <details key={c.id} data-combination={c.id}>
            <summary>
              <span className="combo-pair">
                {c.heaven} <small>＋</small> {c.earth}
              </span>
              <strong>{c.name}</strong>
              <span className={`status-tag ${c.status}`}>
                {c.status === 'verified' ? '转录已核' : '待核'}
              </span>
            </summary>
            <div className="combination-body">
              <CombinationReadings combination={c} />
            </div>
          </details>
        ))}
      </div>
      {rows.length === 0 && <p className="empty">没有匹配记录。试试两个天干，例如「乙辛」。</p>}
    </main>
  );
}
export function Sources() {
  return (
    <main className="reading-page">
      <div className="eyebrow">文献与规则 / SOURCES</div>
      <h2>依据与版本</h2>
      <p className="lead">
        81组合默认阅读《神奇之门》，《御定奇门宝鉴·混合百神》作为独立对照。每条解释分别保留格名、简释、适用条件与出处；同名不预设同义，异名不拼成一个结论。
      </p>
      <p className="small muted">
        知识版本 {KNOWLEDGE_VERSION}
        。知识说明更新不改变既有基础盘；落宫刑墓等辅助参数按独立规则计算。
      </p>
      <div className="source-list">
        {SOURCES.map((s) => (
          <article id={s.id} key={s.id}>
            <div className="source-id">{s.id}</div>
            <h3>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title} ↗
              </a>
            </h3>
            {s.author && <p>{s.author}</p>}
            <dl>
              <div>
                <dt>定位</dt>
                <dd>{s.locator}</dd>
              </div>
              <div>
                <dt>权利</dt>
                <dd>{s.rights}</dd>
              </div>
            </dl>
            <p className="muted">{s.note}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
export const EXAMPLES: { title: string; description: string; input: QimenInput }[] = [
  {
    title: '秋日演示',
    description: '固定日期的公开演示输入，便于熟悉九宫、神奇之门默认条目与御定独立对照。',
    input: { year: 2026, month: 10, day: 28, hour: 12, minute: 0, second: 0 },
  },
  {
    title: '子初换日之前',
    description: '22:59:59。起盘后与下一个示例比较日柱和时柱。',
    input: { year: 2026, month: 10, day: 28, hour: 22, minute: 59, second: 59 },
  },
  {
    title: '子初换日时刻',
    description: '23:00:00。当前规则从子初开始使用下一干支日。',
    input: { year: 2026, month: 10, day: 28, hour: 23, minute: 0, second: 0 },
  },
  {
    title: '夏季演示',
    description: '用于观察阴阳遁、局数与宫位分布。',
    input: { year: 2026, month: 7, day: 15, hour: 10, minute: 0, second: 0 },
  },
];
export function Examples({ onOpen }: { onOpen: (input: QimenInput) => void }) {
  return (
    <main className="reading-page">
      <div className="eyebrow">公开输入 / EXAMPLES</div>
      <h2>公开演示盘</h2>
      <p className="lead">
        这些输入用于操作演示与边界观察，不对应个人案例，也不作为独立正确性证据。点选宫位先读《神奇之门》默认条目，再展开《御定奇门宝鉴》对照；盘内刑墓符号可另点查辅助规则。
      </p>
      <div className="example-list">
        {EXAMPLES.map((e) => (
          <article key={e.title}>
            <h3>{e.title}</h3>
            <p>{e.description}</p>
            <button onClick={() => onOpen(e.input)}>打开{e.title}</button>
          </article>
        ))}
      </div>
    </main>
  );
}
