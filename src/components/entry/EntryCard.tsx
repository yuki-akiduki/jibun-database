'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useSetAtom } from 'jotai';
import CategoryBadge from './CategoryBadge';
import EntryCardMenu from './EntryCardMenu';
import EntryEditModal from './EntryEditModal';
import { deleteEntry } from '@/lib/api/entries';
import { entryDetailAtom } from '@/lib/jotai/atoms';
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
  const openDetail = useSetAtom(entryDetailAtom);

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
      <article className="group relative flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-900/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md hover:shadow-stone-900/[0.06] has-[[data-menu-open=true]]:z-30">
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
              <div className="relative shrink-0 overflow-hidden">
                <Image
                  src={entry.thumbnail_url}
                  alt=""
                  width={176}
                  height={104}
                  className="h-[104px] w-[176px] rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  unoptimized
                />
              </div>
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
                    className="line-clamp-2 text-[14px] font-medium leading-snug text-stone-900 transition-colors hover:text-stone-600 before:absolute before:inset-0 before:content-['']"
                  >
                    {entry.title}
                  </a>
                </div>
                {isLoggedIn && (
                  <div className="relative z-10">
                    <EntryCardMenu
                      entryId={entry.id}
                      isFavorite={entry.is_favorite}
                      isArchived={entry.is_archived}
                      onEdit={() => setIsEditOpen(true)}
                      onDelete={handleDelete}
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {categoryName && <CategoryBadge name={categoryName} />}
                <span className="text-[11px] tabular-nums text-stone-400">
                  {dayjs(entry.created_at).format('YYYY.MM.DD')}
                </span>
              </div>
              {entry.memo && (
                <p
                  onClick={() => openDetail({ entry, categoryName })}
                  className="relative z-10 mt-2 line-clamp-2 cursor-pointer whitespace-pre-wrap text-[12px] leading-relaxed text-stone-600 transition-colors hover:text-stone-900"
                >
                  {entry.memo}
                </p>
              )}
              <div className="relative z-10 mt-2.5">
                <button
                  type="button"
                  onClick={() => openDetail({ entry, categoryName })}
                  className="group/detail inline-flex items-center gap-1 text-[12px] font-medium text-stone-600 transition-colors hover:text-stone-900"
                >
                  コメントを読む
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform group-hover/detail:translate-x-0.5"
                  >
                    <path d="M3 1l4 4-4 4" />
                  </svg>
                </button>
              </div>
            </div>
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
