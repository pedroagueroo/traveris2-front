import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ConfirmService } from '../../services/confirm.service';
import { Reserva, PaginatedResponse } from '../../models';

@Component({
  selector: 'app-reservas-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">Reservas</h1>
          <p class="page-subtitle">{{ total }} reservas</p>
        </div>
        <div class="d-flex gap-2">
          @if (reservas.length > 0) {
            <button class="btn-elite-outline" style="color: #ef4444; border-color: #ef4444;" (click)="eliminarTodas()">🗑️ Eliminar Todas</button>
          }
          <a routerLink="/reservas/nuevo" class="btn-elite"><span>➕ Nueva Reserva</span></a>
        </div>
      </div>

      <div class="glass-card-solid mb-3" style="padding: 1rem;">
        <div class="d-flex gap-2 flex-wrap">
          <input type="text" class="form-control-elite" style="flex: 1; min-width: 200px;" placeholder="🔍 Buscar..." [(ngModel)]="busqueda" (input)="buscar()" />
          <select class="form-select-elite" [(ngModel)]="estadoFiltro" (change)="buscar()" style="width: 150px;">
            <option value="">Todos</option>
            <option value="ABIERTO">Abierto</option>
            <option value="CERRADO">Cerrado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      <!-- Desktop -->
      <div class="glass-card-solid d-none d-md-block" style="padding: 0; overflow: hidden;">
        <table class="table-premium">
          <thead>
            <tr><th>#</th><th>Titular</th><th>Destino</th><th>Salida</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            @for (r of reservas; track r.id) {
              <tr>
                <td>{{ r.id }}</td>
                <td style="font-weight: 600;">{{ r.titular_nombre }}</td>
                <td>{{ r.destino_final || '-' }}</td>
                <td>{{ r.fecha_viaje_salida ? (r.fecha_viaje_salida | date:'dd/MM/yyyy':'UTC') : '-' }}</td>
                <td><span class="status-pill" [ngClass]="r.estado.toLowerCase()">{{ r.estado }}</span></td>
                <td>
                  <div class="d-flex gap-1">
                    <a [routerLink]="['/reservas', r.id]" class="btn-elite-outline" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">Ver</a>
                    <button class="btn-elite-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444; border-color: #ef4444;" (click)="eliminar(r)">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron reservas</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile -->
      <div class="d-md-none">
        @for (r of reservas; track r.id) {
          <div class="glass-card-solid mb-2">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">{{ r.titular_nombre }}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">
                  {{ r.destino_final || 'Sin destino' }} · #{{ r.id }}
                </div>
              </div>
              <span class="status-pill" [ngClass]="r.estado.toLowerCase()">{{ r.estado }}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
              Salida: {{ r.fecha_viaje_salida ? (r.fecha_viaje_salida | date:'dd/MM/yyyy':'UTC') : '-' }}
            </div>
            <div class="d-flex gap-2">
              <a [routerLink]="['/reservas', r.id]" class="btn-elite" style="flex: 1; text-align: center; font-size: 0.82rem; padding: 0.5rem;">
                <span>Ver reserva</span>
              </a>
              <button class="btn-elite-outline" style="color: #ef4444; border-color: #ef4444; padding: 0.5rem 0.75rem;" (click)="eliminar(r)">🗑️</button>
            </div>
          </div>
        } @empty {
          <div class="glass-card-solid" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No se encontraron reservas
          </div>
        }
      </div>

      @if (totalPages > 1) {
        <div class="d-flex justify-content-center gap-2 mt-3">
          <button class="btn-elite-outline" [disabled]="page <= 1" (click)="cambiarPagina(page - 1)">← Anterior</button>
          <span style="display: flex; align-items: center; font-size: 0.85rem; color: var(--text-secondary);">{{ page }} / {{ totalPages }}</span>
          <button class="btn-elite-outline" [disabled]="page >= totalPages" (click)="cambiarPagina(page + 1)">Siguiente →</button>
        </div>
      }
    </div>
  `
})
export class ReservasListaComponent implements OnInit {
  reservas: Reserva[] = [];
  page = 1; limit = 20; total = 0; totalPages = 0;
  busqueda = ''; estadoFiltro = '';
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: ApiService, private router: Router, private confirm: ConfirmService) {}
  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.api.getReservas(this.page, this.limit, this.busqueda, this.estadoFiltro).subscribe({
      next: (r) => { this.reservas = r.data; this.total = r.total; this.totalPages = r.totalPages || 1; }
    });
  }

  buscar(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => { this.page = 1; this.cargar(); }, 400);
  }

  cambiarPagina(p: number): void { this.page = p; this.cargar(); }

  async eliminar(r: Reserva): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar Reserva',
      message: `¿Estás seguro de eliminar la Reserva #${r.id} de ${r.titular_nombre || 'sin titular'}?`,
      confirmText: 'Sí, eliminar',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteReserva(r.id).subscribe({
      next: () => { this.confirm.toast('Reserva eliminada correctamente'); this.cargar(); },
      error: (err) => this.confirm.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }

  async eliminarTodas(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar TODAS las Reservas',
      message: '¿Estás seguro de eliminar TODAS las reservas? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar todas',
      type: 'danger',
      requireText: 'ELIMINAR TODO'
    });
    if (!ok) return;
    this.api.deleteAllReservas().subscribe({
      next: (r) => { this.confirm.toast(r.mensaje); this.cargar(); },
      error: (err) => this.confirm.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }
}
