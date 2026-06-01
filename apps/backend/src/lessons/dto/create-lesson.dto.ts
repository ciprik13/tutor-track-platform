import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean, IsDateString, IsInt, IsNumber,
  IsOptional, IsString, IsUUID, Max, Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty({ example: 'e57a7633-116e-4e27-b777-6dd0e9e5be94' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: '2026-05-11T18:00:00.000Z' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 60, description: '60, 90 or 120 minutes' })
  @IsInt()
  @Min(30)
  @Max(180)
  durationMinutes!: number;

  @ApiProperty({ example: 25.00 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: 'google-event-id-123' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' || value === null ? undefined : value)
  googleCalendarEventId?: string;

  @ApiPropertyOptional({ example: 'Covered quadratic equations' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' || value === null ? undefined : value)
  notes?: string;
}
