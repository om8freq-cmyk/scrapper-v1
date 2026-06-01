import React from 'react';
import { Mail, Shield, Globe, Cpu } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Settings: React.FC = () => {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings successfully updated locally (backed by environment configurations).');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          System Configuration
        </h2>
        <p className="text-xs text-slate-450 dark:text-slate-500">
          Manage system variables, web scraping throttles, and transactional email integrations
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Scraper Configs */}
        <Card className="p-6 border-slate-200/50 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                Scraper Configuration
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-550">Adjust Playwright engine and delay policies</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <Input
              id="concurrency"
              label="Max Concurrency Workers"
              type="number"
              defaultValue="3"
              disabled
            />
            <Input
              id="delay"
              label="Request Delay Pace (milliseconds)"
              type="number"
              defaultValue="1500"
              disabled
            />
            <Input
              id="retries"
              label="Failed Job Max Retries"
              type="number"
              defaultValue="3"
              disabled
            />
          </div>
        </Card>

        {/* Email SMTP credentials */}
        <Card className="p-6 border-slate-200/50 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                SMTP Mailing Gateway
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-550">Target mail server configurations</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <Input
              id="smtp-host"
              label="SMTP Relayer Host"
              type="text"
              defaultValue="smtp.ethereal.email"
              disabled
            />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  id="smtp-user"
                  label="SMTP Account User"
                  type="text"
                  defaultValue="your_ethereal_user@ethereal.email"
                  disabled
                />
              </div>
              <Input
                id="smtp-port"
                label="Port"
                type="number"
                defaultValue="587"
                disabled
              />
            </div>
            <Input
              id="smtp-pass"
              label="SMTP Secret Key (Password)"
              type="password"
              defaultValue="••••••••••••••••"
              disabled
            />
          </div>
        </Card>

        {/* Security Info Card */}
        <Card className="p-6 border-slate-200/50 dark:border-slate-800/40 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                Security & Data Integrity
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-550">Relational validations, anti-bot policies, & CORS parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white/20 dark:bg-slate-900/10 space-y-1">
              <span className="font-bold text-slate-750 dark:text-slate-200">Anti-Bot User-Agent Spoofing</span>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Playwright browser context randomizes Viewport screen sizes and user-agent strings on each initialization to bypass basic security blocklists.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-white/20 dark:bg-slate-900/10 space-y-1">
              <span className="font-bold text-slate-750 dark:text-slate-200">Global CORS Policies & Helmet Headers</span>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Backend routes are masked with Helmet middleware parameters and configured origins. RESTful requests are restricted to safe whitelisted ports only.
              </p>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2 flex justify-end space-x-2">
          <Button variant="secondary" type="button" disabled>Reset Defaults</Button>
          <Button variant="primary" type="submit">Apply Updates</Button>
        </div>
      </form>
    </div>
  );
};
export default Settings;
