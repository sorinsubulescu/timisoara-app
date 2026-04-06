import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateEventDto, QueryEventsDto } from './events.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryEventsDto) {
    const { category, search, from, to, isFree, status, page = 1, limit = 20 } = query;
    const where: Prisma.EventWhereInput = {};

    where.status = status ?? 'approved';

    if (category) where.category = category;
    if (isFree !== undefined) where.isFree = isFree;
    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.gte = new Date(from);
      if (to) where.startDate.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    return this.prisma.event.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        venue: dto.venue,
        venueAddress: dto.venueAddress,
        latitude: dto.latitude,
        longitude: dto.longitude,
        ticketUrl: dto.ticketUrl,
        imageUrl: dto.imageUrl,
        isFree: dto.isFree ?? false,
        price: dto.price,
        tags: dto.tags ?? [],
        submitterName: dto.submitterName,
        submitterEmail: dto.submitterEmail,
        status: 'approved',
      },
    });
  }

  async findUpcoming(limit = 10) {
    return this.prisma.event.findMany({
      where: { startDate: { gte: new Date() }, status: 'approved' },
      orderBy: { startDate: 'asc' },
      take: limit,
    });
  }
}
