import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsDateString, IsEnum, IsNumber,
  IsOptional, IsString, IsUUID, Min,
} from 'class-validator';

export enum PaymentStatusDto {
  paid    = 'paid',
  unpaid  = 'unpaid',
  partial = 'partial',
}

export enum PaymentCategoryDto {
  single = 'single',
  bulk   = 'bulk',
}

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional({ description: 'lessonId pentru single payment (REQ-06)' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: '2026-05' })
  @IsString()
  month!: string;

  @ApiPropertyOptional({ enum: PaymentStatusDto, default: 'unpaid' })
  @IsOptional()
  @IsEnum(PaymentStatusDto)
  status?: PaymentStatusDto;

  @ApiPropertyOptional({ enum: PaymentCategoryDto, default: 'single' })
  @IsOptional()
  @IsEnum(PaymentCategoryDto)
  category?: PaymentCategoryDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ── Bulk payment DTO (REQ-05 / REQ-07) ───────────────────
export class BulkPaymentDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: '2026-05' })
  @IsString()
  month!: string;

  @ApiProperty({ example: ['{uuid1}', '{uuid2}'] })
  @IsArray()
  @IsUUID('4', { each: true })
  lessonIds!: string[];

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}