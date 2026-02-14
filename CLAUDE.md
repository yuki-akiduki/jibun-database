# CLAUDE.md — 個人URLデータベース

## プロジェクト概要

URLを入力するだけで、サイト種別（YouTube/ニコニコ/Twitter/一般サイト）を自動判別し、タイトル・サムネイルを自動取得して登録できる個人データベース。
閲覧は誰でも可能、登録・編集は自分だけ（メール+パスワード認証）。

## 技術スタック

- **フレームワーク**: Next.js 16（App Router）
- **言語**: TypeScript（strict mode）
- **スタイリング**: Tailwind CSS
- **DB / 認証 / ストレージ**: Supabase
- **ホスティング**: Vercel
- **パッケージマネージャ**: pnpm

## コマンド

- `pnpm dev` — 開発サーバー起動
- `pnpm build` — ビルド
- `pnpm lint` — ESLint
- `pnpm type-check` — TypeScript型チェック (`tsc --noEmit`)

---

## 開発の進め方

このプロジェクトはNext.jsとSupabaseの学習を兼ねている。
各フェーズで「自分が手を動かす部分」と「Claudeに聞いてよい部分」を明確に分ける。

**Claudeの役割:**

- 詰まったときのヒント（答えではなくヒントを優先）
- エラーメッセージの解説
- コードレビュー（書いたコードを見せてフィードバックをもらう）
- ボイラープレートや設定ファイルなど学びが薄い部分の生成
- テストコードの生成

**自分でやること（⚠️ Claudeは答えを直接書かず、ヒントや公式ドキュメントのリンクで導く）:**

- Supabaseのセットアップとテーブル作成（ダッシュボード操作）
- RLSポリシーの設計と設定
- Supabase Authの設定
- 各ページ・コンポーネントのコード記述
- API Routeの実装
- Vercelへのデプロイ

---

## フェーズ一覧

### Phase 0: 環境構築

| タスク                                                | 担当     | 学習ポイント                                                |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------- |
| `pnpm create next-app` でプロジェクト作成             | 自分     | Next.js初期構成の理解                                       |
| Tailwind CSS の動作確認（色を変えてみる等）           | 自分     | Tailwind の仕組み                                           |
| Supabase プロジェクト作成（ダッシュボード）           | 自分     | Supabase管理画面の操作                                      |
| `@supabase/supabase-js`, `@supabase/ssr` インストール | 自分     | 依存関係の理解                                              |
| `.env.local` に Supabase URL と ANON_KEY を設定       | 自分     | 環境変数の仕組み                                            |
| Supabase クライアント初期化（lib/supabase/）          | 🤖Claude | ボイラープレート生成（client.ts, server.ts, middleware.ts） |
| ESLint / tsconfig の設定調整                          | 🤖Claude | 設定ファイル生成                                            |

### Phase 1: データベース設計 ⭐学習の要

| タスク                                  | 担当 | 学習ポイント             |
| --------------------------------------- | ---- | ------------------------ |
| テーブル設計を理解する（ER図を読む）    | 自分 | RDB設計の基本            |
| SQL Editor でテーブルを手動作成         | 自分 | SQL DDLの書き方          |
| RLSポリシーを自分で書いて設定           | 自分 | Supabase RLSの仕組み     |
| Storage バケット `thumbnails` 作成      | 自分 | Supabaseストレージの理解 |
| Auth でユーザー1人を手動作成            | 自分 | Supabase Authの理解      |
| Supabase 型生成（`supabase gen types`） | 自分 | 型安全なDB操作の理解     |

### Phase 2: 認証 ⭐学習の要

| タスク                                        | 担当     | 学習ポイント                           |
| --------------------------------------------- | -------- | -------------------------------------- |
| `/login` ページ作成                           | 自分     | App Router のページ作成                |
| LoginForm コンポーネント作成                  | 自分     | "use client" / useState / フォーム操作 |
| `supabase.auth.signInWithPassword()` 呼び出し | 自分     | Supabase Auth API                      |
| middleware.ts で `/admin/*` をガード          | 自分     | Next.js Middleware の仕組み            |
| ログアウト機能                                | 自分     | セッション管理の理解                   |
| 認証状態の確認方法がわからないとき            | 🤖Claude | ヒント・公式ドキュメントへの誘導       |

### Phase 3: 公開一覧ページ

| タスク                                  | 担当     | 学習ポイント                      |
| --------------------------------------- | -------- | --------------------------------- |
| `/` ページ作成（Server Component）      | 自分     | RSC / サーバーサイドfetch         |
| Supabase からエントリ一覧取得           | 自分     | Supabase JS クエリ                |
| EntryCard コンポーネント作成            | 自分     | コンポーネント設計                |
| SiteTypeBadge コンポーネント            | 自分     | 条件付きレンダリング              |
| グリッドレイアウト（Tailwind）          | 自分     | レスポンシブデザイン              |
| FilterBar（サイト種別・カテゴリ・タグ） | 自分     | URL searchParams / フィルタリング |
| ページネーション                        | 自分     | クエリパラメータ操作              |
| デザイン調整の相談                      | 🤖Claude | UIの改善提案                      |

### Phase 4: 登録機能 ⭐学習の要

| タスク                                   | 担当                        | 学習ポイント                     |
| ---------------------------------------- | --------------------------- | -------------------------------- |
| URL種別判定（lib/detect-site-type.ts）   | 自分                        | URL解析の基本                    |
| OGPメタデータ取得（lib/meta-fetcher.ts） | 自分で挑戦→🤖Claudeレビュー | fetch / HTMLパース               |
| `/api/fetch-meta` API Route              | 自分                        | Next.js API Route の書き方       |
| `/admin/new` ページ作成                  | 自分                        | フォーム → API → DB の全体フロー |
| EntryForm コンポーネント                 | 自分                        | フォーム管理                     |
| TagInput コンポーネント                  | 自分で挑戦→🤖Claudeレビュー | 複雑なUI状態管理                 |
| `/api/entries` POST実装                  | 自分                        | INSERT + トランザクション        |
| cheerio の使い方がわからないとき         | 🤖Claude                    | ライブラリの使い方解説           |

### Phase 5: 編集・削除機能

| タスク                           | 担当 | 学習ポイント        |
| -------------------------------- | ---- | ------------------- |
| `/admin/edit/[id]` ページ        | 自分 | 動的ルーティング    |
| `/api/entries/[id]` PUT / DELETE | 自分 | UPDATE / DELETE操作 |
| 削除確認モーダル                 | 自分 | UIインタラクション  |

### Phase 6: デプロイ

| タスク                        | 担当              | 学習ポイント       |
| ----------------------------- | ----------------- | ------------------ |
| GitHub にリポジトリ作成・push | 自分              | Git操作            |
| Vercel にインポート           | 自分              | Vercel の仕組み    |
| 環境変数設定                  | 自分              | 本番環境の環境変数 |
| 動作確認・バグ修正            | 自分→🤖Claude相談 | デバッグスキル     |

---

## データベース設計

### ER図

```
categories 1──N entries N──N tags
                  │        (entry_tags)
                  │
             Supabase Storage（サムネイル）
```

### テーブル定義SQL（Phase 1 で自分の手で SQL Editor に入力する）

```sql
-- 1. カテゴリマスタ
CREATE TABLE categories (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 2. タグマスタ
CREATE TABLE tags (
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 3. メインテーブル
CREATE TABLE entries (
  id            BIGSERIAL PRIMARY KEY,
  url           TEXT NOT NULL UNIQUE,
  site_type     TEXT NOT NULL CHECK (site_type IN ('youtube', 'niconico', 'x', 'website')),
  title         TEXT,
  thumbnail_url TEXT,
  description   TEXT,
  author        TEXT,
  category_id   BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  memo          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entries_site_type ON entries(site_type);
CREATE INDEX idx_entries_category ON entries(category_id);
CREATE INDEX idx_entries_created  ON entries(created_at DESC);

-- 4. 中間テーブル
CREATE TABLE entry_tags (
  entry_id BIGINT REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   BIGINT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE INDEX idx_entry_tags_tag ON entry_tags(tag_id);
```

### RLSポリシー（自分で書く。以下は正解例 — まず自分で考えてから見る）

<details>
<summary>💡 ヒント: 全テーブル共通で「SELECTは全員OK、INSERT/UPDATE/DELETEは認証済みのみ」</summary>

```sql
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公開閲覧"         ON entries FOR SELECT USING (true);
CREATE POLICY "認証ユーザー登録"  ON entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "認証ユーザー更新"  ON entries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "認証ユーザー削除"  ON entries FOR DELETE USING (auth.role() = 'authenticated');
-- categories, tags, entry_tags にも同様に設定
```

</details>

---

## URL自動判別・メタデータ取得

### サイト種別判定（自分で実装する）

ヒント: `new URL(url).hostname` でドメインを取得し、`includes()` で判定。

| ドメイン                  | site_type  |
| ------------------------- | ---------- |
| `youtube.com`, `youtu.be` | `youtube`  |
| `nicovideo.jp`, `nico.ms` | `niconico` |
| `twitter.com`, `x.com`    | `twitter`  |
| その他                    | `website`  |

### メタデータ取得（自分で挑戦 → 詰まったらClaudeに相談）

| サイト種別 | 方法                   | ヒント                                                                     |
| ---------- | ---------------------- | -------------------------------------------------------------------------- |
| YouTube    | oEmbed API             | `https://www.youtube.com/oembed?url={URL}&format=json` をfetchするだけ     |
| ニコニコ   | OGPパース              | HTMLをfetch → `og:title`, `og:image` を抽出。cheerio推奨                   |
| Twitter/X  | OGPパース（※失敗多い） | 取得できなかったら手入力フォールバックをUIで促す                           |
| 一般サイト | OGPパース              | `og:title` → `<title>` の優先順。`og:image` が無ければ最初の大きい `<img>` |

---

## 画面仕様

### 公開一覧ページ（/）

- カード型グリッド（レスポンシブ: sm:2列, md:3列, lg:4列）
- 各カード: サムネイル、タイトル、サイト種別バッジ、タグ
- カードクリック → 元URLを新タブで開く
- フィルタ: サイト種別タブ / カテゴリドロップダウン / タグ選択 / テキスト検索
- ページネーション

### 新規登録ページ（/admin/new）

- URL入力 + [取得]ボタン → `/api/fetch-meta` → プレビュー表示
- 自動取得項目は編集可能
- 手入力: カテゴリ（ドロップダウン）、タグ（入力補完付き）、メモ
- [登録する] → `/api/entries` POST

### 編集ページ（/admin/edit/[id]）

- 登録フォームと同じ構造、既存データ読み込み
- [更新する] → PUT

### ログインページ（/login）

- メール + パスワード → 成功時 `/admin/new` にリダイレクト

---

## API Routes 仕様

| メソッド | パス                | 認証 | 説明                                                             |
| -------- | ------------------- | ---- | ---------------------------------------------------------------- |
| POST     | `/api/fetch-meta`   | 必須 | URL→メタデータ自動取得                                           |
| GET      | `/api/entries`      | 不要 | 一覧（`?site_type=`, `?category_id=`, `?tag=`, `?q=`, `?page=`） |
| POST     | `/api/entries`      | 必須 | 新規登録（tags配列: 新規タグは自動INSERT）                       |
| PUT      | `/api/entries/[id]` | 必須 | 更新                                                             |
| DELETE   | `/api/entries/[id]` | 必須 | 削除（entry_tagsはCASCADE）                                      |
| GET      | `/api/categories`   | 不要 | カテゴリ一覧                                                     |
| POST     | `/api/categories`   | 必須 | カテゴリ追加                                                     |
| GET      | `/api/tags`         | 不要 | タグ一覧                                                         |
| POST     | `/api/tags`         | 必須 | タグ追加                                                         |

---

## ディレクトリ構成

```
app/
├── layout.tsx                 # 共通レイアウト
├── page.tsx                   # 公開一覧ページ（/）
├── login/page.tsx             # ログイン
├── admin/
│   ├── layout.tsx             # 認証ガード付きレイアウト
│   ├── new/page.tsx           # 新規登録
│   └── edit/[id]/page.tsx     # 編集
└── api/
    ├── entries/
    │   ├── route.ts           # GET(一覧), POST(登録)
    │   └── [id]/route.ts      # GET, PUT, DELETE
    ├── fetch-meta/route.ts    # OGP自動取得
    ├── categories/route.ts
    └── tags/route.ts
components/
├── EntryCard.tsx
├── EntryForm.tsx
├── FilterBar.tsx
├── SiteTypeBadge.tsx
├── TagInput.tsx
└── LoginForm.tsx
lib/
├── supabase/
│   ├── client.ts              # ブラウザ用（createBrowserClient）
│   ├── server.ts              # サーバー用（createServerClient）
│   └── middleware.ts          # セッションリフレッシュ
├── meta-fetcher.ts            # URL→メタデータ取得
├── detect-site-type.ts        # URL→サイト種別判定
└── types.ts                   # 型定義
middleware.ts                   # /admin/* 認証ガード
```

---

## コーディングルール

→ `.claude/rules/coding.md` に移動済み

## 環境変数（.env.local）

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Claudeへの指示

→ `.claude/rules/hint.md` に移動済み
