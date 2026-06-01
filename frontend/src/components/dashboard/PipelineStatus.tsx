import React from 'react';
import { Globe, ShieldCheck, Database, Send, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';

export const PipelineStatus: React.FC = () => {
  const steps = [
    {
      title: 'Scrape Targets',
      desc: 'Dynamic Playwright extraction',
      icon: Globe,
      color: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
      glow: 'shadow-blue-500/10',
    },
    {
      title: 'Validate & Clean',
      desc: 'Regex filtering & duplicates',
      icon: ShieldCheck,
      color: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
      glow: 'shadow-amber-500/10',
    },
    {
      title: 'Store Securely',
      desc: 'PostgreSQL relational indexing',
      icon: Database,
      color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
      glow: 'shadow-emerald-500/10',
    },
    {
      title: 'Auto Engage',
      desc: 'Personalized Nodemailer flows',
      icon: Send,
      color: 'text-violet-500 border-violet-500/20 bg-violet-500/5',
      glow: 'shadow-violet-500/10',
    },
  ];

  return (
    <Card className="p-6 border-slate-200/50 dark:border-slate-800/40 shadow-sm">
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Lead Automation Pipeline
          </h3>
          <p className="text-xs text-slate-450 dark:text-slate-500">
            Real-time visual data processing steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={idx}>
                <div className="flex items-center flex-1">
                  <div className="flex items-center space-x-3 w-full p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/30 glass bg-white/40 dark:bg-slate-900/20 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 relative overflow-hidden group">
                    {/* Pulsing indicator */}
                    <div className="absolute top-2 right-2 flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${idx === 0 ? 'bg-blue-400' : idx === 1 ? 'bg-amber-400' : idx === 2 ? 'bg-emerald-400' : 'bg-violet-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-amber-500' : idx === 2 ? 'bg-emerald-500' : 'bg-violet-500'}`}></span>
                    </div>

                    <div className={`p-2.5 rounded-lg border ${step.color} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                      <Icon size={18} />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {step.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {idx < 3 && (
                    <div className="hidden md:flex text-slate-300 dark:text-slate-800 mx-2">
                      <ArrowRight size={16} />
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
export default PipelineStatus;
