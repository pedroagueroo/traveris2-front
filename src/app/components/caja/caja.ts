import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ConfirmService } from '../../services/confirm.service';
import { BalanceCaja, DetalleCaja, Pago, Moneda, MetodoPago, ReporteDiario, Cotizacion } from '../../models';

type CajaTab = 'billeteras' | 'movimientos' | 'conversion';

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

      <!-- Saldos totales por moneda -->
      <div class="row g-3 mb-4">
        @for (b of balances; track b.moneda) {
          <div class="col-md-4">
            <div class="total-card" [ngClass]="b.moneda.toLowerCase()">
              <div class="total-label">SALDO {{ b.moneda }}</div>
              <div class="total-amount" [class.negative]="b.saldo < 0">
                {{ formatMoney(b.saldo, b.moneda) }}
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Cotizaciones -->
      @if (cotizaciones.length > 0) {
        <div class="glass-card-solid mb-4" style="padding: 0.75rem 1rem;">
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
        <button class="nav-link" [class.active]="tab === 'billeteras'" (click)="tab = 'billeteras'; cargarTodasBilleteras()">💳 Billeteras</button>
        <button class="nav-link" [class.active]="tab === 'movimientos'" (click)="tab = 'movimientos'; cargarDiario()">📅 Movimientos</button>
        <button class="nav-link" [class.active]="tab === 'conversion'" (click)="tab = 'conversion'">🔄 Conversión</button>
      </div>

      <!-- TAB: Billeteras -->
      @if (tab === 'billeteras') {
        <div class="animate-fadeInUp">
          @for (moneda of ['ARS', 'USD', 'EUR']; track moneda) {
            @if (getBilleterasPorMoneda(moneda).length > 0) {
              <div class="billeteras-section mb-4">
                <h5 class="section-title billetera-moneda-title">
                  {{ moneda === 'ARS' ? '🇦🇷' : moneda === 'USD' ? '🇺🇸' : '🇪🇺' }} Billeteras {{ moneda }}
                  <span class="billetera-total" [ngClass]="'money-' + moneda.toLowerCase()">
                    Total: {{ formatMoney(getTotalMoneda(moneda), moneda) }}
                  </span>
                </h5>
                <div class="billeteras-grid">
                  @for (d of getBilleterasPorMoneda(moneda); track d.metodo_id) {
                    <div class="billetera-card" [class.negative]="d.saldo < 0" [class.zero]="d.saldo === 0">
                      <div class="billetera-icon">
                        {{ getMetodoIcon(d.metodo_tipo) }}
                      </div>
                      <div class="billetera-info">
                        <div class="billetera-name">{{ d.metodo_nombre }}</div>
                        <div class="billetera-tipo">{{ d.metodo_tipo }}</div>
                      </div>
                      <div class="billetera-saldo" [class.negative]="d.saldo < 0">
                        {{ formatMoney(d.saldo, moneda) }}
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }

          <!-- Info de cómo se calcula -->
          <div class="glass-card-solid" style="padding: 1rem; margin-top: 1rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              <strong>📌 ¿Cómo se calcula el saldo de cada billetera?</strong><br>
              <span style="color: var(--success);">+ Cobros de clientes</span> ·
              <span style="color: var(--danger);">− Pagos a proveedores</span> ·
              <span style="color: var(--success);">+ Ingresos generales</span> ·
              <span style="color: var(--danger);">− Egresos generales</span><br>
              <span style="opacity: 0.7;">Los pagos con tarjeta-puente no afectan las billeteras de efectivo/transferencia.</span>
            </div>
          </div>

          <!-- Registrar Movimiento (Ingreso/Egreso) -->
          <div class="glass-card-solid mt-4">
            <h5 class="section-title">📝 Registrar Movimiento</h5>
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label-elite">Tipo</label>
                <select class="form-select-elite w-100" [(ngModel)]="movForm.tipo">
                  <option value="INGRESO_GENERAL">📥 Ingreso General</option>
                  <option value="EGRESO_GENERAL">📤 Egreso General</option>
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
                <label class="form-label-elite">Billetera</label>
                <select class="form-select-elite w-100" [(ngModel)]="movForm.metodo_pago_id">
                  <option [ngValue]="null">Seleccionar...</option>
                  @for (m of metodos; track m.id) {
                    <option [ngValue]="m.id">{{ getMetodoIcon(m.tipo) }} {{ m.nombre }}</option>
                  }
                </select>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button class="btn-elite w-100" (click)="registrarMovimiento()"><span>Registrar</span></button>
              </div>
              <div class="col-12">
                <input class="form-control-elite w-100" placeholder="Observaciones / Concepto" [(ngModel)]="movForm.observaciones" />
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB: Movimientos -->
      @if (tab === 'movimientos') {
        <div class="animate-fadeInUp">
          <div class="d-flex gap-2 mb-3 align-items-center flex-wrap">
            <input type="date" class="form-control-elite" [(ngModel)]="fechaDiario" (change)="cargarDiario()" style="width: 200px;" />
            @for (t of reporteDiario?.totales || []; track t.moneda) {
              <div class="stat-card" style="padding: 0.5rem 1rem;">
                <span style="font-size: 0.7rem; color: var(--text-muted);">{{ t.moneda }}</span>
                <div style="font-size: 0.8rem;">
                  <span style="color: var(--success);">+{{ t.ingresos | number:'1.2-2' }}</span> /
                  <span style="color: var(--danger);">-{{ t.egresos | number:'1.2-2' }}</span>
                </div>
              </div>
            }
          </div>

          <div class="glass-card-solid" style="padding: 0; overflow-x: auto;">
            <table class="table-premium">
              <thead><tr><th>Hora</th><th>Tipo</th><th>Moneda</th><th>Monto</th><th>Billetera</th><th>Detalle</th><th></th></tr></thead>
              <tbody>
                @for (m of reporteDiario?.movimientos || []; track m.id) {
                  <tr [class.anulado]="m.anulado">
                    <td>{{ formatHora(m.fecha) }}</td>
                    <td>
                      <span class="status-pill" [ngClass]="getTipoPillClass(m.tipo)">
                        {{ getTipoLabel(m.tipo) }}
                      </span>
                    </td>
                    <td>{{ m.moneda }}</td>
                    <td class="fw-bold" [ngClass]="getMontoClass(m)">
                      {{ getMontoPrefix(m) }}{{ (m.monto < 0 ? -m.monto : m.monto) | number:'1.2-2' }}
                    </td>
                    <td>{{ m.metodo_nombre || '-' }}</td>
                    <td style="font-size: 0.8rem; color: var(--text-secondary);">
                      {{ m.observaciones || m.cliente_nombre || m.proveedor_nombre || '-' }}
                    </td>
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
                <select class="form-select-elite w-100" [(ngModel)]="convForm.moneda_origen" (change)="cargarMetodosConvOrigen()">
                  <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label-elite">Billetera Origen</label>
                <select class="form-select-elite w-100" [(ngModel)]="convForm.metodo_origen_id">
                  <option [ngValue]="null">Seleccionar...</option>
                  @for (m of metodosConvOrigen; track m.id) {
                    <option [ngValue]="m.id">{{ m.nombre }}</option>
                  }
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
                <select class="form-select-elite w-100" [(ngModel)]="convForm.moneda_destino" (change)="cargarMetodosConvDestino()">
                  <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label-elite">Billetera Destino</label>
                <select class="form-select-elite w-100" [(ngModel)]="convForm.metodo_destino_id">
                  <option [ngValue]="null">Seleccionar...</option>
                  @for (m of metodosConvDestino; track m.id) {
                    <option [ngValue]="m.id">{{ m.nombre }}</option>
                  }
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
    .anulado { opacity: 0.4; }

    /* Total cards */
    .total-card {
      background: var(--glass-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
    }
    .total-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .total-card.ars { border-left: 4px solid #3b82f6; }
    .total-card.usd { border-left: 4px solid #10b981; }
    .total-card.eur { border-left: 4px solid #f59e0b; }
    .total-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); letter-spacing: 0.1em; margin-bottom: 0.5rem; }
    .total-amount { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); }
    .total-amount.negative { color: var(--danger); }

    /* Billeteras */
    .billeteras-section { }
    .billetera-moneda-title {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;
    }
    .billetera-total { font-size: 0.85rem; font-weight: 600; margin-left: auto; }
    .billeteras-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
    }
    .billetera-card {
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--glass-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      transition: all 0.3s ease;
    }
    .billetera-card:hover { border-color: var(--primary); transform: translateY(-1px); }
    .billetera-card.negative { border-color: var(--danger); background: rgba(239, 68, 68, 0.05); }
    .billetera-card.zero { opacity: 0.6; }
    .billetera-icon { font-size: 1.5rem; }
    .billetera-info { flex: 1; }
    .billetera-name { font-weight: 700; font-size: 0.85rem; }
    .billetera-tipo { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .billetera-saldo { font-size: 1.1rem; font-weight: 800; color: var(--success); }
    .billetera-saldo.negative { color: var(--danger); }
  `]
})
export class CajaComponent implements OnInit {
  balances: BalanceCaja[] = [];
  allDetalles: { [moneda: string]: DetalleCaja[] } = {};
  cotizaciones: Cotizacion[] = [];
  metodos: MetodoPago[] = [];
  metodosConvOrigen: MetodoPago[] = [];
  metodosConvDestino: MetodoPago[] = [];
  reporteDiario: ReporteDiario | null = null;
  fechaDiario = new Date().toISOString().split('T')[0];
  tab: CajaTab = 'billeteras';

  movForm = { tipo: 'INGRESO_GENERAL', moneda: 'ARS' as Moneda, monto: 0, metodo_pago_id: null as number | null, observaciones: '' };
  convForm = { moneda_origen: 'USD' as Moneda, moneda_destino: 'ARS' as Moneda, monto_origen: 0, monto_destino: 0, metodo_origen_id: null as number | null, metodo_destino_id: null as number | null, observaciones: '' };

  constructor(private api: ApiService, private confirmSvc: ConfirmService) {}

  ngOnInit(): void {
    this.cargarBalances();
    this.cargarMetodos();
    this.cargarTodasBilleteras();
    this.api.getCotizaciones().subscribe({ next: (c) => this.cotizaciones = c.slice(0, 4) });
  }

  cargarBalances(): void {
    this.api.getBalanceCaja().subscribe({ next: (b) => this.balances = b });
  }

  cargarMetodos(): void {
    this.api.getMetodosPago(this.movForm.moneda).subscribe({ next: (m) => this.metodos = m });
  }

  cargarTodasBilleteras(): void {
    for (const moneda of ['ARS', 'USD', 'EUR']) {
      this.api.getDetalleCaja(moneda as Moneda).subscribe({
        next: (d) => this.allDetalles[moneda] = d
      });
    }
  }

  cargarMetodosConvOrigen(): void {
    this.api.getMetodosPago(this.convForm.moneda_origen).subscribe({ next: (m) => this.metodosConvOrigen = m });
  }

  cargarMetodosConvDestino(): void {
    this.api.getMetodosPago(this.convForm.moneda_destino).subscribe({ next: (m) => this.metodosConvDestino = m });
  }

  getBilleterasPorMoneda(moneda: string): DetalleCaja[] {
    return this.allDetalles[moneda] || [];
  }

  getTotalMoneda(moneda: string): number {
    const b = this.balances.find(x => x.moneda === moneda);
    return b ? b.saldo : 0;
  }

  registrarMovimiento(): void {
    if (!this.movForm.monto) return;
    const monto = this.movForm.tipo === 'EGRESO_GENERAL' ? -Math.abs(this.movForm.monto) : Math.abs(this.movForm.monto);
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
        this.cargarTodasBilleteras();
      }
    });
  }

  cargarDiario(): void {
    this.api.getReporteDiario(this.fechaDiario).subscribe({ next: (r) => this.reporteDiario = r });
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
        this.cargarTodasBilleteras();
      },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }

  realizarConversion(): void {
    if (!this.convForm.monto_origen || !this.convForm.monto_destino) return;
    this.api.convertirMoneda(this.convForm).subscribe({
      next: () => {
        this.convForm = { moneda_origen: 'USD', moneda_destino: 'ARS', monto_origen: 0, monto_destino: 0, metodo_origen_id: null, metodo_destino_id: null, observaciones: '' };
        this.cargarBalances();
        this.cargarTodasBilleteras();
      }
    });
  }

  getMetodoIcon(tipo: string): string {
    switch (tipo) {
      case 'EFECTIVO': return '💵';
      case 'TRANSFERENCIA': return '🏦';
      case 'TARJETA': return '💳';
      default: return '💰';
    }
  }

  getTipoPillClass(tipo: string): string {
    if (tipo === 'COBRO_CLIENTE' || tipo === 'INGRESO_GENERAL') return 'activa';
    if (tipo === 'PAGO_PROVEEDOR' || tipo === 'EGRESO_GENERAL') return 'consumida';
    return 'pendiente';
  }

  getTipoLabel(tipo: string): string {
    switch (tipo) {
      case 'COBRO_CLIENTE': return '📥 Cobro';
      case 'PAGO_PROVEEDOR': return '📤 Pago Prov';
      case 'INGRESO_GENERAL': return '📥 Ingreso';
      case 'EGRESO_GENERAL': return '📤 Egreso';
      case 'CONVERSION': return '🔄 Conversión';
      default: return tipo;
    }
  }

  getMontoClass(m: any): string {
    if (m.tipo === 'COBRO_CLIENTE' || m.tipo === 'INGRESO_GENERAL') return 'money-positive';
    if (m.tipo === 'PAGO_PROVEEDOR' || m.tipo === 'EGRESO_GENERAL') return 'money-negative';
    return '';
  }

  getMontoPrefix(m: any): string {
    if (m.tipo === 'COBRO_CLIENTE' || m.tipo === 'INGRESO_GENERAL') return '+';
    if (m.tipo === 'PAGO_PROVEEDOR' || m.tipo === 'EGRESO_GENERAL') return '-';
    return '';
  }

  formatMoney(valor: number, moneda: string): string {
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
