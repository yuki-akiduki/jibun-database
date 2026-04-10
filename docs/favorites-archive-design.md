# お気に入り・アーカイブ機能 実装計画

## 概要

entriesテーブルに`is_favorite`と`is_archived`フラグを追加し、エントリの状態管理を行う。

### 挙動
| 機能 | 挙動 |
|------|------|
| お気に入り | 元カテゴリ + お気に入りページに表示 |
| アーカイブ | 元カテゴリから消え、アーカイブページのみ表示 |
| お気に入り → アーカイブ | 不可 |
| アーカイブ → お気に入り | 不可 |
| アーカイブ解除 | 元カテゴリに戻る、is_favoriteは保持 |

---

## 1. DB変更（ユーザーがSupabaseで実行）

```sql
-- カラム追加
ALTER TABLE entries
ADD COLUMN is_favorite BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;

-- 排他制約（両方trueは不可）
ALTER TABLE entries
ADD CONSTRAINT chk_favorite_archived_exclusive
CHECK (NOT (is_favorite = true AND is_archived = true));

-- インデックス
CREATE INDEX idx_entries_is_favorite ON entries(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_entries_is_archived ON entries(is_archived) WHERE is_archived = true;
```

---

## 2. 実装ステップ（Claude担当）

### Step 1: 型定義
**ファイル**: `src/lib/types/entry.ts`
- `is_favorite: boolean` 追加
- `is_archived: boolean` 追加

### Step 2: Google Material Icons導入
**ファイル**: `src/app/layout.tsx`
- `<head>`にフォント読み込み追加

### Step 3: API拡張
**ファイル**: `src/app/api/entries/[id]/route.ts`
- `is_favorite`, `is_archived`の更新対応
- 排他チェック（お気に入り済み→アーカイブ不可、その逆も）

### Step 4: クライアントAPI関数追加
**ファイル**: `src/lib/api/entries.ts`
- `toggleFavorite(id, isFavorite)` 追加
- `toggleArchive(id, isArchived)` 追加

### Step 5: DropdownMenu拡張
**ファイル**: `src/components/ui/DropdownMenu.tsx`
- MenuItem型に`icon`, `disabled`追加

### Step 6: EntryCardMenu拡張
**ファイル**: `src/components/entry/EntryCardMenu.tsx`
- Props: `entryId`, `isFavorite`, `isArchived` 追加
- メニュー項目: お気に入り、アーカイブ、編集、削除
- アイコン: `star`/`star_border`, `archive`/`unarchive`

### Step 7: EntryCard変更
**ファイル**: `src/components/entry/EntryCard.tsx`
- EntryCardMenuに新しいprops渡す
- お気に入りアイコン表示（タイトル横）

### Step 8: CategoryNav拡張
**ファイル**: `src/components/layout/CategoryNav.tsx`
- カテゴリの後に区切り線
- 「お気に入り」リンク（/favorites）
- 「アーカイブ」リンク（/archives）

### Step 9: 既存ページのクエリ変更
**ファイル**: `src/app/page.tsx`, `src/app/categories/[id]/page.tsx`
- `.eq('is_archived', false)` 追加でアーカイブ除外

### Step 10: 新規ページ作成
**ファイル**: `src/app/favorites/page.tsx`
- `is_favorite=true` かつ `is_archived=false` を取得

**ファイル**: `src/app/archives/page.tsx`
- `is_archived=true` を取得

---

## 3. 修正対象ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/lib/types/entry.ts` | 型追加 |
| `src/app/layout.tsx` | Material Icons読み込み |
| `src/app/api/entries/[id]/route.ts` | API拡張 |
| `src/lib/api/entries.ts` | 関数追加 |
| `src/components/ui/DropdownMenu.tsx` | icon/disabled対応 |
| `src/components/entry/EntryCardMenu.tsx` | ボタン追加 |
| `src/components/entry/EntryCard.tsx` | props変更 |
| `src/components/layout/CategoryNav.tsx` | リンク追加 |
| `src/app/page.tsx` | クエリ変更 |
| `src/app/categories/[id]/page.tsx` | クエリ変更 |
| `src/app/favorites/page.tsx` | 新規作成 |
| `src/app/archives/page.tsx` | 新規作成 |

---

## 4. 検証方法

1. `pnpm dev`で開発サーバー起動
2. ログイン状態でエントリカードのメニューを確認
   - お気に入り/アーカイブボタンが表示されること
3. お気に入りボタン押下 → /favoritesに表示されること
4. アーカイブボタン押下 → 元カテゴリから消え、/archivesに表示されること
5. お気に入り済みエントリのアーカイブボタンが無効化されていること
6. アーカイブ解除 → 元カテゴリに戻ること
7. `pnpm type-check`でエラーがないこと
