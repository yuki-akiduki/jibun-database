# Project Structure

## Organization Philosophy

**feature-first + layered hybrid**。

- `src/app/` は Next.js App Router の routing 層（page / layout / API route）
- `src/components/` は**機能ドメイン別**にフォルダ分割（entry / auth / layout / ui）
- `src/lib/` は**技術関心別**にフォルダ分割（supabase / api / utils / types / constants / jotai）

ドメイン知識（entry のカード / フォーム / モーダル）はすべて `src/components/entry/` に集約し、汎用プリミティブは `src/components/ui/` に置く。

## Directory Patterns

### App Router Pages
**Location**: `src/app/<route>/page.tsx`
**Purpose**: ルーティングと Server Component によるデータ取得・画面構成
**Example**: `src/app/favorites/page.tsx` が `/favorites` を提供。Server Component 内で Supabase から直接エントリを取得する

### API Routes
**Location**: `src/app/api/<resource>/route.ts`（動的パラメータは `[id]/route.ts`）
**Purpose**: 書き込み系 API（`entries` CRUD、`fetch-meta`、`categories` GET）
**標準パターン**: `認証チェック → バリデーション → Supabase 操作 → エラーハンドリング` の順で書く

### Domain Components
**Location**: `src/components/<domain>/`
**Purpose**: 機能ドメインに属する UI（`entry/` に EntryCard / EntryForm / EntryEditModal など）
**Example**: `EntryCard`（表示）と `EntryCardMenu`（操作）と `EntryEditModal`（編集）をドメイン内で分割。1 ファイル 1 コンポーネント

### UI Primitives
**Location**: `src/components/ui/`
**Purpose**: ドメインに依存しない汎用部品（Button / Badge / Modal / Spinner / DropdownMenu / Pagination）
**例外なし**: ここにビジネスロジックは書かない

### Supabase Clients
**Location**: `src/lib/supabase/`
**Purpose**: 環境別クライアントファクトリ。`server.ts`（RSC / API）、`client.ts`（ブラウザ）、`middleware.ts`（セッションリフレッシュ本体）
**入口**: ページ / API からは常に `createClient()` を呼び、生の `createServerClient` は直接触らない

### Types
**Location**: `src/lib/types/<concept>.ts`
**Purpose**: 単一コンセプト 1 ファイル（`entry.ts` / `site.ts` / `meta.ts` / `categories.ts`）、`index.ts` で re-export
**Import**: 利用側は `import { Entry } from '@/lib/types'` で統一

### Constants (static maps)
**Location**: `src/lib/constants/`
**Purpose**: 動的な値を static な Tailwind class map に落とすための定数集。カテゴリ色（`categories.ts`）など
**Rule**: `style={{}}` を避けるために Tailwind class を文字列として持たせる

### Utils / API wrappers / Jotai
- `src/lib/utils/`: 純粋関数（`site.ts` で URL → site_type 判定、`auth.ts` で signOut）
- `src/lib/api/`: クライアント側からの API 呼び出しラッパー
- `src/lib/jotai/`: jotai atom 定義（`metaAtom` など一時 UI 状態）

### Root-level Files
- **`proxy.ts`（プロジェクトルート直下）**: Next.js 16 の新 middleware。`src/` ではなく**ルート**に置く
- `docs/`: `schema.sql`（現行スキーマ）、`performance-improvement.md`（改善方針メモ）等
- `CLAUDE.md`: Claude Code のための project memory
- `.kiro/`: steering / specs（cc-sdd SDD 関連）

## Naming Conventions

- **Files**:
  - コンポーネント: **PascalCase**（`EntryCard.tsx`）
  - それ以外: **camelCase** / **kebab-case**（`site.ts`, `entries.ts`）
- **Components**: `default export`、1 ファイル 1 コンポーネント
- **Type files**: 単数形・小文字（`entry.ts`）、型名は PascalCase（`Entry`）
- **API routes**: Next.js の規約どおり `route.ts`、HTTP メソッド（`GET` / `POST` / `PUT` / `DELETE`）を named export

## Import Organization

```typescript
import { createClient } from '@/lib/supabase/server';   // Absolute (src 配下)
import type { Entry } from '@/lib/types';
import EntryList from '@/components/entry/EntryList';
import { cn } from './local';                            // Relative は同ディレクトリのみ
```

**Path Aliases**:
- `@/*` → `./src/*`（`tsconfig.json`）

`src/` 配下への参照は常に `@/` 絶対パスを使う。相対パスは同一ディレクトリ内に限定する。

## Code Organization Principles

### Server Components をデフォルトに
`'use client'` は以下のいずれかが必要な場合のみ使う:
- ユーザー操作イベント（onClick / onSubmit 等）
- React hooks（useState / useEffect / useAtom 等）
- ブラウザ API
- 第三者 JS の初期化（Twitter widgets など）

### 依存方向
- `components/` → `lib/` は OK
- `lib/` → `components/` は**禁止**
- `lib/utils/` は外部依存を最小化し、純粋関数を保つ
- `lib/supabase/server.ts` は必ず Server Component / API Route 文脈からのみ呼ぶ

### 1 つのソース、1 つの真実
同じ設定を複数箇所に散らさない。例: カテゴリ色は `src/lib/constants/categories.ts` だけ、スキーマは `docs/schema.sql` だけ。

---

_Document patterns, not file trees. New files following patterns shouldn't require updates_
