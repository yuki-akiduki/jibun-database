# Requirements Document

## Project Description (Input)
Server Component の描画が重い問題を解消する。`docs/performance-improvement.md` の調査結果によると、1 ページ表示で次のような非効率が発生している:

1. **`getUser()` 重複呼び出し**: `proxy.ts` / `layout.tsx` / `page.tsx` で 3 回呼ばれ、`createClient()` が毎回新しいクライアントを生成しているため React の request dedup が効かない
2. **`categories` 二重取得**: layout と page で同じ `categories` クエリを実行
3. **直列 await**: トップページだけで 5〜6 回の round trip が逐次実行されている（Supabase が遠いリージョンだと 800〜1200ms 消費）
4. **インデックス不足**: `is_archived` / `is_favorite` にインデックスが無く、全ページで WHERE 句に使われている
5. **`select('*')` 過多**: 使わないカラム（特に `description` 等の重いカラム）まで毎回転送

### 対応方針
- 自分側: `createClient()` の `cache()` ラップ / `Promise.all` 並列化 / `categories` fetch 共通化 / `select` カラム明示
- 人間側: Supabase SQL Editor で `is_archived` / `is_favorite` 向けインデックス追加

### ゴール
- 体感で「速くなった」とわかるレベルまで改善する（具体的な数値目標は設けない）
- 既存の機能・RLS・認証フローを壊さない
- Server Component をデフォルトにする方針は維持したまま改善する

## Introduction
`jibun database` は現状、1 ページ表示ごとに Supabase への重複した認証情報取得・共通データ取得・直列な非同期待ち・フィルタ対象カラムへのインデックス不足・過剰なカラム転送が重なって、ページ描画が体感で遅いという問題を抱えている。本要件は、既存の Next.js 16 App Router (Server Component first) アーキテクチャと RLS・認証フローを壊さずに、1 ページ描画あたりの冗長なネットワーク往復とペイロードを削減し、体感速度を改善することを目的とする。

## Boundary Context
- **In scope**:
  - Server Component のデータ取得パターン改善（認証情報・`categories`・`entries` 取得の重複排除と並列化）
  - `entries` 一覧クエリの SELECT カラム明示化
  - `is_archived` / `is_favorite` への DB インデックス追加
  - `docs/schema.sql` へのインデックス定義反映
- **Out of scope**:
  - Client Component の再設計・状態管理の刷新
  - Supabase 以外のキャッシュ層の導入（Redis / Vercel KV など）
  - Supabase リージョン変更や別 DB への移行
  - 画像配信・CDN・フロント bundle の最適化
  - 具体的な数値目標（TTFB xx ms 以下など）の達成コミット
  - タグ機能（`tags` / `entry_tags`）に関するクエリ最適化（UI 未実装のため対象外）
- **Adjacent expectations**:
  - インデックス追加の SQL 実行は人間側が Supabase ダッシュボード（SQL Editor）で行う。本機能は SQL 文とその適用手順をドキュメント内に提示するところまでを負う
  - `docs/schema.sql` はスキーマの single source of truth として、本機能の範囲で追加したインデックスを反映する
  - middleware (`proxy.ts`) によるセッションリフレッシュは今回の重複排除の対象外（Next.js 16 の proxy は独立したリクエストコンテキストで走るため）

## Requirements

### Requirement 1: 認証情報取得の重複排除
**Objective:** As a 閲覧ユーザー, I want 1 ページ開くたびに認証チェックが何度も走らないこと, so that ページの初期描画が冗長な待ち時間なく速く返ってくる

#### Acceptance Criteria
1. When ユーザーが任意のページを開く, the ジブンデータベース shall 同一リクエスト内で Server Component から発生する Supabase Auth への認証情報取得を最大 1 回に集約する
2. Where middleware (`proxy.ts`) によるセッションリフレッシュが走る場合, the ジブンデータベース shall middleware 由来の認証情報取得を上記集約の対象外として扱う
3. The ジブンデータベース shall 認証情報取得の集約前後でログイン状態の判定結果および UI の表示（ログイン UI の出し分け等）が変わらないことを保証する

### Requirement 2: 共通データ（categories）の重複取得排除
**Objective:** As a 閲覧ユーザー, I want サイドバーと本文で同じカテゴリ一覧を何度も取り直さないこと, so that 同一ページ内で同じデータの転送が繰り返されず表示が速い

#### Acceptance Criteria
1. When layout と page が同一リクエスト内で `categories` データを必要とする, the ジブンデータベース shall `categories` のデータ取得を最大 1 回に集約する
2. The ジブンデータベース shall `categories` の重複取得排除の前後でサイドバーおよび各ページのカテゴリ表示順・内容・フィルタ挙動が変わらないことを保証する

### Requirement 3: Server Component 内のデータ取得の並列化
**Objective:** As a 閲覧ユーザー, I want 独立したデータの取得が順番待ちせず同時に走ること, so that 取得完了までの合計時間が短くなる

#### Acceptance Criteria
1. When 1 つの Server Component が互いに依存しない複数のデータ（例: 認証情報・`entries`・`categories`）を必要とする, the ジブンデータベース shall それらの取得を直列ではなく並列に実行する
2. If 取得結果の一つが他の取得結果に依存する（順序制約がある）, then the ジブンデータベース shall 当該依存のあるペアについては直列実行を許容する
3. The ジブンデータベース shall 並列化の前後で各ページの表示内容（並び順・フィルタ結果・件数）が変わらないことを保証する

### Requirement 4: 応答ペイロードの最小化
**Objective:** As a 閲覧ユーザー, I want 一覧表示に使わない重いカラムが転送されてこないこと, so that 一覧ページの転送量が減って表示が速くなる

#### Acceptance Criteria
1. When `entries` の一覧表示クエリが実行される, the ジブンデータベース shall 一覧表示に必要なカラムのみを SELECT する（`select('*')` を避ける）
2. The ジブンデータベース shall SELECT カラム明示化の前後で `EntryCard` 等の既存コンポーネントが必要とするデータが欠落しないことを保証する
3. Where 将来追加される詳細表示など、一覧表示に含まれないカラムが必要になる画面が存在する場合, the ジブンデータベース shall そのカラムを当該画面でのみ追加で取得するアプローチを許容する

### Requirement 5: フィルタ対象カラムへのインデックス整備
**Objective:** As a 運用者, I want 全ページで WHERE 句に使われているカラムに DB インデックスが張られていること, so that データ件数が増えた後もクエリ性能が劣化しない

#### Acceptance Criteria
1. The ジブンデータベース shall `entries` テーブルの `is_archived` および `is_favorite` カラムに対して、フィルタクエリで利用可能な DB インデックスを持つ
2. The ジブンデータベース shall 追加したインデックス定義を `docs/schema.sql` に反映する
3. When 人間側がインデックスを本番環境に適用する, the ジブンデータベース shall 実行すべき SQL 文と適用手順を `docs/` 配下または spec 内で提示する
4. The ジブンデータベース shall インデックス追加の前後で該当カラムを使ったクエリの結果集合（件数・並び順）が変わらないことを保証する

### Requirement 6: 既存機能・RLS・認証フローの維持（リグレッション防止）
**Objective:** As a 閲覧ユーザーおよび運用者, I want 速くなっても今まで動いていたものが壊れないこと, so that 安心して改善を受け入れられる

#### Acceptance Criteria
1. The ジブンデータベース shall 改善作業の前後で、トップ (`/`)・カテゴリ別 (`/categories/[id]`)・お気に入り (`/favorites`)・アーカイブ (`/archives`)・ログイン (`/login`) の表示内容および操作結果が変わらないことを保証する
2. The ジブンデータベース shall 改善作業の前後で、認証状態（ログイン中 / 未ログイン）に応じた UI 分岐（登録 UI の表示・編集操作の可否）が変わらないことを保証する
3. The ジブンデータベース shall 改善作業の前後で、RLS による書き込み権限の挙動（未認証ユーザーの INSERT/UPDATE/DELETE 拒否）が変わらないことを保証する
4. The ジブンデータベース shall 改善作業の前後で、X 投稿の即登録フロー・お気に入り / アーカイブの排他制御・メタデータ取得（oEmbed / OGP）失敗時の 502 応答など、既存の挙動が変わらないことを保証する
