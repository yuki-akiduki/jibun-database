import { Meta } from '@/lib/types';

export const fetchMeta = async (url: string) => {
  const res = await fetch('/api/fetch-meta', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'メタデータの取得に失敗しました');
  }
  return data as Meta & { html?: string };
};

export const createEntry = async (body: Record<string, unknown>) => {
  const res = await fetch('/api/entries', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '登録に失敗しました');
  }
  return data;
};

export const updateEntry = async (id: string, body: Record<string, unknown>) => {
  const res = await fetch(`/api/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '更新に失敗しました');
  }
  return data;
};

export const deleteEntry = async (id: string) => {
  const res = await fetch(`/api/entries/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '削除に失敗しました');
  }
  return data;
};
