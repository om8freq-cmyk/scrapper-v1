import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Explicitly load env variables from the backend folder before constructing PrismaClient
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private static pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing');
    }

    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    // Initialize pg.Pool with dynamic SSL settings
    PrismaService.pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    const adapter = new PrismaPg(PrismaService.pool);
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('PrismaService initialized with PostgreSQL pg.Pool adapter');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    if (PrismaService.pool) {
      await PrismaService.pool.end();
    }
    this.logger.log('PrismaService disconnected and connection pool closed');
  }
}

