'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  sentinelRef: (node: HTMLDivElement | null) => void;
  loading: boolean;
  hasMore: boolean;
  total?: number;
  loaded?: number;
  className?: string;
}

export function InfiniteScrollSentinel({
  sentinelRef,
  loading,
  hasMore,
  total,
  loaded,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-6', className)}>
      {total != null && loaded != null && loaded > 0 && (
        <div className="flex w-full max-w-xs items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-warm-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (loaded / total) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-gray-300">
            {loaded} / {total}
          </span>
        </div>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-2">
          {loading && (
            <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
          )}
        </div>
      )}

      {!hasMore && loaded != null && loaded > 0 && (
        <p className="text-xs font-medium text-gray-300">
          All {loaded} results loaded
        </p>
      )}
    </div>
  );
}
