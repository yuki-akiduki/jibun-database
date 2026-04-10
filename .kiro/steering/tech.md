# Technology Stack

## Architecture

Next.js 16 App Router ベースの **Server Components first** アーキテクチャ。
データアクセスは Server Components / API Routes から直接 Supabase に接続する（専用の BFF 層は作らない）。認証は Supabase Auth（メール + パスワード）、セッションは Cookie。

Client Components は明示的に必要な場面（ユーザー操作、jotai atom 参照、埋め込み widget 初期化）だけに限定する。

## Core Technologies

- **Language**: TypeScript 5（strict mode）
- **Framework**: Next.js 16 (App Router) / React 19
- **Runtime**: Node.js + pnpm
- **Styling**: Tailwind CSS v4（`@tailwindcss/postcss` プラグイン、`@theme inline` で CSS 変数連携）
- **DB / Auth**: Supabase（`@supabase/ssr` の SSR クライアント）

## Key Libraries

日常的な実装判断に影響するものだけ:

- **`@supabase/ssr`**: cookie ベースのサーバー側 Supabase クライアント。Server Component / API Route から使う正道
- **`jotai`**: クライアント側の軽量状態管理。メタデータプレビュー（`metaAtom`）など、局所的な状態にのみ使う
- **`cheerio`**: OGP パース。一般サイト・ニコニコのメタデータ取得に使用
- **`dayjs`**: 日付フォーマット
- **`next/font/google`** の Inter: CSS 変数経由で Tailwind の `font-sans` に割当

## Development Standards

### Type Safety
TypeScript strict mode。`any` は使わない。型定義は `src/lib/types/` に単一責務で分割し `index.ts` から re-export する。

### Code Quality
- **ESLint**: `eslint-config-next` (core-web-vitals + typescript) + `eslint-config-prettier`（Prettier 衝突を回避）
- **Prettier**: single quote / semi あり / 2-space / trailing comma `all` / print width 100

### Testing
学習プロジェクト方針により**必須ではない**。必要な箇所だけ書く。過剰な防御コードや「念のための」エラーハンドリングは求めない。

## Development Environment

### Required Tools
- Node.js（Next.js 16 / React 19 対応バージョン）
- pnpm 10.x（`packageManager` フィールドで固定）
- Supabase プロジェクト（URL と anon key を `.env.local` に設定）

### Common Commands
```bash
pnpm dev         # 開発サーバー（port 8999）
pnpm build       # 本番ビルド
pnpm lint        # ESLint
pnpm type-check  # tsc --noEmit
pnpm format      # Prettier --write
```

## Key Technical Decisions

### Supabase クライアントの 3 分割
- `src/lib/supabase/server.ts`: Server Component / API Route 用（cookie 連携）
- `src/lib/supabase/client.ts`: Client Component 用
- `src/lib/supabase/middleware.ts`: セッションリフレッシュ（`proxy.ts` から呼ばれる）

### Next.js 16 Middleware
Next.js 16 で `middleware.ts` → **`proxy.ts`** に名称変更された新方式を採用。
`proxy.ts` は**プロジェクトルート直下**に配置し、`proxy` 関数を export する。

### RLS ポリシー
全テーブル共通で SELECT は公開、INSERT/UPDATE/DELETE は `authenticated` ロールのみ。書き込みのゲートは RLS に委ね、アプリ側では二重の権限チェックを書かない。

### サムネイルは外部 URL のまま保存
Supabase Storage は使わず、YouTube / X / OGP から取得したサムネイル URL を文字列として `entries.thumbnail_url` に保存する。画像は `next/image` で最適化して配信。

### スタイリング規約
- **インライン CSS 禁止**: `style={{}}` は使わない
- **動的な色・サイズも Tailwind class map で**: カテゴリ色は `src/lib/constants/categories.ts` に static map として集約
- `@theme inline` でデザイントークンを Tailwind と共有

### 状態管理の線引き
- サーバー状態（entries / categories）: Server Component + Supabase fetch で都度取得
- クライアント状態（メタデータプレビュー等の一時的 UI 状態）: jotai atom

---

_Document standards and patterns, not every dependency_
