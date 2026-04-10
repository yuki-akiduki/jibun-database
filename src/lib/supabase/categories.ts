import { cache } from 'react';
import { createClient } from './server';
import type { Categories } from '@/lib/types';

export const getCategories = cache(async (): Promise<Categories> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order');
  return data ?? [];
});
