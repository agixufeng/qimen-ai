import type {
  ChartAnnotations,
  DisplayOptions,
  Evidence,
  PalaceAnnotations,
  PalaceId,
  PillarKey,
  QimenChart,
  StemAnnotation,
} from '@qimen/core';
import { SourceLink, PALACE_LABELS } from './Board';
export type ParameterFocus =
  | { kind: 'stem'; palaceId: PalaceId; id: string }
  | { kind: 'void' | 'horse'; palaceId: PalaceId; pillar: PillarKey }
  | { kind: 'star'; palaceId: PalaceId; name: string }
  | { kind: 'door' | 'palace' | 'region' | 'branches'; palaceId: PalaceId }
  | { kind: 'pillar'; pillar: PillarKey };
export const PILLAR_NAMES: Record<PillarKey, string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  hour: '时柱',
};
export function DisplayControls({
  options,
  onChange,
  warning,
}: {
  options: DisplayOptions;
  onChange: (v: DisplayOptions) => void;
  warning: string | null;
}) {
  return (
    <section className="display-settings" aria-label="盘面显示选项">
      <div className="display-mode">
        <button
          aria-pressed={options.mode === 'standard'}
          onClick={() => onChange({ ...options, mode: 'standard' })}
        >
          标准盘
        </button>
        <button
          aria-pressed={options.mode === 'professional'}
          onClick={() => onChange({ ...options, mode: 'professional' })}
        >
          专业层
        </button>
        <span>时空 · 时马默认显示</span>
      </div>
      <div className="display-toggles">
        {(
          [
            ['dayVoid', '显示日空'],
            ['dayHorse', '显示日马'],
            ['earthReference', '地盘参考'],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) => onChange({ ...options, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
      {warning && (
        <p className="preference-warning" data-testid="preference-warning">
          {warning}
        </p>
      )}
    </section>
  );
}
export function PillarTable({
  annotations,
  onFocus,
}: {
  annotations: ChartAnnotations;
  onFocus: (focus: ParameterFocus) => void;
}) {
  return (
    <div className="pillar-table-wrap" data-testid="pillar-annotations">
      <table className="pillar-annotation-table">
        <thead>
          <tr>
            <th scope="col">四柱</th>
            <th scope="col">干支 / 旬首</th>
            <th scope="col">空支 / 宫位</th>
            <th scope="col">马支 / 宫位</th>
          </tr>
        </thead>
        <tbody>
          {(['year', 'month', 'day', 'hour'] as PillarKey[]).map((key) => {
            const p = annotations.pillars[key];
            return (
              <tr key={key}>
                <th scope="row">
                  <button onClick={() => onFocus({ kind: 'pillar', pillar: key })}>
                    {PILLAR_NAMES[key]}
                  </button>
                </th>
                <td>
                  <b>{p.ganzhi}</b>
                  <small>{p.xunShou}</small>
                </td>
                <td>
                  {p.voidBranches.map((branch) => {
                    const palace = annotations.palaces.find((a) => a.branches.includes(branch));
                    return (
                      <button
                        className="pillar-void-branch"
                        key={branch}
                        onClick={() =>
                          onFocus(
                            palace
                              ? { kind: 'void', pillar: key, palaceId: palace.palaceId }
                              : { kind: 'pillar', pillar: key },
                          )
                        }
                        aria-label={`${PILLAR_NAMES[key]}空亡 ${branch}`}
                      >
                        {branch} {palace && <small>{PALACE_LABELS[palace.palaceId]}</small>}
                      </button>
                    );
                  })}
                </td>
                <td>
                  <button
                    onClick={() => onFocus({ kind: 'horse', palaceId: p.horsePalace, pillar: key })}
                    aria-label={`${PILLAR_NAMES[key]}驿马 ${p.horseBranch}`}
                  >
                    {p.horseBranch} <small>{PALACE_LABELS[p.horsePalace]}</small>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function EvidenceList({ items }: { items: Evidence[] }) {
  return (
    <div className="evidence-list">
      {items.map((e, i) => (
        <div key={`${e.ruleId}-${i}`}>
          <p>{e.explanation}</p>
          <code>{e.ruleId}</code>
          <div className="source-links">
            <SourceLink id={e.sourceId} />
          </div>
        </div>
      ))}
    </div>
  );
}
export function StemFacts({ stem }: { stem: StemAnnotation }) {
  return (
    <>
      <p className="parameter-target">
        {stem.layer === 'heaven' ? '天盘' : '地盘'}
        {stem.hosted ? '寄干' : '主干'} · {stem.stem} · {PALACE_LABELS[stem.palaceId]}
      </p>
      <dl className="growth-stages">
        {stem.growth.map((g) => (
          <div key={g.branch}>
            <dt>{g.branch}支</dt>
            <dd>{g.stage}</dd>
          </div>
        ))}
      </dl>
      {stem.punishment ? (
        <p className="annotation-alert">
          六仪击刑：{stem.punishment.hiddenJia}，刑支 {stem.punishment.branch}。
        </p>
      ) : (
        <p className="small muted">此干未命中本规则的六仪击刑。</p>
      )}
      {stem.tombBranches.length > 0 ? (
        <p className="annotation-alert">
          入墓支：{stem.tombBranches.join('、')}。同宫其余地支分别判断。
        </p>
      ) : (
        <p className="small muted">此干在本宫地支中未命中墓位。</p>
      )}
      <EvidenceList items={[...stem.evidence, ...(stem.punishment ? [stem.punishment] : [])]} />
    </>
  );
}
export function ParameterDetail({
  focus,
  annotations,
  chart,
  onClose,
}: {
  focus: ParameterFocus;
  annotations: ChartAnnotations;
  chart: QimenChart;
  onClose: () => void;
}) {
  const palace =
    'palaceId' in focus
      ? annotations.palaces.find((p) => p.palaceId === focus.palaceId)
      : undefined;
  let title = '参数说明';
  let content;
  if (focus.kind === 'stem') {
    const stem = palace?.stems.find((s) => s.id === focus.id);
    title = '干的状态与依据';
    content = stem ? <StemFacts stem={stem} /> : <p>当前盘未找到此对象，请重新选择。</p>;
  } else if (focus.kind === 'pillar' || focus.kind === 'void' || focus.kind === 'horse') {
    const p = annotations.pillars[focus.pillar];
    title = `${PILLAR_NAMES[focus.pillar]}${focus.kind === 'void' ? '空亡' : focus.kind === 'horse' ? '驿马' : '辅助参数'}`;
    content = (
      <>
        <p className="parameter-target">
          {PILLAR_NAMES[focus.pillar]} {p.ganzhi} · {p.xunShou}旬
        </p>
        {focus.kind !== 'horse' && (
          <p>
            本旬空支：<b>{p.voidBranches.join('、')}</b>
            {focus.kind === 'void' && palace
              ? `；本宫对应 ${palace.voids[focus.pillar]?.join('、')}。`
              : '。'}
          </p>
        )}
        {focus.kind !== 'void' && (
          <p>
            驿马支：<b>{p.horseBranch}</b>，落 {PALACE_LABELS[p.horsePalace]}。
          </p>
        )}
        <p className="small muted">
          按{PILLAR_NAMES[focus.pillar]}单独标记，不与其他柱合并为同一来源。
        </p>
        <EvidenceList
          items={
            focus.kind === 'void'
              ? p.evidence.filter((e) => e.ruleId.startsWith('VOID'))
              : focus.kind === 'horse'
                ? p.evidence.filter((e) => e.ruleId.startsWith('HORSE'))
                : p.evidence
          }
        />
      </>
    );
  } else if (palace) {
    const p = chart.palaces.find((p) => p.id === palace.palaceId)!;
    if (focus.kind === 'star') {
      const star = palace.stars.find((s) => s.name === focus.name);
      title = `${focus.name} · 月令旺衰`;
      content = star ? (
        <>
          <p>
            {annotations.monthBranch}月属{star.monthElement}；{star.name}属{star.element}，状态为{' '}
            <b>{star.state}</b>。
          </p>
          <p>{star.relation}</p>
          <EvidenceList items={[star]} />
        </>
      ) : null;
    } else if (focus.kind === 'door') {
      title = `${p.door || '八门'} · 月令与宫关系`;
      content = (
        <>
          {palace.doorStrength && (
            <>
              <p>
                {p.door}属{palace.doorStrength.element}，月令状态 <b>{palace.doorStrength.state}</b>
                。
              </p>
              <EvidenceList items={[palace.doorStrength]} />
            </>
          )}
          {palace.doorRelation && (
            <>
              <h4>门宫关系：{palace.doorRelation.name}</h4>
              <EvidenceList items={[palace.doorRelation]} />
            </>
          )}
        </>
      );
    } else if (focus.kind === 'palace') {
      title = `${PALACE_LABELS[p.id]} · 月令旺衰`;
      content = (
        <>
          <p>
            {annotations.monthBranch}月属{annotations.monthElement}；本宫属
            {palace.palaceStrength.element}，状态为 <b>{palace.palaceStrength.state}</b>。
          </p>
          <EvidenceList items={[palace.palaceStrength]} />
        </>
      );
    } else if (focus.kind === 'branches') {
      title = `${PALACE_LABELS[p.id]} · 地支`;
      content = (
        <>
          <p>
            本宫地支：{palace.branches.join('、') || '无固定地支'}
            。双支宫逐支计算长生，不用一个状态替代两支。
          </p>
          <SourceLink id="annotation-profile" />
        </>
      );
    } else {
      title = `${PALACE_LABELS[p.id]} · ${palace.region}`;
      content = (
        <>
          <p>
            按当前阴阳遁区分内外盘；本盘为{chart.dun}，本宫归属{palace.region}。
          </p>
          <SourceLink id="annotation-profile" />
        </>
      );
    }
  }
  return (
    <section className="parameter-detail" data-testid="parameter-detail" aria-live="polite">
      <div className="parameter-top">
        <span className="eyebrow">参数细读 / PARAMETER</span>
        <button onClick={onClose} aria-label="返回全宫详情">
          ×
        </button>
      </div>
      <h2>{title}</h2>
      {content}
      <p className="annotation-version">
        辅助规则 {annotations.profile.id} / {annotations.profile.version}
      </p>
    </section>
  );
}
export function PalaceAnnotationDetails({
  palace,
  options,
  annotations,
  onFocus,
}: {
  palace: PalaceAnnotations;
  options: DisplayOptions;
  annotations: ChartAnnotations;
  onFocus: (focus: ParameterFocus) => void;
}) {
  const visibleStems = palace.stems.filter((s) => s.layer === 'heaven' || options.earthReference);
  return (
    <section className="annotation-overview">
      <h3>
        辅助参数 <small>{palace.branches.join('、') || '中宫'}</small>
      </h3>
      <p className="small muted">
        月令 {annotations.monthBranch}（{annotations.monthElement}）
        {options.mode === 'professional' && ` · ${palace.region}`}
      </p>
      <div className="overview-markers">
        {(['hour', ...(options.dayVoid ? ['day'] : [])] as PillarKey[]).map((key) =>
          palace.voids[key]?.length ? (
            <button
              key={`void-${key}`}
              onClick={() => onFocus({ kind: 'void', pillar: key, palaceId: palace.palaceId })}
            >
              {key === 'hour' ? '时' : '日'}空 {palace.voids[key]!.join('、')}
            </button>
          ) : null,
        )}
        {(['hour', ...(options.dayHorse ? ['day'] : [])] as PillarKey[]).map((key) =>
          palace.horses.includes(key) ? (
            <button
              key={`horse-${key}`}
              onClick={() => onFocus({ kind: 'horse', pillar: key, palaceId: palace.palaceId })}
            >
              {key === 'hour' ? '时' : '日'}马 {annotations.pillars[key].horseBranch}
            </button>
          ) : null,
        )}
      </div>
      {options.mode === 'professional' && (
        <>
          <div className="strength-list">
            {palace.stars.map((s) => (
              <button
                key={s.name}
                onClick={() => onFocus({ kind: 'star', name: s.name, palaceId: palace.palaceId })}
              >
                {s.name} · {s.state}
              </button>
            ))}
            {palace.doorStrength && (
              <button onClick={() => onFocus({ kind: 'door', palaceId: palace.palaceId })}>
                门 · {palace.doorStrength.state} {palace.doorRelation?.name}
              </button>
            )}
            <button onClick={() => onFocus({ kind: 'palace', palaceId: palace.palaceId })}>
              宫 · {palace.palaceStrength.state}
            </button>
          </div>
          <details className="growth-details">
            <summary>逐干查看十二长生与刑墓</summary>
            {visibleStems.map((stem) => (
              <div className="growth-row" key={stem.id}>
                <button
                  onClick={() => onFocus({ kind: 'stem', id: stem.id, palaceId: palace.palaceId })}
                >
                  {stem.layer === 'heaven' ? '天' : '地'}
                  {stem.hosted ? '寄' : '主'} {stem.stem}
                </button>
                <span>
                  {stem.growth.map((g) => `${g.branch}·${g.stage}`).join(' / ') || '中宫无固定地支'}
                </span>
              </div>
            ))}
          </details>
        </>
      )}
    </section>
  );
}
