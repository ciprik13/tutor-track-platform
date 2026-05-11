import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum PaymentStatusDto {
  paid = 'paid',
  unpaid = 'unpaid',
  partial = 'partial',
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'e57a7633-116e-4e27-b777-6dd0e9e5be94' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: 'lesson-uuid-here' })
  @IsUUID()
  lessonId!: string;

  @ApiProperty({ example: 25.00 })
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

  @ApiPropertyOptional({ example: '2026-05-11T19:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}