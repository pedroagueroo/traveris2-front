import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
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
        <a routerLink="/clientes" class="btn-elite-outline">← Volver</a>
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
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">NACIMIENTO</strong><div>{{ cliente.fecha_nacimiento || '-' }}</div></div>
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">NACIONALIDAD</strong><div>{{ cliente.nacionalidad || '-' }}</div></div>
                <div class="col-md-6"><strong style="color: var(--text-muted); font-size: 0.75rem;">SEXO</strong><div>{{ cliente.sexo || '-' }}</div></div>
              </div>
            </div>
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

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getCliente(id).subscribe({ next: (c) => this.cliente = c });
  }
}
