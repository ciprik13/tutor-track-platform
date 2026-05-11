import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { LessonsRepository } from './lessons.repository';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly repo: LessonsRepository) {}

  async findAll(tutorId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tutorId, pagination);
    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, tutorId: string) {
    const lesson = await this.repo.findOne(id, tutorId);
    if (!lesson) throw new NotFoundException(`Lesson with ID ${id} not found`);
    return lesson;
  }

  async create(tutorId: string, dto: CreateLessonDto, userId: string) {
    // Fetch student to create immutable snapshot
    const student = await this.repo.findStudentForSnapshot(dto.studentId, tutorId);
    if (!student) {
      throw new BadRequestException(
        `Student ${dto.studentId} not found or does not belong to this tutor`,
      );
    }

    return this.repo.create(tutorId, dto, userId, {
      studentNameSnapshot: student.name,
      gradeSnapshot: student.grade ?? null,
      subjectSnapshot: student.subject ?? null,
    });
  }

  async update(id: string, tutorId: string, dto: UpdateLessonDto, userId: string) {
    await this.findOne(id, tutorId);
    const result = await this.repo.update(id, tutorId, dto, userId);
    if (result.count === 0) throw new ForbiddenException();
    return this.findOne(id, tutorId);
  }

  async remove(id: string, tutorId: string, userId: string) {
    await this.findOne(id, tutorId);
    await this.repo.softDelete(id, tutorId, userId);
    return { message: 'Lesson deleted successfully' };
  }
}