export type CategoryStyle = {
  dot: string;
  badge: string;
};

export const categoryStyles: Record<string, CategoryStyle> = {
  リリック: {
    dot: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
  },
  モーション: {
    dot: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
  },
  ボイロ: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  },
  website: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  },
  article: {
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
  },
  X: {
    dot: 'bg-stone-900',
    badge: 'bg-stone-100 text-stone-900 ring-1 ring-inset ring-stone-300',
  },
};

export const defaultCategoryStyle: CategoryStyle = {
  dot: 'bg-stone-400',
  badge: 'bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200',
};
