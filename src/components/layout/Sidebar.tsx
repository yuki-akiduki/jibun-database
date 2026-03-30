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
        className="fixed bottom-4 right-4 z-30 lg:hidden w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56 bg-white border-r border-gray-200 p-4 z-40 transition-transform lg:sticky lg:translate-x-0 lg:block ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </aside>
    </>
  );
}
