import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ReciboPdfService } from '../../services/recibo-pdf.service';
import { ConfirmService } from '../../services/confirm.service';
import {
  Reserva, ServicioDetallado, Pago, Proveedor, MetodoPago,
  DeudaClienteDetalle, DeudaProveedorAgrupada, DeudaTotales,
  TarjetaCliente, Recibo, Moneda, TipoServicio
} from '../../models';

type Tab = 'info' | 'servicios' | 'deudas' | 'pagos' | 'archivos' | 'recibos';

interface ServicioForm {
  tipo_servicio: string;
  descripcion: string;
  id_proveedor: number | null;
  moneda: string;
  precio_cliente: number;
  costo_proveedor: number;
  // HOTEL
  hotel_nombre: string;
  hotel_ciudad: string;
  hotel_check_in: string;
  hotel_check_out: string;
  hotel_regimen: string;
  hotel_noches: number | null;
  hotel_categoria: string;
  // VUELO
  vuelo_aerolinea: string;
  vuelo_nro: string;
  vuelo_origen: string;
  vuelo_destino: string;
  vuelo_fecha_salida: string;
  vuelo_fecha_llegada: string;
  vuelo_clase: string;
  vuelo_codigo_reserva: string;
  // ASISTENCIA
  asistencia_compania: string;
  asistencia_plan: string;
  asistencia_fecha_desde: string;
  asistencia_fecha_hasta: string;
  asistencia_cobertura: string;
  // VISA
  visa_pais: string;
  visa_tipo: string;
  visa_fecha_tramite: string;
  visa_nro_tramite: string;
  // CRUCERO
  crucero_naviera: string;
  crucero_barco: string;
  crucero_itinerario: string;
  crucero_cabina: string;
  crucero_fecha_embarque: string;
  crucero_fecha_desembarque: string;
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
            <button class="btn-elite-outline" style="color: #ef4444; border-color: #ef4444;" (click)="eliminarReserva()">🗑️ Eliminar</button>
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
                  <div class="col-md-3"><div class="info-label">SALIDA</div><div class="info-value">{{ reserva.fecha_viaje_salida ? formatDate(reserva.fecha_viaje_salida) : '-' }}</div></div>
                  <div class="col-md-3"><div class="info-label">REGRESO</div><div class="info-value">{{ reserva.fecha_viaje_regreso ? formatDate(reserva.fecha_viaje_regreso) : '-' }}</div></div>
                  <div class="col-md-6"><div class="info-label">OPERADOR</div><div class="info-value">{{ reserva.operador_mayorista || '-' }}</div></div>
                  <div class="col-md-6"><div class="info-label">EXPEDIENTE</div><div class="info-value">{{ reserva.nro_expediente_operador || '-' }}</div></div>
                  <div class="col-md-6"><div class="info-label">LÍMITE PAGO</div><div class="info-value" [class.urgente-text]="isUrgente()">{{ reserva.fecha_limite_pago ? formatDate(reserva.fecha_limite_pago) : '-' }}</div></div>
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
                <h6 class="fw-bold mb-3">{{ editandoServicioId ? '✏️ Editar Servicio' : 'Nuevo Servicio' }}</h6>
                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label-elite">Tipo *</label>
                    <select class="form-select-elite w-100" [(ngModel)]="svcForm.tipo_servicio">
                      <option value="HOTEL">🏨 Hotel</option>
                      <option value="VUELO">✈️ Vuelo</option>
                      <option value="ASISTENCIA">🛡️ Asistencia</option>
                      <option value="VISA">📋 Visa</option>
                      <option value="CRUCERO">🚢 Crucero</option>
                      <option value="SERVICIO">📦 Otro Servicio</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Proveedor</label>
                    <div class="d-flex gap-1">
                      <select class="form-select-elite w-100" [(ngModel)]="svcForm.id_proveedor">
                        <option [ngValue]="null">Sin proveedor</option>
                        @for (p of proveedores; track p.id) {
                          <option [ngValue]="p.id">{{ p.nombre_comercial }}</option>
                        }
                      </select>
                      <button class="btn-elite-outline" style="padding:0.3rem 0.5rem;font-size:0.75rem;white-space:nowrap;" (click)="mostrarFormProveedorRapido = !mostrarFormProveedorRapido" title="Nuevo proveedor">➕</button>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label-elite">Moneda *</label>
                    <select class="form-select-elite w-100" [(ngModel)]="svcForm.moneda">
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label-elite">Precio Cliente *</label>
                    <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="svcForm.precio_cliente" />
                  </div>
                  <div class="col-md-2">
                    <label class="form-label-elite">Costo Proveedor *</label>
                    <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="svcForm.costo_proveedor" />
                  </div>
                </div>

                <!-- Mini-form proveedor rápido -->
                @if (mostrarFormProveedorRapido) {
                  <div class="row g-2 mt-2 p-2" style="background: var(--bg-secondary); border-radius: 10px; border: 1px dashed var(--primary);">
                    <div class="col-12" style="font-size:0.75rem; font-weight:700; color:var(--primary);">➕ Nuevo Proveedor Rápido</div>
                    <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Nombre comercial *" [(ngModel)]="proveedorRapido.nombre_comercial" /></div>
                    <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Contacto" [(ngModel)]="proveedorRapido.contacto" /></div>
                    <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Email" [(ngModel)]="proveedorRapido.email" /></div>
                    <div class="col-md-3 d-flex align-items-end gap-1">
                      <button class="btn-success-elite" style="font-size:0.75rem;padding:0.35rem 0.75rem;" (click)="crearProveedorRapido()"><span>Crear</span></button>
                      <button class="btn-elite-outline" style="font-size:0.75rem;padding:0.35rem 0.5rem;" (click)="mostrarFormProveedorRapido = false">✕</button>
                    </div>
                  </div>
                }

                <!-- Ganancia + Descripción -->
                <div class="row g-3 mt-1">
                  <div class="col-md-2">
                    <label class="form-label-elite">Ganancia</label>
                    <div class="form-control-elite w-100" style="background: var(--bg-secondary);"
                         [style.color]="gananciaServicio() >= 0 ? 'var(--success)' : 'var(--danger)'">
                      {{ gananciaServicio() | number:'1.2-2' }}
                    </div>
                  </div>
                  <div class="col-md-10">
                    <label class="form-label-elite">Descripción / Notas</label>
                    <input class="form-control-elite w-100" [(ngModel)]="svcForm.descripcion" placeholder="Detalle adicional del servicio" />
                  </div>
                </div>

                <!-- ═══ Campos dinámicos según tipo ═══ -->

                @if (svcForm.tipo_servicio === 'HOTEL') {
                  <div class="tipo-fields-label">🏨 Datos del Hotel</div>
                  <div class="row g-2">
                    <div class="col-md-3"><label class="form-label-elite">Nombre Hotel</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.hotel_nombre" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Ciudad</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.hotel_ciudad" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Check-in</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.hotel_check_in" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Check-out</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.hotel_check_out" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Régimen</label>
                      <select class="form-select-elite w-100" [(ngModel)]="svcForm.hotel_regimen">
                        <option value="">Seleccionar...</option>
                        <option value="Solo Alojamiento">Solo Alojamiento</option>
                        <option value="Desayuno">Desayuno</option>
                        <option value="Media Pensión">Media Pensión</option>
                        <option value="Pensión Completa">Pensión Completa</option>
                        <option value="All Inclusive">All Inclusive</option>
                      </select>
                    </div>
                    <div class="col-md-2"><label class="form-label-elite">Noches</label><input type="number" class="form-control-elite w-100" [(ngModel)]="svcForm.hotel_noches" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Categoría</label>
                      <select class="form-select-elite w-100" [(ngModel)]="svcForm.hotel_categoria">
                        <option value="">—</option>
                        <option value="★">★</option><option value="★★">★★</option><option value="★★★">★★★</option>
                        <option value="★★★★">★★★★</option><option value="★★★★★">★★★★★</option>
                      </select>
                    </div>
                  </div>
                }

                @if (svcForm.tipo_servicio === 'VUELO') {
                  <div class="tipo-fields-label">✈️ Datos del Vuelo</div>
                  <div class="row g-2">
                    <div class="col-md-3"><label class="form-label-elite">Aerolínea</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.vuelo_aerolinea" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Nro Vuelo</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.vuelo_nro" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Origen</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.vuelo_origen" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Destino</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.vuelo_destino" /></div>
                    <div class="col-md-3"><label class="form-label-elite">PNR / Código</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.vuelo_codigo_reserva" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Fecha Salida</label><input type="datetime-local" class="form-control-elite w-100" [(ngModel)]="svcForm.vuelo_fecha_salida" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Fecha Llegada</label><input type="datetime-local" class="form-control-elite w-100" [(ngModel)]="svcForm.vuelo_fecha_llegada" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Clase</label>
                      <select class="form-select-elite w-100" [(ngModel)]="svcForm.vuelo_clase">
                        <option value="">—</option>
                        <option value="Economy">Economy</option><option value="Premium Economy">Premium Economy</option>
                        <option value="Business">Business</option><option value="First">First</option>
                      </select>
                    </div>
                  </div>
                }

                @if (svcForm.tipo_servicio === 'ASISTENCIA') {
                  <div class="tipo-fields-label">🛡️ Datos de la Asistencia</div>
                  <div class="row g-2">
                    <div class="col-md-3"><label class="form-label-elite">Compañía</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.asistencia_compania" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Plan</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.asistencia_plan" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Desde</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.asistencia_fecha_desde" /></div>
                    <div class="col-md-2"><label class="form-label-elite">Hasta</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.asistencia_fecha_hasta" /></div>
                    <div class="col-md-12"><label class="form-label-elite">Cobertura</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.asistencia_cobertura" placeholder="Detalle de cobertura" /></div>
                  </div>
                }

                @if (svcForm.tipo_servicio === 'VISA') {
                  <div class="tipo-fields-label">📋 Datos de la Visa</div>
                  <div class="row g-2">
                    <div class="col-md-3"><label class="form-label-elite">País</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.visa_pais" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Tipo Visa</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.visa_tipo" placeholder="Turismo, Trabajo..." /></div>
                    <div class="col-md-3"><label class="form-label-elite">Fecha Trámite</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.visa_fecha_tramite" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Nro Trámite</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.visa_nro_tramite" /></div>
                  </div>
                }

                @if (svcForm.tipo_servicio === 'CRUCERO') {
                  <div class="tipo-fields-label">🚢 Datos del Crucero</div>
                  <div class="row g-2">
                    <div class="col-md-3"><label class="form-label-elite">Naviera</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.crucero_naviera" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Barco</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.crucero_barco" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Cabina</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.crucero_cabina" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Embarque</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.crucero_fecha_embarque" /></div>
                    <div class="col-md-3"><label class="form-label-elite">Desembarque</label><input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.crucero_fecha_desembarque" /></div>
                    <div class="col-md-9"><label class="form-label-elite">Itinerario</label><input class="form-control-elite w-100" [(ngModel)]="svcForm.crucero_itinerario" placeholder="Puertos y paradas" /></div>
                  </div>
                }

                <div class="d-flex gap-2 mt-3">
                  <button class="btn-elite" (click)="guardarServicio()"><span>💾 {{ editandoServicioId ? 'Actualizar' : 'Guardar' }} Servicio</span></button>
                  <button class="btn-elite-outline" (click)="cancelarFormServicio()">Cancelar</button>
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
                    <div class="d-flex gap-1 mt-1 justify-content-end">
                      <button class="btn-elite-outline" style="padding:0.2rem 0.5rem;font-size:0.7rem;" (click)="editarServicio(s)">✏️ Editar</button>
                      <button class="btn-elite-outline" style="padding:0.2rem 0.5rem;font-size:0.7rem;color:var(--danger);border-color:var(--danger);" (click)="eliminarServicio(s.id)">🗑️</button>
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
                  @for (d of deudasProveedores; track d.id) {
                    <div class="deuda-item">
                      <div>
                        <span class="status-pill" style="font-size: 0.65rem; padding: 0.15rem 0.4rem;">{{ d.tipo_servicio }}</span>
                        <span class="fw-semibold" style="font-size: 0.85rem; margin-left: 0.3rem;">{{ d.servicio_nombre || d.descripcion || d.tipo_servicio }}</span>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">{{ d.proveedor_nombre || 'Sin proveedor' }}</div>
                      </div>
                      <div style="text-align: right;">
                        <div class="fw-bold" [ngClass]="'money-' + d.moneda.toLowerCase()">{{ d.saldo | number:'1.2-2' }} {{ d.moneda }}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">de {{ d.deuda_total | number:'1.2-2' }}</div>
                      </div>
                    </div>
                  } @empty {
                    <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">Sin deudas a proveedores</div>
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
                    <select class="form-select-elite w-100" [(ngModel)]="pagoForm.metodo_pago_id" (change)="onMetodoPagoCambia()">
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

                <!-- TARJETA NUEVA: COBRO_CLIENTE con método TARJETA -->
                @if (pagoForm.tipo === 'COBRO_CLIENTE' && metodoSeleccionadoEsTarjeta) {
                  <div class="tipo-fields-label">💳 Datos de Tarjeta del Cliente</div>
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label-elite">Titular *</label>
                      <input class="form-control-elite w-100" [(ngModel)]="pagoForm.tarjeta_titular" placeholder="Nombre del titular" />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label-elite">Número de Tarjeta *</label>
                      <input class="form-control-elite w-100" [(ngModel)]="pagoForm.tarjeta_numero" placeholder="4507 9912 3456 7890" maxlength="19" />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label-elite">Expiración</label>
                      <input class="form-control-elite w-100" [(ngModel)]="pagoForm.tarjeta_expiracion" placeholder="MM/YY" maxlength="5" />
                    </div>
                  </div>
                }

                <!-- TARJETA PUENTE: PAGO_PROVEEDOR con método TARJETA -->
                @if (pagoForm.tipo === 'PAGO_PROVEEDOR' && metodoSeleccionadoEsTarjeta) {
                  <div class="tipo-fields-label">💳 Seleccionar Tarjeta del Cliente</div>
                  <div class="row g-3">
                    <div class="col-md-12">
                      <label class="form-label-elite">Tarjeta disponible *</label>
                      <select class="form-select-elite w-100" [(ngModel)]="pagoForm.id_tarjeta_cliente">
                        <option [ngValue]="null">Seleccionar tarjeta...</option>
                        @for (t of tarjetasDisponibles; track t.id) {
                          <option [ngValue]="t.id">{{ t.banco_detectado }} — {{ t.numero_mask }} — {{ t.titular }} — Disponible: {{ t.monto_disponible | number:'1.2-2' }} {{ t.moneda }}</option>
                        }
                      </select>
                      @if (tarjetasDisponibles.length === 0) {
                        <small style="color: var(--warning); font-size: 0.75rem;">⚠️ No hay tarjetas disponibles. Primero registre un cobro al cliente con tarjeta.</small>
                      }
                    </div>
                  </div>
                }

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
    .tipo-fields-label {
      margin-top: 0.75rem; margin-bottom: 0.5rem; font-size: 0.8rem;
      font-weight: 700; color: var(--primary); padding: 0.35rem 0;
      border-top: 1px solid var(--border-light);
    }
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
  metodoSeleccionadoEsTarjeta = false;

  tabActiva: Tab = 'info';
  mostrarFormServicio = false;
  mostrarFormPago = false;
  mostrarFormProveedorRapido = false;
  editandoServicioId: number | null = null;
  proveedorRapido = { nombre_comercial: '', contacto: '', email: '' };

  tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'info', label: 'Info', icon: '📋' },
    { key: 'servicios', label: 'Servicios', icon: '🏨' },
    { key: 'deudas', label: 'Deudas', icon: '📊' },
    { key: 'pagos', label: 'Pagos', icon: '💳' },
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
    observaciones: '',
    // Tarjeta nueva (COBRO_CLIENTE)
    tarjeta_titular: '',
    tarjeta_numero: '',
    tarjeta_expiracion: '',
    // Tarjeta puente (PAGO_PROVEEDOR)
    id_tarjeta_cliente: null as number | null
  };

  private idReserva = 0;

  constructor(private api: ApiService, private route: ActivatedRoute, private reciboPdf: ReciboPdfService, private router: Router, private confirmSvc: ConfirmService) {}

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
      moneda: 'USD', precio_cliente: 0, costo_proveedor: 0,
      hotel_nombre: '', hotel_ciudad: '', hotel_check_in: '', hotel_check_out: '', hotel_regimen: '', hotel_noches: null, hotel_categoria: '',
      vuelo_aerolinea: '', vuelo_nro: '', vuelo_origen: '', vuelo_destino: '', vuelo_fecha_salida: '', vuelo_fecha_llegada: '', vuelo_clase: '', vuelo_codigo_reserva: '',
      asistencia_compania: '', asistencia_plan: '', asistencia_fecha_desde: '', asistencia_fecha_hasta: '', asistencia_cobertura: '',
      visa_pais: '', visa_tipo: '', visa_fecha_tramite: '', visa_nro_tramite: '',
      crucero_naviera: '', crucero_barco: '', crucero_itinerario: '', crucero_cabina: '', crucero_fecha_embarque: '', crucero_fecha_desembarque: ''
    };
  }

  gananciaServicio(): number {
    return (this.svcForm.precio_cliente || 0) - (this.svcForm.costo_proveedor || 0);
  }

  guardarServicio(): void {
    if (this.editandoServicioId) {
      // Mode: EDIT
      const { tipo_servicio, ...updateData } = this.svcForm;
      this.api.updateServicio(this.editandoServicioId, { tipo_servicio, ...updateData } as Partial<ServicioDetallado>).subscribe({
        next: () => {
          this.cancelarFormServicio();
          this.cargarTodo();
        }
      });
    } else {
      // Mode: CREATE
      this.api.crearServicio({ id_reserva: this.idReserva, ...this.svcForm } as Partial<ServicioDetallado>).subscribe({
        next: () => {
          this.cancelarFormServicio();
          this.cargarTodo();
        }
      });
    }
  }

  editarServicio(s: ServicioDetallado): void {
    this.editandoServicioId = s.id;
    this.mostrarFormServicio = true;
    this.svcForm = {
      tipo_servicio: s.tipo_servicio, descripcion: s.descripcion || '', id_proveedor: s.id_proveedor,
      moneda: s.moneda, precio_cliente: s.precio_cliente, costo_proveedor: s.costo_proveedor,
      hotel_nombre: s.hotel_nombre || '', hotel_ciudad: s.hotel_ciudad || '', hotel_check_in: s.hotel_check_in ? s.hotel_check_in.substring(0,10) : '', hotel_check_out: s.hotel_check_out ? s.hotel_check_out.substring(0,10) : '', hotel_regimen: s.hotel_regimen || '', hotel_noches: s.hotel_noches ?? null, hotel_categoria: s.hotel_categoria || '',
      vuelo_aerolinea: s.vuelo_aerolinea || '', vuelo_nro: s.vuelo_nro || '', vuelo_origen: s.vuelo_origen || '', vuelo_destino: s.vuelo_destino || '', vuelo_fecha_salida: s.vuelo_fecha_salida || '', vuelo_fecha_llegada: s.vuelo_fecha_llegada || '', vuelo_clase: s.vuelo_clase || '', vuelo_codigo_reserva: s.vuelo_codigo_reserva || '',
      asistencia_compania: s.asistencia_compania || '', asistencia_plan: s.asistencia_plan || '', asistencia_fecha_desde: s.asistencia_fecha_desde ? s.asistencia_fecha_desde.substring(0,10) : '', asistencia_fecha_hasta: s.asistencia_fecha_hasta ? s.asistencia_fecha_hasta.substring(0,10) : '', asistencia_cobertura: s.asistencia_cobertura || '',
      visa_pais: s.visa_pais || '', visa_tipo: s.visa_tipo || '', visa_fecha_tramite: s.visa_fecha_tramite ? s.visa_fecha_tramite.substring(0,10) : '', visa_nro_tramite: s.visa_nro_tramite || '',
      crucero_naviera: s.crucero_naviera || '', crucero_barco: s.crucero_barco || '', crucero_itinerario: s.crucero_itinerario || '', crucero_cabina: s.crucero_cabina || '', crucero_fecha_embarque: s.crucero_fecha_embarque ? s.crucero_fecha_embarque.substring(0,10) : '', crucero_fecha_desembarque: s.crucero_fecha_desembarque ? s.crucero_fecha_desembarque.substring(0,10) : ''
    };
  }

  async eliminarServicio(id: number): Promise<void> {
    const ok = await this.confirmSvc.confirm({
      title: 'Eliminar Servicio',
      message: '¿Eliminar este servicio? Se eliminarán también las deudas asociadas.',
      confirmText: 'Sí, eliminar',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteServicio(id).subscribe({
      next: () => { this.confirmSvc.toast('Servicio eliminado'); this.cargarTodo(); },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }

  cancelarFormServicio(): void {
    this.mostrarFormServicio = false;
    this.editandoServicioId = null;
    this.svcForm = this.resetSvcForm();
  }

  getNombreServicio(s: ServicioDetallado): string {
    switch (s.tipo_servicio) {
      case 'HOTEL': return s.hotel_nombre || 'Hotel';
      case 'VUELO': return [s.vuelo_aerolinea, s.vuelo_nro, s.vuelo_origen && s.vuelo_destino ? `${s.vuelo_origen} → ${s.vuelo_destino}` : ''].filter(Boolean).join(' ') || 'Vuelo';
      case 'ASISTENCIA': return [s.asistencia_compania, s.asistencia_plan].filter(Boolean).join(' — ') || 'Asistencia';
      case 'VISA': return s.visa_pais ? `Visa ${s.visa_pais}` : 'Visa';
      case 'CRUCERO': return [s.crucero_naviera, s.crucero_barco].filter(Boolean).join(' — ') || 'Crucero';
      default: return s.descripcion || s.tipo_servicio;
    }
  }

  crearProveedorRapido(): void {
    if (!this.proveedorRapido.nombre_comercial) return;
    this.api.crearProveedor(this.proveedorRapido as any).subscribe({
      next: (nuevo: any) => {
        this.api.getProveedores().subscribe({ next: (p) => this.proveedores = p });
        this.svcForm.id_proveedor = nuevo.id;
        this.mostrarFormProveedorRapido = false;
        this.proveedorRapido = { nombre_comercial: '', contacto: '', email: '' };
      }
    });
  }

  // Pagos
  onTipoPagoCambia(): void {
    this.pagoForm.id_deuda = null;
    this.pagoForm.id_tarjeta_cliente = null;
    this.pagoForm.tarjeta_titular = '';
    this.pagoForm.tarjeta_numero = '';
    this.pagoForm.tarjeta_expiracion = '';
    this.onMetodoPagoCambia();
  }

  onMetodoPagoCambia(): void {
    const metodo = this.metodosPago.find(m => m.id === this.pagoForm.metodo_pago_id);
    this.metodoSeleccionadoEsTarjeta = metodo?.tipo === 'TARJETA';
    // Si es PAGO_PROVEEDOR con tarjeta, cargar tarjetas disponibles
    if (this.metodoSeleccionadoEsTarjeta && this.pagoForm.tipo === 'PAGO_PROVEEDOR') {
      this.api.getTarjetasDisponibles().subscribe({
        next: (t) => this.tarjetasDisponibles = t
      });
    }
  }

  resetPagoForm(): void {
    this.pagoForm = {
      tipo: 'COBRO_CLIENTE', moneda: 'ARS', monto: 0, metodo_pago_id: null,
      id_deuda: null, observaciones: '',
      tarjeta_titular: '', tarjeta_numero: '', tarjeta_expiracion: '',
      id_tarjeta_cliente: null
    };
    this.metodoSeleccionadoEsTarjeta = false;
  }

  registrarPago(): void {
    if (!this.pagoForm.monto) return;

    const payload: any = {
      id_reserva: this.idReserva,
      id_deuda: this.pagoForm.id_deuda,
      id_cliente: this.reserva?.id_titular || null,
      tipo: this.pagoForm.tipo,
      moneda: this.pagoForm.moneda,
      monto: this.pagoForm.monto,
      metodo_pago_id: this.pagoForm.metodo_pago_id,
      observaciones: this.pagoForm.observaciones
    };

    // COBRO_CLIENTE con tarjeta nueva
    if (this.pagoForm.tipo === 'COBRO_CLIENTE' && this.metodoSeleccionadoEsTarjeta) {
      if (!this.pagoForm.tarjeta_numero || !this.pagoForm.tarjeta_titular) {
        this.confirmSvc.toast('Completá los datos de la tarjeta', 'error');
        return;
      }
      payload.tarjeta = {
        titular: this.pagoForm.tarjeta_titular,
        numero: this.pagoForm.tarjeta_numero.replace(/\s/g, ''),
        expiracion: this.pagoForm.tarjeta_expiracion
      };
    }

    // PAGO_PROVEEDOR con tarjeta-puente
    if (this.pagoForm.tipo === 'PAGO_PROVEEDOR' && this.metodoSeleccionadoEsTarjeta) {
      if (!this.pagoForm.id_tarjeta_cliente) {
        this.confirmSvc.toast('Seleccioná una tarjeta del listado', 'error');
        return;
      }
      payload.id_tarjeta_cliente = this.pagoForm.id_tarjeta_cliente;
    }

    this.api.registrarPago(payload).subscribe({
      next: () => {
        this.confirmSvc.toast('Pago registrado correctamente');
        this.mostrarFormPago = false;
        this.resetPagoForm();
        this.cargarTodo();
      },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al registrar pago', 'error')
    });
  }

  async anularPago(id: number): Promise<void> {
    const ok = await this.confirmSvc.confirm({
      title: 'Anular Pago',
      message: '¿Anular este pago? Se revertirá el monto en la deuda.',
      confirmText: 'Sí, anular',
      type: 'warning'
    });
    if (!ok) return;
    this.api.anularPago(id).subscribe({
      next: () => { this.confirmSvc.toast('Pago anulado correctamente'); this.cargarTodo(); },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al anular pago', 'error')
    });
  }

  async eliminarReserva(): Promise<void> {
    if (!this.reserva) return;
    const ok = await this.confirmSvc.confirm({
      title: 'Eliminar Reserva',
      message: `¿Eliminar la Reserva #${this.reserva.id}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteReserva(this.reserva.id).subscribe({
      next: () => { this.confirmSvc.toast('Reserva eliminada'); this.router.navigate(['/reservas']); },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }

  getNombreDeuda(d: DeudaClienteDetalle | DeudaProveedorAgrupada): string {
    const name = d.servicio_nombre || d.tipo_servicio || 'Servicio';
    if ('proveedor_nombre' in d && d.proveedor_nombre) return `${name} — ${d.proveedor_nombre}`;
    return name;
  }

  deudasParaPago(): (DeudaClienteDetalle | DeudaProveedorAgrupada)[] {
    return this.pagoForm.tipo === 'COBRO_CLIENTE' ? this.deudasCliente : this.deudasProveedores;
  }

  getDeudaId(d: DeudaClienteDetalle | DeudaProveedorAgrupada): number | null {
    return d.id;
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
