import {
  Controller, Get, Post, Param, Query, Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto, QueryRestaurantsDto } from './restaurants.dto';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'List restaurants with filters' })
  findAll(@Query() query: QueryRestaurantsDto) {
    return this.restaurantsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single restaurant' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new restaurant' })
  create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(dto);
  }
}
