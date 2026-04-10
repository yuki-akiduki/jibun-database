-- 個人URLデータベース — 現行スキーマ
-- 更新が必要になったら Supabase SQL Editor で実行する。
-- タグ機能は未実装だが、テーブルは存在する。

-- 1. カテゴリマスタ
CREATE TABLE categories (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 2. タグマスタ（未使用）
CREATE TABLE tags (
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 3. メインテーブル
CREATE TABLE entries (
  id            BIGSERIAL PRIMARY KEY,
  url           TEXT NOT NULL UNIQUE,
  site_type     TEXT NOT NULL CHECK (site_type IN ('youtube', 'niconico', 'x', 'website')),
  title         TEXT,
  thumbnail_url TEXT,
  description   TEXT,
  author        TEXT,
  category_id   BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  memo          TEXT,
  is_favorite   BOOLEAN NOT NULL DEFAULT false,
  is_archived   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entries_site_type ON entries(site_type);
CREATE INDEX idx_entries_category  ON entries(category_id);
CREATE INDEX idx_entries_created   ON entries(created_at DESC);

-- 4. 中間テーブル（未使用）
CREATE TABLE entry_tags (
  entry_id BIGINT REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   BIGINT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE INDEX idx_entry_tags_tag ON entry_tags(tag_id);

-- RLS: 全テーブル共通で「SELECT=全員 OK、INSERT/UPDATE/DELETE=authenticated のみ」
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公開閲覧"         ON entries FOR SELECT USING (true);
CREATE POLICY "認証ユーザー登録"  ON entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "認証ユーザー更新"  ON entries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "認証ユーザー削除"  ON entries FOR DELETE USING (auth.role() = 'authenticated');
-- categories, tags, entry_tags にも同様に設定
