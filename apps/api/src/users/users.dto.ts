import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() password: string;
  @ApiPropertyOptional({ enum: ['local', 'tourist'] })
  @IsOptional() @IsEnum(['local', 'tourist']) mode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
}

export class LoginDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() password: string;
}
