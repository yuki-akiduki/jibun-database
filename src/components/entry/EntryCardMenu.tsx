'use client';

import DropdownMenu from '@/components/ui/DropdownMenu';

type Props = {
  onEdit: () => void;
  onDelete: () => void;
};

export default function EntryCardMenu({ onEdit, onDelete }: Props) {
  const items = [
    { label: '編集', onClick: onEdit },
    { label: '削除', onClick: onDelete, variant: 'danger' as const },
  ];

  return <DropdownMenu items={items} />;
}
