import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente, Reserva } from '../../models';

interface PasajeroForm {
  id_cliente: number | null;
  es_titular: boolean;
  nombre_completo?: string;
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
              <div class="d-flex gap-1">
                <div class="search-select-wrapper w-100">
                  <input class="form-control-elite w-100" placeholder="🔍 Buscar cliente por nombre..."
                    [(ngModel)]="busquedaTitular" name="busq_titular"
                    (focus)="titularDropdownOpen = true"
                    (input)="titularDropdownOpen = true" />
                  @if (form.id_titular && !titularDropdownOpen) {
                    <div class="selected-badge" (click)="titularDropdownOpen = true; busquedaTitular = ''">
                      {{ getNombreCliente(form.id_titular) }}
                      <span class="clear-badge" (click)="form.id_titular = null; busquedaTitular = ''; $event.stopPropagation()">✕</span>
                    </div>
                  }
                  @if (titularDropdownOpen) {
                    <div class="search-dropdown">
                      @for (c of clientesFiltrados(busquedaTitular); track c.id) {
                        <div class="search-dropdown-item" (mousedown)="seleccionarTitular(c)">
                          <span class="fw-semibold">{{ c.nombre_completo }}</span>
                          <span class="text-muted" style="font-size:0.75rem;">{{ c.dni_pasaporte || '' }}</span>
                        </div>
                      } @empty {
                        <div class="search-dropdown-empty">Sin resultados</div>
                      }
                    </div>
                  }
                </div>
                <button type="button" class="btn-elite-outline" style="padding:0.3rem 0.6rem;font-size:0.75rem;white-space:nowrap;"
                  (click)="mostrarFormClienteRapido = 'titular'" title="Crear cliente nuevo">➕</button>
              </div>
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

        <!-- MINI FORM CLIENTE RÁPIDO (para titular) -->
        @if (mostrarFormClienteRapido === 'titular') {
          <div class="glass-card-solid mb-3" style="border: 1px dashed var(--primary);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold mb-0" style="color:var(--primary);">➕ Crear Cliente Rápido (Titular)</h6>
              <button type="button" class="btn-remove" (click)="mostrarFormClienteRapido = null">✕</button>
            </div>
            <div class="row g-2">
              <div class="col-md-4"><input class="form-control-elite w-100" placeholder="Nombre completo *" [(ngModel)]="clienteRapido.nombre_completo" name="cr_nombre" /></div>
              <div class="col-md-3"><input class="form-control-elite w-100" placeholder="DNI / Pasaporte" [(ngModel)]="clienteRapido.dni_pasaporte" name="cr_dni" /></div>
              <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Email" [(ngModel)]="clienteRapido.email" name="cr_email" /></div>
              <div class="col-md-2 d-flex align-items-end">
                <button type="button" class="btn-elite w-100" style="font-size:0.8rem;" (click)="crearClienteRapido('titular')"><span>Crear y Asignar</span></button>
              </div>
            </div>
          </div>
        }

        <!-- PASAJEROS -->
        <div class="glass-card-solid mb-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="section-title mb-0">👥 Pasajeros ({{ pasajeros.length }})</h5>
            <div class="d-flex gap-1">
              <button type="button" class="btn-elite-outline" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" (click)="agregarPasajero()">
                ➕ Agregar
              </button>
              <button type="button" class="btn-elite-outline" style="padding: 0.35rem 0.6rem; font-size: 0.75rem;"
                (click)="mostrarFormClienteRapido = 'pasajero'" title="Crear pasajero nuevo">👤➕</button>
            </div>
          </div>

          @for (p of pasajeros; track $index; let i = $index) {
            <div class="pasajero-row">
              <div class="search-select-wrapper" style="flex: 1;">
                <input class="form-control-elite w-100" placeholder="🔍 Buscar pasajero..."
                  [(ngModel)]="busquedasPasajeros[i]" [name]="'busq_pas_' + i"
                  (focus)="pasajeroDropdowns[i] = true"
                  (input)="pasajeroDropdowns[i] = true" />
                @if (p.id_cliente && !pasajeroDropdowns[i]) {
                  <div class="selected-badge" (click)="pasajeroDropdowns[i] = true; busquedasPasajeros[i] = ''">
                    {{ getNombreCliente(p.id_cliente) }}
                    <span class="clear-badge" (click)="p.id_cliente = null; busquedasPasajeros[i] = ''; $event.stopPropagation()">✕</span>
                  </div>
                }
                @if (pasajeroDropdowns[i]) {
                  <div class="search-dropdown">
                    @for (c of clientesFiltrados(busquedasPasajeros[i]); track c.id) {
                      <div class="search-dropdown-item" (mousedown)="seleccionarPasajero(i, c)">
                        <span class="fw-semibold">{{ c.nombre_completo }}</span>
                        <span class="text-muted" style="font-size:0.75rem;">{{ c.dni_pasaporte || '' }}</span>
                      </div>
                    } @empty {
                      <div class="search-dropdown-empty">Sin resultados</div>
                    }
                  </div>
                }
              </div>
              <button type="button" class="btn-remove" (click)="removerPasajero(i)" title="Quitar">✕</button>
            </div>
          }

          @if (pasajeros.length === 0) {
            <p style="color: var(--text-muted); font-size: 0.85rem;">
              El titular se agrega automáticamente. Añadí pasajeros adicionales si los hay.
            </p>
          }
        </div>

        <!-- MINI FORM CLIENTE RÁPIDO (para pasajero) -->
        @if (mostrarFormClienteRapido === 'pasajero') {
          <div class="glass-card-solid mb-3" style="border: 1px dashed var(--primary);">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold mb-0" style="color:var(--primary);">➕ Crear Cliente Rápido (Pasajero)</h6>
              <button type="button" class="btn-remove" (click)="mostrarFormClienteRapido = null">✕</button>
            </div>
            <div class="row g-2">
              <div class="col-md-4"><input class="form-control-elite w-100" placeholder="Nombre completo *" [(ngModel)]="clienteRapido.nombre_completo" name="crp_nombre" /></div>
              <div class="col-md-3"><input class="form-control-elite w-100" placeholder="DNI / Pasaporte" [(ngModel)]="clienteRapido.dni_pasaporte" name="crp_dni" /></div>
              <div class="col-md-3"><input class="form-control-elite w-100" placeholder="Email" [(ngModel)]="clienteRapido.email" name="crp_email" /></div>
              <div class="col-md-2 d-flex align-items-end">
                <button type="button" class="btn-elite w-100" style="font-size:0.8rem;" (click)="crearClienteRapido('pasajero')"><span>Crear y Agregar</span></button>
              </div>
            </div>
          </div>
        }

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
    .section-title { font-weight: 700; font-size: 1rem; margin-bottom: 1rem; }
    .pasajero-row {
      display: flex; align-items: center; gap: 0.75rem;
      margin-bottom: 0.5rem; padding: 0.5rem;
      background: var(--bg-secondary); border-radius: 10px;
    }
    .btn-remove {
      background: rgba(239, 68, 68, 0.1); border: none; color: var(--danger);
      border-radius: 8px; width: 30px; height: 30px; cursor: pointer;
      font-size: 0.8rem; transition: var(--transition);
    }
    .btn-remove:hover { background: rgba(239, 68, 68, 0.2); }

    /* Search-select dropdown */
    .search-select-wrapper { position: relative; }
    .search-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
      background: var(--glass-bg); backdrop-filter: blur(12px);
      border: 1px solid var(--border-light); border-radius: 10px;
      max-height: 200px; overflow-y: auto; box-shadow: var(--shadow-float);
      margin-top: 2px;
    }
    .search-dropdown-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.85rem;
      transition: background 0.15s;
    }
    .search-dropdown-item:hover { background: rgba(var(--primary-rgb), 0.08); }
    .search-dropdown-empty {
      padding: 0.75rem; text-align: center; font-size: 0.8rem; color: var(--text-muted);
    }
    .selected-badge {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 0.75rem; background: var(--bg-secondary); border-radius: 10px;
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
      border: 1px solid rgba(var(--primary-rgb), 0.2);
    }
    .clear-badge {
      color: var(--danger); font-size: 0.7rem; cursor: pointer;
      padding: 2px 6px; border-radius: 50%;
    }
    .clear-badge:hover { background: rgba(239,68,68,0.1); }
  `]
})
export class ReservaNuevaComponent implements OnInit {
  clientes: Partial<Cliente>[] = [];
  editando = false;
  reservaId: number | null = null;
  guardando = false;

  // Search states
  busquedaTitular = '';
  titularDropdownOpen = false;
  busquedasPasajeros: string[] = [];
  pasajeroDropdowns: boolean[] = [];

  // Quick client creation
  mostrarFormClienteRapido: 'titular' | 'pasajero' | null = null;
  clienteRapido = { nombre_completo: '', dni_pasaporte: '', email: '' };

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

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.api.getTodosClientes().subscribe({ next: (c) => this.clientes = c });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editando = true;
      this.reservaId = parseInt(id, 10);
      this.cargarReserva();
    }

    // Close dropdowns on click outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-select-wrapper')) {
        this.titularDropdownOpen = false;
        this.pasajeroDropdowns = this.pasajeroDropdowns.map(() => false);
      }
    });
  }

  cargarReserva(): void {
    if (!this.reservaId) return;
    this.api.getReserva(this.reservaId).subscribe({
      next: (r) => {
        this.form = {
          id_titular: r.id_titular,
          destino_final: r.destino_final || '',
          fecha_viaje_salida: r.fecha_viaje_salida ? r.fecha_viaje_salida.substring(0, 10) : '',
          fecha_viaje_regreso: r.fecha_viaje_regreso ? r.fecha_viaje_regreso.substring(0, 10) : '',
          fecha_limite_pago: r.fecha_limite_pago ? r.fecha_limite_pago.substring(0, 10) : '',
          estado: r.estado,
          operador_mayorista: r.operador_mayorista || '',
          nro_expediente_operador: r.nro_expediente_operador || '',
          observaciones_internas: r.observaciones_internas || ''
        };
        this.pasajeros = (r.pasajeros || [])
          .filter((p: any) => !p.es_titular)
          .map((p: any) => ({ id_cliente: p.id_cliente, es_titular: false, nombre_completo: p.nombre_completo }));
        this.busquedasPasajeros = this.pasajeros.map(() => '');
        this.pasajeroDropdowns = this.pasajeros.map(() => false);
      }
    });
  }

  clientesFiltrados(busqueda: string): Partial<Cliente>[] {
    if (!busqueda || busqueda.length < 1) return this.clientes.slice(0, 20);
    const term = busqueda.toLowerCase();
    return this.clientes.filter(c =>
      (c.nombre_completo || '').toLowerCase().includes(term) ||
      (c.dni_pasaporte || '').toLowerCase().includes(term)
    ).slice(0, 15);
  }

  getNombreCliente(id: number): string {
    const c = this.clientes.find(cl => cl.id === id);
    return c ? `${c.nombre_completo} — ${c.dni_pasaporte || ''}` : `Cliente #${id}`;
  }

  seleccionarTitular(c: Partial<Cliente>): void {
    this.form.id_titular = c.id!;
    this.busquedaTitular = '';
    this.titularDropdownOpen = false;
  }

  seleccionarPasajero(index: number, c: Partial<Cliente>): void {
    this.pasajeros[index].id_cliente = c.id!;
    this.busquedasPasajeros[index] = '';
    this.pasajeroDropdowns[index] = false;
  }

  agregarPasajero(): void {
    this.pasajeros.push({ id_cliente: null, es_titular: false });
    this.busquedasPasajeros.push('');
    this.pasajeroDropdowns.push(false);
  }

  removerPasajero(index: number): void {
    this.pasajeros.splice(index, 1);
    this.busquedasPasajeros.splice(index, 1);
    this.pasajeroDropdowns.splice(index, 1);
  }

  crearClienteRapido(target: 'titular' | 'pasajero'): void {
    if (!this.clienteRapido.nombre_completo) return;
    this.api.crearCliente(this.clienteRapido as any).subscribe({
      next: (nuevo: any) => {
        // Reload clients list
        this.api.getTodosClientes().subscribe({
          next: (c) => {
            this.clientes = c;
            if (target === 'titular') {
              this.form.id_titular = nuevo.id;
            } else {
              this.pasajeros.push({ id_cliente: nuevo.id, es_titular: false });
              this.busquedasPasajeros.push('');
              this.pasajeroDropdowns.push(false);
            }
          }
        });
        this.mostrarFormClienteRapido = null;
        this.clienteRapido = { nombre_completo: '', dni_pasaporte: '', email: '' };
      }
    });
  }

  guardar(): void {
    if (!this.form.id_titular) return;
    this.guardando = true;

    // Sanitize: empty strings → null for backend
    const cleanForm: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(this.form)) {
      cleanForm[key] = (typeof val === 'string' && val.trim() === '') ? null : val;
    }

    // Build pasajeros list — include titular
    const pasajerosLimpios = this.pasajeros
      .filter(p => p.id_cliente)
      .map(p => ({ id_cliente: p.id_cliente!, es_titular: false }));

    // Add titular as pasajero if not in list
    if (!pasajerosLimpios.some(p => p.id_cliente === this.form.id_titular)) {
      pasajerosLimpios.unshift({ id_cliente: this.form.id_titular!, es_titular: true });
    }

    const data: Record<string, unknown> = {
      ...cleanForm,
      pasajeros: pasajerosLimpios
    };

    const obs = this.editando && this.reservaId
      ? this.api.updateReserva(this.reservaId, data as Partial<Reserva>)
      : this.api.crearReserva(data as Partial<Reserva>);

    obs.subscribe({
      next: (r) => {
        const id = this.editando ? this.reservaId : r.id;
        this.router.navigate(['/reservas', id]);
      },
      error: (err) => {
        console.error('Error guardando reserva:', err);
        this.guardando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/reservas']);
  }
}
