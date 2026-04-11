import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Cotizacion, BalanceCaja, Reserva } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fadeInUp">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Bienvenido, {{ auth.usuario()?.nombre_usuario }} 👋</p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-3 col-6">
          <div class="stat-card">
            <div class="stat-value" style="color: var(--primary)">{{ totalClientes }}</div>
            <div class="stat-label">Clientes</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-card">
            <div class="stat-value" style="color: var(--success)">{{ totalReservasAbiertas }}</div>
            <div class="stat-label">Reservas Abiertas</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-card">
            <div class="stat-value" style="color: var(--warning)">{{ proximosVencimientos.length }}</div>
            <div class="stat-label">Próx. Vencimientos</div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stat-card">
            <div class="stat-value" style="color: var(--accent)">{{ totalProveedores }}</div>
            <div class="stat-label">Proveedores</div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <!-- Caja Rápida -->
        <div class="col-lg-8">
          <div class="glass-card-solid">
            <h5 style="font-weight: 700; margin-bottom: 1rem;">💰 Caja Rápida</h5>
            <div class="row g-3">
              @for (b of balances; track b.moneda) {
                <div class="col-md-4">
                  <div class="money-wallet" [ngClass]="b.moneda.toLowerCase()">
                    <div class="label">{{ b.moneda }}</div>
                    <div class="amount" [ngClass]="'money-' + b.moneda.toLowerCase()">
                      {{ formatMoney(b.saldo) }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Cotizaciones -->
          @if (cotizaciones.length > 0) {
            <div class="glass-card-solid mt-3">
              <h5 style="font-weight: 700; margin-bottom: 1rem;">📊 Cotización del Dólar</h5>
              <div class="row g-2">
                @for (c of cotizaciones; track c.casa) {
                  <div class="col-md-4">
                    <div class="stat-card" style="padding: 1rem;">
                      <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">{{ c.nombre }}</div>
                      <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <div>
                          <span style="font-size: 0.65rem; color: var(--success);">COMPRA</span>
                          <div style="font-weight: 700;">$ {{ c.compra | number:'1.2-2' }}</div>
                        </div>
                        <div>
                          <span style="font-size: 0.65rem; color: var(--danger);">VENTA</span>
                          <div style="font-weight: 700;">$ {{ c.venta | number:'1.2-2' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Próximos vencimientos -->
        <div class="col-lg-4">
          <div class="glass-card-solid">
            <h5 style="font-weight: 700; margin-bottom: 1rem;">⏰ Próximos Vencimientos</h5>
            @if (proximosVencimientos.length === 0) {
              <p style="color: var(--text-muted); font-size: 0.85rem;">No hay vencimientos próximos</p>
            }
            @for (r of proximosVencimientos; track r.id) {
              <a [routerLink]="['/reservas', r.id]" class="vencimiento-item">
                <div class="venc-info">
                  <span class="venc-titular">{{ r.titular_nombre }}</span>
                  <span class="venc-destino">{{ r.destino_final || 'Sin destino' }}</span>
                </div>
                <span class="venc-fecha" [class.urgente]="isUrgente(r.fecha_limite_pago)">
                  {{ formatDate(r.fecha_limite_pago) }}
                </span>
              </a>
            }
          </div>

          <!-- Quick Actions -->
          <div class="glass-card-solid mt-3">
            <h5 style="font-weight: 700; margin-bottom: 1rem;">⚡ Acciones Rápidas</h5>
            <div class="d-flex flex-column gap-2">
              <a routerLink="/clientes/nuevo" class="btn-elite-outline" style="text-align: center;">
                ➕ Nuevo Cliente
              </a>
              <a routerLink="/reservas/nuevo" class="btn-elite-outline" style="text-align: center;">
                📋 Nueva Reserva
              </a>
              <a routerLink="/caja" class="btn-elite-outline" style="text-align: center;">
                💰 Ver Caja
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vencimiento-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border-radius: 10px;
      margin-bottom: 0.5rem;
      background: var(--bg-secondary);
      text-decoration: none;
      transition: var(--transition);
    }
    .vencimiento-item:hover {
      background: var(--bg-card-hover);
      transform: translateX(4px);
    }
    .venc-info {
      display: flex;
      flex-direction: column;
    }
    .venc-titular {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-primary);
    }
    .venc-destino {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .venc-fecha {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--warning);
      background: rgba(245, 158, 11, 0.1);
      padding: 0.2rem 0.6rem;
      border-radius: 100px;
    }
    .venc-fecha.urgente {
      color: var(--danger);
      background: rgba(239, 68, 68, 0.1);
    }
  `]
})
export class DashboardComponent implements OnInit {
  cotizaciones: Cotizacion[] = [];
  balances: BalanceCaja[] = [];
  proximosVencimientos: Reserva[] = [];
  totalClientes = 0;
  totalReservasAbiertas = 0;
  totalProveedores = 0;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Cotizaciones (pública)
    this.api.getCotizaciones().subscribe({
      next: (data) => this.cotizaciones = data.slice(0, 3),
      error: () => console.warn('No se pudieron cargar cotizaciones')
    });

    // Balance caja
    this.api.getBalanceCaja().subscribe({
      next: (data) => this.balances = data,
      error: () => {}
    });

    // Próximos vencimientos
    this.api.getProximosVencimientos().subscribe({
      next: (data) => this.proximosVencimientos = data.slice(0, 5),
      error: () => {}
    });

    // Contadores
    this.api.getClientes(1, 1).subscribe({
      next: (data) => this.totalClientes = data.total,
      error: () => {}
    });

    this.api.getReservas(1, 1, '', 'ABIERTO').subscribe({
      next: (data) => this.totalReservasAbiertas = data.total,
      error: () => {}
    });

    this.api.getProveedores().subscribe({
      next: (data) => this.totalProveedores = data.length,
      error: () => {}
    });
  }

  formatMoney(valor: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
      .format(valor).replace('ARS', '$');
  }

  formatDate(fecha: string | null): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  isUrgente(fecha: string | null): boolean {
    if (!fecha) return false;
    const diff = new Date(fecha).getTime() - new Date().getTime();
    return diff < 2 * 24 * 60 * 60 * 1000; // < 2 días
  }
}
