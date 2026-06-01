import React, { useEffect, useState } from 'react';
import useStore from '@/store/useStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { initTheme, theme } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize theme on mount and whenever theme changes
  useEffect(() => {
    initTheme();
  }, [initTheme, theme]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default Layout;
