import { atom } from 'jotai';
import { Meta } from '@/lib/types';
export const metaAtom = atom<Meta | null>(null);
