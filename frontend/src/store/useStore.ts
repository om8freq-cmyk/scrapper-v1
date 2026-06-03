import { create } from 'zustand';
import type { Lead, DashboardStats, ScrapeJob } from '@/types';
import { LeadStatus } from '@/types';
import * as api from '@/api/client';

type Theme = 'light' | 'dark';

interface AppState {
  // Theme
  theme: Theme;
  toggleTheme: () => void;
  initTheme: () => void;

  // Leads
  leads: Lead[];
  isLoading: boolean;
  fetchLeads: () => Promise<void>;

  // Stats
  stats: DashboardStats | null;
  fetchStats: () => Promise<void>;

  // Scrape Jobs
  scrapeJobs: ScrapeJob[];
  fetchScrapeJobs: () => Promise<void>;

  // Pagination
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: LeadStatus | 'ALL';
  setStatusFilter: (status: LeadStatus | 'ALL') => void;

  // Settings
  settings: Record<string, string> | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Record<string, string>) => Promise<void>;
}

function getSystemTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('crm-theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyThemeToDOM(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

const useStore = create<AppState>((set, get) => ({
  // Theme
  theme: getSystemTheme(),

  initTheme: () => {
    const theme = get().theme;
    applyThemeToDOM(theme);
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('crm-theme', newTheme);
    applyThemeToDOM(newTheme);
    set({ theme: newTheme });
  },

  // Leads
  leads: [],
  isLoading: false,

  fetchLeads: async () => {
    set({ isLoading: true });
    try {
      const { currentPage, searchQuery, statusFilter } = get();
      const params: api.GetLeadsParams = {
        page: currentPage,
        limit: 10,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await api.getLeads(params);
      set({
        leads: response.data,
        totalPages: response.totalPages,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  // Stats
  stats: null,

  fetchStats: async () => {
    try {
      const stats = await api.getLeadStats();
      set({ stats });
    } catch {
      // Stats fetch failed silently
    }
  },

  // Scrape Jobs
  scrapeJobs: [],

  fetchScrapeJobs: async () => {
    try {
      const jobs = await api.getScrapeJobs();
      set({ scrapeJobs: jobs });
    } catch {
      // Scrape jobs fetch failed silently
    }
  },

  // Pagination
  currentPage: 1,
  totalPages: 1,

  setPage: (page: number) => {
    set({ currentPage: page });
    get().fetchLeads();
  },

  // Filters
  searchQuery: '',

  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1 });
  },

  statusFilter: 'ALL',

  setStatusFilter: (status: LeadStatus | 'ALL') => {
    set({ statusFilter: status, currentPage: 1 });
  },

  // Settings
  settings: null,

  fetchSettings: async () => {
    try {
      const settings = await api.getSettings();
      set({ settings });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  },

  updateSettings: async (newSettings: Record<string, string>) => {
    try {
      const settings = await api.updateSettings(newSettings);
      set({ settings });
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  },
}));

export default useStore;
