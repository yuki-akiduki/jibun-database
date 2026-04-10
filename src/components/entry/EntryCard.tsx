'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dayjs from 'dayjs';
import CategoryBadge from './CategoryBadge';
import EntryCardMenu from './EntryCardMenu';
import EntryEditModal from './EntryEditModal';
import { deleteEntry } from '@/lib/api/entries';
import { Entry, Categories } from '@/lib/types';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void;
        createTweet: (id: string, el: HTMLElement) => Promise<HTMLElement>;
      };
    };
  }
}

type Props = {
  entry: Entry;
  categories: Categories;
  categoryName?: string;
  isLoggedIn: boolean;
};

const extractTweetId = (url: string): string | null => {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
};

const XEmbed = ({ url }: { url: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tweetId = extractTweetId(url);
    if (!tweetId || !ref.current) return;

    const el = ref.current;

    const create = () => {
      if (window.twttr && el) {
        el.innerHTML = '';
        window.twttr.widgets.createTweet(tweetId, el);
      }
    };

    if (window.twttr) {
      create();
    } else {
      const interval = setInterval(() => {
        if (window.twttr) {
          create();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [url]);

  return (
    <div ref={ref}>
      <p className="text-xs text-stone-400">読み込み中...</p>
    </div>
  );
};

const EntryCard = ({ entry, categories, categoryName, isLoggedIn }: Props) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm('削除しますか？')) {
      try {
        await deleteEntry(entry.id);
        router.refresh();
      } catch (e) {
        console.error(e instanceof Error ? e.message : '削除に失敗しました');
      }
    }
  };

  const isX = entry.site_type === 'x';

  return (
    <>
      <article className="group relative flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-900/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md hover:shadow-stone-900/[0.06]">
        {isX ? (
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <XEmbed url={entry.url} />
              </div>
              {isLoggedIn && (
                <EntryCardMenu
                  entryId={entry.id}
                  isFavorite={entry.is_favorite}
                  isArchived={entry.is_archived}
                  onEdit={() => setIsEditOpen(true)}
                  onDelete={handleDelete}
                />
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {categoryName && <CategoryBadge name={categoryName} />}
              <span className="text-[11px] tabular-nums text-stone-400">
                {dayjs(entry.created_at).format('YYYY.MM.DD')}
              </span>
            </div>
          </div>
        ) : (
          <>
            {entry.thumbnail_url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative shrink-0 overflow-hidden rounded-xl"
              >
                <Image
                  src={entry.thumbnail_url}
                  alt=""
                  width={176}
                  height={104}
                  className="h-[104px] w-[176px] object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  unoptimized
                />
              </a>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-1.5">
                  {entry.is_favorite && (
                    <span className="material-icons mt-0.5 shrink-0 text-base text-amber-500">
                      star
                    </span>
                  )}
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 text-[14px] font-medium leading-snug text-stone-900 transition-colors hover:text-stone-600"
                  >
                    {entry.title}
                  </a>
                </div>
                {isLoggedIn && (
                  <EntryCardMenu
                    entryId={entry.id}
                    isFavorite={entry.is_favorite}
                    isArchived={entry.is_archived}
                    onEdit={() => setIsEditOpen(true)}
                    onDelete={handleDelete}
                  />
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {categoryName && <CategoryBadge name={categoryName} />}
                <span className="text-[11px] tabular-nums text-stone-400">
                  {dayjs(entry.created_at).format('YYYY.MM.DD')}
                </span>
              </div>
            </div>
            {entry.memo && (
              <div className="hidden w-52 shrink-0 max-h-[104px] overflow-y-auto border-l border-stone-200 pl-4 md:block">
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-stone-600">
                  {entry.memo}
                </p>
              </div>
            )}
          </>
        )}
      </article>

      {isLoggedIn && (
        <EntryEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          entryId={entry.id}
          currentCategoryId={entry.category_id}
          currentMemo={entry.memo}
          categories={categories}
        />
      )}
    </>
  );
};

export default EntryCard;
