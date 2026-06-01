import {
  Controller,
  Post,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { ScraperService } from './scraper.service';

interface CreateJobBody {
  targetUrl: string;
  config?: {
    containerSelector?: string;
    nameSelector?: string;
    ageSelector?: string;
    emailSelector?: string;
    phoneSelector?: string;
  };
}

@Controller('scraper/jobs')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post()
  async createJob(@Body() body: CreateJobBody) {
    return this.scraperService.createJob(body.targetUrl, body.config);
  }

  @Get()
  async listJobs() {
    return this.scraperService.listJobs();
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    return this.scraperService.getJob(id);
  }
}
