import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente, Proveedor, Vuelo, Reserva } from '../../models';

interface PasajeroForm {
  id_cliente: number | null;
  es_titular: boolean;
  nombre_completo?: string;
}

interface VueloForm {
  aerolinea: string;
  nro_vuelo: string;
  origen: string;
  destino: string;
  fecha_salida: string;
  fecha_llegada: string;
  clase: string;
  codigo_reserva: string;
  observaciones: string;
}

@Component({
  selector: 'app-reserva-nueva',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <h1 class="page-title">{{ editando ? 'Editar Reserva #' + reservaId : 'Nueva Reserva' }}</h1>
        <button class="btn-elite-outline" (click)="volver()">← Volver</button>
      </div>

      <form (ngSubmit)="guardar()">
        <!-- DATOS GENERALES -->
        <div class="glass-card-solid mb-3">
          <h5 class="section-title">📋 Datos Generales</h5>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label-elite">Titular *</label>
              <select class="form-select-elite w-100" [(ngModel)]="form.id_titular" name="titular" required>
                <option [ngValue]="null">Seleccionar cliente...</option>
                @for (c of clientes; track c.id) {
                  <option [ngValue]="c.id">{{ c.nombre_completo }} — {{ c.dni_pasaporte || 'Sin DNI' }}</option>
                }
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label-elite">Destino Final</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="form.destino_final" name="destino" placeholder="Ej: Cancún, México" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Fecha Salida</label>
              <input type="date" class="form-control-elite w-100" [(ngModel)]="form.fecha_viaje_salida" name="salida" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Fecha Regreso</label>
              <input type="date" class="form-control-elite w-100" [(ngModel)]="form.fecha_viaje_regreso" name="regreso" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Fecha Límite Pago</label>
              <input type="date" class="form-control-elite w-100" [(ngModel)]="form.fecha_limite_pago" name="limite" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Estado</label>
              <select class="form-select-elite w-100" [(ngModel)]="form.estado" name="estado">
                <option value="ABIERTO">Abierto</option>
                <option value="CERRADO">Cerrado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label-elite">Operador Mayorista</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="form.operador_mayorista" name="operador" />
            </div>
            <div class="col-md-6">
              <label class="form-label-elite">Nro Expediente Operador</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="form.nro_expediente_operador" name="expediente" />
            </div>
            <div class="col-12">
              <label class="form-label-elite">Observaciones Internas</label>
              <textarea class="form-control-elite w-100" [(ngModel)]="form.observaciones_internas" name="obs" rows="2"></textarea>
            </div>
          </div>
        </div>

        <!-- PASAJEROS -->
        <div class="glass-card-solid mb-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="section-title mb-0">👥 Pasajeros ({{ pasajeros.length }})</h5>
            <button type="button" class="btn-elite-outline" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" (click)="agregarPasajero()">
              ➕ Agregar
            </button>
          </div>

          @for (p of pasajeros; track $index; let i = $index) {
            <div class="pasajero-row">
              <select class="form-select-elite" style="flex: 1;" [(ngModel)]="p.id_cliente" [name]="'pasajero_' + i">
                <option [ngValue]="null">Seleccionar pasajero...</option>
                @for (c of clientes; track c.id) {
                  <option [ngValue]="c.id">{{ c.nombre_completo }}</option>
                }
              </select>
              <label class="form-check-label titular-check">
                <input type="checkbox" [(ngModel)]="p.es_titular" [name]="'titular_' + i" class="form-check-input" />
                Titular
              </label>
              <button type="button" class="btn-remove" (click)="removerPasajero(i)" title="Quitar">✕</button>
            </div>
          }

          @if (pasajeros.length === 0) {
            <p style="color: var(--text-muted); font-size: 0.85rem;">
              El titular se agrega automáticamente. Añadí pasajeros adicionales si los hay.
            </p>
          }
        </div>

        <!-- VUELOS -->
        <div class="glass-card-solid mb-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="section-title mb-0">✈️ Vuelos ({{ vuelos.length }})</h5>
            <button type="button" class="btn-elite-outline" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" (click)="agregarVuelo()">
              ➕ Agregar Vuelo
            </button>
          </div>

          @for (v of vuelos; track $index; let idx = $index) {
            <div class="vuelo-card mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span style="font-weight: 600; font-size: 0.85rem; color: var(--primary);">Vuelo {{ idx + 1 }}</span>
                <button type="button" class="btn-remove" (click)="removerVuelo(idx)">✕</button>
              </div>
              <div class="row g-2">
                <div class="col-md-3">
                  <input class="form-control-elite w-100" placeholder="Aerolínea" [(ngModel)]="v.aerolinea" [name]="'v_aero_' + idx" />
                </div>
                <div class="col-md-3">
                  <input class="form-control-elite w-100" placeholder="Nro Vuelo" [(ngModel)]="v.nro_vuelo" [name]="'v_nro_' + idx" />
                </div>
                <div class="col-md-3">
                  <input class="form-control-elite w-100" placeholder="Origen" [(ngModel)]="v.origen" [name]="'v_orig_' + idx" />
                </div>
                <div class="col-md-3">
                  <input class="form-control-elite w-100" placeholder="Destino" [(ngModel)]="v.destino" [name]="'v_dest_' + idx" />
                </div>
                <div class="col-md-3">
                  <label style="font-size: 0.7rem; color: var(--text-muted);">Salida</label>
                  <input type="datetime-local" class="form-control-elite w-100" [(ngModel)]="v.fecha_salida" [name]="'v_sal_' + idx" />
                </div>
                <div class="col-md-3">
                  <label style="font-size: 0.7rem; color: var(--text-muted);">Llegada</label>
                  <input type="datetime-local" class="form-control-elite w-100" [(ngModel)]="v.fecha_llegada" [name]="'v_lleg_' + idx" />
                </div>
                <div class="col-md-3">
                  <input class="form-control-elite w-100" placeholder="Clase" [(ngModel)]="v.clase" [name]="'v_clase_' + idx" />
                </div>
                <div class="col-md-3">
                  <input class="form-control-elite w-100" placeholder="Código Reserva" [(ngModel)]="v.codigo_reserva" [name]="'v_cod_' + idx" />
                </div>
              </div>
            </div>
          }
        </div>

        <!-- ACCIONES -->
        <div class="d-flex gap-2">
          <button type="submit" class="btn-elite" [disabled]="guardando">
            <span>{{ guardando ? 'Guardando...' : (editando ? 'Actualizar Reserva' : 'Crear Reserva') }}</span>
          </button>
          <button type="button" class="btn-elite-outline" (click)="volver()">Cancelar</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .section-title {
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .pasajero-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      background: var(--bg-secondary);
      border-radius: 10px;
    }
    .titular-check {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .btn-remove {
      background: rgba(239, 68, 68, 0.1);
      border: none;
      color: var(--danger);
      border-radius: 8px;
      width: 30px;
      height: 30px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: var(--transition);
    }
    .btn-remove:hover {
      background: rgba(239, 68, 68, 0.2);
    }
    .vuelo-card {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid var(--border-light);
    }
  `]
})
export class ReservaNuevaComponent implements OnInit {
  clientes: Partial<Cliente>[] = [];
  editando = false;
  reservaId: number | null = null;
  guardando = false;

  form = {
    id_titular: null as number | null,
    destino_final: '',
    fecha_viaje_salida: '',
    fecha_viaje_regreso: '',
    fecha_limite_pago: '',
    estado: 'ABIERTO',
    operador_mayorista: '',
    nro_expediente_operador: '',
    observaciones_internas: ''
  };

  pasajeros: PasajeroForm[] = [];
  vuelos: VueloForm[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Cargar clientes para selectores
    this.api.getTodosClientes().subscribe({
      next: (c) => this.clientes = c
    });

    // Verificar si es edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editando = true;
      this.reservaId = parseInt(id, 10);
      this.cargarReserva();
    }
  }

  cargarReserva(): void {
    if (!this.reservaId) return;
    this.api.getReserva(this.reservaId).subscribe({
      next: (r) => {
        this.form = {
          id_titular: r.id_titular,
          destino_final: r.destino_final || '',
          fecha_viaje_salida: r.fecha_viaje_salida || '',
          fecha_viaje_regreso: r.fecha_viaje_regreso || '',
          fecha_limite_pago: r.fecha_limite_pago || '',
          estado: r.estado,
          operador_mayorista: r.operador_mayorista || '',
          nro_expediente_operador: r.nro_expediente_operador || '',
          observaciones_internas: r.observaciones_internas || ''
        };
        this.pasajeros = (r.pasajeros || []).map(p => ({
          id_cliente: p.id_cliente,
          es_titular: p.es_titular,
          nombre_completo: p.nombre_completo
        }));
        this.vuelos = (r.vuelos || []).map(v => ({
          aerolinea: v.aerolinea || '',
          nro_vuelo: v.nro_vuelo || '',
          origen: v.origen || '',
          destino: v.destino || '',
          fecha_salida: v.fecha_salida || '',
          fecha_llegada: v.fecha_llegada || '',
          clase: v.clase || '',
          codigo_reserva: v.codigo_reserva || '',
          observaciones: v.observaciones || ''
        }));
      }
    });
  }

  agregarPasajero(): void {
    this.pasajeros.push({ id_cliente: null, es_titular: false });
  }

  removerPasajero(index: number): void {
    this.pasajeros.splice(index, 1);
  }

  agregarVuelo(): void {
    this.vuelos.push({
      aerolinea: '', nro_vuelo: '', origen: '', destino: '',
      fecha_salida: '', fecha_llegada: '', clase: '', codigo_reserva: '', observaciones: ''
    });
  }

  removerVuelo(index: number): void {
    this.vuelos.splice(index, 1);
  }

  guardar(): void {
    if (!this.form.id_titular) return;
    this.guardando = true;

    const data: Record<string, unknown> = {
      ...this.form,
      pasajeros: this.pasajeros.filter(p => p.id_cliente),
      vuelos: this.vuelos.filter(v => v.aerolinea || v.nro_vuelo)
    };

    const obs = this.editando && this.reservaId
      ? this.api.updateReserva(this.reservaId, data as Partial<Reserva>)
      : this.api.crearReserva(data as Partial<Reserva>);

    obs.subscribe({
      next: (r) => {
        const id = this.editando ? this.reservaId : r.id;
        this.router.navigate(['/reservas', id]);
      },
      error: () => this.guardando = false
    });
  }

  volver(): void {
    this.router.navigate(['/reservas']);
  }
}
