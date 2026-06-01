import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from './email.service';
import { EmailWorker } from './email.worker';

@Module({
  imports: [QueueModule, PrismaModule],
  providers: [EmailService, EmailWorker],
  exports: [EmailService],
})
export class EmailModule {}
