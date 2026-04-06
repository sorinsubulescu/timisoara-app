import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OverpassService } from '../external/overpass.service';
import { SyncService } from '../external/sync.service';
import { CreatePoiDto, QueryPoisDto } from './pois.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PoisService {
  private readonly logger = new Logger(PoisService.name);

  constructor(
    private prisma: PrismaService,
    private overpass: OverpassService,
    private sync: SyncService,
  ) {}

  async findAll(query: QueryPoisDto) {
    const { category, neighborhood, search, page = 1, limit = 20 } = query;

    const isFresh = await this.sync.isFresh('poi');
    const where: Prisma.PoiWhereInput = {};
    if (category) where.category = category;
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.poi.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ popularity: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.poi.count({ where }),
    ]);

    if (!isFresh) {
      this.logger.log('DB POI data is stale — triggering background refresh from Overpass');
      this.overpass.getPois(category).catch((err) =>
        this.logger.warn(`Background Overpass POI refresh failed: ${err}`),
      );
    }

    const serialized = data.map((d) => ({
      ...d,
      osmId: d.osmId ? d.osmId.toString() : null,
    }));

    const source = data.length > 0 ? (data.some((d) => d.source === 'osm') ? 'db+osm' : 'db') : 'empty';
    this.logger.log(`Returning ${data.length}/${total} POIs from DB (source: ${source}, fresh: ${isFresh})`);
    return { data: serialized, meta: { total, page, limit, source } };
  }

  async findOne(id: string) {
    return this.prisma.poi.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreatePoiDto) {
    return this.prisma.poi.create({
      data: { ...dto, tags: dto.tags ?? [] },
    });
  }

  async update(id: string, dto: Partial<CreatePoiDto>) {
    return this.prisma.poi.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.poi.delete({ where: { id } });
  }

  async getCategories() {
    const result = await this.prisma.poi.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });
    return result.map((r) => ({ category: r.category, count: r._count.category }));
  }
}
