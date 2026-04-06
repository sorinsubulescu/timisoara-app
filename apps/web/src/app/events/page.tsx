'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  MapPin,
  Clock,
  Ticket,
  CalendarDays,
  Loader2,
  Plus,
  Users,
} from 'lucide-react';
import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  parseISO,
  compareAsc,
} from 'date-fns';
import { EVENTS, EVENT_CATEGORIES } from '@/data/mock';
import { fetchEvents, type ApiEvent } from '@/lib/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { InfiniteScrollSentinel } from '@/components/ui/InfiniteScrollSentinel';
import { cn } from '@/lib/utils';

type DateFilter = 'all' | 'today' | 'week' | 'month';

const DATE_FILTERS: Array<{ value: DateFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  music:    { bg: 'bg-violet-50',  text: 'text-violet-600', bar: '#8b5cf6' },
  theater:  { bg: 'bg-rose-50',    text: 'text-rose-600',   bar: '#e11d48' },
  art:      { bg: 'bg-amber-50',   text: 'text-amber-600',  bar: '#d97706' },
  sports:   { bg: 'bg-emerald-50', text: 'text-emerald-600',bar: '#059669' },
  food:     { bg: 'bg-orange-50',  text: 'text-orange-600', bar: '#ea580c' },
  family:   { bg: 'bg-sky-50',     text: 'text-sky-600',    bar: '#0284c7' },
  free:     { bg: 'bg-teal-50',    text: 'text-teal-600',   bar: '#0d9488' },
  meetup:   { bg: 'bg-indigo-50',  text: 'text-indigo-600', bar: '#4f46e5' },
  festival: { bg: 'bg-pink-50',    text: 'text-pink-600',   bar: '#db2777' },
};

const DEFAULT_CAT_STYLE = { bg: 'bg-gray-50', text: 'text-gray-600', bar: '#6b7280' };

const CHUNK_SIZE = 20;

interface DisplayEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  venue: string;
  venueAddress: string;
  isFree: boolean;
  price?: string;
  tags: string[];
  submitterName?: string;
}

function toDisplay(e: ApiEvent): DisplayEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    startDate: e.startDate,
    endDate: e.endDate ?? undefined,
    venue: e.venue,
    venueAddress: e.venueAddress,
    isFree: e.isFree,
    price: e.price ?? undefined,
    tags: e.tags,
    submitterName: (e as unknown as Record<string, unknown>).submitterName as string | undefined,
  };
}

function formatEventDate(dateString: string): string {
  const date = parseISO(dateString);
  const time = format(date, 'HH:mm');

  if (isToday(date)) return `Today at ${time}`;
  if (isTomorrow(date)) return `Tomorrow at ${time}`;
  return `${format(date, 'MMM d')} at ${time}`;
}

function groupLabel(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d, yyyy');
}

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [allEvents, setAllEvents] = useState<DisplayEvent[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [source, setSource] = useState('mock');
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  useEffect(() => {
    fetchEvents({ limit: 1000 })
      .then((res) => {
        if (res.data.length > 0) {
          setAllEvents(res.data.map(toDisplay));
          setSource('api');
        } else {
          setAllEvents(EVENTS as DisplayEvent[]);
        }
      })
      .catch(() => {
        setAllEvents(EVENTS as DisplayEvent[]);
      })
      .finally(() => setInitialLoading(false));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredEvents = useMemo(() => {
    let results = [...allEvents];

    if (activeCategory !== 'all') {
      results = results.filter((e) => e.category === activeCategory);
    }

    if (dateFilter !== 'all') {
      results = results.filter((e) => {
        const d = parseISO(e.startDate);
        if (dateFilter === 'today') return isToday(d);
        if (dateFilter === 'week') return isThisWeek(d, { weekStartsOn: 1 });
        if (dateFilter === 'month') return isThisMonth(d);
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    results.sort((a, b) =>
      compareAsc(parseISO(a.startDate), parseISO(b.startDate)),
    );
    return results;
  }, [search, dateFilter, activeCategory, allEvents]);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [search, dateFilter, activeCategory]);

  const visibleEvents = useMemo(
    () => filteredEvents.slice(0, visibleCount),
    [filteredEvents, visibleCount],
  );

  const hasMore = visibleCount < filteredEvents.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredEvents.length));
  }, [filteredEvents.length]);

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    enabled: hasMore && !initialLoading,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, typeof visibleEvents>();
    for (const evt of visibleEvents) {
      const key = groupLabel(evt.startDate);
      const arr = map.get(key) ?? [];
      arr.push(evt);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [visibleEvents]);

  return (
    <div className="flex flex-col gap-4 pb-6 animate-fade-in">
      {/* Page header */}
      <div className="px-4 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              What&apos;s Happening
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">Events in Timișoara</p>
          </div>
          <span className="flex items-center gap-2">
            {initialLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
            {source !== 'mock' && !initialLoading && (
              <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
                {filteredEvents.length} events
              </span>
            )}
          </span>
        </div>
        <SearchBar
          placeholder="Search events, venues, tags..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Date filters */}
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
        {DATE_FILTERS.map((f) => (
          <CategoryPill
            key={f.value}
            label={f.label}
            active={dateFilter === f.value}
            onClick={() => setDateFilter(f.value)}
          />
        ))}
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
        <CategoryPill
          label="All"
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {EVENT_CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat.value}
            label={cat.label}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {/* Events list */}
      {initialLoading ? (
        <div className="px-4">
          <CardSkeleton variant="line" count={6} />
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-4">
          {grouped.map(([label, evts]) => (
            <section key={label} className="flex flex-col gap-3">
              {/* Sticky date header */}
              <div className="sticky top-16 z-10 -mx-4 px-4 py-2 backdrop-blur-lg md:top-[4.5rem]">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary-400" />
                  <h2 className="text-sm font-bold text-gray-700">{label}</h2>
                </div>
              </div>

              {evts.map((evt) => {
                const catStyle = CATEGORY_COLORS[evt.category] ?? DEFAULT_CAT_STYLE;
                const isCommunity = !!evt.submitterName;

                return (
                  <Card key={evt.id} variant="default" className="overflow-visible">
                    <div className="flex">
                      {/* Colored left bar */}
                      <div
                        className="w-1 shrink-0 rounded-l-2xl"
                        style={{ backgroundColor: catStyle.bar }}
                      />

                      <div className="flex flex-1 flex-col gap-2.5 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                                catStyle.bg,
                                catStyle.text,
                              )}
                            >
                              {evt.category}
                            </span>
                            {isCommunity && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
                                <Users className="h-2.5 w-2.5" />
                                Community
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSave(evt.id);
                            }}
                            className="rounded-full p-1.5 transition hover:bg-warm-100"
                            aria-label={
                              saved.has(evt.id) ? 'Unsave event' : 'Save event'
                            }
                          >
                            <Heart
                              className={cn(
                                'h-5 w-5 transition',
                                saved.has(evt.id)
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'text-gray-300 hover:text-gray-400',
                              )}
                            />
                          </button>
                        </div>

                        <h3 className="text-base font-bold leading-snug text-gray-900">
                          {evt.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Clock className="h-4 w-4 flex-shrink-0 text-gray-300" />
                          <span>{formatEventDate(evt.startDate)}</span>
                          {evt.endDate && (
                            <>
                              <span className="text-gray-200">–</span>
                              <span>{formatEventDate(evt.endDate)}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-300" />
                          <span className="truncate">{evt.venue}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm">
                          <Ticket className="h-4 w-4 flex-shrink-0 text-gray-300" />
                          {evt.isFree ? (
                            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-600">
                              Free
                            </span>
                          ) : (
                            <span className="font-medium text-gray-600">{evt.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </section>
          ))}

          {grouped.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-200">
                <CalendarDays className="h-7 w-7 text-warm-400" />
              </div>
              <p className="text-sm text-gray-400">No events match your filters.</p>
            </div>
          )}

          {visibleEvents.length > 0 && (
            <InfiniteScrollSentinel
              sentinelRef={sentinelRef}
              loading={false}
              hasMore={hasMore}
              total={filteredEvents.length}
              loaded={visibleEvents.length}
            />
          )}
        </div>
      )}

      {/* FAB — Submit Event */}
      <Link
        href="/events/submit"
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3.5 text-white shadow-elevated transition-all hover:shadow-lg hover:brightness-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label="Submit an event"
      >
        <Plus className="h-5 w-5" />
        <span className="hidden text-sm font-semibold md:inline">Submit Event</span>
      </Link>
    </div>
  );
}
