import React from 'react';
import { BoardStats as BoardStatsType } from '../types';
import { formatTimeCompact } from '../utils/timeFormat';

interface BoardStatsProps {
  stats: BoardStatsType;
}

export const BoardStats: React.FC<BoardStatsProps> = ({ stats }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center text-xs sm:text-sm">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-medium text-slate-500 dark:text-slate-400">📋</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/60 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm">
          {stats.currentTasks}/{stats.totalTasks}
        </span>
      </div>
      
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-medium text-slate-500 dark:text-slate-400">⏱️</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/60 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm">
          {formatTimeCompact(stats.totalAllocatedTime)}
        </span>
      </div>
      
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-medium text-slate-500 dark:text-slate-400">⏳</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/60 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm">
          {formatTimeCompact(stats.totalRemainingTime)}
        </span>
      </div>
      
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-medium text-slate-500 dark:text-slate-400">⚡</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm">
          +{formatTimeCompact(stats.pointsWon)}
        </span>
      </div>
      
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-medium text-slate-500 dark:text-slate-400">🧨</span>
        <span className="font-bold text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm">
          -{formatTimeCompact(stats.pointsLost)}
        </span>
      </div>
      
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-medium text-slate-500 dark:text-slate-400">📊</span>
        <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm">
          {stats.finishEfficiency.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};