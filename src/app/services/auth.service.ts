import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'traveris_token';
  private readonly USER_KEY = 'traveris_user';

  private readonly _usuario = signal<Usuario | null>(this.cargarUsuario());
  readonly usuario = this._usuario.asReadonly();
  readonly estaLogueado = computed(() => !!this._usuario() && !!this.getToken());
  readonly esAdmin = computed(() => this._usuario()?.rol === 'ADMIN');
  readonly empresaNombre = computed(() => this._usuario()?.empresa_nombre ?? '');

  constructor(private http: HttpClient, private router: Router) {}

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales)
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.usuario));
          this._usuario.set(res.usuario);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private cargarUsuario(): Usuario | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as Usuario;
    } catch {
      return null;
    }
  }
}
