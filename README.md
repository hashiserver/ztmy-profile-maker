# ztmy-profile-maker

ブラウザ上で自己紹介カードを編集し、PNG画像として保存・共有できる非公式ファンツール。

## 開発

Node.js 22.22以上（CIは24）。

```sh
npm ci
npm run dev
```

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

ビルド成果物は `dist/`。Astroによる静的生成で、編集画面だけReactを読み込みます。バックエンド・DBサーバーは不要です。下書きは端末のIndexedDBに保存します。

## 現在の状態

初期実装の開発ブランチです。運営制作のオリジナル・デモで、文字・選択項目・円形アイコンの編集、原寸PNG保存、下書き自動復元、共有の代替操作を実装しています。**MVP完了・本番公開済みではありません。**

- [実装範囲・確認結果・残作業](docs/IMPLEMENTATION.md)
- [MVP要件定義書 v1.8](docs/SPEC.md)
- [要件定義の再レビュー](docs/REVIEW.md)
- [初期実装計画](docs/superpowers/plans/2026-10-19-card-editor-foundation.md)
- [文字描画の初期方針](docs/ADR-001-rendering.md)

作者の許諾を確認した画像のみ登録します。2026-10-20、使用許可を得られなかった提供画像とその掲載・編集導線を削除しました。現在公開対象は運営制作デモのみです。個人的な許諾原文はコミットしません。

## 配信

Cloudflare Pagesを想定。ビルドコマンド `npm run build`、出力ディレクトリ `dist`、Node.js 24。本番ブランチは `main`。**接続時にプレビューブランチのデプロイを無効化**してください。このPRではCloudflareプロジェクト作成・デプロイ・解析導入は行いません。

## 画像・フォントの条件

運営制作デモは個人の自己紹介カードの生成・保存・SNS投稿に利用できます。作者提供画像や今後のテンプレートには、それぞれ別の条件を適用します。

日本語フォントはNoto Sans JP、Noto Serif JP（SIL Open Font License 1.1）。ライセンス原文は `public/licenses/` に同梱しています。アプリソース全体の再配布ライセンスは別途決定します。
