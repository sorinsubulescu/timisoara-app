import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { PrismaService } from '../prisma.service';
import { SyncService } from './sync.service';

export interface TransitDirectionDto {
  name: string;
  stops: TransitStopDto[];
  geometry?: [number, number][];
}

export interface TransitLineDto {
  id: string;
  lineNumber: string;
  type: string;
  name: string;
  color: string | null;
  stops: TransitStopDto[];
  directions: TransitDirectionDto[];
  geometry?: [number, number][];
  source?: string;
}

export interface TransitStopDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
}

const CACHE_TTL = 300; // 5 min — DB is the durable store
const STPT_BASE_URL = 'https://live.stpt.ro';
const STPT_SOURCE = 'stpt-live';

const STPT_LABEL_TYPE_MAP: Record<string, string> = {
  tramvai: 'tram',
  troleibuz: 'trolleybus',
  autobuz: 'bus',
  'autobuz urban': 'bus',
  expres: 'express',
  metropolitan: 'metropolitan',
  'școlar': 'school',
  scolar: 'school',
  vaporetto: 'vaporetto',
};

const TYPE_COLORS: Record<string, string> = {
  tram: '#E3A900',
  trolleybus: '#6F2095',
  bus: '#4D897F',
  express: '#F58134',
  school: '#E31E25',
  metropolitan: '#0148A2',
  vaporetto: '#2DB8C5',
};

interface ExternalTransitLine {
  osmId: bigint;
  lineNumber: string;
  type: string;
  name: string;
  color: string;
  stops: Array<{ osmId: bigint; name: string; latitude: number; longitude: number; stopOrder: number }>;
  geometry: [number, number][];
}

interface StptLineGroup {
  label: string;
  type: string;
  lineNumbers: string[];
  color: string;
}

interface StptDirectionPayload {
  ids?: string[];
  stations?: string[];
  coords?: Array<[number, number]>;
}

interface GeoJsonFeatureCollection {
  type?: string;
  features?: GeoJsonFeature[];
}

interface GeoJsonFeature {
  geometry?: GeoJsonGeometry | null;
}

type GeoJsonGeometry =
  | { type: 'LineString'; coordinates?: Array<[number, number]> }
  | { type: 'MultiLineString'; coordinates?: Array<Array<[number, number]>> }
  | { type: string; coordinates?: unknown };

@Injectable()
export class TransitGtfsService {
  private readonly logger = new Logger(TransitGtfsService.name);

  constructor(
    private cache: CacheService,
    private prisma: PrismaService,
    private sync: SyncService,
  ) {}

  async getAllLines(type?: string): Promise<TransitLineDto[]> {
    const cacheKey = `transit:lines:${type ?? 'all'}`;
    return this.cache.getOrFetch(cacheKey, CACHE_TTL, () => this.resolveLines(type));
  }

  async getLine(id: string): Promise<TransitLineDto | null> {
    const all = await this.getAllLines();
    return all.find((l) => l.id === id) ?? null;
  }

  async getAllStops(): Promise<TransitStopDto[]> {
    return this.cache.getOrFetch('transit:stops', CACHE_TTL, async () => {
      const dbStops = await this.prisma.transitStop.findMany({
        where: { source: STPT_SOURCE },
        orderBy: { name: 'asc' },
      });
      if (dbStops.length > 0) {
        return dbStops.map((s: { id: string; name: string; latitude: number; longitude: number }) => ({
          id: s.id,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          stopOrder: 0,
        }));
      }

      try {
        const stops = await this.fetchStopsFromStpt();
        if (stops.length > 0) {
          this.logger.log(`STPT live returned ${stops.length} transit stops`);
          return stops;
        }
      } catch (err) {
        this.logger.warn(`STPT live stops fetch failed: ${err}`);
      }
      return [];
    });
  }

  /**
   * Main resolution logic:
   * 1. Read from DB
   * 2. If stale or empty, try fetching from STPT live and sync to DB
   * 3. If STPT live fails, return whatever DB has
   */
  private async resolveLines(type?: string): Promise<TransitLineDto[]> {
    const dbLines = await this.fetchFromDb(type);
    const isFresh = await this.sync.isFresh('transitLine', STPT_SOURCE);
    const geometryNeedsRefresh = this.needsGeometryRefresh(dbLines);

    if (dbLines.length > 0 && isFresh && !geometryNeedsRefresh) {
      this.logger.log(`Serving ${dbLines.length} transit lines from fresh DB`);
      return dbLines;
    }

    if (geometryNeedsRefresh) {
      this.logger.log('Detected legacy stop-based transit geometry in DB — refreshing from STPT route GeoJSON');
    }

    try {
      const stptRaw = await this.fetchFromStpt(type);
      if (stptRaw.length > 0) {
        this.logger.log(`STPT live returned ${stptRaw.length} transit route variants — syncing to DB`);
        this.sync.syncTransitLines(stptRaw, STPT_SOURCE).catch((err) =>
          this.logger.error(`Background transit sync failed: ${err}`),
        );
        return this.externalLinesToDtos(stptRaw);
      }
    } catch (err) {
      this.logger.warn(`STPT live transit fetch failed: ${err}`);
    }

    if (dbLines.length > 0) {
      this.logger.log(`Serving ${dbLines.length} stale transit lines from DB`);
      return dbLines;
    }

    return [];
  }

  private async fetchFromStpt(type?: string): Promise<ExternalTransitLine[]> {
    const groups = await this.fetchStptGroups();
    const filteredGroups = type ? groups.filter((group) => group.type === type) : groups;
    const variants = await Promise.all(
      filteredGroups.flatMap((group) =>
        group.lineNumbers.map((lineNumber) => this.fetchStptLineVariants(group, lineNumber)),
      ),
    );

    return variants.flat().sort((a, b) => this.compareLineNumbers(a.lineNumber, b.lineNumber));
  }

  private externalLinesToDtos(raw: ExternalTransitLine[]): TransitLineDto[] {
    const dtos: TransitLineDto[] = raw.map((l) => {
      const stops = l.stops.map((s) => ({
        id: `${STPT_SOURCE}-stop-${s.osmId}`,
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        stopOrder: s.stopOrder,
      }));
      const geo = l.geometry.length > 0 ? l.geometry : undefined;
      return {
        id: `${STPT_SOURCE}-route-${l.osmId.toString()}`,
        lineNumber: l.lineNumber,
        type: l.type,
        name: l.name,
        color: l.color,
        stops,
        directions: [{ name: l.name, stops, geometry: geo }],
        geometry: geo,
        source: STPT_SOURCE,
      };
    });
    return this.mergeDirections(dtos);
  }

  /**
   * Merge multiple route variants (directions) sharing the same line number
   * into a single entry with a `directions` array.
   */
  private mergeDirections(lines: TransitLineDto[]): TransitLineDto[] {
    const byKey = new Map<string, TransitLineDto[]>();
    for (const line of lines) {
      const key = `${line.type}:${line.lineNumber}`;
      const arr = byKey.get(key) ?? [];
      arr.push(line);
      byKey.set(key, arr);
    }

    const merged: TransitLineDto[] = [];
    for (const variants of byKey.values()) {
      // Score variants: prefer more named stops
      const scored = variants.map((v) => {
        const namedStops = v.stops.filter((s) => !/^Stop \d+$/.test(s.name)).length;
        return { line: v, score: namedStops * 1000 + v.stops.length };
      });
      scored.sort((a, b) => b.score - a.score);

      const primary = scored[0].line;

      // Collect unique directions while preserving distinct tur/retur variants.
      const seenStopKeys = new Set<string>();
      const directions: TransitDirectionDto[] = [];

      for (const { line: variant } of scored) {
        for (const dir of variant.directions) {
          const stopKey = `${dir.name}|${dir.stops.map((s) => s.id).join('|')}`;
          if (!seenStopKeys.has(stopKey) && dir.stops.length > 0) {
            seenStopKeys.add(stopKey);
            directions.push(dir);
          }
        }
      }

      merged.push({
        ...primary,
        directions,
      });
    }

    merged.sort((a, b) => this.compareLineNumbers(a.lineNumber, b.lineNumber));

    return merged;
  }

  private async fetchStptGroups(): Promise<StptLineGroup[]> {
    const res = await fetch(`${STPT_BASE_URL}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 TimisoaraApp/1.0' },
    });

    if (!res.ok) {
      throw new Error(`STPT live homepage ${res.status}`);
    }

    const html = await res.text();
    const groupRegex = /<div class='sidebar-group'><div class='sidebar-group-label'>(.*?)<\/div><div class='sidebar-group-buttons'>(.*?)<\/div><\/div>/g;
    const groups: StptLineGroup[] = [];

    for (const match of html.matchAll(groupRegex)) {
      const label = this.decodeHtml(match[1]).trim();
      const normalizedLabel = this.normalizeCategoryLabel(label);
      const type = STPT_LABEL_TYPE_MAP[normalizedLabel];
      if (!type) continue;

      const buttons = match[2];
      const lineNumbers = Array.from(buttons.matchAll(/href='\?linie=([^']+)'/g), (lineMatch) =>
        this.normalizeLineNumber(lineMatch[1]),
      );
      const colorMatch = buttons.match(/background:\s*(#[0-9a-fA-F]{6})/);

      if (lineNumbers.length === 0) continue;

      groups.push({
        label,
        type,
        lineNumbers,
        color: colorMatch?.[1]?.toUpperCase() ?? TYPE_COLORS[type] ?? '#6B7280',
      });
    }

    return groups;
  }

  private async fetchStptLineVariants(
    group: StptLineGroup,
    lineNumber: string,
  ): Promise<ExternalTransitLine[]> {
    const res = await fetch(
      `${STPT_BASE_URL}/linii-config-json.php?line=${encodeURIComponent(lineNumber)}&v=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0 TimisoaraApp/1.0' } },
    );

    if (!res.ok) {
      throw new Error(`STPT live line ${lineNumber} ${res.status}`);
    }

    const payload = (await res.json()) as Record<string, { tur?: StptDirectionPayload; retur?: StptDirectionPayload }>;
    const rootKey = [lineNumber, lineNumber.toLowerCase(), lineNumber.toUpperCase()].find(
      (candidate) => candidate in payload,
    );
    const linePayload = rootKey ? payload[rootKey] : Object.values(payload)[0];

    if (!linePayload) {
      return [];
    }

    const directions = [
      { key: 'tur', label: 'Tur', data: linePayload.tur },
      { key: 'retur', label: 'Retur', data: linePayload.retur },
    ] as const;

    return directions
      .map(async ({ key, label, data }) => {
        const stops = this.mapStptStops(lineNumber, key, data);
        if (stops.length < 2) return null;

        const firstStop = stops[0].name;
        const lastStop = stops[stops.length - 1].name;
        const routeGeometry = await this.fetchRouteGeometry(lineNumber, key);

        return {
          osmId: this.makeStableId('line', `${group.type}:${lineNumber}:${key}`),
          lineNumber,
          type: group.type,
          name: `${label}: ${firstStop} → ${lastStop}`,
          color: group.color,
          stops,
          geometry: routeGeometry.length > 1 ? routeGeometry : this.mapStptGeometry(data?.coords),
        } satisfies ExternalTransitLine;
      })
      .reduce<Promise<ExternalTransitLine[]>>(async (accPromise, itemPromise) => {
        const acc = await accPromise;
        const item = await itemPromise;
        if (item) acc.push(item);
        return acc;
      }, Promise.resolve([]));
  }

  private mapStptStops(
    lineNumber: string,
    directionKey: 'tur' | 'retur',
    data?: StptDirectionPayload,
  ): ExternalTransitLine['stops'] {
    const ids = Array.isArray(data?.ids) ? data.ids : [];
    const stations = Array.isArray(data?.stations) ? data.stations : [];
    const coords = Array.isArray(data?.coords) ? data.coords : [];
    const limit = Math.max(ids.length, stations.length, coords.length);
    const stops: ExternalTransitLine['stops'] = [];

    for (let index = 0; index < limit; index++) {
      const stopId = ids[index];
      const stopName = stations[index]?.trim();
      if (!stopName) continue;

      const coord = this.resolveStopCoordinate(coords, index);
      if (!coord) continue;

      const [longitude, latitude] = coord;

      stops.push({
        osmId: this.makeStableId('stop', stopId || `${lineNumber}:${directionKey}:${index}:${stopName}`),
        name: stopName,
        latitude,
        longitude,
        stopOrder: stops.length,
      });
    }

    return this.deduplicateConsecutiveStops(stops);
  }

  private mapStptGeometry(coords?: Array<[number, number]>): [number, number][] {
    if (!Array.isArray(coords)) return [];

    const geometry: [number, number][] = [];
    for (const point of coords) {
      if (!Array.isArray(point) || point.length < 2) continue;
      const [longitude, latitude] = point;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      const previous = geometry[geometry.length - 1];
      if (previous && previous[0] === latitude && previous[1] === longitude) continue;
      geometry.push([latitude, longitude]);
    }

    return this.sanitizeGeometry(geometry);
  }

  private resolveStopCoordinate(
    coords: Array<[number, number]> | undefined,
    index: number,
  ): [number, number] | null {
    if (!Array.isArray(coords)) {
      return null;
    }

    const current = this.normalizeStopCoordinate(coords[index]);
    if (current) {
      return current;
    }

    let previous: [number, number] | null = null;
    for (let cursor = index - 1; cursor >= 0; cursor--) {
      previous = this.normalizeStopCoordinate(coords[cursor]);
      if (previous) break;
    }

    let next: [number, number] | null = null;
    for (let cursor = index + 1; cursor < coords.length; cursor++) {
      next = this.normalizeStopCoordinate(coords[cursor]);
      if (next) break;
    }

    if (previous && next) {
      return [
        (previous[0] + next[0]) / 2,
        (previous[1] + next[1]) / 2,
      ];
    }

    return previous ?? next ?? null;
  }

  private normalizeStopCoordinate(point: unknown): [number, number] | null {
    if (!Array.isArray(point) || point.length < 2) {
      return null;
    }

    const [longitude, latitude] = point;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return [longitude, latitude];
  }

  private async fetchRouteGeometry(lineNumber: string, direction: 'tur' | 'retur'): Promise<[number, number][]> {
    const urls = [
      `${STPT_BASE_URL}/routes/${encodeURIComponent(lineNumber)}-${direction}.geojson`,
      `${STPT_BASE_URL}/routes/${encodeURIComponent(lineNumber.toUpperCase())}-${direction}.geojson`,
      `${STPT_BASE_URL}/routes/${encodeURIComponent(lineNumber.toLowerCase())}-${direction}.geojson`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 TimisoaraApp/1.0', Accept: 'application/geo+json,application/json' },
        });

        if (!res.ok) {
          continue;
        }

        const data = (await res.json()) as GeoJsonFeatureCollection;
        const geometry = this.extractRouteGeometry(data);
        if (geometry.length > 1) {
          return geometry;
        }
      } catch (error) {
        this.logger.debug(`Route geometry fetch failed for ${lineNumber} ${direction} from ${url}: ${error}`);
      }
    }

    return [];
  }

  private extractRouteGeometry(data: GeoJsonFeatureCollection): [number, number][] {
    if (!Array.isArray(data?.features)) {
      return [];
    }

    const geometry: [number, number][] = [];

    for (const feature of data.features) {
      const current = feature?.geometry;
      if (!current) continue;

      if (current.type === 'LineString' && Array.isArray(current.coordinates)) {
        for (const point of current.coordinates) {
          this.pushGeoJsonPoint(geometry, point);
        }
      }

      if (current.type === 'MultiLineString' && Array.isArray(current.coordinates)) {
        for (const segment of current.coordinates) {
          if (!Array.isArray(segment)) continue;
          for (const point of segment) {
            this.pushGeoJsonPoint(geometry, point);
          }
        }
      }
    }

    return this.sanitizeGeometry(geometry);
  }

  private pushGeoJsonPoint(geometry: [number, number][], point: unknown): void {
    if (!Array.isArray(point) || point.length < 2) {
      return;
    }

    const [longitude, latitude] = point;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    geometry.push([latitude, longitude]);
  }

  private sanitizeGeometry(points: [number, number][]): [number, number][] {
    const sanitized: [number, number][] = [];

    for (const point of points) {
      const [latitude, longitude] = point;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      const previous = sanitized[sanitized.length - 1];
      if (previous && previous[0] === latitude && previous[1] === longitude) {
        continue;
      }

      sanitized.push([latitude, longitude]);
    }

    return sanitized;
  }

  private needsGeometryRefresh(lines: TransitLineDto[]): boolean {
    if (lines.length === 0) {
      return false;
    }

    return lines.some((line) =>
      line.directions.some((direction) => {
        const pointCount = direction.geometry?.length ?? 0;
        return pointCount === 0 || pointCount <= direction.stops.length + 1;
      }),
    );
  }

  private deduplicateConsecutiveStops(stops: ExternalTransitLine['stops']): ExternalTransitLine['stops'] {
    const deduplicated: ExternalTransitLine['stops'] = [];

    for (const stop of stops) {
      const previous = deduplicated[deduplicated.length - 1];
      if (
        previous &&
        previous.osmId === stop.osmId &&
        previous.name === stop.name &&
        previous.latitude === stop.latitude &&
        previous.longitude === stop.longitude
      ) continue;
      deduplicated.push({ ...stop, stopOrder: deduplicated.length });
    }

    return deduplicated;
  }

  private async fetchStopsFromStpt(): Promise<TransitStopDto[]> {
    const lines = await this.fetchFromStpt();
    const stops = new Map<string, TransitStopDto>();

    for (const line of lines) {
      for (const stop of line.stops) {
        if (!stops.has(String(stop.osmId))) {
          stops.set(String(stop.osmId), {
            id: `${STPT_SOURCE}-stop-${stop.osmId}`,
            name: stop.name,
            latitude: stop.latitude,
            longitude: stop.longitude,
            stopOrder: 0,
          });
        }
      }
    }

    return Array.from(stops.values()).sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  }

  private compareLineNumbers(first: string, second: string): number {
    return first.localeCompare(second, 'ro', { numeric: true, sensitivity: 'base' });
  }

  private normalizeCategoryLabel(label: string): string {
    return this.decodeHtml(label)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private normalizeLineNumber(lineNumber: string): string {
    return this.decodeHtml(lineNumber).trim().toUpperCase();
  }

  private decodeHtml(value: string): string {
    return value
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#536;|&#x218;/gi, 'Ș')
      .replace(/&#537;|&#x219;/gi, 'ș')
      .replace(/&#538;|&#x21A;/gi, 'Ț')
      .replace(/&#539;|&#x21B;/gi, 'ț');
  }

  private makeStableId(namespace: string, value: string): bigint {
    const input = `${namespace}:${value}`;
    let hash = 1469598103934665603n;

    for (const char of input) {
      hash ^= BigInt(char.codePointAt(0) ?? 0);
      hash *= 1099511628211n;
      hash &= 0x7fffffffffffffffn;
    }

    return hash;
  }

  private async fetchFromDb(type?: string): Promise<TransitLineDto[]> {
    const where = type ? { source: STPT_SOURCE, type } : { source: STPT_SOURCE };
    const lines = await this.prisma.transitLine.findMany({
      where,
      include: {
        stops: { include: { stop: true }, orderBy: { stopOrder: 'asc' } },
      },
      orderBy: { lineNumber: 'asc' },
    });

    const all: TransitLineDto[] = lines.map((line: any) => {
      const stops = line.stops.map((ls: any) => ({
        id: ls.stop.id,
        name: ls.stop.name,
        latitude: ls.stop.latitude,
        longitude: ls.stop.longitude,
        stopOrder: ls.stopOrder,
      }));
      const geo = Array.isArray(line.geometry) ? (line.geometry as [number, number][]) : undefined;
      return {
        id: line.id,
        lineNumber: line.lineNumber,
        type: line.type,
        name: line.name,
        color: line.color,
        stops,
        directions: [{ name: line.name, stops, geometry: geo }],
        geometry: geo,
        source: line.source,
      };
    });

    return this.mergeDirections(all);
  }
}
