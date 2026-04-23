import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './components/navbar/navbar';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal';
import { LoadingComponent } from './components/loading/loading';
import { GlobalSearchComponent } from './components/global-search/global-search';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ConfirmModalComponent, LoadingComponent, GlobalSearchComponent],
  template: `
    @if (auth.estaLogueado()) {
      <app-navbar />
    }
    <main [class.main-content]="auth.estaLogueado()" [class.expanded]="sidebar.collapsed()">
      <router-outlet />
    </main>
    <app-confirm-modal />
    <app-loading />
    <app-global-search />
  `,
  styles: ``
})
export class AppComponent {
  constructor(public auth: AuthService, public theme: ThemeService, public sidebar: SidebarService,
              private title: Title, private router: Router) {

    const titles: Record<string, string> = {
      '/dashboard':          'Dashboard — Traveris Pro',
      '/clientes':           'Clientes — Traveris Pro',
      '/reservas':           'Reservas — Traveris Pro',
      '/caja':               'Caja — Traveris Pro',
      '/estadisticas':       'Estadísticas — Traveris Pro',
      '/proveedores':        'Proveedores — Traveris Pro',
      '/tarjetas-guardadas': 'Tarjetas — Traveris Pro',
      '/admin':              'Admin — Traveris Pro',
      '/login':              'Ingresar — Traveris Pro',
    };

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const base = '/' + e.urlAfterRedirects.split('/')[1];
      this.title.setTitle(titles[base] || 'Traveris Pro');
    });
  }
}
