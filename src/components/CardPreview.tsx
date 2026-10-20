import { useEffect, useRef, useState } from 'react';
import type { Template, Draft } from '../lib/model';
import { prepareAssets, renderCard } from '../lib/render';
export default function CardPreview({
  template,
  draft,
  selected,
  onSelect,
  onWarnings,
}: {
  template: Template;
  draft: Draft;
  selected: string;
  onSelect: (id: string) => void;
  onWarnings: (w: string[]) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    prepareAssets(template, draft)
      .then((assets) => {
        if (current && canvas.current) {
          onWarnings(renderCard(canvas.current, template, draft, assets));
          setError('');
        }
      })
      .catch(() => {
        if (current)
          setError(
            'プレビューを描画できません。ページを再読み込みしてください。',
          );
      });
    return () => {
      current = false;
    };
  }, [template, draft, onWarnings]);
  return (
    <div className="preview-card">
      <canvas
        ref={canvas}
        width={template.width}
        height={template.height}
        aria-label="編集中のカードプレビュー。各項目は編集パネルでも変更できます"
      />
      <div className="field-targets" aria-label="カード上の入力項目">
        {template.fields
          .filter((f) => f.kind === 'text')
          .map(
            (f) =>
              f.kind === 'text' && (
                <button
                  key={f.id}
                  type="button"
                  className={`field-target ${selected === f.id ? 'selected' : ''}`}
                  style={{
                    left: `${(f.x / template.width) * 100}%`,
                    top: `${(f.y / template.height) * 100}%`,
                    width: `${(f.width / template.width) * 100}%`,
                    height: `${(f.height / template.height) * 100}%`,
                  }}
                  aria-label={`${f.label}を編集`}
                  aria-pressed={selected === f.id}
                  onClick={() => onSelect(f.id)}
                >
                  <span className="sr-only">{f.label}</span>
                </button>
              ),
          )}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
