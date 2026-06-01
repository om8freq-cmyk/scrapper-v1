import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  glass = true,
  className = '',
  ...props
}) => {
  const baseStyle = 'rounded-xl border transition-all duration-300';
  const glassStyle = 'glass';
  const plainStyle = 'bg-white border-slate-150 dark:bg-slate-900 dark:border-slate-800 shadow-sm';
  const hoverStyle = 'hover:-translate-y-1 hover:shadow-md dark:hover:shadow-black/20 hover:border-slate-300 dark:hover:border-slate-700';

  return (
    <div
      className={`
        ${baseStyle} 
        ${glass ? glassStyle : plainStyle} 
        ${hoverEffect ? hoverStyle : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
