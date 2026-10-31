import { getSource, type Combination, type CombinationReading } from '@qimen/knowledge';
function bookLabel(sourceId: string) {
  return sourceId === 'shenqi-patterns'
    ? '《神奇之门》'
    : sourceId === 'yuding-hunhe'
      ? '《御定奇门宝鉴·混合百神》'
      : getSource(sourceId)?.title || sourceId;
}
function ReadingContent({ reading, primary }: { reading: CombinationReading; primary: boolean }) {
  const source = getSource(reading.sourceId);
  return (
    <section
      className={`book-reading ${primary ? 'primary-reading' : 'comparison-reading'}`}
      data-reading-role={primary ? 'primary' : 'comparison'}
      data-reading-source={reading.sourceId}
    >
      <div className="reading-heading">
        <span>
          {primary ? '默认' : '对照'} · {bookLabel(reading.sourceId)}
        </span>
        <span className={`status-tag ${reading.status}`}>
          {reading.status === 'verified' ? '转录已核' : '待核'}
        </span>
      </div>
      <h4>
        {reading.nameKind === 'editorial' && <small className="editorial-label">条目提要</small>}
        {reading.name}
      </h4>
      <p>{reading.summary}</p>
      {reading.conditions.length > 0 && (
        <ul>
          {reading.conditions.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      )}
      {reading.note && <p className="muted small">{reading.note}</p>}
      <p className="reading-locator">定位：{reading.locator}</p>
      {source && (
        <div className="source-links">
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.title} ↗
          </a>
        </div>
      )}
    </section>
  );
}
export function CombinationReadings({ combination }: { combination: Combination }) {
  const primary = combination.readings.find((r) => r.sourceId === combination.primarySourceId);
  const comparisons = combination.readings.filter(
    (r) => r.sourceId !== combination.primarySourceId,
  );
  return (
    <div className="combination-readings">
      {primary ? (
        <ReadingContent reading={primary} primary />
      ) : (
        <p className="small muted">默认条目尚未提供，请先核对来源。</p>
      )}
      {comparisons.map((reading) => (
        <details className="reading-comparison" key={reading.sourceId}>
          <summary>
            <span>对照 · {bookLabel(reading.sourceId)}</span>
            <b>{reading.name}</b>
          </summary>
          <ReadingContent reading={reading} primary={false} />
        </details>
      ))}
      <p className="reading-boundary">
        两书各按自身条文阅读；81格名与辅助参数中的落宫入墓分别判断，含“墓”字的格名不自动产生入墓标记。
      </p>
    </div>
  );
}
