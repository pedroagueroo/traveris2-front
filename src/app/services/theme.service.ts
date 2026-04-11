import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'traveris_theme';
  private readonly _isDark = signal<boolean>(this.cargarTema());
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    this.aplicarTema();
  }

  toggle(): void {
    this._isDark.update(v => !v);
    localStorage.setItem(this.THEME_KEY, this._isDark() ? 'dark' : 'light');
    this.aplicarTema();
  }

  private cargarTema(): boolean {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) return saved === 'dark';
    // Default a dark mode
    return true;
  }

  private aplicarTema(): void {
    const body = document.body;
    if (this._isDark()) {
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
      body.setAttribute('data-bs-theme', 'dark');
    } else {
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
      body.setAttribute('data-bs-theme', 'light');
    }
  }
}
