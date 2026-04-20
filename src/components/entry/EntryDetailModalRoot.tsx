'use client';

import { useAtom } from 'jotai';
import Modal from '@/components/ui/Modal';
import EntryDetailModalContent from './EntryDetailModalContent';
import { entryDetailAtom } from '@/lib/jotai/atoms';

export default function EntryDetailModalRoot() {
  const [payload, setPayload] = useAtom(entryDetailAtom);

  return (
    <Modal isOpen={!!payload} onClose={() => setPayload(null)} title="詳細">
      {payload && (
        <EntryDetailModalContent entry={payload.entry} categoryName={payload.categoryName} />
      )}
    </Modal>
  );
}
