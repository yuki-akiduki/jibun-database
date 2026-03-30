import { Entry, Categories } from '@/lib/types';
import EntryCard from './EntryCard';

type Props = {
  entries: Entry[];
  categories: Categories;
  isLoggedIn: boolean;
};

export default function EntryList({ entries, categories, isLoggedIn }: Props) {
  if (entries.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">エントリがありません</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
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
