export enum LeadStatus {
  NEW = 'NEW',
  EMAIL_QUEUED = 'EMAIL_QUEUED',
  EMAIL_SENT = 'EMAIL_SENT',
  EMAIL_FAILED = 'EMAIL_FAILED',
  CONTACTED = 'CONTACTED',
  CONVERTED = 'CONVERTED',
  INCOMPLETE = 'INCOMPLETE',
}

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Lead {
  id: string;
  name: string;
  age?: number;
  email: string;
  phone?: string;
  source: string;
  status: LeadStatus;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
  instagramHandle?: string;
  facebookUrl?: string;
}

export interface ScrapeJob {
  id: string;
  targetUrl: string;
  status: JobStatus;
  leadsFound: number;
  error?: string;
  config?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  new: number;
  emailSent: number;
  emailQueued: number;
  contacted: number;
  converted: number;
  todayCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
