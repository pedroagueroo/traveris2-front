import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CierreMensual, Moneda } from '../../models';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">📈 Estadísticas</h1>
          <p class="page-subtitle">Cierre mensual y rentabilidad</p>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select-elite" [(ngModel)]="mes" (change)="cargar()" style="width: 130px;">
            @for (m of meses; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select class="form-select-elite" [(ngModel)]="anio" (change)="cargar()" style="width: 100px;">
            @for (a of anios; track a) {
              <option [value]="a">{{ a }}</option>
            }
          </select>
        </div>
      </div>

      @if (cierre) {
        <!-- Saldo anterior -->
        <div class="glass-card-solid mb-3">
          <h5 class="section-title">📊 Saldo al inicio del mes</h5>
          <div class="row g-3">
            @for (s of cierre.saldo_anterior; track s.moneda) {
              <div class="col-md-4">
                <div class="stat-card">
                  <div class="stat-label">{{ s.moneda }}</div>
                  <div class="stat-value" [ngClass]="'money-' + s.moneda.toLowerCase()">{{ formatMoney(s.saldo, s.moneda) }}</div>
                </div>
              </div>
            }
            @if (cierre.saldo_anterior.length === 0) {
              <div class="col-12"><p style="color: var(--text-muted);">Sin saldo anterior</p></div>
            }
          </div>
        </div>

        <!-- Movimientos del mes -->
        <div class="glass-card-solid mb-3">
          <h5 class="section-title">💳 Movimientos del Mes</h5>
          @if (cierre.movimientos.length === 0) {
            <p style="color: var(--text-muted);">Sin movimientos</p>
          } @else {
            <div class="glass-card-solid" style="padding: 0; overflow-x: auto;">
              <table class="table-premium">
                <thead><tr><th>Moneda</th><th>Tipo</th><th>Cantidad</th><th>Total</th></tr></thead>
                <tbody>
                  @for (m of cierre.movimientos; track m.moneda + m.tipo) {
                    <tr>
                      <td><span [ngClass]="'money-' + m.moneda.toLowerCase()">{{ m.moneda }}</span></td>
                      <td><span class="status-pill" [ngClass]="tipoColor(m.tipo)">{{ m.tipo }}</span></td>
                      <td>{{ m.cantidad }}</td>
                      <td class="fw-bold" [ngClass]="'money-' + m.moneda.toLowerCase()">{{ m.total | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Rentabilidad -->
        <div class="glass-card-solid">
          <h5 class="section-title">🎯 Rentabilidad del Mes</h5>
          @if (cierre.rentabilidad.length === 0) {
            <p style="color: var(--text-muted);">Sin reservas en este período</p>
          } @else {
            <div class="row g-3">
              @for (r of cierre.rentabilidad; track r.moneda) {
                <div class="col-md-4">
                  <div class="glass-card-solid">
                    <div style="text-align: center;">
                      <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">{{ r.moneda }}</div>
                      <div class="mt-2">
                        <div style="font-size: 0.8rem;">Venta: <span class="fw-bold">{{ r.total_venta | number:'1.2-2' }}</span></div>
                        <div style="font-size: 0.8rem;">Costo: <span class="fw-bold">{{ r.total_costo | number:'1.2-2' }}</span></div>
                        <div style="margin-top: 0.5rem; font-size: 1.5rem; font-weight: 800;"
                             [style.color]="r.ganancia >= 0 ? 'var(--success)' : 'var(--danger)'">
                          {{ r.ganancia >= 0 ? '+' : '' }}{{ r.ganancia | number:'1.2-2' }}
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">Ganancia</div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .section-title { font-weight: 700; font-size: 1rem; margin-bottom: 1rem; }
  `]
})
export class EstadisticasComponent implements OnInit {
  cierre: CierreMensual | null = null;
  mes = new Date().getMonth() + 1;
  anio = new Date().getFullYear();

  meses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  anios = [2024, 2025, 2026, 2027];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.api.getCierreMensual(this.mes, this.anio).subscribe({ next: (c) => this.cierre = c });
  }

  formatMoney(valor: number, moneda: Moneda): string {
    const s = moneda === 'USD' ? 'US$' : moneda === 'EUR' ? '€' : '$';
    return `${s} ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(valor)}`;
  }

  tipoColor(tipo: string): string {
    if (tipo.includes('COBRO') || tipo.includes('INGRESO')) return 'activa';
    if (tipo.includes('PAGO') || tipo.includes('EGRESO')) return 'consumida';
    return 'abierto';
  }
}
