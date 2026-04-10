# Research & Design Decisions — performance-optimization

## Summary
- **Feature**: `performance-optimization`
- **Discovery Scope**: Extension (brownfield、既存 Next.js 16 App Router のデータ取得層に対する改善)
- **Key Findings**:
  - `createClient()` は毎回新しい Supabase クライアントを生成しており、React の request 単位 dedup が効いていない
  - `getUser()` は layout + 各 page（`/`, `/categories/[id]`, `/favorites`, `/archives`）で計 5 回呼ばれている（`/login` 除く）
  - `categories` fetch も layout + 各 page で計 5 回、同一クエリで重複している
  - 全ての list クエリが `select('*')` を使用しているが、`Entry` 型は `description` / `author` を含まないため、それらのカラムはネットワークを無駄に占有している
  - `is_archived` / `is_favorite` は全リストで WHERE 句に登場するがインデックスが無い

## Research Log

### 現状のデータ取得パターン（コードベース調査）

- **Context**: Requirements で挙げた 5 つの問題が現行コードでどう現れているかを確認
- **Sources Consulted**:
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/middleware.ts`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `src/app/categories/[id]/page.tsx`
  - `src/app/favorites/page.tsx`
  - `src/app/archives/page.tsx`
  - `src/app/login/page.tsx`
  - `docs/schema.sql`
  - `src/lib/types/entry.ts`
  - `src/components/entry/EntryList.tsx` / `EntryCard.tsx`
  - `package.json` (Next.js 16.1.6 / React 19.2.3 / @supabase/ssr 0.8)
- **Findings**:
  - `createClient()` は素の `async () => { ... }` で `cache()` ラップなし
  - layout と各 page の両方で `const supabase = await createClient()` → `await supabase.auth.getUser()` を独立して実行している（直列、重複あり）
  - layout と各 page の両方で `supabase.from('categories').select('*').order('sort_order')` を独立実行している
  - `/categories/[id]/page.tsx` では `generateMetadata()` でも追加で `categories` を fetch している
  - `select('*')` の各 list クエリは `description` / `author` カラムを不必要に転送
  - `EntryCard` で参照されるカラムは: `id`, `url`, `title`, `thumbnail_url`, `site_type`, `memo`, `category_id`, `is_favorite`, `is_archived`, `created_at`（＋ `updated_at` は型にはあるが UI 未参照）
  - `docs/schema.sql` に定義されているインデックスは `site_type` / `category_id` / `created_at` の 3 つのみ
- **Implications**:
  - `createClient()` を `cache()` 化するだけではダメで、`getUser()` 自体も `cache()` ラップされた helper 経由で呼ぶ必要がある（`@supabase/ssr` は `getUser` 自体の memoization を自動では行わない）
  - `categories` も同じ戦略（`cache()` ラップの helper 化）で dedup できる
  - list クエリの SELECT カラムを `Entry` 型に合わせて明示化するだけで、型側は一切変更不要
  - `description` / `author` は DB に存在するが、現状 UI では使われていない（将来の詳細画面で必要になったらそこだけ追加取得）

### React `cache()` の適用範囲

- **Context**: `cache()` は request 単位でしか効かない。middleware は別 request context で走るため対象外
- **Sources Consulted**: React 19 / Next.js 16 ドキュメント（既知の公式仕様）
- **Findings**:
  - `cache(fn)` は React Server Components 内の同一 request 中で `fn` の結果を memoize する
  - Next.js middleware (`proxy.ts`) は Server Component レンダリングとは別の request context で走るので dedup 対象外（これは仕様）
- **Implications**:
  - Requirement 1 の acceptance criterion 2（middleware は除外）と整合する
  - middleware 側でのセッションリフレッシュは現状維持

### インデックス戦略の選択

- **Context**: `docs/performance-improvement.md` では単一カラムインデックス + 複合インデックスの両方が候補として挙がっていた
- **Findings**:
  - 現状のデータ量では体感差はほぼゼロ（将来のための予防策）
  - 複合インデックス（例: `(is_archived, created_at DESC)`）や部分インデックス（`WHERE is_archived = false`）のほうが理論的には効果が高い場面もあるが、Supabase (Postgres) での実測無しには最適化しすぎ
  - 個人プロジェクトの方針として「シンプルに始めて、必要になったら追加」が妥当
- **Implications**:
  - まず単一カラムインデックス（`is_archived` / `is_favorite`）だけを追加する
  - 複合・部分インデックスは本 spec の scope に含めず、将来の観察結果次第で追加する

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A. `createClient()` を `cache()` ラップのみ | Supabase クライアントを request 単位で 1 個に | 最小変更 | `getUser()` 自体は dedup されない。categories は別途対処必要 | 不十分 |
| B. `createClient()` + `getUser()` + `getCategories()` を全部 helper 化 | Server Component から呼ぶ fetch ヘルパー層を設けて `cache()` でラップ | dedup が確実に効く。並列化との組み合わせが自然 | helper ファイルが増える | **採用** |
| C. layout → page に props 経由で user/categories を渡す | React Context 的な書き方 | fetch 回数は減らせる | Next.js App Router では layout と page の props 連携不可 | 不採用（技術的に不可） |

## Design Decisions

### Decision: `getUser()` と `getCategories()` を `cache()` ラップの helper にする

- **Context**: 1 リクエスト内で layout と page が同じ認証情報・カテゴリ一覧を必要とする。layout → page の props 渡しは App Router では不可
- **Alternatives Considered**:
  1. `createClient()` だけを `cache()` ラップ → `getUser()` は依然として毎回呼ばれる
  2. layout 側で取得して props で渡す → App Router 構造上 layout の children は RSC なので直接 props を渡せない
  3. Helper 関数（`getUser()` / `getCategories()`）自体を `cache()` ラップ → 呼ぶ側は普通に `await getUser()` するだけ
- **Selected Approach**: 3
- **Rationale**:
  - `@supabase/ssr` は `getUser()` の memoization を自動では行わないので、呼び出し側で dedup する必要がある
  - Helper を介すことで「同じ request 内で何度呼んでも実際の fetch は 1 回」という挙動が確定する
  - `Promise.all` 並列化との組み合わせも自然（内部では cache hit になる）
- **Trade-offs**: helper ファイルが 2 つ増えるが、各ページのコードは短くなるので純粋な追加ではない
- **Follow-up**: 実装後に Network タブで Supabase 呼び出し回数を確認する

### Decision: `createClient()` も併せて `cache()` ラップする

- **Context**: helper 経由で `createClient()` が複数呼ばれるケース（`getUser()` と `getCategories()` が同時に走る等）で、Supabase クライアント自体も再利用したい
- **Selected Approach**: `src/lib/supabase/server.ts` の `createClient` を `cache(async () => { ... })` でラップする
- **Rationale**: helper 内部の `await createClient()` 呼び出しも dedup される。副作用はなく、リグレッションリスクは低い
- **Trade-offs**: なし

### Decision: `ENTRY_LIST_COLUMNS` 定数で SELECT カラムを明示

- **Context**: 4 つの list ページが `select('*')` を使用
- **Alternatives Considered**:
  1. 各ページで個別に SELECT 文字列を書く → ドリフトするリスク
  2. 定数として single source of truth を持つ
- **Selected Approach**: 2。`src/lib/supabase/queries.ts`（または同等の場所）に `ENTRY_LIST_COLUMNS` を 1 つ定義
- **Rationale**: `Entry` 型とカラム文字列を一致させるための中央集約点になる。将来カラム追加/削除時もここ 1 箇所を直せば全ページに反映
- **Trade-offs**: なし

### Decision: インデックスは単一カラム 2 本のみ

- **Context**: 複合・部分インデックスも検討したが、現状のデータ量で効果測定ができない
- **Selected Approach**: `CREATE INDEX idx_entries_is_archived ON entries(is_archived);` と `CREATE INDEX idx_entries_is_favorite ON entries(is_favorite);`
- **Rationale**: シンプルで、`docs/schema.sql` の既存インデックス命名にも合う。`docs/performance-improvement.md` でも第一候補として挙がっていた
- **Trade-offs**: 最適化余地は残るが、観察後に追加する方針で OK
- **Follow-up**: 将来データ量が増えた際、EXPLAIN ANALYZE で確認して複合・部分インデックスを検討

### Decision: API Route は本 spec の scope 外

- **Context**: `src/app/api/entries/route.ts` 等でも `createClient()` / `getUser()` は使われている
- **Selected Approach**: API Route の変更は scope 外（Server Component の render path のみを対象）
- **Rationale**:
  - Requirements の Boundary Context が「Server Component のデータ取得パターン」と明記
  - API Route は別の request per call で、dedup の効果が Server Component ほどでは無い
  - ただし `createClient()` を `cache()` ラップすることによる副作用は API Route にも現れる（1 API call あたり 1 クライアントになる）。これは良い副作用として許容
- **Trade-offs**: API Route 側の consistency が若干損なわれるが、後追いでいつでも適用可能

## Risks & Mitigations

- **Risk 1**: `cache()` ラップによってテストしにくくなる可能性
  - **Mitigation**: 本プロジェクトはテストコード必須ではない方針。手動検証（全画面を開いて表示が変わらないこと）で検証する
- **Risk 2**: `Promise.all` に変えた際、エラー発生時の挙動が変わる（1 つ失敗すると全体が reject）
  - **Mitigation**: 現状は `await` 順番が崩れても最終的には throw するだけなので、`Promise.all` 化してもユーザー体験としては変わらない。Next.js の error boundary 側で handle されている前提
- **Risk 3**: SELECT カラム明示化で、将来カラムを追加した際に一覧画面から欠落する可能性
  - **Mitigation**: `ENTRY_LIST_COLUMNS` を single source of truth として `src/lib/supabase/queries.ts` に集約する。カラム追加時はここだけ更新
- **Risk 4**: インデックス追加作業（人間側）が忘れられると DB とスキーマ定義がズレる
  - **Mitigation**: `docs/schema.sql` を更新しつつ、適用手順を本 spec 内（および対応 task 内）で提示する。追加適用は任意のタイミングで OK（コード側の改善とは非同期で進められる）

## References

- `docs/performance-improvement.md` — 本プロジェクトでの初期調査メモ（本 spec の出発点）
- React 公式 `cache()` API — request 単位の memoization
- Next.js 16 App Router docs — Server Component のデータ取得パターン
- `@supabase/ssr` 0.8 — `createServerClient` の cookie handling とセッション
