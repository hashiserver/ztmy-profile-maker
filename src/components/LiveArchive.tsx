import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  FileTextIcon,
} from '@phosphor-icons/react';
import BrowserFrame from './BrowserFrame';
import type { Template } from '../lib/model';

type Collection = {
  id: string;
  title: string;
  subtitle: string;
  date?: string;
  venue?: string;
  poster: string;
  templates: Template[];
};
export default function LiveArchive({ templates }: { templates: Template[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const collections: Collection[] = [
    {
      id: 'bunka-denrai',
      title: '文禍伝雷',
      subtitle: 'LEGACY ZOMBIE LABO',
      date: '2026.10.10（土）– 10.11（日）',
      venue: '奈良・平城京',
      poster: '/images/bunka-denrai-live.jpg',
      templates: templates.filter((t) => t.id === 'ztmy-heijokyo-2026'),
    },
    {
      id: 'original',
      title: 'オリジナル・デモ',
      subtitle: 'ライブを問わず使えるカード',
      poster: '/templates/midnight-note.svg',
      templates: templates.filter((t) => t.id === 'midnight-note'),
    },
  ];
  const [collection, setCollection] = useState(collections[0]);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnScroll = useRef(0);
  const close = () => dialog.current?.close();
  function open(c: Collection) {
    returnScroll.current = window.scrollY;
    setCollection(c);
    dialog.current?.showModal();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return (
    <div className="archive-shell">
      <h1 className="sr-only">ずとまよプロフィールメーカー</h1>

      <div className="archive-desktop">
        {collections.map((c, i) => (
          <section
            key={c.id}
            className={`live-window live-window-${i}`}
            aria-label={c.title}
          >
            <BrowserFrame
              title="ずとまよライブアーカイブ"
              address={`archive://live/${c.id}`}
            >
              <button
                className="live-poster-button"
                disabled={!mounted}
                onClick={() => open(c)}
                aria-label={`${c.title}のテンプレートを見る`}
              >
                <img
                  className={`live-poster ${i === 1 ? 'demo-poster' : ''}`}
                  src={c.poster}
                  alt={
                    i === 0
                      ? '文禍伝雷のライブビジュアル'
                      : 'Midnight note オリジナルカード'
                  }
                  width={i === 0 ? 1200 : 1200}
                  height={i === 0 ? 800 : 1600}
                />
                <div className="live-caption">
                  <div>
                    <span className="archive-kicker">{c.subtitle}</span>
                    <h2>{c.title}</h2>
                    <p>
                      {c.date || '横書き・縦書き対応'}
                      {c.venue && <>　{c.venue}</>}
                    </p>
                  </div>
                  <span className="open-window-label">
                    テンプレートを見る <ArrowRightIcon aria-hidden="true" />
                  </span>
                </div>
              </button>
            </BrowserFrame>
          </section>
        ))}
      </div>
      <p className="archive-note">
        提供テンプレートの掲載許諾・利用条件は確認中です。
        <a href="/about/#template-permission">
          掲載状況について <ArrowUpRightIcon aria-hidden="true" />
        </a>
      </p>
      <dialog
        className="template-dialog"
        ref={dialog}
        aria-labelledby="template-dialog-title"
        onClose={() =>
          window.scrollTo({ top: returnScroll.current, behavior: 'instant' })
        }
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <BrowserFrame
          title={`${collection.title} / テンプレート一覧`}
          address={`archive://live/${collection.id}`}
          onBack={close}
          onClose={close}
        >
          {collection.templates.map((t) => (
            <article className="template-detail" key={t.id}>
              <div className="template-info">
                <p className="archive-kicker">テンプレートを選ぶ</p>
                <span id="template-dialog-title" className="sr-only">
                  {collection.title} / テンプレート一覧
                </span>
                <h2>{collection.title}</h2>
                <h3>プロフィールカード</h3>
                <dl className="template-facts">
                  <div>
                    <dt>作者</dt>
                    <dd>
                      <a
                        href={t.author.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.author.name} <ArrowUpRightIcon aria-hidden="true" />
                      </a>
                    </dd>
                  </div>
                  {collection.date && (
                    <div>
                      <dt>開催日</dt>
                      <dd>{collection.date}</dd>
                    </div>
                  )}
                  {collection.venue && (
                    <div>
                      <dt>会場</dt>
                      <dd>{collection.venue}</dd>
                    </div>
                  )}
                </dl>
                <p className="template-description">
                  {t.description ||
                    '横書き・縦書きを試せるオリジナルのカードです。'}
                </p>
                <p className="template-permission">
                  {t.badge || 'オリジナル・デモ'}
                </p>
                <a className="primary-button" href={`/edit/${t.id}/`}>
                  <FileTextIcon aria-hidden="true" />
                  このテンプレートを使う <ArrowRightIcon aria-hidden="true" />
                </a>
              </div>
              <a
                className="template-art"
                href={`/edit/${t.id}/`}
                aria-label={`${t.title}を編集`}
              >
                <img
                  src={t.background}
                  alt={t.title}
                  width={t.width}
                  height={t.height}
                />
              </a>
            </article>
          ))}
        </BrowserFrame>
      </dialog>
      <noscript>
        ライブの選択にはJavaScriptを使用します。直接編集する場合：
        {templates.map((t) => (
          <a href={`/edit/${t.id}/`} key={t.id}>
            {t.title}
          </a>
        ))}
      </noscript>
    </div>
  );
}
