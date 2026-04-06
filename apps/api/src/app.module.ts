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

@Module({
  imports: [
    PrismaModule,
    ExternalModule,
    PoisModule,
    EventsModule,
    TransitModule,
    RestaurantsModule,
    UsersModule,
    HealthModule,
    WeatherModule,
  ],
})
export class AppModule {}
