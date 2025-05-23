# Webサイト VRT (Visual Regression Testing) プロジェクト

このプロジェクトは、Webサイトのリファクタリングや改修時に、意図しない表示崩れが発生していないかを確認するための Visual Regression Testing (VRT) 環境を提供します。Playwright を利用して、指定されたページのスクリーンショットを撮影し、以前のバージョンと比較することで差分を検出します。

## 目的

Web制作会社が納品済みのウェブサイトに対して改修作業を行う際、以下のようなリスクを軽減することを目的とします。

*   特定のページの修正が、他のページに意図しない影響を与えること
*   CSSの変更によるレイアウト崩れ
*   JavaScriptの改修による動的コンテンツの表示不具合

このVRTを導入することで、開発者は安心してリファクタリングや機能追加に取り組むことができます。

## テスト対象環境

このVRTでは、以下の2つの環境を主なテスト対象とします。

*   **本番環境 (Production):** 現在公開されているウェブサイトの状態を基準とします。
*   **ローカル環境 (Local):** 開発中のウェブサイトの状態をテストします。

## 主な機能

*   指定された複数ページのスクリーンショットを撮影
*   本番環境とローカル環境の表示比較
*   PC表示とモバイル表示のテスト
*   差分があった場合にレポートを生成

## ディレクトリ構成

```
.
├── tests/
│   ├── vrt/
│   │   ├── all-pages-vrt.spec.ts  # 全ページVRTテストスクリプト
│   │   └── paths.ts               # テスト対象ページのパス一覧
│   ├── utils/
│   │   ├── lazyKiller.ts          # 遅延読み込み対策スクリプト
│   │   └── waitForImages.ts       # 画像読み込み待機処理
│   └── __screenshots__/          # 基準となるスクリーンショット保存先
│       ├── local/
│       ├── local-mobile/
│       ├── production/
│       └── production-mobile/
├── playwright-report/             # PlaywrightのHTMLレポート出力先
├── test-results/                  # テスト結果（差分画像など）の出力先
├── scripts/
│   ├── clean-screenshots.js       # スクリーンショット削除ユーティリティ
│   └── vrt-summary.ts             # VRT結果の集計用スクリプト (例)
├── package.json
├── playwright.config.ts
└── README.md
```

## セットアップ

1.  **リポジトリのクローン:**
    ```bash
    git clone <repository-url>
    cd prod_vs_local_vrt
    ```
2.  **依存パッケージのインストール:**
    ```bash
    npm install
    ```
3.  **Playwright のブラウザドライバをインストール:**
    ```bash
    npx playwright install
    ```

## テストの実行

### 1. ローカル vs 本番を一括比較（推奨）

以下の 1 コマンドで「古いスナップショット削除 → 本番スナップショット再取得 → ローカル比較」まで自動で行います。

```bash
npm run vrt:compare:local-vs-prod
```

内部では次の順番で実行されます。

1. `npm run vrt:clean` – `tests/__screenshots__` ディレクトリを OS 非依存で再帰削除
2. `playwright test --project=production --project=production-mobile --update-snapshots` – PC/モバイル両方の本番スナップショットを取得
3. `playwright test --project=local-vs-prod --project=local-vs-prod-mobile` – ローカルと本番スナップショットの比較

差分が検出されると `test-results/local-vs-prod*` に差分画像が保存され、HTML レポートは `playwright-report/index.html` から確認できます。

### 2. ローカル単体での VRT（任意）

ローカル環境の見た目がどの程度変化したかを把握したい場合は従来どおり実行できます。

```bash
npm run vrt:local
```

### 3. 本番スナップショットの手動更新（任意）

何らかの理由で本番スナップショットのみを更新したい場合は次のコマンドを実行してください。

```bash
npm run vrt:update:prod
```

> **メモ**: `vrt:compare:local-vs-prod` を実行すると常に最新の本番スナップショットを生成し直すため、通常はこちらを使えば手動更新は不要です。

## テスト設定の調整

### テスト対象ページの追加・変更

テスト対象とするページは `tests/vrt/paths.ts` ファイル内の `paths` 配列で管理されています。この配列を編集することで、テスト対象ページを追加・変更できます。

```typescript
// tests/vrt/paths.ts
export const paths = [
  '/',
  '/about',
  '/contact',
  // ... 追加したいパス
];
```

### ベースURLの変更

`playwright.config.ts` ファイル内で、各環境のベースURLが定義されています。先のリファクタリングにより、`localBaseURL` と `productionBaseURL` という定数で管理されるようになりました。

*   ローカル環境: `localBaseURL`
*   本番環境: `productionBaseURL`

必要に応じてこれらのURLを実際の環境に合わせて変更してください。

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const VRT_TEST_DIR = './tests/vrt';
const SNAPSHOT_PATH_TEMPLATE = '{snapshotDir}/{testFilePath}/{arg}{ext}';

const commonProjectSettings = {
    testDir: VRT_TEST_DIR,
    snapshotPathTemplate: SNAPSHOT_PATH_TEMPLATE,
};

const localBaseURL = 'http://localhost:3000'; // ← ローカルサーバーのURLに変更
const productionBaseURL = 'https://www.example.com'; // ← 本番環境のURLに変更

const desktopViewport = { width: 1280, height: 800 };

export default defineConfig({
  // ...
  projects: [
    {
      name: 'local',
      use: {
        baseURL: localBaseURL,
        // ...
      },
      // ...
    },
    {
      name: 'production',
      use: {
        baseURL: productionBaseURL,
        // ...
      },
      // ...
    },
    // ...
  ],
});
```

### スクリーンショット設定

`tests/vrt/all-pages-vrt.spec.ts` 内の `toHaveScreenshot` メソッドのオプションで、スクリーンショット撮影時の挙動を調整できます。

*   `threshold`: 許容するピクセル単位の差分の割合 (0 から 1)
*   `maxDiffPixelRatio`: 許容する異なるピクセルの割合

```typescript
// tests/vrt/all-pages-vrt.spec.ts
await expect(page).toHaveScreenshot(`${safeName}.png`, {
  fullPage: true,
  animations: 'disabled',
  threshold: 0.3, // 必要に応じて調整
  maxDiffPixelRatio: 0.02, // 必要に応じて調整
});
```

### 遅延読み込みされる要素への対応

このプロジェクトでは、`tests/utils/lazyKiller.ts` によって、ページの遅延読み込み（Lazy Loading）を無効化しようと試みます。これは、VRT実行時に全てのコンテンツが表示された状態でスクリーンショットを撮影するためです。

もし、特定のサイトで `lazyKiller.ts` がうまく機能しない場合や、より詳細な制御が必要な場合は、テストスクリプト (`all-pages-vrt.spec.ts`) 内で `page.waitForTimeout()` を使用して適切な待機時間を設けるか、特定の要素が表示されるまで待つ処理 (`page.waitForSelector()`) などを追加することを検討してください。

## 制限事項・注意事項

*   **動的コンテンツの多いページ:** カルーセルや、アクセスごとに内容が大きく変わる広告エリアなどは、差分として検出されやすいです。必要に応じて、テスト対象から除外するか、特定の要素をマスクする処理を検討してください。
*   **フォントのレンダリング:** OSやブラウザのバージョンによってフォントのレンダリングに微妙な差異が生じ、VRTで差分として検出されることがあります。`threshold` の値を調整するか、CI環境を統一するなどの対策が考えられます。
*   **初回実行時のスナップショット:** `npm run vrt:update:prod` を実行する前に本番環境のサイトが存在しない、またはアクセスできない場合、スナップショットが正しく作成されません。

## 今後の改善案 (例)

*   特定の要素を除外してスクリーンショットを撮る機能の追加
*   テストレポートのカスタマイズ性の向上
*   CI (Continuous Integration) との連携強化

このドキュメントは、プロジェクトの理解とスムーズな利用開始の一助となることを目指しています。 