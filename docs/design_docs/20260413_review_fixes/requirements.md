# Requirements: review_fixes

**Status**: Draft
**Created**: 2026-04-13

## What（何を作るか）

レビューで検出した改善点をまとめて対応する。

1. OGP fetch の SSRF 対策（private IP / localhost / link-local 等への fetch を拒否）
2. `thumbnail_url` の scheme 検証（`http(s)://` のみ許可）
3. `/api/categories` の `select('*')` をカラム明示化
4. `MetaPreview` に OGP 空時のフィードバック表示を追加

## Why（なぜ必要か）

セキュリティ懸念（SSRF / 不正 scheme 混入）を早期に潰すため、および CLAUDE.md § パフォーマンス改善の積み残し（`select('*')`）を同じ PR で片付けたい。併せて、メタデータ取得に失敗した際にユーザーに何も表示されない UX を改善する。

## Related（既存の関連資産）

### 再利用・参照する既存コード

- `src/lib/supabase/categories.ts` — `select('id, name')` とカラム明示のパターン。`/api/categories` にも踏襲する
- `src/app/api/fetch-meta/route.ts:21-27` — 既存の URL parse / protocol チェック。SSRF チェックはこの直後に追加する
- `src/components/entry/MetaPreview.tsx` — OGP 空時の UI 追加対象

### 新規作成の正当化

- `src/lib/utils/url.ts`（仮）: SSRF 判定ユーティリティ `isPublicHttpUrl(url)` を新規作成。`fetch-meta` API 内にインライン展開すると肥大化するため切り出す。また、将来 thumbnail の download-proxy を作る際にも再利用できる。

### 参考ドキュメント

- `docs/performance-improvement.md` — `select('*')` 明示化の背景
- CLAUDE.md § メタデータ取得 — fetch 失敗時 502 / 空でも登録可の仕様

## Functional Requirements（機能要件）

- [ ] `fetch-meta` API が `127.0.0.1` / `localhost` / `0.0.0.0` / private IP (10.x / 172.16-31.x / 192.168.x) / link-local (169.254.x) / IPv6 のループバック・private を 400 で拒否
- [ ] `fetch-meta` API が OGP の `og:image` で取得した URL の scheme を検証し、`http(s)://` 以外は空文字列として返す
- [ ] YouTube の thumbnail_url（oEmbed フォールバック）も scheme 検証
- [ ] `/api/categories` が `select('*')` ではなく `select('id, name, sort_order')` を返す
- [ ] `MetaPreview` が `meta.title` 空・`meta.thumbnail_url` 空の状態のとき、「メタデータを取得できませんでした。このまま URL のみで登録できます」旨のメッセージを表示
- [ ] X 投稿（`site_type === 'x'` かつ `html` あり）の場合は従来通り埋め込みを表示する

## Non-Functional Requirements（非機能要件）

- [ ] 既存の OGP 取得動作（正常系）を壊さない
- [ ] `pnpm type-check` でエラーなし
- [ ] CSS は Tailwind のみ（`style={{}}` 禁止）
- [ ] Supabase RLS を前提とした認証の書き込みチェックは維持
- [ ] SSRF ユーティリティはネットワーク I/O を行わない（ホスト名解析のみ、DNS は引かない）

## Success Criteria（成功基準）

- [ ] `pnpm type-check` 通過
- [ ] `curl -X POST /api/fetch-meta -d '{"url":"http://127.0.0.1/"}'` が 400 を返す
- [ ] 通常の OGP 取得（YouTube / 一般サイト）が従来通り動く
- [ ] OGP 空の URL を貼ると MetaPreview にメッセージが出る、そのまま登録できる
- [ ] `/api/categories` レスポンスに `color` 等の余分なカラムが含まれない

## Out of Scope（やらないこと）

- DNS rebinding の完全対策（TOCTOU を塞ぐには fetch 時の IP 解決と再チェックが必要。今回はホスト名レベルのブロックのみ）
- タグ機能の残骸（tags / entry_tags テーブル）の削除
- `EntryCardMenu` の disabled tooltip 追加
- `thumbnail_url` の実在性チェック（HEAD リクエスト等）
