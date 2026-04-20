# Tasks: entry_detail_modal

**Status**: Draft
**Created**: 2026-04-20

## Task Breakdown

### Phase 1: 型と atom の準備

- [ ] `src/lib/types/entry.ts` を確認し、`Entry` 型に `category` がネストされているか / `categoryName` を props で渡すべきかを判断
- [ ] `src/lib/jotai/atoms.ts` に `entryDetailAtom: atom<Entry | null>(null)` を追加
- [ ] `pnpm type-check` で型エラーがないことを確認

### Phase 2: モーダル内容コンポーネント

- [ ] `src/components/entry/EntryDetailModalContent.tsx` を新規作成
  - サムネイル（あれば）/ タイトル（外部リンク）/ URL / カテゴリ / 日付 / メモ全文
  - メモ領域は `max-h-[40vh] overflow-y-auto` で内部スクロール
- [ ] Phase 1 の判断に合わせて props 設計（`entry` のみ / `entry` + `categoryName` の両案どちらでも可）

### Phase 3: モーダル Root とラッパーへのマウント

- [ ] `src/components/entry/EntryDetailModalRoot.tsx` を新規作成
  - `useAtom(entryDetailAtom)` で subscribe
  - `<Modal>` を開閉、`<EntryDetailModalContent>` を描画
- [ ] `src/components/entry/EntryList.tsx` の末尾に `<EntryDetailModalRoot />` を追加（Fragment ラップが必要なら調整）
- [ ] `src/components/entry/BulkDeleteSection.tsx` の末尾に `<EntryDetailModalRoot />` を追加
- [ ] `app/layout.tsx` は変更しない（詳細ボタン非対象ページへの不要な JS ロードを防ぐため）

### Phase 4: カード側の変更

- [ ] `src/components/entry/EntryCard.tsx` のメモ領域を右カラムからメインカラム（カテゴリ/日付の下）に移動
- [ ] `max-h-[104px] overflow-y-auto` を廃止し `line-clamp-2` 化
- [ ] `useSetAtom(entryDetailAtom)` を import し setter を取得
- [ ] X 以外のカードブランチに「コメントを読む」ボタンを追加
- [ ] `categoryName` の解決ロジックが `EntryDetailModalContent` の props 設計と整合することを確認

### Phase 5: クリック箇所別アクション（stretched link 化）

- [ ] サムネイルの `<a>` を `<div>` に変更（ネスト anchor 回避）
- [ ] タイトルの `<a>` に `before:absolute before:inset-0 before:content-['']` を追加（stretched link）
- [ ] メモ表示（`<p>`）に `onClick={() => openDetail(...)}`、`relative z-10 cursor-pointer` を付与
- [ ] 「コメントを読む」ボタンのラッパーに `relative z-10`
- [ ] `EntryCardMenu` のラッパーに `relative z-10`

### Phase 6: 動作確認

- [ ] `pnpm type-check` でエラーなし
- [ ] `pnpm lint` で警告なし
- [ ] `/` / `/categories/[id]` / `/favorites` / `/archives` の各ページで以下を確認:
  - サムネイル / タイトル / 空白領域クリック → 外部リンクが新タブで開く
  - メモプレビュークリック → モーダル開く（外部リンクに飛ばない）
  - 「コメントを読む」クリック → モーダル開く
  - ⋮ メニュークリック → ドロップダウン展開（外部リンクに飛ばない）
  - 右クリック / middle-click で「新しいタブで開く」が正常動作
- [ ] `/login` で詳細モーダル関連のコンポーネントがマウントされていないこと（DevTools で確認可）
- [ ] メモが短いケース / 長文ケース両方でモーダル内のスクロール挙動を確認
- [ ] モーダルの開閉: 詳細ボタン / × / Esc / 背景クリック
- [ ] X タイプのカードに詳細ボタン・stretched link が出ていないことを確認
- [ ] PC / SP 両方で表示崩れがないか確認
- [ ] メニュー展開時に兄弟カードより上に浮上する挙動（`has-[[data-menu-open=true]]:z-30`）が維持されていること
- [ ] 既存機能（編集モーダル / 削除 / お気に入り / アーカイブ）に影響がないことを確認

## 進捗記録

| Phase | Status | 完了日 | メモ |
|-------|--------|--------|------|
| Phase 1 | ✅ Done | 2026-04-20 | `Entry` は `category_id` のみ。`categoryName` を payload で渡す方針に決定 |
| Phase 2 | ✅ Done | 2026-04-20 | `EntryDetailModalContent` を `entry` + `categoryName` で受ける形に |
| Phase 3 | ✅ Done | 2026-04-20 | `EntryList` / `BulkDeleteSection` 末尾にマウント |
| Phase 4 | ✅ Done | 2026-04-20 | メモをメインカラム下部に移動 + line-clamp + 「コメントを読む」ボタン |
| Phase 5 | ✅ Done | 2026-04-20 | stretched link 化（サムネ div 化 / タイトル `before:inset-0` / メモ button 化 / z-10 整理） |
| Phase 6 | 🚧 In Progress | - | type-check / lint 済み。ブラウザ動作確認は人間側で |

**Status の意味**:
- 🔲 Pending: 未着手
- 🚧 In Progress: 着手中
- ✅ Done: 完了
- ⏸️ Blocked: ブロック中（メモに理由を記載）

## 完了条件

- [ ] すべての Phase が ✅ になる
- [ ] requirements.md の Success Criteria をすべて満たす
- [ ] 既存の動作を壊していないことを確認済み
