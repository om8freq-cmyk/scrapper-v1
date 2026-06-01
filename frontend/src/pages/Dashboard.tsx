import React, { useEffect } from 'react';
import useStore from '@/store/useStore';
import { StatsCards } from '../components/dashboard/StatsCards';
import { PipelineStatus } from '../components/dashboard/PipelineStatus';
import { LeadTable } from '../components/dashboard/LeadTable';
import { ScrapeJobPanel } from '../components/dashboard/ScrapeJobPanel';

export const Dashboard: React.FC = () => {
  const { fetchLeads, fetchStats, fetchScrapeJobs } = useStore();

  useEffect(() => {
    // Initial fetch on page mount
    fetchLeads();
    fetchStats();
    fetchScrapeJobs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Intro Greetings banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white border border-indigo-500/20 shadow-md shadow-indigo-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Welcome to Cognitive CRM Workspace
          </h2>
          <p className="text-xs md:text-sm text-indigo-100 font-medium">
            Monitor and manage target scrape endpoints, structures, validation, and auto-mailing queues.
          </p>
        </div>
      </div>

      {/* Numerical Stats overview */}
      <StatsCards />

      {/* Functional Pipeline Visual Map */}
      <PipelineStatus />

      {/* Detailed listing and Scraper triggers split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <LeadTable />
        </div>
        <div>
          <ScrapeJobPanel />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
