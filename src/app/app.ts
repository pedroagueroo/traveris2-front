import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal';
import { LoadingComponent } from './components/loading/loading';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ConfirmModalComponent, LoadingComponent],
  template: `
    @if (auth.estaLogueado()) {
      <app-navbar />
    }
    <main [class.main-content]="auth.estaLogueado()" [class.expanded]="false">
      <router-outlet />
    </main>
    <app-confirm-modal />
    <app-loading />
  `,
  styles: ``
})
export class AppComponent {
  constructor(public auth: AuthService, public theme: ThemeService) {}
}
