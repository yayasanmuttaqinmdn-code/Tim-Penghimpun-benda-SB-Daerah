import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, ThemeMode } from '../utils/themeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'compact' | 'segmented';
}

export default function ThemeToggle({ className = '', variant = 'compact' }: ThemeToggleProps) {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    const options: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
      { mode: 'light', label: 'Terang', icon: Sun },
      { mode: 'dark', label: 'Gelap', icon: Moon },
      { mode: 'system', label: 'Otomatis', icon: Laptop },
    ];

    return (
      <div className={`inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-inner ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setTheme(opt.mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-sky-600 text-sky-850 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default compact toggle for top header bar
  const isDark = effectiveTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
      title={isDark ? 'Klik untuk Mode Terang (Light Mode)' : 'Klik untuk Mode Gelap (Dark Mode)'}
      className={`relative inline-flex items-center justify-center p-1.5 rounded-full border transition-all cursor-pointer ${
        isDark
          ? 'bg-slate-800/90 hover:bg-slate-700 border-amber-400/40 text-amber-300 hover:text-amber-200 shadow-xs'
          : 'bg-white/15 hover:bg-white/25 border-white/25 text-amber-300 hover:text-amber-200 shadow-xs'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-amber-300 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-sky-200 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
