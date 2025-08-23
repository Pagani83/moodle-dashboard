import React from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function StatusCard({
  title,
  value,
  icon,
  isLoading,
  color = 'blue',
}: StatusCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="modern-card">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          {isLoading ? (
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
