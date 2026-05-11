import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'List all lessons (paginated)' })
  @ApiResponse({ status: 200, description: '{ data, total, limit, offset }' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.lessonsService.findAll(user.sub, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.findOne(id, user.sub);
  }

  @Post()
  @Roles('TUTOR', 'ADMIN')
  @ApiOperation({ summary: 'Create new lesson (auto-snapshots student grade)' })
  @ApiResponse({ status: 201, description: 'Lesson created with immutable student snapshot' })
  @ApiResponse({ status: 400, description: 'Student not found or not owned by tutor' })
  create(
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.create(user.sub, dto, user.sub);
  }

  @Patch(':id')
  @Roles('TUTOR', 'ADMIN')
  @ApiOperation({ summary: 'Update lesson' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.update(id, user.sub, dto, user.sub);
  }

  @Delete(':id')
  @Roles('TUTOR', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete lesson' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.remove(id, user.sub, user.sub);
  }
}