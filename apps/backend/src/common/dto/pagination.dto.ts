import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;

  constructor(data: T[], total: number, pagination: PaginationDto) {
    this.data = data;
    this.total = total;
    this.limit = pagination.limit;
    this.offset = pagination.offset;
  }
}