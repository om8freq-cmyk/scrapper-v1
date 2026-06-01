import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class EmailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailWorker.name);
  private worker!: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.worker = new Worker(
      'email-queue',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host, port },
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 60000, // 10 emails per minute
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Email Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Email Job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('Email worker initialized');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(job: Job) {
    const { leadId, email, name } = job.data;
    this.logger.log(`Processing email job for Lead: ${name} <${email}>`);

    try {
      // Find the lead first to check if they still exist
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error(`Lead with ID ${leadId} not found`);
      }

      // Send the email
      await this.emailService.sendWelcomeEmail({ name, email });

      // Update lead status
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.EMAIL_SENT,
          emailSentAt: new Date(),
        },
      });

      this.logger.log(`Successfully sent email to ${email}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to process email job for ${email}: ${error.message}`);

      try {
        await this.prisma.lead.update({
          where: { id: leadId },
          data: {
            status: LeadStatus.EMAIL_FAILED,
          },
        });
      } catch (dbError) {
        this.logger.error(`Failed to update lead status to FAILED for ${leadId}`);
      }

      throw error;
    }
  }
}
