# CLAUDE.md — 個人URLデータベース

## プロジェクト概要

URL を入力するだけで、サイト種別（YouTube / ニコニコ / X / 一般サイト）を自動判別し、タイトル・サムネイル等のメタデータを自動取得して登録できる個人データベース。
閲覧は誰でも可能、登録・編集は自分だけ（メール + パスワード認証）。

## プロジェクトの性質

これは**個人学習プロジェクト**。

- テストコードは必須ではない（学習目的で書くことはある）
- リファクタや再設計を恐れない
- Claude は批評役・補助役。過剰な防御コードや「念のための」エラーハンドリングは求めない

## 技術スタック

- **フレームワーク**: Next.js 16（App Router）
- **言語**: TypeScript（strict mode）
- **スタイリング**: Tailwind CSS v4
- **DB / 認証**: Supabase
- **ホスティング**: Vercel
- **パッケージマネージャ**: pnpm

## コマンド

- `pnpm dev` — 開発サーバー起動
- `pnpm build` — ビルド
- `pnpm lint` — ESLint
- `pnpm type-check` — TypeScript 型チェック (`tsc --noEmit`)

---

## 担当分担

- **Claude**: 実装全般（コンポーネント / API Route / ユーティリティ / スタイリング）、スキーマ変更時の SQL 生成、リファクタ、エラー調査
- **人間**: Supabase ダッシュボード操作（SQL 実行 / RLS / Auth）、Vercel へのデプロイ、設計方針の最終判断

設計・方針は下記の **Kiro SDD ワークフロー** に従う。

---

## Kiro SDD ワークフロー

このプロジェクトは **cc-sdd (gotalab/cc-sdd)** による Spec-Driven Development で開発する。

### 保存場所
- **Steering** (`.kiro/steering/`): プロジェクト全体のルール・アーキテクチャ・規約。project memory として読み込まれる
- **Specs** (`.kiro/specs/`): 個別機能ごとの開発プロセス（requirements / design / tasks）

### 3-phase 承認ワークフロー
**Requirements → Design → Tasks → Implementation** の順で進める。各 phase で**人間レビュー必須**。`-y` フラグは意図的な高速化のときだけ使う。

### Skill 発動原則
`kiro-*` skill が該当する可能性が **1% でもあれば発動する**。「タスクが単純だから」という理由でスキップしない。

### 主要コマンド
- `/kiro-steering` — 既存コードから steering 文書を生成・更新（**既存プロジェクトではまず最初に実行**）
- `/kiro-discovery <idea>` — idea から spec 化方針を判断（単一 spec か複数か不明なとき）
- `/kiro-spec-init <description>` — 新規 spec 初期化
- `/kiro-spec-quick <feature> [--auto]` — 単発 spec の高速モード
- `/kiro-impl <feature>` — TDD で実装
- `/kiro-spec-status <feature>` — 進捗確認

その他の skill（`kiro-validate-*`, `kiro-review`, `kiro-debug`, `kiro-verify-completion` など）はワークフロー内で自動的に呼ばれる。

### 言語設定
英語で思考し、日本語で応答・生成する。spec ファイル（`requirements.md` / `design.md` / `tasks.md` など）は `spec.json` の `language` 設定に従う。

---

## プロジェクトの決めごと

コードを読んでも分からない、仕様上の意図・制約のみ。

### サイト種別
URL ドメインから自動判別。`youtube`, `niconico`, `x`, `website` の 4 種類のみ（判定は `src/lib/utils/site.ts`）。

### X の特殊扱い
- X 投稿はメモ・カテゴリ不要で即登録できる
- トップページには X 以外のエントリのみ表示する

### カテゴリ
固定 6 種: リリック / モーション / ボイロ / website / article / X。
追加・削除は基本的に想定しない。色は `src/lib/constants/categories.ts` を single source of truth として参照する（`style={{}}` は禁止、Tailwind class map で管理）。

### お気に入り / アーカイブ
- `is_favorite` と `is_archived` は**排他**（両方 true にできない。API 側で防ぐ）
- アーカイブされたエントリはトップ / カテゴリ / お気に入りには出ない（`/archives` 専用）

### 認証
- メール + パスワード（Supabase Auth）
- 閲覧は誰でも可、書き込み系は認証ユーザーのみ（RLS で担保）

### メタデータ取得

| 種別 | 方法 |
| ---- | ---- |
| YouTube | oEmbed API |
| X | oEmbed API（HTML 埋め込み） |
| ニコニコ / 一般サイト | OGP パース（cheerio） |

**失敗時の扱い**:
- 取得元への fetch 自体が失敗したら 502 を返して登録させない
- fetch は成功したが OGP が無い等で title / thumbnail が空 → **そのまま登録可**（URL だけの登録は許容）
- サムネイルは**外部 URL をそのまま文字列で保存**する（Supabase Storage にはアップロードしない）

### 画面構成（共通レイアウト）
sticky ヘッダー + 左サイドバー（カテゴリナビ / お気に入り / アーカイブ導線）+ メインカラム。

---

## 画面の目的

| パス | 目的 |
| ---- | ---- |
| `/` | 最近登録したエントリ（X 以外・未アーカイブ）の閲覧、ログイン時は登録 UI |
| `/categories/[id]` | カテゴリ別の一覧（ページネーションあり） |
| `/favorites` | お気に入り一覧 |
| `/archives` | アーカイブ一覧 |
| `/login` | メール + パスワードログイン |

---

## Supabase クライアントの使い分け

- **Server Component / API Route**: `src/lib/supabase/server.ts`（cookie 連携）
- **Client Component**: `src/lib/supabase/client.ts`
- **Middleware（`proxy.ts`、ルート直下）**: `src/lib/supabase/middleware.ts`（セッションリフレッシュ）

RLS で SELECT は全員公開・書き込みは authenticated ロールのみ。

---

## スキーマ / RLS

- テーブル定義・RLS ポリシー: `docs/schema.sql`
- タグ機能（`tags` / `entry_tags`）は**テーブルだけ存在、UI・API 未実装**

---

## 新機能追加時のルール

- 新しいテーブル / カラムを追加するときは `docs/schema.sql` を更新し、RLS を忘れずに設定する
- 新しい API Route は `認証チェック → バリデーション → DB 操作 → エラーハンドリング` の順で書く
- カテゴリ・色の追加や変更は `src/lib/constants/categories.ts` のみを編集（複数箇所に散らさない）
- 動的な色・サイズも Tailwind class map で管理する（`style={{}}` 禁止）
- Server Component をデフォルトにし、クライアント操作が必要な箇所だけ `'use client'`

---

## ルール・規約

- コーディングルール: `.claude/rules/coding.md`
- 振る舞いルール: `.claude/rules/hint.md`
- CSS ルール: `.claude/rules/css.md`（`style={{}}` 禁止、Tailwind のみ）

---

## AI駆動開発（仕様駆動）

新機能や中規模以上の変更は、実装前に設計書を作成してから進める。

### スラッシュコマンド

| コマンド | 用途 |
|---------|------|
| `/design-docs:plan` | 対話形式で 3 ファイル（requirements / design / tasks）を生成 |
| `/design-docs:quick` | 1 ファイルの簡易設計書（小さな変更向け） |
| `/design-docs:start` | カレント設計書から実装を開始 |
| `/design-docs:track` | 進捗確認・更新 |
| `/design-docs:switch` | カレント設計書を切り替え |

### 設計書の保管場所

- `docs/design_docs/YYYYMMDD_{feature_name}/` — 機能ごとの設計書
- `.claude/.current-design-doc` — 現在作業中の設計書パス（自動管理）

### 運用方針

- **中規模以上**（1 時間以上 or 複数ファイル変更）は `/design-docs:plan` を使う
- **小さな修正**（1-2 ファイル）は `/design-docs:quick` で OK
- **バグ修正・typo 修正**は設計書不要
- 設計書は**説明主体 + コードで追える**スタイル。防御的な境界説明は不要
- 新機能の設計前に**必ず既存コードを grep** して重複を防ぐ

---

## パフォーマンス改善（方針）

把握済みの改善ポイント。該当箇所を触った**ついでに直す**方針（専用 PR にはしない）。

- `createClient()` の React `cache()` ラップ
- Server Component 内の `Promise.all` 並列化
- `layout` と `page` での `categories` 重複取得の解消
- `is_archived` / `is_favorite` へのインデックス追加
- `select('*')` をカラム明示へ

詳細: `docs/performance-improvement.md`

---

## 未着手

- **タグ機能**: テーブルだけ存在、UI・API 未実装

---

## 環境変数（`.env.local`）

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
