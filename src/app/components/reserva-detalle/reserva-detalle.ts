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

type Tab = 'info' | 'servicios' | 'deudas' | 'pagos' | 'archivos' | 'recibos' | 'tarjetas' | 'incidencias' | 'vouchers';

interface ServicioForm {
  tipo_servicio: string;
  descripcion: string;
  id_proveedor: number | null;
  moneda: string;
  precio_cliente: number;
  costo_proveedor: number;
  // Fechas de pago generales
  fecha_sena: string;
  fecha_saldar: string;
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
              <a [routerLink]="['/clientes/detalle', reserva.id_titular]" style="color: inherit; text-decoration: none;" class="fw-semibold text-primary-hover" title="Ver ficha del titular">{{ reserva.titular_nombre }}</a> → {{ reserva.destino_final || 'Sin destino' }}
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
                  <div class="col-md-6"><div class="info-label">TITULAR</div><div class="info-value"><a [routerLink]="['/clientes/detalle', reserva.id_titular]" style="color: var(--primary); text-decoration: none; font-weight: 600;" title="Ver ficha del cliente">{{ reserva.titular_nombre }}</a></div></div>
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
              <div class="glass-card-solid mb-3" style="max-height: 300px; overflow-y: auto;">
                <h5 class="section-title">👥 Pasajeros ({{ reserva.pasajeros?.length || 0 }})</h5>
                @for (p of reserva.pasajeros; track p.id) {
                  <div class="pasajero-item">
                    <a [routerLink]="['/clientes/detalle', p.id_cliente]" style="color: var(--text-primary); text-decoration: none;" title="Ver ficha del cliente">
                      <span class="fw-semibold">{{ p.nombre_completo }}</span>
                    </a>
                    @if (p.es_titular) { <span class="status-pill activa ms-1" style="font-size: 0.6rem;">TITULAR</span> }
                    <div style="font-size: 0.75rem; color: var(--text-muted);">{{ p.dni_pasaporte || 'Sin DNI' }}</div>
                  </div>
                }
              </div>

              <!-- Servicios resumen en Info -->
              @if (servicios.length > 0) {
                <div class="glass-card-solid">
                  <h5 class="section-title">📦 Servicios ({{ servicios.length }})</h5>
                  @for (s of servicios; track s.id) {
                    <div class="pasajero-item">
                      <div class="d-flex justify-content-between">
                        <span class="fw-semibold">{{ getNombreServicio(s) }}</span>
                        <span class="fw-bold" [ngClass]="'money-' + s.moneda.toLowerCase()" style="font-size:0.8rem;">{{ s.precio_cliente | number:'1.2-2' }} {{ s.moneda }}</span>
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-muted);">
                        {{ getDetalleServicio(s) }}
                      </div>
                    </div>
                  }
                </div>
              }
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

                <!-- Fechas de pago generales -->
                <div class="tipo-fields-label">💰 Fechas de Pago</div>
                <div class="row g-2">
                  <div class="col-md-3">
                    <label class="form-label-elite">Fecha de Seña</label>
                    <input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.fecha_sena" />
                  </div>
                  <div class="col-md-3">
                    <label class="form-label-elite">Fecha para Saldar</label>
                    <input type="date" class="form-control-elite w-100" [(ngModel)]="svcForm.fecha_saldar" />
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
                    <div class="col-md-2" style="position: relative;">
                      <label class="form-label-elite">Origen</label>
                      <input class="form-control-elite w-100"
                        [ngModel]="svcForm.vuelo_origen"
                        (ngModelChange)="svcForm.vuelo_origen = $event; buscarOrigen($event)"
                        placeholder="EZE, GRU..." />
                      @if (aeropuertosOrigen.length) {
                        <div class="iata-dropdown">
                          @for (a of aeropuertosOrigen; track a.codigo_iata) {
                            <div class="iata-item" (mousedown)="seleccionarOrigen(a)">
                              <span class="iata-code">{{ a.codigo_iata }}</span>
                              <span class="iata-city">{{ a.nombre_ciudad }}, {{ a.pais }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                    <div class="col-md-2" style="position: relative;">
                      <label class="form-label-elite">Destino</label>
                      <input class="form-control-elite w-100"
                        [ngModel]="svcForm.vuelo_destino"
                        (ngModelChange)="svcForm.vuelo_destino = $event; buscarDestino($event)"
                        placeholder="MIA, MAD..." />
                      @if (aeropuertosDest.length) {
                        <div class="iata-dropdown">
                          @for (a of aeropuertosDest; track a.codigo_iata) {
                            <div class="iata-item" (mousedown)="seleccionarDestino(a)">
                              <span class="iata-code">{{ a.codigo_iata }}</span>
                              <span class="iata-city">{{ a.nombre_ciudad }}, {{ a.pais }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
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
              <div class="glass-card-solid mb-3 servicio-card">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span class="status-pill abierto" style="font-size: 0.65rem;">{{ s.tipo_servicio }}</span>
                    <h6 class="mt-1 mb-0 fw-bold">{{ getNombreServicio(s) }}</h6>
                  </div>
                  <div class="d-flex gap-1">
                    <button class="btn-elite-outline" style="padding:0.2rem 0.5rem;font-size:0.7rem;" (click)="editarServicio(s)">✏️ Editar</button>
                    <button class="btn-elite-outline" style="padding:0.2rem 0.5rem;font-size:0.7rem;color:var(--danger);border-color:var(--danger);" (click)="eliminarServicio(s.id)">🗑️</button>
                  </div>
                </div>

                <!-- Datos específicos del tipo -->
                <div class="svc-detail-grid">

                  @if (s.tipo_servicio === 'HOTEL') {
                    <div class="svc-field">
                      <span class="svc-label">Hotel</span>
                      <span class="svc-value">{{ s.hotel_nombre || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Ciudad</span>
                      <span class="svc-value">{{ s.hotel_ciudad || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Check-in</span>
                      <span class="svc-value">{{ s.hotel_check_in ? formatDate(s.hotel_check_in) : '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Check-out</span>
                      <span class="svc-value">{{ s.hotel_check_out ? formatDate(s.hotel_check_out) : '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Noches</span>
                      <span class="svc-value">{{ s.hotel_noches || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Régimen</span>
                      <span class="svc-value">{{ s.hotel_regimen || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Categoría</span>
                      <span class="svc-value">{{ s.hotel_categoria ? s.hotel_categoria + '⭐' : '-' }}</span>
                    </div>
                  }

                  @if (s.tipo_servicio === 'VUELO') {
                    <div class="svc-field">
                      <span class="svc-label">Aerolínea</span>
                      <span class="svc-value">{{ s.vuelo_aerolinea || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Nro Vuelo</span>
                      <span class="svc-value">{{ s.vuelo_nro || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Origen</span>
                      <span class="svc-value">{{ s.vuelo_origen || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Destino</span>
                      <span class="svc-value">{{ s.vuelo_destino || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Fecha Salida</span>
                      <span class="svc-value">{{ s.vuelo_fecha_salida ? formatDateTime(s.vuelo_fecha_salida) : '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Fecha Llegada</span>
                      <span class="svc-value">{{ s.vuelo_fecha_llegada ? formatDateTime(s.vuelo_fecha_llegada) : '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Clase</span>
                      <span class="svc-value">{{ s.vuelo_clase || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Código Reserva</span>
                      <span class="svc-value">{{ s.vuelo_codigo_reserva || '-' }}</span>
                    </div>
                  }

                  @if (s.tipo_servicio === 'ASISTENCIA') {
                    <div class="svc-field">
                      <span class="svc-label">Compañía</span>
                      <span class="svc-value">{{ s.asistencia_compania || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Plan</span>
                      <span class="svc-value">{{ s.asistencia_plan || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Desde</span>
                      <span class="svc-value">{{ s.asistencia_fecha_desde ? formatDate(s.asistencia_fecha_desde) : '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Hasta</span>
                      <span class="svc-value">{{ s.asistencia_fecha_hasta ? formatDate(s.asistencia_fecha_hasta) : '-' }}</span>
                    </div>
                    <div class="svc-field" style="grid-column: span 2;">
                      <span class="svc-label">Cobertura</span>
                      <span class="svc-value">{{ s.asistencia_cobertura || '-' }}</span>
                    </div>
                  }

                  @if (s.tipo_servicio === 'VISA') {
                    <div class="svc-field">
                      <span class="svc-label">País</span>
                      <span class="svc-value">{{ s.visa_pais || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Tipo</span>
                      <span class="svc-value">{{ s.visa_tipo || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Fecha Trámite</span>
                      <span class="svc-value">{{ s.visa_fecha_tramite ? formatDate(s.visa_fecha_tramite) : '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Nro Trámite</span>
                      <span class="svc-value">{{ s.visa_nro_tramite || '-' }}</span>
                    </div>
                  }

                  @if (s.tipo_servicio === 'CRUCERO') {
                    <div class="svc-field">
                      <span class="svc-label">Naviera</span>
                      <span class="svc-value">{{ s.crucero_naviera || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Barco</span>
                      <span class="svc-value">{{ s.crucero_barco || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Cabina</span>
                      <span class="svc-value">{{ s.crucero_cabina || '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Embarque</span>
                      <span class="svc-value">{{ s.crucero_fecha_embarque ? formatDate(s.crucero_fecha_embarque) : '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">Desembarque</span>
                      <span class="svc-value">{{ s.crucero_fecha_desembarque ? formatDate(s.crucero_fecha_desembarque) : '-' }}</span>
                    </div>
                    <div class="svc-field" style="grid-column: span 2;">
                      <span class="svc-label">Itinerario</span>
                      <span class="svc-value">{{ s.crucero_itinerario || '-' }}</span>
                    </div>
                  }

                  @if (s.descripcion) {
                    <div class="svc-field" style="grid-column: 1 / -1;">
                      <span class="svc-label">Descripción</span>
                      <span class="svc-value">{{ s.descripcion }}</span>
                    </div>
                  }

                  @if (s.fecha_sena || s.fecha_saldar) {
                    <div class="svc-field">
                      <span class="svc-label">📅 Fecha Seña</span>
                      <span class="svc-value">{{ s.fecha_sena ? formatDate(s.fecha_sena) : '-' }}</span>
                    </div>
                    <div class="svc-field">
                      <span class="svc-label">📅 Fecha a Saldar</span>
                      <span class="svc-value">{{ s.fecha_saldar ? formatDate(s.fecha_saldar) : '-' }}</span>
                    </div>
                  }

                </div>

                <!-- Footer financiero -->
                <div class="svc-finance-bar">
                  <div class="svc-finance-item">
                    <span class="svc-label">Proveedor</span>
                    <span class="svc-value">{{ s.proveedor_nombre || 'Sin proveedor' }}</span>
                  </div>
                  <div class="svc-finance-item">
                    <span class="svc-label">Precio Cliente</span>
                    <span class="svc-value fw-bold" [ngClass]="'money-' + s.moneda.toLowerCase()">{{ s.precio_cliente | number:'1.2-2' }} {{ s.moneda }}</span>
                  </div>
                  <div class="svc-finance-item">
                    <span class="svc-label">Costo Proveedor</span>
                    <span class="svc-value fw-bold">{{ s.costo_proveedor | number:'1.2-2' }} {{ s.moneda }}</span>
                  </div>
                  <div class="svc-finance-item">
                    <span class="svc-label">Ganancia</span>
                    <span class="svc-value fw-bold" [style.color]="(s.precio_cliente - s.costo_proveedor) >= 0 ? 'var(--success)' : 'var(--danger)'">
                      {{ s.precio_cliente - s.costo_proveedor | number:'1.2-2' }} {{ s.moneda }}
                    </span>
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
            <div class="d-flex justify-content-between mb-3 align-items-center">
              <h5 class="section-title mb-0">💳 Pagos ({{ pagos.length }})</h5>
              <div class="d-flex gap-2">
                <button class="btn-elite-outline" (click)="mostrarSelectorDeudasPagoMultiple = true; mostrarFormPago = false; mostrarFormPagoMultiple = false;"><span>🧾 Pago Múltiple</span></button>
                <button class="btn-elite" (click)="mostrarFormPago = !mostrarFormPago; mostrarSelectorDeudasPagoMultiple = false; mostrarFormPagoMultiple = false;"><span>➕ Registrar Pago</span></button>
              </div>
            </div>

            @if (mostrarSelectorDeudasPagoMultiple) {
              <div class="glass-card-solid mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="fw-bold m-0 text-primary">Selecciona las deudas a cobrar en conjunto</h6>
                  <button class="btn-elite-outline btn-sm" (click)="mostrarSelectorDeudasPagoMultiple = false">Cancelar</button>
                </div>
                <div class="row g-3">
                  @for (d of deudasCliente; track d.id) {
                    @if (d.saldo > 0) {
                      <div class="col-md-6">
                        <div class="deuda-item d-flex justify-content-between align-items-center" style="border: 1px solid var(--border-light); padding: 0.75rem; border-radius: 8px;">
                          <div class="d-flex align-items-center gap-2">
                            <input type="checkbox" class="form-check-input" [checked]="deudasSeleccionadas.includes(d.id)" (change)="toggleDeudaSeleccionada(d.id)">
                            <div>
                              <span class="fw-semibold" style="font-size: 0.85rem;">{{ d.servicio_nombre || d.tipo_servicio }}</span>
                              <div style="font-size: 0.7rem; color: var(--text-muted);">{{ d.proveedor_nombre || '-' }}</div>
                            </div>
                          </div>
                          <div class="fw-bold text-end" [ngClass]="'money-' + d.moneda.toLowerCase()" style="font-size: 0.9rem;">
                            {{ d.saldo | number:'1.2-2' }} {{ d.moneda }}
                          </div>
                        </div>
                      </div>
                    }
                  } @empty {
                    <div class="text-muted p-3 text-center w-100">No hay deudas pendientes para realizar un cobro múltiple.</div>
                  }
                </div>
                <div class="text-end mt-4">
                  <button class="btn-elite" [disabled]="deudasSeleccionadas.length === 0" (click)="iniciarPagoMultiple()">
                    Siguiente ({{ deudasSeleccionadas.length }} servicios seleccionados)
                  </button>
                </div>
              </div>
            }

            @if (mostrarFormPagoMultiple) {
              <div class="glass-card-solid mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="fw-bold m-0">🧾 Pago Múltiple — {{ pagosMultiplesList.length }} cobros</h6>
                  <button class="btn-elite-outline" (click)="cancelarPagoMultiple()">Cancelar</button>
                </div>

                @for (p of pagosMultiplesList; track p.deuda.id; let i = $index) {
                  <div style="border: 1px solid var(--border-light); padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                    <h6 class="fw-bold mb-3">Cobro #{{ i + 1 }}: {{ p.deuda.servicio_nombre || p.deuda.tipo_servicio }} — <span class="status-pill status-activa" style="font-size: 0.7rem;">Saldo: {{ p.deuda.saldo | number:'1.2-2' }} {{ p.deuda.moneda }}</span></h6>
                    <div class="row g-3">
                      <div class="col-md-3">
                        <label class="form-label-elite">Tipo *</label>
                        <select class="form-select-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.tipo" disabled>
                          <option value="COBRO_CLIENTE">Cobro Cliente</option>
                        </select>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label-elite">Moneda *</label>
                        <select class="form-select-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.moneda" (change)="cargarMetodosPago()">
                          <option value="ARS">ARS</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label-elite">Monto *</label>
                        <input type="number" step="0.01" class="form-control-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.monto" />
                      </div>
                      <div class="col-md-3">
                        <label class="form-label-elite">Método Pago</label>
                        <select class="form-select-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.metodo_pago_id" (change)="onMetodoPagoCambiaMultiple(i)">
                          <option [ngValue]="null">Seleccionar...</option>
                          @for (m of metodosPago; track m.id) {
                            <option [ngValue]="m.id">{{ m.nombre }}</option>
                          }
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label-elite">Deuda a aplicar</label>
                        <select class="form-select-elite w-100" [ngModel]="pagosMultiplesList[i].request.id_deuda" disabled>
                          <option [ngValue]="p.deuda.id">{{ p.deuda.servicio_nombre || p.deuda.tipo_servicio }} — Saldo: {{ p.deuda.saldo | number:'1.2-2' }} {{ p.deuda.moneda }}</option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label-elite">Observaciones</label>
                        <input class="form-control-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.observaciones" />
                      </div>
                    </div>

                    <!-- TARJETA NUEVA: COBRO_CLIENTE con método TARJETA -->
                    @if (pagosMultiplesList[i].esTarjeta) {
                      <div class="tipo-fields-label">💳 Datos de Tarjeta del Cliente</div>
                      <div class="row g-3">
                        <div class="col-md-4">
                          <label class="form-label-elite">Titular *</label>
                          <input class="form-control-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.tarjeta_titular" placeholder="Nombre del titular" />
                        </div>
                        <div class="col-md-4">
                          <label class="form-label-elite">Número de Tarjeta *</label>
                          <input class="form-control-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.tarjeta_numero" placeholder="4507 9912 3456 7890" maxlength="19" (input)="detectarBancoFrontendMultiple(i)" />
                          @if (pagosMultiplesList[i].bancoDetectado) {
                            <small style="color: var(--primary); font-size: 0.7rem; font-weight: 600;">🏦 {{ pagosMultiplesList[i].bancoDetectado }}</small>
                          }
                        </div>
                        <div class="col-md-4">
                          <label class="form-label-elite">Expiración</label>
                          <input class="form-control-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.tarjeta_expiracion" placeholder="MM/YY" maxlength="5" />
                        </div>
                        <div class="col-md-4">
                          <label class="form-label-elite">Cuotas</label>
                          <select class="form-select-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.tarjeta_cuotas" (change)="calcularMontoConInteresMultiple(i)">
                            <option [ngValue]="1">1 cuota (sin interés)</option>
                            <option [ngValue]="3">3 cuotas</option>
                            <option [ngValue]="6">6 cuotas</option>
                            <option [ngValue]="9">9 cuotas</option>
                            <option [ngValue]="12">12 cuotas</option>
                            <option [ngValue]="18">18 cuotas</option>
                          </select>
                        </div>
                        <div class="col-md-4">
                          <label class="form-label-elite">Interés (%)</label>
                          <input type="number" step="0.01" min="0" class="form-control-elite w-100" [(ngModel)]="pagosMultiplesList[i].request.tarjeta_interes" (input)="calcularMontoConInteresMultiple(i)" placeholder="0" />
                        </div>
                        <div class="col-md-4">
                          @if (pagosMultiplesList[i].request.tarjeta_cuotas > 1 && pagosMultiplesList[i].request.tarjeta_interes > 0) {
                            <label class="form-label-elite">Monto Total c/Interés</label>
                            <div style="padding: 0.5rem; background: rgba(var(--primary-rgb),0.1); border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
                              {{ pagosMultiplesList[i].montoConInteres | number:'1.2-2' }} {{ pagosMultiplesList[i].request.moneda }}
                              <small style="display:block; font-weight:400; font-size:0.7rem; color: var(--text-muted);">
                                {{ pagosMultiplesList[i].request.tarjeta_cuotas }} cuotas de {{ pagosMultiplesList[i].montoConInteres / pagosMultiplesList[i].request.tarjeta_cuotas | number:'1.2-2' }}
                              </small>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                <div class="d-flex gap-2 mt-3">
                  <button class="btn-success-elite" (click)="confirmarPagosMultiples()"><span>Registrar Todos</span></button>
                  <button class="btn-elite-outline" (click)="cancelarPagoMultiple()">Cancelar</button>
                </div>
              </div>
            }

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
                    <select class="form-select-elite w-100" [(ngModel)]="pagoForm.id_deuda" (change)="onDeudaCambia()">
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
                      <input class="form-control-elite w-100" [(ngModel)]="pagoForm.tarjeta_numero" placeholder="4507 9912 3456 7890" maxlength="19" (input)="detectarBancoFrontend()" />
                      @if (bancoDetectado) {
                        <small style="color: var(--primary); font-size: 0.7rem; font-weight: 600;">🏦 {{ bancoDetectado }}</small>
                      }
                    </div>
                    <div class="col-md-4">
                      <label class="form-label-elite">Expiración</label>
                      <input class="form-control-elite w-100" [(ngModel)]="pagoForm.tarjeta_expiracion" placeholder="MM/YY" maxlength="5" />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label-elite">Cuotas</label>
                      <select class="form-select-elite w-100" [(ngModel)]="pagoForm.tarjeta_cuotas" (change)="calcularMontoConInteres()">
                        <option [ngValue]="1">1 cuota (sin interés)</option>
                        <option [ngValue]="3">3 cuotas</option>
                        <option [ngValue]="6">6 cuotas</option>
                        <option [ngValue]="9">9 cuotas</option>
                        <option [ngValue]="12">12 cuotas</option>
                        <option [ngValue]="18">18 cuotas</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label-elite">Interés (%)</label>
                      <input type="number" step="0.01" min="0" class="form-control-elite w-100" [(ngModel)]="pagoForm.tarjeta_interes" (input)="calcularMontoConInteres()" placeholder="0" />
                    </div>
                    <div class="col-md-4">
                      @if (pagoForm.tarjeta_cuotas > 1 && pagoForm.tarjeta_interes > 0) {
                        <label class="form-label-elite">Monto Total c/Interés</label>
                        <div style="padding: 0.5rem; background: rgba(var(--primary-rgb),0.1); border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
                          {{ montoConInteres | number:'1.2-2' }} {{ pagoForm.moneda }}
                          <small style="display:block; font-weight:400; font-size:0.7rem; color: var(--text-muted);">
                            {{ pagoForm.tarjeta_cuotas }} cuotas de {{ montoConInteres / pagoForm.tarjeta_cuotas | number:'1.2-2' }}
                          </small>
                        </div>
                      }
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
                          <option [ngValue]="t.id">
                            {{ t.banco_detectado }} — {{ t.numero_mask }} — {{ t.titular }} — Disp: {{ t.monto_disponible | number:'1.2-2' }} {{ t.moneda }}
                            {{ t.id_proveedor_vinculado ? ' 🔗 ' + t.proveedor_vinculado_nombre : ' 🆕 Sin vincular' }}
                          </option>
                        }
                      </select>
                      @if (tarjetasDisponibles.length === 0 && proveedorDeDeudaSeleccionada) {
                        <small style="color: var(--warning); font-size: 0.75rem;">⚠️ No hay tarjetas vinculadas a este proveedor ni tarjetas libres. Primero registre un cobro al cliente con tarjeta.</small>
                      } @else if (tarjetasDisponibles.length === 0) {
                        <small style="color: var(--warning); font-size: 0.75rem;">⚠️ No hay tarjetas disponibles. Primero registre un cobro al cliente con tarjeta.</small>
                      } @else if (proveedorDeDeudaSeleccionada) {
                        <small style="color: var(--text-muted); font-size: 0.7rem;">ℹ️ Mostrando solo tarjetas vinculadas a este proveedor o sin vincular. El saldo a favor queda exclusivo para este proveedor.</small>
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
            <div class="glass-card-solid" style="padding: 0;">
              <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table class="table-premium" style="min-width: 580px;">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Moneda</th><th>Monto</th><th>Método</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  @for (p of pagos; track p.id) {
                    <tr [class.anulado]="p.anulado">
                      <td>{{ formatDate(p.fecha) }}</td>
                      <td><span class="status-pill" [ngClass]="p.tipo === 'COBRO_CLIENTE' ? 'activa' : 'consumida'">{{ p.tipo }}</span></td>
                      <td>{{ p.moneda }}</td>
                      <td class="fw-bold" [ngClass]="'money-' + p.moneda.toLowerCase()">{{ p.monto | number:'1.2-2' }}</td>
                      <td>
                        {{ p.metodo_nombre || '-' }}
                        @if (p.tarjeta_mask) {
                          <br><small style="color: var(--text-muted); font-size: 0.7rem;">{{ p.banco_detectado }} {{ p.tarjeta_mask }}</small>
                        }
                      </td>
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

        <!-- TAB: TARJETAS PUENTE -->
        @if (tabActiva === 'tarjetas') {
          <div class="animate-fadeInUp">
            <div class="d-flex justify-content-between mb-3">
              <h5 class="section-title">💳 Tarjetas con Saldo Disponible ({{ reserva.tarjetas?.length || 0 }})</h5>
              <small class="text-muted" style="font-size: 0.75rem;">Todas las tarjetas registradas en su agencia listas para usarse.</small>
            </div>

            @for (t of reserva.tarjetas; track t.id) {
              <div class="glass-card-solid mb-2" style="padding: 1rem;">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <div class="fw-bold" style="font-size: 1.1rem; letter-spacing: 0.05em;">
                      {{ t.banco_detectado }} •••• {{ t.numero_mask }}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                      Titular: {{ t.titular }} &nbsp;|&nbsp; Expira: {{ t.expiracion }}
                    </div>
                    <div class="mt-1">
                      @if (t.proveedor_vinculado_nombre) {
                        <span class="status-pill status-activa" style="background: rgba(var(--primary-rgb), 0.15); color: var(--primary);">
                          Vinculada a Proveedor: {{ t.proveedor_vinculado_nombre }}
                        </span>
                      } @else {
                        <span class="status-pill text-muted">Aún sin proveedor vinculado</span>
                      }
                    </div>
                  </div>
                  <div class="text-end">
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Saldo Actual</div>
                    <div class="fw-bold" [ngClass]="'money-' + t.moneda.toLowerCase()" style="font-size: 1.25rem;">
                      {{ t.monto_disponible | number:'1.2-2' }} {{ t.moneda }}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">
                      Original: {{ t.monto_original | number:'1.2-2' }} {{ t.moneda }}
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="glass-card-solid" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                Tu agencia actualmente no cuenta con tarjetas puente con saldo a favor.
              </div>
            }
          </div>
        }

        @if (tabActiva === 'incidencias') {
          <div class="animate-fadeInUp">
            <div class="d-flex justify-content-between mb-3 align-items-center">
              <h5 class="section-title mb-0">⚠️ Incidencias ({{ incidencias.length }})</h5>
              <button class="btn-elite" (click)="mostrarFormIncidencia = !mostrarFormIncidencia">
                <span>➕ Nueva Incidencia</span>
              </button>
            </div>

            @if (mostrarFormIncidencia) {
              <div class="glass-card-solid mb-3">
                <div class="row g-3">
                  <div class="col-md-8">
                    <label class="form-label-elite">Descripción *</label>
                    <textarea class="form-control-elite w-100" [(ngModel)]="incidenciaForm.descripcion"
                      rows="2" placeholder="Ej: Vuelo cancelado, cliente notificado..."></textarea>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-elite">Estado</label>
                    <select class="form-select-elite w-100" [(ngModel)]="incidenciaForm.estado_gestion">
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_GESTION">En gestión</option>
                      <option value="RESUELTO">Resuelto</option>
                    </select>
                  </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn-elite" (click)="guardarIncidencia()"><span>Guardar</span></button>
                  <button class="btn-elite-outline" (click)="mostrarFormIncidencia = false">Cancelar</button>
                </div>
              </div>
            }

            @for (inc of incidencias; track inc.id) {
              <div class="glass-card-solid mb-2" style="padding: 1rem;">
                <div class="d-flex justify-content-between align-items-start">
                  <div style="flex: 1;">
                    <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">
                      {{ inc.descripcion }}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                      {{ inc.fecha_incidencia | date:'dd/MM/yyyy HH:mm':'UTC' }}
                    </div>
                  </div>
                  <div class="d-flex gap-2 align-items-center">
                    <span class="status-pill"
                      [ngClass]="{
                        'consumida': inc.estado_gestion === 'PENDIENTE',
                        'abierto':   inc.estado_gestion === 'EN_GESTION',
                        'activa':    inc.estado_gestion === 'RESUELTO'
                      }">
                      {{ inc.estado_gestion }}
                    </span>
                    <button class="btn-danger-elite"
                      style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"
                      (click)="eliminarIncidencia(inc.id)">🗑️</button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="glass-card-solid" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                Sin incidencias registradas
              </div>
            }
          </div>
        }

        @if (tabActiva === 'vouchers') {
          <div class="animate-fadeInUp">
            <div class="d-flex justify-content-between mb-3 align-items-center">
              <h5 class="section-title mb-0">🎫 Vouchers y Servicios Locales</h5>
              <button class="btn-elite" (click)="mostrarFormItem = !mostrarFormItem; editandoItemId = null; resetItemForm()">
                <span>➕ Agregar</span>
              </button>
            </div>

            @if (mostrarFormItem) {
              <div class="glass-card-solid mb-3">
                <h6 class="fw-bold mb-3">{{ editandoItemId ? 'Editar' : 'Nuevo' }} Voucher</h6>
                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label-elite">Tipo *</label>
                    <select class="form-select-elite w-100" [(ngModel)]="itemForm.tipo_item">
                      <option value="EXCURSION">Excursión</option>
                      <option value="TRASLADO">Traslado</option>
                      <option value="SEGURO">Seguro / Póliza</option>
                      <option value="TREN">Tren</option>
                      <option value="BUS">Bus</option>
                      <option value="TOUR">Tour</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div class="col-md-5">
                    <label class="form-label-elite">Nombre / Descripción *</label>
                    <input class="form-control-elite w-100" [(ngModel)]="itemForm.nombre_item"
                      placeholder="Ej: City Tour Buenos Aires" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-elite">Fecha del Servicio</label>
                    <input type="date" class="form-control-elite w-100" [(ngModel)]="itemForm.fecha_servicio" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-elite">Nro Póliza / Voucher</label>
                    <input class="form-control-elite w-100" [(ngModel)]="itemForm.nro_poliza_o_voucher"
                      placeholder="Ej: VCH-2025-001" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-elite">Proveedor Local</label>
                    <input class="form-control-elite w-100" [(ngModel)]="itemForm.proveedor_local"
                      placeholder="Nombre del operador local" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-elite">Contacto Local</label>
                    <input class="form-control-elite w-100" [(ngModel)]="itemForm.contacto_local_nombre"
                      placeholder="Nombre del contacto" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-elite">Teléfono de Soporte</label>
                    <input class="form-control-elite w-100" [(ngModel)]="itemForm.telefono_soporte"
                      placeholder="+54 9 11 ..." />
                  </div>
                  <div class="col-12">
                    <label class="form-label-elite">Detalles adicionales</label>
                    <textarea class="form-control-elite w-100" [(ngModel)]="itemForm.detalles_servicio"
                      rows="2" placeholder="Punto de encuentro, instrucciones, observaciones..."></textarea>
                  </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn-elite" (click)="guardarItem()">
                    <span>💾 {{ editandoItemId ? 'Actualizar' : 'Guardar' }}</span>
                  </button>
                  <button class="btn-elite-outline" (click)="resetItemForm()">Cancelar</button>
                </div>
              </div>
            }

            @for (item of items; track item.id) {
              <div class="glass-card-solid mb-2">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span class="status-pill abierto" style="font-size: 0.65rem;">{{ item.tipo_item }}</span>
                    <span class="fw-bold ms-2" style="font-size: 0.95rem;">{{ item.nombre_item }}</span>
                  </div>
                  <div class="d-flex gap-1">
                    <button class="btn-elite-outline" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"
                      (click)="editarItem(item)">✏️</button>
                    <button class="btn-danger-elite" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;"
                      (click)="eliminarItem(item.id)">🗑️</button>
                  </div>
                </div>

                <div class="svc-detail-grid">
                  @if (item.fecha_servicio) {
                    <div class="svc-field">
                      <span class="svc-label">Fecha</span>
                      <span class="svc-value">{{ item.fecha_servicio | date:'dd/MM/yyyy':'UTC' }}</span>
                    </div>
                  }
                  @if (item.nro_poliza_o_voucher) {
                    <div class="svc-field">
                      <span class="svc-label">Nro Voucher / Póliza</span>
                      <span class="svc-value fw-bold">{{ item.nro_poliza_o_voucher }}</span>
                    </div>
                  }
                  @if (item.proveedor_local) {
                    <div class="svc-field">
                      <span class="svc-label">Proveedor Local</span>
                      <span class="svc-value">{{ item.proveedor_local }}</span>
                    </div>
                  }
                  @if (item.contacto_local_nombre) {
                    <div class="svc-field">
                      <span class="svc-label">Contacto</span>
                      <span class="svc-value">{{ item.contacto_local_nombre }}</span>
                    </div>
                  }
                  @if (item.telefono_soporte) {
                    <div class="svc-field">
                      <span class="svc-label">Tel. Soporte</span>
                      <span class="svc-value">{{ item.telefono_soporte }}</span>
                    </div>
                  }
                  @if (item.detalles_servicio) {
                    <div class="svc-field" style="grid-column: 1 / -1;">
                      <span class="svc-label">Detalles</span>
                      <span class="svc-value">{{ item.detalles_servicio }}</span>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div class="glass-card-solid" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                Sin vouchers ni servicios locales registrados
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .iata-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
      background: var(--bg-card); border: 1px solid var(--border-light);
      border-radius: 10px; box-shadow: var(--shadow-float);
      max-height: 200px; overflow-y: auto; margin-top: 2px;
    }
    .iata-item {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.82rem;
      transition: background 0.15s;
    }
    .iata-item:hover { background: var(--bg-secondary); }
    .iata-code {
      font-weight: 700; color: var(--primary);
      min-width: 36px; font-size: 0.8rem;
    }
    .iata-city { color: var(--text-secondary); font-size: 0.78rem; }
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
    .svc-detail-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem 1rem;
      padding: 0.75rem 0;
      border-top: 1px solid var(--border-light);
      border-bottom: 1px solid var(--border-light);
    }
    @media (max-width: 768px) {
      .svc-detail-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .svc-field {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .svc-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .svc-value {
      font-size: 0.82rem;
      color: var(--text-primary);
    }
    .svc-finance-bar {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding-top: 0.6rem;
      margin-top: 0.25rem;
    }
    .svc-finance-item {
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
    }
  `]
})
export class ReservaDetalleComponent implements OnInit {
  // --- PAGOS MULTIPLES ---
  deudasSeleccionadas: number[] = [];
  mostrarFormPagoMultiple = false;
  mostrarSelectorDeudasPagoMultiple = false;
  pagosMultiplesList: { deuda: DeudaClienteDetalle, request: any, esTarjeta: boolean, bancoDetectado: string, montoConInteres: number }[] = [];
  // -----------------------

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
  bancoDetectado = '';
  montoConInteres = 0;

  incidencias: any[] = [];
  incidenciaForm = {
    descripcion: '',
    estado_gestion: 'PENDIENTE'
  };
  mostrarFormIncidencia = false;

  items: any[] = [];
  mostrarFormItem = false;
  editandoItemId: number | null = null;

  itemForm = {
    tipo_item: 'EXCURSION',
    nombre_item: '',
    detalles_servicio: '',
    fecha_servicio: '',
    proveedor_local: '',
    nro_poliza_o_voucher: '',
    telefono_soporte: '',
    contacto_local_nombre: ''
  };

  aeropuertosOrigen: any[] = [];
  aeropuertosDest: any[] = [];

  buscarOrigen(q: string): void {
    if (q.length < 2) { this.aeropuertosOrigen = []; return; }
    this.api.buscarAeropuertos(q).subscribe({ next: (r) => this.aeropuertosOrigen = r });
  }

  buscarDestino(q: string): void {
    if (q.length < 2) { this.aeropuertosDest = []; return; }
    this.api.buscarAeropuertos(q).subscribe({ next: (r) => this.aeropuertosDest = r });
  }

  seleccionarOrigen(a: any): void {
    this.svcForm.vuelo_origen = a.codigo_iata;
    this.aeropuertosOrigen = [];
  }

  seleccionarDestino(a: any): void {
    this.svcForm.vuelo_destino = a.codigo_iata;
    this.aeropuertosDest = [];
  }

  tabActiva: Tab = 'info';
  mostrarFormServicio = false;
  mostrarFormPago = false;
  mostrarFormProveedorRapido = false;
  editandoServicioId: number | null = null;
  proveedorRapido = { nombre_comercial: '', contacto: '', email: '' };

  get tabs(): { key: Tab; label: string; icon: string }[] {
    return [
      { key: 'info',      label: 'Info',      icon: '📋' },
      { key: 'servicios', label: `Servicios${this.servicios.length ? ' (' + this.servicios.length + ')' : ''}`, icon: '🏨' },
      { key: 'deudas',    label: 'Deudas',    icon: '📊' },
      { key: 'pagos',     label: `Pagos${this.pagos.length ? ' (' + this.pagos.length + ')' : ''}`, icon: '💸' },
      { key: 'archivos',  label: `Archivos${this.reserva?.archivos?.length ? ' (' + this.reserva.archivos.length + ')' : ''}`, icon: '📎' },
      { key: 'recibos',   label: `Recibos${this.recibos.length ? ' (' + this.recibos.length + ')' : ''}`, icon: '🧾' },
      { key: 'tarjetas',  label: 'Tarjetas',  icon: '💳' },
      { key: 'incidencias', label: `Incidencias${this.incidencias.length ? ' (' + this.incidencias.length + ')' : ''}`, icon: '⚠️' },
      { key: 'vouchers', label: `Vouchers${this.items.length ? ' (' + this.items.length + ')' : ''}`, icon: '🎫' }
    ];
  }

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
    tarjeta_cuotas: 1,
    tarjeta_interes: 0,
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
    this.api.getIncidenciasReserva(this.idReserva).subscribe({ next: (i) => this.incidencias = i });
    this.api.getItemsReserva(this.idReserva).subscribe({ next: (i) => this.items = i });
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
      fecha_sena: '', fecha_saldar: '',
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
    // Asegurar que los campos numéricos sean numbers
    const formData = {
      ...this.svcForm,
      precio_cliente: Number(this.svcForm.precio_cliente) || 0,
      costo_proveedor: Number(this.svcForm.costo_proveedor) || 0,
      hotel_noches: this.svcForm.hotel_noches ? Number(this.svcForm.hotel_noches) : null
    };

    if (this.editandoServicioId) {
      // Mode: EDIT
      this.api.updateServicio(this.editandoServicioId, formData as Partial<ServicioDetallado>).subscribe({
        next: () => {
          this.cancelarFormServicio();
          this.cargarTodo();
        },
        error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al actualizar servicio', 'error')
      });
    } else {
      // Mode: CREATE
      this.api.crearServicio({ id_reserva: this.idReserva, ...formData } as Partial<ServicioDetallado>).subscribe({
        next: () => {
          this.cancelarFormServicio();
          this.cargarTodo();
        },
        error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al crear servicio', 'error')
      });
    }
  }

  editarServicio(s: ServicioDetallado): void {
    this.editandoServicioId = s.id;
    this.mostrarFormServicio = true;
    this.svcForm = {
      tipo_servicio: s.tipo_servicio, descripcion: s.descripcion || '', id_proveedor: s.id_proveedor,
      moneda: s.moneda, precio_cliente: s.precio_cliente, costo_proveedor: s.costo_proveedor,
      fecha_sena: s.fecha_sena ? s.fecha_sena.substring(0,10) : '', fecha_saldar: s.fecha_saldar ? s.fecha_saldar.substring(0,10) : '',
      hotel_nombre: s.hotel_nombre || '', hotel_ciudad: s.hotel_ciudad || '', hotel_check_in: s.hotel_check_in ? s.hotel_check_in.substring(0,10) : '', hotel_check_out: s.hotel_check_out ? s.hotel_check_out.substring(0,10) : '', hotel_regimen: s.hotel_regimen || '', hotel_noches: s.hotel_noches ?? null, hotel_categoria: s.hotel_categoria || '',
      vuelo_aerolinea: s.vuelo_aerolinea || '', vuelo_nro: s.vuelo_nro || '', vuelo_origen: s.vuelo_origen || '', vuelo_destino: s.vuelo_destino || '', vuelo_fecha_salida: s.vuelo_fecha_salida ? this.toDatetimeLocal(s.vuelo_fecha_salida) : '', vuelo_fecha_llegada: s.vuelo_fecha_llegada ? this.toDatetimeLocal(s.vuelo_fecha_llegada) : '', vuelo_clase: s.vuelo_clase || '', vuelo_codigo_reserva: s.vuelo_codigo_reserva || '',
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

  getDetalleServicio(s: ServicioDetallado): string {
    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    const fmtDt = (d: string | null) => {
      if (!d) return '';
      const dt = new Date(d);
      return `${dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    };
    const parts: string[] = [];
    switch (s.tipo_servicio) {
      case 'HOTEL':
        if (s.hotel_ciudad) parts.push(s.hotel_ciudad);
        if (s.hotel_check_in || s.hotel_check_out) parts.push(`${fmt(s.hotel_check_in)} → ${fmt(s.hotel_check_out)}`);
        if (s.hotel_noches) parts.push(`${s.hotel_noches} noches`);
        if (s.hotel_regimen) parts.push(s.hotel_regimen);
        if (s.hotel_categoria) parts.push(`${s.hotel_categoria}⭐`);
        break;
      case 'VUELO':
        if (s.vuelo_origen && s.vuelo_destino) parts.push(`${s.vuelo_origen} → ${s.vuelo_destino}`);
        if (s.vuelo_fecha_salida) parts.push(`Salida: ${fmtDt(s.vuelo_fecha_salida)}`);
        if (s.vuelo_fecha_llegada) parts.push(`Llegada: ${fmtDt(s.vuelo_fecha_llegada)}`);
        if (s.vuelo_clase) parts.push(s.vuelo_clase);
        if (s.vuelo_codigo_reserva) parts.push(`Código: ${s.vuelo_codigo_reserva}`);
        break;
      case 'ASISTENCIA':
        if (s.asistencia_fecha_desde || s.asistencia_fecha_hasta) parts.push(`${fmt(s.asistencia_fecha_desde)} → ${fmt(s.asistencia_fecha_hasta)}`);
        if (s.asistencia_cobertura) parts.push(s.asistencia_cobertura);
        break;
      case 'VISA':
        if (s.visa_tipo) parts.push(s.visa_tipo);
        if (s.visa_fecha_tramite) parts.push(`Trámite: ${fmt(s.visa_fecha_tramite)}`);
        if (s.visa_nro_tramite) parts.push(`Nro: ${s.visa_nro_tramite}`);
        break;
      case 'CRUCERO':
        if (s.crucero_itinerario) parts.push(s.crucero_itinerario);
        if (s.crucero_cabina) parts.push(`Cabina: ${s.crucero_cabina}`);
        if (s.crucero_fecha_embarque || s.crucero_fecha_desembarque) parts.push(`${fmt(s.crucero_fecha_embarque)} → ${fmt(s.crucero_fecha_desembarque)}`);
        break;
    }
    if (s.descripcion && !parts.length) parts.push(s.descripcion);
    return parts.join(' · ') || s.descripcion || '';
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
    this.pagoForm.tarjeta_cuotas = 1;
    this.pagoForm.tarjeta_interes = 0;
    this.bancoDetectado = '';
    this.montoConInteres = 0;
    this.onMetodoPagoCambia();
  }

  proveedorDeDeudaSeleccionada: number | null = null;

  onMetodoPagoCambia(): void {
    const metodo = this.metodosPago.find(m => m.id === this.pagoForm.metodo_pago_id);
    this.metodoSeleccionadoEsTarjeta = metodo?.tipo === 'TARJETA';
    // Si es PAGO_PROVEEDOR con tarjeta, cargar tarjetas filtradas por proveedor
    if (this.metodoSeleccionadoEsTarjeta && this.pagoForm.tipo === 'PAGO_PROVEEDOR') {
      this.cargarTarjetasFiltradas();
    }
  }

  onDeudaCambia(): void {
    // Extraer proveedor de la deuda seleccionada
    this.proveedorDeDeudaSeleccionada = null;
    if (this.pagoForm.id_deuda && this.pagoForm.tipo === 'PAGO_PROVEEDOR') {
      const deuda = this.deudasProveedores.find(d => d.id === this.pagoForm.id_deuda);
      if (deuda?.id_proveedor) {
        this.proveedorDeDeudaSeleccionada = deuda.id_proveedor;
      }
    }
    // Recargar tarjetas si el método es tarjeta
    if (this.metodoSeleccionadoEsTarjeta && this.pagoForm.tipo === 'PAGO_PROVEEDOR') {
      this.pagoForm.id_tarjeta_cliente = null;
      this.cargarTarjetasFiltradas();
    }
  }

  private cargarTarjetasFiltradas(): void {
    if (this.proveedorDeDeudaSeleccionada) {
      this.api.getTarjetasDisponiblesPorProveedor(this.proveedorDeDeudaSeleccionada).subscribe({
        next: (t) => this.tarjetasDisponibles = t
      });
    } else {
      this.api.getTarjetasDisponibles().subscribe({
        next: (t) => this.tarjetasDisponibles = t
      });
    }
  }

  // --- MÉTODOS PAGO MÚLTIPLE ---
  toggleDeudaSeleccionada(idDeuda: number): void {
    const idx = this.deudasSeleccionadas.indexOf(idDeuda);
    if (idx > -1) {
      this.deudasSeleccionadas.splice(idx, 1);
    } else {
      this.deudasSeleccionadas.push(idDeuda);
    }
  }

  iniciarPagoMultiple(): void {
    if (this.deudasSeleccionadas.length === 0) return;
    this.mostrarSelectorDeudasPagoMultiple = false;
    this.pagosMultiplesList = [];
    
    for (const idDeuda of this.deudasSeleccionadas) {
      const deuda = this.deudasCliente.find(d => d.id === idDeuda);
      if (deuda) {
        this.pagosMultiplesList.push({
          deuda,
          request: {
            tipo: 'COBRO_CLIENTE', 
            moneda: deuda.moneda, 
            monto: deuda.saldo || 0,
            metodo_pago_id: null,
            id_deuda: deuda.id, 
            id_servicio: deuda.id_servicio,
            id_reserva: this.reserva!.id,
            id_cliente: this.reserva!.id_titular,
            observaciones: '',
            tarjeta_titular: '', tarjeta_numero: '', tarjeta_expiracion: '',
            tarjeta_cuotas: 1, tarjeta_interes: 0,
            id_tarjeta_cliente: null
          } as any,
          esTarjeta: false,
          bancoDetectado: '',
          montoConInteres: 0
        });
      }
    }
    this.mostrarFormPagoMultiple = true;
  }

  cancelarPagoMultiple(): void {
    this.mostrarFormPagoMultiple = false;
    this.mostrarSelectorDeudasPagoMultiple = false;
    this.pagosMultiplesList = [];
    this.deudasSeleccionadas = [];
  }

  onMetodoPagoCambiaMultiple(idx: number): void {
    const p = this.pagosMultiplesList[idx];
    const m = this.metodosPago.find(x => x.id === Number(p.request.metodo_pago_id));
    p.esTarjeta = m?.tipo === 'TARJETA';
  }

  detectarBancoFrontendMultiple(idx: number): void {
    const p = this.pagosMultiplesList[idx];
    const num = (p.request.tarjeta_numero || '').replace(/\s/g, '');
    if (num.length < 6) { p.bancoDetectado = ''; return; }
    const bin = num.substring(0, 6);
    if (num.startsWith('4')) {
      if (bin.startsWith('451761') || bin.startsWith('450799')) p.bancoDetectado = 'Banco Nación (Visa)';
      else if (bin.startsWith('450601') || bin.startsWith('455002')) p.bancoDetectado = 'Banco Provincia (Visa)';
      else if (bin.startsWith('427562') || bin.startsWith('450903') || bin.startsWith('455500') || bin.startsWith('417309')) p.bancoDetectado = 'Banco Galicia (Visa)';
      else if (bin.startsWith('472825') || bin.startsWith('476507') || bin.startsWith('454775') || bin.startsWith('470564')) p.bancoDetectado = 'BBVA (Visa)';
      else if (bin.startsWith('426211') || bin.startsWith('403478')) p.bancoDetectado = 'Santander (Visa)';
      else if (bin.startsWith('433155') || bin.startsWith('451200')) p.bancoDetectado = 'HSBC (Visa)';
      else if (bin.startsWith('458767') || bin.startsWith('415829') || bin.startsWith('446344')) p.bancoDetectado = 'Macro (Visa)';
      else p.bancoDetectado = 'Visa';
    } else if (num.startsWith('5') || (parseInt(bin) >= 222100 && parseInt(bin) <= 272099)) {
      if (bin.startsWith('515073') || bin.startsWith('525547')) p.bancoDetectado = 'Banco Nación (Mastercard)';
      else if (bin.startsWith('517562') || bin.startsWith('531463')) p.bancoDetectado = 'Banco Galicia (Mastercard)';
      else if (bin.startsWith('546553') || bin.startsWith('525499')) p.bancoDetectado = 'BBVA (Mastercard)';
      else if (bin.startsWith('544407') || bin.startsWith('548510')) p.bancoDetectado = 'Santander (Mastercard)';
      else if (bin.startsWith('531993') || bin.startsWith('536390')) p.bancoDetectado = 'Macro (Mastercard)';
      else if (bin.startsWith('520188')) p.bancoDetectado = 'Credicoop (Mastercard)';
      else p.bancoDetectado = 'Mastercard';
    } else if (num.startsWith('34') || num.startsWith('37')) {
      p.bancoDetectado = 'American Express';
    } else if (bin.startsWith('604244') || bin.startsWith('589657') || bin.startsWith('6042') || bin.startsWith('6043')) {
      p.bancoDetectado = 'Cabal';
    } else if (bin.startsWith('589562')) {
      p.bancoDetectado = 'Tarjeta Naranja';
    } else {
      p.bancoDetectado = '';
    }
  }

  calcularMontoConInteresMultiple(idx: number): void {
    const p = this.pagosMultiplesList[idx];
    const cuotas = p.request.tarjeta_cuotas || 1;
    const interes = p.request.tarjeta_interes || 0;
    p.montoConInteres = p.request.monto * (1 + interes / 100);
  }

  confirmarPagosMultiples(): void {
    // Validaciones
    for (const p of this.pagosMultiplesList) {
      if (!p.request.monto) {
        this.confirmSvc.toast('Completá el monto en cada cobro', 'error');
        return;
      }
      if (p.esTarjeta && (!p.request.tarjeta_numero || !p.request.tarjeta_titular)) {
        this.confirmSvc.toast('Completá los datos de tarjeta en cada cobro que use tarjeta', 'error');
        return;
      }
    }

    const payloadTransformed = this.pagosMultiplesList.map(p => {
      const r: any = {
        id_reserva: Number(p.request.id_reserva) || null,
        id_deuda: Number(p.request.id_deuda) || null,
        id_servicio: Number(p.request.id_servicio) || null,
        id_cliente: Number(p.request.id_cliente) || null,
        tipo: 'COBRO_CLIENTE',
        moneda: p.request.moneda,
        monto: parseFloat(p.request.monto) || 0,
        metodo_pago_id: p.request.metodo_pago_id ? Number(p.request.metodo_pago_id) : null,
        observaciones: p.request.observaciones || ''
      };

      // Si es tarjeta, construir el objeto tarjeta y aplicar interés/cuotas
      if (p.esTarjeta) {
        r.tarjeta = {
          titular: p.request.tarjeta_titular,
          numero: (p.request.tarjeta_numero || '').replace(/\s/g, ''),
          expiracion: p.request.tarjeta_expiracion
        };
        const cuotas = p.request.tarjeta_cuotas || 1;
        const interes = p.request.tarjeta_interes || 0;
        if (interes > 0) {
          r.monto = p.request.monto * (1 + interes / 100);
        }
        if (cuotas > 1) {
          const montoFinal = r.monto || p.request.monto;
          r.observaciones = (r.observaciones || '') +
            ` [${cuotas} cuotas de ${(montoFinal / cuotas).toFixed(2)}${interes > 0 ? ` - ${interes}% interés` : ''}${p.bancoDetectado ? ` - ${p.bancoDetectado}` : ''}]`;
        }
      }

      return r;
    });

    this.api.registrarPagosMultiples(payloadTransformed).subscribe({
      next: () => {
        this.confirmSvc.toast('Pagos múltiples registrados y recibo generado');
        this.cancelarPagoMultiple();
        this.cargarTodo();
      },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al registrar múltiples pagos', 'error')
    });
  }
  // -----------------------------

  resetPagoForm(): void {
    this.pagoForm = {
      tipo: 'COBRO_CLIENTE', moneda: 'ARS', monto: 0, metodo_pago_id: null,
      id_deuda: null, observaciones: '',
      tarjeta_titular: '', tarjeta_numero: '', tarjeta_expiracion: '',
      tarjeta_cuotas: 1, tarjeta_interes: 0,
      id_tarjeta_cliente: null
    };
    this.metodoSeleccionadoEsTarjeta = false;
    this.bancoDetectado = '';
    this.montoConInteres = 0;
  }

  detectarBancoFrontend(): void {
    const num = (this.pagoForm.tarjeta_numero || '').replace(/\s/g, '');
    if (num.length < 6) { this.bancoDetectado = ''; return; }
    const p = num.substring(0, 6);
    if (num.startsWith('4')) {
      if (p.startsWith('451761') || p.startsWith('450799')) this.bancoDetectado = 'Banco Nación (Visa)';
      else if (p.startsWith('450601') || p.startsWith('455002')) this.bancoDetectado = 'Banco Provincia (Visa)';
      else if (p.startsWith('427562') || p.startsWith('450903') || p.startsWith('455500') || p.startsWith('417309')) this.bancoDetectado = 'Banco Galicia (Visa)';
      else if (p.startsWith('472825') || p.startsWith('476507') || p.startsWith('454775') || p.startsWith('470564')) this.bancoDetectado = 'BBVA (Visa)';
      else if (p.startsWith('426211') || p.startsWith('403478') || p.startsWith('450601')) this.bancoDetectado = 'Santander (Visa)';
      else if (p.startsWith('433155') || p.startsWith('451200')) this.bancoDetectado = 'HSBC (Visa)';
      else if (p.startsWith('458767') || p.startsWith('415829') || p.startsWith('446344')) this.bancoDetectado = 'Macro (Visa)';
      else this.bancoDetectado = 'Visa';
    } else if (num.startsWith('5') || (parseInt(p) >= 222100 && parseInt(p) <= 272099)) {
      if (p.startsWith('515073') || p.startsWith('525547')) this.bancoDetectado = 'Banco Nación (Mastercard)';
      else if (p.startsWith('517562') || p.startsWith('531463')) this.bancoDetectado = 'Banco Galicia (Mastercard)';
      else if (p.startsWith('546553') || p.startsWith('525499')) this.bancoDetectado = 'BBVA (Mastercard)';
      else if (p.startsWith('544407') || p.startsWith('548510')) this.bancoDetectado = 'Santander (Mastercard)';
      else if (p.startsWith('531993') || p.startsWith('536390')) this.bancoDetectado = 'Macro (Mastercard)';
      else if (p.startsWith('520188')) this.bancoDetectado = 'Credicoop (Mastercard)';
      else this.bancoDetectado = 'Mastercard';
    } else if (num.startsWith('34') || num.startsWith('37')) {
      this.bancoDetectado = 'American Express';
    } else if (p.startsWith('604244') || p.startsWith('589657') || p.startsWith('6042') || p.startsWith('6043')) {
      this.bancoDetectado = 'Cabal';
    } else if (p.startsWith('589562') || p.startsWith('546553')) {
      this.bancoDetectado = 'Tarjeta Naranja';
    } else {
      this.bancoDetectado = '';
    }
  }

  calcularMontoConInteres(): void {
    const cuotas = this.pagoForm.tarjeta_cuotas || 1;
    const interes = this.pagoForm.tarjeta_interes || 0;
    this.montoConInteres = this.pagoForm.monto * (1 + interes / 100);
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
      // Si hay cuotas e interés, actualizar monto y agregar info a observaciones
      const cuotas = this.pagoForm.tarjeta_cuotas || 1;
      const interes = this.pagoForm.tarjeta_interes || 0;
      if (interes > 0) {
        payload.monto = this.pagoForm.monto * (1 + interes / 100);
      }
      if (cuotas > 1) {
        const montoFinal = payload.monto || this.pagoForm.monto;
        payload.observaciones = (payload.observaciones || '') +
          ` [${cuotas} cuotas de ${(montoFinal / cuotas).toFixed(2)}${interes > 0 ? ` - ${interes}% interés` : ''}${this.bancoDetectado ? ` - ${this.bancoDetectado}` : ''}]`;
      }
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

  formatDateTime(fecha: string): string {
    const d = new Date(fecha);
    const date = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }

  /** Converts ISO timestamp to datetime-local input format (YYYY-MM-DDTHH:MM) */
  private toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  isUrgente(): boolean {
    if (!this.reserva?.fecha_limite_pago) return false;
    return new Date(this.reserva.fecha_limite_pago).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
  }

  descargarReciboPDF(id: number): void {
    this.reciboPdf.generarReciboPDF(id).catch(err => console.error('Error generando PDF:', err));
  }

  guardarIncidencia(): void {
    if (!this.incidenciaForm.descripcion) return;
    this.api.crearIncidencia({
      id_reserva: this.idReserva,
      descripcion: this.incidenciaForm.descripcion,
      estado_gestion: this.incidenciaForm.estado_gestion
    }).subscribe({
      next: () => {
        this.mostrarFormIncidencia = false;
        this.incidenciaForm = { descripcion: '', estado_gestion: 'PENDIENTE' };
        this.cargarTodo();
      },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al guardar', 'error')
    });
  }

  async eliminarIncidencia(id: number): Promise<void> {
    const ok = await this.confirmSvc.confirm({
      title: 'Eliminar Incidencia',
      message: '¿Eliminar esta incidencia?',
      confirmText: 'Sí, eliminar',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteIncidencia(id).subscribe({
      next: () => { this.confirmSvc.toast('Incidencia eliminada'); this.cargarTodo(); },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }

  resetItemForm(): void {
    this.itemForm = {
      tipo_item: 'EXCURSION', nombre_item: '', detalles_servicio: '',
      fecha_servicio: '', proveedor_local: '', nro_poliza_o_voucher: '',
      telefono_soporte: '', contacto_local_nombre: ''
    };
    this.editandoItemId = null;
    this.mostrarFormItem = false;
  }

  guardarItem(): void {
    if (!this.itemForm.nombre_item) return;
    const payload = { ...this.itemForm, id_reserva: this.idReserva };

    const obs = this.editandoItemId
      ? this.api.updateItem(this.editandoItemId, payload)
      : this.api.crearItem(payload);

    obs.subscribe({
      next: () => { this.resetItemForm(); this.cargarTodo(); },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al guardar', 'error')
    });
  }

  editarItem(item: any): void {
    this.editandoItemId = item.id;
    this.itemForm = {
      tipo_item: item.tipo_item || 'EXCURSION',
      nombre_item: item.nombre_item || '',
      detalles_servicio: item.detalles_servicio || '',
      fecha_servicio: item.fecha_servicio ? item.fecha_servicio.substring(0, 10) : '',
      proveedor_local: item.proveedor_local || '',
      nro_poliza_o_voucher: item.nro_poliza_o_voucher || '',
      telefono_soporte: item.telefono_soporte || '',
      contacto_local_nombre: item.contacto_local_nombre || ''
    };
    this.mostrarFormItem = true;
  }

  async eliminarItem(id: number): Promise<void> {
    const ok = await this.confirmSvc.confirm({
      title: 'Eliminar Voucher',
      message: '¿Eliminar este voucher/item?',
      confirmText: 'Sí, eliminar',
      type: 'danger'
    });
    if (!ok) return;
    this.api.deleteItem(id).subscribe({
      next: () => { this.confirmSvc.toast('Voucher eliminado'); this.cargarTodo(); },
      error: (err) => this.confirmSvc.toast(err.error?.error || 'Error al eliminar', 'error')
    });
  }
}
