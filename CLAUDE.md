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

Claudeが実装を担当する。方針や設計は壁打ちしながら決める。

**Claudeの役割:**

- コンポーネント・API Route・スタイリングの実装
- コードレビュー・リファクタリング
- エラーの調査・修正
- テストコードの生成

**自分でやること:**

- Supabaseダッシュボード操作（テーブル変更、RLS、Auth設定など）
- 設計方針の決定（壁打ちで決める）
- Vercelへのデプロイ

---

## フェーズ一覧

### Phase 0: 環境構築 ✅

- Next.js + Tailwind CSS + Supabase セットアップ
- Supabaseクライアント初期化（client.ts, server.ts, middleware.ts）

### Phase 1: データベース設計 ✅

- テーブル4つ作成（categories, tags, entries, entry_tags）
- RLSポリシー設定
- Authユーザー作成

### Phase 2: 認証 ✅

- ログイン / ログアウト機能
- LoginForm / LogoutButton コンポーネント

### Phase 3: 登録機能 ✅

- URL種別判定（detectSiteType）
- メタデータ自動取得（YouTube oEmbed, OGPパース, X oEmbed）
- `/api/fetch-meta`, `/api/entries` POST
- EntryForm / UrlInput / MetaPreview
- 編集・削除API（`/api/entries/[id]` PUT / DELETE）

### Phase 4: フロントエンド再設計 ← 今ここ

- レイアウト再構成（Header, Sidebar, CategoryNav）
- EntryCard分割・再設計（表示専用 + 編集モーダル）
- 汎用UIコンポーネント（Button, Badge, Modal, Spinner）
- フィルタ（サイト種別、テキスト検索）
- ページネーション
- 認証UI制御（ログイン状態に応じた表示切替）
- 全体スタイリング

### Phase 5: タグ機能

- TagInputコンポーネント
- タグAPI連携（`/api/tags`）
- タグフィルタ

### Phase 6: デプロイ

- GitHub push
- Vercel にインポート
- 環境変数設定
- 動作確認・バグ修正

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

### サイト種別判定

| ドメイン                  | site_type  |
| ------------------------- | ---------- |
| `youtube.com`, `youtu.be` | `youtube`  |
| `nicovideo.jp`, `nico.ms` | `niconico` |
| `twitter.com`, `x.com`    | `x`        |
| その他                    | `website`  |

### メタデータ取得

| サイト種別 | 方法     |
| ---------- | -------- |
| YouTube    | oEmbed API |
| ニコニコ   | OGPパース（cheerio） |
| Twitter/X  | oEmbed API（HTML埋め込み） |
| 一般サイト | OGPパース（cheerio） |

---

## 画面仕様

### 共通レイアウト
- ヘッダー: sticky、ロゴ左 + ログイン/ログアウトボタン右
- 左サイドバー: カテゴリナビ（active状態表示、カテゴリ色つき）
- main: max-width 1000px、左寄せ

### トップページ（/）
- X以外の最近20件を1カラム縦積みで表示
- カードクリック → 元URLを新タブで開く
- ログイン時: ページ上部にURL入力 + 登録UI表示
  - X投稿: メモ・カテゴリ不要、即登録可能
  - X以外: カテゴリ選択 + メモ入力が可能

### カテゴリページ（/categories/[id]）
- 該当カテゴリのエントリを1カラム縦積み、40件ずつページネーション
- ログイン時: カードメニューから編集・削除、一括削除ボタン

### ログインページ（/login）
- メール + パスワード → 成功時トップにリダイレクト

### カテゴリ一覧（固定5つ + X）
| カテゴリ | 色 |
|---------|-----|
| リリック | 要定義 |
| モーション | 要定義 |
| ボイロ | 要定義 |
| website | 要定義 |
| article | 要定義 |
| X | 要定義 |

---

## API Routes 仕様

| メソッド | パス                | 認証 | 説明 |
| -------- | ------------------- | ---- | ---- |
| POST     | `/api/fetch-meta`   | 必須 | URL→メタデータ自動取得 |
| POST     | `/api/entries`      | 必須 | 新規登録 |
| PUT      | `/api/entries/[id]` | 必須 | 更新（category_id, memo） |
| DELETE   | `/api/entries/[id]` | 必須 | 削除 |
| GET      | `/api/categories`   | 不要 | カテゴリ一覧 |

---

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx                 # 共通レイアウト（Header + Sidebar + main）
│   ├── page.tsx                   # トップページ（/）
│   ├── login/page.tsx             # ログイン
│   ├── categories/[id]/page.tsx   # カテゴリページ
│   └── api/
│       ├── entries/
│       │   ├── route.ts           # POST（登録）
│       │   └── [id]/route.ts      # PUT, DELETE
│       ├── fetch-meta/route.ts    # メタデータ取得
│       └── categories/route.ts    # GET（カテゴリ一覧）
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # ヘッダー（ロゴ + 認証ボタン）
│   │   ├── Sidebar.tsx            # サイドバーラッパー
│   │   └── CategoryNav.tsx        # カテゴリナビ
│   ├── entry/
│   │   ├── EntryCard.tsx          # 表示専用カード
│   │   ├── EntryCardMenu.tsx      # ドロップダウン（編集/削除）
│   │   ├── EntryEditModal.tsx     # 編集モーダル
│   │   ├── EntryList.tsx          # カード一覧（縦積み）
│   │   ├── CategoryBadge.tsx      # カテゴリバッジ（色つき）
│   │   ├── EntryForm.tsx          # 登録フォーム（X分岐対応）
│   │   ├── UrlInput.tsx           # URL入力
│   │   └── MetaPreview.tsx        # メタデータプレビュー
│   ├── auth/
│   │   ├── LoginForm.tsx          # ログインフォーム
│   │   └── LogoutButton.tsx       # ログアウトボタン
│   └── ui/
│       ├── Button.tsx             # 汎用ボタン
│       ├── Badge.tsx              # 汎用バッジ
│       ├── Modal.tsx              # 汎用モーダル
│       ├── DropdownMenu.tsx       # 汎用ドロップダウン
│       ├── Pagination.tsx         # ページネーション
│       └── Spinner.tsx            # ローディング
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # ブラウザ用
│   │   ├── server.ts              # サーバー用
│   │   └── middleware.ts          # セッションリフレッシュ
│   ├── api/
│   │   └── entries.ts             # クライアント側API呼び出し
│   ├── utils/
│   │   ├── site.ts                # URL→サイト種別判定
│   │   └── auth.ts                # signOut
│   ├── jotai/
│   │   └── atoms.ts               # metaAtom
│   └── types/
│       ├── index.ts               # re-export
│       ├── site.ts                # SiteType
│       ├── meta.ts                # Meta
│       ├── entry.ts               # Entry
│       └── categories.ts          # Categories
└── proxy.ts                        # セッションリフレッシュ（Next.js 16）
```

---

## コーディングルール

→ `.claude/rules/coding.md` に移動済み

## 環境変数（.env.local）

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
