import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNumber, IsOptional, IsArray,
  Min, Max,
} from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsArray() @IsString({ each: true }) cuisine: string[];
  @ApiProperty({ minimum: 1, maximum: 4 }) @IsNumber() @Min(1) @Max(4) priceRange: number;
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
  @ApiProperty() @IsString() address: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() openingHours?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(5) rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
}

export class QueryRestaurantsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() cuisine?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(4) priceRange?: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @IsNumber() @Min(1) @Max(1000) limit?: number;
}
