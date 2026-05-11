import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonsRepository } from './lessons.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonsRepository],
})
export class LessonsModule {}