import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { OverpassService } from './overpass.service';
import { WeatherService } from './weather.service';
import { TransitGtfsService } from './transit-gtfs.service';
import { SyncService } from './sync.service';
import { ThumbnailService } from './thumbnail.service';

@Global()
@Module({
  providers: [CacheService, OverpassService, WeatherService, TransitGtfsService, SyncService, ThumbnailService],
  exports: [CacheService, OverpassService, WeatherService, TransitGtfsService, SyncService, ThumbnailService],
})
export class ExternalModule {}
