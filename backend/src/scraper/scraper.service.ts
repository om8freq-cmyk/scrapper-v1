import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('scrape-queue') private readonly scrapeQueue: Queue,
  ) {}

  async createJob(targetUrl: string, config?: Record<string, unknown>) {
    const job = await this.prisma.scrapeJob.create({
      data: {
        targetUrl,
        config: config || null,
        status: 'PENDING',
      },
    });

    await this.scrapeQueue.add('scrape', {
      jobId: job.id,
      targetUrl,
      config,
    });

    this.logger.log(`Created scrape job ${job.id} for ${targetUrl}`);
    return job;
  }

  async listJobs() {
    return this.prisma.scrapeJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJob(id: string) {
    const job = await this.prisma.scrapeJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Scrape job with id "${id}" not found`);
    }
    return job;
  }

  async updateJobStatus(
    id: string,
    data: {
      status: string;
      leadsFound?: number;
      error?: string;
      startedAt?: Date;
      completedAt?: Date;
    },
  ) {
    return this.prisma.scrapeJob.update({
      where: { id },
      data,
    });
  }
}
