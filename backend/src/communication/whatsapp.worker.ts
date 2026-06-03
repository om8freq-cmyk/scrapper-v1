import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsAppWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppWorker.name);
  private worker!: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.worker = new Worker(
      'whatsapp-queue',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host, port },
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`WhatsApp Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`WhatsApp Job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('WhatsApp worker initialized');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(job: Job) {
    const { leadId, phone, name, templateName, variables } = job.data;
    this.logger.log(`Processing WhatsApp job for Lead: ${name} (${phone}) using template: ${templateName}`);

    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error(`Lead with ID ${leadId} not found`);
      }

      // Retrieve Twilio configurations (fallbacks to mock parameters if not configured)
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || 'ACmock_sid';
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || 'mock_token';
      const fromWhatsAppNumber = this.configService.get<string>('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886';

      const messageContent = this.buildTemplateMessage(templateName, name, variables);

      if (accountSid !== 'ACmock_sid' && authToken !== 'mock_token') {
        // Production dispatch logic via Twilio REST API request using standard fetch or axios
        this.logger.log(`Dispatching live Twilio WhatsApp message to ${phone}`);
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        
        const bodyParams = new URLSearchParams({
          From: fromWhatsAppNumber,
          To: `whatsapp:${phone}`,
          Body: messageContent,
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Twilio dispatch failed: ${response.statusText} - ${errText}`);
        }
      } else {
        this.logger.log(`[MOCK WHATSAPP DISPATCH] To: ${phone} | Content: ${messageContent}`);
      }

      // Log outbound message in the interaction timeline database
      await this.prisma.messageLog.create({
        data: {
          leadId,
          direction: 'OUTBOUND',
          channel: 'WHATSAPP',
          message: `WhatsApp template sent [${templateName}]: "${messageContent}"`,
        },
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to process WhatsApp job for ${phone}: ${error.message}`);
      throw error;
    }
  }

  private buildTemplateMessage(templateName: string, name: string, variables?: Record<string, string>): string {
    const customMessage = variables?.customMessage || '';
    switch (templateName) {
      case 'welcome':
        return `Hello ${name}! Welcome to Cognitive CRM. We have registered your inquiry and a support representative will reach out shortly.`;
      case 'reminder':
        return `Hi ${name}, just a friendly reminder regarding our scheduled follow-up session. Please let us know if you need to reschedule.`;
      case 'followup':
        return `Hi ${name}, we tried contacting you earlier. ${customMessage || "Let's connect soon to discuss potential synergies!"}`;
      default:
        return `Hello ${name}, this is an automated update regarding your workspace request.`;
    }
  }
}
