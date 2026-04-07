'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bus, Calendar, Compass, UtensilsCrossed, User, Flower2 } from 'lucide-react';
import { appTagline, appTitle, enabledSections, homeHref, isTransitStandalone } from '@/lib/features';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'explore', href: '/', label: 'Explore', icon: Compass },
  { key: 'events', href: '/events', label: 'Events', icon: Calendar },
  { key: 'transit', href: '/transit', label: 'Transit', icon: Bus },
  { key: 'dining', href: '/dining', label: 'Dining', icon: UtensilsCrossed },
  { key: 'profile', href: '/profile', label: 'Profile', icon: User },
] as const;

export default function Navigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) => enabledSections.includes(item.key));

  if (isTransitStandalone) {
    return <>{children}</>;
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-40 hidden border-b border-white/20 bg-white/80 shadow-glass backdrop-blur-xl md:block">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link
            href={homeHref}
            className="flex items-center gap-2 transition hover:opacity-80"
          >
            <Flower2 className="h-6 w-6 text-primary-500" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-gray-900">
                {appTitle}
              </span>
              <span className="hidden text-[10px] font-medium leading-none tracking-wider text-gray-400 lg:block">
                {appTagline}
              </span>
            </div>
          </Link>

          <ul className="flex items-center gap-1">
            {visibleNavItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'relative inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all duration-200',
                      active
                        ? 'text-primary-600'
                        : 'text-gray-500 hover:text-gray-900',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {/* Page content */}
      <div className="pb-20 md:pb-0">{children}</div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-white/70 shadow-glass backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
          {visibleNavItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium transition-all duration-200',
                    active ? 'text-primary-600' : 'text-gray-400',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200',
                      active
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                        : 'text-gray-400',
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                  </span>
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
