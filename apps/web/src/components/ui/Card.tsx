import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'glass' | 'elevated';

export type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  onClick?: () => void;
};

const variantStyles: Record<CardVariant, string> = {
  default:
    'border border-white/60 bg-white shadow-sm hover:shadow-md',
  glass:
    'glass hover:shadow-md',
  elevated:
    'border border-white/40 bg-white shadow-elevated hover:shadow-lg',
};

export function Card({
  children,
  className,
  variant = 'default',
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5',
        variantStyles[variant],
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
