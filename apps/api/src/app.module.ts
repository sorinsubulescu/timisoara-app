import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { ExternalModule } from './external/external.module';
import { PoisModule } from './pois/pois.module';
import { EventsModule } from './events/events.module';
import { TransitModule } from './transit/transit.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { WeatherModule } from './weather/weather.module';

const isTransitOnlyApi = process.env.TRANSIT_ONLY_API === 'true'
  || (process.env.NODE_ENV === 'production' && process.env.TRANSIT_ONLY_API !== 'false');

const transitOnlyImports = [PrismaModule, ExternalModule, TransitModule, HealthModule];
const defaultImports = [
  ...transitOnlyImports,
  PoisModule,
  EventsModule,
  RestaurantsModule,
  UsersModule,
  WeatherModule,
];

const imports = isTransitOnlyApi ? transitOnlyImports : defaultImports;

@Module({
  imports,
})
export class AppModule {}
