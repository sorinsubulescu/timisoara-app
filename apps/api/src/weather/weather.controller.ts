import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { WeatherService, WeatherResponse } from '../external/weather.service';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiOperation({
    summary: 'Current weather and 7-day forecast for Timișoara',
  })
  @ApiOkResponse({ description: 'Weather data from Open-Meteo (cached 30 min)' })
  async getForecast(): Promise<WeatherResponse> {
    return this.weatherService.getForecast();
  }
}
