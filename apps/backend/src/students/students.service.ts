import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { StudentsRepository } from './students.repository';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly repo: StudentsRepository) {}

  async findAll(tutorId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tutorId, pagination);
    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, tutorId: string) {
    const student = await this.repo.findOne(id, tutorId);
    if (!student) throw new NotFoundException(`Student with ID ${id} not found`);
    return student;
  }

  async create(tutorId: string, dto: CreateStudentDto, userId: string) {
    return this.repo.create(tutorId, dto, userId);
  }

  async update(id: string, tutorId: string, dto: UpdateStudentDto, userId: string) {
    await this.findOne(id, tutorId); // aruncă 404 dacă nu există
    const result = await this.repo.update(id, tutorId, dto, userId);
    if (result.count === 0) throw new ForbiddenException();
    return this.findOne(id, tutorId);
  }

  async remove(id: string, tutorId: string, userId: string) {
    await this.findOne(id, tutorId);
    await this.repo.softDelete(id, tutorId, userId);
    return { message: 'Student deleted successfully' };
  }
}