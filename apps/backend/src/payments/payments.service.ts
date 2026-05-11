import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly repo: PaymentsRepository) {}

  async findAll(tutorId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tutorId, pagination);
    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, tutorId: string) {
    const payment = await this.repo.findOne(id, tutorId);
    if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  async create(tutorId: string, dto: CreatePaymentDto, userId: string) {
    return this.repo.create(tutorId, dto, userId);
  }

  async update(id: string, tutorId: string, dto: UpdatePaymentDto, userId: string) {
    await this.findOne(id, tutorId);
    const result = await this.repo.update(id, tutorId, dto, userId);
    if (result.count === 0) throw new ForbiddenException();
    return this.findOne(id, tutorId);
  }

  async remove(id: string, tutorId: string, userId: string) {
    await this.findOne(id, tutorId);
    await this.repo.softDelete(id, tutorId, userId);
    return { message: 'Payment deleted successfully' };
  }
}
