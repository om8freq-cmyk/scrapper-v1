import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { LeadsModule } from '../leads/leads.module';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScraperWorker } from './scraper.worker';
import { GenericExtractor } from './extractors/generic.extractor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'scrape-queue' }),
    BullModule.registerQueue({ name: 'email-queue' }),
    PrismaModule,
    LeadsModule,
  ],
  controllers: [ScraperController],
  providers: [ScraperService, ScraperWorker, GenericExtractor],
})
export class ScraperModule {}
