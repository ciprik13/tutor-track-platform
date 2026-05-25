import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class LessonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tutorId: string, pagination: PaginationDto) {
    const where = { tutorId, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { date: 'desc' },
        include: {
          student: {
            select: { id: true, name: true, subject: true },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string, tutorId: string) {
    return this.prisma.lesson.findFirst({
      where: { id, tutorId, deletedAt: null },
      include: {
        student: {
          select: { id: true, name: true, subject: true, grade: true },
        },
        payment: true,
      },
    });
  }

  async findStudentForSnapshot(studentId: string, tutorId: string) {
    return this.prisma.student.findFirst({
      where: { id: studentId, tutorId, deletedAt: null },
      select: { name: true, grade: true, subject: true },
    });
  }

  async create(tutorId: string, dto: CreateLessonDto, createdBy: string, snapshot: {
    studentNameSnapshot: string;
    gradeSnapshot: string | null;
    subjectSnapshot: string | null;
  }) {
    // If a soft-deleted lesson exists with same googleCalendarEventId, restore it
    if (dto.googleCalendarEventId) {
      const existing = await this.prisma.lesson.findFirst({
        where: {
          tutorId,
          googleCalendarEventId: dto.googleCalendarEventId,
          deletedAt: { not: null },
        },
      });
      if (existing) {
        return this.prisma.lesson.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            date: new Date(dto.date),
            durationMinutes: dto.durationMinutes,
            price: dto.price,
            isPaid: dto.isPaid ?? false,
            notes: dto.notes,
            updatedBy: createdBy,
            updatedAt: new Date(),
          },
        });
      }
    }

    return this.prisma.lesson.create({
      data: {
        tutorId,
        studentId: dto.studentId,
        date: new Date(dto.date),
        durationMinutes: dto.durationMinutes,
        price: dto.price,
        isPaid: dto.isPaid ?? false,
        googleCalendarEventId: dto.googleCalendarEventId,
        notes: dto.notes,
        studentNameSnapshot: snapshot.studentNameSnapshot,
        gradeSnapshot: snapshot.gradeSnapshot,
        subjectSnapshot: snapshot.subjectSnapshot,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  async update(id: string, tutorId: string, dto: UpdateLessonDto, updatedBy: string) {
    return this.prisma.lesson.updateMany({
      where: { id, tutorId, deletedAt: null },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isPaid !== undefined && { isPaid: dto.isPaid }),
        ...(dto.googleCalendarEventId !== undefined && { googleCalendarEventId: dto.googleCalendarEventId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(id: string, tutorId: string, deletedBy: string) {
    return this.prisma.lesson.updateMany({
      where: { id, tutorId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }
}
