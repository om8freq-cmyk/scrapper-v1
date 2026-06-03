import React, { useEffect, useState } from 'react';
import { Mail, Shield, Globe } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import useStore from '@/store/useStore';

export const Settings: React.FC = () => {
  const { settings, fetchSettings, updateSettings } = useStore();

  const [concurrency, setConcurrency] = useState('3');
  const [delay, setDelay] = useState('1500');
  const [retries, setRetries] = useState('3');
  const [smtpHost, setSmtpHost] = useState('smtp.ethereal.email');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('your_ethereal_user@ethereal.email');
  const [smtpPass, setSmtpPass] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setConcurrency(settings['concurrency'] || '3');
      setDelay(settings['delay'] || '1500');
      setRetries(settings['retries'] || '3');
      setSmtpHost(settings['smtp-host'] || 'smtp.ethereal.email');
      setSmtpPort(settings['smtp-port'] || '587');
      setSmtpUser(settings['smtp-user'] || 'your_ethereal_user@ethereal.email');
      setSmtpPass(settings['smtp-pass'] || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        'concurrency': concurrency,
        'delay': delay,
        'retries': retries,
        'smtp-host': smtpHost,
        'smtp-port': smtpPort,
        'smtp-user': smtpUser,
        'smtp-pass': smtpPass,
      });
      alert('Settings successfully updated.');
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setIsResetting(true);
    setConcurrency('3');
    setDelay('1500');
    setRetries('3');
    setSmtpHost('smtp.ethereal.email');
    setSmtpPort('587');
    setSmtpUser('your_ethereal_user@ethereal.email');
    setSmtpPass('');
    setTimeout(() => {
      setIsResetting(false);
    }, 300);
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
              value={concurrency}
              onChange={(e) => setConcurrency(e.target.value)}
              required
            />
            <Input
              id="delay"
              label="Request Delay Pace (milliseconds)"
              type="number"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
              required
            />
            <Input
              id="retries"
              label="Failed Job Max Retries"
              type="number"
              value={retries}
              onChange={(e) => setRetries(e.target.value)}
              required
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
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              required
            />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  id="smtp-user"
                  label="SMTP Account User"
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  required
                />
              </div>
              <Input
                id="smtp-port"
                label="Port"
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                required
              />
            </div>
            <Input
              id="smtp-pass"
              label="SMTP Secret Key (Password)"
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="Leave blank to keep unchanged"
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
          <Button variant="secondary" type="button" onClick={handleReset} disabled={isResetting}>
            Reset Defaults
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Applying...' : 'Apply Updates'}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default Settings;
