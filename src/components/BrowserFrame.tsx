import {
  ArrowLeftIcon,
  GlobeIcon,
  XIcon,
  CircleIcon,
  FolderIcon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export default function BrowserFrame({
  title,
  address,
  onBack,
  onClose,
  children,
  className = '',
}: {
  title: string;
  address: string;
  onBack?: () => void;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`browser-frame ${className}`}>
      <div className="window-titlebar">
        <span className="window-lights" aria-hidden="true">
          <CircleIcon weight="fill" />
          <CircleIcon weight="fill" />
          <CircleIcon weight="fill" />
        </span>
        <span className="window-title">
          <FolderIcon aria-hidden="true" />
          {title}
        </span>
        {onClose && (
          <button
            className="window-control"
            onClick={onClose}
            aria-label="テンプレート一覧を閉じる"
          >
            <XIcon aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="window-navigation">
        {onBack ? (
          <button
            className="window-control"
            onClick={onBack}
            aria-label="一覧に戻る"
          >
            <ArrowLeftIcon aria-hidden="true" />
          </button>
        ) : (
          <a className="window-control" href="/" aria-label="ライブ一覧へ">
            <ArrowLeftIcon aria-hidden="true" />
          </a>
        )}
        <div className="window-address">
          <GlobeIcon aria-hidden="true" />
          <span>{address}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
