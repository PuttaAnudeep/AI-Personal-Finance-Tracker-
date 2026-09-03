import { Injectable, signal, effect, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>('light');
  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('smartledger-theme')) as Theme | null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this._theme.set(saved || (prefersDark ? 'dark' : 'light'));

    effect(() => {
      const t = this._theme();
      const root = document.documentElement;
      if (t === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      if (typeof localStorage !== 'undefined') localStorage.setItem('smartledger-theme', t);
    });
  }

  toggle() { this._theme.update(t => (t === 'dark' ? 'light' : 'dark')); }
  set(t: Theme) { this._theme.set(t); }
}