import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TransitService } from './transit.service';

@ApiTags('Transit')
@Controller('transit')
export class TransitController {
  constructor(private readonly transitService: TransitService) {}

  @Get('lines')
  @ApiOperation({ summary: 'List all transit lines, optionally filtered by type' })
  findAllLines(@Query('type') type?: string) {
    return this.transitService.findAllLines(type);
  }

  @Get('lines/:id')
  @ApiOperation({ summary: 'Get a single transit line with stops' })
  findLine(@Param('id') id: string) {
    return this.transitService.findLine(id);
  }

  @Get('stops')
  @ApiOperation({ summary: 'List all transit stops' })
  findAllStops() {
    return this.transitService.findAllStops();
  }

  @Get('stops/:id')
  @ApiOperation({ summary: 'Get a single transit stop with connected lines' })
  findStop(@Param('id') id: string) {
    return this.transitService.findStop(id);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Real-time vehicle positions from STPT GPS feed' })
  @ApiQuery({ name: 'route', required: false, description: 'Filter by route/line number' })
  getVehicles(@Query('route') route?: string) {
    return this.transitService.getVehiclePositions(route);
  }
}
