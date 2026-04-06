import {
  Controller, Get, Post, Param, Query, Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, QueryEventsDto } from './events.dto';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List events with filters' })
  findAll(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  findUpcoming(@Query('limit') limit?: number) {
    return this.eventsService.findUpcoming(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }
}
