import React from 'react';
import { Users, UserPlus, Mail, TrendingUp } from 'lucide-react';
import useStore from '@/store/useStore';
import { Card } from '../ui/Card';

export const StatsCards: React.FC = () => {
  const { stats } = useStore();

  const mockStats = {
    total: 124,
    new: 42,
    emailSent: 78,
    converted: 18,
    todayCount: 12,
  };

  const currentStats = stats || mockStats;

  // Calculate conversion rate: converted / total * 100
  const conversionRate = currentStats.total > 0 
    ? Math.round((currentStats.converted / currentStats.total) * 100)
    : 0;

  const cardData = [
    {
      title: 'Total Leads',
      value: currentStats.total,
      indicator: `+${currentStats.new} new`,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/10',
    },
    {
      title: 'New Today',
      value: currentStats.todayCount,
      indicator: 'Scraped recently',
      icon: UserPlus,
      color: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/10',
    },
    {
      title: 'Emails Sent',
      value: currentStats.emailSent,
      indicator: `${currentStats.emailQueued || 0} queued`,
      icon: Mail,
      color: 'from-violet-500 to-indigo-500',
      glow: 'shadow-violet-500/10',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      indicator: `${currentStats.converted} converting`,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cardData.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card 
            key={i} 
            hoverEffect={true} 
            className={`p-5 relative flex items-center justify-between border-slate-200/50 dark:border-slate-800/40 shadow-sm ${card.glow}`}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {card.value}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {card.indicator}
              </span>
            </div>
            
            <div className={`p-3.5 rounded-xl bg-gradient-to-tr ${card.color} text-white shadow-md shadow-black/10`}>
              <Icon size={20} />
            </div>
          </Card>
        );
      })}
    </div>
  );
};
export default StatsCards;
