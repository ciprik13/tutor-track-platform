import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsEnum, IsOptional, IsString,
  MaxLength, MinLength, IsNumber, Min, Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum StudentStatusDto {
  active = 'active',
  inactive = 'inactive',
}

export class CreateStudentDto {
  @ApiProperty({ example: 'Maria Ionescu' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Matematică' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  grade?: string;

  @ApiPropertyOptional({ enum: StudentStatusDto, default: 'active' })
  @IsOptional()
  @IsEnum(StudentStatusDto)
  status?: StudentStatusDto;

  @ApiPropertyOptional({ example: '+37369000000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => value === '' ? undefined : value)
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value === '' ? undefined : value)
  email?: string;

  @ApiPropertyOptional({ example: 'Progres bun la algebră' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  notes?: string;

  @ApiPropertyOptional({
    example: 250,
    description: 'Preț per ședință specific acestui student.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999)
  @Type(() => Number)
  priceOverride?: number;
}
