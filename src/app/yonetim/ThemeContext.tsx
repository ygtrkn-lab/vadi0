'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('vadiler_admin_theme') as Theme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('vadiler_admin_theme', theme);
      // Update document class for global styles
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Theme colors utility
export const themeColors = {
  dark: {
    bg: 'bg-black',
    bgSecondary: 'bg-neutral-950',
    bgTertiary: 'bg-neutral-900',
    bgCard: 'bg-neutral-900/50',
    bgHover: 'hover:bg-neutral-800',
    bgActive: 'bg-white',
    text: 'text-white',
    textSecondary: 'text-neutral-400',
    textMuted: 'text-neutral-500',
    textActive: 'text-black',
    border: 'border-neutral-800',
    borderLight: 'border-neutral-800/50',
    ring: 'ring-neutral-800',
    input: 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600',
    inputFocus: 'focus:ring-white/20 focus:border-neutral-700',
  },
  light: {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-gray-100',
    bgCard: 'bg-white',
    bgHover: 'hover:bg-gray-100',
    bgActive: 'bg-purple-600',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    textActive: 'text-white',
    border: 'border-gray-200',
    borderLight: 'border-gray-100',
    ring: 'ring-gray-200',
    input: 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400',
    inputFocus: 'focus:ring-purple-500/20 focus:border-purple-400',
  }
};

// Hook to get current theme colors
export function useThemeColors() {
  const { isDark } = useTheme();
  return isDark ? themeColors.dark : themeColors.light;
}
