import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNumber, IsOptional, IsArray, IsEnum,
  IsBoolean, IsDateString, IsEmail, Min, Max,
} from 'class-validator';

const EVENT_CATEGORIES = [
  'music', 'theater', 'art', 'sports', 'food',
  'family', 'free', 'festival', 'meetup', 'other',
] as const;

const EVENT_STATUSES = ['pending', 'approved', 'rejected'] as const;

export class CreateEventDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ enum: EVENT_CATEGORIES }) @IsEnum(EVENT_CATEGORIES) category: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiProperty() @IsString() venue: string;
  @ApiProperty() @IsString() venueAddress: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() ticketUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFree?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() price?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiProperty() @IsString() submitterName: string;
  @ApiProperty() @IsEmail() submitterEmail: string;
}

export class QueryEventsDto {
  @ApiPropertyOptional({ enum: EVENT_CATEGORIES }) @IsOptional() @IsEnum(EVENT_CATEGORIES) category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFree?: boolean;
  @ApiPropertyOptional({ enum: EVENT_STATUSES }) @IsOptional() @IsEnum(EVENT_STATUSES) status?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @IsNumber() @Min(1) @Max(1000) limit?: number;
}
