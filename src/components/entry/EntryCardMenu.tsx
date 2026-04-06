'use client';

import { useRouter } from 'next/navigation';
import DropdownMenu from '@/components/ui/DropdownMenu';
import { toggleFavorite, toggleArchive } from '@/lib/api/entries';

type Props = {
  entryId: string;
  isFavorite: boolean;
  isArchived: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export default function EntryCardMenu({ entryId, isFavorite, isArchived, onEdit, onDelete }: Props) {
  const router = useRouter();

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(entryId, !isFavorite);
      router.refresh();
    } catch (e) {
      console.error(e instanceof Error ? e.message : 'お気に入りの更新に失敗しました');
    }
  };

  const handleToggleArchive = async () => {
    try {
      await toggleArchive(entryId, !isArchived);
      router.refresh();
    } catch (e) {
      console.error(e instanceof Error ? e.message : 'アーカイブの更新に失敗しました');
    }
  };

  const items = [
    {
      label: isFavorite ? 'お気に入り解除' : 'お気に入り',
      onClick: handleToggleFavorite,
      icon: isFavorite ? 'star' : 'star_border',
      disabled: isArchived,
    },
    {
      label: isArchived ? 'アーカイブ解除' : 'アーカイブ',
      onClick: handleToggleArchive,
      icon: isArchived ? 'unarchive' : 'archive',
      disabled: isFavorite && !isArchived,
    },
    { label: '編集', onClick: onEdit, icon: 'edit' },
    { label: '削除', onClick: onDelete, variant: 'danger' as const, icon: 'delete' },
  ];

  return <DropdownMenu items={items} />;
}
