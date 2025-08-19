"use client";

import { useEffect } from 'react';
import { useMoodleStore } from '@/store/moodle-store';

// This client-only component syncs the Zustand theme to the <html> classList
export function ThemeClient() {
  const { theme } = useMoodleStore();

  useEffect(() => {
    // Force immediate update on mount and theme changes
    const applyTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      
      // Remove both classes first to ensure clean state
      root.classList.remove('dark', 'light');
      body.classList.remove('dark', 'light');
      
      // Add the correct class
      if (theme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.add('light');
        body.classList.add('light');
      }
      
      // Force style recalculation
      root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
      
      // Force a reflow to ensure classes are applied
      root.offsetHeight;
      
      // Debug logging
      console.log('🎨 Theme applied:', theme, {
        rootClasses: Array.from(root.classList),
        bodyClasses: Array.from(body.classList),
        colorScheme: root.style.colorScheme
      });
    };

    // Apply immediately
    applyTheme();
    
    // Also apply after a small delay to handle any hydration issues
    const timer = setTimeout(applyTheme, 100);
    
    return () => clearTimeout(timer);
  }, [theme]);

  // Also apply on mount to handle SSR
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  return null;
}
