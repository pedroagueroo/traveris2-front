import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ConfirmService } from '../../services/confirm.service';
import { Cliente } from '../../models';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ cliente?.nombre_completo || 'Cargando...' }}</h1>
          <p class="page-subtitle">Detalle del cliente</p>
        </div>
        <div class="d-flex gap-2">
          @if (cliente) {
            <a [routerLink]="['/clientes/editar', cliente.id]" class="btn-elite-outline">✏️ Editar</a>
            <button class="btn-elite-outline" style="color: #ef4444; border-color: #ef4444;" (click)="eliminar()">🗑️ Eliminar</button>
          }
          <a routerLink="/clientes" class="btn-elite-outline">← Volver</a>
        </div>
      </div>

      @if (cliente) {
        <div class="row g-3">
          <div class="col-lg-8">
            <div class="glass-card-solid">
              <h5 style="font-weight: 700; margin-bottom: 1rem;">📋 Datos Personales</h5>
              <div class="row g-2">
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">DNI/PASAPORTE</strong><div>{{ cliente.dni_pasaporte || '-' }}</div></div>
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">EMAIL</strong><div>{{ cliente.email || '-' }}</div></div>
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">TELÉFONO</strong><div>{{ cliente.telefono || '-' }}</div></div>
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">NACIMIENTO</strong><div>{{ cliente.fecha_nacimiento ? (cliente.fecha_nacimiento | date:'dd/MM/yyyy') : '-' }}</div></div>
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">NACIONALIDAD</strong><div>{{ cliente.nacionalidad || '-' }}</div></div>
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">SEXO</strong><div>{{ cliente.sexo || '-' }}</div></div>
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">CUIT/CUIL</strong><div>{{ cliente.cuit_cuil || '-' }}</div></div>
              </div>
            </div>

            @if (cliente.pasaporte_nro || cliente.pref_asiento || cliente.pref_comida || cliente.observaciones_salud) {
              <div class="glass-card-solid mt-3">
                <h5 style="font-weight: 700; margin-bottom: 1rem;">🛂 Pasaporte y Preferencias</h5>
                <div class="row g-2">
                  @if (cliente.pasaporte_nro) {
                    <div class="col-md-4"><strong style="color: var(--text-muted); font-size: 0.75rem;">NRO PASAPORTE</strong><div>{{ cliente.pasaporte_nro }}</div></div>
                    <div class="col-md-4"><strong style="color: var(--text-muted); font-size: 0.75rem;">EMISIÓN</strong><div>{{ cliente.pasaporte_emision ? (cliente.pasaporte_emision | date:'dd/MM/yyyy') : '-' }}</div></div>
                    <div class="col-md-4"><strong style="color: var(--text-muted); font-size: 0.75rem;">VENCIMIENTO</strong><div>{{ cliente.pasaporte_vencimiento ? (cliente.pasaporte_vencimiento | date:'dd/MM/yyyy') : '-' }}</div></div>
                  }
                  @if (cliente.pref_asiento) {
                    <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">PREF. ASIENTO</strong><div>{{ cliente.pref_asiento }}</div></div>
                  }
                  @if (cliente.pref_comida) {
                    <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">PREF. COMIDA</strong><div>{{ cliente.pref_comida }}</div></div>
                  }
                  @if (cliente.observaciones_salud) {
                    <div class="col-12"><strong style="color: var(--text-muted); font-size: 0.75rem;">OBSERVACIONES SALUD</strong><div>{{ cliente.observaciones_salud }}</div></div>
                  }
                </div>
              </div>
            }
          </div>
          <div class="col-lg-4">
            <div class="glass-card-solid">
              <h5 style="font-weight: 700; margin-bottom: 1rem;">📎 Archivos</h5>
              @if (!cliente.archivos?.length) {
                <p style="color: var(--text-muted);">Sin archivos</p>
              }
              @for (a of cliente.archivos; track a.id) {
                <div style="padding: 0.5rem; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">
                  {{ a.nombre_archivo }}
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ClienteDetalleComponent implements OnInit {
  cliente: Cliente | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private confirm: ConfirmService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getCliente(id).subscribe({ next: (c) => this.cliente = c });
  }

  async eliminar(): Promise<void> {
    if (!this.cliente) return;
    const ok = await this.confirm.confirm({
      title: 'Eliminar Cliente',
      message: `¿Estás seguro de eliminar a "${this.cliente.nombre_completo}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteCliente(this.cliente.id).subscribe({
      next: () => {
        this.confirm.toast('Cliente eliminado correctamente');
        this.router.navigate(['/clientes']);
      },
      error: (err) => this.confirm.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }
}
