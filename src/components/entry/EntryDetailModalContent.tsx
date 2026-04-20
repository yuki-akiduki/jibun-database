'use client';

import Image from 'next/image';
import dayjs from 'dayjs';
import CategoryBadge from './CategoryBadge';
import { Entry } from '@/lib/types';

type Props = {
  entry: Entry;
  categoryName?: string;
};

export default function EntryDetailModalContent({ entry, categoryName }: Props) {
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
        {categoryName && <CategoryBadge name={categoryName} />}
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
