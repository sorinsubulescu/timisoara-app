import { Injectable, Logger } from '@nestjs/common';
import { TransitGtfsService } from '../external/transit-gtfs.service';
import { PrismaService } from '../prisma.service';

export interface VehiclePositionDto {
  id: string;
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
  route: string;
  directionId: string;
  headsign: string;
  stop: string;
  timestamp: number;
  isAccessible: boolean;
}

const STPT_LIVE_URL = 'https://live.stpt.ro/gtfs-vehicles.php';

@Injectable()
export class TransitService {
  private readonly logger = new Logger(TransitService.name);

  constructor(
    private prisma: PrismaService,
    private transitGtfs: TransitGtfsService,
  ) {}

  async findAllLines(type?: string) {
    return this.transitGtfs.getAllLines(type);
  }

  async findLine(id: string) {
    const line = await this.transitGtfs.getLine(id);
    if (line) return line;
    return this.prisma.transitLine.findUniqueOrThrow({
      where: { id },
      include: {
        stops: { include: { stop: true }, orderBy: { stopOrder: 'asc' } },
      },
    });
  }

  async findAllStops() {
    return this.transitGtfs.getAllStops();
  }

  async findStop(id: string) {
    return this.prisma.transitStop.findUniqueOrThrow({
      where: { id },
      include: { lines: { include: { line: true } } },
    });
  }

  async getVehiclePositions(route?: string): Promise<VehiclePositionDto[]> {
    try {
      const url = route
        ? `${STPT_LIVE_URL}?route=${encodeURIComponent(route)}`
        : STPT_LIVE_URL;

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        this.logger.warn(`STPT vehicles HTTP ${res.status}`);
        return [];
      }

      const body = await res.json();
      if (!body?.success || !Array.isArray(body.data?.vehicles)) return [];

      return body.data.vehicles as VehiclePositionDto[];
    } catch (err) {
      this.logger.warn(`STPT vehicle fetch failed: ${err}`);
      return [];
    }
  }
}
