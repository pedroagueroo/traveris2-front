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
    <div class="login-split">
      <!-- LEFT PANEL — Brand & Features -->
      <div class="login-left">
        <div class="left-content animate-fadeInUp">
          <div class="brand-section">
            <div class="brand-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.6)" stroke-width="1.5"/>
                <path d="M18 28l6-12 6 12M20 25h8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 class="brand-title">TRAVERIS PRO</h1>
            <p class="brand-subtitle">Sistema Integral de Gestión Turística</p>
          </div>

          <div class="features-list">
            <div class="feature-item">
              <span class="feature-icon">👥</span>
              <span class="feature-text">Gestión de Clientes</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📋</span>
              <span class="feature-text">Control de Reservas</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💰</span>
              <span class="feature-text">Caja Contable</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span class="feature-text">Reportes y Alertas</span>
            </div>
          </div>

          <p class="powered-text">Potenciado para agencias de viaje</p>
        </div>
      </div>

      <!-- RIGHT PANEL — Login Form -->
      <div class="login-right">
        <div class="right-content animate-fadeInUp">
          <div class="welcome-section">
            <h2 class="welcome-title">Bienvenido</h2>
            <p class="welcome-subtitle">Ingresá tus credenciales para acceder al panel</p>
          </div>

          <form (ngSubmit)="iniciarSesion()" class="login-form">
            @if (error) {
              <div class="alert-error">
                <span>⚠️</span> {{ error }}
              </div>
            }

            <div class="form-group">
              <label class="field-label">👤 USUARIO</label>
              <input
                type="text"
                class="field-input"
                [(ngModel)]="usuario"
                name="usuario"
                placeholder="Ingrese su usuario"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label class="field-label">🔒 CONTRASEÑA</label>
              <div class="password-wrapper">
                <input
                  [type]="mostrarPassword ? 'text' : 'password'"
                  class="field-input"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Ingrese su contraseña"
                  required
                  autocomplete="current-password"
                />
                <button type="button" class="password-toggle" (click)="mostrarPassword = !mostrarPassword">
                  {{ mostrarPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <button type="submit" class="btn-login" [disabled]="cargando">
              {{ cargando ? '⏳ Ingresando...' : '🔐 INGRESAR AL PANEL' }}
            </button>
          </form>

          <!-- TESTER CREDENTIALS -->
          <div class="tester-box" (click)="usarTester()">
            <div class="tester-title">🧪 Cuenta de Prueba</div>
            <div class="tester-creds">
              <span>Usuario: <strong>tester</strong></span>
              <span>Contraseña: <strong>tester123</strong></span>
            </div>
            <div class="tester-hint">Hacé click aquí para ingresar automáticamente</div>
          </div>

          <p class="footer-text">¿Olvidaste tu acceso? Contactá al Administrador.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-split {
      min-height: 100vh;
      display: flex;
    }

    /* ─── LEFT PANEL ─── */
    .login-left {
      flex: 1;
      background: linear-gradient(160deg, #0c1120 0%, #1a1145 40%, #2d1b69 70%, #1e1250 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;
    }

    .login-left::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
      animation: floatBg 20s ease-in-out infinite;
    }

    @keyframes floatBg {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-2%, 2%); }
    }

    .left-content {
      position: relative;
      z-index: 1;
      max-width: 360px;
    }

    .brand-section {
      margin-bottom: 3rem;
    }

    .brand-icon {
      width: 80px;
      height: 80px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .brand-title {
      font-size: 2rem;
      font-weight: 900;
      color: white;
      letter-spacing: 0.02em;
      margin: 0;
    }

    .brand-subtitle {
      font-size: 0.9rem;
      color: rgba(148, 163, 184, 0.8);
      margin-top: 0.4rem;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1.25rem;
      background: rgba(99, 102, 241, 0.06);
      border: 1px solid rgba(99, 102, 241, 0.12);
      border-radius: 12px;
      transition: all 0.3s ease;
      cursor: default;
    }

    .feature-item:hover {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.25);
      transform: translateX(6px);
    }

    .feature-icon {
      font-size: 1.1rem;
    }

    .feature-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: rgba(226, 232, 240, 0.9);
      letter-spacing: 0.01em;
    }

    .powered-text {
      margin-top: 2.5rem;
      font-size: 0.75rem;
      color: rgba(99, 102, 241, 0.5);
      font-style: italic;
      letter-spacing: 0.03em;
    }

    /* ─── RIGHT PANEL ─── */
    .login-right {
      flex: 1;
      background: linear-gradient(180deg, #0f172a 0%, #131b2e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }

    .right-content {
      width: 100%;
      max-width: 400px;
    }

    .welcome-section {
      text-align: center;
      margin-bottom: 2rem;
    }

    .welcome-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: white;
      margin: 0;
    }

    .welcome-subtitle {
      font-size: 0.85rem;
      color: rgba(148, 163, 184, 0.7);
      margin-top: 0.4rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .field-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: rgba(148, 163, 184, 0.7);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .field-input {
      width: 100%;
      padding: 0.85rem 1rem;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      color: white;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .field-input::placeholder {
      color: rgba(148, 163, 184, 0.4);
    }

    .field-input:focus {
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      background: rgba(30, 41, 59, 0.8);
    }

    .password-wrapper {
      position: relative;
    }

    .password-wrapper .field-input {
      padding-right: 3rem;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
      opacity: 0.6;
      transition: opacity 0.2s;
      line-height: 1;
    }

    .password-toggle:hover {
      opacity: 1;
    }

    .btn-login {
      width: 100%;
      padding: 0.9rem;
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 0.5rem;
      font-family: inherit;
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);
    }

    .btn-login:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    /* ─── TESTER BOX ─── */
    .tester-box {
      margin-top: 1.5rem;
      padding: 1rem 1.25rem;
      background: rgba(99, 102, 241, 0.06);
      border: 1px dashed rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }

    .tester-box:hover {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.5);
      transform: translateY(-1px);
    }

    .tester-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: rgba(99, 102, 241, 0.8);
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tester-creds {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      font-size: 0.82rem;
      color: rgba(226, 232, 240, 0.7);
    }

    .tester-creds strong {
      color: #a5b4fc;
    }

    .tester-hint {
      margin-top: 0.4rem;
      font-size: 0.7rem;
      color: rgba(99, 102, 241, 0.5);
      font-style: italic;
    }

    .footer-text {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.78rem;
      color: rgba(100, 116, 139, 0.6);
    }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 900px) {
      .login-split {
        flex-direction: column;
      }
      .login-left {
        padding: 2rem;
        min-height: auto;
      }
      .left-content {
        max-width: 100%;
      }
      .features-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .login-right {
        padding: 2rem;
      }
    }

    @media (max-width: 480px) {
      .features-list {
        grid-template-columns: 1fr;
      }
      .tester-creds {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  `]
})
export class LoginComponent {
  usuario = '';
  password = '';
  error = '';
  cargando = false;
  mostrarPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private theme: ThemeService
  ) {
    if (this.auth.estaLogueado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  usarTester(): void {
    this.usuario = 'tester';
    this.password = 'tester123';
    this.iniciarSesion();
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
