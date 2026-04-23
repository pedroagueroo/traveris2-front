import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AgenciaConfig } from '../../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚙️ Panel de Administración</h1>
          <p class="page-subtitle">Gestión de agencias y usuarios</p>
        </div>
        <div class="d-flex gap-2">
          <a routerLink="/admin/usuarios" class="btn-elite-outline"><span>👤 Usuarios</span></a>
          <a routerLink="/admin/archivos-agencias" class="btn-elite-outline"><span>📁 Archivos de Agencias</span></a>
          <button class="btn-elite" (click)="mostrarNueva = true"><span>➕ Nueva Agencia</span></button>
        </div>
      </div>

      @if (mostrarNueva) {
        <div class="glass-card-solid mb-3">
          <h5 style="font-weight: 700; margin-bottom: 1rem;">Nueva Agencia</h5>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label-elite">Nombre interno (empresa_nombre) *</label>
              <input class="form-control-elite w-100" [(ngModel)]="nuevaForm.empresa_nombre"
                     placeholder="ej: agencia_lopez" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Nombre Comercial</label>
              <input class="form-control-elite w-100" [(ngModel)]="nuevaForm.nombre_comercial" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Email</label>
              <input class="form-control-elite w-100" [(ngModel)]="nuevaForm.email" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Teléfono</label>
              <input class="form-control-elite w-100" [(ngModel)]="nuevaForm.telefono" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Titular</label>
              <input class="form-control-elite w-100" [(ngModel)]="nuevaForm.titular" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">CUIT/CUIL</label>
              <input class="form-control-elite w-100" [(ngModel)]="nuevaForm.cuit_cuil" />
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn-elite" (click)="crearAgencia()"><span>Crear Agencia</span></button>
            <button class="btn-elite-outline" (click)="mostrarNueva = false; resetForm()">Cancelar</button>
          </div>
        </div>
      }

      <div class="row g-3">
        @for (a of agencias; track a.id) {
          <div class="col-md-6 col-lg-4">
            <a [routerLink]="['/admin/agencias', a.empresa_nombre]" class="glass-card-solid d-block" style="text-decoration: none;">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 style="font-weight: 700; color: var(--text-primary);">{{ a.nombre_comercial || a.empresa_nombre }}</h6>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">{{ a.empresa_nombre }}</span>
                </div>
                <span class="status-pill" [ngClass]="a.activa ? 'activa' : 'cancelado'">
                  {{ a.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
              <div class="d-flex gap-3 mt-3" style="font-size: 0.8rem; color: var(--text-secondary);">
                <div>👤 {{ a.total_usuarios || 0 }} usuarios</div>
                <div>📞 {{ a.telefono || '-' }}</div>
              </div>
            </a>
          </div>
        } @empty {
          <div class="col-12">
            <div class="glass-card-solid" style="text-align: center; padding: 3rem;">
              <p style="color: var(--text-muted);">No hay agencias creadas</p>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  agencias: AgenciaConfig[] = [];
  mostrarNueva = false;
  nuevaForm = this.resetForm();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAgencias().subscribe({ next: (d) => this.agencias = d });
  }

  resetForm() {
    return {
      empresa_nombre: '', nombre_comercial: '', email: '',
      telefono: '', titular: '', cuit_cuil: ''
    };
  }

  crearAgencia(): void {
    if (!this.nuevaForm.empresa_nombre) return;
    this.api.crearAgencia(this.nuevaForm as any).subscribe({
      next: () => {
        this.mostrarNueva = false;
        this.nuevaForm = this.resetForm();
        this.ngOnInit();
      },
      error: (err) => console.error('Error al crear agencia', err)
    });
  }
}
