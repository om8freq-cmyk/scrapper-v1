import axios from 'axios';
import type { Lead, DashboardStats, ScrapeJob, PaginatedResponse } from '@/types';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface GetLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getLeads(params?: GetLeadsParams): Promise<PaginatedResponse<Lead>> {
  const { data } = await client.get<PaginatedResponse<Lead>>('/leads', { params });
  return data;
}

export async function getLeadStats(): Promise<DashboardStats> {
  const { data } = await client.get<DashboardStats>('/leads/stats');
  return data;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const { data } = await client.patch<Lead>(`/leads/${id}`, updates);
  return data;
}

export async function deleteLead(id: string): Promise<void> {
  await client.delete(`/leads/${id}`);
}

export async function getScrapeJobs(): Promise<ScrapeJob[]> {
  const { data } = await client.get<ScrapeJob[]>('/scraper/jobs');
  return data;
}

export async function createScrapeJob(jobData: { targetUrl: string; config?: Record<string, unknown> }): Promise<ScrapeJob> {
  const { data } = await client.post<ScrapeJob>('/scraper/jobs', jobData);
  return data;
}

export default client;
