import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { StudentsService } from "./students.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("Students")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("students")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: "List all students (paginated)" })
  @ApiResponse({ status: 200, description: "{ data, total, limit, offset }" })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.studentsService.findAll(user.sub, pagination);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get student by ID" })
  @ApiResponse({ status: 404, description: "Student not found" })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentsService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: "Create new student" })
  @ApiResponse({ status: 201, description: "Student created" })
  @Roles("TUTOR", "ADMIN")
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: JwtPayload) {
    return this.studentsService.create(user.sub, dto, user.sub);
  }

  @Patch(":id")
  @Roles("TUTOR", "ADMIN")
  @ApiOperation({ summary: 'Update student' })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentsService.update(id, user.sub, dto, user.sub);
  }

  @Delete(":id")
  @Roles("TUTOR", "ADMIN")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete student' })
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.studentsService.remove(id, user.sub, user.sub);
  }
}
