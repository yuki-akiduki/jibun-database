# コーディングルール

- Server Components をデフォルト使用。クライアント操作が必要な箇所のみ `"use client"`
- サーバー側DB操作は `lib/supabase/server.ts` を使用
- APIエラーは `NextResponse.json({ error: "..." }, { status: 4xx })` 形式
- 型定義は `lib/types.ts` に集約
- 1ファイル1コンポーネント、default export
