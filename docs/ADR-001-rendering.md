# ADR-001: 初期実装の描画方式

日付: 2026-10-19。状態: **横書きは採用、縦書きは技術検証段階**。

## 決定

純粋関数 `layoutText` が元画像ピクセル基準の文字配置を返し、Canvas 2Dが描画する。プレビューとPNG書き出しは同じレイアウトと描画関数を使用する。入力はHTML input/textareaに任せ、変換中に値を正規化・削除しない。変換中の自動保存とPNG出力は待機する。

プレビューと書き出し用Canvasの `lang` を明示的に `ja` に統一する。画面外のCanvasはHTMLの言語を継承しないため、同じフォントでも数字等のローカライズ字形が変わることをブラウザのピクセル比較で確認した。

フォントCSSはフォントごとに遅延読み込みし、現在の入力文字を指定してFontFaceSet.loadを待ってから描画する。CSS・フォントファイルは配信元と同一オリジンに同梱し、Google Fonts等へ入力文字を送らない。

縦書きは上から下・右から左へ流し、半角2桁数字を縦中横、ASCII単語を90度回転させる。句読点は位置調整、括弧等は回転を行う。これはCSSの `writing-mode: vertical-rl` の標準組版と完全同等ではない。Canvasのdirection設定だけでは日本語の縦組みにはならないため、独自の配置処理が必要になる。

## 比較と残検証

- Canvas共通描画: プレビューとPNGの一致を確保しやすい。禁則処理・句読点・括弧の字形は追加検証が必要。
- DOM/SVG: ブラウザの縦組みを利用できるが、foreignObject等からPNG化する際のフォント・ブラウザ差を検証する必要がある。

初期版はCanvasで実行可能な比較基準を作る。最終エンジン決定の前に、実際の作者テンプレートと8〜10種のフォントで、DOM/SVGとの組版比較を実施する。禁則処理、連続する欧文・数字、句読点・括弧の組み合わせ、Android/iPhone実機を確認する。縦書き要件を完了扱いにはしない。

参考:
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/direction
- https://developer.mozilla.org/en-US/docs/Web/CSS/writing-mode
