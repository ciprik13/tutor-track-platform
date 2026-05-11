import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // disponibil în toate modulele fără import explicit
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}