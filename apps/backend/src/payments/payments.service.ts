import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { CreatePaymentDto, BulkPaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(tutorId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tutorId, pagination);
    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, tutorId: string) {
    const payment = await this.repo.findOne(id, tutorId);
    if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  // REQ-06: single payment
  async create(tutorId: string, dto: CreatePaymentDto, userId: string) {
    return this.repo.create(tutorId, dto, userId);
  }

  // REQ-05 / REQ-07: bulk payment
  async createBulk(tutorId: string, dto: BulkPaymentDto, userId: string) {
    if (!dto.lessonIds.length) {
      throw new BadRequestException('lessonIds must not be empty');
    }

    // Verificăm că toate lecțiile aparțin tutorului și studentului
    const lessons = await this.prisma.lesson.findMany({
      where: {
        id:        { in: dto.lessonIds },
        tutorId,
        studentId: dto.studentId,
        deletedAt: null,
      },
    });

    if (lessons.length !== dto.lessonIds.length) {
      throw new BadRequestException(
        'One or more lessons not found or do not belong to this student',
      );
    }

    return this.repo.createBulk(tutorId, dto, userId);
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
