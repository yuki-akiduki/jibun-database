# AI駆動開発: クイック設計書生成（2分版）

対話を最小限にして、素早く設計書を生成します。小規模な変更や git commit 単位の設計に最適。

## 使い所

- 1-2 ファイルの修正
- 小さな機能追加
- パフォーマンス改善の一部
- 「とりあえず設計メモを残したい」

**大きな機能は `/design-docs:plan` を使ってください。**

---

## ステップ1: 引数 or 単一質問で概要収集

### パターン A: 引数あり

`$ARGUMENTS` が渡された場合、それを「何を作るか」として使用する。

### パターン B: 引数なし

最小限の1問で概要を聞く:

```
クイック設計書を作成します。以下を1行で教えてください:

**やりたいこと**:

例:
- EntryCard のカテゴリバッジの色を定数化
- layout.tsx と page.tsx の categories 重複取得を解消
- /archives ページに一括削除ボタンを追加
```

---

## ステップ2: 機能名の自動生成

spec の内容から英語スネークケースで機能名を生成（例: `category_badge_color_const`, `categories_dedup`, `archives_bulk_delete`）。

ユーザーに提示して確認:
```
機能名: {feature_name}

この名前で進めますか? (yes / 別名)
```

---

## ステップ3: 既存調査（簡易版）

`/design-docs:plan` より簡易的に、以下のみ実行:

1. 関連キーワードで `src/` 配下を grep
2. 見つかったものを列挙するだけ（再利用判断はユーザーに任せる）
3. 5 秒以内に終わらせる

```
【関連しそうなファイル】
- src/components/entry/CategoryBadge.tsx
- src/lib/constants/categories.ts

新規作成する前に目を通してください。
```

---

## ステップ4: 1ファイル版の設計書を生成

**重要**: クイック版は 3 ファイルに分けない。1ファイルで `design.md` にまとめる。

ファイルパス: `docs/design_docs/YYYYMMDD_{feature_name}/design.md`

### テンプレート

```markdown
# Quick Design: {feature_name}

**Created**: {YYYY-MM-DD}
**Type**: Quick (1-file)

## What
{1-2 行で内容}

## Why
{1-2 行で理由}

## Related（既存）
{grep で見つかったファイルを箇条書き}

## Approach
{実装方針を 3-5 行で説明}

## Changes

### {ファイル 1}

{変更内容を 1-2 行で説明}

Before / After:
\`\`\`typescript
// Before
...

// After
...
\`\`\`

### {ファイル 2}
...

## Tasks
- [ ] ...
- [ ] ...
- [ ] ...

## 注意点
{1-3 行で書けるもの。なければ省略}
```

**quick 版の原則**:
- 全体で 50-100 行に収める
- requirements.md / tasks.md は作らない
- コードは変更箇所のみ
- 過度な説明は書かない

---

## ステップ5: カレント設計書として保存

`.claude/.current-design-doc` に保存:
```
docs/design_docs/YYYYMMDD_{feature_name}/
```

---

## ステップ6: 完了メッセージ

```
⚡ クイック設計書を生成しました!

📁 docs/design_docs/YYYYMMDD_{feature_name}/design.md

💾 カレント設計書として保存しました

次のアクション:
- そのまま実装を始める: 「設計書に従って実装してください」
- `/design-docs:track` で進捗管理
- もっと詳細に書きたい場合は `/design-docs:plan` で作り直し
```

---

## 重要な原則

1. **スピード優先**: 2 分以内で完了させる。質問は最小限
2. **1 ファイルのみ**: 3 ファイルに分割しない
3. **コード最小限**: 変更箇所だけ。説明は 1-2 行で完結
4. **既存調査はする**: 省略しない。ただし簡易版で OK
5. **大きくなりそうなら plan へ誘導**: 会話の途中で「これは大きい」と感じたら `/design-docs:plan` を提案する
