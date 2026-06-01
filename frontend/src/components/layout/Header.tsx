import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Sun, Moon } from 'lucide-react';
import useStore from '@/store/useStore';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const location = useLocation();
  const { theme, toggleTheme, searchQuery, setSearchQuery } = useStore();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/leads':
        return 'Leads Database';
      case '/settings':
        return 'System Configuration';
      default:
        return 'Cognitive CRM';
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/50 glass bg-white/70 dark:bg-slate-900/60 sticky top-0 z-20">
      {/* Mobile Toggle & Title */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 lg:hidden transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center space-x-4">
        {/* Search Input */}
        <div className="relative w-48 sm:w-64 hidden sm:flex items-center">
          <Search size={16} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        {/* Theme Toggle (Mobile Quick Access) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors sm:hidden"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

        {/* User profile */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
            AD
          </div>
          <span className="hidden md:inline text-xs font-bold text-slate-600 dark:text-slate-300">
            Architect
          </span>
        </div>
      </div>
    </header>
  );
};
