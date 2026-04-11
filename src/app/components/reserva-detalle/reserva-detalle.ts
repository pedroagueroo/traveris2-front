import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ReciboPdfService } from '../../services/recibo-pdf.service';
import {
  Reserva, ServicioDetallado, Pago, Proveedor, MetodoPago,
  DeudaClienteDetalle, DeudaProveedorAgrupada, DeudaTotales,
  TarjetaCliente, Recibo, Moneda, TipoServicio
} from '../../models';

type Tab = 'info' | 'servicios' | 'deudas' | 'pagos' | 'vuelos' | 'archivos' | 'recibos';

interface ServicioForm {
  tipo_servicio: string;
  descripcion: string;
  id_proveedor: number | null;
  moneda: string;
  precio_cliente: number;
  costo_proveedor: number;
  hotel_nombre: string;
  hotel_ciudad: string;
  hotel_check_in: string;
  hotel_check_out: string;
  hotel_regimen: string;
  asistencia_compania: string;
  asistencia_plan: string;
  asistencia_fecha_desde: string;
  asistencia_fecha_hasta: string;
}

@Component({
  selector: 'app-reserva-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="animate-fadeInUp">
      @if (!reserva) {
        <div class="glass-card-solid" style="text-align: center; padding: 3rem;">
          <div class="skeleton" style="width: 200px; height: 24px; margin: 0 auto 1rem;"></div>
          <div class="skeleton" style="width: 300px; height: 16px; margin: 0 auto;"></div>
        </div>
      } @else {
        <!-- HEADER -->
        <div class="page-header">
          <div>
            <h1 class="page-title">
              Reserva #{{ reserva.id }}
              <span class="status-pill ms-2" [ngClass]="reserva.estado.toLowerCase()">{{ reserva.estado }}</span>
            </h1>
            <p class="page-subtitle">
              {{ reserva.titular_nombre }} → {{ reserva.destino_final || 'Sin destino' }}
            </p>
          </div>
          <div class="d-flex gap-2">
            <a [routerLink]="['/reservas/editar', reserva.id]" class="btn-elite-outline">✏️ Editar</a>
            <a routerLink="/reservas" class="btn-elite-outline">← Volver</a>
          </div>
        </div>

        <!-- TABS -->
        <div class="nav-tabs-premium mb-3">
          @for (t of tabs; track t.key) {
            <button class="nav-link" [class.active]="tabActiva === t.key" (click)="tabActiva = t.key">
              {{ t.icon }} {{ t.label }}
            </button>
          }
        </div>

        <!-- TAB: INFO -->
        @if (tabActiva === 'info') {
          <div class="row g-3 animate-fadeInUp">
            <div class="col-lg-8">
              <div class="glass-card-solid">
                <h5 class="section-title">📋 Información General</h5>
                <div class="row g-2">
                  <div class="col-md-6"><div class="info-label">TITULAR</div><div class="info-value">{{ reserva.titular_nombre }}</div></div>
                  <div class="col-md-6"><div class="info-label">DNI</div><div class="info-value">{{ reserva.titular_dni || '-' }}</div></div>
                  <div class="col-md-6"><div class="info-label">DESTINO</div><div class="info-value">{{ reserva.destino_final || '-' }}</div></div>
                  <div class="col-md-3"><div class="info-label">SALIDA</div><div class="info-value">{{ reserva.fecha_viaje_salida || '-' }}</div></div>
                  <div class="col-md-3"><div class="info-label">REGRESO</div><div class="info-value">{{ reserva.fecha_viaje_regreso || '-' }}</div></div>
                  <div class="col-md-6"><div class="info-label">OPERADOR</div><div class="info-value">{{ reserva.operador_mayorista || '-' }}</div></div>
                  <div class="col-md-6"><div class="info-label">EXPEDIENTE</div><div class="info-value">{{ reserva.nro_expediente_operador || '-' }}</div></div>
                  <div class="col-md-6"><div class="info-label">LÍMITE PAGO</div><div class="info-value" [class.urgente-text]="isUrgente()">{{ reserva.fecha_limite_pago || '-' }}</div></div>
                  <div class="col-12"><div class="info-label">OBSERVACIONES</div><div class="info-value">{{ reserva.observaciones_internas || '-' }}</div></div>
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="glass-card-solid">
                <h5 class="section-title">👥 Pasajeros ({{ reserva.pasajeros?.length || 0 }})</h5>
                @for (p of reserva.pasajeros; track p.id) {
                  <div class="pasajero-item">
                    <span class="fw-semibold">{{ p.nombre_completo }}</span>
                    @if (p.es_titular) { <span class="status-pill activa" style="font-size: 0.6rem;">TITULAR</span> }
                    <div style="font-size: 0.75rem; color: var(--text-muted);">{{ p.dni_pasaporte || 'Sin DNI' }}</div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- TAB: SERVICIOS -->
        @if (tabActiva === 'servicios') {
          <div class="animate-fadeInUp">
            <div class="d-flex justify-content-between mb-3">
              <h5 class="section-title">🏨 Servicios ({{ servicios.length }})</h5>
              <button class="btn-elite" (click)="mostrarFormServicio = !mostrarFormServicio">
                <span>➕ Agregar Servicio</span>
              </button>
            </div>

            @if (mostrarFormServicio) {
              <div class="glass-card-solid mb-3">
                <h6 class="fw-bold mb-3">Nuevo Servicio</h6>
                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label-elite">Tipo *</label>
                    <select class="form-select-elite w-100" [(ngModel)]="svcForm.tipo_servicio">
                      <option value="HOTEL">Hotel</option>
                      <option value="VUELO">Vuelo</option>
                      <option value="ASISTENCIA">Asistencia</option>
                      <option value="VISA">Visa</option>
                      <option value="CRUCERO">Crucero</option>
                      <option value="SERVICIO">Otro Servicio</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Proveedor</label>
                    <select class="form-select-elite w-100" [(ngModel)]="svcForm.id_proveedor">
                      <option [ngValue]="null">Sin proveedor</option>
                      @for (p of proveedores; track p.id) {
                        <option [ngValue]="p.id">{{ p.nombre_comercial }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Moneda *</label>
                    <select class="form-select-elite w-100" [(ngModel)]="svcForm.moneda">
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Descripción</label>
                    <input class="form-control-elite w-100" [(ngModel)]="svcForm.descripcion" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Precio Cliente *</label>
                    <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="svcForm.precio_cliente" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Costo Proveedor *</label>
                    <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="svcForm.costo_proveedor" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Ganancia</label>
                    <div class="form-control-elite w-100" style="background: var(--bg-secondary);"
                         [style.color]="gananciaServicio() >= 0 ? 'var(--success)' : 'var(--danger)'">
                      {{ gananciaServicio() | number:'1.2-2' }}
                    </div>
                  </div>
                </div>

                <!-- Campos dinámicos según tipo -->
                @if (svcForm.tipo_servicio === 'HOTEL') {
                  <div class="row g-3 mt-2">
                    <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Hotel" [(ngModel)]="svcForm.hotel_nombre" /></div>
                    <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Ciudad" [(ngModel)]="svcForm.hotel_ciudad" /></div>
                    <div class="col-md-2"><label style="font-size:0.7rem;color:var(--text-muted)">Check-in</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.hotel_check_in" /></div>
                    <div class="col-md-2"><label style="font-size:0.7rem;color:var(--text-muted)">Check-out</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.hotel_check_out" /></div>
                    <div class="col-md-2"><input class="form-control-elite w-100" placeholder="Régimen" [(ngModel)]="svcForm.hotel_regimen" /></div>
                  </div>
                }

                @if (svcForm.tipo_servicio === 'ASISTENCIA') {
                  <div class="row g-3 mt-2">
                    <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Compañía" [(ngModel)]="svcForm.asistencia_compania" /></div>
                    <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Plan" [(ngModel)]="svcForm.asistencia_plan" /></div>
                    <div class="col-md-3"><label style="font-size:0.7rem;color:var(--text-muted)">Desde</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.asistencia_fecha_desde" /></div>
                    <div class="col-md-3"><label style="font-size:0.7rem;color:var(--text-muted)">Hasta</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.asistencia_fecha_hasta" /></div>
                  </div>
                }

                <div class="d-flex gap-2 mt-3">
                  <button class="btn-elite" (click)="guardarServicio()"><span>Guardar</span></button>
                  <button class="btn-elite-outline" (click)="mostrarFormServicio = false">Cancelar</button>
                </div>
              </div>
            }

            <!-- Lista de servicios -->
            @for (s of servicios; track s.id) {
              <div class="glass-card-solid mb-2 servicio-card">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="status-pill abierto" style="font-size: 0.65rem;">{{ s.tipo_servicio }}</span>
                    <h6 class="mt-1 mb-0 fw-bold">{{ getNombreServicio(s) }}</h6>
                    <small style="color: var(--text-muted);">{{ s.proveedor_nombre || 'Sin proveedor' }}</small>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Cliente: <span class="fw-bold" [ngClass]="'money-' + s.moneda.toLowerCase()">{{ s.precio_cliente | number:'1.2-2' }} {{ s.moneda }}</span></div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Costo: <span class="fw-bold">{{ s.costo_proveedor | number:'1.2-2' }} {{ s.moneda }}</span></div>
                    <div style="font-size: 0.75rem;" [style.color]="(s.precio_cliente - s.costo_proveedor) >= 0 ? 'var(--success)' : 'var(--danger)'">
                      Ganancia: {{ s.precio_cliente - s.costo_proveedor | number:'1.2-2' }}
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="glass-card-solid" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin servicios</div>
            }
          </div>
        }

        <!-- TAB: DEUDAS -->
        @if (tabActiva === 'deudas') {
          <div class="animate-fadeInUp">
            <div class="row g-3">
              <div class="col-lg-6">
                <div class="glass-card-solid">
                  <h5 class="section-title">👤 Deuda del Cliente</h5>
                  @for (d of deudasCliente; track d.id) {
                    <div class="deuda-item">
                      <div>
                        <span class="fw-semibold" style="font-size: 0.85rem;">{{ d.servicio_nombre || d.tipo_servicio }}</span>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">{{ d.proveedor_nombre || '-' }}</div>
                      </div>
                      <div style="text-align: right;">
                        <div class="fw-bold" [ngClass]="'money-' + d.moneda.toLowerCase()">{{ d.saldo | number:'1.2-2' }} {{ d.moneda }}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">de {{ d.deuda_total | number:'1.2-2' }}</div>
                      </div>
                    </div>
                  }
                  @for (t of totalesCliente; track t.moneda) {
                    <div class="total-row">
                      <span>Total {{ t.moneda }}</span>
                      <span class="fw-bold" [ngClass]="'money-' + t.moneda.toLowerCase()">{{ t.saldo | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="col-lg-6">
                <div class="glass-card-solid">
                  <h5 class="section-title">🏢 Deuda a Proveedores</h5>
                  @for (d of deudasProveedores; track d.id_proveedor) {
                    <div class="deuda-item">
                      <div>
                        <span class="fw-semibold" style="font-size: 0.85rem;">{{ d.proveedor_nombre || 'Sin proveedor' }}</span>
                      </div>
                      <div style="text-align: right;">
                        <div class="fw-bold" [ngClass]="'money-' + d.moneda.toLowerCase()">{{ d.saldo | number:'1.2-2' }} {{ d.moneda }}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">de {{ d.deuda_total | number:'1.2-2' }}</div>
                      </div>
                    </div>
                  }
                  @for (t of totalesProveedores; track t.moneda) {
                    <div class="total-row">
                      <span>Total {{ t.moneda }}</span>
                      <span class="fw-bold" [ngClass]="'money-' + t.moneda.toLowerCase()">{{ t.saldo | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- TAB: PAGOS -->
        @if (tabActiva === 'pagos') {
          <div class="animate-fadeInUp">
            <div class="d-flex justify-content-between mb-3">
              <h5 class="section-title">💳 Pagos ({{ pagos.length }})</h5>
              <button class="btn-elite" (click)="mostrarFormPago = !mostrarFormPago"><span>➕ Registrar Pago</span></button>
            </div>

            @if (mostrarFormPago) {
              <div class="glass-card-solid mb-3">
                <h6 class="fw-bold mb-3">Nuevo Pago</h6>
                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label-elite">Tipo *</label>
                    <select class="form-select-elite w-100" [(ngModel)]="pagoForm.tipo" (change)="onTipoPagoCambia()">
                      <option value="COBRO_CLIENTE">Cobro Cliente</option>
                      <option value="PAGO_PROVEEDOR">Pago Proveedor</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Moneda *</label>
                    <select class="form-select-elite w-100" [(ngModel)]="pagoForm.moneda" (change)="cargarMetodosPago()">
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Monto *</label>
                    <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="pagoForm.monto" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Método Pago</label>
                    <select class="form-select-elite w-100" [(ngModel)]="pagoForm.metodo_pago_id">
                      <option [ngValue]="null">Seleccionar...</option>
                      @for (m of metodosPago; track m.id) {
                        <option [ngValue]="m.id">{{ m.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-elite">Deuda a aplicar</label>
                    <select class="form-select-elite w-100" [(ngModel)]="pagoForm.id_deuda">
                      <option [ngValue]="null">Sin vincular</option>
                      @for (d of deudasParaPago(); track $index) {
                        <option [ngValue]="getDeudaId(d)">{{ getNombreDeuda(d) }} — Saldo: {{ d.saldo | number:'1.2-2' }} {{ d.moneda }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-elite">Observaciones</label>
                    <input class="form-control-elite w-100" [(ngModel)]="pagoForm.observaciones" />
                  </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn-success-elite" (click)="registrarPago()"><span>Registrar</span></button>
                  <button class="btn-elite-outline" (click)="mostrarFormPago = false">Cancelar</button>
                </div>
              </div>
            }

            <!-- Lista pagos -->
            <div class="glass-card-solid" style="padding: 0; overflow-x: auto;">
              <table class="table-premium">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Moneda</th><th>Monto</th><th>Método</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  @for (p of pagos; track p.id) {
                    <tr [class.anulado]="p.anulado">
                      <td>{{ formatDate(p.fecha) }}</td>
                      <td><span class="status-pill" [ngClass]="p.tipo === 'COBRO_CLIENTE' ? 'activa' : 'consumida'">{{ p.tipo }}</span></td>
                      <td>{{ p.moneda }}</td>
                      <td class="fw-bold" [ngClass]="'money-' + p.moneda.toLowerCase()">{{ p.monto | number:'1.2-2' }}</td>
                      <td>{{ p.metodo_nombre || '-' }}</td>
                      <td>
                        @if (p.anulado) { <span class="status-pill cancelado">ANULADO</span> }
                        @else { <span class="status-pill activa">ACTIVO</span> }
                      </td>
                      <td>
                        @if (!p.anulado) {
                          <button class="btn-danger-elite" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" (click)="anularPago(p.id)">Anular</button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin pagos</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- TAB: VUELOS -->
        @if (tabActiva === 'vuelos') {
          <div class="animate-fadeInUp">
            <h5 class="section-title">✈️ Vuelos ({{ reserva.vuelos?.length || 0 }})</h5>
            @for (v of reserva.vuelos; track v.id) {
              <div class="glass-card-solid mb-2">
                <div class="d-flex justify-content-between">
                  <div>
                    <span class="fw-bold" style="color: var(--primary);">{{ v.aerolinea }} {{ v.nro_vuelo }}</span>
                    <div style="font-size: 0.85rem;">{{ v.origen }} → {{ v.destino }}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Clase: {{ v.clase || '-' }} | Reserva: {{ v.codigo_reserva || '-' }}</div>
                  </div>
                  <div style="text-align: right; font-size: 0.8rem;">
                    <div>🛫 {{ v.fecha_salida || '-' }}</div>
                    <div>🛬 {{ v.fecha_llegada || '-' }}</div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="glass-card-solid" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin vuelos</div>
            }
          </div>
        }

        <!-- TAB: ARCHIVOS -->
        @if (tabActiva === 'archivos') {
          <div class="animate-fadeInUp">
            <div class="d-flex justify-content-between mb-3">
              <h5 class="section-title">📎 Archivos</h5>
              <label class="btn-elite" style="cursor: pointer;">
                <span>📤 Subir Archivo</span>
                <input type="file" hidden (change)="subirArchivo($event)" />
              </label>
            </div>
            @for (a of reserva.archivos; track a.id) {
              <div class="glass-card-solid mb-2" style="padding: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                <a [href]="a.ruta_archivo" target="_blank" style="font-size: 0.85rem;">{{ a.nombre_archivo }}</a>
                <span style="font-size: 0.7rem; color: var(--text-muted);">{{ a.tipo_archivo }}</span>
              </div>
            } @empty {
              <div class="glass-card-solid" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin archivos</div>
            }
          </div>
        }

        <!-- TAB: RECIBOS -->
        @if (tabActiva === 'recibos') {
          <div class="animate-fadeInUp">
            <h5 class="section-title">🧾 Recibos</h5>
            @for (r of recibos; track r.id) {
              <div class="glass-card-solid mb-2" style="padding: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span class="fw-bold">Recibo #{{ r.numero_recibo }}</span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);"> — {{ r.nombre_cliente }}</span>
                  @if (r.anulado) { <span class="status-pill cancelado ms-2">ANULADO</span> }
                </div>
                <div class="d-flex gap-2 align-items-center">
                  <span class="fw-bold" [ngClass]="'money-' + r.moneda.toLowerCase()">{{ r.monto | number:'1.2-2' }} {{ r.moneda }}</span>
                  <button class="btn-elite-outline" style="padding: 0.2rem 0.6rem; font-size: 0.7rem;" (click)="descargarReciboPDF(r.id)">📄 PDF</button>
                </div>
              </div>
            } @empty {
              <div class="glass-card-solid" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin recibos</div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .section-title { font-weight: 700; font-size: 1rem; margin-bottom: 1rem; }
    .info-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0.5rem; }
    .urgente-text { color: var(--danger) !important; font-weight: 700; }
    .pasajero-item { padding: 0.5rem; border-bottom: 1px solid var(--border-light); }
    .deuda-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--border-light); }
    .total-row {
      display: flex; justify-content: space-between; padding: 0.75rem;
      background: var(--bg-secondary); border-radius: 8px; margin-top: 0.5rem;
      font-size: 0.9rem;
    }
    .servicio-card:hover { border-color: rgba(var(--primary-rgb), 0.3); }
    .anulado { opacity: 0.5; text-decoration: line-through; }
  `]
})
export class ReservaDetalleComponent implements OnInit {
  reserva: Reserva | null = null;
  servicios: ServicioDetallado[] = [];
  pagos: Pago[] = [];
  proveedores: Proveedor[] = [];
  metodosPago: MetodoPago[] = [];
  recibos: Recibo[] = [];
  deudasCliente: DeudaClienteDetalle[] = [];
  deudasProveedores: DeudaProveedorAgrupada[] = [];
  totalesCliente: DeudaTotales[] = [];
  totalesProveedores: DeudaTotales[] = [];
  tarjetasDisponibles: TarjetaCliente[] = [];

  tabActiva: Tab = 'info';
  mostrarFormServicio = false;
  mostrarFormPago = false;

  tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'info', label: 'Info', icon: '📋' },
    { key: 'servicios', label: 'Servicios', icon: '🏨' },
    { key: 'deudas', label: 'Deudas', icon: '📊' },
    { key: 'pagos', label: 'Pagos', icon: '💳' },
    { key: 'vuelos', label: 'Vuelos', icon: '✈️' },
    { key: 'archivos', label: 'Archivos', icon: '📎' },
    { key: 'recibos', label: 'Recibos', icon: '🧾' }
  ];

  svcForm: ServicioForm = this.resetSvcForm();
  pagoForm = {
    tipo: 'COBRO_CLIENTE' as string,
    moneda: 'ARS' as Moneda,
    monto: 0,
    metodo_pago_id: null as number | null,
    id_deuda: null as number | null,
    observaciones: ''
  };

  private idReserva = 0;

  constructor(private api: ApiService, private route: ActivatedRoute, private reciboPdf: ReciboPdfService) {}

  ngOnInit(): void {
    this.idReserva = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarTodo();
    this.api.getProveedores().subscribe({ next: (p) => this.proveedores = p });
    this.cargarMetodosPago();
  }

  cargarTodo(): void {
    this.api.getReserva(this.idReserva).subscribe({ next: (r) => this.reserva = r });
    this.api.getServiciosReserva(this.idReserva).subscribe({ next: (s) => this.servicios = s });
    this.api.getPagosReserva(this.idReserva).subscribe({ next: (p) => this.pagos = p });
    this.api.getRecibosReserva(this.idReserva).subscribe({ next: (r) => this.recibos = r });
    this.cargarDeudas();
  }

  cargarDeudas(): void {
    this.api.listarDeudasClientes(this.idReserva).subscribe({
      next: (r) => {
        this.deudasCliente = r.detalle as DeudaClienteDetalle[];
        this.totalesCliente = r.totales;
      }
    });
    this.api.listarDeudasProveedores(this.idReserva).subscribe({
      next: (r) => {
        this.deudasProveedores = r.detalle as DeudaProveedorAgrupada[];
        this.totalesProveedores = r.totales;
      }
    });
  }

  cargarMetodosPago(): void {
    this.api.getMetodosPago(this.pagoForm.moneda).subscribe({
      next: (m) => this.metodosPago = m
    });
  }

  // Servicios
  resetSvcForm(): ServicioForm {
    return {
      tipo_servicio: 'HOTEL', descripcion: '', id_proveedor: null,
      moneda: 'ARS', precio_cliente: 0, costo_proveedor: 0,
      hotel_nombre: '', hotel_ciudad: '', hotel_check_in: '', hotel_check_out: '', hotel_regimen: '',
      asistencia_compania: '', asistencia_plan: '', asistencia_fecha_desde: '', asistencia_fecha_hasta: ''
    };
  }

  gananciaServicio(): number {
    return (this.svcForm.precio_cliente || 0) - (this.svcForm.costo_proveedor || 0);
  }

  guardarServicio(): void {
    this.api.crearServicio({ id_reserva: this.idReserva, ...this.svcForm } as Partial<ServicioDetallado>).subscribe({
      next: () => {
        this.mostrarFormServicio = false;
        this.svcForm = this.resetSvcForm();
        this.cargarTodo();
      }
    });
  }

  getNombreServicio(s: ServicioDetallado): string {
    return s.hotel_nombre || s.vuelo_aerolinea || s.asistencia_compania || s.crucero_naviera || s.visa_pais || s.descripcion || s.tipo_servicio;
  }

  // Pagos
  onTipoPagoCambia(): void {
    this.pagoForm.id_deuda = null;
  }

  registrarPago(): void {
    if (!this.pagoForm.monto) return;
    const selectedDeuda = this.pagoForm.tipo === 'COBRO_CLIENTE'
      ? this.deudasCliente.find(d => d.id === this.pagoForm.id_deuda)
      : this.deudasProveedores.find(d => (d as unknown as { id: number }).id === this.pagoForm.id_deuda);

    this.api.registrarPago({
      id_reserva: this.idReserva,
      id_deuda: this.pagoForm.id_deuda,
      id_cliente: this.reserva?.id_titular || null,
      tipo: this.pagoForm.tipo as 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR',
      moneda: this.pagoForm.moneda,
      monto: this.pagoForm.monto,
      metodo_pago_id: this.pagoForm.metodo_pago_id,
      observaciones: this.pagoForm.observaciones
    }).subscribe({
      next: () => {
        this.mostrarFormPago = false;
        this.pagoForm = { tipo: 'COBRO_CLIENTE', moneda: 'ARS', monto: 0, metodo_pago_id: null, id_deuda: null, observaciones: '' };
        this.cargarTodo();
      }
    });
  }

  anularPago(id: number): void {
    if (confirm('¿Anular este pago? Se revertirá el monto en la deuda.')) {
      this.api.anularPago(id).subscribe({ next: () => this.cargarTodo() });
    }
  }

  getNombreDeuda(d: DeudaClienteDetalle | DeudaProveedorAgrupada): string {
    if ('servicio_nombre' in d) return d.servicio_nombre || d.tipo_servicio || 'Servicio';
    if ('proveedor_nombre' in d) return d.proveedor_nombre || 'Proveedor';
    return 'Deuda';
  }

  deudasParaPago(): (DeudaClienteDetalle | DeudaProveedorAgrupada)[] {
    return this.pagoForm.tipo === 'COBRO_CLIENTE' ? this.deudasCliente : this.deudasProveedores;
  }

  getDeudaId(d: DeudaClienteDetalle | DeudaProveedorAgrupada): number | null {
    if ('id' in d) return d.id;
    return d.id_proveedor;
  }

  // Archivos
  subirArchivo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.api.uploadReservaArchivo(this.idReserva, input.files[0]).subscribe({
      next: () => this.cargarTodo()
    });
  }

  // Helpers
  formatDate(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  isUrgente(): boolean {
    if (!this.reserva?.fecha_limite_pago) return false;
    return new Date(this.reserva.fecha_limite_pago).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  }

  descargarReciboPDF(id: number): void {
    this.reciboPdf.generarReciboPDF(id).catch(err => console.error('Error generando PDF:', err));
  }
}
