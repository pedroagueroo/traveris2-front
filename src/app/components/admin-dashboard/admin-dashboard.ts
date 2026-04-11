import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AgenciaConfig } from '../../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚙️ Panel de Administración</h1>
          <p class="page-subtitle">Gestión de agencias y usuarios</p>
        </div>
        <div class="d-flex gap-2">
          <a routerLink="/admin/usuarios" class="btn-elite-outline"><span>👤 Usuarios</span></a>
          <button class="btn-elite" (click)="mostrarNueva = true"><span>➕ Nueva Agencia</span></button>
        </div>
      </div>

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

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAgencias().subscribe({ next: (d) => this.agencias = d });
  }
}
