import type { FormEvent } from 'react';
import type { SavedItem } from '../helpers';
export interface ControlsProps {
  date: string;
  time: string;
  note: string;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setNote: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onNow: () => void;
  onSave: () => void;
  saved: SavedItem[];
  onLoad: (v: SavedItem) => void;
  onDelete: (id: string) => void;
  storageError: string | null;
  onRetryStorage: () => void;
}
export function Controls(p: ControlsProps) {
  return (
    <aside className="controls">
      <div className="eyebrow">起局 / INPUT</div>
      <h2>以时起局</h2>
      <form onSubmit={p.onSubmit} noValidate>
        <label>
          公历日期
          <input
            type="date"
            min="1900-01-01"
            max="2100-12-31"
            required
            value={p.date}
            onChange={(e) => p.setDate(e.target.value)}
          />
        </label>
        <label>
          时间 · UTC+8
          <input
            aria-label="时间"
            type="time"
            step="1"
            required
            value={p.time}
            onChange={(e) => p.setTime(e.target.value)}
          />
        </label>
        <div className="form-buttons">
          <button type="submit" className="primary">
            起局
          </button>
          <button type="button" onClick={p.onNow}>
            现在
          </button>
        </div>
        <p className="muted small">
          固定东八区标准时间。
          <br />
          输入范围 1900—2100 年。
        </p>
        <label>
          占事备注
          <textarea
            value={p.note}
            onChange={(e) => p.setNote(e.target.value)}
            placeholder="记录本次研究的问题（选填）"
            rows={3}
            maxLength={2000}
          />
        </label>
        <p className="muted small">备注不参与计算。仅主动保存时写入本机浏览器。</p>
      </form>
      <button className="save-button" onClick={p.onSave} disabled={!!p.storageError}>
        保存此盘
      </button>
      <details className="conventions">
        <summary>本局采用的约定</summary>
        <ul>
          <li>时家转盘 · 拆补法</li>
          <li>23 点换干支日</li>
          <li>中五寄坤 · 天禽随天芮</li>
          <li>节气按实际交节时刻</li>
        </ul>
        <p>规则版本 shijia-zhuanpan-chaibu-v1 / 1.0.0</p>
      </details>
      <div className="saved-section">
        {p.storageError && (
          <div className="storage-warning" role="alert">
            <p>{p.storageError}</p>
            <button onClick={p.onRetryStorage}>重新读取存盘</button>
          </div>
        )}
        <h3>
          本机存盘 <span className="count">{p.saved.length}</span>
        </h3>
        {p.saved.length === 0 && !p.storageError ? (
          <p className="muted small">尚未保存。研究到一半，可以在这里留一份记录。</p>
        ) : (
          <ul className="saved-list">
            {p.saved.map((s) => (
              <li key={s.id}>
                <button className="saved-open" onClick={() => p.onLoad(s)}>
                  <b>{s.time}</b>
                  <span>{s.note || '未填写备注'}</span>
                </button>
                <button
                  className="delete-saved"
                  disabled={!!p.storageError}
                  aria-label={`删除${s.time}`}
                  onClick={() => p.onDelete(s.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
