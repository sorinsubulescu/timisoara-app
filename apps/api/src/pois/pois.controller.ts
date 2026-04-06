import {
  Controller, Get, Post, Put, Delete,
  Param, Query, Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PoisService } from './pois.service';
import { CreatePoiDto, QueryPoisDto } from './pois.dto';

@ApiTags('Points of Interest')
@Controller('pois')
export class PoisController {
  constructor(private readonly poisService: PoisService) {}

  @Get()
  @ApiOperation({ summary: 'List points of interest with filters' })
  findAll(@Query() query: QueryPoisDto) {
    return this.poisService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get POI category counts' })
  getCategories() {
    return this.poisService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single point of interest' })
  findOne(@Param('id') id: string) {
    return this.poisService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new point of interest' })
  create(@Body() dto: CreatePoiDto) {
    return this.poisService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a point of interest' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePoiDto>) {
    return this.poisService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a point of interest' })
  remove(@Param('id') id: string) {
    return this.poisService.remove(id);
  }
}
