import type {
  ApiTransitDirection,
  ApiTransitLine,
  ApiTransitStop,
  ApiVehiclePosition,
} from '@/lib/api';

export type FilterType =
  | 'all'
  | 'tram'
  | 'bus'
  | 'trolleybus'
  | 'express'
  | 'metropolitan'
  | 'school'
  | 'vaporetto';
export type StopStatus = 'vehicleHere' | 'approaching';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface TransitStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status?: StopStatus;
  etaMinutes?: number;
}

export interface TransitVehicle {
  id: string;
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  headsign: string;
  isAccessible: boolean;
}

export interface TransitDirection {
  id: string;
  label: string;
  stops: TransitStop[];
  geometry?: Coordinate[];
  vehicles: TransitVehicle[];
}

export interface TransitLine {
  id: string;
  lineNumber: string;
  type: Exclude<FilterType, 'all'>;
  color: string;
  liveVehicles: number;
  directions: TransitDirection[];
}

interface StopAnnotation {
  vehicleHere: boolean;
  approaching?: boolean;
  roundTrip?: boolean;
  etaMinutes?: number;
  vehicleId?: string;
  vehicleSpeed?: number;
}

const TYPE_COLORS: Record<Exclude<FilterType, 'all'>, string> = {
  tram: '#E3A900',
  bus: '#4D897F',
  trolleybus: '#6F2095',
  express: '#F58134',
  metropolitan: '#0148A2',
  school: '#E31E25',
  vaporetto: '#2DB8C5',
};

function normalizeStopName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function directionLabel(name: string, lineNumber: string): string {
  const explicit = name.match(/^(Tur|Retur):\s*(.+?)\s*(?:=>|→|->)\s*(.+)$/i);
  if (explicit) return `${explicit[1]}: ${explicit[2].trim()} → ${explicit[3].trim()}`;
  const arrow = name.match(/:\s*(.+?)\s*(?:=>|→|->)\s*(.+)$/);
  if (arrow) return `${arrow[1].trim()} → ${arrow[2].trim()}`;
  const dash = name.match(/:\s*(.+?)\s*(?:—|-)\s*(.+)$/);
  if (dash) return `${dash[1].trim()} → ${dash[2].trim()}`;
  return name.replace(new RegExp(`^${lineNumber}:\\s*`), '').trim() || name;
}

function mapGeometry(geometry?: [number, number][]): Coordinate[] | undefined {
  if (!geometry?.length) return undefined;

  const normalized: Coordinate[] = [];
  for (const [latitude, longitude] of geometry) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const previous = normalized[normalized.length - 1];
    if (previous && previous.latitude === latitude && previous.longitude === longitude) {
      continue;
    }

    normalized.push({ latitude, longitude });
  }

  return normalized.length > 1 ? normalized : undefined;
}

function mapStop(stop: ApiTransitStop): TransitStop {
  return {
    id: stop.id,
    name: stop.name,
    latitude: stop.latitude,
    longitude: stop.longitude,
  };
}

function getDirectionId(lineId: string, direction: ApiTransitDirection, index: number) {
  const slug = direction.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${lineId}-${slug || index}`;
}

function toDisplay(line: ApiTransitLine): TransitLine {
  const directions = (line.directions?.length ? line.directions : [{
    name: line.name,
    stops: line.stops,
    geometry: line.geometry,
  }]).map((direction, index) => ({
    id: getDirectionId(line.id, direction, index),
    label: directionLabel(direction.name, line.lineNumber),
    stops: direction.stops.map(mapStop),
    geometry: mapGeometry(direction.geometry),
    vehicles: [],
  }));

  return {
    id: line.id,
    lineNumber: line.lineNumber,
    type: (line.type as TransitLine['type']) || 'bus',
    color: line.color || TYPE_COLORS[(line.type as TransitLine['type']) || 'bus'] || '#6b7280',
    liveVehicles: 0,
    directions,
  };
}

function deduplicateLines(lines: TransitLine[]): TransitLine[] {
  const byKey = new Map<string, TransitLine[]>();

  for (const line of lines) {
    const key = `${line.type}:${line.lineNumber}`;
    const variants = byKey.get(key) ?? [];
    variants.push(line);
    byKey.set(key, variants);
  }

  const deduped: TransitLine[] = [];
  for (const variants of byKey.values()) {
    const primary = variants[0];
    const seenDirections = new Set<string>();
    const directions: TransitDirection[] = [];

    for (const variant of variants) {
      for (const direction of variant.directions) {
        const key = `${direction.label}|${direction.stops.map((stop) => stop.id).join('|')}`;
        if (direction.stops.length > 0 && !seenDirections.has(key)) {
          seenDirections.add(key);
          directions.push(direction);
        }
      }
    }

    deduped.push({ ...primary, directions });
  }

  return deduped.sort((first, second) => {
    const a = parseInt(first.lineNumber, 10);
    const b = parseInt(second.lineNumber, 10);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return a - b;
    return first.lineNumber.localeCompare(second.lineNumber);
  });
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const radius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function headsignMatchesDirection(headsign: string, destinationStop: string): boolean {
  const normalizedHeadsign = normalizeStopName(headsign);
  const normalizedDestination = normalizeStopName(destinationStop);
  if (!normalizedHeadsign || !normalizedDestination) return false;
  return (
    normalizedHeadsign === normalizedDestination ||
    normalizedHeadsign.includes(normalizedDestination) ||
    normalizedDestination.includes(normalizedHeadsign)
  );
}

function routeMatchesLine(route: string, lineNumber: string): boolean {
  const normalize = (value: string) => value.toUpperCase().replace(/\s+/g, '');
  return normalize(route) === normalize(lineNumber);
}

function coordinatesNearStops(
  geometry: Coordinate[] | undefined,
  stops: TransitStop[],
): boolean {
  if (!geometry || geometry.length < 2 || stops.length < 2) return false;

  const sampledStops = [stops[0], stops[Math.floor(stops.length / 2)], stops[stops.length - 1]]
    .filter(Boolean);

  return sampledStops.every((stop) => {
    const nearest = geometry.reduce((best, point) => {
      const distance = haversineMeters(
        stop.latitude,
        stop.longitude,
        point.latitude,
        point.longitude,
      );
      return Math.min(best, distance);
    }, Number.POSITIVE_INFINITY);

    return nearest < 450;
  });
}

function fallbackGeometryFromStops(stops: TransitStop[]): Coordinate[] | undefined {
  if (stops.length < 2) return undefined;

  const deduped: Coordinate[] = [];
  for (const stop of stops) {
    const previous = deduped[deduped.length - 1];
    if (
      previous &&
      previous.latitude === stop.latitude &&
      previous.longitude === stop.longitude
    ) {
      continue;
    }

    deduped.push({ latitude: stop.latitude, longitude: stop.longitude });
  }

  return deduped.length > 1 ? deduped : undefined;
}

function vehiclesForDirection(
  vehicles: ApiVehiclePosition[],
  direction: TransitDirection,
): ApiVehiclePosition[] {
  const destination = direction.stops[direction.stops.length - 1]?.name ?? '';
  if (!destination) return [];

  const matched = vehicles.filter((vehicle) =>
    headsignMatchesDirection(vehicle.headsign, destination),
  );

  return matched;
}

function annotateStops(
  stops: TransitStop[],
  vehicles: ApiVehiclePosition[],
  oppositeStops?: TransitStop[],
  oppositeVehicles?: ApiVehiclePosition[],
): Map<number, StopAnnotation> {
  const annotations = new Map<number, StopAnnotation>();
  if (stops.length === 0) return annotations;
  if (vehicles.length === 0 && (!oppositeVehicles || oppositeVehicles.length === 0)) {
    return annotations;
  }

  const destination = stops[stops.length - 1]?.name ?? '';
  const directionVehicles = vehicles.filter((vehicle) =>
    headsignMatchesDirection(vehicle.headsign, destination),
  );

  const cumulativeDistances: number[] = [0];
  for (let index = 1; index < stops.length; index += 1) {
    cumulativeDistances[index] =
      cumulativeDistances[index - 1] +
      haversineMeters(
        stops[index - 1].latitude,
        stops[index - 1].longitude,
        stops[index].latitude,
        stops[index].longitude,
      );
  }

  const averageSpeedMs = 20 * (1000 / 3600);
  const dwellSeconds = 25;

  for (const vehicle of directionVehicles) {
    const normalizedVehicleStop = normalizeStopName(vehicle.stop);
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < stops.length; index += 1) {
      const normalizedStop = normalizeStopName(stops[index].name);
      if (normalizedStop === normalizedVehicleStop) {
        const distance = haversineMeters(
          vehicle.lat,
          vehicle.lng,
          stops[index].latitude,
          stops[index].longitude,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
    }

    if (bestIndex === -1 || bestDistance > 500) {
      for (let index = 0; index < stops.length; index += 1) {
        const distance = haversineMeters(
          vehicle.lat,
          vehicle.lng,
          stops[index].latitude,
          stops[index].longitude,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
    }

    if (bestIndex === -1) continue;

    if (bestIndex < stops.length - 1) {
      const currentStop = stops[bestIndex];
      const nextStop = stops[bestIndex + 1];
      const routeLat = nextStop.latitude - currentStop.latitude;
      const routeLng = nextStop.longitude - currentStop.longitude;
      const vehicleLat = vehicle.lat - currentStop.latitude;
      const vehicleLng = vehicle.lng - currentStop.longitude;
      const dot = routeLat * vehicleLat + routeLng * vehicleLng;
      if (dot > 0) {
        bestIndex += 1;
        bestDistance = haversineMeters(
          vehicle.lat,
          vehicle.lng,
          stops[bestIndex].latitude,
          stops[bestIndex].longitude,
        );
      }
    }

    const distanceToMatchedStop = haversineMeters(
      vehicle.lat,
      vehicle.lng,
      stops[bestIndex].latitude,
      stops[bestIndex].longitude,
    );
    const isAtStop = distanceToMatchedStop < 150 && vehicle.speed < 10;
    const immediateSpeedMs =
      vehicle.speed > 5
        ? Math.max(vehicle.speed * (1000 / 3600), averageSpeedMs * 0.6)
        : averageSpeedMs;

    if (isAtStop) {
      const existing = annotations.get(bestIndex);
      if (!existing || existing.etaMinutes !== undefined) {
        annotations.set(bestIndex, {
          vehicleHere: true,
          vehicleId: vehicle.id,
          vehicleSpeed: vehicle.speed,
        });
      }

      for (let index = bestIndex + 1; index < stops.length; index += 1) {
        const distanceAhead = cumulativeDistances[index] - cumulativeDistances[bestIndex];
        const travelSeconds = distanceAhead / averageSpeedMs;
        const dwell = (index - bestIndex - 1) * dwellSeconds;
        const etaMinutes = Math.round((travelSeconds + dwell) / 60);
        if (etaMinutes > 30) break;

        const previous = annotations.get(index);
        if (!previous || (previous.etaMinutes !== undefined && etaMinutes < previous.etaMinutes)) {
          annotations.set(index, {
            vehicleHere: false,
            etaMinutes,
            vehicleId: vehicle.id,
            vehicleSpeed: vehicle.speed,
          });
        }
      }
    } else {
      const etaToMatchedMinutes = Math.round((distanceToMatchedStop / immediateSpeedMs) / 60);
      if (etaToMatchedMinutes <= 30) {
        const previous = annotations.get(bestIndex);
        if (!previous || (previous.etaMinutes !== undefined && etaToMatchedMinutes < previous.etaMinutes)) {
          annotations.set(bestIndex, {
            vehicleHere: false,
            approaching: true,
            etaMinutes: etaToMatchedMinutes,
            vehicleId: vehicle.id,
            vehicleSpeed: vehicle.speed,
          });
        }
      }

      for (let index = bestIndex + 1; index < stops.length; index += 1) {
        const distanceAhead = distanceToMatchedStop + (cumulativeDistances[index] - cumulativeDistances[bestIndex]);
        const travelSeconds = distanceAhead / averageSpeedMs;
        const dwell = (index - bestIndex) * dwellSeconds;
        const etaMinutes = Math.round((travelSeconds + dwell) / 60);
        if (etaMinutes > 30) break;

        const previous = annotations.get(index);
        if (!previous || (previous.etaMinutes !== undefined && etaMinutes < previous.etaMinutes)) {
          annotations.set(index, {
            vehicleHere: false,
            etaMinutes,
            vehicleId: vehicle.id,
            vehicleSpeed: vehicle.speed,
          });
        }
      }
    }
  }

  if (oppositeStops && oppositeStops.length > 1 && oppositeVehicles && oppositeVehicles.length > 0) {
    const oppositeCumulativeDistances: number[] = [0];
    for (let index = 1; index < oppositeStops.length; index += 1) {
      oppositeCumulativeDistances[index] =
        oppositeCumulativeDistances[index - 1] +
        haversineMeters(
          oppositeStops[index - 1].latitude,
          oppositeStops[index - 1].longitude,
          oppositeStops[index].latitude,
          oppositeStops[index].longitude,
        );
    }

    const oppositeTotalDistance = oppositeCumulativeDistances[oppositeCumulativeDistances.length - 1];
    const turnaroundSeconds = 180;

    for (const vehicle of oppositeVehicles) {
      let oppositeIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let index = 0; index < oppositeStops.length; index += 1) {
        const distance = haversineMeters(
          vehicle.lat,
          vehicle.lng,
          oppositeStops[index].latitude,
          oppositeStops[index].longitude,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          oppositeIndex = index;
        }
      }

      const remainingDistance =
        bestDistance + (oppositeTotalDistance - oppositeCumulativeDistances[oppositeIndex]);
      const remainingStops = oppositeStops.length - 1 - oppositeIndex;
      const arrivalSeconds = remainingDistance / averageSpeedMs + remainingStops * dwellSeconds;

      for (let index = 0; index < stops.length; index += 1) {
        const existing = annotations.get(index);
        if (existing && (existing.vehicleHere || existing.approaching)) continue;

        const totalSeconds =
          index === 0
            ? arrivalSeconds
            : arrivalSeconds + turnaroundSeconds + (cumulativeDistances[index] / averageSpeedMs) + (index - 1) * dwellSeconds;
        const etaMinutes = Math.round(totalSeconds / 60);
        if (etaMinutes > 25) continue;

        if (!existing || (existing.etaMinutes !== undefined && etaMinutes < existing.etaMinutes)) {
          annotations.set(index, {
            vehicleHere: false,
            roundTrip: true,
            etaMinutes,
            vehicleId: vehicle.id,
            vehicleSpeed: vehicle.speed,
          });
        }
      }
    }
  }

  return annotations;
}

export function buildDisplayLines(
  apiLines: ApiTransitLine[],
  vehicles: ApiVehiclePosition[],
): TransitLine[] {
  const deduplicated = deduplicateLines(apiLines.map(toDisplay));

  return deduplicated.map((line) => {
    const lineVehicles = vehicles.filter((vehicle) => routeMatchesLine(vehicle.route, line.lineNumber));
    const liveVehicleIds = new Set(lineVehicles.map((vehicle) => vehicle.id));

    const directions = line.directions.map((direction, index) => {
      const directionVehicles = vehiclesForDirection(lineVehicles, direction);
      const oppositeDirection =
        line.directions.length > 1
          ? line.directions[(index + 1) % line.directions.length]
          : undefined;
      const oppositeVehicles = oppositeDirection
        ? vehiclesForDirection(lineVehicles, oppositeDirection)
        : undefined;
      const annotations = annotateStops(
        direction.stops,
        directionVehicles,
        oppositeDirection?.stops,
        oppositeVehicles,
      );

      const geometry = coordinatesNearStops(direction.geometry, direction.stops)
        ? direction.geometry
        : fallbackGeometryFromStops(direction.stops);

      return {
        ...direction,
        geometry,
        vehicles: directionVehicles.map((vehicle) => ({
          id: vehicle.id,
          latitude: vehicle.lat,
          longitude: vehicle.lng,
          bearing: vehicle.bearing,
          speed: vehicle.speed,
          headsign: vehicle.headsign,
          isAccessible: vehicle.isAccessible,
        })),
        stops: direction.stops.map((stop, stopIndex) => {
          const annotation = annotations.get(stopIndex);
          if (!annotation) return stop;

          const status: TransitStop['status'] = annotation.vehicleHere
            ? 'vehicleHere'
            : annotation.approaching
              ? 'approaching'
              : undefined;

          return {
            ...stop,
            status,
            etaMinutes: annotation.etaMinutes,
          };
        }),
      };
    });

    return {
      ...line,
      directions,
      liveVehicles: liveVehicleIds.size,
    };
  });
}
