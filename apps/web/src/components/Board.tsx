import type {
  PalaceId,
  QimenChart,
  Palace,
  PatternHit,
  ChartAnnotations,
  DisplayOptions,
  StemAnnotation,
} from '@qimen/core';
import type { ParameterFocus } from './Annotations';
import { getCombination, getSource } from '@qimen/knowledge';
import { CombinationReadings } from './CombinationReadings';
export const PALACE_LABELS: Record<PalaceId, string> = {
  1: '坎一宫',
  2: '坤二宫',
  3: '震三宫',
  4: '巽四宫',
  5: '中五宫',
  6: '乾六宫',
  7: '兑七宫',
  8: '艮八宫',
  9: '离九宫',
};
const ORDER: PalaceId[] = [4, 9, 2, 3, 5, 7, 8, 1, 6];
export function Board({
  chart,
  selected,
  onSelect,
  annotations,
  options,
  onFocus,
}: {
  chart: QimenChart;
  selected: PalaceId;
  onSelect: (id: PalaceId) => void;
  annotations: ChartAnnotations;
  options: DisplayOptions;
  onFocus: (f: ParameterFocus) => void;
}) {
  const professional = options.mode === 'professional';
  function StemSymbol({ stem, showMarks = true }: { stem: StemAnnotation; showMarks?: boolean }) {
    return (
      <button
        className={`stem-symbol ${stem.hosted ? 'hosted-symbol' : ''}`}
        onClick={() => onFocus({ kind: 'stem', palaceId: stem.palaceId, id: stem.id })}
        aria-label={`${stem.layer === 'heaven' ? '天盘' : '地盘'}${stem.hosted ? '寄干' : '主干'} ${stem.stem}`}
      >
        <span>
          {stem.hosted ? '寄 ' : ''}
          <strong>{stem.stem}</strong>
        </span>
        {showMarks && (
          <span className="stem-marks">
            {stem.punishment && <i>刑</i>}
            {stem.tombBranches.map((branch) => (
              <i key={branch}>墓{branch}</i>
            ))}
          </span>
        )}
      </button>
    );
  }
  return (
    <div className={`board-frame ${professional ? 'professional-board' : ''}`}>
      <div className="board-orientation">
        <span>巽 · 东南</span>
        <span>南 ↑</span>
        <span>西南 · 坤</span>
      </div>
      <div className="board" aria-label="奇门九宫盘">
        {ORDER.map((id) => {
          const p = chart.palaces.find((p) => p.id === id)!;
          const a = annotations.palaces.find((p) => p.palaceId === id)!;
          const heaven = a.stems.filter((s) => s.layer === 'heaven');
          const earth = a.stems.filter((s) => s.layer === 'earth');
          return (
            <div
              key={id}
              data-testid="palace"
              data-palace={id}
              className={`palace ${selected === id ? 'selected' : ''} ${id === 5 ? 'center-palace' : ''}`}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('button')) onSelect(id);
              }}
            >
              <button
                className="palace-select"
                aria-label={`选择${PALACE_LABELS[id]}`}
                aria-pressed={selected === id}
                onClick={() => onSelect(id)}
              />
              <span className="palace-heading">
                <span>{p.direction}</span>
                <span>{PALACE_LABELS[id]}</span>
              </span>
              <span className="palace-branches">
                <button
                  onClick={() => onFocus({ kind: 'branches', palaceId: id })}
                  aria-label={`${PALACE_LABELS[id]}地支`}
                >
                  {a.branches.join(' · ') || '无地支'}
                </button>
                {professional && (
                  <button onClick={() => onFocus({ kind: 'region', palaceId: id })}>
                    {a.region}
                  </button>
                )}
              </span>
              {id === 5 ? (
                <>
                  <span className="center-symbol">中</span>
                  <span className="center-note">地盘 {p.earthStem} · 寄坤</span>
                  <span className="center-note">天禽随天芮</span>
                </>
              ) : (
                <>
                  <span className="palace-spirit">{p.deity || '—'}</span>
                  <span className="palace-line">
                    <span className="stem-group">
                      <small>天</small>
                      <span className="stem-stack">
                        {heaven.map((s) => (
                          <StemSymbol key={s.id} stem={s} />
                        ))}
                      </span>
                    </span>
                    <span className="star-name">
                      {a.stars.map((s, i) => (
                        <button
                          key={s.name}
                          className={i ? 'hosted-star' : ''}
                          onClick={() => onFocus({ kind: 'star', name: s.name, palaceId: id })}
                        >
                          {i ? '寄 ' : ''}
                          {s.name}
                          {professional && <small className="strength-badge">{s.state}</small>}
                        </button>
                      ))}
                    </span>
                  </span>
                  <span className="palace-line">
                    <span className="stem-group earth">
                      <small>地</small>
                      <span className="stem-stack">
                        {earth.map((s) => (
                          <StemSymbol key={s.id} stem={s} showMarks={options.earthReference} />
                        ))}
                      </span>
                    </span>
                    <button
                      className="door-name symbol-button"
                      onClick={() => onFocus({ kind: 'door', palaceId: id })}
                    >
                      {p.door || '—'}
                      {professional && a.doorStrength && (
                        <small className="strength-badge">{a.doorStrength.state}</small>
                      )}
                      {a.doorRelation && (professional || a.doorRelation.name === '迫') && (
                        <small className="door-relation">
                          {a.doorRelation.name === '迫' ? '门迫' : a.doorRelation.name}
                        </small>
                      )}
                    </button>
                  </span>
                  <span className="palace-markers">
                    {a.voids.hour?.map((branch) => (
                      <button
                        key={`hv-${branch}`}
                        className="void-mark"
                        onClick={() => onFocus({ kind: 'void', pillar: 'hour', palaceId: id })}
                      >
                        时空 {branch}
                      </button>
                    ))}
                    {a.horses.includes('hour') && (
                      <button
                        className="horse-mark"
                        onClick={() => onFocus({ kind: 'horse', pillar: 'hour', palaceId: id })}
                      >
                        时马 {annotations.pillars.hour.horseBranch}
                      </button>
                    )}
                    {options.dayVoid &&
                      a.voids.day?.map((branch) => (
                        <button
                          key={`dv-${branch}`}
                          className="void-mark day-marker"
                          onClick={() => onFocus({ kind: 'void', pillar: 'day', palaceId: id })}
                        >
                          日空 {branch}
                        </button>
                      ))}
                    {options.dayHorse && a.horses.includes('day') && (
                      <button
                        className="horse-mark day-marker"
                        onClick={() => onFocus({ kind: 'horse', pillar: 'day', palaceId: id })}
                      >
                        日马 {annotations.pillars.day.horseBranch}
                      </button>
                    )}
                  </span>
                  <span className="palace-footer">
                    {chart.chiefStar.palace === id ? '值符星' : ''}
                    {chart.chiefStar.palace === id && chart.chiefDoor.palace === id ? ' · ' : ''}
                    {chart.chiefDoor.palace === id ? '值使门' : ''}
                    {professional && (
                      <button onClick={() => onFocus({ kind: 'palace', palaceId: id })}>
                        宫{a.palaceStrength.state}
                      </button>
                    )}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="board-orientation">
        <span>艮 · 东北</span>
        <span>北 ↓</span>
        <span>西北 · 乾</span>
      </div>
      <aside className="board-legend" aria-label="盘面图例" data-testid="board-legend">
        <span>
          <b>时空 / 日空</b>：对应时柱 / 日柱的旬空支
        </span>
        <span>
          <b>时马 / 日马</b>：对应时柱 / 日柱的驿马
        </span>
        <span>
          <b>刑</b>：六仪击刑
        </span>
        <span>
          <b>墓＋地支</b>：该干在该支入墓
        </span>
        <span>地盘刑墓标记仅作参考。点击盘内符号查看依据。</span>
      </aside>
    </div>
  );
}
export function SourceLink({ id }: { id: string }) {
  const s = getSource(id);
  return s ? (
    <a href={s.url} target="_blank" rel="noreferrer">
      {s.title} ↗
    </a>
  ) : (
    <span className="muted">规则出处：{id}</span>
  );
}
export function PalaceDetails({ palace: p }: { palace: Palace }) {
  const combinations = p.heavenStems
    .flatMap((heaven, index) =>
      [p.earthStem, ...p.hostedEarthStems].map((earth, earthIndex) => ({
        value: getCombination(heaven, earth),
        reference: index > 0 || earthIndex > 0,
        label: earthIndex > 0 ? '寄地盘参考' : index > 0 ? '寄天盘参考' : '主组合',
      })),
    )
    .filter((row) => row.value);
  return (
    <section className="palace-detail" aria-live="polite">
      <div className="eyebrow">宫位细读 / PALACE</div>
      <h2>
        {PALACE_LABELS[p.id]} · {p.direction}
      </h2>
      <p className="detail-sub">{p.element} · 点击盘内任一宫查看</p>
      <dl className="palace-facts">
        <div>
          <dt>天盘干</dt>
          <dd>{p.heavenStems.join('、') || '—'}</dd>
        </div>
        <div>
          <dt>地盘干</dt>
          <dd>{p.earthStem}</dd>
        </div>
        <div>
          <dt>九星</dt>
          <dd>{p.stars.join('、') || '—'}</dd>
        </div>
        <div>
          <dt>八门</dt>
          <dd>{p.door || '—'}</dd>
        </div>
        <div>
          <dt>八神</dt>
          <dd>{p.deity || '—'}</dd>
        </div>
        <div>
          <dt>寄地盘干</dt>
          <dd>{p.hostedEarthStems.join('、') || '—'}</dd>
        </div>
      </dl>
      {p.id === 5 ? (
        <p className="soft-note">中宫保留原始地盘信息。寄宫在坤宫另行标注，不计为独立宫位。</p>
      ) : (
        <>
          <h3>天地盘组合</h3>
          <p className="muted small">
            默认按《神奇之门》查表，另列《御定奇门宝鉴》独立对照。天盘在前，地盘在后；寄干身份单独标明。
          </p>
          {combinations.map(
            ({ value: c, reference, label }) =>
              c && (
                <article
                  className={`combo-detail ${reference ? 'reference-combo' : ''}`}
                  key={`${c.id}-${label}`}
                  data-combination={c.id}
                  data-combination-role={reference ? 'reference' : 'primary'}
                >
                  <div className="combo-role">{label}</div>
                  <div className="combo-title">
                    <b>
                      {c.heaven} ＋ {c.earth}
                    </b>
                    <span className={`status-tag ${c.status}`}>
                      {c.status === 'verified' ? '转录已核' : '待核'}
                    </span>
                  </div>
                  <CombinationReadings combination={c} />
                </article>
              ),
          )}
        </>
      )}
    </section>
  );
}
export function Patterns({ hits }: { hits: PatternHit[] }) {
  return (
    <section className="patterns">
      <h3>
        格局观察 <span className="count">{hits.length}</span>
      </h3>
      {hits.length === 0 ? (
        <p className="muted small">本盘未命中首版检测的五类格局。</p>
      ) : (
        hits.map((hit) => (
          <details key={`${hit.id}-${hit.palaceIds.join('-')}`}>
            <summary>
              {hit.name}
              <span>{hit.palaceIds.map((id) => PALACE_LABELS[id]).join('、')}</span>
            </summary>
            <p>{hit.explanation}</p>
            <p className="rule-code">{hit.ruleId}</p>
            <SourceLink id={hit.sourceId} />
          </details>
        ))
      )}
    </section>
  );
}
