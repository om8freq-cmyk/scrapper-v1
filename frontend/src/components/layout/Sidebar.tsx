import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, Brain, Sun, Moon } from 'lucide-react';
import useStore from '@/store/useStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { theme, toggleTheme } = useStore();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/leads', label: 'Leads', icon: Users },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 z-40 transition-transform duration-300 lg:translate-x-0 lg:static
        border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        glass bg-white/70 dark:bg-slate-900/60
      `}>
        {/* Brand/Logo */}
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/80 space-x-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Brain size={20} className="animate-pulse" />
            </div>
            <span className="font-bold text-base tracking-wide uppercase gradient-text">
              Cognitive CRM
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center space-x-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative group
                    ${isActive 
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm border border-indigo-500/10' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="absolute left-0 w-1 h-6 rounded-r bg-gradient-to-b from-blue-500 to-indigo-600 top-1/2 -translate-y-1/2" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all duration-200 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800/50"
          >
            <div className="flex items-center space-x-3">
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full p-0.5 bg-slate-200 dark:bg-slate-700 transition-colors relative flex items-center`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-300 shadow-sm transition-transform duration-200 ${theme === 'dark' ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
