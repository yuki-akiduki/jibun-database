# AI駆動開発: 設計書切り替え

既存の設計書の中からカレント設計書を切り替えます。

## ステップ1: 設計書一覧の取得

`docs/design_docs/` 配下のディレクトリを一覧取得:

```bash
ls docs/design_docs/
```

ディレクトリ名は `YYYYMMDD_{feature_name}` 形式。

**該当なしの場合**:
```
❌ 設計書が見つかりません。

`/design-docs:plan` または `/design-docs:quick` で新しい設計書を作成してください。
```

---

## ステップ2: 各設計書の概要取得

各ディレクトリの `requirements.md` (または `design.md` for quick) から以下を読む:
- タイトル（`# ` の行）
- Status（Draft / In Progress / Done）
- Created 日付

カレント設計書（`.claude/.current-design-doc` の内容）を特定する。

---

## ステップ3: 一覧表示

```
📚 設計書一覧

{カレント設計書に ★ マーク}

1. ★ [Draft] tag_filter (2026-04-10)
   What: タグ機能。entries にタグを付けて、タグでフィルタリングできる
   進捗: Phase 2 / 4 進行中

2.   [Draft] performance_optimization (2026-04-08)
   What: パフォーマンス改善。getUser() の重複呼び出しと categories の重複取得を解消
   進捗: 未着手

3.   [Quick] categories_dedup (2026-04-07)
   What: layout と page の categories 重複取得を解消
   進捗: 完了

切り替えたい設計書の番号を入力してください（キャンセルは「cancel」）:
```

---

## ステップ4: 切り替え実行

ユーザーが番号を入力したら:

1. 選択された設計書のパスを `.claude/.current-design-doc` に書き込む
2. 切り替え完了メッセージを表示:

```
✅ カレント設計書を切り替えました

📁 docs/design_docs/{選択されたディレクトリ}/

概要: {requirements.md の What セクション冒頭}

進捗:
- Phase 1: ✅ Done
- Phase 2: 🚧 In Progress (2/4)
- Phase 3: 🔲 Pending
- Phase 4: 🔲 Pending

次のアクション:
- `/design-docs:start` で実装を再開
- `/design-docs:track` で進捗詳細を確認
```

---

## ステップ5: 拡張機能（オプション）

### フィルタ表示
ユーザーが「draft のみ」「完了以外」等と指示した場合、該当するものだけ表示する。

### 削除
ユーザーが「{番号} を削除」と指示した場合:
- 該当ディレクトリの削除前に確認
- `rm -rf docs/design_docs/{ディレクトリ}` を実行
- 削除後、カレント設計書がそれだった場合は `.claude/.current-design-doc` もクリア

### アーカイブ
ユーザーが「{番号} をアーカイブ」と指示した場合:
- `docs/design_docs/archive/` ディレクトリを作成（なければ）
- 該当ディレクトリを移動

---

## 重要な原則

1. **わかりやすい一覧**: 番号、タイトル、What、進捗を一目で把握できるように
2. **カレント設計書を明示**: ★ マーク等で現在選択中のものがわかるように
3. **破壊的操作は確認**: 削除・アーカイブ前に必ずユーザー確認
4. **即座の切り替え**: 選択後はすぐに `.current-design-doc` を更新
