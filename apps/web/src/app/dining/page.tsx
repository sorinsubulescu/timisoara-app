'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Star, MapPin, ArrowUpDown, Loader2, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { RESTAURANTS } from '@/data/mock';
import { fetchRestaurants, type ApiRestaurant } from '@/lib/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { InfiniteScrollSentinel } from '@/components/ui/InfiniteScrollSentinel';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { SearchBar } from '@/components/ui/SearchBar';
import { cn } from '@/lib/utils';

type SortMode = 'rating' | 'name';

const PRICE_LABELS = ['$', '$$', '$$$', '$$$$'] as const;
const PAGE_SIZE = 30;
const MAX_VISIBLE_CUISINES = 10;

const CUISINE_COLORS: Record<string, string> = {
  Romanian: '#ec6c21',
  Italian: '#27c070',
  Asian: '#f43f5e',
  Turkish: '#dd5317',
  Hungarian: '#be123c',
  French: '#6366f1',
  Indian: '#f08a46',
  default: '#9ca3af',
};

function toDisplay(r: ApiRestaurant) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    cuisine: r.cuisine ?? [],
    priceRange: r.priceRange ?? 0,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address,
    neighborhood: r.neighborhood ?? '',
    rating: r.rating ?? 0,
    features: r.features ?? [],
    imageUrl:
      r.imageUrl ??
      `https://placehold.co/400x300/94a3b8/white?text=${encodeURIComponent(r.name.slice(0, 20))}`,
  };
}

type DisplayRestaurant = ReturnType<typeof toDisplay>;

export default function DiningPage() {
  const [search, setSearch] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPrices, setSelectedPrices] = useState<Set<number>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [allRestaurants, setAllRestaurants] = useState<DisplayRestaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [source, setSource] = useState<string>('mock');
  const [hasMore, setHasMore] = useState(true);
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (pageNum: number, reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (pageNum === 1) setInitialLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetchRestaurants({
          search: search.trim() || undefined,
          page: pageNum,
          limit: PAGE_SIZE,
        });
        const newItems = res.data.map(toDisplay);
        setAllRestaurants((prev) => (reset ? newItems : [...prev, ...newItems]));
        setTotal(res.meta.total);
        setSource(res.meta.source ?? 'api');
        setHasMore(pageNum * PAGE_SIZE < res.meta.total);
        setPage(pageNum);
      } catch {
        if (pageNum === 1 && allRestaurants.length === 0) {
          setAllRestaurants(RESTAURANTS as unknown as DisplayRestaurant[]);
          setTotal(RESTAURANTS.length);
          setHasMore(false);
        }
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [search, allRestaurants.length],
  );

  useEffect(() => {
    setAllRestaurants([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleLoadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      loadPage(page + 1);
    }
  }, [page, hasMore, loadPage]);

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    enabled: hasMore && !loadingMore && !initialLoading,
  });

  const allCuisines = useMemo(
    () =>
      Array.from(new Set(allRestaurants.flatMap((r) => r.cuisine))).sort(),
    [allRestaurants],
  );

  const visibleCuisines = showAllCuisines ? allCuisines : allCuisines.slice(0, MAX_VISIBLE_CUISINES);

  function toggleCuisine(c: string) {
    setSelectedCuisines((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  function togglePrice(level: number) {
    setSelectedPrices((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let list = allRestaurants;

    if (selectedCuisines.size > 0) {
      list = list.filter((r) =>
        r.cuisine.some((c) => selectedCuisines.has(c)),
      );
    }
    if (selectedPrices.size > 0) {
      list = list.filter((r) => selectedPrices.has(r.priceRange));
    }

    return [...list].sort((a, b) =>
      sortMode === 'rating'
        ? b.rating - a.rating
        : a.name.localeCompare(b.name),
    );
  }, [allRestaurants, selectedCuisines, selectedPrices, sortMode]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Restaurants & Cafés
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              From traditional Romanian to world cuisine
            </p>
          </div>
          <span className="flex items-center gap-2">
            {initialLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            {source !== 'mock' && !initialLoading && (
              <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
                live · {total}
              </span>
            )}
          </span>
        </div>
      </div>

      <SearchBar
        placeholder="Search restaurants, cafés, cuisine..."
        value={search}
        onChange={setSearch}
        className="mb-5"
      />

      {/* Filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        <CategoryPill
          label="Open Now"
          active={openNow}
          onClick={() => setOpenNow(!openNow)}
        />
        <CategoryPill
          label="Near Me"
          active={nearMe}
          onClick={() => setNearMe(!nearMe)}
        />
        {allCuisines.length > 0 && (
          <>
            <span className="mx-1 self-center text-gray-200">|</span>
            {visibleCuisines.map((c) => (
              <CategoryPill
                key={c}
                label={c}
                active={selectedCuisines.has(c)}
                onClick={() => toggleCuisine(c)}
              />
            ))}
            {allCuisines.length > MAX_VISIBLE_CUISINES && !showAllCuisines && (
              <button
                type="button"
                onClick={() => setShowAllCuisines(true)}
                className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/60 px-3 py-2 text-sm font-medium text-gray-500 backdrop-blur-lg transition hover:bg-white/90"
              >
                +{allCuisines.length - MAX_VISIBLE_CUISINES} more
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Price & sort */}
      <div className="mb-5 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
          Price
        </span>
        {PRICE_LABELS.map((label, idx) => {
          const level = idx + 1;
          const active = selectedPrices.has(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => togglePrice(level)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-bold transition-all duration-200',
                active
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
                  : 'bg-white/60 text-gray-400 backdrop-blur-lg hover:bg-white/90 hover:text-gray-600',
              )}
            >
              {label}
            </button>
          );
        })}

        <div className="ml-auto">
          <button
            type="button"
            onClick={() =>
              setSortMode((prev) => (prev === 'rating' ? 'name' : 'rating'))
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-medium text-gray-500 backdrop-blur-lg transition hover:bg-white/90"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortMode === 'rating' ? 'By Rating' : 'By Name'}
          </button>
        </div>
      </div>

      {/* Restaurant cards */}
      {initialLoading ? (
        <CardSkeleton variant="row" count={6} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-200">
            <UtensilsCrossed className="h-7 w-7 text-warm-400" />
          </div>
          <p className="text-sm text-gray-400">No restaurants match your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((r) => (
              <Card key={r.id} variant="default" className="group flex overflow-hidden">
                <div
                  className="relative flex w-24 shrink-0 items-center justify-center overflow-hidden sm:w-28"
                  style={{
                    background: `linear-gradient(135deg, ${
                      r.priceRange <= 2 ? '#27c070' : r.priceRange === 3 ? '#f08a46' : '#ec6c21'
                    }22, ${
                      r.priceRange <= 2 ? '#27c070' : r.priceRange === 3 ? '#f08a46' : '#ec6c21'
                    }08)`,
                  }}
                >
                  <span
                    className="text-5xl font-black opacity-10"
                    style={{
                      color: r.priceRange <= 2 ? '#27c070' : r.priceRange === 3 ? '#f08a46' : '#ec6c21',
                    }}
                  >
                    {r.name.charAt(0)}
                  </span>
                  <span
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg font-bold text-white"
                    style={{
                      color: r.priceRange <= 2 ? '#27c070' : r.priceRange === 3 ? '#f08a46' : '#ec6c21',
                    }}
                  >
                    {r.name.charAt(0)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <h3 className="font-bold text-gray-900">{r.name}</h3>

                  {r.rating > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-700">
                        {r.rating}
                      </span>
                    </div>
                  )}

                  {r.cuisine.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.cuisine.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: CUISINE_COLORS[c] ?? CUISINE_COLORS.default,
                            }}
                          />
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {r.priceRange > 0 && (
                    <p className="text-sm">
                      {PRICE_LABELS.map((label, idx) => (
                        <span
                          key={label}
                          className={cn(
                            'font-bold',
                            idx < r.priceRange
                              ? 'text-gray-700'
                              : 'text-gray-200',
                          )}
                        >
                          $
                        </span>
                      ))}
                    </p>
                  )}

                  {r.neighborhood && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" />
                      {r.neighborhood}
                    </div>
                  )}

                  {r.features.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.features.map((f) => (
                        <span
                          key={f}
                          className="rounded-md bg-warm-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <InfiniteScrollSentinel
            sentinelRef={sentinelRef}
            loading={loadingMore}
            hasMore={hasMore}
            total={total}
            loaded={allRestaurants.length}
          />
        </>
      )}
    </div>
  );
}
