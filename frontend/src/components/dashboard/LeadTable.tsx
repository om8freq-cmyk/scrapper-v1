import React, { useState, useEffect } from 'react';
import { Search, Mail, Trash2, Eye, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import useStore from '@/store/useStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { LeadStatus } from '@/types';
import * as api from '@/api/client';

export const LeadTable: React.FC = () => {
  const {
    leads,
    isLoading,
    fetchLeads,
    fetchStats,
    currentPage,
    totalPages,
    setPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
  } = useStore();

  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [manualEmailingId, setManualEmailingId] = useState<string | null>(null);

  // Trigger search on inputs
  useEffect(() => {
    fetchLeads();
  }, [currentPage, searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteLead(id);
      fetchLeads();
      fetchStats();
      setDeleteId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      setManualEmailingId(id);
      await api.updateLead(id, { status: LeadStatus.EMAIL_QUEUED });
      fetchLeads();
      fetchStats();
      // Simulate API enqueue trigger success
      setTimeout(() => {
        setManualEmailingId(null);
      }, 800);
    } catch (e) {
      console.error(e);
      setManualEmailingId(null);
    }
  };

  // Mock leads fallback if backend yields nothing
  const mockLeads = [
    { id: '1', name: 'John Doe', age: 34, email: 'john.doe@gmail.com', phone: '+1234567890', source: 'https://news.ycombinator.com', status: LeadStatus.NEW, createdAt: '2026-06-01T12:00:00Z' },
    { id: '2', name: 'Alice Smith', age: 28, email: 'alice.smith@techcorp.io', phone: '+1987654321', source: 'https://github.com/trending', status: LeadStatus.EMAIL_SENT, createdAt: '2026-06-01T10:30:00Z' },
    { id: '3', name: 'Bob Johnson', age: 45, email: 'bob.j@financeplus.com', phone: undefined, source: 'https://linkedin.com', status: LeadStatus.EMAIL_QUEUED, createdAt: '2026-05-31T18:15:00Z' },
    { id: '4', name: 'Emma Watson', age: 32, email: 'emma@watsondesign.co', phone: '+447911123456', source: 'https://dribbble.com', status: LeadStatus.CONVERTED, createdAt: '2026-05-30T14:40:00Z' },
    { id: '5', name: 'David Lee', age: 29, email: 'david.lee@leemedia.net', phone: '+85291234567', source: 'https://reddit.com/r/startups', status: LeadStatus.EMAIL_FAILED, createdAt: '2026-05-29T09:00:00Z' },
  ];

  const displayedLeads = leads.length > 0 ? leads : (searchQuery || statusFilter !== 'ALL' ? [] : mockLeads);

  return (
    <Card className="border-slate-200/50 dark:border-slate-800/40 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header filter options */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/30 dark:bg-slate-900/10">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center">
          Leads Directory
          {isLoading && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>}
        </h3>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Search bar inside table widget */}
          <div className="relative flex-1 sm:w-60">
            <Search size={15} className="absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name/email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(LeadStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/50 dark:bg-slate-950/10 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Phone</th>
              <th className="px-6 py-3.5">Age</th>
              <th className="px-6 py-3.5">Source</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Created</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300 text-xs">
            {displayedLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors"
              >
                <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                  {lead.name}
                </td>
                <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                  {lead.email}
                </td>
                <td className="px-6 py-3.5 font-mono text-slate-400 dark:text-slate-500">
                  {lead.phone || '—'}
                </td>
                <td className="px-6 py-3.5">
                  {lead.age || '—'}
                </td>
                <td className="px-6 py-3.5 max-w-[150px] truncate text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
                  <a href={lead.source} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1">
                    <span>Target URL</span>
                    <ExternalLink size={10} />
                  </a>
                </td>
                <td className="px-6 py-3.5">
                  <Badge status={lead.status} />
                </td>
                <td className="px-6 py-3.5 text-slate-400 dark:text-slate-500 font-medium">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-3.5 text-right space-x-2">
                  <button 
                    onClick={() => setSelectedLead(lead)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all inline-flex"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    onClick={() => handleSendEmail(lead.id)}
                    disabled={manualEmailingId === lead.id || lead.status === LeadStatus.EMAIL_SENT}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all inline-flex ${lead.status === LeadStatus.EMAIL_SENT ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Mail size={14} />
                  </button>
                  <button 
                    onClick={() => setDeleteId(lead.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all inline-flex"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {displayedLeads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                  No leads found matching current query filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {leads.length > 0 && totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/40 dark:bg-slate-950/5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center space-x-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal View */}
      <Modal
        isOpen={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        title="Lead Information"
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedLead.name}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <div className="mt-0.5"><Badge status={selectedLead.status} /></div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">{selectedLead.email}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                <p className="text-sm font-medium text-slate-650 dark:text-slate-350 mt-0.5">{selectedLead.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age</span>
                <p className="text-sm font-medium text-slate-650 dark:text-slate-350 mt-0.5">{selectedLead.age || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Scraper</span>
                <p className="text-sm font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 mt-0.5 truncate max-w-[160px]">
                  <a href={selectedLead.source} target="_blank" rel="noreferrer">{selectedLead.source}</a>
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created At</span>
                <p className="text-sm text-slate-500 mt-0.5">{new Date(selectedLead.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</span>
                <p className="text-sm text-slate-500 mt-0.5">{new Date(selectedLead.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 space-x-2.5 border-t border-slate-100 dark:border-slate-800/80">
              <Button variant="secondary" onClick={() => setSelectedLead(null)}>Close</Button>
              <Button 
                variant="primary" 
                disabled={selectedLead.status === LeadStatus.EMAIL_SENT}
                onClick={() => {
                  handleSendEmail(selectedLead.id);
                  setSelectedLead(null);
                }}
              >
                Trigger Welcome Email
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to permanently delete this lead? This action is irreversible and will remove all structured mailing records associated with it.
          </p>
          <div className="flex justify-end space-x-2.5 pt-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Delete Lead</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
export default LeadTable;
