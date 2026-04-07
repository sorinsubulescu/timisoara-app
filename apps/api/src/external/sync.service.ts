import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ThumbnailService } from './thumbnail.service';
import type { OsmPoi } from './overpass.service';

const STALE_HOURS = 24;

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_UA = 'TimisoaraApp/1.0';
const NOMINATIM_DELAY_MS = 1500; // Nominatim policy: max 1 req/sec, extra buffer for concurrent jobs

/**
 * Extract neighborhood from the POI's own OSM tags.
 * Only returns a value when the mapper explicitly tagged it.
 */
function extractNeighborhoodFromTags(tags: Record<string, string>): string {
  return tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:quarter'] || '';
}

/**
 * Build a useful one-line description from OSM tags.
 */
function buildDescription(tags: Record<string, string>, category: string): string {
  const parts: string[] = [];

  const cuisine = tags.cuisine;
  if (cuisine) {
    const items = cuisine.split(';').map((c) => c.trim().replace(/_/g, ' '));
    const capitalized = items.slice(0, 2).map((c) => c.charAt(0).toUpperCase() + c.slice(1));
    parts.push(capitalized.join(' & '));
  }

  const brand = tags.brand;
  if (brand && brand !== tags.name) {
    parts.push(brand);
  }

  if (!cuisine && !brand) {
    const labels: Record<string, string> = {
      restaurant: 'Restaurant', cafe: 'Cafe', bar: 'Bar', church: 'Church',
      museum: 'Museum', theater: 'Theater', gallery: 'Gallery', park: 'Park',
      landmark: 'Landmark', pharmacy: 'Pharmacy', hospital: 'Healthcare',
      hotel: 'Hotel',
    };
    parts.push(labels[category] ?? category.charAt(0).toUpperCase() + category.slice(1));
  }

  const hours = tags.opening_hours;
  if (hours) {
    const simple = hours.replace(/;.*/, '').trim();
    if (simple.length < 30) parts.push(simple);
  }

  if (tags.wheelchair === 'yes') parts.push('Wheelchair accessible');
  if (tags.outdoor_seating === 'yes') parts.push('Outdoor seating');
  if (tags.internet_access === 'wlan' || tags.internet_access === 'yes') parts.push('Free WiFi');

  return parts.join(' · ');
}

/**
 * Compute a 0–15 relevance score from raw OSM tags.
 * Higher = more likely to be a real, active, notable place.
 */
function computePopularity(tags: Record<string, string>): number {
  let score = 0;

  if (tags.website || tags['contact:website']) score += 3;
  if (tags.phone || tags['contact:phone']) score += 2;
  if (tags.opening_hours) score += 2;

  const hasStreet = !!tags['addr:street'];
  if (hasStreet) score += 1;

  if (tags.wikipedia || tags.wikidata) score += 3;
  if (tags.wikimedia_commons || tags.image) score += 2;

  if (tags.brand || tags['brand:wikidata']) score += 1;

  const tagCount = Object.keys(tags).length;
  if (tagCount > 8) score += 1;

  return score;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private geocodeLock: Promise<void> = Promise.resolve();

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ThumbnailService))
    private thumbnail: ThumbnailService,
  ) {}

  /** Returns true if any row with given source was synced within the last STALE_HOURS */
  async isFresh(table: 'poi' | 'restaurant' | 'transitLine', source = 'osm'): Promise<boolean> {
    const cutoff = new Date(Date.now() - STALE_HOURS * 3600_000);
    let count = 0;
    if (table === 'poi') {
      count = await this.prisma.poi.count({ where: { source, syncedAt: { gte: cutoff } } });
    } else if (table === 'restaurant') {
      count = await this.prisma.restaurant.count({ where: { source, syncedAt: { gte: cutoff } } });
    } else if (table === 'transitLine') {
      count = await this.prisma.transitLine.count({ where: { source, syncedAt: { gte: cutoff } } });
    }
    return count > 0;
  }

  async syncPois(pois: OsmPoi[]): Promise<number> {
    const now = new Date();
    let upserted = 0;
    const imageUpdates: Array<{ osmId: number; tags: Record<string, string> }> = [];

    const needsGeocode: Array<{ osmId: number; lat: number; lon: number }> = [];

    for (const poi of pois) {
      try {
        const popularity = computePopularity(poi.tags);
        const description = poi.tags.description || buildDescription(poi.tags, poi.category);
        const neighborhood = extractNeighborhoodFromTags(poi.tags);
        await this.prisma.poi.upsert({
          where: { osmId: BigInt(poi.osmId) },
          update: {
            name: poi.name,
            category: poi.category,
            latitude: poi.latitude,
            longitude: poi.longitude,
            address: poi.address,
            description,
            neighborhood: neighborhood || null,
            phone: poi.phone ?? null,
            website: poi.website ?? null,
            openingHours: poi.openingHours ?? null,
            popularity,
            tags: Object.keys(poi.tags).slice(0, 15),
            source: 'osm',
            syncedAt: now,
          },
          create: {
            osmId: BigInt(poi.osmId),
            name: poi.name,
            description,
            category: poi.category,
            latitude: poi.latitude,
            longitude: poi.longitude,
            address: poi.address,
            neighborhood: neighborhood || null,
            phone: poi.phone ?? null,
            website: poi.website ?? null,
            openingHours: poi.openingHours ?? null,
            popularity,
            tags: Object.keys(poi.tags).slice(0, 15),
            source: 'osm',
            syncedAt: now,
          },
        });
        upserted++;
        if (!neighborhood) {
          needsGeocode.push({ osmId: poi.osmId, lat: poi.latitude, lon: poi.longitude });
        }
        if (poi.tags.image || poi.tags.wikimedia_commons || poi.tags.wikipedia || poi.tags.wikidata) {
          imageUpdates.push({ osmId: poi.osmId, tags: poi.tags });
        }
      } catch (err) {
        this.logger.warn(`Failed to upsert POI osm:${poi.osmId}: ${err}`);
      }
    }

    this.logger.log(`Synced ${upserted}/${pois.length} POIs to DB (${needsGeocode.length} need geocoding)`);

    if (imageUpdates.length > 0) {
      this.resolvePoiThumbnails(imageUpdates).catch((err) =>
        this.logger.warn(`POI thumbnail resolution failed: ${err}`),
      );
    }

    if (needsGeocode.length > 0) {
      this.reverseGeocodeNeighborhoods('poi', needsGeocode).catch((err) =>
        this.logger.warn(`POI neighborhood geocoding failed: ${err}`),
      );
    }

    return upserted;
  }

  private async resolvePoiThumbnails(
    items: Array<{ osmId: number; tags: Record<string, string> }>,
  ): Promise<void> {
    let resolved = 0;
    for (const item of items) {
      try {
        const imageUrl = await this.thumbnail.resolveImageUrl(item.tags);
        if (imageUrl) {
          await this.prisma.poi.update({
            where: { osmId: BigInt(item.osmId) },
            data: { imageUrl },
          });
          resolved++;
        }
      } catch (err) {
        this.logger.debug(`Thumbnail resolve failed for osm:${item.osmId}: ${err}`);
      }
    }
    this.logger.log(`Resolved ${resolved}/${items.length} POI thumbnails`);
  }

  async syncRestaurants(restaurants: OsmPoi[]): Promise<number> {
    const now = new Date();
    let upserted = 0;
    const imageUpdates: Array<{ osmId: number; tags: Record<string, string> }> = [];

    const needsGeocode: Array<{ osmId: number; lat: number; lon: number }> = [];

    for (const r of restaurants) {
      try {
        const popularity = computePopularity(r.tags);
        const description = r.tags.description || buildDescription(r.tags, r.category);
        const neighborhood = extractNeighborhoodFromTags(r.tags);
        await this.prisma.restaurant.upsert({
          where: { osmId: BigInt(r.osmId) },
          update: {
            name: r.name,
            latitude: r.latitude,
            longitude: r.longitude,
            address: r.address,
            description,
            neighborhood: neighborhood || null,
            cuisine: r.cuisine ?? [],
            phone: r.phone ?? null,
            website: r.website ?? null,
            popularity,
            source: 'osm',
            syncedAt: now,
          },
          create: {
            osmId: BigInt(r.osmId),
            name: r.name,
            description,
            cuisine: r.cuisine ?? [],
            priceRange: 0,
            latitude: r.latitude,
            longitude: r.longitude,
            address: r.address,
            neighborhood: neighborhood || null,
            phone: r.phone ?? null,
            website: r.website ?? null,
            popularity,
            features: [],
            source: 'osm',
            syncedAt: now,
          },
        });
        upserted++;
        if (!neighborhood) {
          needsGeocode.push({ osmId: r.osmId, lat: r.latitude, lon: r.longitude });
        }
        if (r.tags.image || r.tags.wikimedia_commons || r.tags.wikipedia || r.tags.wikidata) {
          imageUpdates.push({ osmId: r.osmId, tags: r.tags });
        }
      } catch (err) {
        this.logger.warn(`Failed to upsert restaurant osm:${r.osmId}: ${err}`);
      }
    }

    this.logger.log(`Synced ${upserted}/${restaurants.length} restaurants to DB (${needsGeocode.length} need geocoding)`);

    if (imageUpdates.length > 0) {
      this.resolveRestaurantThumbnails(imageUpdates).catch((err) =>
        this.logger.warn(`Restaurant thumbnail resolution failed: ${err}`),
      );
    }

    if (needsGeocode.length > 0) {
      this.reverseGeocodeNeighborhoods('restaurant', needsGeocode).catch((err) =>
        this.logger.warn(`Restaurant neighborhood geocoding failed: ${err}`),
      );
    }

    return upserted;
  }

  private async resolveRestaurantThumbnails(
    items: Array<{ osmId: number; tags: Record<string, string> }>,
  ): Promise<void> {
    let resolved = 0;
    for (const item of items) {
      try {
        const imageUrl = await this.thumbnail.resolveImageUrl(item.tags);
        if (imageUrl) {
          await this.prisma.restaurant.update({
            where: { osmId: BigInt(item.osmId) },
            data: { imageUrl },
          });
          resolved++;
        }
      } catch (err) {
        this.logger.debug(`Thumbnail resolve failed for restaurant osm:${item.osmId}: ${err}`);
      }
    }
    this.logger.log(`Resolved ${resolved}/${items.length} restaurant thumbnails`);
  }

  /**
   * Background job: reverse-geocode neighborhoods via Nominatim for items
   * that don't have addr:suburb in their OSM tags.
   * Uses a queue lock so only one geocoding job runs at a time (Nominatim 1 req/sec).
   */
  private reverseGeocodeNeighborhoods(
    table: 'poi' | 'restaurant',
    items: Array<{ osmId: number; lat: number; lon: number }>,
  ): Promise<void> {
    const job = this.geocodeLock.then(() => this.doGeocode(table, items));
    this.geocodeLock = job.catch(() => {});
    return job;
  }

  private async doGeocode(
    table: 'poi' | 'restaurant',
    items: Array<{ osmId: number; lat: number; lon: number }>,
  ): Promise<void> {
    let resolved = 0;
    let errors = 0;

    for (const item of items) {
      try {
        const url = `${NOMINATIM_URL}?lat=${item.lat}&lon=${item.lon}&format=json&zoom=16&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': NOMINATIM_UA, Accept: 'application/json' },
        });

        if (!res.ok) {
          if (res.status === 429) {
            await this.sleep(5000);
            errors++;
            continue;
          }
          this.logger.debug(`Nominatim ${res.status} for osm:${item.osmId}`);
          errors++;
          await this.sleep(NOMINATIM_DELAY_MS);
          continue;
        }

        const data = await res.json();
        const addr = data?.address;
        const suburb =
          addr?.suburb || addr?.neighbourhood || addr?.quarter ||
          addr?.city_district || addr?.borough || '';

        if (suburb) {
          if (table === 'poi') {
            await this.prisma.poi.update({
              where: { osmId: BigInt(item.osmId) },
              data: { neighborhood: suburb },
            });
          } else {
            await this.prisma.restaurant.update({
              where: { osmId: BigInt(item.osmId) },
              data: { neighborhood: suburb },
            });
          }
          resolved++;
        }
      } catch (err) {
        errors++;
        this.logger.debug(`Nominatim failed for osm:${item.osmId}: ${err}`);
      }

      await this.sleep(NOMINATIM_DELAY_MS);
    }

    this.logger.log(
      `Nominatim geocoded ${resolved}/${items.length} ${table} neighborhoods (${errors} errors)`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async syncTransitLines(
    lines: Array<{
      osmId: number | bigint;
      lineNumber: string;
      type: string;
      name: string;
      color: string;
      stops: Array<{ osmId: number | bigint; name: string; latitude: number; longitude: number; stopOrder: number }>;
      geometry?: [number, number][];
    }>,
    source = 'osm',
  ): Promise<number> {
    const now = new Date();
    let upserted = 0;

    for (const line of lines) {
      try {
        const geoValue = line.geometry && line.geometry.length > 0 ? (line.geometry as any) : null;
        const lineId = this.toBigIntId(line.osmId);
        const dbLine = await this.prisma.transitLine.upsert({
          where: { osmId: lineId },
          update: {
            lineNumber: line.lineNumber,
            type: line.type,
            name: line.name,
            color: line.color,
            geometry: geoValue,
            source,
            syncedAt: now,
          },
          create: {
            osmId: lineId,
            lineNumber: line.lineNumber,
            type: line.type,
            name: line.name,
            color: line.color,
            geometry: geoValue,
            source,
            syncedAt: now,
          },
        });

        // Clear old stop associations for this line
        await this.prisma.transitLineStop.deleteMany({ where: { lineId: dbLine.id } });

        for (const stop of line.stops) {
          const stopId = this.toBigIntId(stop.osmId);
          const dbStop = await this.prisma.transitStop.upsert({
            where: { osmId: stopId },
            update: {
              name: stop.name,
              latitude: stop.latitude,
              longitude: stop.longitude,
              source,
              syncedAt: now,
            },
            create: {
              osmId: stopId,
              name: stop.name,
              latitude: stop.latitude,
              longitude: stop.longitude,
              source,
              syncedAt: now,
            },
          });

          await this.prisma.transitLineStop.create({
            data: {
              lineId: dbLine.id,
              stopId: dbStop.id,
              stopOrder: stop.stopOrder,
            },
          }).catch(() => {
            // duplicate key — stop already linked to this line
          });
        }

        upserted++;
      } catch (err) {
        this.logger.warn(`Failed to upsert transit line osm:${line.osmId}: ${err}`);
      }
    }

    this.logger.log(`Synced ${upserted}/${lines.length} transit lines to DB`);
    return upserted;
  }

  private toBigIntId(value: number | bigint): bigint {
    return typeof value === 'bigint' ? value : BigInt(value);
  }
}
