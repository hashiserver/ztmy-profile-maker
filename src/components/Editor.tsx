import { useCallback, useEffect, useRef, useState } from 'react';
import {
  initialDraft,
  type Draft,
  type Template,
  type TextField,
  type TextStyle,
} from '../lib/model';
import { loadDraft, saveDraft, removeDraft } from '../lib/drafts';
import { normalizeImage } from '../lib/images';
import { exportCard } from '../lib/render';
import CardPreview from './CardPreview';
import BrowserFrame from './BrowserFrame';
export default function Editor({ template }: { template: Template }) {
  const [draft, setDraft] = useState(() => initialDraft(template));
  const [selected, setSelected] = useState(template.fields[0].id);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [status, setStatus] = useState('下書きを確認しています…');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [composing, setComposing] = useState(false);
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const uploadToken = useRef(0);
  const initialized = useRef(false);
  const update = useCallback((change: (d: Draft) => Draft) => {
    const next = Math.max(Date.now(), revision.current + 1);
    revision.current = next;
    setDraft((d) => ({ ...change(d), revision: next, updatedAt: Date.now() }));
  }, []);
  useEffect(() => {
    let current = true;
    loadDraft(template)
      .then((result) => {
        if (!current) return;
        if (result.kind === 'restored') {
          setDraft(result.draft);
          revision.current = result.draft.revision;
          savedRevision.current = result.draft.revision;
          setNotice('下書きを復元しました');
          setStatus('この端末に保存済み');
        } else if (result.kind === 'incompatible') {
          setBlocked(true);
          setError(
            '互換性を確認できない下書きがあります。元のデータを保護するため自動保存を停止しています。PNG保存は利用できます。',
          );
          setStatus('自動保存は停止中');
        } else setStatus('編集できます');
        initialized.current = true;
        setReady(true);
      })
      .catch(() => {
        if (current) {
          setBlocked(true);
          setError(
            '下書きを読み込めません。自動保存を停止しています。PNG保存をご利用ください。',
          );
          setStatus('自動保存は停止中');
          initialized.current = true;
          setReady(true);
        }
      });
    return () => {
      current = false;
    };
  }, [template]);
  useEffect(() => {
    if (
      !ready ||
      blocked ||
      composing ||
      !initialized.current ||
      draft.revision === savedRevision.current
    )
      return;
    setStatus('保存待ち…');
    const snapshot = draft;
    let current = true;
    const timer = setTimeout(() => {
      saveDraft(snapshot)
        .then((result) => {
          if (current) {
            if (result === 'superseded') {
              setBlocked(true);
              setStatus('保存の競合');
              setError(
                '別のタブで新しい下書きが保存されました。この入力は保存されていません。PNGで保管してから再読み込みしてください。',
              );
              return;
            }
            savedRevision.current = snapshot.revision;
            setStatus('この端末に保存済み');
          }
        })
        .catch(() => {
          if (current) {
            setStatus('保存できませんでした');
            setError(
              '下書きを保存できませんでした。入力内容を残したまま、PNG保存で保管できます。',
            );
          }
        });
    }, 700);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [draft, ready, blocked, composing]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (revision.current !== savedRevision.current) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const field = template.fields.find(
    (f) => f.id === selected && f.kind === 'text',
  ) as TextField;
  const style: TextStyle = draft.styles[field.id] || {
    fontSize: field.fontSize,
    color: field.color,
    font: field.font,
    align: field.align,
    dx: 0,
    dy: 0,
    autoFit: true,
  };
  const setStyle = (patch: Partial<TextStyle>) =>
    update((d) => ({
      ...d,
      styles: { ...d.styles, [field.id]: { ...style, ...patch } },
    }));
  const onWarnings = useCallback((w: string[]) => setWarnings(w), []);
  async function upload(file?: File) {
    if (!file) return;
    const token = ++uploadToken.current;
    setUploading(true);
    try {
      const blob = await normalizeImage(file);
      if (token !== uploadToken.current) return;
      update((d) => ({ ...d, icon: blob, crop: { x: 0, y: 0, zoom: 1 } }));
      setNotice('アイコンを読み込みました');
      setError('');
    } catch (e) {
      if (token === uploadToken.current)
        setError(e instanceof Error ? e.message : '画像を読み込めませんでした');
    } finally {
      if (token === uploadToken.current) setUploading(false);
    }
  }
  async function output(action: 'download' | 'share' | 'copy') {
    if (uploading || busy) return;
    setBusy(true);
    setError('');
    try {
      const blob = await exportCard(template, draft);
      const file = new File([blob], `ztmy-${template.id}.png`, {
        type: 'image/png',
      });
      if (action === 'share' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: draft.shareText });
        setNotice('共有しました');
      } else if (
        action === 'copy' &&
        navigator.clipboard?.write &&
        typeof ClipboardItem !== 'undefined'
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setNotice('画像をコピーしました');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        setNotice(
          action === 'share'
            ? 'この環境では画像共有に対応していないためPNGを保存しました'
            : 'PNGを保存しました',
        );
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError'))
        setError(
          '画像を生成・共有できませんでした。PNG保存をもう一度お試しください。',
        );
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    if (
      !window.confirm(
        'このテンプレートの下書きを削除し、入力を初期化しますか？',
      )
    )
      return;
    try {
      await removeDraft(template.id);
      uploadToken.current++;
      setBlocked(false);
      setError('');
      update(() => initialDraft(template));
      setNotice('入力を初期化しました');
    } catch {
      setError('下書きを削除できませんでした。入力はそのまま残しています。');
    }
  }
  const changeCrop = (patch: Partial<Draft['crop']>) =>
    update((d) => ({ ...d, crop: { ...d.crop, ...patch } }));
  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <a className="back-link" href="/">
          ← テンプレート一覧
        </a>
        <span className="save-status" role="status">
          {status}
        </span>
      </div>
      <div className="editor-heading">
        <div>
          <p className="eyebrow">自己紹介カードを編集</p>
          <h1>{template.title}</h1>
        </div>
        <span className="demo-badge">
          {template.badge || 'オリジナル・デモ'}
        </span>
      </div>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <p className="notification" role="status">
          {notice}
        </p>
      )}
      <div className="editor-grid">
        <section className="preview-panel" aria-label="カードプレビュー">
          <BrowserFrame
            title="カードプレビュー"
            address={`archive://preview/${template.id}`}
          >
            <div className="preview-window-content">
              <div className="preview-meta">
                <span>仕上がりプレビュー</span>
                <span>
                  {template.width} × {template.height} px
                </span>
              </div>
              <CardPreview
                template={template}
                draft={draft}
                selected={selected}
                onSelect={(id) => {
                  setSelected(id);
                  const input = document.getElementById(`field-${id}`);
                  input?.scrollIntoView({
                    block: 'center',
                    behavior: 'instant',
                  });
                  input?.focus({ preventScroll: true });
                }}
                onWarnings={onWarnings}
              />
              <p className="preview-hint">
                点線の枠をタップ →
                対応する入力欄へ移動します。枠は保存画像には入りません。
              </p>
              <a
                className="author"
                href={template.author.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={template.author.avatar}
                  width="32"
                  height="32"
                  alt=""
                />
                <span>
                  テンプレート作者
                  <br />
                  <strong>{template.author.name} ↗</strong>
                </span>
              </a>
            </div>
          </BrowserFrame>
        </section>
        <section className="controls-panel" aria-label="カードの編集設定">
          <BrowserFrame
            title="自己紹介カードを編集"
            address={`archive://edit/${template.id}`}
          >
            <div className="controls-window-content">
              <div className="panel-header">
                <span className="step-number">01</span>
                <div>
                  <h2>自己紹介を入力</h2>
                  <p>下の入力欄に書くと、カードに反映されます。</p>
                </div>
              </div>
              <fieldset disabled={!ready || busy || uploading}>
                <legend className="sr-only">文字とアイコンの編集</legend>
                <div className="text-fields">
                  {template.fields
                    .filter((f): f is TextField => f.kind === 'text')
                    .map((f, index) => {
                      const props = {
                        id: `field-${f.id}`,
                        value: draft.values[f.id] || '',
                        placeholder: `${f.label}を入力`,
                        onFocus: () => setSelected(f.id),
                        onCompositionStart: () => setComposing(true),
                        onCompositionEnd: () => setComposing(false),
                        onChange: (
                          e: React.ChangeEvent<
                            HTMLInputElement | HTMLTextAreaElement
                          >,
                        ) =>
                          update((d) => ({
                            ...d,
                            values: { ...d.values, [f.id]: e.target.value },
                          })),
                      };
                      return (
                        <div
                          key={f.id}
                          className={`text-field ${selected === f.id ? 'active' : ''}`}
                        >
                          <label className="input-label" htmlFor={props.id}>
                            <span className="field-number" aria-hidden="true">
                              {index + 1}
                            </span>
                            {f.label}
                          </label>
                          {f.multiline || f.direction === 'vertical' ? (
                            <textarea {...props} rows={3} />
                          ) : (
                            <input {...props} type="text" />
                          )}
                        </div>
                      );
                    })}
                </div>
                <details className="text-settings">
                  <summary>文字の見た目を調整（{field.label}）</summary>
                  <label className="select-label">
                    調整する項目
                    <select
                      value={selected}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      {template.fields
                        .filter((f) => f.kind === 'text')
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="style-grid">
                    <label>
                      フォント
                      <select
                        value={style.font}
                        onChange={(e) =>
                          setStyle({
                            font: e.target.value as TextStyle['font'],
                          })
                        }
                      >
                        <option value="sans">すっきりゴシック</option>
                        <option value="serif">しなやか明朝</option>
                      </select>
                    </label>
                    <label>
                      文字色
                      <input
                        type="color"
                        value={style.color}
                        onChange={(e) => setStyle({ color: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="range-label">
                    文字サイズ <output>{style.fontSize}px</output>
                    <input
                      aria-label="文字サイズ"
                      type="range"
                      min={field.minFontSize}
                      max="100"
                      value={style.fontSize}
                      onChange={(e) =>
                        setStyle({ fontSize: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={style.autoFit}
                      onChange={(e) => setStyle({ autoFit: e.target.checked })}
                    />{' '}
                    枠に合わせて文字を自動で小さくする
                  </label>
                  {field.direction === 'horizontal' && (
                    <label className="select-label">
                      揃え
                      <select
                        value={style.align}
                        onChange={(e) =>
                          setStyle({
                            align: e.target.value as TextStyle['align'],
                          })
                        }
                      >
                        <option value="left">左揃え</option>
                        <option value="center">中央揃え</option>
                        <option value="right">右揃え</option>
                      </select>
                    </label>
                  )}
                  <details className="adjust-details">
                    <summary>文字の位置を調整</summary>
                    <p className="helper">
                      元の画像を基準に1pxずつ移動します。
                    </p>
                    <div className="nudge-controls">
                      <button
                        aria-label="文字を左に移動"
                        onClick={() =>
                          setStyle({ dx: Math.max(-32, style.dx - 1) })
                        }
                      >
                        ←
                      </button>
                      <button
                        aria-label="文字を上に移動"
                        onClick={() =>
                          setStyle({ dy: Math.max(-24, style.dy - 1) })
                        }
                      >
                        ↑
                      </button>
                      <button
                        aria-label="文字を下に移動"
                        onClick={() =>
                          setStyle({ dy: Math.min(24, style.dy + 1) })
                        }
                      >
                        ↓
                      </button>
                      <button
                        aria-label="文字を右に移動"
                        onClick={() =>
                          setStyle({ dx: Math.min(32, style.dx + 1) })
                        }
                      >
                        →
                      </button>
                      <button onClick={() => setStyle({ dx: 0, dy: 0 })}>
                        位置を戻す
                      </button>
                    </div>
                  </details>
                </details>
                {warnings.length > 0 && (
                  <ul className="warnings" aria-live="polite">
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
                {template.fields
                  .filter((f) => f.kind === 'choice')
                  .map(
                    (f) =>
                      f.kind === 'choice' && (
                        <div className="choice-group" key={f.id}>
                          <h3>{f.label}</h3>
                          {f.options.map((o) => (
                            <label className="check-label" key={o.id}>
                              <input
                                type={f.multiple ? 'checkbox' : 'radio'}
                                name={f.id}
                                checked={
                                  draft.choices[f.id]?.includes(o.id) || false
                                }
                                onChange={(e) =>
                                  update((d) => ({
                                    ...d,
                                    choices: {
                                      ...d.choices,
                                      [f.id]: f.multiple
                                        ? e.target.checked
                                          ? [...(d.choices[f.id] || []), o.id]
                                          : (d.choices[f.id] || []).filter(
                                              (v) => v !== o.id,
                                            )
                                        : [o.id],
                                    },
                                  }))
                                }
                              />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      ),
                  )}
                <div className="section-divider" />
                <div className="panel-header">
                  <span className="step-number">02</span>
                  <div>
                    <h2>アイコン画像を選ぶ</h2>
                    <p>画像はこのブラウザ内で処理します。</p>
                  </div>
                </div>
                <label className="upload-box">
                  画像を選択する <span>JPEG / PNG / WebP</span>
                  <input
                    aria-label="アイコン画像"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      void upload(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
                {draft.icon && (
                  <div className="crop-controls">
                    <label className="range-label">
                      拡大 <output>{draft.crop.zoom.toFixed(1)}×</output>
                      <input
                        aria-label="アイコンの拡大率"
                        type="range"
                        min="1"
                        max="4"
                        step="0.05"
                        value={draft.crop.zoom}
                        onChange={(e) =>
                          changeCrop({ zoom: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label className="range-label">
                      左右位置
                      <input
                        aria-label="アイコンの左右位置"
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        value={draft.crop.x}
                        onChange={(e) =>
                          changeCrop({ x: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label className="range-label">
                      上下位置
                      <input
                        aria-label="アイコンの上下位置"
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        value={draft.crop.y}
                        onChange={(e) =>
                          changeCrop({ y: Number(e.target.value) })
                        }
                      />
                    </label>
                    <div className="button-row">
                      <button
                        onClick={() => changeCrop({ x: 0, y: 0, zoom: 1 })}
                      >
                        配置を戻す
                      </button>
                      <button
                        onClick={() => {
                          uploadToken.current++;
                          update((d) => ({ ...d, icon: null }));
                        }}
                      >
                        画像を削除
                      </button>
                    </div>
                  </div>
                )}
              </fieldset>
              <div className="section-divider" />
              <div className="panel-header">
                <span className="step-number">03</span>
                <div>
                  <h2>画像を保存・共有</h2>
                  <p>原寸のPNG画像で保存できます。</p>
                </div>
              </div>
              <label className="input-label" htmlFor="share-text">
                投稿文
              </label>
              <textarea
                id="share-text"
                rows={3}
                value={draft.shareText}
                disabled={!ready || busy || uploading}
                onChange={(e) =>
                  update((d) => ({ ...d, shareText: e.target.value }))
                }
              />
              <div className="export-actions">
                <button
                  className="primary-button"
                  disabled={!ready || busy || composing || uploading}
                  onClick={() => void output('download')}
                >
                  {busy ? '画像を準備しています…' : 'PNGを保存'}
                </button>
                <button
                  disabled={!ready || busy || composing || uploading}
                  onClick={() => void output('share')}
                >
                  共有する ↗
                </button>
              </div>
              <div className="share-links">
                <button
                  disabled={!ready || busy || composing || uploading}
                  onClick={() => void output('copy')}
                >
                  画像をコピー
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(draft.shareText)
                      .then(() => setNotice('投稿文をコピーしました'))
                      .catch(() =>
                        setError(
                          'コピーできませんでした。投稿文を選択してコピーしてください。',
                        ),
                      );
                  }}
                >
                  投稿文をコピー
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(draft.shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xの投稿画面 ↗
                </a>
              </div>
              <p className="helper">
                Xの投稿画面には文章だけが入ります。保存した画像を添付してください。
              </p>
              <button
                className="reset-button"
                disabled={!ready || busy || uploading}
                onClick={() => void reset()}
              >
                入力・下書きを初期化
              </button>
            </div>
          </BrowserFrame>
        </section>
      </div>
    </div>
  );
}
