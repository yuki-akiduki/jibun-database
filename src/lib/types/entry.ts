import { SiteType } from './site';

export type Entry = {
  id: string;
  url: string;
  title: string;
  thumbnail_url: string;
  site_type: SiteType;
  memo: string;
  category_id: string;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};
