import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ConfirmService } from '../../services/confirm.service';
import { BalanceCaja, DetalleCaja, Pago, Moneda, MetodoPago, ReporteDiario, Cotizacion } from '../../models';
import { ExportService } from '../../services/export.service';

type CajaTab = 'balance' | 'diario' | 'conversion';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <div>
          <h1 class="page-title">💰 Caja Contable</h1>
          <p class="page-subtitle">Balance y movimientos de la agencia</p>
        </div>
      </div>

      <!-- Balances rápidos -->
      <div class="row g-3 mb-4">
        @for (b of balances; track b.moneda) {
          <div class="col-md-4">
            <div class="money-wallet" [ngClass]="b.moneda.toLowerCase()" (click)="verDetalle(b.moneda)">
              <div class="label">{{ b.moneda }}</div>
              <div class="amount" [ngClass]="'money-' + b.moneda.toLowerCase()">
                {{ formatMoney(b.saldo, b.moneda) }}
              </div>
              @if (detalleMoneda === b.moneda && detalles.length > 0) {
                <div class="detalle-overlay animate-fadeInUp" (click)="$event.stopPropagation()">
                  @for (d of detalles; track d.metodo_id) {
                    <div class="detalle-row">
                      <span>{{ d.metodo_nombre }}</span>
                      <span class="fw-bold">{{ formatMoney(d.saldo, b.moneda) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Cotizaciones -->
      @if (cotizaciones.length > 0) {
        <div class="glass-card-solid mb-4" style="padding: 1rem;">
          <div class="d-flex gap-4 flex-wrap align-items-center">
            <span style="font-weight: 700; font-size: 0.85rem;">📊 Dólar:</span>
            @for (c of cotizaciones; track c.casa) {
              <div style="font-size: 0.8rem;">
                <span style="color: var(--text-muted);">{{ c.nombre }}:</span>
                <span style="color: var(--success); font-weight: 600;"> C {{ formatARS(c.compra) }}</span>
                <span style="color: var(--danger); font-weight: 600;"> V {{ formatARS(c.venta) }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Tabs -->
      <div class="nav-tabs-premium mb-3">
        <button class="nav-link" [class.active]="tab === 'balance'" (click)="tab = 'balance'">📊 Movimientos</button>
        <button class="nav-link" [class.active]="tab === 'diario'" (click)="tab = 'diario'; cargarDiario()">📅 Reporte Diario</button>
        <button class="nav-link" [class.active]="tab === 'conversion'" (click)="tab = 'conversion'">🔄 Conversión</button>
      </div>

      <!-- TAB: Movimientos generales -->
      @if (tab === 'balance') {
        <div class="animate-fadeInUp">
          <div class="d-flex justify-content-between mb-3">
            <h5 class="section-title">Registrar Movimiento</h5>
          </div>
          <div class="glass-card-solid mb-3">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label-elite">Tipo</label>
                <select class="form-select-elite w-100" [(ngModel)]="movForm.tipo">
                  <option value="INGRESO_GENERAL">Ingreso General</option>
                  <option value="EGRESO_GENERAL">Egreso General</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label-elite">Moneda</label>
                <select class="form-select-elite w-100" [(ngModel)]="movForm.moneda" (change)="cargarMetodos()">
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label-elite">Monto</label>
                <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="movForm.monto" />
              </div>
              <div class="col-md-3">
                <label class="form-label-elite">Método Pago</label>
                <select class="form-select-elite w-100" [(ngModel)]="movForm.metodo_pago_id">
                  <option [ngValue]="null">Seleccionar...</option>
                  @for (m of metodos; track m.id) {
                    <option [ngValue]="m.id">{{ m.nombre }}</option>
                  }
                </select>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button class="btn-elite w-100" (click)="registrarMovimiento()"><span>Registrar</span></button>
              </div>
              <div class="col-12">
                <input class="form-control-elite w-100" placeholder="Observaciones" [(ngModel)]="movForm.observaciones" />
              </div>
            </div>
          </div>

          <!-- Últimos movimientos del día — debajo del formulario -->
          <div class="glass-card-solid mt-3" style="padding: 0; overflow-x: auto;">
            <div style="padding: 1rem 1rem 0.5rem; font-size: 0.85rem; font-weight: 700;">
              Movimientos de hoy
            </div>
            <table class="table-premium">
              <thead>
                <tr><th>Hora</th><th>Tipo</th><th>Moneda</th><th>Monto</th><th>Método</th><th></th></tr>
              </thead>
              <tbody>
                @for (m of movimientosHoy; track m.id) {
                  <tr [class.anulado]="m.anulado">
                    <td>{{ formatHora(m.fecha) }}</td>
                    <td><span class="status-pill" [ngClass]="m.tipo === 'COBRO_CLIENTE' || m.tipo === 'INGRESO_GENERAL' ? 'activa' : 'consumida'">{{ m.tipo }}</span></td>
                    <td>{{ m.moneda }}</td>
                    <td class="fw-bold" [ngClass]="'money-' + m.moneda.toLowerCase()">{{ m.monto | number:'1.2-2' }}</td>
                    <td>{{ m.metodo_nombre || '-' }}</td>
                    <td>
                      @if (!m.anulado) {
                        <button class="btn-danger-elite" style="padding: 0.2rem 0.5rem; font-size: 0.65rem;" (click)="eliminarMovimiento(m.id)">🗑️</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Sin movimientos hoy</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB: Reporte Diario -->
      @if (tab === 'diario') {
        <div class="animate-fadeInUp">
          <div class="d-flex gap-2 mb-3 align-items-center">
            <input type="date" class="form-control-elite" [(ngModel)]="fechaDiario" (change)="cargarDiario()" style="width: 200px;" />
            <button class="btn-elite-outline" (click)="exportarDiario()">
              <span>📥 Excel</span>
            </button>
            @for (t of reporteDiario?.totales || []; track t.moneda) {
              <div class="stat-card" style="padding: 0.5rem 1rem;">
                <span style="font-size: 0.7rem; color: var(--text-muted);">{{ t.moneda }}</span>
                <div style="font-size: 0.8rem;"><span style="color: var(--success);">+{{ t.ingresos | number:'1.2-2' }}</span> / <span style="color: var(--danger);">-{{ t.egresos | number:'1.2-2' }}</span></div>
              </div>
            }
          </div>

          <div class="glass-card-solid" style="padding: 0; overflow-x: auto;">
            <table class="table-premium">
              <thead><tr><th>Hora</th><th>Tipo</th><th>Moneda</th><th>Monto</th><th>Método</th><th>Detalle</th><th></th></tr></thead>
              <tbody>
                @for (m of reporteDiario?.movimientos || []; track m.id) {
                  <tr [class.anulado]="m.anulado">
                    <td>{{ formatHora(m.fecha) }}</td>
                    <td><span class="status-pill" [ngClass]="m.tipo === 'COBRO_CLIENTE' || m.tipo === 'INGRESO_GENERAL' ? 'activa' : 'consumida'">{{ m.tipo }}</span></td>
                    <td>{{ m.moneda }}</td>
                    <td class="fw-bold" [ngClass]="'money-' + m.moneda.toLowerCase()">{{ m.monto | number:'1.2-2' }}</td>
                    <td>{{ m.metodo_nombre || '-' }}</td>
                    <td style="font-size: 0.8rem; color: var(--text-secondary);">{{ m.observaciones || m.cliente_nombre || m.proveedor_nombre || '-' }}</td>
                    <td>
                      @if (!m.anulado) {
                        <button class="btn-danger-elite" style="padding: 0.2rem 0.5rem; font-size: 0.65rem;" (click)="eliminarMovimiento(m.id)">🗑️</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin movimientos este día</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB: Conversión -->
      @if (tab === 'conversion') {
        <div class="animate-fadeInUp">
          <div class="glass-card-solid">
            <h5 class="section-title">🔄 Conversión de Moneda</h5>
            <div class="row g-3">
              <div class="col-md-2">
                <label class="form-label-elite">Moneda Origen</label>
                <select class="form-select-elite w-100" [(ngModel)]="convForm.moneda_origen">
                  <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label-elite">Monto Origen</label>
                <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="convForm.monto_origen" />
              </div>
              <div class="col-md-1 d-flex align-items-end justify-content-center">
                <span style="font-size: 1.5rem;">→</span>
              </div>
              <div class="col-md-2">
                <label class="form-label-elite">Moneda Destino</label>
                <select class="form-select-elite w-100" [(ngModel)]="convForm.moneda_destino">
                  <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label-elite">Monto Destino</label>
                <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="convForm.monto_destino" />
              </div>
              <div class="col-md-3 d-flex align-items-end">
                <button class="btn-elite w-100" (click)="realizarConversion()"><span>Convertir</span></button>
              </div>
              <div class="col-12">
                <input class="form-control-elite w-100" placeholder="Observaciones" [(ngModel)]="convForm.observaciones" />
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .section-title { font-weight: 700; font-size: 1rem; margin-bottom: 1rem; }
    .detalle-overlay {
      margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);
      max-height: 200px; overflow-y: auto;
    }
    .detalle-row {
      display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.8rem;
    }
    .anulado { opacity: 0.4; }
  `]
})
export class CajaComponent implements OnInit {
  balances: BalanceCaja[] = [];
  detalles: DetalleCaja[] = [];
  detalleMoneda: Moneda | null = null;
  cotizaciones: Cotizacion[] = [];
  metodos: MetodoPago[] = [];
  reporteDiario: ReporteDiario | null = null;
  fechaDiario = new Date().toISOString().split('T')[0];
  movimientosHoy: Pago[] = [];
  tab: CajaTab = 'balance';

  movForm = { tipo: 'INGRESO_GENERAL', moneda: 'ARS' as Moneda, monto: 0, metodo_pago_id: null as number | null, observaciones: '' };
  convForm = { moneda_origen: 'USD' as Moneda, moneda_destino: 'ARS' as Moneda, monto_origen: 0, monto_destino: 0, observaciones: '' };

  constructor(private api: ApiService, private confirmSvc: ConfirmService, private exportSvc: ExportService) {}

  exportarDiario(): void {
    if (this.reporteDiario) {
      this.exportSvc.exportarReporteDiario(this.reporteDiario, this.fechaDiario);
    }
  }

  ngOnInit(): void {
    this.cargarBalances();
    this.cargarMetodos();
    this.api.getCotizaciones().subscribe({ next: (c) => this.cotizaciones = c.slice(0, 4) });
    this.cargarMovimientosHoy();
  }

  cargarBalances(): void {
    this.api.getBalanceCaja().subscribe({ next: (b) => this.balances = b });
  }

  cargarMetodos(): void {
    this.api.getMetodosPago(this.movForm.moneda).subscribe({ next: (m) => this.metodos = m });
  }

  verDetalle(moneda: Moneda): void {
    if (this.detalleMoneda === moneda) { this.detalleMoneda = null; return; }
    this.detalleMoneda = moneda;
    this.api.getDetalleCaja(moneda).subscribe({ next: (d) => this.detalles = d });
  }

  registrarMovimiento(): void {
    if (!this.movForm.monto) return;
    const monto = Math.abs(this.movForm.monto);
    this.api.registrarPago({
      tipo: this.movForm.tipo as 'INGRESO_GENERAL' | 'EGRESO_GENERAL',
      moneda: this.movForm.moneda,
      monto,
      metodo_pago_id: this.movForm.metodo_pago_id,
      observaciones: this.movForm.observaciones
    }).subscribe({
      next: () => {
        this.movForm = { tipo: 'INGRESO_GENERAL', moneda: 'ARS', monto: 0, metodo_pago_id: null, observaciones: '' };
        this.cargarBalances();
        this.cargarMovimientosHoy();
      }
    });
  }

  cargarDiario(): void {
    this.api.getReporteDiario(this.fechaDiario).subscribe({ next: (r) => this.reporteDiario = r });
  }

  cargarMovimientosHoy(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.api.getReporteDiario(hoy).subscribe({
      next: (r) => this.movimientosHoy = r.movimientos
    });
  }

  async eliminarMovimiento(id: number): Promise<void> {
    const ok = await this.confirmSvc.confirm({
      title: 'Eliminar Movimiento',
      message: '¿Eliminar este movimiento de caja? Se revertirá el efecto en el balance.',
      confirmText: 'Sí, eliminar',
      type: 'warning'
    });
    if (!ok) return;
    this.api.eliminarMovimientoCaja(id).subscribe({
      next: () => {
        this.confirmSvc.toast('Movimiento eliminado');
        this.cargarDiario();
        this.cargarBalances();
        this.cargarMovimientosHoy();
      },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }

  realizarConversion(): void {
    if (!this.convForm.monto_origen || !this.convForm.monto_destino) return;
    this.api.convertirMoneda(this.convForm).subscribe({
      next: () => {
        this.convForm = { moneda_origen: 'USD', moneda_destino: 'ARS', monto_origen: 0, monto_destino: 0, observaciones: '' };
        this.cargarBalances();
      }
    });
  }

  formatMoney(valor: number, moneda: Moneda): string {
    const symbol = moneda === 'USD' ? 'US$' : moneda === 'EUR' ? '€' : '$';
    return `${symbol} ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(valor)}`;
  }

  formatHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  formatARS(valor: number): string {
    return '$ ' + new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
  }
}
