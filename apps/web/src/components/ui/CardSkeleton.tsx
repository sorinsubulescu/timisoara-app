import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  variant?: 'grid' | 'row' | 'line';
  count?: number;
  className?: string;
}

function SkeletonGrid() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
      <div className="h-36 w-full bg-warm-200" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="h-4 w-3/4 rounded-lg bg-warm-200" />
        <div className="h-3 w-1/2 rounded-lg bg-warm-100" />
        <div className="h-3 w-2/3 rounded-lg bg-warm-100" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
      <div className="flex">
        <div className="h-24 w-24 bg-warm-200 sm:w-28" />
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="h-4 w-3/4 rounded-lg bg-warm-200" />
          <div className="h-3 w-1/3 rounded-lg bg-warm-100" />
          <div className="h-3 w-1/2 rounded-lg bg-warm-100" />
        </div>
      </div>
    </div>
  );
}

function SkeletonLine() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-warm-200" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-3/4 rounded-lg bg-warm-200" />
          <div className="h-3 w-1/2 rounded-lg bg-warm-100" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ variant = 'grid', count = 6, className }: CardSkeletonProps) {
  const Component = variant === 'grid' ? SkeletonGrid : variant === 'row' ? SkeletonRow : SkeletonLine;

  return (
    <div
      className={cn(
        variant === 'grid' && 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
        variant === 'row' && 'grid gap-4 sm:grid-cols-2',
        variant === 'line' && 'flex flex-col gap-3',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
