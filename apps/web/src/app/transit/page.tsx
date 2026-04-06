'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Train,
  Bus,
  Zap,
  MapPin,
  ChevronDown,
  Loader2,
  ArrowRight,
  Navigation,
  Radio,
  ListTree,
} from 'lucide-react';
import { TRANSIT_LINES } from '@/data/mock';
import {
  fetchTransitLines,
  fetchVehiclePositions,
  type ApiTransitLine,
} from '@/lib/api';
import type { VehicleMarker } from '@/components/map/RouteMap';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { InfiniteScrollSentinel } from '@/components/ui/InfiniteScrollSentinel';
import { SearchBar } from '@/components/ui/SearchBar';
import { cn } from '@/lib/utils';

const RouteMap = dynamic(() => import('@/components/map/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full animate-pulse rounded-2xl bg-warm-200" />
  ),
});

type TransitType = 'all' | 'tram' | 'bus' | 'trolleybus';

const TYPE_ICONS: Record<string, typeof Train> = {
  tram: Train,
  bus: Bus,
  trolleybus: Zap,
};

const TYPE_LABELS: Record<string, string> = {
  tram: 'Tram',
  bus: 'Bus',
  trolleybus: 'Trolleybus',
};

const CHUNK_SIZE = 20;

interface DisplayStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface DisplayDirection {
  name: string;
  label: string;
  stops: DisplayStop[];
  geometry?: [number, number][];
}

interface DisplayLine {
  id: string;
  lineNumber: string;
  type: string;
  name: string;
  color: string;
  stops: DisplayStop[];
  directions: DisplayDirection[];
}

function directionLabel(name: string, lineNumber: string): string {
  const arrow = name.match(/:\s*(.+?)\s*(?:=>|→|->)\s*(.+)$/);
  if (arrow) return `${arrow[1].trim()} → ${arrow[2].trim()}`;
  const dash = name.match(/:\s*(.+?)\s*(?:—|-)\s*(.+)$/);
  if (dash) return `${dash[1].trim()} → ${dash[2].trim()}`;
  return name.replace(new RegExp(`^${lineNumber}:\\s*`), '');
}

function directionEndpoints(dir: DisplayDirection): { from: string; to: string } | null {
  if (dir.stops.length < 2) return null;
  return { from: dir.stops[0].name, to: dir.stops[dir.stops.length - 1].name };
}

function toDisplay(line: ApiTransitLine): DisplayLine {
  const mapStops = (stops: ApiTransitLine['stops']): DisplayStop[] =>
    stops.map((s) => ({ id: s.id, name: s.name, latitude: s.latitude, longitude: s.longitude }));

  const directions: DisplayDirection[] = (line.directions ?? []).map((d) => ({
    name: d.name,
    label: directionLabel(d.name, line.lineNumber),
    stops: mapStops(d.stops),
    geometry: d.geometry,
  }));

  if (directions.length === 0) {
    directions.push({
      name: line.name,
      label: line.name,
      stops: mapStops(line.stops),
      geometry: line.geometry,
    });
  }

  return {
    id: line.id,
    lineNumber: line.lineNumber,
    type: line.type,
    name: line.name,
    color: line.color ?? '#6b7280',
    stops: mapStops(line.stops),
    directions,
  };
}

function deduplicateLines(lines: DisplayLine[]): DisplayLine[] {
  const byKey = new Map<string, DisplayLine[]>();
  for (const line of lines) {
    const key = `${line.type}:${line.lineNumber}`;
    const arr = byKey.get(key) ?? [];
    arr.push(line);
    byKey.set(key, arr);
  }

  const deduped: DisplayLine[] = [];
  for (const variants of byKey.values()) {
    const primary = variants[0];
    const allDirections: DisplayDirection[] = [];
    const seenKeys = new Set<string>();

    for (const variant of variants) {
      for (const dir of variant.directions) {
        const key = dir.stops.map((s) => s.name).join('|');
        if (!seenKeys.has(key) && dir.stops.length > 0) {
          seenKeys.add(key);
          allDirections.push(dir);
        }
      }
    }

    deduped.push({ ...primary, directions: allDirections });
  }

  deduped.sort((a, b) => {
    const aNum = parseInt(a.lineNumber, 10);
    const bNum = parseInt(b.lineNumber, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return a.lineNumber.localeCompare(b.lineNumber);
  });

  return deduped;
}

/* ────────────────────────── Vehicle → Stop Matching ────────────────────────── */

function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeStopName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ăâ]/g, 'a')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[îâ]/g, 'i')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

interface StopAnnotation {
  vehicleHere: boolean;
  approaching?: boolean;
  roundTrip?: boolean;
  vehicleId?: string;
  etaMinutes?: number;
  vehicleSpeed?: number;
}

function headsignMatchesDirection(
  headsign: string,
  destinationStop: string,
): boolean {
  const hNorm = normalizeStopName(headsign);
  const dNorm = normalizeStopName(destinationStop);
  if (!hNorm || !dNorm) return false;
  return hNorm === dNorm || hNorm.includes(dNorm) || dNorm.includes(hNorm);
}

function annotateStops(
  stops: DisplayStop[],
  vehicles: VehicleMarker[],
  oppositeStops?: DisplayStop[],
  oppositeVehicles?: VehicleMarker[],
): Map<number, StopAnnotation> {
  const annotations = new Map<number, StopAnnotation>();
  if (stops.length === 0) return annotations;
  if (vehicles.length === 0 && (!oppositeVehicles || oppositeVehicles.length === 0))
    return annotations;

  // Only include vehicles whose headsign matches this direction's destination
  const destination = stops[stops.length - 1].name;
  const dirVehicles = vehicles.filter((v) =>
    headsignMatchesDirection(v.headsign, destination),
  );

  const cumulDist: number[] = [0];
  for (let i = 1; i < stops.length; i++) {
    cumulDist[i] =
      cumulDist[i - 1] +
      haversineMeters(
        stops[i - 1].latitude, stops[i - 1].longitude,
        stops[i].latitude, stops[i].longitude,
      );
  }

  const AVG_SPEED_MS = 20 * (1000 / 3600); // 20 km/h fallback

  for (const v of dirVehicles) {
    const vNorm = normalizeStopName(v.stop);
    let bestIdx = -1;
    let bestDist = Infinity;

    // 1. Exact name match (after normalization)
    for (let i = 0; i < stops.length; i++) {
      const sNorm = normalizeStopName(stops[i].name);
      if (sNorm === vNorm) {
        const d = haversineMeters(v.lat, v.lng, stops[i].latitude, stops[i].longitude);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
    }

    // 2. Substring match — only if within 500m (avoids false matches like
    //    "Calea Șagului" matching "Pod Calea Șagului" across the city)
    if (bestIdx === -1 || bestDist > 500) {
      let subIdx = -1;
      let subDist = Infinity;
      for (let i = 0; i < stops.length; i++) {
        const sNorm = normalizeStopName(stops[i].name);
        if (sNorm !== vNorm && (sNorm.includes(vNorm) || vNorm.includes(sNorm))) {
          const d = haversineMeters(v.lat, v.lng, stops[i].latitude, stops[i].longitude);
          if (d < subDist && d < 500) {
            subDist = d;
            subIdx = i;
          }
        }
      }
      if (subIdx !== -1 && subDist < bestDist) {
        bestIdx = subIdx;
        bestDist = subDist;
      }
    }

    // 3. Fallback: closest stop by GPS proximity
    if (bestIdx === -1 || bestDist > 500) {
      for (let i = 0; i < stops.length; i++) {
        const d = haversineMeters(v.lat, v.lng, stops[i].latitude, stops[i].longitude);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
    }

    if (bestIdx === -1) continue;

    // Route-progression correction: use a dot-product to check if the
    // vehicle is PAST the matched stop (on the far side heading toward
    // the next stop). Pure distance fails when the vehicle just left a
    // stop but is still closer to it than to the next one.
    if (bestIdx < stops.length - 1) {
      const A = stops[bestIdx];
      const B = stops[bestIdx + 1];
      // Vector A→B (route direction)
      const abLat = B.latitude - A.latitude;
      const abLng = B.longitude - A.longitude;
      // Vector A→Vehicle
      const avLat = v.lat - A.latitude;
      const avLng = v.lng - A.longitude;
      // Positive dot product means the vehicle is past A toward B
      const dot = abLat * avLat + abLng * avLng;
      if (dot > 0) {
        bestIdx = bestIdx + 1;
        bestDist = haversineMeters(v.lat, v.lng, stops[bestIdx].latitude, stops[bestIdx].longitude);
      }
    }

    const distToMatchedStop = haversineMeters(
      v.lat, v.lng,
      stops[bestIdx].latitude, stops[bestIdx].longitude,
    );
    // Wider thresholds to prevent flip-flopping between "At stop" and
    // "Approaching" due to GPS jitter and speed fluctuations between polls
    const isAtStop = distToMatchedStop < 150 && v.speed < 10;

    // Always use average speed for projecting future ETAs — instantaneous
    // speed is too noisy (0 at stop, 8 while crawling) and causes large swings
    const DWELL_SEC = 25;

    // For the immediate next stop, blend actual speed with average to smooth out
    const immediateSpeedMs =
      v.speed > 5
        ? Math.max(v.speed * (1000 / 3600), AVG_SPEED_MS * 0.6)
        : AVG_SPEED_MS;

    if (isAtStop) {
      const existing = annotations.get(bestIdx);
      if (!existing || existing.etaMinutes !== undefined) {
        annotations.set(bestIdx, {
          vehicleHere: true,
          vehicleId: v.id,
          vehicleSpeed: v.speed,
        });
      }

      for (let i = bestIdx + 1; i < stops.length; i++) {
        const distAhead = cumulDist[i] - cumulDist[bestIdx];
        const travelSec = distAhead / AVG_SPEED_MS;
        const dwellSec = (i - bestIdx - 1) * DWELL_SEC;
        const etaMin = Math.round((travelSec + dwellSec) / 60);
        if (etaMin > 30) break;

        const prev = annotations.get(i);
        if (!prev || (prev.etaMinutes !== undefined && etaMin < prev.etaMinutes)) {
          annotations.set(i, {
            vehicleHere: false,
            vehicleId: v.id,
            etaMinutes: etaMin,
            vehicleSpeed: v.speed,
          });
        }
      }
    } else {
      const etaToMatchedSec = distToMatchedStop / immediateSpeedMs;
      const etaToMatchedMin = Math.round(etaToMatchedSec / 60);

      if (etaToMatchedMin <= 30) {
        const prev = annotations.get(bestIdx);
        if (!prev || (prev.etaMinutes !== undefined && etaToMatchedMin < prev.etaMinutes)) {
          annotations.set(bestIdx, {
            vehicleHere: false,
            approaching: true,
            vehicleId: v.id,
            etaMinutes: etaToMatchedMin,
            vehicleSpeed: v.speed,
          });
        }
      }

      // Future stops: use average speed for consistent ETAs
      for (let i = bestIdx + 1; i < stops.length; i++) {
        const distAhead = distToMatchedStop + (cumulDist[i] - cumulDist[bestIdx]);
        const travelSec = distAhead / AVG_SPEED_MS;
        const dwellSec = (i - bestIdx) * DWELL_SEC;
        const etaMin = Math.round((travelSec + dwellSec) / 60);
        if (etaMin > 30) break;

        const prev = annotations.get(i);
        if (!prev || (prev.etaMinutes !== undefined && etaMin < prev.etaMinutes)) {
          annotations.set(i, {
            vehicleHere: false,
            vehicleId: v.id,
            etaMinutes: etaMin,
            vehicleSpeed: v.speed,
          });
        }
      }
    }
  }

  // Round-trip ETAs: opposite-direction vehicles that will turn around
  if (oppositeStops && oppositeStops.length > 1 && oppositeVehicles && oppositeVehicles.length > 0) {
    const oppCumul: number[] = [0];
    for (let i = 1; i < oppositeStops.length; i++) {
      oppCumul[i] =
        oppCumul[i - 1] +
        haversineMeters(
          oppositeStops[i - 1].latitude, oppositeStops[i - 1].longitude,
          oppositeStops[i].latitude, oppositeStops[i].longitude,
        );
    }
    const oppTotalDist = oppCumul[oppCumul.length - 1];
    const TURNAROUND_SEC = 180;
    const DWELL_SEC = 25;

    for (const v of oppositeVehicles) {
      // Find vehicle position along opposite direction by GPS proximity
      let oppIdx = 0;
      let oppBestDist = Infinity;
      for (let i = 0; i < oppositeStops.length; i++) {
        const d = haversineMeters(v.lat, v.lng, oppositeStops[i].latitude, oppositeStops[i].longitude);
        if (d < oppBestDist) {
          oppBestDist = d;
          oppIdx = i;
        }
      }

      // Use consistent average speed for round-trip projections
      const remainingOppDist = oppBestDist + (oppTotalDist - oppCumul[oppIdx]);
      const remainingOppStops = oppositeStops.length - 1 - oppIdx;
      const arrivalSec = remainingOppDist / AVG_SPEED_MS + remainingOppStops * DWELL_SEC;

      for (let i = 0; i < stops.length; i++) {
        const existing = annotations.get(i);
        if (existing && (existing.vehicleHere || existing.approaching)) continue;

        // Stop 0 (terminal) = bus physically arrives here from the opposite
        // trip — no turnaround needed for the passenger waiting there.
        // Stops 1+ = bus departs terminal after turnaround then travels.
        let totalSec: number;
        if (i === 0) {
          totalSec = arrivalSec;
        } else {
          const distOnCurrentDir = cumulDist[i];
          const travelSec = distOnCurrentDir / AVG_SPEED_MS;
          const dwellSec = (i - 1) * DWELL_SEC;
          totalSec = arrivalSec + TURNAROUND_SEC + travelSec + dwellSec;
        }
        const etaMin = Math.round(totalSec / 60);

        if (etaMin > 25) continue;

        if (!existing || (existing.etaMinutes !== undefined && etaMin < existing.etaMinutes)) {
          annotations.set(i, {
            vehicleHere: false,
            roundTrip: true,
            vehicleId: v.id,
            etaMinutes: etaMin,
            vehicleSpeed: v.speed,
          });
        }
      }
    }
  }

  return annotations;
}

/* ────────────────────────── Stops List ────────────────────────── */

function StopBadge({ annotation, color }: { annotation: StopAnnotation; color: string }) {
  if (annotation.vehicleHere) {
    return (
      <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
        </span>
        {annotation.vehicleSpeed !== undefined && annotation.vehicleSpeed > 0
          ? `${annotation.vehicleSpeed} km/h`
          : 'At stop'}
      </span>
    );
  }

  if (annotation.approaching && annotation.etaMinutes !== undefined) {
    const label =
      annotation.etaMinutes < 1 ? 'Arriving' : `~${annotation.etaMinutes} min`;
    return (
      <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
        {label}
      </span>
    );
  }

  if (annotation.roundTrip && annotation.etaMinutes !== undefined) {
    const label = `~${annotation.etaMinutes} min`;
    return (
      <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400">
        <svg className="h-2.5 w-2.5 opacity-60" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4" strokeLinecap="round" />
          <path d="M12 2v2.5h-2.5M4 14v-2.5h2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </span>
    );
  }

  if (annotation.etaMinutes !== undefined) {
    const label =
      annotation.etaMinutes < 1
        ? '< 1 min'
        : `~${annotation.etaMinutes} min`;
    return (
      <span
        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: color + '12', color: color }}
      >
        {label}
      </span>
    );
  }

  return null;
}

function StopsList({
  stops,
  color,
  vehicles,
  oppositeStops,
  oppositeVehicles,
}: {
  stops: DisplayStop[];
  color: string;
  vehicles: VehicleMarker[];
  oppositeStops?: DisplayStop[];
  oppositeVehicles?: VehicleMarker[];
}) {
  const [open, setOpen] = useState(false);
  const prevRef = useRef<Map<number, StopAnnotation>>(new Map());

  const rawAnnotations = useMemo(
    () => annotateStops(stops, vehicles, oppositeStops, oppositeVehicles),
    [stops, vehicles, oppositeStops, oppositeVehicles],
  );

  // Temporal smoothing: prevent "At stop" → "Approaching" flip-flops for
  // the same vehicle at the same stop between polls, but release stale
  // state when the vehicle has genuinely advanced to a later stop
  const annotations = useMemo(() => {
    const prev = prevRef.current;
    const smoothed = new Map(rawAnnotations);

    // Build a map of where each vehicle is NOW in the raw data
    const vehicleCurrentStop = new Map<string, number>();
    for (const [idx, ann] of rawAnnotations) {
      if (ann.vehicleId && (ann.vehicleHere || ann.approaching)) {
        const existing = vehicleCurrentStop.get(ann.vehicleId);
        if (existing === undefined || idx > existing) {
          vehicleCurrentStop.set(ann.vehicleId, idx);
        }
      }
    }

    for (const [idx, prevAnn] of prev) {
      if (!prevAnn.vehicleHere || !prevAnn.vehicleId) continue;

      // If this vehicle is now matched to a LATER stop, it has moved on —
      // don't pin the old "At stop" state
      const currentIdx = vehicleCurrentStop.get(prevAnn.vehicleId);
      if (currentIdx !== undefined && currentIdx > idx) continue;

      const curr = smoothed.get(idx);
      if (
        curr &&
        curr.approaching &&
        !curr.vehicleHere &&
        curr.vehicleId === prevAnn.vehicleId
      ) {
        smoothed.set(idx, { ...prevAnn });
      }
    }

    prevRef.current = smoothed;
    return smoothed;
  }, [rawAnnotations]);

  if (stops.length === 0) return null;

  const vehicleCount = [...annotations.values()].filter((a) => a.vehicleHere).length;
  const hasDirectVehicles = vehicles.length > 0;
  const hasRoundTripOnly = !hasDirectVehicles && annotations.size > 0;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-gray-500 transition-colors hover:bg-warm-100/60"
      >
        <ListTree className="h-3.5 w-3.5" style={{ color }} />
        <span>{stops.length} stops</span>
        {vehicleCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            {vehicleCount} en route
          </span>
        )}
        {!hasDirectVehicles && (
          <span className="text-[10px] font-medium text-gray-300">
            No vehicles on this direction
          </span>
        )}
        <ChevronDown
          className={cn(
            'ml-auto h-3.5 w-3.5 text-gray-300 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'transit-stops-collapse',
          open ? 'transit-stops-open' : 'transit-stops-closed',
        )}
      >
        <div className="relative ml-[18px] border-l-2 pb-1 pt-1" style={{ borderColor: color + '25' }}>
          {stops.map((stop, idx) => {
            const isTerminal = idx === 0 || idx === stops.length - 1;
            const annotation = annotations.get(idx);

            return (
              <div
                key={`${stop.id}-${idx}`}
                className={cn(
                  'relative flex items-center gap-3 pl-4',
                  isTerminal ? 'py-1.5' : 'py-1',
                  annotation?.vehicleHere && 'rounded-r-lg bg-green-50/60',
                  annotation?.approaching && !annotation?.vehicleHere && 'rounded-r-lg bg-amber-50/50',
                )}
              >
                {/* Stop dot */}
                {isTerminal ? (
                  <span
                    className="absolute -left-[5px] top-1/2 -translate-y-1/2 block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 0 2px ${color}30, 0 0 0 3px white`,
                    }}
                  />
                ) : annotation?.vehicleHere ? (
                  <span
                    className="absolute -left-[6px] top-1/2 -translate-y-1/2 block h-3 w-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                ) : annotation?.approaching ? (
                  <span
                    className="absolute -left-[6px] top-1/2 -translate-y-1/2 block h-3 w-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: '#f59e0b' }}
                  />
                ) : (
                  <span
                    className="absolute -left-[4px] top-1/2 -translate-y-1/2 block h-[7px] w-[7px] rounded-full"
                    style={{ backgroundColor: annotation?.etaMinutes !== undefined ? color : color + '90' }}
                  />
                )}

                {/* Stop name */}
                <span
                  className={cn(
                    'block min-w-0 truncate',
                    isTerminal ? 'text-[13px] font-semibold text-gray-900' : 'text-[12px] text-gray-500',
                    annotation?.vehicleHere && !isTerminal && 'font-medium text-gray-700',
                    annotation?.approaching && !isTerminal && 'font-medium text-amber-700',
                  )}
                >
                  {stop.name}
                </span>

                {/* ETA / vehicle badge */}
                {annotation && <StopBadge annotation={annotation} color={color} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Line Card ────────────────────────── */

function LineCard({
  line,
  expanded,
  onToggle,
  dirIdx,
  onDirChange,
  vehicles,
}: {
  line: DisplayLine;
  expanded: boolean;
  onToggle: () => void;
  dirIdx: number;
  onDirChange: (idx: number) => void;
  vehicles: VehicleMarker[];
}) {
  const TypeIcon = TYPE_ICONS[line.type] ?? Bus;
  const dirs = line.directions;
  const currentDir = dirs[dirIdx] ?? dirs[0];
  const endpoints = currentDir ? directionEndpoints(currentDir) : null;
  const cardRef = useRef<HTMLDivElement>(null);

  const oppositeDir = dirs.length > 1 ? dirs[dirIdx === 0 ? 1 : 0] : null;

  // Filter vehicles to only those matching the current direction's destination
  const dirVehicles = useMemo(() => {
    if (!currentDir || vehicles.length === 0) return [];
    const dest = currentDir.stops[currentDir.stops.length - 1]?.name;
    if (!dest) return vehicles;
    return vehicles.filter((v) => headsignMatchesDirection(v.headsign, dest));
  }, [vehicles, currentDir]);

  // Vehicles on the opposite direction (for round-trip ETAs)
  const oppVehicles = useMemo(() => {
    if (!oppositeDir || vehicles.length === 0) return [];
    const oppDest = oppositeDir.stops[oppositeDir.stops.length - 1]?.name;
    if (!oppDest) return [];
    return vehicles.filter((v) => headsignMatchesDirection(v.headsign, oppDest));
  }, [vehicles, oppositeDir]);

  useEffect(() => {
    if (expanded && cardRef.current) {
      const y = cardRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [expanded]);

  return (
    <div
      ref={cardRef}
      onClick={onToggle}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300',
        expanded
          ? 'border-gray-200/80 bg-white shadow-elevated'
          : 'border-white/60 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      {/* Color accent bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 transition-all duration-300',
          expanded ? 'w-1.5 rounded-l-2xl' : 'rounded-l-2xl',
        )}
        style={{ backgroundColor: line.color }}
      />

      {/* ── Collapsed header ── */}
      <div className="flex items-center gap-3.5 py-3.5 pl-5 pr-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, ${line.color}, ${line.color}dd)`,
          }}
        >
          {line.lineNumber}
        </span>

        <div className="min-w-0 flex-1">
          {/* Route endpoint summary */}
          {endpoints ? (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <span className="truncate">{endpoints.from}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-gray-300" />
              <span className="truncate">{endpoints.to}</span>
            </div>
          ) : (
            <p className="truncate text-sm font-semibold text-gray-900">{line.name}</p>
          )}

          <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
            <TypeIcon className="h-3 w-3" />
            <span className="font-medium uppercase tracking-wide">
              {TYPE_LABELS[line.type] ?? line.type}
            </span>
            <span className="text-gray-200">·</span>
            <span>{currentDir?.stops.length ?? 0} stops</span>
            {dirVehicles.length > 0 && (
              <>
                <span className="text-gray-200">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-green-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                  {dirVehicles.length} live
                </span>
              </>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            'h-4.5 w-4.5 shrink-0 text-gray-300 transition-transform duration-300',
            expanded && 'rotate-180',
          )}
        />
      </div>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="animate-fade-in border-t border-gray-100">
          {/* Direction segmented control */}
          {dirs.length > 1 && (
            <div className="flex gap-1 bg-warm-50/50 p-2">
              {dirs.map((dir, i) => {
                const ep = directionEndpoints(dir);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDirChange(i);
                    }}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all duration-200',
                      dirIdx === i
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600',
                    )}
                  >
                    <Navigation
                      className="h-3 w-3 shrink-0"
                      style={dirIdx === i ? { color: line.color } : undefined}
                    />
                    <span className="truncate">
                      {ep ? `${ep.from} → ${ep.to}` : dir.label || `Dir ${i + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Hero map with vehicle count overlay */}
          {currentDir && currentDir.stops.length > 1 && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <RouteMap
                key={`${line.id}-${dirIdx}`}
                stops={currentDir.stops}
                color={line.color}
                geometry={currentDir.geometry}
                vehicles={dirVehicles}
                className="!rounded-none !h-[260px]"
              />

              {/* Vehicle count chip on map */}
              {dirVehicles.length > 0 && (
                <div className="absolute right-3 top-3 z-[500] flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow-md backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <span className="text-gray-700">
                    {dirVehicles.length} vehicle{dirVehicles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Stops collapsible list */}
          <div className="px-4 pb-3">
            {currentDir && currentDir.stops.length > 0 && (
              <StopsList
                stops={currentDir.stops}
                color={line.color}
                vehicles={dirVehicles}
                oppositeStops={oppositeDir?.stops}
                oppositeVehicles={oppVehicles}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function TransitPage() {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<TransitType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeDir, setActiveDir] = useState<Record<string, number>>({});
  const [allLines, setAllLines] = useState<DisplayLine[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [source, setSource] = useState('mock');
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const [vehicles, setVehicles] = useState<VehicleMarker[]>([]);

  useEffect(() => {
    fetchTransitLines()
      .then((data) => {
        if (data.length > 0) {
          setAllLines(deduplicateLines(data.map(toDisplay)));
          setSource('api');
        } else {
          setAllLines(TRANSIT_LINES as DisplayLine[]);
        }
      })
      .catch(() => {
        setAllLines(TRANSIT_LINES as DisplayLine[]);
      })
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (!expandedId) {
      setVehicles([]);
      return;
    }
    const line = allLines.find((l) => l.id === expandedId);
    if (!line) return;

    let cancelled = false;

    const load = () => {
      fetchVehiclePositions(line.lineNumber)
        .then((data) => {
          if (cancelled) return;
          setVehicles(
            data.map((v) => ({
              id: v.id,
              lat: v.lat,
              lng: v.lng,
              bearing: v.bearing,
              speed: v.speed,
              headsign: v.headsign,
              stop: v.stop,
            })),
          );
        })
        .catch(() => {
          if (!cancelled) setVehicles([]);
        });
    };

    load();
    const interval = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [expandedId, allLines]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allLines.length, tram: 0, bus: 0, trolleybus: 0 };
    for (const l of allLines) {
      if (l.type in counts) counts[l.type]++;
    }
    return counts;
  }, [allLines]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allLines.filter((line) => {
      const matchesType = activeType === 'all' || line.type === activeType;
      const matchesSearch =
        !q ||
        line.name.toLowerCase().includes(q) ||
        line.lineNumber.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [search, activeType, allLines]);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [search, activeType]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filtered.length));
  }, [filtered.length]);

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    enabled: hasMore && !initialLoading,
  });

  const TABS: { value: TransitType; label: string; icon: typeof Train }[] = [
    { value: 'all', label: 'All', icon: MapPin },
    { value: 'tram', label: 'Trams', icon: Train },
    { value: 'bus', label: 'Buses', icon: Bus },
    { value: 'trolleybus', label: 'Trolley', icon: Zap },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/20">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Public Transport</h1>
            {!initialLoading && (
              <p className="text-[12px] text-gray-400">
                {allLines.length} routes · Timișoara
              </p>
            )}
          </div>
          <span className="flex items-center gap-2">
            {initialLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            {source !== 'mock' && !initialLoading && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
                <Radio className="h-3 w-3" />
                Live GPS
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── Search ── */}
      <SearchBar
        placeholder="Search lines, routes or stops..."
        value={search}
        onChange={setSearch}
        className="mb-4"
      />

      {/* ── Filter tabs ── */}
      <div className="mb-5 flex gap-1.5 rounded-xl bg-warm-100/60 p-1 backdrop-blur-sm">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveType(value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold transition-all duration-200',
              activeType === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
            <span
              className={cn(
                'ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
                activeType === value
                  ? 'bg-primary-50 text-primary-600'
                  : 'bg-warm-200/60 text-gray-400',
              )}
            >
              {typeCounts[value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {initialLoading ? (
        <CardSkeleton variant="line" count={8} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-200/50">
                <Bus className="h-7 w-7 text-warm-400" />
              </div>
              <p className="text-sm font-medium text-gray-400">No routes match your search</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveType('all');
                }}
                className="text-xs font-semibold text-primary-500 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {visible.map((line) => {
            const expanded = expandedId === line.id;
            const dirIdx = activeDir[line.id] ?? 0;

            return (
              <LineCard
                key={line.id}
                line={line}
                expanded={expanded}
                onToggle={() => setExpandedId(expanded ? null : line.id)}
                dirIdx={dirIdx}
                onDirChange={(i) => setActiveDir((prev) => ({ ...prev, [line.id]: i }))}
                vehicles={expanded ? vehicles : []}
              />
            );
          })}

          {visible.length > 0 && (
            <InfiniteScrollSentinel
              sentinelRef={sentinelRef}
              loading={false}
              hasMore={hasMore}
              total={filtered.length}
              loaded={visible.length}
            />
          )}
        </div>
      )}
    </div>
  );
}
