import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OverpassService } from '../external/overpass.service';
import { SyncService } from '../external/sync.service';
import { CreateRestaurantDto, QueryRestaurantsDto } from './restaurants.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(
    private prisma: PrismaService,
    private overpass: OverpassService,
    private sync: SyncService,
  ) {}

  async findAll(query: QueryRestaurantsDto) {
    const { cuisine, neighborhood, search, priceRange, page = 1, limit = 20 } = query;

    const isFresh = await this.sync.isFresh('restaurant');
    const where: Prisma.RestaurantWhereInput = {};
    if (cuisine) where.cuisine = { has: cuisine };
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
    if (priceRange) where.priceRange = priceRange;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ popularity: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    if (!isFresh) {
      this.logger.log('DB restaurant data is stale — triggering background refresh from Overpass');
      this.overpass.getRestaurants().catch((err) =>
        this.logger.warn(`Background Overpass restaurant refresh failed: ${err}`),
      );
    }

    const serialized = data.map((d) => ({
      ...d,
      osmId: d.osmId ? d.osmId.toString() : null,
    }));

    const source = data.length > 0 ? (data.some((d) => d.source === 'osm') ? 'db+osm' : 'db') : 'empty';
    this.logger.log(`Returning ${data.length}/${total} restaurants from DB (source: ${source}, fresh: ${isFresh})`);
    return { data: serialized, meta: { total, page, limit, source } };
  }

  async findOne(id: string) {
    return this.prisma.restaurant.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreateRestaurantDto) {
    return this.prisma.restaurant.create({
      data: { ...dto, features: dto.features ?? [] },
    });
  }
}
