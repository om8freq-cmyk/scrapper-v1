import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { CommunicationController } from './communication.controller';
import { WhatsAppWorker } from './whatsapp.worker';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [CommunicationController],
  providers: [WhatsAppWorker],
  exports: [WhatsAppWorker],
})
export class CommunicationModule {}
