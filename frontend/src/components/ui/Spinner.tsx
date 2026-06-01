import React from 'react';

interface SpinnerProps {
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full rounded-full border-[2.5px] border-slate-200 dark:border-slate-800"></div>
      <div className="absolute top-0 left-0 w-full h-full rounded-full border-[2.5px] border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
    </div>
  );
};
