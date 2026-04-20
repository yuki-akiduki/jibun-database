# Requirements: entry_detail_modal

**Status**: Draft
**Created**: 2026-04-20

## What（何を作るか）

カードのメモ表示とモーダル機能を変更する。

- カード上ではメモを 2 行分だけ表示（現状は `max-h` + 内部スクロール）
- カードに「詳細」ボタンを追加し、押すとモーダルが開く
- モーダルにカードの情報（タイトル / URL / サムネイル / カテゴリ / 日付）とメモ全文を表示。メモ領域はほどよい広さで、高さを超えたら内部スクロールする
- モーダル開閉・表示対象 entry は Jotai atom でグローバル管理する（どのコンポーネントからでも開けるようにする）
- モーダル内部の描画は別コンポーネント（`EntryDetailModalContent`）に分離する

## Why（なぜ必要か）

- 現状はメモが長いとカード内のスクロール領域が大きくなり、一覧性が落ちる
- 一覧ではコンパクトに、読みたい時だけ全文を落ち着いて確認できる動線にしたい
- 将来的にカード以外の場所（例: 検索結果、お気に入り一覧）からも詳細モーダルを開けるようにしておきたい

## Related（既存の関連資産）

### 再利用・参照する既存コード

- `src/components/ui/Modal.tsx` — `<dialog>` ベースの汎用モーダル。そのまま再利用する
- `src/components/entry/EntryEditModal.tsx` — Modal を使った実装パターンの参考
- `src/lib/jotai/atoms.ts` — 既に `metaAtom` が定義されている。ここに新しい atom を追加
- `src/components/entry/EntryCard.tsx` — メモ表示部分を変更し、詳細ボタンを追加
- `src/lib/types/entry.ts` — `Entry` 型をそのまま使う

### 新規作成の正当化

- `src/components/entry/EntryDetailModalContent.tsx` — 詳細表示内容はカードと別コンポーネントにしたい要件。既存 `EntryCard` は「一覧用のプレビュー」として役割を分ける
- `src/components/entry/EntryDetailModalRoot.tsx` — Jotai の atom を subscribe し、`<Modal>` を layout で 1 箇所だけマウントするための器。「グローバルで使える」の要件を満たす

### 参考ドキュメント

- なし

## Functional Requirements（機能要件）

- [ ] カードのメモ表示が 2 行 line-clamp になる（3 行目以降は `…` で省略）
- [ ] カードに「コメントを読む」ボタンを追加する（X タイプ以外のカードに表示）
- [ ] 「コメントを読む」ボタン押下で `entryDetailAtom` に該当 entry がセットされ、モーダルが開く
- [ ] **クリック箇所別アクション**（X タイプ以外のカード）:
  - サムネイル / タイトル / 空白領域 → 外部リンク遷移（新タブ）
  - メモプレビュー → モーダル開く
  - 「コメントを読む」 → モーダル開く
  - サブメニュー（⋮） → ドロップダウン展開
- [ ] モーダルはカードを表示する各ページで同じ挙動で開閉できる（`EntryList` / `BulkDeleteSection` の末尾に Root をマウント）
- [ ] 詳細ボタンを持たないページ（`/login` 等）にはモーダル関連の JS を読み込ませない
- [ ] モーダル内に以下を表示: タイトル / URL（クリックで外部リンク） / サムネイル（あれば） / カテゴリ / 登録日 / メモ全文
- [ ] モーダル内のメモ領域は最大高さを超えたら内部スクロールする
- [ ] モーダルを閉じると atom が `null` に戻る
- [ ] Esc / 背景クリック / × ボタンで閉じられる（`<dialog>` の標準挙動 + 既存 Modal の close ボタン）

## Non-Functional Requirements（非機能要件）

- [ ] 既存の動作を壊さない（編集モーダル / 削除 / お気に入り等の挙動に影響なし）
- [ ] `pnpm type-check` でエラーなし
- [ ] CSS は Tailwind のみ使用（`style={{}}` 禁止）
- [ ] Jotai Provider 未導入でもデフォルトストアで動くことを確認（現状 Provider なしで `metaAtom` が機能している前提）
- [ ] Server Component である `app/layout.tsx` から Client Component の `EntryDetailModalRoot` をマウントできること

## Success Criteria（成功基準）

- [ ] カードのメモが 2 行で省略表示される
- [ ] 「詳細」ボタン → モーダル → 全文メモ閲覧が一連で動く
- [ ] メモが長くてもモーダル内でスクロールし、モーダル自体のサイズは大きく崩れない
- [ ] 他のどのページ（`/`, `/categories/[id]`, `/favorites`, `/archives`）からでも同じ挙動で開ける

## Out of Scope（やらないこと）

- モーダルからの編集・削除操作（既存の `EntryCardMenu` 経由に留める）
- X タイプのカードへの詳細ボタン追加（X は即時表示のプレビューのみで完結しているため）
- URL クエリでのモーダル状態同期（リロードで開く挙動は今回作らない）
- アニメーション・トランジションの追加
