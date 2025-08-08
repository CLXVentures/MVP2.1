import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group touch-manipulation"
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5">
        <Sun className={`absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 text-amber-500 transition-all duration-300 ${
          theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'
        }`} />
        <Moon className={`absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 text-blue-400 transition-all duration-300 ${
          theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
        }`} />
      </div>
    </button>
  );
};