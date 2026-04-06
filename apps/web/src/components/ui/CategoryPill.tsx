import { cn } from '@/lib/utils';

export type CategoryPillProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
};

export function CategoryPill({ label, active, onClick, icon }: CategoryPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20'
          : 'border border-white/40 bg-white/60 text-gray-600 backdrop-blur-lg hover:bg-white/90 hover:text-gray-900',
      )}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {label}
    </button>
  );
}
