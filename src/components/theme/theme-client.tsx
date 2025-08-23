"use client";

import { useEffect } from 'react';
import { useMoodleStore } from '@/store/moodle-store';

export function ThemeClient() {
  const { theme } = useMoodleStore();

  useEffect(() => {
    const applyTheme = (newTheme: 'light' | 'dark') => {
      const root = document.documentElement;
      const body = document.body;
      
      console.log('🎨 Forçando tema:', newTheme);
      
      // Remove classes existentes
      root.classList.remove('dark', 'light');
      body.classList.remove('dark', 'light');
      
      // Adiciona nova classe
      root.classList.add(newTheme);
      body.classList.add(newTheme);
      
      // Define color-scheme
      root.style.colorScheme = newTheme;
      
      // FORÇA as cores via CSS custom properties
      if (newTheme === 'dark') {
        root.style.setProperty('--background', '#0f172a');
        root.style.setProperty('--foreground', '#f8fafc');
        root.style.setProperty('--card', '#1e293b');
        root.style.setProperty('--border', '#374151');
      } else {
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--foreground', '#1e293b');
        root.style.setProperty('--card', '#ffffff');
        root.style.setProperty('--border', '#e2e8f0');
      }
      
      // FORÇA o background do body diretamente
      body.style.backgroundColor = newTheme === 'dark' ? '#0f172a' : '#ffffff';
      body.style.color = newTheme === 'dark' ? '#f8fafc' : '#1e293b';
      
      // Salva no localStorage
      try {
        localStorage.setItem('theme', newTheme);
      } catch (e) {
        console.warn('Não foi possível salvar tema no localStorage');
      }
      
      console.log('✅ Tema FORÇADO:', newTheme, 'Classes:', Array.from(root.classList));
    };

    applyTheme(theme);
  }, [theme]);

  return null;
}
