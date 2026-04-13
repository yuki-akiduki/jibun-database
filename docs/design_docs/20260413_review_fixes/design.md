# Design: review_fixes

**Status**: Draft
**Created**: 2026-04-13

## 1. 概要

レビューで挙がった 4 件の改善を 1 本の変更で片付ける。新規ユーティリティ `isPublicHttpUrl` を `src/lib/utils/url.ts` に追加し、`fetch-meta` API の入口と `og:image` / YouTube サムネ URL の出口両方で検証する。併せて `/api/categories` のカラム明示化と、`MetaPreview` の OGP 空時メッセージ追加を行う。

## 2. アプローチ

SSRF 対策は**ホスト名レベルのブロックリスト方式**で行う。DNS rebinding 対策を厳密にやるには Node の `dns.lookup` → `net.connect` の 2 段階でチェックする必要があるが、個人学習プロジェクトの範囲・Vercel Edge の制約・「外部 URL の OGP を取りたい」という目的からすると過剰。まずは「明らかに内部向けホスト」を弾くだけで実害は激減する。Out of Scope に DNS rebinding を明記した通り。

`thumbnail_url` の検証は**入力 URL そのものと同じ `isPublicHttpUrl` を使い回す**。OGP で `javascript:alert()` のような scheme が混入すると、保存後に `<img src>` / `<a href>` でユーザーに悪影響が出うる。サムネは `<img>` でしか使わないので実害は低いが、フォームの URL 検証と同じ関数を通す方が見通しが良い。

`/api/categories` のカラム明示化は `src/lib/supabase/categories.ts` で既に採用済みのパターンを踏襲するだけ。

`MetaPreview` の空時 UI は「失敗ではなく、URL のみで登録できる」ことを伝えるのが目的なので、`submitStatus === 'error'` とは別枠の静かな注意書きにする。色は既存の `text-stone-500` 系で統一。

## 3. 変更ファイル一覧

| 種別 | パス | 役割 |
|------|------|------|
| 新規 | `src/lib/utils/url.ts` | `isPublicHttpUrl(url)` の実装 |
| 変更 | `src/app/api/fetch-meta/route.ts` | 入口に SSRF ブロック、出口で thumbnail の scheme 検証 |
| 変更 | `src/app/api/categories/route.ts` | `select('*')` → カラム明示 |
| 変更 | `src/components/entry/MetaPreview.tsx` | OGP 空時メッセージ表示 |
| 参考 | `src/lib/supabase/categories.ts` | カラム明示のパターン |

## 4. 主要な変更点

### 4.1 `isPublicHttpUrl` ユーティリティ新規作成

**目的**: URL が「外部から安全に fetch できる public な http(s) URL か」を判定する。`fetch-meta` API の入口と、OGP から取得した thumbnail_url の検証の両方で使う。

**方針**: ネットワーク I/O はしない。`URL` parse に成功すること、scheme が `http(s)`、ホスト名が localhost / private IP / link-local / IPv6 loopback でないことのみチェック。

**配置**: `src/lib/utils/url.ts`

**実装**:
```typescript
const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::', '::1']);

const isPrivateIpv4 = (host: string): boolean => {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
};

export const isPublicHttpUrl = (input: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return false;
  if (host.endsWith('.localhost')) return false;
  if (host.startsWith('[') && host.endsWith(']')) {
    // IPv6: fc00::/7 (unique local), fe80::/10 (link-local) を雑に弾く
    const v6 = host.slice(1, -1);
    if (v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb')) return false;
  }
  if (isPrivateIpv4(host)) return false;

  return true;
};
```

**補足**:
- `url.ts` には他に何も置かない想定。将来増えたら分割する
- 判定に DNS 解決を含めないので、`internal.corp.example.com` のようなドメインが内部 IP に向いているケースは検知できない（Out of Scope）

---

### 4.2 `fetch-meta` API に SSRF ブロックを追加

**目的**: ユーザーが登録しようとする URL、および OGP から取得した画像 URL の両方で `isPublicHttpUrl` を通す。

**方針**: 入口の既存 protocol チェック（`:21-27`）を `isPublicHttpUrl` 呼び出しに差し替え、エラーメッセージも統一。出口では `og:image` と YouTube oEmbed の両方のサムネ URL を検証し、弾かれたら空文字列にして返す（fetch 自体は成功しているので 200 を返す仕様のまま）。

**実装**:

Before（入口、`src/app/api/fetch-meta/route.ts:20-27`）:
```typescript
try {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: '無効なURLスキームです' }, { status: 400 });
  }
} catch {
  return NextResponse.json({ error: '無効なURLです' }, { status: 400 });
}
```

After:
```typescript
if (!isPublicHttpUrl(url)) {
  return NextResponse.json({ error: '無効なURLです' }, { status: 400 });
}
```

Before（YouTube サムネ、`:45-47`）:
```typescript
const thumbnail_url = videoId
  ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  : data.thumbnail_url;
```

After:
```typescript
const candidate = videoId
  ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  : data.thumbnail_url;
const thumbnail_url = isPublicHttpUrl(candidate) ? candidate : '';
```

Before（一般サイト、`:70-71`）:
```typescript
const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
const thumbnail_url = $('meta[property="og:image"]').attr('content') || '';
```

After:
```typescript
const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
const ogImage = $('meta[property="og:image"]').attr('content') || '';
const thumbnail_url = isPublicHttpUrl(ogImage) ? ogImage : '';
```

**補足**:
- YouTube / X の oEmbed エンドポイント自体は固定値なので SSRF チェック不要
- 一般サイトの `fetch(url)` はチェック後なので安全

---

### 4.3 `/api/categories` のカラム明示化

**目的**: `select('*')` で不要なカラム（将来追加されるかもしれない `color` / `icon` 等）を返さない。

**実装**:

Before（`src/app/api/categories/route.ts:6`）:
```typescript
const { data, error } = await supabase.from('categories').select('*').order('sort_order');
```

After:
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('id, name, sort_order')
  .order('sort_order');
```

**補足**: `getCategories()`（`src/lib/supabase/categories.ts`）は `id, name` のみ返すが、API 側はクライアント用途が不明なので `sort_order` も含めておく。

---

### 4.4 `MetaPreview` に OGP 空時メッセージ

**目的**: OGP から `title` も `thumbnail_url` も取れなかった場合、ユーザーに「取得はできなかったが URL だけで登録できる」ことを示す。

**方針**: X 投稿（html あり）以外の分岐で、`title` と `thumbnail_url` が両方空なら、URL と一緒に「メタデータを取得できませんでした。URL のみで登録できます」を表示。既存の分岐構造に else-if を足すのではなく、画像部と文字部の内側に差し込む。

**実装**:

Before（`MetaPreview.tsx:25-42`）:
```tsx
<div className="flex flex-wrap gap-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3">
  {meta.thumbnail_url && (
    <img src={meta.thumbnail_url} ... />
  )}
  <div className="min-w-0 flex-1">
    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-stone-900">
      {meta.title}
    </p>
    <p className="mt-1 truncate text-[11px] text-stone-400">{meta.url}</p>
  </div>
</div>
```

After:
```tsx
<div className="flex flex-wrap gap-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3">
  {meta.thumbnail_url && (
    <img src={meta.thumbnail_url} ... />
  )}
  <div className="min-w-0 flex-1">
    {meta.title ? (
      <p className="line-clamp-2 text-[13px] font-medium leading-snug text-stone-900">
        {meta.title}
      </p>
    ) : (
      <p className="text-[12px] text-stone-500">
        メタデータを取得できませんでした。URL のみで登録できます。
      </p>
    )}
    <p className="mt-1 truncate text-[11px] text-stone-400">{meta.url}</p>
  </div>
</div>
```

**補足**: thumbnail 空かつ title 空のときが典型だが、片方だけ取れたケースでは従来通り表示される（タイトルあり・サムネなし等）。

## 5. データフロー

fetch-meta API の検証フロー（変更後）:

1. リクエスト受信、認証チェック
2. `isPublicHttpUrl(url)` → false なら 400 返却（既存の URL parse / protocol チェックを内包）
3. `detectSiteType(url)` でサイト種別判定
4. YouTube / X は固定 oEmbed エンドポイントに fetch
5. 一般サイトは検証済みの `url` に直接 fetch
6. レスポンスから title / thumbnail_url を抽出
7. thumbnail_url を `isPublicHttpUrl` で再検証、NG なら空文字列にして返却

## 6. 既存との関係

- `src/lib/supabase/categories.ts` は変更しない。`/api/categories` がこのパターンを踏襲する
- `src/app/api/fetch-meta/route.ts` の既存 protocol チェックは `isPublicHttpUrl` に吸収されるので削除
- `MetaPreview.tsx` の X 投稿分岐は変更しない
- `src/lib/utils/site.ts`（`detectSiteType`）とは別ファイル。役割が違う（種別判定 vs セキュリティ検証）

## 7. 注意点

- **DNS rebinding 非対応**: `isPublicHttpUrl` はホスト名文字列のみで判定するので、`attacker.com` が内部 IP を返す DNS を持っていると素通しする。完全対策は fetch 時の IP 解決と `net.connect` のフックが必要だが今回はやらない
- **IPv6 判定は雑**: `fc00::/7`, `fe80::/10` を prefix 文字列でゆるくカバーしている。厳密にやるなら IP パーサが要るが、個人プロジェクトの許容範囲
- **YouTube サムネの URL は固定**: `img.youtube.com/...` なので検証は実質 no-op だが、将来ドメイン変更 or oEmbed フォールバックで不正 URL が紛れるケースに備えて通す
- **`MetaPreview` の条件分岐**: `meta.title ? ... : ...` は title 空文字列でも false になるので意図通り
