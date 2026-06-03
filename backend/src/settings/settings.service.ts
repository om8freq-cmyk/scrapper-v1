import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  private readonly defaults: Record<string, string> = {
    'concurrency': '3',
    'delay': '1500',
    'retries': '3',
    'smtp-host': 'smtp.ethereal.email',
    'smtp-port': '587',
    'smtp-user': 'your_ethereal_user@ethereal.email',
    'smtp-pass': 'your_ethereal_password',
  };

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Initializing system settings table with default configurations...');
    try {
      for (const [key, value] of Object.entries(this.defaults)) {
        const existing = await this.prisma.systemSetting.findUnique({
          where: { key },
        });
        if (!existing) {
          await this.prisma.systemSetting.create({
            data: { key, value },
          });
          this.logger.log(`Created default setting: ${key} = ${value}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to seed settings: ${error.message}`);
    }
  }

  async getSetting(key: string): Promise<string> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key },
      });
      return setting ? setting.value : (this.defaults[key] || '');
    } catch {
      return this.defaults[key] || '';
    }
  }

  async getAllSettings(): Promise<Record<string, string>> {
    try {
      const dbSettings = await this.prisma.systemSetting.findMany();
      const settingsMap: Record<string, string> = {};
      
      // Load defaults first
      for (const [key, val] of Object.entries(this.defaults)) {
        settingsMap[key] = val;
      }
      
      // Override with DB values
      for (const item of dbSettings) {
        settingsMap[item.key] = item.value;
      }
      
      return settingsMap;
    } catch {
      return this.defaults;
    }
  }

  async updateSettings(updates: Record<string, string>): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(updates)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    return this.getAllSettings();
  }
}
