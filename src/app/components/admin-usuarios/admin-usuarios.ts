import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Usuario, AgenciaConfig } from '../../models';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">👤 Gestión de Usuarios</h1>
          <p class="page-subtitle">{{ usuarios.length }} usuarios registrados</p>
        </div>
        <button class="btn-elite" (click)="mostrarForm = true; resetForm()"><span>➕ Nuevo Usuario</span></button>
      </div>

      <!-- Filtro por agencia -->
      <div class="glass-card-solid mb-3" style="padding: 1rem;">
        <div class="d-flex gap-2 align-items-center">
          <label class="form-label-elite mb-0">Filtrar por agencia:</label>
          <select class="form-select-elite" [(ngModel)]="filtroEmpresa" (change)="cargar()" style="width: 250px;">
            <option value="">Todas</option>
            @for (a of agencias; track a.empresa_nombre) {
              <option [value]="a.empresa_nombre">{{ a.nombre_comercial || a.empresa_nombre }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Formulario -->
      @if (mostrarForm) {
        <div class="glass-card-solid mb-3">
          <h5 style="font-weight: 700; margin-bottom: 1rem;">{{ editandoId ? 'Editar' : 'Nuevo' }} Usuario</h5>
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label-elite">Usuario *</label>
              <input class="form-control-elite w-100" [(ngModel)]="form.nombre_usuario" [disabled]="!!editandoId" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">{{ editandoId ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *' }}</label>
              <input type="password" class="form-control-elite w-100" [(ngModel)]="form.password" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Rol *</label>
              <select class="form-select-elite w-100" [(ngModel)]="form.rol">
                <option value="ADMIN">Admin</option>
                <option value="EMPRESA">Empresa</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Agencia</label>
              <select class="form-select-elite w-100" [(ngModel)]="form.empresa_nombre">
                <option [ngValue]="null">Sin agencia (admin global)</option>
                @for (a of agencias; track a.empresa_nombre) {
                  <option [value]="a.empresa_nombre">{{ a.nombre_comercial || a.empresa_nombre }}</option>
                }
              </select>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn-elite" (click)="guardar()"><span>Guardar</span></button>
            <button class="btn-elite-outline" (click)="mostrarForm = false">Cancelar</button>
          </div>
        </div>
      }

      <!-- Tabla -->
      <div class="glass-card-solid" style="padding: 0; overflow-x: auto;">
        <table class="table-premium">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Agencia</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            @for (u of usuarios; track u.id) {
              <tr>
                <td class="fw-semibold">{{ u.nombre_usuario }}</td>
                <td><span class="status-pill" [ngClass]="u.rol === 'ADMIN' ? 'abierto' : 'activa'">{{ u.rol }}</span></td>
                <td>{{ u.empresa_nombre || 'Global' }}</td>
                <td><span class="status-pill" [ngClass]="u.activo ? 'activa' : 'cancelado'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
                <td>
                  <div class="d-flex gap-1">
                    <button class="btn-elite-outline" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" (click)="editar(u)">Editar</button>
                    <button class="btn-danger-elite" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" (click)="eliminar(u.id)" [disabled]="u.nombre_usuario === 'admin'">Eliminar</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin usuarios</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  agencias: AgenciaConfig[] = [];
  filtroEmpresa = '';
  mostrarForm = false;
  editandoId: number | null = null;
  form = { nombre_usuario: '', password: '', rol: 'EMPRESA', empresa_nombre: null as string | null };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargar();
    this.api.getAgencias().subscribe({ next: (a) => this.agencias = a });
  }

  cargar(): void {
    this.api.getUsuarios(this.filtroEmpresa || undefined).subscribe({ next: (u) => this.usuarios = u });
  }

  resetForm(): void {
    this.editandoId = null;
    this.form = { nombre_usuario: '', password: '', rol: 'EMPRESA', empresa_nombre: null };
  }

  editar(u: Usuario): void {
    this.editandoId = u.id;
    this.form = { nombre_usuario: u.nombre_usuario, password: '', rol: u.rol, empresa_nombre: u.empresa_nombre };
    this.mostrarForm = true;
  }

  guardar(): void {
    if (!this.form.nombre_usuario) return;
    if (this.editandoId) {
      const data: Record<string, unknown> = { rol: this.form.rol, empresa_nombre: this.form.empresa_nombre };
      if (this.form.password) data['password'] = this.form.password;
      this.api.updateUsuario(this.editandoId, data as Partial<Usuario & { password: string }>).subscribe({
        next: () => { this.mostrarForm = false; this.cargar(); }
      });
    } else {
      if (!this.form.password) { alert('La contraseña es requerida'); return; }
      this.api.crearUsuario(this.form).subscribe({
        next: () => { this.mostrarForm = false; this.cargar(); }
      });
    }
  }

  eliminar(id: number): void {
    if (confirm('¿Eliminar este usuario?')) {
      this.api.deleteUsuario(id).subscribe({ next: () => this.cargar() });
    }
  }
}
