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
  private checkInterval!: NodeJS.Timeout;

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

    // Run dynamic evaluation every hour
    this.checkInterval = setInterval(() => {
      this.checkAndSendFollowUps().catch((err) => {
        this.logger.error(`Error in periodic follow-ups evaluation: ${err.message}`);
      });
    }, 60 * 60 * 1000);

    // Initial check after 5 seconds
    setTimeout(() => {
      this.checkAndSendFollowUps().catch((err) => {
        this.logger.error(`Error in initial follow-ups evaluation: ${err.message}`);
      });
    }, 5000);

    this.logger.log('Email worker initialized with automated follow-ups cron checker');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private async processJob(job: Job) {
    const { leadId, email, name } = job.data;
    this.logger.log(`Processing email job for Lead: ${name} <${email}>`);

    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error(`Lead with ID ${leadId} not found`);
      }

      // Send the welcome email
      await this.emailService.sendWelcomeEmail({ name, email });

      // Update lead status
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.EMAIL_SENT,
          emailSentAt: new Date(),
        },
      });

      // Log outbound message into the interaction timeline
      await this.prisma.messageLog.create({
        data: {
          leadId,
          direction: 'OUTBOUND',
          channel: 'EMAIL',
          message: 'Welcome email successfully sent.',
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

  async checkAndSendFollowUps() {
    this.logger.log('Running automated follow-up evaluation (72-hour rule)...');
    
    // Find all leads that are in EMAIL_SENT status and haven't had an update or response in 72 hours
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const staleLeads = await this.prisma.lead.findMany({
      where: {
        status: LeadStatus.EMAIL_SENT,
        emailSentAt: { lte: seventyTwoHoursAgo },
      },
    });

    if (staleLeads.length === 0) {
      this.logger.log('No stale leads requiring follow-up emails.');
      return;
    }

    this.logger.log(`Found ${staleLeads.length} leads requiring follow-ups.`);

    for (const lead of staleLeads) {
      try {
        await this.emailService.sendFollowUpEmail({ name: lead.name, email: lead.email });

        // Update emailSentAt to avoid repeating follow-ups
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: {
            emailSentAt: new Date(),
          },
        });

        // Log the follow-up email to MessageLog
        await this.prisma.messageLog.create({
          data: {
            leadId: lead.id,
            direction: 'OUTBOUND',
            channel: 'EMAIL',
            message: 'Follow-up email dispatched automatically after 72 hours of no response.',
          },
        });

        this.logger.log(`Follow-up email successfully sent to ${lead.email}`);
      } catch (error: any) {
        this.logger.error(`Failed to dispatch follow-up to ${lead.email}: ${error.message}`);
      }
    }
  }
}
