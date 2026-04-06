import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { SyncService } from './sync.service';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const TM_BBOX = '45.70,21.17,45.80,21.30';

const CACHE_TTL = 300; // 5 min — DB is the durable store now

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export interface OsmPoi {
  osmId: number;
  name: string;
  category: string;
  amenity: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  cuisine?: string[];
  tags: Record<string, string>;
}

const AMENITY_TO_CATEGORY: Record<string, string> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  bar: 'bar',
  pub: 'bar',
  fast_food: 'restaurant',
  pharmacy: 'pharmacy',
  hospital: 'hospital',
  clinic: 'hospital',
  museum: 'museum',
  theatre: 'theater',
  cinema: 'theater',
  library: 'museum',
  place_of_worship: 'church',
  hotel: 'hotel',
  hostel: 'hotel',
  guest_house: 'hotel',
};

const TOURISM_TO_CATEGORY: Record<string, string> = {
  museum: 'museum',
  gallery: 'gallery',
  hotel: 'hotel',
  hostel: 'hotel',
  guest_house: 'hotel',
  attraction: 'landmark',
  viewpoint: 'landmark',
};

@Injectable()
export class OverpassService {
  private readonly logger = new Logger(OverpassService.name);

  constructor(
    private cache: CacheService,
    private sync: SyncService,
  ) {}

  private buildQuery(amenities: string[]): string {
    const filters = amenities
      .map((a) => `nwr["amenity"="${a}"](${TM_BBOX});`)
      .join('\n  ');
    return `[out:json][timeout:30];\n(\n  ${filters}\n);\nout center;`;
  }

  private buildTourismQuery(types: string[]): string {
    const filters = types
      .map((t) => `nwr["tourism"="${t}"](${TM_BBOX});`)
      .join('\n  ');
    return `[out:json][timeout:30];\n(\n  ${filters}\n);\nout center;`;
  }

  private async query(ql: string): Promise<OsmElement[]> {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(ql)}`,
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Overpass error ${res.status}: ${body.slice(0, 200)}`);
      throw new Error(`Overpass HTTP ${res.status}`);
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) {
      const body = await res.text();
      this.logger.error(`Overpass returned non-JSON: ${body.slice(0, 200)}`);
      throw new Error('Overpass returned non-JSON response');
    }
    const json = await res.json();
    const elements = json.elements ?? [];
    if (elements.length === 0) {
      this.logger.warn('Overpass returned 0 elements — server may be busy');
    }
    return elements;
  }

  private toPoiList(elements: OsmElement[], typeMap: Record<string, string>, tagKey: string): OsmPoi[] {
    const raw = elements
      .filter((el) => el.tags?.name && !el.tags['disused:amenity'] && !el.tags.abandoned)
      .map((el) => {
        const tags = el.tags!;
        const lat = el.lat ?? el.center?.lat ?? 0;
        const lon = el.lon ?? el.center?.lon ?? 0;
        const typeValue = tags[tagKey] ?? '';

        const street = tags['addr:street'];
        const houseNum = tags['addr:housenumber'];
        const address = street
          ? `${street}${houseNum ? ` ${houseNum}` : ''}`
          : '';

        return {
          osmId: el.id,
          name: tags.name,
          category: typeMap[typeValue] ?? 'other',
          amenity: typeValue,
          latitude: lat,
          longitude: lon,
          address,
          phone: tags.phone || tags['contact:phone'],
          website: tags.website || tags['contact:website'],
          openingHours: tags.opening_hours,
          cuisine: tags.cuisine?.split(';').map((c) => c.trim()),
          tags,
        };
      });

    return this.deduplicateChains(raw);
  }

  /**
   * For chain brands (KFC, Dr. Max, etc.), keep only the entry with the most
   * OSM tags per unique street address. This collapses 23x "Dr. Max" into
   * a handful of distinct locations.
   */
  private deduplicateChains(pois: OsmPoi[]): OsmPoi[] {
    const CHAIN_THRESHOLD = 4;
    const nameCounts = new Map<string, number>();
    for (const p of pois) {
      nameCounts.set(p.name, (nameCounts.get(p.name) ?? 0) + 1);
    }

    const result: OsmPoi[] = [];
    const chainSeen = new Map<string, OsmPoi>();

    for (const p of pois) {
      const count = nameCounts.get(p.name) ?? 1;
      if (count < CHAIN_THRESHOLD) {
        result.push(p);
        continue;
      }

      // For chains, deduplicate by name+street (keep the one with most tags)
      const street = p.tags['addr:street'] ?? '';
      const key = `${p.name}::${street}`;
      const existing = chainSeen.get(key);
      if (!existing || Object.keys(p.tags).length > Object.keys(existing.tags).length) {
        chainSeen.set(key, p);
      }
    }

    result.push(...chainSeen.values());
    return result;
  }

  /** Fetch POIs from Overpass, persist to DB, and return. Throws on failure. */
  async fetchAndSyncPois(category?: string): Promise<OsmPoi[]> {
    let amenities: string[];
    if (category && category !== 'all') {
      amenities = Object.entries(AMENITY_TO_CATEGORY)
        .filter(([, cat]) => cat === category)
        .map(([amenity]) => amenity);
      if (amenities.length === 0) amenities = [category];
    } else {
      amenities = Object.keys(AMENITY_TO_CATEGORY);
    }

    const elements = await this.query(this.buildQuery(amenities));
    const pois = this.toPoiList(elements, AMENITY_TO_CATEGORY, 'amenity');
    this.logger.log(`Overpass returned ${pois.length} POIs for category=${category ?? 'all'}`);

    if (pois.length > 0) {
      this.sync.syncPois(pois).catch((err) =>
        this.logger.error(`Background POI sync failed: ${err}`),
      );
    }

    return pois;
  }

  /** Fetch restaurants from Overpass, persist to DB, and return. Throws on failure. */
  async fetchAndSyncRestaurants(): Promise<OsmPoi[]> {
    const ql = this.buildQuery(['restaurant', 'cafe', 'bar', 'pub', 'fast_food']);
    const elements = await this.query(ql);
    const pois = this.toPoiList(elements, AMENITY_TO_CATEGORY, 'amenity');
    this.logger.log(`Overpass returned ${pois.length} restaurants/cafes/bars`);

    if (pois.length > 0) {
      this.sync.syncRestaurants(pois).catch((err) =>
        this.logger.error(`Background restaurant sync failed: ${err}`),
      );
    }

    return pois;
  }

  /** Fetch landmarks from Overpass, persist to DB, and return. Throws on failure. */
  async fetchAndSyncLandmarks(): Promise<OsmPoi[]> {
    const types = Object.keys(TOURISM_TO_CATEGORY);
    const elements = await this.query(this.buildTourismQuery(types));
    const pois = this.toPoiList(elements, TOURISM_TO_CATEGORY, 'tourism');
    this.logger.log(`Overpass returned ${pois.length} tourism/landmarks`);

    if (pois.length > 0) {
      this.sync.syncPois(pois).catch((err) =>
        this.logger.error(`Background landmark sync failed: ${err}`),
      );
    }

    return pois;
  }

  /** Cached version — reads from mem cache, falls through to fetchAndSync. */
  async getPois(category?: string): Promise<OsmPoi[]> {
    const cacheKey = `overpass:pois:${category ?? 'all'}`;
    return this.cache.getOrFetch(cacheKey, CACHE_TTL, () => this.fetchAndSyncPois(category));
  }

  async getRestaurants(): Promise<OsmPoi[]> {
    return this.cache.getOrFetch('overpass:restaurants', CACHE_TTL, () => this.fetchAndSyncRestaurants());
  }

  async getLandmarks(): Promise<OsmPoi[]> {
    return this.cache.getOrFetch('overpass:landmarks', CACHE_TTL, () => this.fetchAndSyncLandmarks());
  }
}
