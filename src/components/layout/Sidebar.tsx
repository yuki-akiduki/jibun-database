'use client';

import { useState } from 'react';

type Props = {
  children: React.ReactNode;
};

export default function Sidebar({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="メニューを開く"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-stone-50 shadow-lg shadow-stone-900/20 ring-1 ring-stone-900/10 transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-stone-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-60 border-r border-stone-200/80 bg-stone-50/95 px-4 py-6 backdrop-blur-md transition-transform lg:sticky lg:translate-x-0 lg:bg-transparent lg:backdrop-blur-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {children}
      </aside>
    </>
  );
}
