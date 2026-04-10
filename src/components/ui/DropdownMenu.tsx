'use client';

import { useState, useRef, useEffect } from 'react';

type MenuItem = {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  icon?: string;
  disabled?: boolean;
};

type Props = {
  items: MenuItem[];
};

export default function DropdownMenu({ items }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="メニュー"
        className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 z-20 mt-1.5 w-40 origin-top-right overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl shadow-stone-900/10">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                item.disabled
                  ? 'text-stone-300'
                  : item.variant === 'danger'
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              {item.icon && (
                <span className={`material-icons text-[17px] ${item.disabled ? 'text-stone-300' : item.variant === 'danger' ? 'text-rose-500' : 'text-stone-400'}`}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
