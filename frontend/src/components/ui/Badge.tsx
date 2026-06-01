import React from 'react';
import { LeadStatus } from '@/types';

interface BadgeProps {
  status: LeadStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles: Record<string, string> = {
    // Lead statuses
    [LeadStatus.NEW]: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]',
    [LeadStatus.EMAIL_QUEUED]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
    [LeadStatus.EMAIL_SENT]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
    [LeadStatus.EMAIL_FAILED]: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]',
    [LeadStatus.CONTACTED]: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.1)]',
    [LeadStatus.CONVERTED]: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.1)]',
    
    // Job statuses
    PENDING: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
    RUNNING: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.15)]',
    COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    FAILED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  };

  const formattedLabel: Record<string, string> = {
    [LeadStatus.NEW]: 'New',
    [LeadStatus.EMAIL_QUEUED]: 'Email Queued',
    [LeadStatus.EMAIL_SENT]: 'Email Sent',
    [LeadStatus.EMAIL_FAILED]: 'Email Failed',
    [LeadStatus.CONTACTED]: 'Contacted',
    [LeadStatus.CONVERTED]: 'Converted',
    PENDING: 'Pending',
    RUNNING: 'Running',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
  };

  const currentStyle = styles[status] || 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
  const label = formattedLabel[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${currentStyle}`}>
      {status === 'RUNNING' && (
        <span className="w-1.5 h-1.5 mr-1.5 bg-sky-500 rounded-full animate-ping"></span>
      )}
      {label}
    </span>
  );
};
