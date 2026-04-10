# Implementation Plan

## 1. Foundation — Supabase Server Client と entry list 用の共有定数を整える

- [x] 1.1 Supabase Server Client を request-scoped で共有するよう変更する
  - 現状、同一リクエスト内で Server Client ファクトリが呼び出されるたびに新しいクライアントを生成している状態を解消する
  - React の request-scoped memoization で 1 リクエスト = 1 クライアントに集約する
  - 呼び出し側の署名（`Promise<SupabaseClient>`）は変更しない（既存の import / await パターンをそのまま動かす）
  - 型チェック (`pnpm type-check`) と lint (`pnpm lint`) が通り、既存の Server Component / API Route / middleware 呼び出しがすべて破綻しないこと
  - _Requirements: 1.1, 2.1, 3.1_
  - _Boundary: Supabase Server Client factory_

- [x] 1.2 (P) entry 一覧取得用の SELECT カラムを single source of truth として定義する
  - list 表示で必要なカラムを 1 つの定数として集約する（将来カラムを追加削除するときにここだけ直せば全ページに反映される状態にする）
  - `Entry` 型 (`src/lib/types/entry.ts`) と完全一致させ、`description` / `author` は含めない
  - この定数を import すれば、Supabase JS client の `.select()` にそのまま渡せる形式（カンマ区切り文字列）で export する
  - 定数を含む新規モジュールが `@/lib/supabase/...` パスから import 可能で、`Entry` 型のフィールドと過不足なく一致することを目視で確認できる
  - _Requirements: 4.1, 4.2, 4.3_
  - _Boundary: Entry list query columns constant_

## 2. Core — request-scoped cached fetch helper を追加する

- [x] 2.1 (P) 認証情報取得を request-scoped cached helper として提供する
  - 同一リクエスト内で何度呼んでも実際の Supabase Auth 呼び出しが最大 1 回に集約される helper を追加する
  - 戻り値は従来と同じく `User` オブジェクトまたは `null`（ログイン / 未ログインの判定ロジックが維持される）
  - helper は Server Component 専用とし、`'use client'` は持たない
  - middleware (`proxy.ts` 経由のセッションリフレッシュ) には影響を与えない（別 request context であることを前提）
  - helper を経由して User を取得でき、同一 render 内で複数回呼んでも Network タブで認証エンドポイントへの呼び出しが 1 回しか走らないこと
  - _Requirements: 1.1, 1.3_
  - _Boundary: Auth fetch helper_

- [x] 2.2 (P) `categories` 取得を request-scoped cached helper として提供する
  - 同一リクエスト内で何度呼んでも実際の `categories` SELECT が最大 1 回に集約される helper を追加する
  - 戻り値は既存の `Categories` 型（`{ id, name }[]`）に合わせる
  - `sort_order` 昇順でソートされた配列を返し、null は空配列にフォールバックする
  - 既存の `Categories` 型に合わせて、必要最小カラムのみ SELECT する（`select('*')` は使わない）
  - helper を経由して categories を取得でき、同一 render 内で複数回呼んでも Network タブで categories エンドポイントへの呼び出しが 1 回しか走らないこと
  - _Requirements: 2.1, 2.2_
  - _Boundary: Categories fetch helper_

## 3. Integration — Server Component ページを helper 経由に置換する

- [x] 3.1 共通レイアウトの認証・カテゴリ取得を helper 経由 + 並列化に置換する
  - 直列の `createClient → getUser → categories.select` を、`Promise.all` による並列実行 + helper 呼び出しに書き換える
  - Header の `isLoggedIn` 判定、Sidebar の CategoryNav 表示、LogoutButton の表示条件はすべて維持する
  - 並列化によって表示結果（カテゴリの並び順・ログイン判定）が変わらないことを担保する
  - 置換後にログイン / 未ログインの状態切り替えで Header / Sidebar の表示が変わらず、カテゴリの並び順も同一であることを手動で確認できる
  - _Requirements: 1.1, 2.1, 3.1, 3.3, 6.1, 6.2_
  - _Boundary: Root layout_

- [x] 3.2 (P) トップページのデータ取得を helper + 並列化 + SELECT 明示に置換する
  - 直列の `createClient → getUser → entries.select('*') → categories.select('*')` を、`Promise.all` 並列 + helper + `ENTRY_LIST_COLUMNS` 使用に書き換える
  - `entries` の既存フィルタ（X 投稿を除外・未アーカイブのみ・作成日時降順・上限 20）は完全に維持する
  - 並列化前後で表示される件数・並び順が一致することを担保する
  - 未ログイン時に EntryForm が表示されないこと、ログイン時に EntryForm が表示されること、一覧の並び順と件数が改善前と一致することを手動で確認できる
  - _Requirements: 1.1, 2.1, 3.1, 3.3, 4.1, 6.1_
  - _Boundary: Top page_

- [x] 3.3 (P) カテゴリ別ページと metadata 生成を helper + 部分並列 + SELECT 明示に置換する
  - 本体は `getUser` / `getCategories` を `Promise.all` で並列取得し、その結果からカテゴリ存在チェック → `entries` fetch の順に進める（カテゴリ → entries の順序制約は残してよい）
  - `generateMetadata` からも同じ helper を呼び、categories の fetch 回数が増えないようにする（同一 request 内の cache 共有を活かす）
  - `entries` クエリの SELECT は `ENTRY_LIST_COLUMNS` に置換する（`count: 'exact'` とページネーション range は維持）
  - 並列化と順序制約の組み合わせ前後で表示件数・ページネーションが一致することを担保する
  - 存在しないカテゴリ id で 404、既存ページネーションの挙動、件数バッジの値が改善前と一致することを手動で確認できる
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 4.1, 6.1_
  - _Boundary: Category detail page_

- [x] 3.4 (P) お気に入りページのデータ取得を helper + 並列化 + SELECT 明示に置換する
  - `Promise.all` 並列 + helper + `ENTRY_LIST_COLUMNS` 使用に書き換える
  - `entries` の既存フィルタ（`is_favorite = true` かつ `is_archived = false`・作成日時降順）は完全に維持する
  - 並列化前後で表示件数・並び順が一致することを担保する
  - お気に入り一覧の件数と並び順が改善前と一致し、アーカイブ済みのエントリが表示されないことを手動で確認できる
  - _Requirements: 1.1, 2.1, 3.1, 3.3, 4.1, 6.1_
  - _Boundary: Favorites page_

- [x] 3.5 (P) アーカイブページのデータ取得を helper + 並列化 + SELECT 明示に置換する
  - `Promise.all` 並列 + helper + `ENTRY_LIST_COLUMNS` 使用に書き換える
  - `entries` の既存フィルタ（`is_archived = true`・作成日時降順）は完全に維持する
  - 並列化前後で表示件数・並び順が一致することを担保する
  - アーカイブ一覧の件数と並び順が改善前と一致することを手動で確認できる
  - _Requirements: 1.1, 2.1, 3.1, 3.3, 4.1, 6.1_
  - _Boundary: Archives page_

## 4. Database — フィルタ対象カラムへのインデックスを整備する

- [x] 4.1 スキーマ定義ファイルに新しいインデックス定義を追記する
  - `docs/schema.sql` の既存 index 定義（`idx_entries_site_type` / `idx_entries_category` / `idx_entries_created`）の直後に、以下 2 つのインデックス定義を追加する:
    - `CREATE INDEX idx_entries_is_archived ON entries(is_archived);`
    - `CREATE INDEX idx_entries_is_favorite ON entries(is_favorite);`
  - 既存のテーブル定義・RLS ポリシー定義は一切変更しない
  - `docs/schema.sql` を開くと上記 2 つの index 定義が追記されており、既存の index 命名規則に一致していることを確認できる
  - _Requirements: 5.1, 5.2_
  - _Boundary: Schema definition file_

- [x] 4.2 Supabase SQL Editor でインデックスを本番適用する（人間側作業）
  - 4.1 で追記した `CREATE INDEX` 2 本を Supabase ダッシュボードの SQL Editor で実行する
  - 適用前後で `entries` に対する全ページのクエリ結果（件数・並び順）が変わらないことを spot check する（トップ / カテゴリ別 / お気に入り / アーカイブ を各 1 回開く）
  - Supabase ダッシュボードの Database → Indexes タブ、または `pg_indexes` を参照するクエリで `idx_entries_is_archived` / `idx_entries_is_favorite` が存在することを確認できる
  - _Requirements: 5.1, 5.3, 5.4_
  - _Boundary: Supabase database (external, human-operated)_

## 5. Validation — 回帰と効果を手動検証する

- [ ] 5.1 全画面の機能リグレッションを確認する
  - 未ログインと認証済みの 2 状態で、`/` / `/categories/[id]` / `/favorites` / `/archives` / `/login` を巡回する
  - 各画面で、表示内容・件数・並び順・カテゴリバッジ・サムネイル表示・X 埋め込み・メモ表示が改善前と同一であることを確認する
  - ログイン時に EntryForm / EntryCardMenu（編集・お気に入り・アーカイブ・削除）がすべて従来通り操作できることを確認する
  - お気に入り / アーカイブの排他（両方 true にならない）が維持されていることを確認する
  - 並列化前後で各ページの結果集合（件数・並び順）が完全に一致することも合わせて確認する
  - 全画面で見た目・機能のリグレッションが一切ないことを目視と操作で確認できる
  - _Requirements: 3.3, 6.1, 6.2, 6.3, 6.4_

- [ ] 5.2 認証・categories の dedup 効果を Network タブで確認する
  - Chrome DevTools の Network タブを開いたままトップページ (`/`) をハードリロードする
  - Supabase REST (`auth/v1/user`) への呼び出しが、Server Component 由来で 1 回以下（middleware 由来は別カウント）になっていることを確認する
  - Supabase REST (`rest/v1/categories`) への呼び出しが 1 回以下になっていることを確認する
  - 同じ計測を `/categories/[id]` / `/favorites` / `/archives` でも行い、いずれでも重複取得が解消されていることを確認する
  - dedup された回数を改善前の回数と比較して、Server Component 由来の重複が消えたことを目視で確認できる
  - _Requirements: 1.1, 1.2, 2.1, 3.1_

- [ ] 5.3 entries の SELECT カラム絞り込みを Network タブで確認する
  - DevTools Network で `rest/v1/entries` への GET を選び、response body を開く
  - `description` / `author` が含まれていないこと、`Entry` 型のフィールドだけが返ってきていることを確認する
  - トップ / カテゴリ別 / お気に入り / アーカイブ の各ページで同様に確認する
  - 全 list ページの entries レスポンスに `description` / `author` が含まれていないことを目視で確認できる
  - _Requirements: 4.1, 4.2_

- [ ] 5.4 インデックス適用後の全ページ挙動を確認する
  - 4.2 の SQL 適用後、再度 `/` / `/categories/[id]` / `/favorites` / `/archives` を巡回する
  - 各ページの件数・並び順・ページネーションが 5.1 の結果と一致することを確認する
  - エラーメッセージや欠落したエントリがないことを確認する
  - インデックス適用前後で全画面の表示結果が一致することを確認できる
  - _Requirements: 5.4, 6.1_
