import { Controller, Post, Body, HttpCode, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus } from '@prisma/client';

interface InboundWebhookBody {
  contactPhone: string;
  messageBody: string;
  channel?: string;
}

@Controller('v1/webhooks/communication')
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('inbound')
  @HttpCode(HttpStatus.OK)
  async handleInboundReply(@Body() body: InboundWebhookBody) {
    const { contactPhone, messageBody, channel = 'WHATSAPP' } = body;
    this.logger.log(`Received inbound message webhook from ${contactPhone}: "${messageBody}"`);

    if (!contactPhone || !messageBody) {
      return { success: false, error: 'contactPhone and messageBody are required fields' };
    }

    // Clean phone number to compare digits robustly
    const cleanedSearchPhone = contactPhone.replace(/[^\d]/g, '');

    // Query for a matching lead in the database
    // We fetch all leads and check if their cleaned phone digits match the cleaned webhook phone digits
    const leads = await this.prisma.lead.findMany();
    const lead = leads.find((l) => {
      if (!l.phone) return false;
      const cleanedLeadPhone = l.phone.replace(/[^\d]/g, '');
      return cleanedLeadPhone.includes(cleanedSearchPhone) || cleanedSearchPhone.includes(cleanedLeadPhone);
    });

    if (!lead) {
      this.logger.warn(`No lead matching phone origin "${contactPhone}" was found in the database.`);
      throw new NotFoundException(`Lead with phone number ${contactPhone} not found`);
    }

    this.logger.log(`Found matching Lead: ${lead.name} (id: ${lead.id}). Logging inbound message...`);

    // 1. Log inbound message into interaction timeline (MessageLog)
    const log = await this.prisma.messageLog.create({
      data: {
        leadId: lead.id,
        direction: 'INBOUND',
        channel,
        message: messageBody,
      },
    });

    // 2. Automatically upgrade visual pipeline column status badge to CONTACTED
    const updatedLead = await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.CONTACTED,
      },
    });

    this.logger.log(`Lead ${lead.name} status successfully upgraded to ${LeadStatus.CONTACTED}`);

    return {
      success: true,
      message: 'Inbound message processed and status updated.',
      data: {
        logId: log.id,
        leadId: updatedLead.id,
        newStatus: updatedLead.status,
      },
    };
  }
}
