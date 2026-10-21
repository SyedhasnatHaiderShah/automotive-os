import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [MeController],
  providers: [MeService],
  exports: [MeService],
})
export class MeModule {}
