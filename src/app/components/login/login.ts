import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card animate-fadeInUp">
        <div class="login-header">
          <div class="logo-icon">✈️</div>
          <h1 class="login-title">Traveris Pro</h1>
          <p class="login-subtitle">Sistema de Gestión para Agencias de Viajes</p>
        </div>

        <form (ngSubmit)="iniciarSesion()" class="login-form">
          @if (error) {
            <div class="alert-error">
              <span>⚠️</span> {{ error }}
            </div>
          }

          <div class="form-group">
            <label class="form-label-elite">Usuario</label>
            <input
              type="text"
              class="form-control-elite w-100"
              [(ngModel)]="usuario"
              name="usuario"
              placeholder="Ingrese su usuario"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label class="form-label-elite">Contraseña</label>
            <input
              type="password"
              class="form-control-elite w-100"
              [(ngModel)]="password"
              name="password"
              placeholder="Ingrese su contraseña"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn-elite w-100" [disabled]="cargando">
            <span>{{ cargando ? 'Ingresando...' : 'Iniciar Sesión' }}</span>
          </button>
        </form>

        <div class="login-footer">
          <span class="version-tag">v2.0.0</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%);
      padding: 1rem;
    }

    .login-card {
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 24px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-icon {
      font-size: 3rem;
      margin-bottom: 0.75rem;
    }

    .login-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .login-subtitle {
      font-size: 0.85rem;
      color: #94A3B8;
      margin-top: 0.25rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .alert-error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #F87171;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
    }

    .version-tag {
      font-size: 0.7rem;
      color: #64748B;
      background: rgba(100, 116, 139, 0.1);
      padding: 0.2rem 0.6rem;
      border-radius: 100px;
    }

    .w-100 { width: 100%; }
  `]
})
export class LoginComponent {
  usuario = '';
  password = '';
  error = '';
  cargando = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private theme: ThemeService
  ) {
    // Si ya está logueado, redirigir
    if (this.auth.estaLogueado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  iniciarSesion(): void {
    if (!this.usuario || !this.password) {
      this.error = 'Complete todos los campos';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.auth.login({ nombre_usuario: this.usuario, password: this.password })
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.cargando = false;
          this.error = err.error?.error || 'Error al iniciar sesión';
        }
      });
  }
}
