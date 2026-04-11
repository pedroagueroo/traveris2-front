import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../models';
import { DniMaskDirective } from '../../directives';

interface ClienteForm {
  nombre_completo: string;
  dni_pasaporte: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string | null;
  cuit_cuil: string;
  nacionalidad: string;
  sexo: string;
  pref_asiento: string;
  pref_comida: string;
  pasaporte_nro: string;
  pasaporte_emision: string | null;
  pasaporte_vencimiento: string | null;
  observaciones_salud: string;
}

@Component({
  selector: 'app-cliente-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule, DniMaskDirective],
  template: `
    <div class="animate-fadeInUp">
      <div class="page-header">
        <h1 class="page-title">{{ editando ? 'Editar Cliente' : 'Nuevo Cliente' }}</h1>
      </div>
      <div class="glass-card-solid">
        <form (ngSubmit)="guardar()">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label-elite">Nombre Completo *</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="cliente.nombre_completo" name="nombre" required />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">DNI / Pasaporte</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="cliente.dni_pasaporte" name="dni" appDniMask />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">CUIT / CUIL</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="cliente.cuit_cuil" name="cuit" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Email</label>
              <input type="email" class="form-control-elite w-100" [(ngModel)]="cliente.email" name="email" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Teléfono</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="cliente.telefono" name="telefono" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Fecha de Nacimiento</label>
              <input type="date" class="form-control-elite w-100" [(ngModel)]="cliente.fecha_nacimiento" name="nacimiento" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Nacionalidad</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="cliente.nacionalidad" name="nacionalidad" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Sexo</label>
              <select class="form-select-elite w-100" [(ngModel)]="cliente.sexo" name="sexo">
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="X">No binario</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Pref. Asiento</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="cliente.pref_asiento" name="asiento" />
            </div>
            <div class="col-md-3">
              <label class="form-label-elite">Pref. Comida</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="cliente.pref_comida" name="comida" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Pasaporte Nro</label>
              <input type="text" class="form-control-elite w-100" [(ngModel)]="cliente.pasaporte_nro" name="pasaporte" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Pasaporte Emisión</label>
              <input type="date" class="form-control-elite w-100" [(ngModel)]="cliente.pasaporte_emision" name="pEmision" />
            </div>
            <div class="col-md-4">
              <label class="form-label-elite">Pasaporte Vencimiento</label>
              <input type="date" class="form-control-elite w-100" [(ngModel)]="cliente.pasaporte_vencimiento" name="pVenc" />
            </div>
            <div class="col-12">
              <label class="form-label-elite">Observaciones de Salud</label>
              <textarea class="form-control-elite w-100" [(ngModel)]="cliente.observaciones_salud" name="salud" rows="2"></textarea>
            </div>
          </div>
          <div class="d-flex gap-2 mt-4">
            <button type="submit" class="btn-elite" [disabled]="guardando">
              <span>{{ guardando ? 'Guardando...' : 'Guardar Cliente' }}</span>
            </button>
            <button type="button" class="btn-elite-outline" (click)="volver()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ClienteNuevoComponent {
  cliente: ClienteForm = {
    nombre_completo: '', dni_pasaporte: '', email: '', telefono: '',
    fecha_nacimiento: null, cuit_cuil: '', nacionalidad: '', sexo: '',
    pref_asiento: '', pref_comida: '', pasaporte_nro: '',
    pasaporte_emision: null, pasaporte_vencimiento: null, observaciones_salud: ''
  };
  editando = false;
  guardando = false;

  constructor(private api: ApiService, private router: Router) {}

  guardar(): void {
    if (!this.cliente.nombre_completo) return;
    this.guardando = true;
    this.api.crearCliente(this.cliente as Partial<Cliente>).subscribe({
      next: (c) => this.router.navigate(['/clientes/detalle', c.id]),
      error: () => this.guardando = false
    });
  }

  volver(): void {
    this.router.navigate(['/clientes']);
  }
}
