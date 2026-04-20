# Design: entry_detail_modal

**Status**: Draft
**Created**: 2026-04-20

## 1. 概要

カードのメモを 2 行省略に変更し、カードに「詳細」ボタンを追加する。ボタン押下で Jotai atom に対象 entry がセットされ、layout にマウントされた 1 つのモーダルが開く。モーダル内は別コンポーネント `EntryDetailModalContent` が担当し、カード情報とメモ全文を表示する。メモ領域は最大高さを超えたら内部スクロール。

## 2. アプローチ

既存の `src/components/ui/Modal.tsx` は `isOpen` / `onClose` / `title` / `children` を受け取る汎用コンポーネントで、`EntryEditModal` ではこれをローカル state で開閉している。今回は「どこからでも開けるモーダル」が要件のため、同じパターン（ローカル state）を繰り返すのではなく、Jotai atom に「表示対象の entry」を持たせ、そこから `isOpen` を派生させる。atom が `null` なら閉じている、`Entry` が入っていればその entry を開いている、という素直な 1 state 設計にする。

モーダルの器は `EntryDetailModalRoot` という Client Component として、カードを描画するラッパーコンポーネント（`EntryList` / `BulkDeleteSection`）の末尾に 1 つだけマウントする。`app/layout.tsx` には置かない — `/login` など詳細ボタンを持たないページに不要なバンドル・JS 実行を載せないため。`EntryCard` は `EntryList`（`/`, `/archives`, `/favorites` で使用）と `BulkDeleteSection`（`/categories/[id]` で使用）の 2 箇所から使われ、同一ページで両方が同時に描画されることはないため、二重マウントは発生しない。

`EntryDetailModalRoot` は atom を subscribe して `<Modal>` の開閉と `<EntryDetailModalContent>` の描画を行う。呼び出し側（現時点ではカードの詳細ボタン）は `useSetAtom(entryDetailAtom)` で entry をセットするだけでよく、モーダル自体には関心を持たない。

メモの省略表示は Tailwind の `line-clamp-2` を使う。既存の `EntryCard.tsx` では `max-h-[104px] overflow-y-auto` で内部スクロールしているが、これをやめ、同じ領域を `line-clamp-2` に変更する。この領域は `hidden ... md:block` で PC のみ表示なので、SP での挙動は変わらない（もともとメモは表示していない）。ただし詳細ボタンは PC / SP 両方で表示する必要がある（SP でメモを読む手段がなかった問題の解決にもなる）。

Jotai の Provider は現状未導入で、`metaAtom` も Provider なしで動いている（デフォルトストア利用）。同じ前提で `entryDetailAtom` を追加する。Provider 導入は今回の要件外。

## 3. 変更ファイル一覧

| 種別 | パス | 役割 |
|------|------|------|
| 変更 | `src/lib/jotai/atoms.ts` | `entryDetailAtom` を追加 |
| 新規 | `src/components/entry/EntryDetailModalContent.tsx` | モーダル内の描画（カード情報 + 全文メモ） |
| 新規 | `src/components/entry/EntryDetailModalRoot.tsx` | atom を subscribe し `<Modal>` をマウントする器 |
| 変更 | `src/components/entry/EntryList.tsx` | 末尾に `<EntryDetailModalRoot />` を追加 |
| 変更 | `src/components/entry/BulkDeleteSection.tsx` | 末尾に `<EntryDetailModalRoot />` を追加 |
| 変更 | `src/components/entry/EntryCard.tsx` | メモを `line-clamp-2` 化、詳細ボタン追加 |
| 参考 | `src/components/ui/Modal.tsx` | そのまま利用 |
| 参考 | `src/components/entry/EntryEditModal.tsx` | Modal 使用パターンの参考 |

## 4. 主要な変更点

### 4.1 `entryDetailAtom` の追加

**目的**: モーダルの開閉状態と表示対象 entry を 1 つの atom で表現する。

**方針**: `null` = 閉 / `Entry` = 開、という最小設計。既存の `metaAtom` と同じファイルに追加する。

**実装**:

Before:
```ts
// src/lib/jotai/atoms.ts
import { atom } from 'jotai';
import { Meta } from '@/lib/types';
export const metaAtom = atom<Meta | null>(null);
```

After:
```ts
// src/lib/jotai/atoms.ts
import { atom } from 'jotai';
import { Meta, Entry } from '@/lib/types';
export const metaAtom = atom<Meta | null>(null);
export const entryDetailAtom = atom<Entry | null>(null);
```

### 4.2 `EntryDetailModalRoot` 新規作成

**目的**: atom を subscribe し、layout に 1 箇所だけマウントする。カード側は atom をセットするだけで良くする。

**配置**: `src/components/entry/EntryDetailModalRoot.tsx`

**実装**:
```tsx
'use client';

import { useAtom } from 'jotai';
import Modal from '@/components/ui/Modal';
import EntryDetailModalContent from './EntryDetailModalContent';
import { entryDetailAtom } from '@/lib/jotai/atoms';

export default function EntryDetailModalRoot() {
  const [entry, setEntry] = useAtom(entryDetailAtom);

  return (
    <Modal isOpen={!!entry} onClose={() => setEntry(null)} title="詳細">
      {entry && <EntryDetailModalContent entry={entry} />}
    </Modal>
  );
}
```

**呼び出し元**:
- `src/components/entry/EntryList.tsx` の末尾
- `src/components/entry/BulkDeleteSection.tsx` の末尾

**補足**: `Modal` は内部で `isOpen` が false のとき `null` を返すので、`entry` が null のときはモーダル自体が描画されない。atom の変更で自然に開閉する。カードを表示するページ（`/`, `/archives`, `/favorites`, `/categories/[id]`）でのみバンドルに載り、`/login` 等には不要な JS を載せない。

### 4.3 `EntryDetailModalContent` 新規作成

**目的**: モーダル内の表示内容（カード情報 + 全文メモ）を担当する。カードの一覧プレビューとは別の役割を持たせる。

**配置**: `src/components/entry/EntryDetailModalContent.tsx`

**実装**:
```tsx
'use client';

import Image from 'next/image';
import dayjs from 'dayjs';
import CategoryBadge from './CategoryBadge';
import { Entry } from '@/lib/types';

type Props = { entry: Entry };

export default function EntryDetailModalContent({ entry }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {entry.thumbnail_url && (
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="overflow-hidden rounded-xl"
        >
          <Image
            src={entry.thumbnail_url}
            alt=""
            width={480}
            height={270}
            className="h-auto w-full object-cover"
            unoptimized
          />
        </a>
      )}
      <div className="flex flex-col gap-1.5">
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[15px] font-medium leading-snug text-stone-900 hover:text-stone-600"
        >
          {entry.title}
        </a>
        <span className="truncate text-[12px] text-stone-400">{entry.url}</span>
      </div>
      <div className="flex items-center gap-2">
        {entry.category && <CategoryBadge name={entry.category.name} />}
        <span className="text-[11px] tabular-nums text-stone-400">
          {dayjs(entry.created_at).format('YYYY.MM.DD')}
        </span>
      </div>
      {entry.memo && (
        <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-3">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-stone-700">
            {entry.memo}
          </p>
        </div>
      )}
    </div>
  );
}
```

**補足**:
- メモ欄は `max-h-[40vh]` + `overflow-y-auto` で「ほどよい広さ、高さを超えたらスクロール」を実現
- `entry.category` プロパティの存在は `Entry` 型に依存。現状の型定義に合わせて `categoryName` を props で受け取る形にするか、`EntryCard` と同じパターン（`categories` 配列から `categoryName` を解決）にするかは実装時に型を見て判断（Phase 1 で確認）

### 4.4 `EntryCard` のメモ表示と詳細ボタン（クリック箇所別アクション対応）

**目的**: メモを 2 行省略に変更し、カード内のクリック位置によって以下のアクションを切り替える。

| 箇所 | アクション |
|------|-----------|
| サムネイル / タイトル / 空白領域 | 外部リンク遷移（新タブ） |
| メモプレビュー | モーダル開く |
| 「コメントを読む」 | モーダル開く |
| サブメニュー（⋮） | ドロップダウン展開 |

**方針**: **Stretched-link パターン** を採用する。タイトルの `<a>` に `before:absolute before:inset-0 before:content-['']` を付け、`<article>`（relative）全面を覆う透明レイヤーを生成。これがカード空白領域のクリックを拾って外部リンクに飛ばす。モーダル / メニューを開く要素は `relative z-10` を付けて擬似要素より上に出し、自身のクリックを受け取れるようにする。

サムネイル `<a>` は削除し `<div>` に変える（ネスト `<a>` を避けるため）。画像クリックは stretched link の ::before に吸収されて外部リンクに飛ぶ。

メモ表示は `<p>` のまま `onClick` を付け、`relative z-10` + `cursor-pointer` で stretched link を上書きする（段落としての見た目を崩さないため `<button>` にはしない）。

**実装**:

**実装のポイント**

Before（サムネ・タイトル・メモ・日付の構造）:
```tsx
<a href={entry.url} target="_blank">
  <Image ... />  {/* サムネは独自 anchor */}
</a>
<div className="flex-1">
  <a href={entry.url} target="_blank" className="line-clamp-2 ...">
    {entry.title}  {/* タイトルも独自 anchor */}
  </a>
  <EntryCardMenu ... />
  <CategoryBadge ... />
  <span>{date}</span>
</div>
{entry.memo && (
  <div className="hidden w-52 shrink-0 max-h-[104px] overflow-y-auto ... md:block">
    <p>{entry.memo}</p>  {/* メモは右カラムでスクロール */}
  </div>
)}
```

After（stretched link + メモ移動）:
```tsx
{/* サムネ: anchor を外して div に。stretched link に吸収 */}
<div className="relative shrink-0 overflow-hidden rounded-xl">
  <Image ... />
</div>

<div className="flex-1">
  {/* タイトル: stretched link 化。::before で article 全面を覆う */}
  <a
    href={entry.url}
    target="_blank"
    rel="noopener noreferrer"
    className="line-clamp-2 ... before:absolute before:inset-0 before:content-['']"
  >
    {entry.title}
  </a>

  {/* メニュー: relative z-10 で ::before より上に */}
  {isLoggedIn && (
    <div className="relative z-10">
      <EntryCardMenu ... />
    </div>
  )}

  <CategoryBadge ... />
  <span>{date}</span>

  {/* メモ: <p> のまま onClick を付与、relative z-10 + cursor-pointer、モーダル開く */}
  {entry.memo && (
    <p
      onClick={() => openDetail({ entry, categoryName })}
      className="relative z-10 mt-2 line-clamp-2 cursor-pointer whitespace-pre-wrap text-[12px] leading-relaxed text-stone-600 hover:text-stone-900"
    >
      {entry.memo}
    </p>
  )}

  {/* 「コメントを読む」: relative z-10 でラップ */}
  <div className="relative z-10 mt-2.5">
    <button type="button" onClick={() => openDetail({ entry, categoryName })} className="...">
      コメントを読む →
    </button>
  </div>
</div>
```

コンポーネント冒頭で atom setter を取得:
```tsx
import { useSetAtom } from 'jotai';
import { entryDetailAtom } from '@/lib/jotai/atoms';

const openDetail = useSetAtom(entryDetailAtom);
```

**補足**:
- 詳細ボタン・メモボタンは X 以外のカードブランチにのみ追加（X は即時表示で完結）
- メモはカード右カラム（`hidden ... md:block`）から**メインカラム内（カテゴリ/日付の下）**に移動。SP でも表示される
- `line-clamp-2` に変更したことで高さが可変になる
- `has-[[data-menu-open=true]]:z-30`（article 側）はメニュー展開時に兄弟カードより上に浮上する既存ロジック。`relative z-10`（子側）と stacking context が競合しないか留意（article は `relative` かつ z-auto なので、子の z-10 は root context で評価される）

### 4.5 `EntryList` と `BulkDeleteSection` に Root をマウント

**目的**: カードが描画されるページでのみモーダル Root を載せる。layout.tsx に置かない理由は、詳細機能と無関係な `/login` 等にバンドルを広げないため。

**方針**: `EntryCard` を render するラッパーコンポーネントの末尾（兄弟として）に `<EntryDetailModalRoot />` を追加。`EntryList` は `/`, `/archives`, `/favorites` で、`BulkDeleteSection` は `/categories/[id]` で使われる。同一ページでの共存はない。

**実装** (`EntryList.tsx`):

Before（擬似コード・末尾）:
```tsx
return (
  <ul className="...">
    {entries.map((entry) => <EntryCard ... />)}
  </ul>
);
```

After:
```tsx
return (
  <>
    <ul className="...">
      {entries.map((entry) => <EntryCard ... />)}
    </ul>
    <EntryDetailModalRoot />
  </>
);
```

`BulkDeleteSection.tsx` も同様に、既存のカード一覧をレンダーする JSX の末尾に Fragment でラップして `<EntryDetailModalRoot />` を追加する。

import 追加:
```tsx
import EntryDetailModalRoot from './EntryDetailModalRoot';
```

**補足**:
- Fragment でラップする都合、既存の JSX 構造に合わせて調整（すでに Fragment / 親要素がある場合はその中に追加）
- `EntryList` / `BulkDeleteSection` がすでに `'use client'` かどうかを確認。Server Component から Client Component をそのまま import するのは問題ないので、`EntryDetailModalRoot` が `'use client'` であれば呼び出し側の directive は変えなくてよい

## 5. データフロー

1. ユーザーがカードの「詳細」ボタンをクリック
2. `EntryCard` が `useSetAtom(entryDetailAtom)` で取得した setter を呼び、対象 entry を atom にセット
3. `EntryDetailModalRoot`（layout にマウント済み）が atom の変化を購読しており、`entry` が非 null になる
4. `<Modal isOpen={!!entry} ...>` により `<dialog>` が `showModal()` で表示
5. `<EntryDetailModalContent entry={entry} />` が描画され、カード情報とメモ全文が表示される
6. ユーザーが Esc / 背景クリック / × ボタンで閉じる → `onClose` が atom を `null` にリセット → モーダルが閉じる

## 6. 既存との関係

- `src/components/ui/Modal.tsx` は変更しない（そのまま利用）
- `src/components/entry/EntryEditModal.tsx` は変更しない（今回のモーダル管理方式の変更は編集モーダルには適用しない。編集はローカル state のままでも成立しており、スコープを広げない）
- `src/lib/jotai/atoms.ts` は 1 行追加のみ
- `src/components/entry/EntryCard.tsx` は 2 箇所変更（メモ省略化 + 詳細ボタン）
- `src/components/entry/EntryList.tsx` と `src/components/entry/BulkDeleteSection.tsx` は末尾に Root を追加するのみ
- `src/app/layout.tsx` は変更しない

## 7. 注意点

- **Client Component 境界**: `EntryDetailModalRoot` と `EntryDetailModalContent` は `'use client'`。Server Component ページから Client Component を子として import するのは問題ない
- **マウント位置**: `EntryList` と `BulkDeleteSection` の末尾に Root を置く。`/login` など詳細ボタンを持たないページに不要な JS を載せないための選択。同一ページで `EntryList` と `BulkDeleteSection` が共存しないため、二重マウントは発生しない（実装時に念のため確認）
- **Jotai Provider**: 現状 Provider 未導入。デフォルトストアでの動作前提（`metaAtom` が既にその前提で動いている）。Provider を追加すると既存 atom のスコープが変わるため、今回は追加しない
- **SSR hydration**: atom の初期値は `null` なので、サーバーとクライアントの初期描画が一致しモーダルは最初非表示。hydration mismatch の懸念なし
- **Entry 型の category 参照**: `Entry` 型に `category` がネストされているか、`category_id` のみなのかを実装時に確認。`EntryCard` では `categoryName` を props で受け取っているため、`EntryDetailModalContent` も同様に `categoryName` を props で受ける形に寄せる可能性あり
- **カード高さの変化**: メモを `line-clamp-2` に変えるとカードの高さが可変になる。既存で高さを揃えている箇所がないか一覧表示時に確認（`EntryList` 側で grid / flex の揃え方を見る）
- **X タイプ**: X カードはメモ・カテゴリ非表示で即時埋め込みのため、詳細ボタン・stretched link は付けない（CLAUDE.md の「X はメモ・カテゴリ不要」方針に合わせる）。ツイート埋め込み内部のリンクは X widget 側が処理する
- **Stretched link と stacking context**: `article` は `relative` + z-auto なので stacking context を生成しない。子の `relative z-10` は root 基準で評価され、tile の `::before`（z-auto）より上に描画される。メニュー展開時に付与される `has-[[data-menu-open=true]]:z-30` は兄弟カード間の順序制御用で、同じ root context 内で `z-30 > z-10 > z-auto(::before)` となり破綻しない
