import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { Prisma, LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryLeadsDto) {
    const { page, limit, status, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};

    if (status) {
      where.status = status as LeadStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, groupedStatuses, todayCount] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.lead.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const group of groupedStatuses) {
      statusMap[group.status] = group._count.status;
    }

    return {
      total,
      new: statusMap[LeadStatus.NEW] || 0,
      emailSent: statusMap[LeadStatus.EMAIL_SENT] || 0,
      emailQueued: statusMap[LeadStatus.EMAIL_QUEUED] || 0,
      contacted: statusMap[LeadStatus.CONTACTED] || 0,
      converted: statusMap[LeadStatus.CONVERTED] || 0,
      todayCount,
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with id "${id}" not found`);
    }
    return lead;
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.findOne(id);
    return this.prisma.lead.update({
      where: { id },
      data: data as Prisma.LeadUpdateInput,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lead.delete({ where: { id } });
  }

  async createFromScrape(leadData: {
    name: string;
    age?: number;
    email: string;
    phone?: string;
    source: string;
  }) {
    const result = await this.prisma.lead.upsert({
      where: { email: leadData.email },
      update: {
        name: leadData.name,
        age: leadData.age,
        phone: leadData.phone,
      },
      create: {
        name: leadData.name,
        age: leadData.age,
        email: leadData.email,
        phone: leadData.phone || null,
        source: leadData.source,
        status: LeadStatus.NEW,
      },
    });

    this.logger.log(`Upserted lead: ${result.email} (id: ${result.id})`);
    return result;
  }
}
