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
const TM_BBOX = '45.70,21.17,45.80,21.30';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const ROUTE_TYPE_MAP: Record<string, string> = {
  tram: 'tram',
  bus: 'bus',
  trolleybus: 'trolleybus',
  light_rail: 'tram',
};

const TYPE_COLORS: Record<string, string> = {
  tram: '#E30613',
  bus: '#059669',
  trolleybus: '#DC2626',
};

interface OsmTransitLine {
  osmId: number;
  lineNumber: string;
  type: string;
  name: string;
  color: string;
  stops: Array<{ osmId: number; name: string; latitude: number; longitude: number; stopOrder: number }>;
  geometry: [number, number][];
}

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
      const dbStops = await this.prisma.transitStop.findMany({ orderBy: { name: 'asc' } });
      if (dbStops.length > 0) {
        return dbStops.map((s) => ({
          id: s.id,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          stopOrder: 0,
        }));
      }

      try {
        const stops = await this.fetchStopsFromOsm();
        if (stops.length > 0) {
          this.logger.log(`OSM returned ${stops.length} transit stops`);
          return stops;
        }
      } catch (err) {
        this.logger.warn(`OSM stops fetch failed: ${err}`);
      }
      return [];
    });
  }

  /**
   * Main resolution logic:
   * 1. Read from DB
   * 2. If stale or empty, try fetching from OSM and sync to DB
   * 3. If OSM fails, return whatever DB has
   */
  private async resolveLines(type?: string): Promise<TransitLineDto[]> {
    const dbLines = await this.fetchFromDb(type);
    const isFresh = await this.sync.isFresh('transitLine');

    if (dbLines.length > 0 && isFresh) {
      this.logger.log(`Serving ${dbLines.length} transit lines from fresh DB`);
      return dbLines;
    }

    try {
      const osmRaw = await this.fetchFromOsm(type);
      if (osmRaw.length > 0) {
        this.logger.log(`OSM returned ${osmRaw.length} transit routes — syncing to DB`);
        this.sync.syncTransitLines(osmRaw).catch((err) =>
          this.logger.error(`Background transit sync failed: ${err}`),
        );
        return this.osmLinesToDtos(osmRaw);
      }
    } catch (err) {
      this.logger.warn(`OSM transit fetch failed: ${err}`);
    }

    if (dbLines.length > 0) {
      this.logger.log(`Serving ${dbLines.length} stale transit lines from DB`);
      return dbLines;
    }

    return [];
  }

  private async fetchFromOsm(type?: string): Promise<OsmTransitLine[]> {
    const routeTypes = type ? [type] : Object.keys(ROUTE_TYPE_MAP);

    const filters = routeTypes
      .map((t) => `relation["type"="route"]["route"="${t}"](${TM_BBOX});`)
      .join('\n  ');

    // Use `out body qt;` (not `out skel`) for recursed members so node tags (stop names) are included
    const query = `[out:json][timeout:60];
(
  ${filters}
);
out body;
>;
out body qt;`;

    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      throw new Error(`Overpass ${res.status}`);
    }

    const json = await res.json();
    const elements = json.elements ?? [];

    const nodeMap = new Map<number, { lat: number; lon: number; name?: string }>();
    const namedNodes: Array<{ lat: number; lon: number; name: string }> = [];
    for (const el of elements) {
      if (el.type === 'node' && el.lat && el.lon) {
        nodeMap.set(el.id, { lat: el.lat, lon: el.lon, name: el.tags?.name });
        if (el.tags?.name) {
          namedNodes.push({ lat: el.lat, lon: el.lon, name: el.tags.name });
        }
      }
    }

    // Build a map of way ID → ordered node IDs for road geometry extraction
    const wayMap = new Map<number, number[]>();
    for (const el of elements) {
      if (el.type === 'way' && el.nodes) {
        wayMap.set(el.id, el.nodes);
      }
    }

    this.logger.log(`Node map: ${nodeMap.size} nodes, ${namedNodes.length} named, ${wayMap.size} ways`);

    const lines: OsmTransitLine[] = [];
    for (const el of elements) {
      if (el.type !== 'relation' || !el.tags) continue;

      const routeType = ROUTE_TYPE_MAP[el.tags.route] ?? el.tags.route;
      const ref = el.tags.ref ?? el.tags.name ?? '';
      const name = el.tags.name ?? `${routeType} ${ref}`;

      const STOP_ROLES = new Set([
        'stop', 'platform',
        'stop_entry_only', 'platform_entry_only',
        'stop_exit_only', 'platform_exit_only',
      ]);
      const stopMembers = (el.members ?? []).filter(
        (m: { type: string; role: string }) =>
          m.type === 'node' && STOP_ROLES.has(m.role),
      );

      const stops: OsmTransitLine['stops'] = [];
      for (let i = 0; i < stopMembers.length; i++) {
        const node = nodeMap.get(stopMembers[i].ref);
        if (node && node.lat && node.lon) {
          let stopName = node.name;
          if (!stopName) {
            stopName = this.findNearestName(node.lat, node.lon, namedNodes, 150);
          }
          stops.push({
            osmId: stopMembers[i].ref,
            name: stopName ?? `Stop ${i + 1}`,
            latitude: node.lat,
            longitude: node.lon,
            stopOrder: i,
          });
        }
      }

      // OSM lists both 'stop' and 'platform' nodes for the same physical stop,
      // producing consecutive entries with the same name — collapse them.
      const deduped: typeof stops = [];
      for (const s of stops) {
        if (deduped.length === 0 || deduped[deduped.length - 1].name !== s.name) {
          deduped.push({ ...s, stopOrder: deduped.length });
        }
      }

      // Extract road geometry from the way members of this route relation
      const geometry = this.extractRouteGeometry(el.members ?? [], wayMap, nodeMap);

      if (ref) {
        lines.push({
          osmId: el.id,
          lineNumber: ref,
          type: routeType,
          name,
          color: TYPE_COLORS[routeType] ?? '#6b7280',
          stops: deduped,
          geometry,
        });
      }
    }

    lines.sort((a, b) => {
      const aNum = parseInt(a.lineNumber, 10);
      const bNum = parseInt(b.lineNumber, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.lineNumber.localeCompare(b.lineNumber);
    });

    return lines;
  }

  private osmLinesToDtos(raw: OsmTransitLine[]): TransitLineDto[] {
    const dtos: TransitLineDto[] = raw.map((l) => {
      const stops = l.stops.map((s) => ({
        id: `osm-stop-${s.osmId}`,
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        stopOrder: s.stopOrder,
      }));
      const geo = l.geometry.length > 0 ? l.geometry : undefined;
      return {
        id: `osm-route-${l.osmId}`,
        lineNumber: l.lineNumber,
        type: l.type,
        name: l.name,
        color: l.color,
        stops,
        directions: [{ name: l.name, stops, geometry: geo }],
        geometry: geo,
        source: 'osm' as const,
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

      // Collect unique directions (deduplicate identical stop sequences)
      const seenStopKeys = new Set<string>();
      const directions: TransitDirectionDto[] = [];

      for (const { line: variant } of scored) {
        for (const dir of variant.directions) {
          const stopKey = dir.stops.map((s) => s.name).join('|');
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

    merged.sort((a, b) => {
      const aNum = parseInt(a.lineNumber, 10);
      const bNum = parseInt(b.lineNumber, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.lineNumber.localeCompare(b.lineNumber);
    });

    return merged;
  }

  /**
   * Find the nearest named node within `maxMeters` using the Haversine formula.
   */
  private findNearestName(
    lat: number,
    lon: number,
    namedNodes: Array<{ lat: number; lon: number; name: string }>,
    maxMeters: number,
  ): string | undefined {
    let bestName: string | undefined;
    let bestDist = maxMeters;

    for (const n of namedNodes) {
      const dist = this.haversineMeters(lat, lon, n.lat, n.lon);
      if (dist < bestDist) {
        bestDist = dist;
        bestName = n.name;
      }
    }

    return bestName;
  }

  private haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Chain the way members of a route relation into a continuous coordinate array.
   *
   * Strategy: process ways in relation-member order (which reflects the intended
   * route path). For each way, check if it connects to the current chain via a
   * shared node ID. If not, check proximity (<100m). If neither, skip it — this
   * filters out parallel tracks (common in tram routes with separate per-direction
   * tracks) without creating cross-city jumps.
   */
  private extractRouteGeometry(
    members: Array<{ type: string; ref: number; role: string }>,
    wayMap: Map<number, number[]>,
    nodeMap: Map<number, { lat: number; lon: number; name?: string }>,
  ): [number, number][] {
    const wayNodes: number[][] = [];
    for (const m of members) {
      if (m.type !== 'way') continue;
      const nodes = wayMap.get(m.ref);
      if (nodes && nodes.length >= 2) wayNodes.push(nodes);
    }
    if (wayNodes.length === 0) return [];

    const nodeCoord = (nid: number): [number, number] | null => {
      const n = nodeMap.get(nid);
      return n ? [n.lat, n.lon] : null;
    };

    const distMeters = (a: number, b: number): number => {
      const ca = nodeCoord(a);
      const cb = nodeCoord(b);
      if (!ca || !cb) return Infinity;
      const dlat = (ca[0] - cb[0]) * 111320;
      const dlon = (ca[1] - cb[1]) * 111320 * Math.cos((ca[0] * Math.PI) / 180);
      return Math.sqrt(dlat * dlat + dlon * dlon);
    };

    // Start chain with the first way
    const chain: number[] = [...wayNodes[0]];

    for (let wi = 1; wi < wayNodes.length; wi++) {
      const seg = wayNodes[wi];
      const tailNode = chain[chain.length - 1];
      const segFirst = seg[0];
      const segLast = seg[seg.length - 1];

      // Exact node match (shared endpoint)
      if (segFirst === tailNode) {
        chain.push(...seg.slice(1));
        continue;
      }
      if (segLast === tailNode) {
        for (let k = seg.length - 2; k >= 0; k--) chain.push(seg[k]);
        continue;
      }

      // Proximity check: connect if within 100m
      const distToFirst = distMeters(tailNode, segFirst);
      const distToLast = distMeters(tailNode, segLast);
      const minDist = Math.min(distToFirst, distToLast);

      if (minDist > 250) continue; // skip disconnected ways (parallel track etc.)

      if (distToFirst <= distToLast) {
        chain.push(...seg.slice(1));
      } else {
        for (let k = seg.length - 2; k >= 0; k--) chain.push(seg[k]);
      }
    }

    return chain
      .map((nid) => nodeCoord(nid))
      .filter((c): c is [number, number] => c !== null);
  }

  private async fetchStopsFromOsm(): Promise<TransitStopDto[]> {
    const query = `[out:json][timeout:25];
(
  node["public_transport"="stop_position"](${TM_BBOX});
  node["highway"="bus_stop"](${TM_BBOX});
  node["railway"="tram_stop"](${TM_BBOX});
);
out;`;

    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const json = await res.json();

    return (json.elements ?? [])
      .filter((el: { tags?: { name?: string }; lat?: number; lon?: number }) => el.tags?.name && el.lat && el.lon)
      .map((el: { id: number; tags: { name: string }; lat: number; lon: number }, i: number) => ({
        id: `osm-stop-${el.id}`,
        name: el.tags.name,
        latitude: el.lat,
        longitude: el.lon,
        stopOrder: i,
      }));
  }

  private async fetchFromDb(type?: string): Promise<TransitLineDto[]> {
    const where = type ? { type } : {};
    const lines = await this.prisma.transitLine.findMany({
      where,
      include: {
        stops: { include: { stop: true }, orderBy: { stopOrder: 'asc' } },
      },
      orderBy: { lineNumber: 'asc' },
    });

    const all: TransitLineDto[] = lines.map((line) => {
      const stops = line.stops.map((ls) => ({
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
