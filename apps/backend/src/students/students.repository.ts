import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class StudentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tutorId: string, pagination: PaginationDto) {
    const where = { tutorId, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string, tutorId: string) {
    return this.prisma.student.findFirst({
      where: { id, tutorId, deletedAt: null },
    });
  }

  async create(tutorId: string, dto: CreateStudentDto, createdBy: string) {
    return this.prisma.student.create({
      data: { ...dto, tutorId, createdBy, updatedBy: createdBy },
    });
  }

  async update(id: string, tutorId: string, dto: UpdateStudentDto, updatedBy: string) {
    return this.prisma.student.updateMany({
      where: { id, tutorId, deletedAt: null },
      data: { ...dto, updatedBy, updatedAt: new Date() },
    });
  }

  async softDelete(id: string, tutorId: string, deletedBy: string) {
    return this.prisma.student.updateMany({
      where: { id, tutorId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });
  }
}