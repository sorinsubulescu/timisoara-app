'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Star, MapPin, Loader2, ExternalLink, X, Map as MapIcon,
  Trees, Church, Landmark, UtensilsCrossed, Coffee,
  Building2, Paintbrush, ShoppingBag, Pill, Heart,
  GlassWater, Music, Bed, Camera, Shuffle, ChevronRight,
  ChevronDown, Sparkles,
} from 'lucide-react';
import { POIS } from '@/data/mock';
import { fetchPois, type ApiPoi } from '@/lib/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { InfiniteScrollSentinel } from '@/components/ui/InfiniteScrollSentinel';
import { cn } from '@/lib/utils';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-2xl bg-warm-200" />
  ),
});

const CompactWeather = dynamic(
  () => import('@/components/weather/WeatherWidget').then((m) => m.CompactWeather),
  { ssr: false },
);

/* ───────────────────── Types & config ───────────────────── */

interface DisplayPoi {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: string;
  rating: number;
  imageUrl: string | null;
  website: string | null;
  openingHours: string | null;
  tags: string[];
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: typeof MapPin; gradient: string }> = {
  park:       { color: '#27c070', icon: Trees,           gradient: 'from-emerald-400 to-green-600' },
  museum:     { color: '#ec6c21', icon: Landmark,        gradient: 'from-orange-400 to-amber-600' },
  church:     { color: '#be123c', icon: Church,          gradient: 'from-rose-400 to-red-600' },
  restaurant: { color: '#f43f5e', icon: UtensilsCrossed, gradient: 'from-rose-400 to-pink-600' },
  cafe:       { color: '#a16207', icon: Coffee,          gradient: 'from-amber-400 to-yellow-700' },
  bar:        { color: '#7c3aed', icon: GlassWater,      gradient: 'from-violet-400 to-purple-600' },
  theater:    { color: '#c026d3', icon: Music,           gradient: 'from-fuchsia-400 to-purple-600' },
  gallery:    { color: '#db2777', icon: Paintbrush,      gradient: 'from-pink-400 to-rose-600' },
  hotel:      { color: '#0891b2', icon: Bed,             gradient: 'from-cyan-400 to-teal-600' },
  pharmacy:   { color: '#16a34a', icon: Pill,            gradient: 'from-green-400 to-emerald-600' },
  hospital:   { color: '#dc2626', icon: Heart,           gradient: 'from-red-400 to-rose-600' },
  shopping:   { color: '#ea580c', icon: ShoppingBag,     gradient: 'from-orange-400 to-red-500' },
  landmark:   { color: '#0284c7', icon: Camera,          gradient: 'from-sky-400 to-blue-600' },
  other:      { color: '#6366f1', icon: Building2,       gradient: 'from-indigo-400 to-violet-600' },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
}

const MOOD_TILES = [
  {
    id: 'coffee',
    label: 'Grab a coffee',
    teaser: 'Cozy spots & great brews',
    categories: ['cafe'],
    gradient: 'from-amber-500 to-orange-600',
    icon: Coffee,
  },
  {
    id: 'eat',
    label: 'Eat something new',
    teaser: 'Local flavors & hidden kitchens',
    categories: ['restaurant'],
    gradient: 'from-rose-500 to-pink-600',
    icon: UtensilsCrossed,
  },
  {
    id: 'nightout',
    label: 'Night out',
    teaser: 'Cocktails, music & good vibes',
    categories: ['bar'],
    gradient: 'from-violet-500 to-purple-700',
    icon: GlassWater,
  },
  {
    id: 'culture',
    label: 'Culture & art',
    teaser: 'History, architecture & beauty',
    categories: ['church', 'museum', 'theater', 'gallery', 'landmark'],
    gradient: 'from-sky-500 to-blue-700',
    icon: Landmark,
  },
  {
    id: 'outdoors',
    label: 'Fresh air',
    teaser: 'Parks, walks & open spaces',
    categories: ['park', 'landmark'],
    gradient: 'from-emerald-500 to-green-700',
    icon: Trees,
  },
];

const EXPLORE_CATEGORIES = ['restaurant', 'cafe', 'bar', 'church', 'museum', 'theater'];

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurants',
  cafe: 'Cafes',
  bar: 'Bars & Pubs',
  church: 'Churches',
  museum: 'Museums',
  theater: 'Theaters',
};

function getTimeSuggestion(): { title: string; categories: string[] } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12)
    return { title: 'Start your morning', categories: ['cafe'] };
  if (hour >= 12 && hour < 17)
    return { title: 'This afternoon, try', categories: ['museum', 'church', 'park', 'landmark', 'gallery'] };
  if (hour >= 17 && hour < 22)
    return { title: 'Tonight, check out', categories: ['restaurant', 'bar', 'theater'] };
  return { title: 'Still out?', categories: ['bar'] };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bună dimineața';
  if (hour < 18) return 'Bună ziua';
  return 'Bună seara';
}

function toDisplayPoi(p: ApiPoi): DisplayPoi {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    latitude: p.latitude,
    longitude: p.longitude,
    address: p.address,
    neighborhood: p.neighborhood ?? '',
    rating: p.rating ?? 0,
    imageUrl: p.imageUrl ?? null,
    website: p.website ?? null,
    openingHours: p.openingHours ?? null,
    tags: p.tags,
  };
}

/* ───────────────────── Sub-components ───────────────────── */

function MoodTile({
  tile,
  onSelect,
}: {
  tile: (typeof MOOD_TILES)[number];
  onSelect: (categories: string[]) => void;
}) {
  const Icon = tile.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(tile.categories)}
      className={cn(
        'group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]',
        tile.gradient,
        'h-28 min-w-[140px] flex-1',
      )}
    >
      <Icon className="absolute right-3 top-3 h-8 w-8 text-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:text-white/30" />
      <h3 className="text-sm font-bold text-white">{tile.label}</h3>
      <p className="mt-0.5 text-[11px] text-white/70">{tile.teaser}</p>
    </button>
  );
}

function FeaturedCarousel({ pois }: { pois: DisplayPoi[] }) {
  const featured = useMemo(() => pois.filter((p) => p.imageUrl), [pois]);

  if (featured.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-500" />
          <h2 className="text-base font-bold text-gray-900">Iconic Timișoara</h2>
        </div>
        <span className="text-xs text-gray-400">{featured.length} landmarks</span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
        {featured.map((poi) => (
          <FeaturedCard key={poi.id} poi={poi} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ poi }: { poi: DisplayPoi }) {
  const [imgError, setImgError] = useState(false);
  const { color, icon: CatIcon } = getCategoryConfig(poi.category);

  if (imgError || !poi.imageUrl) return null;

  return (
    <div className="group relative h-[200px] w-[280px] shrink-0 overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poi.imageUrl}
        alt={poi.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={() => setImgError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-gray-700 backdrop-blur-sm">
          <CatIcon className="h-3 w-3" style={{ color }} />
          {poi.category}
        </span>
        <h3 className="truncate text-sm font-bold text-white drop-shadow-sm">{poi.name}</h3>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{poi.neighborhood || poi.address}</span>
        </div>
      </div>
      {poi.website && (
        <a
          href={poi.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white"
        >
          <ExternalLink className="h-3 w-3 text-gray-600" />
        </a>
      )}
    </div>
  );
}

function TimeSuggestions({ pois }: { pois: DisplayPoi[] }) {
  const suggestion = useMemo(() => getTimeSuggestion(), []);
  const filtered = useMemo(
    () => pois.filter((p) => suggestion.categories.includes(p.category)).slice(0, 12),
    [pois, suggestion.categories],
  );

  if (filtered.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 animate-fade-in">
      <div className="px-5">
        <h2 className="text-base font-bold text-gray-900">{suggestion.title}</h2>
        <p className="text-xs text-gray-400">Based on the time of day</p>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
        {filtered.map((poi) => (
          <HorizontalCard key={poi.id} poi={poi} />
        ))}
      </div>
    </section>
  );
}

function SurpriseMe({
  pois,
  onReveal,
}: {
  pois: DisplayPoi[];
  onReveal: (poi: DisplayPoi) => void;
}) {
  const [revealed, setRevealed] = useState<DisplayPoi | null>(null);
  const explorePois = useMemo(
    () => pois.filter((p) => ['restaurant', 'cafe', 'bar', 'museum', 'church', 'theater', 'gallery', 'park', 'landmark'].includes(p.category)),
    [pois],
  );

  const pickRandom = () => {
    if (explorePois.length === 0) return;
    const pick = explorePois[Math.floor(Math.random() * explorePois.length)];
    setRevealed(pick);
    onReveal(pick);
  };

  const { color, icon: CatIcon, gradient } = revealed
    ? getCategoryConfig(revealed.category)
    : { color: '', icon: Shuffle, gradient: 'from-primary-500 to-rose-500' };

  return (
    <section className="px-5 animate-fade-in">
      {!revealed ? (
        <button
          type="button"
          onClick={pickRandom}
          className="group flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-primary-500 to-rose-500 p-5 text-left shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Shuffle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Feeling adventurous?</h3>
            <p className="text-[12px] text-white/70">
              Tap to discover a random spot in Timișoara
            </p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-white/50" />
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm animate-fade-in">
          <div className={cn('flex items-center gap-3 bg-gradient-to-r px-4 py-3', gradient)}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <CatIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-white">{revealed.name}</h3>
              <p className="text-[11px] text-white/70 capitalize">{revealed.category}</p>
            </div>
            <button
              type="button"
              onClick={pickRandom}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 transition hover:bg-white/30"
              aria-label="Try another"
            >
              <Shuffle className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5 px-4 py-3">
            {revealed.description && !revealed.description.toLowerCase().includes('in timișoara') && (
              <p className="text-xs text-gray-500">{revealed.description}</p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                <span className="truncate">{revealed.neighborhood || revealed.address || 'Timișoara'}</span>
              </div>
              {revealed.website && (
                <a
                  href={revealed.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-gray-100"
                >
                  <ExternalLink className="h-3 w-3" />
                  Visit
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CategorySection({
  category,
  pois,
}: {
  category: string;
  pois: DisplayPoi[];
}) {
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(() => pois.filter((p) => p.category === category), [pois, category]);
  const { color, icon: CatIcon } = getCategoryConfig(category);
  const label = CATEGORY_LABELS[category] ?? category;

  if (filtered.length < 3) return null;

  const preview = filtered.slice(0, 10);

  return (
    <section className="flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15` }}
          >
            <CatIcon className="h-3.5 w-3.5" style={{ color }} />
          </div>
          <h2 className="text-base font-bold text-gray-900">{label}</h2>
          <span className="rounded-full bg-warm-200 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
            {filtered.length}
          </span>
        </div>
        {filtered.length > 10 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold text-primary-500 transition hover:text-primary-600"
          >
            {expanded ? 'Show less' : 'See all'}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </button>
        )}
      </div>

      {!expanded ? (
        <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
          {preview.map((poi) => (
            <HorizontalCard key={poi.id} poi={poi} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 px-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {filtered.map((poi) => (
            <CompactGridCard key={poi.id} poi={poi} />
          ))}
        </div>
      )}
    </section>
  );
}

function HorizontalCard({ poi }: { poi: DisplayPoi }) {
  const { color, icon: CatIcon } = getCategoryConfig(poi.category);
  const hasDescription = poi.description && !poi.description.toLowerCase().includes('in timișoara');
  return (
    <div className="group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3 p-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <CatIcon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[13px] font-bold text-gray-900">{poi.name}</h4>
          {hasDescription && (
            <p className="mt-0.5 truncate text-[11px] text-gray-500">{poi.description}</p>
          )}
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{poi.neighborhood || poi.address || 'Timișoara'}</span>
          </div>
          {poi.rating > 0 && (
            <div className="mt-1 flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-semibold text-gray-500">{poi.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
      {poi.website && (
        <div className="border-t border-gray-50 px-3 py-1.5">
          <a
            href={poi.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-medium text-gray-400 transition hover:text-primary-500"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            Website
          </a>
        </div>
      )}
    </div>
  );
}

function CompactGridCard({ poi }: { poi: DisplayPoi }) {
  const { color, icon: CatIcon } = getCategoryConfig(poi.category);
  const hasDescription = poi.description && !poi.description.toLowerCase().includes('in timișoara');
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <CatIcon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-[13px] font-bold text-gray-900">{poi.name}</h4>
        {hasDescription && (
          <p className="truncate text-[11px] text-gray-500">{poi.description}</p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="truncate">{poi.neighborhood || poi.address || 'Timișoara'}</span>
          {poi.rating > 0 && (
            <>
              <span className="text-gray-200">·</span>
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-500">{poi.rating.toFixed(1)}</span>
              </div>
            </>
          )}
        </div>
      </div>
      {poi.website && (
        <a
          href={poi.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition hover:bg-gray-100"
        >
          <ExternalLink className="h-3 w-3 text-gray-400" />
        </a>
      )}
    </div>
  );
}

function BrowseAll({
  pois,
  total,
  loading,
  loadingMore,
  hasMore,
  sentinelRef,
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
}: {
  pois: DisplayPoi[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  search: string;
  onSearchChange: (v: string) => void;
  activeCategory: string;
  onCategoryChange: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="flex flex-col gap-4 px-5 animate-fade-in">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between rounded-2xl border border-white/60 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-100">
            <MapPin className="h-5 w-5 text-warm-400" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-gray-900">Browse all places</h2>
            <p className="text-xs text-gray-400">{total} places in Timișoara</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-300 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <SearchBar
            placeholder="Search all places..."
            value={search}
            onChange={onSearchChange}
          />

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {['all', ...EXPLORE_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition',
                  activeCategory === cat
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white text-gray-500 hover:bg-gray-50',
                )}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>

          {loading ? (
            <CardSkeleton variant="line" count={6} />
          ) : pois.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warm-200">
                <MapPin className="h-6 w-6 text-warm-400" />
              </div>
              <p className="text-sm text-gray-400">No places match your search.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {pois.map((poi) => (
                  <CompactGridCard key={poi.id} poi={poi} />
                ))}
              </div>
              <InfiniteScrollSentinel
                sentinelRef={sentinelRef}
                loading={loadingMore}
                hasMore={hasMore}
                total={total}
                loaded={pois.length}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}

function MapOverlay({
  markers,
  onClose,
}: {
  markers: { id: string; name: string; category: string; latitude: number; longitude: number }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-warm-50 animate-fade-in">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <h2 className="text-sm font-bold text-gray-900">Map — {markers.length} places</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 transition hover:bg-gray-100"
          aria-label="Close map"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <div className="flex-1">
        <MapView markers={markers} />
      </div>
    </div>
  );
}

/* ───────────────────── Main page ───────────────────── */

const PAGE_SIZE = 50;

export default function HomePage() {
  const [allPois, setAllPois] = useState<DisplayPoi[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Browse-all state
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseCategory, setBrowseCategory] = useState('all');
  const [browsePois, setBrowsePois] = useState<DisplayPoi[]>([]);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [browseHasMore, setBrowseHasMore] = useState(true);
  const browseLoadingRef = useRef(false);

  const [showMap, setShowMap] = useState(false);
  const [activeMood, setActiveMood] = useState<string[] | null>(null);

  // Load all POIs on mount for the curated sections
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const res = await fetchPois({ limit: 200, page: 1 });
        if (cancelled) return;
        const pois = res.data.map(toDisplayPoi);
        setAllPois(pois);
        setTotal(res.meta.total);

        // Fetch more pages in background if there are more
        let page = 2;
        while (page * 200 < res.meta.total + 200) {
          const next = await fetchPois({ limit: 200, page });
          if (cancelled) return;
          const nextPois = next.data.map(toDisplayPoi);
          if (nextPois.length === 0) break;
          setAllPois((prev) => [...prev, ...nextPois]);
          page++;
        }
      } catch {
        setAllPois(POIS as DisplayPoi[]);
        setTotal(POIS.length);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Browse-all paginated fetch
  const loadBrowsePage = useCallback(
    async (pageNum: number, reset = false) => {
      if (browseLoadingRef.current) return;
      browseLoadingRef.current = true;
      if (pageNum === 1) setBrowseLoading(true);
      else setBrowseLoadingMore(true);

      try {
        const res = await fetchPois({
          category: browseCategory !== 'all' ? browseCategory : undefined,
          search: browseSearch.trim() || undefined,
          page: pageNum,
          limit: PAGE_SIZE,
        });
        const newPois = res.data.map(toDisplayPoi);
        setBrowsePois((prev) => (reset ? newPois : [...prev, ...newPois]));
        setBrowseTotal(res.meta.total);
        setBrowseHasMore(pageNum * PAGE_SIZE < res.meta.total);
        setBrowsePage(pageNum);
      } catch {
        // silently fail
      } finally {
        setBrowseLoading(false);
        setBrowseLoadingMore(false);
        browseLoadingRef.current = false;
      }
    },
    [browseCategory, browseSearch],
  );

  useEffect(() => {
    setBrowsePois([]);
    setBrowsePage(1);
    setBrowseHasMore(true);
    loadBrowsePage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browseCategory, browseSearch]);

  const handleBrowseLoadMore = useCallback(() => {
    if (!browseLoadingRef.current && browseHasMore) {
      loadBrowsePage(browsePage + 1);
    }
  }, [browsePage, browseHasMore, loadBrowsePage]);

  const browseSentinelRef = useInfiniteScroll(handleBrowseLoadMore, {
    enabled: browseHasMore && !browseLoadingMore && !browseLoading,
  });

  const markers = useMemo(
    () => allPois.map((p) => ({ id: p.id, name: p.name, category: p.category, latitude: p.latitude, longitude: p.longitude })),
    [allPois],
  );

  // Mood-filtered section
  const moodFilteredRef = useRef<HTMLDivElement>(null);
  const moodPois = useMemo(() => {
    if (!activeMood) return [];
    return allPois.filter((p) => activeMood.includes(p.category));
  }, [allPois, activeMood]);

  const handleMoodSelect = (categories: string[]) => {
    setActiveMood(categories);
    setTimeout(() => moodFilteredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  return (
    <div className="flex flex-col gap-6 pb-24 animate-fade-in">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-rose-500 px-5 pb-6 pt-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">{getGreeting()}</p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">
                Where will today take you?
              </h1>
              <p className="mt-1 text-sm text-white/50">
                Timișoara · City of Roses
              </p>
            </div>
            <CompactWeather className="mt-1" />
          </div>
        </div>
      </div>

      {/* ── Mood tiles ── */}
      <section className="px-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MOOD_TILES.map((tile) => (
            <MoodTile key={tile.id} tile={tile} onSelect={handleMoodSelect} />
          ))}
        </div>
        {activeMood && (
          <button
            type="button"
            onClick={() => setActiveMood(null)}
            className="mt-2 text-xs font-semibold text-primary-500 hover:text-primary-600 transition"
          >
            Clear filter
          </button>
        )}
      </section>

      {/* ── Mood-filtered results ── */}
      {activeMood && (
        <section ref={moodFilteredRef} className="flex flex-col gap-3 px-5 animate-fade-in">
          <h2 className="text-base font-bold text-gray-900">
            {moodPois.length} places found
          </h2>
          {moodPois.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moodPois.slice(0, 30).map((poi) => (
                <CompactGridCard key={poi.id} poi={poi} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No places in this category yet.</p>
          )}
          {moodPois.length > 30 && (
            <p className="text-center text-xs text-gray-400">
              Showing 30 of {moodPois.length} — use Browse All below for the full list
            </p>
          )}
        </section>
      )}

      {/* ── Loading state ── */}
      {initialLoading && (
        <div className="px-5">
          <CardSkeleton variant="grid" count={6} />
        </div>
      )}

      {/* ── Curated sections (only when no mood filter) ── */}
      {!initialLoading && !activeMood && (
        <>
          {/* Featured landmarks */}
          <FeaturedCarousel pois={allPois} />

          {/* Time-aware suggestions */}
          <TimeSuggestions pois={allPois} />

          {/* Surprise me */}
          <SurpriseMe pois={allPois} onReveal={() => {}} />

          {/* Category carousels */}
          {EXPLORE_CATEGORIES.map((cat) => (
            <CategorySection key={cat} category={cat} pois={allPois} />
          ))}
        </>
      )}

      {/* ── Browse all ── */}
      {!initialLoading && (
        <BrowseAll
          pois={browsePois}
          total={browseTotal}
          loading={browseLoading}
          loadingMore={browseLoadingMore}
          hasMore={browseHasMore}
          sentinelRef={browseSentinelRef}
          search={browseSearch}
          onSearchChange={setBrowseSearch}
          activeCategory={browseCategory}
          onCategoryChange={setBrowseCategory}
        />
      )}

      {/* ── Floating map FAB ── */}
      <button
        type="button"
        onClick={() => setShowMap(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-elevated transition-all duration-200 hover:scale-105 hover:shadow-lg md:bottom-6 md:right-6"
        aria-label="Open map"
      >
        <MapIcon className="h-5 w-5 text-primary-500" />
      </button>

      {/* ── Full-screen map overlay ── */}
      {showMap && <MapOverlay markers={markers} onClose={() => setShowMap(false)} />}
    </div>
  );
}
