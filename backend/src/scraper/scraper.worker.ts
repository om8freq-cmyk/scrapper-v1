import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Worker, Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { GenericExtractor, ScrapeConfig } from './extractors/generic.extractor';
import { chromium } from 'playwright';
import { LeadStatus, JobStatus } from '@prisma/client';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
];

@Injectable()
export class ScraperWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScraperWorker.name);
  private worker!: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly leadsService: LeadsService,
    private readonly extractor: GenericExtractor,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
  ) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.worker = new Worker(
      'scrape-queue',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host, port },
        concurrency: this.configService.get<number>('SCRAPER_MAX_CONCURRENCY', 2),
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Scraper Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Scraper Job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('Scraper worker initialized');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(job: Job) {
    const { jobId, targetUrl, config } = job.data;
    this.logger.log(`Starting scrape job ${jobId} for target ${targetUrl}`);

    await this.prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: JobStatus.RUNNING, startedAt: new Date() },
    });

    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const viewport = VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        userAgent,
        viewport,
        locale: 'en-US',
        timezoneId: 'America/New_York',
      });

      const page = await context.newPage();

      // Block unnecessary resources to speed up and look more like a standard automation bypass
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      // Navigate to target url
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Pacing delay
      const delay = this.configService.get<number>('SCRAPER_REQUEST_DELAY_MS', 1500);
      await page.waitForTimeout(delay);

      // Extract raw data
      const extractedLeads = await this.extractor.extract(page, config as ScrapeConfig);

      let savedCount = 0;

      for (const rawLead of extractedLeads) {
        // Check if lead already exists to see if it's genuinely new
        const existingLead = await this.prisma.lead.findUnique({
          where: { email: rawLead.email },
        });

        // Upsert lead
        const lead = await this.leadsService.createFromScrape({
          name: rawLead.name,
          age: rawLead.age,
          email: rawLead.email,
          phone: rawLead.phone,
          source: targetUrl,
        });

        savedCount++;

        // If the lead didn't exist before, or was in NEW status without email queued, enqueue it for welcome email
        if (!existingLead || existingLead.status === LeadStatus.NEW) {
          // Update status to EMAIL_QUEUED to avoid duplicate emails if rescraped before processing
          await this.leadsService.update(lead.id, { status: LeadStatus.EMAIL_QUEUED });

          // Add to email queue
          await this.emailQueue.add('send-welcome-email', {
            leadId: lead.id,
            email: lead.email,
            name: lead.name,
          });

          this.logger.log(`Enqueued email for new lead: ${lead.email}`);
        }
      }

      // Update scrape job database entry
      await this.prisma.scrapeJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          leadsFound: savedCount,
          completedAt: new Date(),
        },
      });

      return { leadsFound: savedCount };
    } catch (error: any) {
      this.logger.error(`Error during scrape job ${jobId}: ${error.message}`, error.stack);

      await this.prisma.scrapeJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          error: error.message,
          completedAt: new Date(),
        },
      });

      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
