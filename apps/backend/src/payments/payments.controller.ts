import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payments (paginated)' })
  @ApiResponse({ status: 200, description: '{ data, total, limit, offset }' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.paymentsService.findAll(user.sub, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.findOne(id, user.sub);
  }

  @Post()
  @Roles('TUTOR', 'ADMIN')
  @ApiOperation({ summary: 'Create payment for a lesson' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.create(user.sub, dto, user.sub);
  }

  @Patch(':id')
  @Roles('TUTOR', 'ADMIN')
  @ApiOperation({ summary: 'Update payment (e.g. mark as paid)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.update(id, user.sub, dto, user.sub);
  }

  @Delete(':id')
  @Roles('TUTOR', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete payment' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.remove(id, user.sub, user.sub);
  }
}
