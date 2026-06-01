import React, { useEffect } from 'react';
import { Download, SlidersHorizontal, Trash } from 'lucide-react';
import useStore from '@/store/useStore';
import { LeadTable } from '../components/dashboard/LeadTable';
import { Button } from '../components/ui/Button';

export const Leads: React.FC = () => {
  const { fetchLeads, fetchStats } = useStore();

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, []);

  const handleExport = () => {
    alert('Exporting lead list to CSV format...');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Options */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Leads Database
          </h2>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            View, audit, search, update status, and manage all extracted targets
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex items-center space-x-2.5">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleExport}
            className="flex items-center space-x-1.5"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </Button>

          <Button 
            variant="glass" 
            size="sm" 
            className="flex items-center space-x-1.5"
          >
            <SlidersHorizontal size={14} />
            <span>Refine Filters</span>
          </Button>
        </div>
      </div>

      {/* Main leads view */}
      <LeadTable />
    </div>
  );
};
export default Leads;
