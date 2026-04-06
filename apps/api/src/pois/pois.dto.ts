import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

const POI_CATEGORIES = [
  'landmark', 'museum', 'church', 'park', 'restaurant', 'cafe',
  'bar', 'club', 'theater', 'gallery', 'hotel', 'pharmacy',
  'hospital', 'shopping', 'street_art', 'other',
] as const;

export class CreatePoiDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ enum: POI_CATEGORIES }) @IsEnum(POI_CATEGORIES) category: string;
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
  @ApiProperty() @IsString() address: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() openingHours?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(5) rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class QueryPoisDto {
  @ApiPropertyOptional({ enum: POI_CATEGORIES }) @IsOptional() @IsEnum(POI_CATEGORIES) category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
  @ApiPropertyOptional({ default: 5 }) @IsOptional() @IsNumber() radius?: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @IsNumber() @Min(1) @Max(1000) limit?: number;
}
