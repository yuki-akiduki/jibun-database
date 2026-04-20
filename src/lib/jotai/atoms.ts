import { atom } from 'jotai';
import { Meta, Entry } from '@/lib/types';

export const metaAtom = atom<Meta | null>(null);

export type EntryDetailPayload = { entry: Entry; categoryName?: string };
export const entryDetailAtom = atom<EntryDetailPayload | null>(null);
