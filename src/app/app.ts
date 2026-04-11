import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    @if (auth.estaLogueado()) {
      <app-navbar />
    }
    <main [class.main-content]="auth.estaLogueado()" [class.expanded]="false">
      <router-outlet />
    </main>
  `,
  styles: ``
})
export class AppComponent {
  constructor(public auth: AuthService, public theme: ThemeService) {}
}
