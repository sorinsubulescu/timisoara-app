import {
  Controller, Get, Post, Param, Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, LoginDto } from './users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: CreateUserDto) {
    return this.usersService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive token' })
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  getFavorites(@Param('id') id: string) {
    return this.usersService.getFavorites(id);
  }

  @Post(':userId/favorites/pois/:poiId')
  @ApiOperation({ summary: 'Toggle favorite POI' })
  toggleFavoritePoi(
    @Param('userId') userId: string,
    @Param('poiId') poiId: string,
  ) {
    return this.usersService.toggleFavoritePoi(userId, poiId);
  }

  @Post(':userId/favorites/events/:eventId')
  @ApiOperation({ summary: 'Toggle favorite event' })
  toggleFavoriteEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.usersService.toggleFavoriteEvent(userId, eventId);
  }
}
