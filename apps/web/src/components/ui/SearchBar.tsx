'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SearchBarProps = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SearchBar({
  placeholder,
  value,
  onChange,
  className,
}: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/40 bg-white/70 py-3 pl-11 pr-4 text-sm text-gray-900 shadow-glass outline-none backdrop-blur-xl transition-all placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:shadow-glow-primary focus:ring-2 focus:ring-primary-400/20"
      />
    </div>
  );
}
