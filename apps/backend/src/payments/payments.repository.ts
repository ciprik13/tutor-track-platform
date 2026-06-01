import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, BulkPaymentDto } from './dto/create-payment.dto';
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
          lessonPayments: {
            include: {
              lesson: { select: { id: true, date: true, durationMinutes: true, price: true } },
            },
          },
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
        lessonPayments: {
          include: {
            lesson: { select: { id: true, date: true, durationMinutes: true, price: true } },
          },
        },
      },
    });
  }

  // REQ-06: single payment per lesson
  async create(tutorId: string, dto: CreatePaymentDto, createdBy: string) {
    return this.prisma.payment.create({
      data: {
        tutorId,
        studentId: dto.studentId,
        lessonId:  dto.lessonId ?? null,
        amount:    dto.amount,
        month:     dto.month,
        status:    dto.status   ?? 'unpaid',
        category:  dto.category ?? 'single',
        paidAt:    dto.paidAt ? new Date(dto.paidAt) : null,
        notes:     dto.notes,
        createdBy,
        updatedBy: createdBy,
        // Dacă avem lessonId, creăm și LessonPayment entry
        ...(dto.lessonId && {
          lessonPayments: {
            create: { lessonId: dto.lessonId },
          },
        }),
      },
    });
  }

  // REQ-05 / REQ-07: bulk payment pentru mai multe lecții
  async createBulk(tutorId: string, dto: BulkPaymentDto, createdBy: string) {
    const now = new Date();

    // Calculăm amount dacă nu e trimis explicit
    let amount = dto.amount;
    if (amount === undefined) {
      const lessons = await this.prisma.lesson.findMany({
        where: { id: { in: dto.lessonIds }, tutorId, deletedAt: null },
        select: { price: true },
      });
      amount = lessons.reduce((sum, l) => sum + Number(l.price), 0);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Creăm payment-ul bulk
      const payment = await tx.payment.create({
        data: {
          tutorId,
          studentId: dto.studentId,
          amount,
          month:     dto.month,
          status:    'paid',
          category:  'bulk',
          paidAt:    now,
          notes:     dto.notes,
          createdBy,
          updatedBy: createdBy,
          lessonPayments: {
            create: dto.lessonIds.map((lessonId) => ({ lessonId })),
          },
        },
        include: {
          lessonPayments: true,
        },
      });

      // 2. Marcăm toate lecțiile ca plătite
      await tx.lesson.updateMany({
        where: { id: { in: dto.lessonIds }, tutorId, deletedAt: null },
        data:  { isPaid: true, updatedBy: createdBy, updatedAt: now },
      });

      return payment;
    });
  }

  async update(id: string, tutorId: string, dto: UpdatePaymentDto, updatedBy: string) {
    return this.prisma.payment.updateMany({
      where: { id, tutorId, deletedAt: null },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.month  !== undefined && { month:  dto.month  }),
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
      data:  { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }
}