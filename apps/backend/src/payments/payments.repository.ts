import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tutorId: string, pagination: PaginationDto) {
    const where = { tutorId, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, name: true } },
          lesson: { select: { id: true, date: true, durationMinutes: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string, tutorId: string) {
    return this.prisma.payment.findFirst({
      where: { id, tutorId, deletedAt: null },
      include: {
        student: { select: { id: true, name: true } },
        lesson: { select: { id: true, date: true, durationMinutes: true, price: true } },
      },
    });
  }

  async create(tutorId: string, dto: CreatePaymentDto, createdBy: string) {
    return this.prisma.payment.create({
      data: {
        tutorId,
        studentId: dto.studentId,
        lessonId: dto.lessonId,
        amount: dto.amount,
        month: dto.month,
        status: dto.status ?? 'unpaid',
        paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  async update(id: string, tutorId: string, dto: UpdatePaymentDto, updatedBy: string) {
    return this.prisma.payment.updateMany({
      where: { id, tutorId, deletedAt: null },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.month !== undefined && { month: dto.month }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.paidAt !== undefined && { paidAt: new Date(dto.paidAt) }),
        updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(id: string, tutorId: string, deletedBy: string) {
    return this.prisma.payment.updateMany({
      where: { id, tutorId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }
}