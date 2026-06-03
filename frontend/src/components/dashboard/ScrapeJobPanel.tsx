import React, { useState, useEffect } from 'react';
import { Play, Settings2, History, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import useStore from '@/store/useStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { JobStatus, ScrapeJob } from '@/types';
import * as api from '@/api/client';

export const ScrapeJobPanel: React.FC = () => {
  const { scrapeJobs, fetchScrapeJobs } = useStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrapeMode, setScrapeMode] = useState<'url' | 'omni'>('url');
  const [targetUrl, setTargetUrl] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  
  // Custom selector configuration
  const [containerSelector, setContainerSelector] = useState('');
  const [nameSelector, setNameSelector] = useState('');
  const [emailSelector, setEmailSelector] = useState('');
  const [phoneSelector, setPhoneSelector] = useState('');
  const [ageSelector, setAgeSelector] = useState('');

  // Target matching variables
  const [targetIndustry, setTargetIndustry] = useState('Restaurant');
  const [targetRegion, setTargetRegion] = useState('');
  const [deepLinkTraversal, setDeepLinkTraversal] = useState(true);

  useEffect(() => {
    fetchScrapeJobs();
    // Poll for changes in running jobs
    const timer = setInterval(() => {
      fetchScrapeJobs();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalTargetUrl = scrapeMode === 'omni' 
      ? `Omni-Discovery: ${targetIndustry} in ${targetRegion || 'Any Region'}` 
      : targetUrl;

    if (!finalTargetUrl) return;

    try {
      setIsSubmitting(true);
      const config: Record<string, any> = {
        mode: scrapeMode,
        targetIndustry,
        targetRegion,
        deepLinkTraversal,
      };
      if (containerSelector) config.containerSelector = containerSelector;
      if (nameSelector) config.nameSelector = nameSelector;
      if (emailSelector) config.emailSelector = emailSelector;
      if (phoneSelector) config.phoneSelector = phoneSelector;
      if (ageSelector) config.ageSelector = ageSelector;

      await api.createScrapeJob({
        targetUrl: finalTargetUrl,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      // Reset
      setTargetUrl('');
      setContainerSelector('');
      setNameSelector('');
      setEmailSelector('');
      setPhoneSelector('');
      setAgeSelector('');
      setTargetIndustry('Restaurant');
      setTargetRegion('');
      setDeepLinkTraversal(true);
      setShowConfig(false);
      setIsOpen(false);
      
      // Refresh listing
      fetchScrapeJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock scrape jobs fallback if backend yields nothing
  const mockJobs: ScrapeJob[] = [
    { id: '1', targetUrl: 'https://news.ycombinator.com/jobs', status: JobStatus.COMPLETED, leadsFound: 14, createdAt: '2026-06-01T15:20:00Z', completedAt: '2026-06-01T15:21:10Z' },
    { id: '2', targetUrl: 'https://reddit.com/r/startups', status: JobStatus.RUNNING, leadsFound: 0, createdAt: '2026-06-01T17:50:00Z' },
  ];

  const displayedJobs: ScrapeJob[] = scrapeJobs.length > 0 ? scrapeJobs : mockJobs;

  return (
    <div className="space-y-5">
      {/* Configuration launcher Card */}
      <Card className="p-5 border-slate-200/50 dark:border-slate-800/40 shadow-sm flex flex-col justify-between h-full space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Scraper Center
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">
              Deploy autonomous Playwright runners
            </p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setIsOpen(true)}
            className="text-xs flex items-center space-x-1"
          >
            <Play size={12} fill="currentColor" />
            <span>Launch Scrape</span>
          </Button>
        </div>

        {/* Short Job list headers */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <History size={12} />
            <span>Job Log history</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-850/80 max-h-64 overflow-y-auto pr-1">
            {displayedJobs.map((job) => (
              <div key={job.id} className="py-2.5 flex flex-col space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-650 dark:text-slate-300 truncate max-w-[150px]" title={job.targetUrl}>
                    {job.targetUrl}
                  </span>
                  <Badge status={job.status} />
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </span>
                  {job.status === JobStatus.COMPLETED && (
                    <span className="text-emerald-500 font-bold flex items-center space-x-0.5">
                      <CheckCircle size={10} />
                      <span>{job.leadsFound} leads</span>
                    </span>
                  )}
                  {job.status === JobStatus.FAILED && (
                    <span className="text-rose-500 font-semibold flex items-center space-x-0.5" title={job.error}>
                      <AlertTriangle size={10} />
                      <span>Failed</span>
                    </span>
                  )}
                  {job.status === JobStatus.RUNNING && (
                    <span className="text-sky-500 font-bold flex items-center space-x-1">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Running</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Launch Job Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Launch New Scraper"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Mode Selector Toggle */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
            <button
              type="button"
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${scrapeMode === 'url' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              onClick={() => setScrapeMode('url')}
            >
              Target Website URL Mode
            </button>
            <button
              type="button"
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${scrapeMode === 'omni' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              onClick={() => setScrapeMode('omni')}
            >
              Omni-Discovery Search
            </button>
          </div>

          {scrapeMode === 'url' ? (
            <Input
              id="target-url"
              label="Target Website URL"
              type="url"
              required={scrapeMode === 'url'}
              placeholder="https://example.com/directory"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="target-industry" className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Target Industry / Business Type
                </label>
                <select
                  id="target-industry"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Restaurant">Restaurant</option>
                  <option value="Hospital/Clinic">Hospital/Clinic</option>
                  <option value="Softtoy Business">Softtoy Business</option>
                  <option value="Clothing/Cloth">Clothing/Cloth</option>
                  <option value="Construction Field">Construction Field</option>
                </select>
              </div>

              <Input
                id="target-region"
                label="Target Region / Location"
                required={scrapeMode === 'omni'}
                placeholder="e.g. Chennai, Mumbai"
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Deep Link Traversal</span>
              <p className="text-[10px] text-slate-450 dark:text-slate-500">Scrape sub-routes (/about, /our-team, /contact) for real contacts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={deepLinkTraversal} 
                onChange={(e) => setDeepLinkTraversal(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-850 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Config options dropdown */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <Settings2 size={13} />
              <span>Advanced Element Custom Selectors</span>
            </button>

            {showConfig && (
              <div className="mt-3 grid grid-cols-2 gap-3 animate-slideUp">
                <div className="col-span-2">
                  <Input
                    id="sel-container"
                    label="Container Selector"
                    placeholder="e.g. .card, tr, li"
                    value={containerSelector}
                    onChange={(e) => setContainerSelector(e.target.value)}
                  />
                </div>
                <Input
                  id="sel-name"
                  label="Name Selector"
                  placeholder="e.g. .name, td:nth-child(1)"
                  value={nameSelector}
                  onChange={(e) => setNameSelector(e.target.value)}
                />
                <Input
                  id="sel-email"
                  label="Email Selector"
                  placeholder="e.g. .email, a[href^='mailto:']"
                  value={emailSelector}
                  onChange={(e) => setEmailSelector(e.target.value)}
                />
                <Input
                  id="sel-phone"
                  label="Phone Selector"
                  placeholder="e.g. .phone, a[href^='tel:']"
                  value={phoneSelector}
                  onChange={(e) => setPhoneSelector(e.target.value)}
                />
                <Input
                  id="sel-age"
                  label="Age Selector"
                  placeholder="e.g. .age, td:nth-child(2)"
                  value={ageSelector}
                  onChange={(e) => setAgeSelector(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Start Automation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ScrapeJobPanel;
