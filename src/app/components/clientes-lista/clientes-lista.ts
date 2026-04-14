import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ConfirmService } from '../../services/confirm.service';
import { Cliente, PaginatedResponse } from '../../models';

@Component({
  selector: 'app-clientes-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">Clientes</h1>
          <p class="page-subtitle">{{ total }} clientes registrados</p>
        </div>
        <div class="d-flex gap-2">
          @if (clientes.length > 0) {
            <button class="btn-elite-outline" style="color: #ef4444; border-color: #ef4444;" (click)="eliminarTodos()">🗑️ Eliminar Todos</button>
          }
          <a routerLink="/clientes/importar" class="btn-elite-outline"><span>📥 Importar</span></a>
          <a routerLink="/clientes/nuevo" class="btn-elite"><span>➕ Nuevo Cliente</span></a>
        </div>
      </div>

      <div class="glass-card-solid mb-3" style="padding: 1rem;">
        <input type="text" class="form-control-elite w-100" placeholder="🔍 Buscar por nombre, DNI o email..." [(ngModel)]="busqueda" (input)="buscar()" />
      </div>

      <div class="glass-card-solid" style="padding: 0; overflow: hidden;">
        <table class="table-premium">
          <thead>
            <tr><th>Nombre</th><th>DNI / Pasaporte</th><th>Email</th><th>Teléfono</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            @for (c of clientes; track c.id) {
              <tr>
                <td style="font-weight: 600;">{{ c.nombre_completo }}</td>
                <td>{{ c.dni_pasaporte || '-' }}</td>
                <td>{{ c.email || '-' }}</td>
                <td>{{ c.telefono || '-' }}</td>
                <td>
                  <div class="d-flex gap-1">
                    <a [routerLink]="['/clientes/detalle', c.id]" class="btn-elite-outline" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Ver</a>
                    <a [routerLink]="['/clientes/editar', c.id]" class="btn-elite-outline" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">✏️</a>
                    <button class="btn-elite-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444; border-color: #ef4444;" (click)="eliminar(c)">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron clientes</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages > 1) {
        <div class="d-flex justify-content-center gap-2 mt-3">
          <button class="btn-elite-outline" [disabled]="page <= 1" (click)="cambiarPagina(page - 1)" style="padding: 0.4rem 1rem;">← Anterior</button>
          <span style="display: flex; align-items: center; font-size: 0.85rem; color: var(--text-secondary);">Página {{ page }} de {{ totalPages }}</span>
          <button class="btn-elite-outline" [disabled]="page >= totalPages" (click)="cambiarPagina(page + 1)" style="padding: 0.4rem 1rem;">Siguiente →</button>
        </div>
      }
    </div>
  `
})
export class ClientesListaComponent implements OnInit {
  clientes: Cliente[] = [];
  page = 1; limit = 20; total = 0; totalPages = 0;
  busqueda = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: ApiService, private router: Router, private confirm: ConfirmService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.api.getClientes(this.page, this.limit, this.busqueda).subscribe({
      next: (res) => {
        this.clientes = res.data;
        this.total = res.total;
        this.totalPages = res.totalPages || Math.ceil(res.total / this.limit);
      }
    });
  }

  buscar(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page = 1; this.cargar(); }, 400);
  }

  cambiarPagina(p: number): void { this.page = p; this.cargar(); }

  async eliminar(c: Cliente): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar Cliente',
      message: `¿Estás seguro de eliminar a "${c.nombre_completo}"?`,
      confirmText: 'Sí, eliminar',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteCliente(c.id).subscribe({
      next: () => { this.confirm.toast('Cliente eliminado correctamente'); this.cargar(); },
      error: (err) => this.confirm.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }

  async eliminarTodos(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar TODOS los Clientes',
      message: '¿Estás seguro de eliminar TODOS los clientes? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar todos',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteAllClientes().subscribe({
      next: (r) => { this.confirm.toast(r.mensaje); this.cargar(); },
      error: (err) => this.confirm.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }
}
