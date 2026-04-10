import { Entry, Categories } from '@/lib/types';
import EntryCard from './EntryCard';

type Props = {
  entries: Entry[];
  categories: Categories;
  isLoggedIn: boolean;
};

export default function EntryList({ entries, categories, isLoggedIn }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-200 bg-white/50 py-16 text-center">
        <span className="material-icons text-3xl text-stone-300">inbox</span>
        <p className="text-sm text-stone-500">エントリがありません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => {
        const categoryName = categories.find((c) => c.id === entry.category_id)?.name;
        return (
          <EntryCard
            key={entry.id}
            entry={entry}
            categories={categories}
            categoryName={categoryName}
            isLoggedIn={isLoggedIn}
          />
        );
      })}
    </div>
  );
}
