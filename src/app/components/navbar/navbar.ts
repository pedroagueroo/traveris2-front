import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed" [class.mobile-open]="mobileOpen">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-emoji">✈️</span>
          @if (!collapsed) {
            <span class="logo-text">Traveris Pro</span>
          }
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()">
          {{ collapsed ? '▶' : '◀' }}
        </button>
      </div>

      <!-- Navigation -->
      <div class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="sidebar-nav-item">
          <span class="nav-icon">📊</span>
          @if (!collapsed) { <span class="nav-text">Dashboard</span> }
        </a>

        <a routerLink="/clientes" routerLinkActive="active" class="sidebar-nav-item">
          <span class="nav-icon">👥</span>
          @if (!collapsed) { <span class="nav-text">Clientes</span> }
        </a>

        <a routerLink="/proveedores" routerLinkActive="active" class="sidebar-nav-item">
          <span class="nav-icon">🏢</span>
          @if (!collapsed) { <span class="nav-text">Proveedores</span> }
        </a>

        <a routerLink="/reservas" routerLinkActive="active" class="sidebar-nav-item">
          <span class="nav-icon">📋</span>
          @if (!collapsed) { <span class="nav-text">Reservas</span> }
        </a>

        <a routerLink="/caja" routerLinkActive="active" class="sidebar-nav-item">
          <span class="nav-icon">💰</span>
          @if (!collapsed) { <span class="nav-text">Caja</span> }
        </a>

        <a routerLink="/estadisticas" routerLinkActive="active" class="sidebar-nav-item">
          <span class="nav-icon">📈</span>
          @if (!collapsed) { <span class="nav-text">Estadísticas</span> }
        </a>

        @if (auth.esAdmin()) {
          <div class="sidebar-separator"></div>
          <a routerLink="/admin" routerLinkActive="active" class="sidebar-nav-item admin-item">
            <span class="nav-icon">⚙️</span>
            @if (!collapsed) { <span class="nav-text">Admin Panel</span> }
          </a>
        }
      </div>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="sidebar-nav-item" (click)="theme.toggle()">
          <span class="nav-icon">{{ theme.isDark() ? '☀️' : '🌙' }}</span>
          @if (!collapsed) { <span class="nav-text">{{ theme.isDark() ? 'Claro' : 'Oscuro' }}</span> }
        </button>

        <div class="sidebar-nav-item user-info" style="cursor: default;">
          <span class="nav-icon">👤</span>
          @if (!collapsed) {
            <div class="user-details">
              <span class="user-name">{{ auth.usuario()?.nombre_usuario }}</span>
              <span class="user-role">{{ auth.usuario()?.rol }}</span>
            </div>
          }
        </div>

        <button class="sidebar-nav-item logout-btn" (click)="auth.logout()">
          <span class="nav-icon">🚪</span>
          @if (!collapsed) { <span class="nav-text">Cerrar Sesión</span> }
        </button>
      </div>
    </nav>

    <!-- Mobile overlay -->
    @if (mobileOpen) {
      <div class="sidebar-overlay" (click)="mobileOpen = false"></div>
    }

    <!-- Mobile hamburger -->
    <button class="mobile-menu-btn" (click)="mobileOpen = !mobileOpen">☰</button>
  `,
  styles: [`
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-emoji { font-size: 1.5rem; }

    .logo-text {
      font-size: 1.1rem;
      font-weight: 800;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .collapse-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.25rem;
      border-radius: 6px;
      transition: var(--transition);
    }
    .collapse-btn:hover { background: var(--bg-secondary); }

    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0;
      overflow-y: auto;
    }

    .sidebar-separator {
      height: 1px;
      background: var(--border-color);
      margin: 0.5rem 1rem;
    }

    .admin-item { color: var(--warning) !important; }
    .admin-item:hover { color: var(--warning-light) !important; }

    .sidebar-footer {
      border-top: 1px solid var(--border-color);
      padding: 0.5rem 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .user-role {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .logout-btn {
      background: none;
      border: none;
      width: 100%;
      text-align: left;
    }
    .logout-btn:hover { color: var(--danger) !important; }

    .sidebar-overlay {
      display: none;
    }

    .mobile-menu-btn {
      display: none;
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 1100;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      color: var(--text-primary);
      font-size: 1.25rem;
      cursor: pointer;
    }

    @media (max-width: 576px) {
      .sidebar-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
      }
      .mobile-menu-btn { display: block; }
    }
  `]
})
export class NavbarComponent {
  collapsed = false;
  mobileOpen = false;

  constructor(public auth: AuthService, public theme: ThemeService) {}

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }
}
