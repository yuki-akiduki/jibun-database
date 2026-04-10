# パフォーマンス改善メモ（design doc 下書き）

> 会話で出てきた調査結果と、これから design doc を書くための下書き。
> ここを元に仕様駆動で `design.md` を整理していく。

---

## 背景

サイト全体の表示が重く、Supabase のレスポンスが遅いように感じられる、という体感の問題から調査開始。

---

## 現状分析

### 問題 1: `getUser()` の重複呼び出し

1ページ表示で `supabase.auth.getUser()` が **3回** 呼ばれている。

| 場所 | 呼び出し | 目的 |
|------|---------|------|
| `proxy.ts` (middleware) | `getUser()` | セッションリフレッシュ |
| `layout.tsx` | `getUser()` | ログイン状態判定 |
| `page.tsx` | `getUser()` | ログイン状態判定 |

`createClient()` が毎回新しい Supabase クライアントを生成しているため、
React の request dedup（`cache()`）が効かず、それぞれ独立した HTTP リクエストが飛んでいる。

### 問題 2: `categories` の二重取得

| 場所 | クエリ |
|------|--------|
| `layout.tsx` | `categories.select('*').order('sort_order')` |
| `page.tsx` / `categories/[id]/page.tsx` 等 | 同じクエリを再実行 |

layout で取得したカテゴリを page に渡す手段が無いので、各ページで改めて取得し直している。

### 問題 3: 全ページで sequential await

例: トップページ `/` の Server Component の流れ

```ts
// layout.tsx — 直列で 2 round trip
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();       // RT 1
const { data: categories } = await supabase.from('categories')  // RT 2
  .select('*').order('sort_order');

// page.tsx — さらに直列で 3 round trip
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();       // RT 3
const { data: entries } = await supabase.from('entries')        // RT 4
  .select('*').neq('site_type', 'x').eq('is_archived', false)
  .order('created_at', { ascending: false }).limit(20);
const { data: categories } = await supabase.from('categories')  // RT 5
  .select('*').order('sort_order');
```

合計 **5〜6 回の直列 round trip**。
Supabase のリージョンが遠い場合（例: US East）1回あたり 150〜200ms とすると、
**データ取得だけで 800〜1200ms** 消費している計算。

### 問題 4: インデックス不足

`CLAUDE.md` のスキーマ定義にあるインデックス:
- `idx_entries_site_type`
- `idx_entries_category`
- `idx_entries_created`

ほぼ全ページで `.eq('is_archived', false)` / `.eq('is_favorite', true)` をフィルタしているが、
`is_archived` / `is_favorite` にはインデックスが無い。
テーブルが大きくなるとシーケンシャルスキャンの影響が出てくる。

### 問題 5: `select('*')` 過多

各クエリで `SELECT *` を使っているので、使わないカラムまで転送している。
特に `entries` は `memo` や `description` を含むため、行あたりのペイロードが大きくなりがち。

---

## 改善案

優先度順。

### 1. `createClient()` を React `cache()` でラップ

```ts
import { cache } from 'react';
// ...
export const createClient = cache(async () => { ... });
```

同一リクエスト内で layout / page が呼んでも Supabase クライアントが使い回され、
`getUser()` も `@supabase/ssr` のキャッシュで dedup される。

**効果**: `getUser()` の重複 2回分が消える（middleware の分は残る）

### 2. 各 Server Component で `Promise.all` で並列化

```ts
const supabase = await createClient();
const [
  { data: { user } },
  { data: entries },
  { data: categories },
] = await Promise.all([
  supabase.auth.getUser(),
  supabase.from('entries').select(...)...,
  supabase.from('categories').select(...).order('sort_order'),
]);
```

**効果**: 各ページ内の round trip を `max(rt)` に短縮。体感ではここが一番大きい。

### 3. layout で取得した categories を page で再利用する

選択肢:
- **A.** layout での categories 取得をやめ、各 page で取る（現状）+ dedup キャッシュで対応
- **B.** categories を React `cache()` ラップされた fetch 関数にして、layout/page 両方から呼んでも1回にする
- **C.** サイドバーだけ別途 Client Component + SWR などで取得

→ **B** が簡単で副作用が少なそう。

### 4. DB インデックス追加

Supabase SQL Editor で実行:

```sql
CREATE INDEX idx_entries_archived ON entries(is_archived);
CREATE INDEX idx_entries_favorite ON entries(is_favorite);
-- 複合インデックスも検討
CREATE INDEX idx_entries_archived_created ON entries(is_archived, created_at DESC);
```

**効果**: 現状のデータ量では体感差は無いが、将来への予防策。

### 5. `select('*')` を明示カラムに絞る

`entries` の一覧取得で必要なのは:
`id, url, site_type, title, thumbnail_url, author, category_id, memo, is_favorite, is_archived, created_at`
程度。`description` など重いカラムは詳細画面を作ったときに追加で取る、という戦略も取れる。

**効果**: ペイロード削減。round trip 数は減らないが、転送量が減る。

---

## 対応範囲の分担

| 項目 | 対応者 |
|------|--------|
| 1. `createClient()` を `cache()` ラップ | Claude（コード修正） |
| 2. `Promise.all` 並列化 | Claude（コード修正） |
| 3. categories の重複解消 | Claude（コード修正） |
| 4. インデックス追加 | 自分（Supabase ダッシュボード / SQL Editor） |
| 5. `select('*')` 削減 | Claude（コード修正）|

---

## 目標値

未定。仮置き:
- トップページの TTFB を現状の **半分以下** にする
- もしくは、本番で **300ms 以下**（Supabase 東京リージョン前提）

---

## 実施順序（案）

1. 計測基盤を整える（本番 TTFB を簡単に見れるようにする）
2. 1 + 2 + 3 をまとめて対応（コード側の改善）
3. 再計測して効果確認
4. 必要なら 4（インデックス）と 5（カラム絞り）に進む

---

## TODO（情報待ち）

- [ ] Supabase のリージョン確認（`.env.local` の URL のサブドメインから類推可能）
- [ ] 本番 TTFB の実測値（Chrome DevTools Network → Doc → Timing）
- [ ] 目標値の正式決定

※ 上記が無くてもコード側の構造的問題は明らかなので、先に着手することは可能。
