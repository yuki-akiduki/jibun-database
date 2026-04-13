# Tasks: review_fixes

**Status**: Draft
**Created**: 2026-04-13

## Task Breakdown

### Phase 1: ユーティリティ追加

- [ ] `src/lib/utils/url.ts` を新規作成し、`isPublicHttpUrl` を実装
- [ ] （任意）`src/lib/utils/index.ts` がある場合は re-export に追加

### Phase 2: fetch-meta API の SSRF 対策

- [ ] `src/app/api/fetch-meta/route.ts` の入口 protocol チェックを `isPublicHttpUrl` 呼び出しに置き換え
- [ ] YouTube サムネ URL（oEmbed フォールバック含む）を `isPublicHttpUrl` で検証、NG なら空文字列
- [ ] 一般サイトの `og:image` を `isPublicHttpUrl` で検証、NG なら空文字列

### Phase 3: `/api/categories` のカラム明示化

- [ ] `src/app/api/categories/route.ts` の `select('*')` を `select('id, name, sort_order')` に変更

### Phase 4: MetaPreview の OGP 空時メッセージ

- [ ] `src/components/entry/MetaPreview.tsx` の title 空分岐を追加
- [ ] Tailwind クラスのみで実装（`style={{}}` 禁止を確認）

### Phase 5: 動作確認

- [ ] `pnpm type-check` でエラーなし
- [ ] `pnpm lint` でエラーなし
- [ ] 通常の YouTube / 一般サイト URL で OGP 取得が従来通り動作
- [ ] `http://127.0.0.1/` / `http://localhost/` / `http://10.0.0.1/` を登録しようとすると 400 が返る
- [ ] OGP 空のサイト（例: 何もない静的 HTML）を貼ると MetaPreview に空時メッセージが出る、そのまま登録できる
- [ ] `/api/categories` のレスポンスが `id, name, sort_order` のみ

## 進捗記録

| Phase | Status | 完了日 | メモ |
|-------|--------|--------|------|
| Phase 1 | ✅ Done | - | |
| Phase 2 | ✅ Done | - | |
| Phase 3 | ✅ Done | - | |
| Phase 4 | ✅ Done | - | |
| Phase 5 | 🚧 In Progress | - | type-check / lint は通過。ブラウザ / curl での手動確認は未実施 |

**Status の意味**:
- ✅ Done: 未着手
- 🚧 In Progress: 着手中
- ✅ Done: 完了
- ⏸️ Blocked: ブロック中（メモに理由を記載）

## 完了条件

- [ ] すべての Phase が ✅ になる
- [ ] requirements.md の Success Criteria をすべて満たす
- [ ] 既存の OGP 取得動作が壊れていないことを手動で確認済み
