import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type {
  TransitDirectionDto,
  TransitLineDto,
  TransitStopDto,
} from '../external/transit-gtfs.service';
import { TransitService } from './transit.service';

const STATIC_TRANSIT_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';
const LIVE_TRANSIT_CACHE_CONTROL = 'public, max-age=15, stale-while-revalidate=30';

type CompactTransitStopDto = Omit<TransitStopDto, 'stopOrder'>;

type CompactTransitDirectionDto = {
  name: string;
  stops: CompactTransitStopDto[];
  geometry?: [number, number][];
};

type CompactTransitLineDto = Pick<TransitLineDto, 'id' | 'lineNumber' | 'type' | 'name' | 'color'> & {
  directions: CompactTransitDirectionDto[];
};

function isCompactRequested(value?: string): boolean {
  return value === '1' || value === 'true';
}

function compactStop(stop: TransitStopDto): CompactTransitStopDto {
  return {
    id: stop.id,
    name: stop.name,
    latitude: stop.latitude,
    longitude: stop.longitude,
  };
}

function compactDirection(direction: TransitDirectionDto): CompactTransitDirectionDto {
  return {
    name: direction.name,
    geometry: direction.geometry,
    stops: direction.stops.map(compactStop),
  };
}

function compactLine(line: TransitLineDto): CompactTransitLineDto {
  const directions = line.directions.length > 0
    ? line.directions
    : [{ name: line.name, stops: line.stops, geometry: line.geometry }];

  return {
    id: line.id,
    lineNumber: line.lineNumber,
    type: line.type,
    name: line.name,
    color: line.color,
    directions: directions.map(compactDirection),
  };
}

@ApiTags('Transit')
@Controller('transit')
export class TransitController {
  constructor(private readonly transitService: TransitService) {}

  @Get('lines')
  @Header('Cache-Control', STATIC_TRANSIT_CACHE_CONTROL)
  @ApiOperation({ summary: 'List all transit lines, optionally filtered by type' })
  @ApiQuery({ name: 'compact', required: false, description: 'Return a compact mobile-friendly payload' })
  async findAllLines(
    @Query('type') type?: string,
    @Query('compact') compact?: string,
  ): Promise<TransitLineDto[] | CompactTransitLineDto[]> {
    const lines = await this.transitService.findAllLines(type);
    return isCompactRequested(compact) ? lines.map(compactLine) : lines;
  }

  @Get('lines/:id')
  @Header('Cache-Control', STATIC_TRANSIT_CACHE_CONTROL)
  @ApiOperation({ summary: 'Get a single transit line with stops' })
  findLine(@Param('id') id: string) {
    return this.transitService.findLine(id);
  }

  @Get('stops')
  @Header('Cache-Control', STATIC_TRANSIT_CACHE_CONTROL)
  @ApiOperation({ summary: 'List all transit stops' })
  findAllStops() {
    return this.transitService.findAllStops();
  }

  @Get('stops/:id')
  @Header('Cache-Control', STATIC_TRANSIT_CACHE_CONTROL)
  @ApiOperation({ summary: 'Get a single transit stop with connected lines' })
  findStop(@Param('id') id: string) {
    return this.transitService.findStop(id);
  }

  @Get('vehicles')
  @Header('Cache-Control', LIVE_TRANSIT_CACHE_CONTROL)
  @ApiOperation({ summary: 'Real-time vehicle positions from STPT GPS feed' })
  @ApiQuery({ name: 'route', required: false, description: 'Filter by route/line number' })
  getVehicles(@Query('route') route?: string) {
    return this.transitService.getVehiclePositions(route);
  }
}
