import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto, LoginDto } from './users.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async register(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: this.hashPassword(dto.password),
        mode: dto.mode ?? 'tourist',
        language: dto.language ?? 'en',
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.passwordHash !== this.hashPassword(dto.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash: _, ...result } = user;
    return { user: result, token: `placeholder-jwt-${user.id}` };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async toggleFavoritePoi(userId: string, poiId: string) {
    const existing = await this.prisma.favoritePoi.findUnique({
      where: { userId_poiId: { userId, poiId } },
    });

    if (existing) {
      await this.prisma.favoritePoi.delete({
        where: { userId_poiId: { userId, poiId } },
      });
      return { favorited: false };
    }

    await this.prisma.favoritePoi.create({ data: { userId, poiId } });
    return { favorited: true };
  }

  async toggleFavoriteEvent(userId: string, eventId: string) {
    const existing = await this.prisma.favoriteEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      await this.prisma.favoriteEvent.delete({
        where: { userId_eventId: { userId, eventId } },
      });
      return { favorited: false };
    }

    await this.prisma.favoriteEvent.create({ data: { userId, eventId } });
    return { favorited: true };
  }

  async getFavorites(userId: string) {
    const [pois, events] = await Promise.all([
      this.prisma.favoritePoi.findMany({
        where: { userId },
        include: { poi: true },
      }),
      this.prisma.favoriteEvent.findMany({
        where: { userId },
        include: { event: true },
      }),
    ]);

    return {
      pois: pois.map((f) => f.poi),
      events: events.map((f) => f.event),
    };
  }
}
